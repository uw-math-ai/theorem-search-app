'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useAnimate } from 'motion/react';
import { ArrowDownUp } from 'lucide-react';
import { MobileNav } from '@/src/components/MobileNav';

const NAV_ITEMS = [
  { href: '/datasets', label: 'Datasets', key: 'datasets' },
  { href: '/docs', label: 'API', key: 'docs' },
] as const;

type ActiveKey = (typeof NAV_ITEMS)[number]['key'];

const BRAND = {
  search: { href: '/',              suffix: 'Search', other: '/theorem-graph', otherLabel: 'TheoremGraph' },
  graph:  { href: '/theorem-graph', suffix: 'Graph',  other: '/',              otherLabel: 'TheoremSearch' },
};

function deriveProduct(pathname: string): 'search' | 'graph' {
  return pathname.startsWith('/theorem-graph') ? 'graph' : 'search';
}

function deriveActive(pathname: string): ActiveKey | undefined {
  if (pathname.startsWith('/datasets')) return 'datasets';
  if (pathname.startsWith('/docs'))     return 'docs';
  return undefined;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router   = useRouter();
  const product  = deriveProduct(pathname);
  const active   = deriveActive(pathname);
  const brand    = BRAND[product];

  const [scope, animate] = useAnimate();

  const handleSwap = async () => {
    if (!scope.current) return;
    await animate(scope.current, { opacity: 0, y: -7 }, { duration: 0.15, ease: 'easeIn' });
    router.push(brand.other);
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-3.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between">

        <div className="flex items-center gap-1.5">
          <Link href={brand.href} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/math-ai-mark.svg" alt="Math AI Lab" width={26} height={26} className="rounded-xs" />
            <span className="font-bold text-slate-900">
              Theorem
              <motion.span
                ref={scope}
                className="text-brand inline-block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {brand.suffix}
              </motion.span>
            </span>
          </Link>
          <button
            onClick={handleSwap}
            title={`Switch to ${brand.otherLabel}`}
            className="p-1 text-slate-300 hover:text-brand transition-colors"
          >
            <ArrowDownUp size={12} />
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-5">
          {NAV_ITEMS.map(item =>
            active === item.key ? (
              <span key={item.key} className="text-sm font-semibold text-brand">
                {item.label}
              </span>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
          <Link
            href="/search"
            className="px-4 py-1.5 bg-brand text-white rounded-xs text-xs font-bold hover:bg-brand/90 transition-colors"
          >
            Search →
          </Link>
        </nav>

        <MobileNav
          items={[
            { href: '/datasets',      label: 'Data' },
            { href: '/docs',          label: 'API' },
            { href: '/search',        label: 'Search' },
          ]}
        />
      </div>
    </header>
  );
}
