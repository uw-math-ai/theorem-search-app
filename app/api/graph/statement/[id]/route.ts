import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = 'https://api.theoremsearch.com';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const upstream = new URL(`${UPSTREAM}/graph/statement/${encodeURIComponent(id)}`);
  searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  const r = await fetch(upstream.toString());
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
