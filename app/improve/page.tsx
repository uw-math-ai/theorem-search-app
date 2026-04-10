import Image from 'next/image';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export const metadata = { title: 'Help us Improve — TheoremSearch' };

export default function ImprovePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/math-ai-logo.jpg" alt="Math AI Lab" width={26} height={26} className="rounded-lg" />
            <span className="font-bold text-slate-900">
              Theorem<span className="text-brand">Search</span>
            </span>
          </Link>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-slate-500 text-sm font-medium">Help us Improve</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Help us Improve</h1>
          <div className="w-10 h-0.5 bg-brand" />
        </div>

        <section className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            TheoremSearch is an ongoing research project. Your feedback directly shapes how the search model is evaluated and improved.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">How to give feedback</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every search result has a pair of feedback buttons in the top-right corner of its card:
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3.5">
              <div className="p-1.5 text-brand mt-0.5">
                <ThumbsUp size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Thumbs up</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This result is relevant — the theorem matches what you were looking for.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3.5">
              <div className="p-1.5 text-red-500 mt-0.5">
                <ThumbsDown size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Thumbs down</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This result is not relevant — the theorem does not match your query.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Each vote is recorded once per result. We store the query, the theorem, and your vote — no personal information.
            See our <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link> for details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">How it helps</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Votes give us ground-truth relevance labels that we use to measure and benchmark retrieval quality — and to guide future improvements to the embedding model, reranking, and slogan generation pipeline.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Even a small number of votes on diverse queries is valuable. If you use TheoremSearch regularly, taking a moment to vote on results is one of the most useful things you can do.
          </p>
        </section>

        <div className="pt-2">
          <Link href="/"
            className="inline-block px-6 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors shadow-sm shadow-brand/20">
            Start searching
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 mt-8">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} UW Math AI Lab.</p>
          <Link href="/" className="hover:text-brand transition-colors">← Back to search</Link>
        </div>
      </footer>
    </div>
  );
}
