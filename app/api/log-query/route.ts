import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRateLimit(`log-query:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const query: unknown = body.query;
    const filters = body.filters ?? {};

    if (typeof query !== 'string' || !query.trim() || query.length > 1000) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const sources: string[] = Array.isArray(filters.sources) ? filters.sources : [];

    const filtersJson = {
      types: (Array.isArray(filters.types) ? filters.types : []).join(', '),
      tags: (Array.isArray(filters.categories) ? filters.categories : []).join(', '),
      sources: sources.join(', '),
      paper_filter: typeof filters.paperFilter === 'string' ? filters.paperFilter : '',
      year_range: `${filters.yearMin ?? ''}–${filters.yearMax ?? ''}`,
      citation_range: `${filters.citationMin ?? 0}–${filters.citationMax ?? ''}`,
      include_unknown_citations: String(filters.includeUnknownCitations ?? true),
      top_k: typeof filters.topK === 'number' ? filters.topK : 20,
    };

    const pool = await getPool();
    await pool.query(
      'INSERT INTO queries (query, sources, filters) VALUES ($1, $2, $3)',
      [query.trim(), sources, filtersJson]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/log-query]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
