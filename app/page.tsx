import Link from 'next/link';
import { ReactNode } from 'react';
import Image from 'next/image';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';

export const metadata = {
  title: 'TheoremSearch — Semantic Search for Mathematical Theorems',
};

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-slate-900">{children}</h2>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 rounded-xs p-5 text-sm overflow-x-auto leading-relaxed font-mono whitespace-pre">
      <code>{children}</code>
    </pre>
  );
}

const AUTHORS = [
  { name: 'Luke Alexander',      href: 'https://www.linkedin.com/in/lukealexanderluke/' },
  { name: 'Eric Leonen',         href: 'https://github.com/ericleonen' },
  { name: 'Sophie Szeto',        href: 'https://www.linkedin.com/in/sophie-szeto/' },
  { name: 'Artemii Remizov',     href: 'https://www.linkedin.com/in/artemii-remizov-62783631b/' },
  { name: 'Ignacio Tejeda',      href: 'https://www.ignaciotejeda.com/' },
  { name: 'Jarod Alper',         href: 'https://sites.math.washington.edu//~jarod/' },
  { name: 'Giovanni Inchiostro', href: 'https://sites.math.washington.edu/~ginchios/' },
  { name: 'Vasily Ilin',         href: 'https://vilin97.github.io/' },
];

const PERFORMANCE = [
  { model: 'Google Search', theorem: '—',     paper: '0.378' },
  { model: 'ChatGPT 5.2',   theorem: '0.180', paper: '—' },
  { model: 'Gemini 3 Pro',  theorem: '0.252', paper: '—' },
  { model: 'Ours',          theorem: '0.432', paper: '0.505', highlight: true },
];

const SOURCES = [
  { name: 'arXiv',                      count: '9,246,761' },
  { name: 'ProofWiki',                  count: '23,871' },
  { name: 'Stacks Project',             count: '12,693' },
  { name: 'Open Logic Project',         count: '745' },
  { name: 'CRing Project',              count: '546' },
  { name: 'Stacks and Moduli',          count: '506' },
  { name: 'HoTT Book',                  count: '382' },
  { name: 'An Infinitely Large Napkin', count: '231' },
];

const HOW_IT_WORKS = [
  {
    title: 'Parse theorems.',
    body: 'We extract over 9 million theorem statements from LaTeX sources across arXiv and seven other sources using a combination of plasTeX, TeX logging, and regex-based parsing.',
  },
  {
    title: 'Generate slogans.',
    body: 'Each theorem is summarized into a concise natural-language description ("slogan") by DeepSeek V3 to convert formal LaTeX notation into searchable text.',
  },
  {
    title: 'Embed and index.',
    body: 'Slogans are embedded using Qwen3-Embedding-8B and stored in a PostgreSQL database with pgvector, using an HNSW index with binary quantization for fast approximate nearest-neighbor search.',
  },
  {
    title: 'Retrieve.',
    body: 'User queries are embedded with the same model. We retrieve the top-k theorems by Hamming distance, then re-rank by cosine similarity.',
  },
];

const STATS = [
  { value: '9M+',  label: 'Theorems indexed' },
  { value: '7',    label: 'Sources' },
  { value: '70%',  label: 'More accurate than LLM search' },
  { value: '<5s',  label: 'Query latency' },
];

export default function OverviewPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      <SiteHeader />

      <main>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Search 9 million+<br />
            <span className="text-brand">mathematical theorems</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Describe a result in natural language, and TheoremSearch finds it across arXiv, the Stacks Project, and more. <strong className="text-slate-700">70% more accurate than LLM search.</strong>
          </p>

          <p className="text-sm text-slate-400">
            {AUTHORS.map((a, i) => (
              <span key={a.name}>
                <a href={a.href} target="_blank" rel="noopener noreferrer"
                  className="hover:text-brand transition-colors">
                  {a.name}
                </a>
                {i < AUTHORS.length - 1 && <span className="text-slate-300">,&nbsp;</span>}
              </span>
            ))}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/search"
              className="px-7 py-2.5 bg-brand text-white rounded-xs font-semibold text-sm hover:bg-brand/90 transition-colors">
              Explore
            </Link>
            <a href="https://arxiv.org/abs/2602.05216" target="_blank" rel="noopener noreferrer"
              className="px-7 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xs font-semibold text-sm hover:bg-slate-50 transition-colors">
              Read the paper →
            </a>
          </div>
        </section>

        {/* Screenshot */}
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <Image
            src="/theorem-search-screenshot.png"
            alt="TheoremSearch screenshot"
            width={1200}
            height={800}
            className="w-full rounded-xs border border-slate-200"
            loading="eager"
          />
        </div>

        {/* Stats */}
        <div className="border-y border-slate-100 bg-slate-50/60">
          <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-brand">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

          {/* Motivation */}
          <section className="space-y-4">
            <SectionHeading>Motivation</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Mathematical knowledge is distributed across millions of papers. However, existing
              search tools only operate at the document level, and important results can be hard
              to surface in lesser-known sources. We want to democratize math by enabling search
              at the theorem level.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For mathematicians</strong>, a bottleneck in modern research is discovery; 
              i.e., locating relevant lemmas or prior results already buried somewhere in the
              literature. Furthermore, sources like The Stacks Project are valuable repositories
              of branch-specific knowledge, but Google cannot reliably surface individual results,
              and any built-in search capabilities are largely limited to keywords and tags. 
              Through documented case studies and user feedback, TheoremSearch is a reliable
              tool for theorem discovery.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For AI agents</strong>, we believe reliable autonomous mathematical discovery necessitates granular access to relevant literature. Many of the recent AI breakthroughs on{' '}
              <a href="https://www.erdosproblems.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Erdős problems</a>{' '}
              turned out to be rediscoveries of results already in the literature. For example, 9/13 of
              <a href="https://arxiv.org/abs/2602.10177" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline"> DeepMind Aletheia&rsquo;s</a>{' '}
              meaningfully correct generated solutions were either classified as independent rediscoveries or identifications of results in existing literature.
              It is also true that LLMs often fabricate incorrect arguments. In our experiments, Claude answered a research-level algebraic geometry question incorrectly on its own, but correctly when given access to TheoremSearch as a RAG tool.
            </p>
          </section>

          {/* How It Works */}
          <section className="space-y-6">
            <SectionHeading>How It Works</SectionHeading>
            <ol className="space-y-5">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    <strong className="text-slate-800">{step.title}</strong>{' '}{step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Performance + Data Sources */}
          <section className="space-y-5">
            <SectionHeading>Overview</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Retrieval Performance (Hit@10)</h3>
                <div className="overflow-hidden rounded-xs border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">MODEL</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">THM-LEVEL</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">PAPER-LEVEL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {PERFORMANCE.map(r => (
                        <tr key={r.model} className={r.highlight ? 'bg-brand/5' : ''}>
                          <td className={`px-4 py-2.5 text-xs ${r.highlight ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{r.model}</td>
                          <td className={`px-4 py-2.5 text-xs text-right ${r.highlight ? 'font-bold text-brand' : 'text-slate-600'}`}>{r.theorem}</td>
                          <td className={`px-4 py-2.5 text-xs text-right ${r.highlight ? 'font-bold text-brand' : 'text-slate-600'}`}>{r.paper}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                  Theorem-level = retrieval of exact theorem statements<br />
                  Paper-level = retrieval of the correct paper containing the theorem
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Data Sources</h3>
                <div className="overflow-hidden rounded-xs border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">SOURCE</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">THEOREMS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {SOURCES.map(r => (
                        <tr key={r.name}>
                          <td className="px-4 py-2 text-xs text-slate-600">{r.name}</td>
                          <td className="px-4 py-2 text-xs text-right text-slate-600 font-mono">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* API */}
          <section className="space-y-4">
            <SectionHeading>REST API</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              TheoremSearch provides a production REST API for semantic theorem search.
            </p>
            <CodeBlock>{`curl https://api.theoremsearch.com/search \\
  -H "Content-Type: application/json" \\
  -d '{"query": "smooth DM stack codimension one", "n_results": 5}'`}</CodeBlock>
            <p className="text-slate-600 text-sm leading-relaxed">
              Returns theorem-level results with metadata and similarity scores.{' '}
              <Link href="/docs" className="text-brand hover:underline">Full API reference →</Link>
            </p>
          </section>

          {/* MCP */}
          <section className="space-y-4">
            <SectionHeading>MCP Tool</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              TheoremSearch is available as an MCP tool for AI agents via a single{' '}
              <code className="px-1.5 py-0.5 bg-slate-100 rounded-xs text-[13px] font-mono text-slate-700">theorem_search</code>{' '}
              tool.
            </p>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xs px-4 py-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 shrink-0">ENDPOINT</span>
              <code className="text-sm font-mono text-brand break-all min-w-0">https://api.theoremsearch.com/mcp</code>
            </div>
          </section>

        </div>

      </main>

      <SiteFooter />

    </div>
  );
}
