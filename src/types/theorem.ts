/** A search result, as returned by /api/search (mapped from the API's /graph/embedding). */
export interface Theorem {
  statement_id: string;        // v2 statement UUID
  theorem_name: string;        // e.g. "Theorem 3.6"
  theorem_body: string;        // raw LaTeX body (formal: Lean signature; may be empty)
  theorem_slogan: string;      // plain-language summary
  theorem_type: string;        // "theorem" | "lemma" | "proposition" | "corollary" | …
  formality?: string;          // "informal" | "formal"
  title: string;               // paper / book / repo title
  authors: string[];
  source: string;              // "arXiv" | "Stacks Project" | "Lean Repo" etc.
  link: string;                // URL to source
  year?: number;               // year of the paper's latest version
  primary_category?: string;   // e.g. "math.NT"
  citations?: number | null;
  journal_published?: boolean | null;
  similarity?: number;
  score?: number;
}
