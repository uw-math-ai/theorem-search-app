'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, Info, Loader2 } from 'lucide-react';
import { Theorem } from '@/src/data/mockTheorems';
import { TheoremCard } from '@/src/components/TheoremCard';
import FilterPanel, { Filters } from '@/src/components/FilterPanel';

// Source-level filter capabilities (mirrors SOURCE_FILTERS in utils.py)
const SOURCE_FILTERS: Record<string, { authors: boolean; tags: boolean; year: boolean }> = {
  'arXiv':                       { authors: true,  tags: true,  year: true  },
  'Stacks Project':              { authors: false, tags: true,  year: false },
  'ProofWiki':                   { authors: false, tags: false, year: false },
  'An Infinitely Large Napkin':  { authors: false, tags: false, year: false },
  'CRing Project':               { authors: false, tags: false, year: false },
  'HoTT Book':                   { authors: false, tags: false, year: false },
  'Open Logic Project':          { authors: false, tags: false, year: false },
};

const RESULT_TYPES = ['corollary', 'lemma', 'proposition', 'theorem'];

const FALLBACK_YEAR_MIN = 1991;
const FALLBACK_YEAR_MAX = new Date().getFullYear();

function makeDefaultFilters(
  yearMin = FALLBACK_YEAR_MIN,
  yearMax = FALLBACK_YEAR_MAX,
  citationMax = 10_000,
): Filters {
  return {
    sources: ['arXiv'],
    types: [],
    authors: [],
    categories: [],
    publicationStatus: [],
    yearMin,
    yearMax,
    topK: 20,
    citationMin: 0,
    citationMax,
    includeUnknownCitations: true,
    paperFilter: '',
  };
}

const DEFAULT_SOURCES = ['arXiv'];

function countActiveFilters(f: Filters, yearMin: number, yearMax: number, citationMax: number): number {
  let n = 0;
  const sourcesChanged =
    f.sources.length !== DEFAULT_SOURCES.length ||
    f.sources.some(s => !DEFAULT_SOURCES.includes(s));
  if (sourcesChanged) n++;
  if (f.types.length) n++;
  if (f.authors.length) n++;
  if (f.categories.length) n++;
  if (f.publicationStatus.length) n++;
  if (f.yearMin !== yearMin || f.yearMax !== yearMax) n++;
  if (f.citationMin > 0 || f.citationMax < citationMax) n++;
  if (!f.includeUnknownCitations) n++;
  if (f.paperFilter.trim()) n++;
  return n;
}

interface Metadata {
  sources: string[];
  authorsPerSource: Record<string, string[]>;
  tagsPerSource: Record<string, string[]>;
  theoremCount: number;
  yearMin: number;
  yearMax: number;
  citationMax: number;
}

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(makeDefaultFilters());
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<Theorem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<Metadata | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = filters.topK;

  // Fetch filter metadata on mount
  useEffect(() => {
    fetch('/api/metadata')
      .then(r => r.json())
      .then((data: Metadata) => {
        setMetadata(data);
        setFilters(makeDefaultFilters(data.yearMin, data.yearMax, data.citationMax));
      })
      .catch(err => console.warn('Metadata fetch failed:', err));
  }, []);

  // Run search whenever activeQuery or filters change
  const doSearch = useCallback(async (query: string, f: Filters) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setCurrentPage(1);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters: f }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setResults(data.results);
      // Log query fire-and-forget
      fetch('/api/log-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters: f }),
      }).catch(() => {});
    } catch (err) {
      setSearchError(String(err));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (activeQuery) doSearch(activeQuery, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, filters]);

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    if (q === activeQuery) {
      // same query, force re-search
      doSearch(q, filters);
    } else {
      setActiveQuery(q);
    }
  };

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    setCurrentPage(1);
  };

  // Derive available authors/categories from selected sources (or all sources)
  const effectiveSources = useMemo(
    () => (filters.sources.length ? filters.sources : (metadata?.sources ?? [])),
    [filters.sources, metadata?.sources]
  );

  const availableAuthors = useMemo(() => {
    if (!metadata) return [];
    const set = new Set<string>();
    effectiveSources
      .filter(s => SOURCE_FILTERS[s]?.authors !== false)
      .forEach(s => (metadata.authorsPerSource[s] ?? []).forEach(a => set.add(a)));
    return [...set].sort();
  }, [effectiveSources, metadata]);

  const availableCategories = useMemo(() => {
    if (!metadata) return [];
    const set = new Set<string>();
    effectiveSources
      .filter(s => SOURCE_FILTERS[s]?.tags !== false)
      .forEach(s => (metadata.tagsPerSource[s] ?? []).forEach(t => set.add(t)));
    return [...set].sort();
  }, [effectiveSources, metadata]);

  const yearMin = metadata?.yearMin ?? FALLBACK_YEAR_MIN;
  const yearMax = metadata?.yearMax ?? FALLBACK_YEAR_MAX;
  const citationMax = metadata?.citationMax ?? 10_000;
  const activeCount = countActiveFilters(filters, yearMin, yearMax, citationMax);

  // Pagination
  const totalPages = results ? Math.ceil(results.length / resultsPerPage) : 0;
  const paginatedResults = results?.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  ) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <main className="flex-1 max-w-full mx-auto w-full px-4 py-8">

        {/* Search bar + logo */}
        <section className="mb-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/math-ai-logo.jpg"
                alt="Math AI Lab"
                width={40}
                height={40}
                className="rounded-xl shadow-sm shadow-brand/20"
              />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Theorem<span className="text-brand">Search</span>
              </h1>
            </Link>

            <div className="relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="text-slate-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Describe a theorem (e.g. The Jones polynomial is link invariant)"
                className="w-full pl-10 pr-32 py-3 bg-white border border-slate-200 rounded-2xl focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all outline-none text-base shadow-sm"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                maxLength={1000}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              />
              <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`px-3 py-1.5 border rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                    showFilters || activeCount > 0
                      ? 'bg-brand text-white border-brand'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Filter size={14} />
                  Filters
                  {activeCount > 0 && (
                    <span className="bg-white/30 rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                      {activeCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!searchInput.trim() || isSearching}
                  className="px-3 py-1.5 bg-brand text-white border border-brand rounded-lg text-xs font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter panel */}
        <div className="max-w-5xl mx-auto mb-6">
          <FilterPanel
            open={showFilters}
            filters={filters}
            setFilters={handleFilterChange}
            availableSources={metadata?.sources ?? []}
            availableTypes={RESULT_TYPES}
            availableAuthors={availableAuthors}
            availableCategories={availableCategories}
            absoluteYearMin={yearMin}
            absoluteYearMax={yearMax}
            absoluteCitationMax={citationMax}
            activeCount={activeCount}
            onClear={() => handleFilterChange(makeDefaultFilters(yearMin, yearMax, citationMax))}
          />
        </div>

        {/* Results */}
        <section className="max-w-5xl mx-auto">

          {/* States */}
          {!activeQuery && !isSearching && (
            <div className="text-center py-24">
              <p className="text-slate-400 text-sm">
                Enter a query above and press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Enter</kbd> or click <strong>Search</strong>.
              </p>
              {metadata && (
                <p className="text-slate-400 text-xs mt-2">
                  {metadata.theoremCount.toLocaleString()} theorems across {metadata.sources.length} sources.
                </p>
              )}
            </div>
          )}

          {isSearching && (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-brand" size={32} />
            </div>
          )}

          {searchError && !isSearching && (
            <div className="text-center py-16 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm font-medium">Search failed</p>
              <p className="text-red-400 text-xs mt-1">{searchError}</p>
            </div>
          )}

          {results && !isSearching && !searchError && (
            <>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400">
                  Results ({results.length})
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Info size={11} />
                  <span>{resultsPerPage} per page</span>
                </div>
              </div>

              <div className="grid gap-4">
                {paginatedResults.length > 0 ? (
                  paginatedResults.map(t => (
                    <TheoremCard key={t.slogan_id} theorem={t} activeQuery={activeQuery} filters={filters} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
                    <p className="text-slate-400">No theorems found for &ldquo;{activeQuery}&rdquo;.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  <button
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-brand text-white shadow-sm shadow-brand/20'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/math-ai-logo.jpg"
                alt="Math AI Lab"
                width={24}
                height={24}
                className="rounded shadow-sm"
              />
              <span className="font-bold text-slate-900">Theorem<span className="text-brand">Search</span></span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              An open-source semantic search tool that accelerates math research.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">Data</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="https://huggingface.co/uw-math-ai/datasets" className="hover:text-brand transition-colors">Download</a></li>
              <li><a href="/docs" className="hover:text-brand transition-colors">API</a></li>
              <li><a href="https://github.com/uw-math-ai/arXiTeX" className="hover:text-brand transition-colors">arXiTeX</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">Research</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="/overview" className="hover:text-brand transition-colors">Overview</a></li>
              <li><a href="https://arxiv.org/abs/2602.05216" className="hover:text-brand transition-colors">Preprint</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">About</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="https://sites.math.washington.edu/ai/" target="_blank" className="hover:text-brand transition-colors">UW Math AI Lab</a></li>
              <li><a href="mailto:vilin@uw.edu" className="hover:text-brand transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">
          <p>© {new Date().getFullYear()} UW Math AI Lab.</p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-slate-600">Privacy Policy</a>
            <a href="/improve" className="hover:text-slate-600">Help us Improve</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
