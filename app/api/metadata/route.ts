import { NextResponse } from 'next/server';
import { getPool, V2_DB } from '@/lib/db';

const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface Metadata {
  sources: string[];
  authorsPerSource: Record<string, string[]>;
  tagsPerSource: Record<string, string[]>;
  theoremCount: number;
  yearMin: number;
  yearMax: number;
  citationMax: number;
}

interface CacheEntry {
  data: Metadata;
  expiresAt: number;
}

declare global {
  var _metaCache: CacheEntry | undefined;
}

async function fetchMetadata(): Promise<Metadata> {
  const now = Date.now();
  if (global._metaCache && now < global._metaCache.expiresAt) {
    return global._metaCache.data;
  }

  // Materialized views defined in TheoremSearch rds/helpers/search_metadata.sql.
  const pool = await getPool(V2_DB);

  const [statsRes, authorsRes, tagsRes] = await Promise.all([
    pool.query(
      'SELECT source, informal_statements, formal_statements, year_min, year_max, citation_max FROM mv_search_source_stats ORDER BY source'
    ),
    pool.query('SELECT source, authors FROM mv_search_authors_by_source'),
    pool.query('SELECT source, tags FROM mv_search_tags_by_source'),
  ]);
  const stats = statsRes.rows;
  const known = (xs: (number | null)[]) => xs.filter((x): x is number => x != null).map(Number);
  const minOf = (xs: (number | null)[], fallback: number) => known(xs).length ? Math.min(...known(xs)) : fallback;
  const maxOf = (xs: (number | null)[], fallback: number) => known(xs).length ? Math.max(...known(xs)) : fallback;

  const authorsPerSource: Record<string, string[]> = {};
  for (const row of authorsRes.rows) {
    authorsPerSource[row.source] = row.authors ?? [];
  }

  const tagsPerSource: Record<string, string[]> = {};
  for (const row of tagsRes.rows) {
    tagsPerSource[row.source] = row.tags ?? [];
  }

  const data: Metadata = {
    sources: stats.map(r => r.source),
    authorsPerSource,
    tagsPerSource,
    theoremCount: stats.reduce((n, r) => n + Number(r.informal_statements) + Number(r.formal_statements), 0),
    yearMin: minOf(stats.map(r => r.year_min), 1991),
    yearMax: maxOf(stats.map(r => r.year_max), new Date().getFullYear()),
    citationMax: maxOf(stats.map(r => r.citation_max), 10000),
  };

  global._metaCache = { data, expiresAt: now + TTL_MS };
  return data;
}

export async function GET() {
  try {
    const data = await fetchMetadata();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': `public, s-maxage=${TTL_MS / 1000}, stale-while-revalidate` },
    });
  } catch (err) {
    console.error('[/api/metadata]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
