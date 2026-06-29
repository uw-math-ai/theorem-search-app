import Link from 'next/link';
import { ReactNode } from 'react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';

export const metadata = {
  title: 'TheoremGraph — Mathematical Dependency Graph',
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
  { name: 'Simon Kurgan',        href: 'https://www.linkedin.com/in/simon-kurgan/' },
  { name: 'Evan Wang',           href: 'https://github.com/aurasoph/' },
  { name: 'Eric Leonen',         href: 'https://github.com/ericleonen' },
  { name: 'Sophie Szeto',        href: 'https://www.linkedin.com/in/sophie-szeto/' },
  { name: 'Luke Alexander',      href: 'https://www.linkedin.com/in/lukealexanderluke/' },
  { name: 'Artemii Remizov',     href: 'https://www.linkedin.com/in/artemii-remizov-62783631b/' },
  { name: 'Jarod Alper',         href: 'https://sites.math.washington.edu//~jarod/' },
  { name: 'Giovanni Inchiostro', href: 'https://sites.math.washington.edu/~ginchios/' },
  { name: 'Vasily Ilin',         href: 'https://vilin97.github.io/' },
];

const STATS = [
  { value: '11.7M', label: 'Theorems indexed' },
  { value: '18.3M', label: 'Dependency edges' },
  { value: '388k',  label: 'Lean declarations' },
  { value: '47,952', label: 'Formal-informal matches' },
];

const HOW_IT_WORKS = [
  {
    title: 'Parse informal statements.',
    body: 'We extract over 11.7 million theorem-like environments from mathematics arXiv papers using a regex-based parser, and recover 18.3 million candidate directed dependency edges. We use deterministic, heuristic, and notation-based parsing methods, and label each edge with the parser type.',
  },
  {
    title: 'Extract the formal graph.',
    body: 'LeanGraph extracts typed declaration-level dependencies from Mathlib4 and 25 open-source Lean projects, yielding 388,105 nodes and 11.3 million typed edges across six semantic categories.',
  },
  {
    title: 'Generate slogans and embed.',
    body: 'Every formal and informal statement we extract is summarized into a concise natural-language slogan by Qwen3-235B and embedded with Qwen3-Embedding-8B into a shared semantic space.',
  },
  {
    title: 'Bridging the corpora.',
    body: 'A cross-modal nearest-neighbor sweep proposes (informal, formal) candidate matches, and a GPT-5.4 judge affirms 47,952 matches above a 0.8 cosine similarity floor.',
  },
];

const EXTRACTORS = [
  { extractor: 'Deterministic', edges: '5.23M', precision: '98.8%' },
  { extractor: 'Heuristic',     edges: '6.47M', precision: '76.6%' },
  { extractor: 'Notation',      edges: '7.88M', precision: '42.7%' },
  { extractor: 'Any (total)',   edges: '18.3M', precision: '68.1%' },
];

const EDGE_TYPES = [
  { type: 'proof',   description: 'Used inside a theorem proof term' },
  { type: 'sig',     description: 'Appears in a type signature' },
  { type: 'def',     description: 'Used in a non-Prop definition body' },
  { type: 'field',   description: 'Referenced in a structure field type' },
  { type: 'extends', description: 'Structure or class inheritance' },
  { type: 'docref',  description: 'Backtick reference in a docstring' },
];

export default function TheoremGraphPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      <SiteHeader />

      <main>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Search 18 million+<br />
            <span className="text-brand">mathematical dependencies</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            A unified statement-level dependency graph spanning both informal and formal mathematics, including
            11.7 million arXiv statements linked to Mathlib through a shared embedding space.
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
            <a href="https://huggingface.co/datasets/uw-math-ai/math-graph" target="_blank" rel="noopener noreferrer"
              className="px-7 py-2.5 bg-brand text-white rounded-xs font-semibold text-sm hover:bg-brand/90 transition-colors">
              Dataset
            </a>
            <a href="https://arxiv.org/abs/2606.25363" target="_blank" rel="noopener noreferrer"
              className="px-7 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xs font-semibold text-sm hover:bg-slate-50 transition-colors">
              Read the paper →
            </a>
          </div>
        </section>

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
              Mathematical knowledge is organized around statements and their dependencies, but this structure is
              exposed unevenly. Informal papers cite mostly at the document level, while formal proof assistants
              like Lean record fine-grained dependencies over a much smaller body of mathematics.
              This asymmetry limits attribution, duplication detection, and automated formalization.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For mathematicians</strong>, a unified dependency graph makes it possible to check whether
              a result is already known and trace exactly which lemmas a proof relies on. A
              <a href="https://arxiv.org/abs/2412.03775" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline"> 2024 study</a>{' '}
              found that 2.4% of withdrawn arXiv submissions were self-identified as non-novel, which might have been identified
              earlier with improved cross-paper dependency tracking.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>For AI agents</strong>, the graph gives neural theorem provers and autoformalization
              tools a access to mathematics as a graph. Instead of retrieving flat semantic neighbors, an agent
              can walk the graph to find connected lemmas and related formalizations across informal and formal
              spaces.
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

          {/* Overview */}
          <section className="space-y-5">
            <SectionHeading>Overview</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Informal extractors */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Informal Dependency Extractors</h3>
                <div className="overflow-hidden rounded-xs border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">EXTRACTOR</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">EDGES</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">PRECISION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {EXTRACTORS.map((r, i) => (
                        <tr key={r.extractor} className={i === EXTRACTORS.length - 1 ? 'bg-brand/5' : ''}>
                          <td className={`px-4 py-2.5 text-xs ${i === EXTRACTORS.length - 1 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{r.extractor}</td>
                          <td className={`px-4 py-2.5 text-xs text-right font-mono ${i === EXTRACTORS.length - 1 ? 'font-bold text-brand' : 'text-slate-600'}`}>{r.edges}</td>
                          <td className={`px-4 py-2.5 text-xs text-right ${i === EXTRACTORS.length - 1 ? 'font-bold text-brand' : 'text-slate-600'}`}>{r.precision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                  Precision estimated by LLM judge (Kimi K2.5) on 500 sampled arXiv papers.
                </p>
              </div>

              {/* Formal edge types */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Formal Edge Types</h3>
                <div className="overflow-hidden rounded-xs border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">TYPE</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-widest text-slate-400">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {EDGE_TYPES.map(r => (
                        <tr key={r.type}>
                          <td className="px-4 py-2 text-xs font-mono text-brand font-medium">{r.type}</td>
                          <td className="px-4 py-2 text-xs text-slate-600">{r.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                  LeanGraph extracts 388,105 nodes and 11.3M typed edges across 25 Lean projects
                  (Mathlib v4.27-v4.29 plus 24 community formalizations).
                </p>
              </div>

            </div>
          </section>

          {/* REST API */}
          <section className="space-y-4">
            <SectionHeading>REST API</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              TheoremGraph provides a REST API for semantic search and dependency graph traversal.
            </p>
            <CodeBlock>{`curl "https://api.theoremsearch.com/graph/paper?external_id=2301.00001"`}</CodeBlock>
            <p className="text-slate-600 text-sm leading-relaxed">
              Returns all statements and dependency edges for an arXiv paper or Lean repository.{' '}
              <Link href="/docs" className="text-brand hover:underline">Full API reference →</Link>
            </p>
          </section>

          {/* MCP */}
          <section className="space-y-4">
            <SectionHeading>MCP Tool</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              TheoremGraph is also available as an MCP tool for AI agents via a single{' '}
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

      <SiteFooter product="graph" />

    </div>
  );
}
