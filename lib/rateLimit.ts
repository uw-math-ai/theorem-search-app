interface WindowEntry {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowEntry>();
const votedPairs = new Map<string, number>(); // `${ip}:${sloganId}` → timestamp
let callCount = 0;

function cleanup() {
  const now = Date.now();
  for (const [k, v] of windows) {
    if (now > v.resetAt) windows.delete(k);
  }
  const cutoff = now - 24 * 60 * 60 * 1000;
  for (const [k, ts] of votedPairs) {
    if (ts < cutoff) votedPairs.delete(k);
  }
}

/** Returns true if the request is within the allowed rate, false if it should be rejected. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  if (++callCount % 500 === 0) cleanup();
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Returns true if this IP has already voted on this slogan within the last 24 hours. */
export function hasVoted(ip: string, sloganId: string): boolean {
  return votedPairs.has(`${ip}:${sloganId}`);
}

export function recordVote(ip: string, sloganId: string): void {
  votedPairs.set(`${ip}:${sloganId}`, Date.now());
}
