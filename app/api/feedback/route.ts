import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { checkRateLimit, hasVoted, recordVote } from '@/lib/rateLimit';
import { sanitizeText } from '@/lib/sanitize';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRateLimit(`feedback:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { vote, slogan_id, query, url, theorem_name, authors, filters = {} } = body;

    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }
    if (typeof slogan_id !== 'string' || !slogan_id || slogan_id.length > 200) {
      return NextResponse.json({ error: 'Invalid slogan_id' }, { status: 400 });
    }
    if (typeof query !== 'string' || !query.trim() || query.length > 1000) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    if (hasVoted(ip, slogan_id)) {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }

    const sources: string[] = Array.isArray(filters.sources) ? filters.sources : [];

    const pool = await getPool();
    await pool.query(
      `INSERT INTO feedback
         (feedback, query, url, theorem_name, authors, types, tags, sources,
          paper_filter, year_range, citation_range, citation_weight,
          include_unknown_citations, top_k)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        vote,
        sanitizeText(query, 1000),
        sanitizeText(url, 2000) ?? '',
        sanitizeText(theorem_name, 500) ?? '',
        Array.isArray(authors) ? sanitizeText(authors.join(', '), 1000) : null,
        (Array.isArray(filters.types) ? filters.types : []).join(', '),
        (Array.isArray(filters.categories) ? filters.categories : []).join(', '),
        sources.join(', '),
        sanitizeText(filters.paperFilter, 500) ?? '',
        `${filters.yearMin ?? ''}–${filters.yearMax ?? ''}`,
        `${filters.citationMin ?? 0}–${filters.citationMax ?? ''}`,
        0.0,
        String(filters.includeUnknownCitations ?? true),
        typeof filters.topK === 'number' ? filters.topK : 20,
      ]
    );

    recordVote(ip, slogan_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/feedback]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
