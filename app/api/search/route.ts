import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { embedQuery } from '@/lib/embed';
import type { PoolClient } from 'pg';

const PER_SOURCE_MULTIPLIER = 3;

function vecToSql(vec: number[]): string {
  return '[' + vec.join(',') + ']';
}

interface SearchFilters {
  sources?: string[];
  types?: string[];
  authors?: string[];
  categories?: string[];
  publicationStatus?: string[];
  yearMin?: number;
  yearMax?: number;
  topK?: number;
  citationMin?: number;
  citationMax?: number;
  includeUnknownCitations?: boolean;
  paperFilter?: string;
}

function parsePaperFilter(raw: string): { ids: string[]; titles: string[] } {
  const ids: string[] = [];
  const titles: string[] = [];
  if (!raw?.trim()) return { ids, titles };
  const arxivRe = /(?:arxiv\.org\/(?:abs|pdf)\/)?(\d{4}\.\d{4,5}|[a-z\-]+\/\d{7})/i;
  for (const token of raw.split(',').map(t => t.trim()).filter(Boolean)) {
    const m = arxivRe.exec(token);
    if (m) ids.push(m[1].toLowerCase());
    else titles.push(token.toLowerCase());
  }
  return { ids, titles };
}

interface CandidateRow {
  slogan_id: string;
  similarity: number;
  score: number;
}

async function fetchCandidates(
  client: PoolClient,
  vecStr: string,
  topK: number,
  sources: string[],
  filters: SearchFilters
): Promise<CandidateRow[]> {
  // Use an explicit transaction so SET LOCAL applies to all queries within it,
  // matching the psycopg2 implicit-transaction behaviour in db.py.
  await client.query('BEGIN');
  await client.query(`SET LOCAL hnsw.ef_search = ${Math.max(80, topK * 4)}`);
  await client.query(`SET LOCAL hnsw.iterative_scan = 'relaxed_order'`);

  const all: CandidateRow[] = [];

  try {
    for (const source of sources) {
      // Positional params: $1=source, $2=vec_ann, $3=limit, then filter params, then $N=vec_rerank
      const params: unknown[] = [source, vecStr, topK * PER_SOURCE_MULTIPLIER];
      const extra: string[] = [];

      const p = (val: unknown) => { params.push(val); return `$${params.length}`; };

      if (filters.types?.length)      extra.push(`theorem_type = ANY(${p(filters.types)})`);
      if (filters.authors?.length)    extra.push(`authors && ${p(filters.authors)}`);
      if (filters.categories?.length) extra.push(`primary_category = ANY(${p(filters.categories)})`);

      if (filters.publicationStatus?.length) {
        const clauses: string[] = [];
        if (filters.publicationStatus.includes('Published')) clauses.push('(journal_published = true OR journal_published IS NULL)');
        if (filters.publicationStatus.includes('Preprint'))  clauses.push('(journal_published = false OR journal_published IS NULL)');
        if (clauses.length) extra.push(`(${clauses.join(' OR ')})`);
      }

      if (filters.yearMin != null)    extra.push(`(year >= ${p(filters.yearMin)} OR year IS NULL)`);
      if (filters.yearMax != null)    extra.push(`(year <= ${p(filters.yearMax)} OR year IS NULL)`);

      // Citation range (arXiv only; safe to apply to others — they'll just have NULL)
      const hasCitationFilter =
        (filters.citationMin != null && filters.citationMin > 0) ||
        filters.citationMax != null;
      if (hasCitationFilter) {
        const low  = filters.citationMin ?? 0;
        const high = filters.citationMax ?? 2_000_000;
        if (filters.includeUnknownCitations !== false) {
          extra.push(`(citations BETWEEN ${p(low)} AND ${p(high)} OR citations IS NULL)`);
        } else {
          extra.push(`citations BETWEEN ${p(low)} AND ${p(high)}`);
        }
      }

      // Paper / arXiv ID filter
      if (filters.paperFilter?.trim()) {
        const { ids, titles } = parsePaperFilter(filters.paperFilter);
        const orClauses: string[] = [];
        if (ids.length)    orClauses.push(`paper_id LIKE ANY(${p(ids.map(id => id + '%'))})`);
        if (titles.length) orClauses.push(`title ILIKE ANY(${p(titles.map(t => '%' + t + '%'))})`);
        if (orClauses.length) extra.push(`(${orClauses.join(' OR ')})`);
      }

      const pRerank = p(vecStr); // rerank vec always last
      const extraWhere = extra.length ? ' AND ' + extra.join(' AND ') : '';

      const sql = `
        WITH ann AS (
          SELECT slogan_id, citations, embedding
          FROM theorem_search_qwen8b
          WHERE source = $1${extraWhere}
          ORDER BY
            (binary_quantize(embedding)::bit(4096))
            <~>
            binary_quantize($2::vector(4096))::bit(4096)
          LIMIT $3
        )
        SELECT
          slogan_id,
          (1.0 - (embedding <=> ${pRerank}::vector(4096))) AS similarity,
          (1.0 - (embedding <=> ${pRerank}::vector(4096))) AS score
        FROM ann
      `;

      const { rows } = await client.query<CandidateRow>(sql, params);
      all.push(...rows);
    }
  } finally {
    await client.query('COMMIT');
  }

  all.sort((a, b) => Number(b.score) - Number(a.score));
  return all.slice(0, topK);
}

async function fetchFullRows(client: PoolClient, candidates: CandidateRow[]) {
  if (!candidates.length) return [];

  const ids = candidates.map(r => r.slogan_id);
  const scoreMap = new Map(candidates.map(r => [r.slogan_id, r]));

  const { rows } = await client.query(
    `SELECT
       slogan_id, theorem_id, paper_id, theorem_name, theorem_body, theorem_slogan,
       theorem_type, title, authors, link, year, journal_published,
       primary_category, categories, citations, source, has_metadata
     FROM theorem_search_qwen8b
     WHERE slogan_id = ANY($1)
     ORDER BY array_position($1, slogan_id)`,
    [ids]
  );

  return rows.map(row => ({
    ...row,
    similarity: Number(scoreMap.get(row.slogan_id)?.similarity ?? 0),
    score: Number(scoreMap.get(row.slogan_id)?.score ?? 0),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { query, filters = {} }: { query: string; filters: SearchFilters } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const pool = await getPool();
    const topK = filters.topK ?? 20;

    // Resolve sources: use selected or fall back to all
    let sources = filters.sources ?? [];
    if (!sources.length) {
      const { rows } = await pool.query('SELECT sources FROM mv_sources');
      sources = rows[0]?.sources ?? [];
    }

    if (!sources.length) return NextResponse.json({ results: [] });

    const trimmedQuery = query.trim();
    const embedInput = trimmedQuery.split(/\s+/).length < 5
      ? `${trimmedQuery} ${trimmedQuery}`
      : trimmedQuery;
    const vecStr = vecToSql(await embedQuery(embedInput));

    const client = await pool.connect();
    try {
      const candidates = await fetchCandidates(client, vecStr, topK, sources, filters);
      const results = await fetchFullRows(client, candidates);
      return NextResponse.json({ results });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
