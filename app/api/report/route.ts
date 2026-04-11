import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
// import { callLambda } from '@/lib/lambdaClient'; // TODO: re-enable when using Lambda
import { checkRateLimit, hasReported, recordReport } from '@/lib/rateLimit';
import { sanitizeText } from '@/lib/sanitize';

const VALID_REASONS = new Set([
  'Slogan and precise statement don\'t align',
  'LaTeX is malformed',
  'Slogan is not descriptive',
  'Incorrect theorem type',
  'Other',
]);

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRateLimit(`report:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { slogan_id, reasons, other_note, query, url } = body;

    if (typeof slogan_id !== 'string' || !slogan_id || slogan_id.length > 200) {
      return NextResponse.json({ error: 'Invalid slogan_id' }, { status: 400 });
    }
    if (!Array.isArray(reasons) || reasons.length === 0) {
      return NextResponse.json({ error: 'At least one reason is required' }, { status: 400 });
    }
    const sanitizedReasons: string[] = reasons.filter(
      (r): r is string => typeof r === 'string' && VALID_REASONS.has(r)
    );
    if (sanitizedReasons.length === 0) {
      return NextResponse.json({ error: 'No valid reasons provided' }, { status: 400 });
    }

    if (hasReported(ip, slogan_id)) {
      return NextResponse.json({ error: 'Already reported' }, { status: 409 });
    }

    const sanitizedNote = sanitizedReasons.includes('Other')
      ? sanitizeText(other_note, 500)
      : null;

    const pool = await getPool();
    await pool.query(
      'INSERT INTO theorem_reports (slogan_id, reasons, other_note, query, url) VALUES ($1, $2, $3, $4, $5)',
      [
        slogan_id,
        sanitizedReasons,
        sanitizedNote,
        sanitizeText(query, 1000),
        sanitizeText(url, 2000),
      ]
    );

    recordReport(ip, slogan_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/report]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
