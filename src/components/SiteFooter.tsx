import Image from 'next/image';
import Link from 'next/link';

type Product = 'search' | 'graph';

const BRAND = {
  search: {
    href:  '/',
    label: 'Search',
    blurb: 'An open-source semantic search tool that accelerates math research.',
  },
  graph: {
    href:  '/theorem-graph',
    label: 'Graph',
    blurb: 'A dependency graph across formal and informal mathematics.',
  },
};

export function SiteFooter({ product = 'search' }: { product?: Product }) {
  const brand = BRAND[product];
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-20">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-3 md:col-span-1">
          <Link href={brand.href} className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <Image src="/math-ai-mark.svg" alt="Math AI Lab" width={24} height={24} className="rounded-xs" />
            <span className="font-bold text-slate-900">
              Theorem<span className="text-brand">{brand.label}</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 leading-relaxed">
            {brand.blurb}
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">Data</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <a href="/datasets" className="hover:text-brand transition-colors">
                Download
              </a>
            </li>
            <li>
              <a href="/docs" className="hover:text-brand transition-colors">
                API
              </a>
            </li>
            <li>
              <a href="https://github.com/uw-math-ai/arXiTeX" className="hover:text-brand transition-colors">
                arXiTeX
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">Preprints</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <a href="https://arxiv.org/abs/2602.05216" target="_blank" className="hover:text-brand transition-colors">
                TheoremSearch
              </a>
            </li>
            <li>
              <Link href="https://arxiv.org/abs/2606.25363" target="_blank" className="hover:text-brand transition-colors">
                TheoremGraph
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">About</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <a
                href="https://sites.math.washington.edu/ai/"
                target="_blank"
                className="hover:text-brand transition-colors"
              >
                UW Math AI Lab
              </a>
            </li>
            <li>
              <a href="mailto:vilin@uw.edu" className="hover:text-brand transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">
        <p>© {new Date().getFullYear()} UW Math AI Lab.</p>
        <div className="flex items-center gap-6">
          <a href="/privacy" className="hover:text-slate-600">
            Privacy Policy
          </a>
          <a href="/improve" className="hover:text-slate-600">
            Help us Improve
          </a>
          <a href="https://github.com/uw-math-ai" target="_blank" className="hover:text-slate-600">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
