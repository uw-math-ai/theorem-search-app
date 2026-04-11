/**
 * VPC Lambda — handles all RDS operations for the Next.js app.
 * Uses RDS IAM authentication: no secrets to rotate.
 *
 * Prerequisites:
 *   - RDS instance has IAM authentication enabled
 *   - Lambda execution role has rds-db:connect permission
 *   - DB user created with: CREATE USER <DB_USER> WITH LOGIN; GRANT rds_iam TO <DB_USER>;
 *
 * Environment variables required:
 *   DB_HOST, DB_NAME, DB_USER, LAMBDA_SECRET
 *   Optional: DB_PORT (default 5432)
 */
import { Pool, PoolClient, DatabaseError } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';

// Module-level cache — persists across warm invocations
let pool: Pool | undefined;

async function buildPool(): Promise<Pool> {
  const signer = new Signer({
    region:   process.env.AWS_REGION ?? 'us-west-2',
    hostname: process.env.DB_HOST!,
    port:     Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER!,
  });
  const password = await signer.getAuthToken();

  return new Pool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password,
    ssl:      { rejectUnauthorized: false },
    max:      5,
    idleTimeoutMillis:      30_000,
    connectionTimeoutMillis: 10_000,
  });
}

async function getPool(): Promise<Pool> {
  if (!pool) pool = await buildPool();
  return pool;
}

// IAM tokens expire after 15 min. If a connect fails with an auth error,
// recreate the pool with a fresh token and retry once.
function isAuthError(e: unknown): boolean {
  return e instanceof DatabaseError && (e.code === '28P01' || e.code === '28000');
}

async function resetPool(): Promise<void> {
  try { await pool?.end(); } catch { /* ignore */ }
  pool = undefined;
}

async function connectWithRetry(): Promise<PoolClient> {
  try {
    return await (await getPool()).connect();
  } catch (e) {
    if (isAuthError(e)) {
      await resetPool();
      return (await getPool()).connect();
    }
    throw e;
  }
}

async function poolQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string, params?: unknown[]
): Promise<import('pg').QueryResult<T>> {
  try {
    return await (await getPool()).query<T>(sql, params);
  } catch (e) {
    if (isAuthError(e)) {
      await resetPool();
      return (await getPool()).query<T>(sql, params);
    }
    throw e;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchFilters {
  types?: string[];
  authors?: string[];
  categories?: string[];
  publicationStatus?: string[];
  yearMin?: number;
  yearMax?: number;
  citationMin?: number;
  citationMax?: number;
  includeUnknownCitations?: boolean;
  paperFilter?: string;
}

interface CandidateRow {
  slogan_id: string;
  similarity: number;
  score: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PER_SOURCE_MULTIPLIER = 3;

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

// ─── Action: search ──────────────────────────────────────────────────────────

async function handleSearch({
  vecStr,
  topK,
  sources,
  filters = {},
}: {
  vecStr: string;
  topK: number;
  sources: string[];
  filters: SearchFilters;
}) {
  const client = await connectWithRetry();
  try {
    await client.query(`SET hnsw.ef_search = ${Math.max(80, topK * 4)}`);
    await client.query(`SET hnsw.iterative_scan = 'relaxed_order'`);

    const all: CandidateRow[] = [];

    for (const source of sources) {
      const params: unknown[] = [source, vecStr, topK * PER_SOURCE_MULTIPLIER];
      const extra: string[] = [];
      const p = (val: unknown) => { params.push(val); return `$${params.length}`; };

      if (filters.types?.length)      extra.push(`theorem_type = ANY(${p(filters.types)})`);
      if (filters.authors?.length)    extra.push(`authors && ${p(filters.authors)}`);
      if (filters.categories?.length) extra.push(`primary_category = ANY(${p(filters.categories)})`);

      if (filters.publicationStatus?.length === 1) {
        extra.push(`journal_published = ${p(filters.publicationStatus[0] === 'Published')}`);
      }

      if (filters.yearMin != null) extra.push(`year >= ${p(filters.yearMin)}`);
      if (filters.yearMax != null) extra.push(`year <= ${p(filters.yearMax)}`);

      const hasCitationFilter = (filters.citationMin ?? 0) > 0 || filters.citationMax != null;
      if (hasCitationFilter) {
        const low  = filters.citationMin ?? 0;
        const high = filters.citationMax ?? 2_000_000;
        if (filters.includeUnknownCitations !== false) {
          extra.push(`(citations BETWEEN ${p(low)} AND ${p(high)} OR citations IS NULL)`);
        } else {
          extra.push(`citations BETWEEN ${p(low)} AND ${p(high)}`);
        }
      }

      if (filters.paperFilter?.trim()) {
        const { ids, titles } = parsePaperFilter(filters.paperFilter);
        const orClauses: string[] = [];
        if (ids.length)    orClauses.push(`paper_id LIKE ANY(${p(ids.map(id => id + '%'))})`);
        if (titles.length) orClauses.push(`title ILIKE ANY(${p(titles.map(t => '%' + t + '%'))})`);
        if (orClauses.length) extra.push(`(${orClauses.join(' OR ')})`);
      }

      const pRerank    = p(vecStr);
      const extraWhere = extra.length ? ' AND ' + extra.join(' AND ') : '';

      const sql = `
        WITH ann AS (
          SELECT slogan_id, embedding
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

    all.sort((a, b) => Number(b.score) - Number(a.score));
    const candidates = all.slice(0, topK);

    if (!candidates.length) return { results: [] };

    const ids      = candidates.map(r => r.slogan_id);
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

    const results = rows.map(row => ({
      ...row,
      similarity: Number(scoreMap.get(row.slogan_id)?.similarity ?? 0),
      score:      Number(scoreMap.get(row.slogan_id)?.score ?? 0),
    }));

    return { results };
  } finally {
    client.release();
  }
}

// ─── Action: metadata ────────────────────────────────────────────────────────

interface MetadataCache { data: unknown; expiresAt: number }
let metaCache: MetadataCache | undefined;

async function handleMetadata() {
  const now = Date.now();
  if (metaCache && now < metaCache.expiresAt) return metaCache.data;

  const [sourcesRes, authorsRes, tagsRes, countRes, yearRes, citationRes] = await Promise.all([
    poolQuery('SELECT sources FROM mv_sources'),
    poolQuery('SELECT source, authors FROM mv_authors_by_source'),
    poolQuery('SELECT source, tags FROM mv_tags_by_source'),
    poolQuery('SELECT cnt FROM mv_theorem_count'),
    poolQuery('SELECT MIN(year) AS year_min, MAX(year) AS year_max FROM theorem_search_qwen8b WHERE year IS NOT NULL'),
    poolQuery('SELECT MAX(citations) AS citation_max FROM theorem_search_qwen8b WHERE citations IS NOT NULL'),
  ]);

  const authorsPerSource: Record<string, string[]> = {};
  for (const row of authorsRes.rows) authorsPerSource[row.source as string] = (row.authors ?? []) as string[];

  const tagsPerSource: Record<string, string[]> = {};
  for (const row of tagsRes.rows) tagsPerSource[row.source as string] = (row.tags ?? []) as string[];

  const data = {
    sources: sourcesRes.rows[0]?.sources ?? [],
    authorsPerSource,
    tagsPerSource,
    theoremCount: Number(countRes.rows[0]?.cnt ?? 0),
    yearMin:      Number(yearRes.rows[0]?.year_min ?? 1991),
    yearMax:      Number(yearRes.rows[0]?.year_max ?? new Date().getFullYear()),
    citationMax:  Number(citationRes.rows[0]?.citation_max ?? 10000),
  };

  metaCache = { data, expiresAt: now + 7 * 24 * 60 * 60 * 1000 };
  return data;
}

// ─── Action: feedback ────────────────────────────────────────────────────────

async function handleFeedback(payload: {
  vote: number; slogan_id: string; query: string; url: string;
  theorem_name: string; authors: string[]; filters: Record<string, unknown>;
}) {
  const { vote, query, url, theorem_name, authors, filters = {} } = payload;
  const sources: string[] = Array.isArray(filters.sources) ? filters.sources as string[] : [];

  await poolQuery(
    `INSERT INTO feedback
       (feedback, query, url, theorem_name, authors, types, tags, sources,
        paper_filter, year_range, citation_range, citation_weight,
        include_unknown_citations, top_k)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      vote,
      String(query).trim().slice(0, 1000),
      String(url).slice(0, 2000),
      String(theorem_name).slice(0, 500),
      Array.isArray(authors) ? authors.join(', ').slice(0, 1000) : null,
      (Array.isArray(filters.types)      ? filters.types      : []).join(', '),
      (Array.isArray(filters.categories) ? filters.categories : []).join(', '),
      sources.join(', '),
      typeof filters.paperFilter === 'string' ? filters.paperFilter.slice(0, 500) : '',
      `${filters.yearMin ?? ''}–${filters.yearMax ?? ''}`,
      `${filters.citationMin ?? 0}–${filters.citationMax ?? ''}`,
      0.0,
      String(filters.includeUnknownCitations ?? true),
      typeof filters.topK === 'number' ? filters.topK : 20,
    ]
  );
  return { ok: true };
}

// ─── Action: log-query ───────────────────────────────────────────────────────

async function handleLogQuery(payload: {
  query: string; sources: string[]; filtersJson: Record<string, unknown>;
}) {
  const { query, sources, filtersJson } = payload;
  await poolQuery(
    'INSERT INTO queries (query, sources, filters) VALUES ($1, $2, $3)',
    [String(query).trim().slice(0, 1000), sources, filtersJson]
  );
  return { ok: true };
}

// ─── Action: report ──────────────────────────────────────────────────────────

async function handleReport(payload: {
  slogan_id: string; reasons: string[]; query: string | null; url: string | null;
}) {
  const { slogan_id, reasons, query, url } = payload;
  await poolQuery(
    'INSERT INTO theorem_reports (slogan_id, reasons, query, url) VALUES ($1, $2, $3, $4)',
    [slogan_id, reasons, query, url]
  );
  return { ok: true };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

function ok(data: unknown) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

function err(status: number, message: string) {
  return { statusCode: status, body: JSON.stringify({ error: message }) };
}

export const handler = async (event: {
  headers?: Record<string, string>;
  body?: string;
}) => {
  if (event.headers?.['x-internal-secret'] !== process.env.LAMBDA_SECRET) {
    return err(401, 'Unauthorized');
  }

  let action: string | undefined;
  try {
    const body = JSON.parse(event.body ?? '{}');
    action = body.action;
    const payload = body.payload ?? {};

    switch (action) {
      case 'search':    return ok(await handleSearch(payload));
      case 'metadata':  return ok(await handleMetadata());
      case 'feedback':  return ok(await handleFeedback(payload));
      case 'log-query': return ok(await handleLogQuery(payload));
      case 'report':    return ok(await handleReport(payload));
      default:          return err(400, `Unknown action: ${action}`);
    }
  } catch (e) {
    console.error(`[lambda/${action}]`, e);
    return err(500, String(e));
  }
};
