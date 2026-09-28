import { NextRequest, NextResponse } from 'next/server';
import type { Theorem } from '@/src/types/theorem';

// Search runs in the TheoremSearch API (/graph/embedding over the v2
// database), so the website, the public API and MCP share one implementation.
// Override with THEOREM_SEARCH_API_URL to test against a local API.
const UPSTREAM = process.env.THEOREM_SEARCH_API_URL ?? 'https://api.theoremsearch.com';
const UPSTREAM_TIMEOUT_MS = 30_000;

// What the site calls "results": the default when no result type is picked.
const DEFAULT_TYPES = ['theorem', 'lemma', 'proposition', 'corollary'];
// Lean declarations only distinguish theorems (all of which the formal
// ingester stores as 'theorem' or 'thm'), so any theorem-like type selects them.
const THEOREM_LIKE = new Set(DEFAULT_TYPES);
const FORMAL_THEOREM_KINDS = ['theorem', 'thm'];

type Formality = 'informal' | 'formal' | 'both';

interface SearchFilters {
  sources?: string[];
  types?: string[];
  authors?: string[];
  categories?: string[];
  publicationStatus?: string[];
  formality?: Formality;
  yearMin?: number;
  yearMax?: number;
  topK?: number;
  citationMin?: number;
  citationMax?: number;
  includeUnknownCitations?: boolean;
  paperFilter?: string;
}

function kindFilter(types: string[], formality: Formality): string[] {
  const kinds = new Set(types.length ? types : DEFAULT_TYPES);
  if (formality !== 'informal' && [...kinds].some(t => THEOREM_LIKE.has(t))) {
    FORMAL_THEOREM_KINDS.forEach(k => kinds.add(k));
  }
  return [...kinds];
}

function buildUpstreamUrl(query: string, f: SearchFilters): URL {
  const url = new URL(`${UPSTREAM}/graph/embedding`);
  const q = url.searchParams;
  const formality = f.formality ?? 'informal';

  q.set('query', query);
  q.set('n_results', String(Math.min(Math.max(f.topK ?? 20, 1), 100)));
  q.set('formality', formality);
  f.sources?.forEach(s => q.append('sources', s));
  kindFilter(f.types ?? [], formality).forEach(t => q.append('types', t));
  f.authors?.forEach(a => q.append('authors', a));
  f.categories?.forEach(c => q.append('categories', c));

  const pub = f.publicationStatus ?? [];
  if (pub.length === 1) q.set('in_journal', String(pub[0] === 'Published'));

  if (f.yearMin != null) q.set('year_min', String(f.yearMin));
  if (f.yearMax != null) q.set('year_max', String(f.yearMax));

  if (f.citationMin != null && f.citationMin > 0) q.set('min_citations', String(f.citationMin));
  if (f.citationMax != null) q.set('citation_max', String(f.citationMax));
  q.set('include_unknown_citations', String(f.includeUnknownCitations !== false));

  if (f.paperFilter?.trim()) q.set('paper_filter', f.paperFilter.trim());
  return url;
}

interface UpstreamResult {
  statement_id: string;
  name?: string;
  kind?: string;
  formality?: string;
  body?: string;
  slogan?: string;
  source?: string;
  title?: string;
  authors?: string[];
  url?: string;
  categories?: string[];
  year?: number;
  journal_ref?: string | null;
  citation_count?: number | null;
  similarity: number;
  score: number;
}

function toTheorem(r: UpstreamResult): Theorem {
  return {
    statement_id: r.statement_id,
    theorem_name: r.name ?? '',
    theorem_body: r.body ?? '',
    theorem_slogan: r.slogan ?? '',
    theorem_type: r.kind ?? '',
    formality: r.formality,
    title: r.title ?? '',
    authors: r.authors ?? [],
    source: r.source ?? '',
    link: r.url ?? '',
    year: r.year,
    primary_category: r.categories?.[0],
    citations: r.citation_count ?? null,
    // Only arXiv carries publication metadata; elsewhere the status is unknown.
    journal_published: r.source === 'arXiv' ? r.journal_ref != null : null,
    similarity: r.similarity,
    score: r.score,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query, filters = {} }: { query: string; filters: SearchFilters } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    if (filters.sources && !filters.sources.length) {
      return NextResponse.json({ results: [] });
    }

    const r = await fetch(buildUpstreamUrl(query.trim(), filters), {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('[/api/search] upstream', r.status, data);
      const error = r.status === 429
        ? 'Too many searches right now; please try again in a moment.'
        : 'Search failed';
      return NextResponse.json({ error }, { status: r.status === 429 ? 429 : 502 });
    }

    const results = ((data.results ?? []) as UpstreamResult[]).map(toTheorem);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
