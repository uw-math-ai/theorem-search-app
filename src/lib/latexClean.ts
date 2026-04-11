/**
 * TypeScript port of latex_clean.py — cleans raw LaTeX theorem bodies for display.
 * Converts \[...\] / \(...\) / align environments to $$...$$ / $...$ Markdown-math.
 */

function fixTruncatedEndBraces(s: string): string {
  return s.replace(/\\end\{([A-Za-z]+\*?)(?=\s|$)/g, '\\end{$1}');
}

function balanceMathFences(s: string): string {
  if ((s.match(/\{/g) ?? []).length > (s.match(/\}/g) ?? []).length) s = s.trimEnd() + '\\}';
  if ((s.match(/\$\$/g) ?? []).length % 2 === 1) s = s.trimEnd() + '$$';
  return s;
}

function normalizeAlignBlocks(text: string): string {
  return text.replace(
    /\\begin\{align(\*?)\}([\s\S]*?)\\end\{align\1\}/g,
    (_, _star, body: string) => {
      body = body
        .replace(/\\tag\{[^}]*\}/g, '')
        .replace(/\\(?:nonumber|notag)\b/g, '')
        .replace(/\\label\{[^}]*\}/g, '')
        .trim()
        .replace(/\\\\\s*$/, '') // trailing \\
        .trim();
      return `$$\n\\begin{aligned}\n${body}\n\\end{aligned}\n$$`;
    }
  );
}

/**
 * Cleans misparsed theorem names for display.
 * Iteratively strips balanced parenthetical groups (handles nesting),
 * then trims stray whitespace and punctuation.
 */
export function cleanTheoremName(name: string): string {
  if (!name) return name;
  let result = name;
  let prev = '';
  while (result !== prev) {
    prev = result;
    result = result.replace(/\([^()]*\)/g, '');
  }
  // Trim trailing punctuation and whitespace left behind
  return result.replace(/[\s,;:.–—]+$/, '').trim();
}

/**
 * Cleans a raw authors array for display.
 * - Strips leading non-letter characters (e.g. ". A. F. M. ter Elst" → "A. F. M. ter Elst")
 * - Drops entries shorter than 3 characters after cleaning (e.g. ".")
 */
export function cleanAuthors(authors: string[]): string[] {
  return authors
    .map(a => a.replace(/^[^A-Za-z]+/, '').trim())
    .filter(a => a.length >= 3);
}

export function cleanLatexForDisplay(text: string): string {
  if (!text) return text;

  text = fixTruncatedEndBraces(text);
  text = balanceMathFences(text);

  // Remove macro definitions
  text = text.replace(
    /\\(?:DeclareMathOperator|newcommand|renewcommand)\*?\s*\{[^{}]+\}(?:\s*\[\d+\])?(?:\s*\[[^\]]*\])?\s*\{[^{}]*\}/g,
    ''
  );

  // Remove ref/cite/label/footnote
  text = text.replace(/\\(?:label|ref|eqref|cite|footnote|footnotetext|alert)\{[^}]*\}/g, '');

  // Normalize align environments
  text = normalizeAlignBlocks(text);

  // \[...\] → $$...$$
  text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$\n$1\n$$');

  // \(...\) → $...$
  text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$');

  // itemize/enumerate → markdown bullets
  text = text.replace(/\\begin\{(?:enumerate|itemize)\}/g, '');
  text = text.replace(/\\end\{(?:enumerate|itemize)\}/g, '');
  text = text.replace(/^[ \t]*\\item[ \t]*/gm, '- ');

  // Collapse excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}
