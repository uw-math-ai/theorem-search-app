/**
 * Strips HTML/XML tags and null bytes from a string before storing.
 * Parameterized queries already prevent SQL injection; this prevents
 * stored XSS if data is ever rendered in a non-React HTML context.
 */
export function sanitizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  return value
    .replace(/<[^>]*>/g, '')   // strip HTML/XML tags
    .replace(/\0/g, '')        // strip null bytes
    .trim()
    .slice(0, maxLength) || null;
}
