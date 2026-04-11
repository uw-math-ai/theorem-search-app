import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

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
    <pre className="bg-slate-900 text-slate-100 rounded-xl p-5 text-sm overflow-x-auto leading-relaxed font-mono whitespace-pre">
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
  { name: 'Giovanni Inchiostro', href: 'https://sites.math.washington.edu/~ginchios/' },
  { name: 'Vasily Ilin',         href: 'https://vilin97.github.io/' },
];

const BADGES = [
  { label: 'arXiv 2602.05216', href: 'https://arxiv.org/abs/2602.05216',                                 className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { label: 'Hugging Face',     href: 'https://huggingface.co/papers/2602.05216',                          className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { label: 'Dataset',          href: 'https://huggingface.co/datasets/uw-math-ai/theorem-search-dataset', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { label: 'MathGPT',          href: 'https://chatgpt.com/g/g-6994f4d1eb7c8191a1a8b6aad90e1449-mathgpt', className: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
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
    body: 'Each theorem is summarized into a concise natural-language description ("slogan") by DeepSeek V3, converting formal LaTeX notation into searchable English text.',
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
  { value: '~5s',  label: 'Query latency' },
];

export default function OverviewPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/math-ai-logo.jpg" alt="Math AI Lab" width={26} height={26} className="rounded-lg" />
            <span className="font-bold text-slate-900">
              Theorem<span className="text-brand">Search</span>
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/docs" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              API
            </Link>
            <Link href="/search"
              className="px-4 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors">
              Search →
            </Link>
          </nav>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Search 9 million+<br />
            <span className="text-brand">mathematical theorems</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Describe a result in natural language — TheoremSearch finds it across arXiv, the Stacks Project, and five other sources. <strong className="text-slate-700">70% more accurate than LLM search.</strong>
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

          <div className="flex flex-wrap justify-center gap-2">
            {BADGES.map(b => (
              <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                className={`px-3 py-1 text-[11px] font-semibold rounded-full border transition-colors ${b.className}`}>
                {b.label}
              </a>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/search"
              className="px-7 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors shadow-sm shadow-brand/20">
              Try TheoremSearch
            </Link>
            <a href="https://arxiv.org/abs/2602.05216" target="_blank" rel="noopener noreferrer"
              className="px-7 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
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
            className="w-full rounded-2xl border border-slate-200 shadow-xl"
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
            <SectionHeading>Why TheoremSearch?</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Mathematical knowledge is scattered across millions of papers. Important results hide as lemmas in obscure sources, and existing search tools only operate at the document level.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For mathematicians</strong>, the recent AI &ldquo;breakthroughs&rdquo; on{' '}
              <a href="https://www.erdosproblems.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Erdős problems</a>{' '}
              illustrate this: most turned out to be rediscoveries of results already in the literature. As{' '}
              <a href="https://terrytao.wordpress.com/2025/11/05/mathematical-exploration-and-discovery-at-scale/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Tao observed</a>,
              many &ldquo;open&rdquo; problems are open through obscurity, not difficulty.{' '}
              <a href="https://arxiv.org/abs/2602.10177" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">DeepMind&rsquo;s Aletheia</a>{' '}
              confirmed this — most of its correct solutions were identifications of existing literature.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For AI agents</strong>, the bottleneck is the same. Without the relevant literature, LLMs confabulate incorrect arguments. In our experiments, Claude answered a research-level algebraic geometry question incorrectly on its own, but correctly when given access to TheoremSearch as a RAG tool.
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
            <SectionHeading>Performance &amp; Coverage</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Retrieval Performance (Hit@10)</h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
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
                <div className="overflow-hidden rounded-xl border border-slate-200">
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
              <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[13px] font-mono text-slate-700">theorem_search</code>{' '}
              tool.
            </p>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 shrink-0">ENDPOINT</span>
              <code className="text-sm font-mono text-brand">https://api.theoremsearch.com/mcp</code>
            </div>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50 mt-4">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

          {/* Acknowledgements */}
          <p className="text-slate-500 text-sm leading-relaxed">
            We thank the{' '}
            <a href="https://escience.washington.edu/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">UW eScience Institute</a>{' '}
            for supporting this project, and{' '}
            <a href="https://nebius.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Nebius</a>{' '}
            for inference infrastructure — our demo uses{' '}
            <a href="https://tokenfactory.nebius.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Nebius Token Factory</a>{' '}
            with{' '}
            <a href="https://tokenfactory.nebius.com/models?search=emb&model-id=Qwen/Qwen3-Embedding-8B" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Qwen3-Embedding-8B</a>{' '}
            for query embedding. For questions or collaboration, reach out to{' '}
            <a href="mailto:vilin@uw.edu" className="text-brand hover:underline">vilin@uw.edu</a>.
          </p>

          {/* Citation */}
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest text-slate-400">CITATION</p>
            <CodeBlock>{`@article{alexander2026semantic,
  title  = {Semantic Search over 9 Million Mathematical Theorems},
  author = {Alexander, Luke and Leonen, Eric and Szeto, Sophie and Remizov, Artemii
            and Tejeda, Ignacio and Inchiostro, Giovanni and Ilin, Vasily},
  journal= {arXiv preprint arXiv:2602.05216},
  year   = {2026},
  doi    = {10.48550/arXiv.2602.05216},
  url    = {https://arxiv.org/abs/2602.05216}
}`}</CodeBlock>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} UW Math AI Lab.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
              <Link href="/improve" className="hover:text-brand transition-colors">Help us improve</Link>
              <a href="https://github.com/uw-math-ai" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">GitHub</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
