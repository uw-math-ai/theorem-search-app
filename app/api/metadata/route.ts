import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getPool } from '@/lib/db';

const TTL = 60 * 60 * 24 * 7; // 7 days — matches @st.cache_data(ttl=60*60*24*7)

const fetchMetadata = unstable_cache(
  async () => {
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

    return {
      sources: sourcesRes.rows[0]?.sources ?? [],
      authorsPerSource,
      tagsPerSource,
      theoremCount: Number(countRes.rows[0]?.cnt ?? 0),
      yearMin: Number(yearRes.rows[0]?.year_min ?? 1991),
      yearMax: Number(yearRes.rows[0]?.year_max ?? new Date().getFullYear()),
      citationMax: Number(citationRes.rows[0]?.citation_max ?? 10000),
    };
  },
  ['theorem-search-metadata'],
  { revalidate: TTL }
);

export async function GET() {
  try {
    const data = await fetchMetadata();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': `public, s-maxage=${TTL}, stale-while-revalidate` },
    });
  } catch (err) {
    console.error('[/api/metadata]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
