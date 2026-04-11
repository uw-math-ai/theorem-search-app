import Image from 'next/image';
import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — TheoremSearch' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/math-ai-logo.jpg" alt="Math AI Lab" width={26} height={26} className="rounded" />
            <span className="font-bold text-slate-900">
              Theorem<span className="text-brand">Search</span>
            </span>
          </Link>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-slate-500 text-sm font-medium">Privacy Policy</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <div className="w-10 h-0.5 bg-brand mb-2" />
          <p className="text-xs text-slate-400">Last updated: April 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">What we collect</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you search, we log the query text and the filters you applied (sources, result type, year range, etc.).
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you submit a thumbs up or thumbs down on a result, we log the vote, the query, and the theorem name and link you voted on.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you submit a report on a result, we log the selected reasons and, if you provided one, your free-text description. We also log the query and the theorem link associated with the report.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            We do not collect your name, email address, or any account information. We use your IP address solely for rate limiting. It is not stored alongside your queries, votes, or reports.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">How we use it</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Query logs help us understand how TheoremSearch is used and which areas of mathematics people search most. Feedback votes are used to evaluate and improve search quality. Reports are used to identify and fix systematic issues in slogan generation and theorem parsing. We do not sell or share this data with third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800">Contact</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Questions? Reach out to{' '}
            <a href="mailto:vilin@uw.edu" className="text-brand hover:underline">vilin@uw.edu</a>.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 mt-8">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} UW Math AI Lab.</p>
          <Link href="/search" className="hover:text-brand transition-colors">← Back to search</Link>
        </div>
      </footer>
    </div>
  );
}
