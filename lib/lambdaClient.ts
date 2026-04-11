export async function callLambda<T>(action: string, payload?: unknown): Promise<T> {
  const url = process.env.LAMBDA_FUNCTION_URL;
  const secret = process.env.LAMBDA_SECRET;

  if (!url)    throw new Error('LAMBDA_FUNCTION_URL is not configured');
  if (!secret) throw new Error('LAMBDA_SECRET is not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': secret,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Lambda ${action} failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}
