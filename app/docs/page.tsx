import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = { title: 'API Docs — TheoremSearch' };

function Section({ id, children }: { id: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-24 space-y-5">{children}</section>;
}

function SectionHeading({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {badge && (
        <span className="px-2 py-0.5 bg-brand text-white text-[10px] font-bold rounded font-mono shrink-0">
          {badge}
        </span>
      )}
      <h2 className="text-xl font-bold text-slate-900">{children}</h2>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">{children}</p>;
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[13px] font-mono text-slate-700">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 rounded-xl p-5 text-sm overflow-x-auto leading-relaxed font-mono whitespace-pre">
      <code>{children}</code>
    </pre>
  );
}

function ParamTable({ rows }: {
  rows: { name: string; type: string; required?: boolean; default?: string; description: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400 w-40">FIELD</th>
            <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400 w-32">TYPE</th>
            <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400 w-24">DEFAULT</th>
            <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">DESCRIPTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map(r => (
            <tr key={r.name}>
              <td className="px-4 py-2.5 font-mono text-[13px] text-slate-800 align-top">
                {r.name}
                {r.required && <span className="ml-1 text-red-400 text-[10px]">*</span>}
              </td>
              <td className="px-4 py-2.5 text-slate-500 text-xs align-top font-mono">{r.type}</td>
              <td className="px-4 py-2.5 text-slate-400 text-xs align-top font-mono">{r.default ?? '—'}</td>
              <td className="px-4 py-2.5 text-slate-600 text-xs align-top leading-relaxed">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-200" />;
}

function Endpoint({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    POST: 'bg-blue-100 text-blue-700',
    GET: 'bg-green-100 text-green-700',
  };
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[method] ?? 'bg-slate-100 text-slate-600'}`}>
        {method}
      </span>
      <span className="text-slate-700">{path}</span>
    </div>
  );
}

const NAV = [
  { href: '#overview', label: 'Overview' },
  { href: '#search', label: 'POST /search' },
  { href: '#graph', label: 'GET /graph' },
  { href: '#paper-search', label: 'GET /paper-search' },
  { href: '#paper-links', label: 'GET /paper-links' },
  { href: '#mcp', label: 'MCP' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/math-ai-logo.jpg" alt="Math AI Lab" width={26} height={26} className="rounded-lg" />
            <span className="font-bold text-slate-900">
              Theorem<span className="text-brand">Search</span>
            </span>
          </Link>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-slate-500 text-sm font-medium">API Docs</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-44 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {NAV.map(n => (
              <a
                key={n.href}
                href={n.href}
                className="block text-xs text-slate-500 hover:text-brand transition-colors py-1 font-mono"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-14">

          {/* Overview */}
          <Section id="overview">
            <h1 className="text-3xl font-bold text-slate-900">API Reference</h1>
            <p className="text-slate-600 leading-relaxed">
              TheoremSearch exposes a REST API for semantic theorem search, dependency graph exploration, and paper lookup. All endpoints are available at the base URL below.
            </p>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Label>BASE URL</Label>
              <code className="text-sm font-mono text-brand">https://api.theoremsearch.com</code>
            </div>
          </Section>

          <Divider />

          {/* POST /search */}
          <Section id="search">
            <SectionHeading badge="POST">Search</SectionHeading>
            <Endpoint method="POST" path="/search" />
            <p className="text-slate-600 text-sm leading-relaxed">
              Perform semantic search for mathematical theorems. Embeds the query using{' '}
              <Code>Qwen3-Embedding-8B</Code>, runs HNSW approximate nearest-neighbor search, then
              reranks by exact cosine similarity with optional citation weighting.
            </p>

            <div>
              <Label>REQUEST BODY</Label>
              <ParamTable rows={[
                { name: 'query',                    type: 'string',        required: true,  description: 'Natural-language description of the mathematical result to find.' },
                { name: 'n_results',                type: 'integer',       default: '10',   description: 'Number of theorems to return.' },
                { name: 'sources',                  type: 'string[]',      default: '[]',   description: 'Filter by source. Options: arXiv, Stacks Project, ProofWiki, CRing Project, HoTT Book, Open Logic Project, An Infinitely Large Napkin.' },
                { name: 'authors',                  type: 'string[]',      default: '[]',   description: 'Filter by author name (partial match).' },
                { name: 'types',                    type: 'string[]',      default: '[]',   description: 'Filter by theorem type, e.g. Theorem, Lemma, Proposition, Corollary.' },
                { name: 'tags',                     type: 'string[]',      default: '[]',   description: 'Filter by primary arXiv category, e.g. math.AG.' },
                { name: 'paper_filter',             type: 'string | null', default: 'null', description: 'Filter results to theorems from papers whose title contains this substring.' },
                { name: 'year_range',               type: '[int, int] | null', default: 'null', description: 'Inclusive year range, e.g. [2015, 2023].' },
                { name: 'citation_range',           type: '[int, int] | null', default: 'null', description: 'Inclusive citation count range, e.g. [10, 500].' },
                { name: 'include_unknown_citations',type: 'boolean',       default: 'true', description: 'When filtering by citation_range, whether to include papers with no citation data.' },
                { name: 'citation_weight',          type: 'number',        default: '0.0',  description: 'Blends ln(citations) into the ranking score. 0 = pure semantic similarity.' },
                { name: 'prompt',                   type: 'string | null', default: 'null', description: 'Instruction prepended to the query before embedding. Defaults to the built-in search prompt.' },
                { name: 'db_top_k',                 type: 'integer | null',default: 'null', description: 'ANN candidate pool size before reranking. Higher improves recall at cost of latency. Defaults to 2 × n_results.' },
              ]} />
            </div>

            <div>
              <Label>EXAMPLE</Label>
              <CodeBlock>{`curl https://api.theoremsearch.com/search \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "smooth DM stack codimension one",
    "n_results": 5,
    "sources": ["Stacks Project"],
    "year_range": [2010, 2024]
  }'`}</CodeBlock>
            </div>

            <div>
              <Label>RESPONSE</Label>
              <CodeBlock>{`{
  "theorems": [
    {
      "slogan_id": 8291,
      "theorem_id": 5104,
      "name": "Lemma 4.2",
      "body": "Let X be a smooth DM stack...",
      "slogan": "A smooth DM stack has a dense open subscheme.",
      "theorem_type": "Lemma",
      "link": "https://stacks.math.columbia.edu/tag/04YC",
      "similarity": 0.871,
      "score": 0.871,
      "paper": {
        "source": "Stacks Project",
        "title": "Stacks Project",
        "primary_category": "math.AG",
        "year": null,
        "citations": null,
        "journal_published": null
      }
    }
  ]
}`}</CodeBlock>
            </div>
          </Section>

          <Divider />

          {/* GET /graph */}
          <Section id="graph">
            <SectionHeading badge="GET">Graph</SectionHeading>
            <Endpoint method="GET" path="/graph?external_id={id}" />
            <p className="text-slate-600 text-sm leading-relaxed">
              Returns the full dependency graph for a paper — all its formal statements, and the directed edges showing which statements depend on which (including cross-paper citations).
            </p>

            <div>
              <Label>QUERY PARAMETERS</Label>
              <ParamTable rows={[
                { name: 'external_id', type: 'string', required: true, description: 'arXiv ID or other external paper identifier, e.g. 2403.05555.' },
              ]} />
            </div>

            <div>
              <Label>EXAMPLE</Label>
              <CodeBlock>{`curl "https://api.theoremsearch.com/graph?external_id=2403.05555"`}</CodeBlock>
            </div>

            <div>
              <Label>RESPONSE</Label>
              <CodeBlock>{`{
  "paper": {
    "paper_id": "uuid",
    "title": "Paper Title",
    "external_id": "2403.05555",
    "source": "arXiv",
    "url": "https://arxiv.org/abs/2403.05555",
    "authors": ["Author One", "Author Two"],
    "abstract": "..."
  },
  "statements": [
    {
      "statement_id": "uuid",
      "name": "Theorem 1.1",
      "body": "Let R be a ring...",
      "note": "Informal description or null",
      "proof": "Proof text or null"
    }
  ],
  "dependencies": [
    {
      "src_statement_id": "uuid",
      "src_name": "Theorem 1.1",
      "dep_statement_id": "uuid",
      "dep_name": "Lemma 2.3",
      "dep_paper_ext_id": "2401.00001",
      "dep_paper_title": "Another Paper",
      "interpaper": true
    }
  ]
}`}</CodeBlock>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              <Code>interpaper: true</Code> on a dependency edge means the referenced statement lives in a different paper.
            </p>
          </Section>

          <Divider />

          {/* GET /paper-search */}
          <Section id="paper-search">
            <SectionHeading badge="GET">Paper Search</SectionHeading>
            <Endpoint method="GET" path="/paper-search?q={query}&limit={n}" />
            <p className="text-slate-600 text-sm leading-relaxed">
              Autocomplete search over paper titles and external IDs. Returns exact external-ID prefix matches first, then title substring matches.
            </p>

            <div>
              <Label>QUERY PARAMETERS</Label>
              <ParamTable rows={[
                { name: 'q',     type: 'string',  default: '""', description: 'Search string matched against external ID (prefix) and title (substring).' },
                { name: 'limit', type: 'integer', default: '8',  description: 'Maximum number of results to return.' },
              ]} />
            </div>

            <div>
              <Label>EXAMPLE</Label>
              <CodeBlock>{`curl "https://api.theoremsearch.com/paper-search?q=derived+categories&limit=5"`}</CodeBlock>
            </div>

            <div>
              <Label>RESPONSE</Label>
              <CodeBlock>{`{
  "papers": [
    {
      "paper_id": "uuid",
      "title": "Derived Categories of Coherent Sheaves",
      "external_id": "math/0206163",
      "source": "arXiv"
    }
  ]
}`}</CodeBlock>
            </div>
          </Section>

          <Divider />

          {/* GET /paper-links */}
          <Section id="paper-links">
            <SectionHeading badge="GET">Paper Links</SectionHeading>
            <Endpoint method="GET" path="/paper-links" />
            <p className="text-slate-600 text-sm leading-relaxed">
              Returns all directed citation edges among papers in the graph dataset as source → target pairs of paper UUIDs. Useful for constructing citation network visualizations.
            </p>

            <div>
              <Label>EXAMPLE</Label>
              <CodeBlock>{`curl https://api.theoremsearch.com/paper-links`}</CodeBlock>
            </div>

            <div>
              <Label>RESPONSE</Label>
              <CodeBlock>{`{
  "links": [
    { "source": "uuid-of-citing-paper", "target": "uuid-of-cited-paper" }
  ]
}`}</CodeBlock>
            </div>
          </Section>

          <Divider />

          {/* MCP */}
          <Section id="mcp">
            <SectionHeading>MCP</SectionHeading>
            <p className="text-slate-600 text-sm leading-relaxed">
              TheoremSearch is available as an MCP (Model Context Protocol) server for AI agents.
              It exposes a single tool <Code>theorem_search</Code> with the same parameters as{' '}
              <a href="#search" className="text-brand hover:underline">POST /search</a>.
            </p>

            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 shrink-0">ENDPOINT</span>
              <code className="text-sm font-mono text-brand">https://api.theoremsearch.com/mcp</code>
            </div>

            <div>
              <Label>EXAMPLE — CALL theorem_search VIA MCP</Label>
              <CodeBlock>{`curl -X POST https://api.theoremsearch.com/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "theorem_search",
      "arguments": {
        "query": "every projective module over a local ring is free",
        "n_results": 5
      }
    }
  }'`}</CodeBlock>
            </div>

            <div>
              <Label>RESPONSE</Label>
              <CodeBlock>{`{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "content": [{ "type": "text", "text": "{...serialized SearchResponse...}" }],
    "structuredContent": { "theorems": [...] }
  }
}`}</CodeBlock>
            </div>

            <div>
              <Label>SUPPORTED METHODS</Label>
              <ParamTable rows={[
                { name: 'initialize',  type: '—', description: 'Handshake. Returns protocol version and server capabilities.' },
                { name: 'tools/list', type: '—', description: 'Returns the theorem_search tool schema.' },
                { name: 'tools/call', type: '—', description: 'Invokes theorem_search with the given arguments.' },
              ]} />
            </div>
          </Section>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} UW Math AI Lab.</p>
          <Link href="/search" className="hover:text-brand transition-colors">← Back to search</Link>
        </div>
      </footer>
    </div>
  );
}
