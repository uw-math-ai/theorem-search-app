import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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
  // eslint-disable-next-line no-var
  var _metaCache: CacheEntry | undefined;
}

async function fetchMetadata(): Promise<Metadata> {
  const now = Date.now();
  if (global._metaCache && now < global._metaCache.expiresAt) {
    return global._metaCache.data;
  }

  const pool = await getPool();

  const [sourcesRes, authorsRes, tagsRes, countRes, yearRes, citationRes] = await Promise.all([
    pool.query('SELECT sources FROM mv_sources'),
    pool.query('SELECT source, authors FROM mv_authors_by_source'),
    pool.query('SELECT source, tags FROM mv_tags_by_source'),
    pool.query('SELECT cnt FROM mv_theorem_count'),
    pool.query(
      'SELECT MIN(year) AS year_min, MAX(year) AS year_max FROM theorem_search_qwen8b WHERE year IS NOT NULL'
    ),
    pool.query(
      'SELECT MAX(citations) AS citation_max FROM theorem_search_qwen8b WHERE citations IS NOT NULL'
    ),
  ]);

  const authorsPerSource: Record<string, string[]> = {};
  for (const row of authorsRes.rows) {
    authorsPerSource[row.source] = row.authors ?? [];
  }

  const tagsPerSource: Record<string, string[]> = {};
  for (const row of tagsRes.rows) {
    tagsPerSource[row.source] = row.tags ?? [];
  }

  const data: Metadata = {
    sources: sourcesRes.rows[0]?.sources ?? [],
    authorsPerSource,
    tagsPerSource,
    theoremCount: Number(countRes.rows[0]?.cnt ?? 0),
    yearMin: Number(yearRes.rows[0]?.year_min ?? 1991),
    yearMax: Number(yearRes.rows[0]?.year_max ?? new Date().getFullYear()),
    citationMax: Number(citationRes.rows[0]?.citation_max ?? 10000),
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
