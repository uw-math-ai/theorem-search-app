'use client';

import React, { useState, useDeferredValue } from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanAuthors } from '../lib/latexClean';

export interface Filters {
  sources: string[];
  types: string[];
  authors: string[];
  categories: string[];
  publicationStatus: string[];
  yearMin: number;
  yearMax: number;
  topK: number;
  citationMin: number;
  citationMax: number;
  includeUnknownCitations: boolean;
  paperFilter: string;
}

interface FilterPanelProps {
  open: boolean;
  filters: Filters;
  setFilters: (f: Filters) => void;
  availableSources: string[];
  availableTypes: string[];
  availableAuthors: string[];
  availableCategories: string[];
  absoluteYearMin: number;
  absoluteYearMax: number;
  absoluteCitationMax: number;
  activeCount: number;
  onClear: () => void;
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function PillGroup({
  label,
  options,
  selected,
  onChange,
  displayFn = (s: string) => s,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  displayFn?: (s: string) => string;
}) {
  if (!options.length) return null;
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onChange(toggleItem(selected, opt))}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                active
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand/50 hover:text-brand'
              }`}
            >
              {displayFn(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const VISIBLE_LIMIT = 12;

function SearchablePillGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  if (!options.length) return null;

  const q = deferredQuery.toLowerCase();
  const matched = q
    ? options.filter(o => o.toLowerCase().includes(q))
    : options.slice(0, VISIBLE_LIMIT);

  // Always show selected items at the top, then matched unselected
  const selectedSet = new Set(selected);
  const selectedOptions = options.filter(o => selectedSet.has(o));
  const unselectedMatched = matched.filter(o => !selectedSet.has(o));
  const visible = [...selectedOptions, ...unselectedMatched].slice(0, q ? undefined : VISIBLE_LIMIT);
  const hiddenCount = options.length - visible.length;

  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">{label}</p>
      <div className="relative mb-2">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${options.length} categories…`}
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-brand bg-slate-50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={11} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(opt => {
          const active = selectedSet.has(opt);
          return (
            <button
              key={opt}
              onClick={() => onChange(toggleItem(selected, opt))}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                active
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand/50 hover:text-brand'
              }`}
            >
              {opt}
            </button>
          );
        })}
        {!q && hiddenCount > 0 && (
          <span className="px-2.5 py-1 text-[11px] text-slate-400 italic">
            +{hiddenCount} more — type to search
          </span>
        )}
        {q && visible.length === 0 && (
          <span className="text-[11px] text-slate-400 italic">No matches</span>
        )}
      </div>
      {selected.length > 0 && (
        <p className="mt-1.5 text-[10px] text-brand">{selected.length} selected</p>
      )}
    </div>
  );
}

const AUTHOR_VISIBLE_LIMIT = 8;

function AuthorSelect({
  options,
  selected,
  onChange,
  fillHeight = false,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  fillHeight?: boolean;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  if (!options.length) return null;

  const q = deferredQuery.toLowerCase();
  const matched = q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  const selectedSet = new Set(selected);
  const selectedOptions = options.filter(o => selectedSet.has(o));
  const unselectedMatched = matched.filter(o => !selectedSet.has(o));
  const visible = [...selectedOptions, ...unselectedMatched].slice(0, q ? undefined : AUTHOR_VISIBLE_LIMIT);
  const hiddenCount = options.length - visible.length;

  return (
    <div className={fillHeight ? 'flex flex-col h-full' : undefined}>
      <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">AUTHORS</p>
      <div className="relative mb-1.5">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${options.length} authors…`}
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-brand bg-slate-50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={11} />
          </button>
        )}
      </div>
      <div className={`overflow-y-auto rounded border border-slate-200 bg-white divide-y divide-slate-100 ${fillHeight ? 'flex-1 min-h-0' : 'max-h-36'}`}>
        {visible.map(author => (
          <label
            key={author}
            className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(author)}
              onChange={() => onChange(toggleItem(selected, author))}
              className="accent-brand w-3.5 h-3.5 shrink-0"
            />
            <span className="text-xs text-slate-700 truncate">{author}</span>
          </label>
        ))}
        {!q && hiddenCount > 0 && (
          <div className="px-3 py-1.5 text-[10px] text-slate-400 italic">
            +{hiddenCount} more — type to search
          </div>
        )}
        {q && visible.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-400 italic">No matches</div>
        )}
      </div>
      {selected.length > 0 && (
        <p className="mt-1 text-[10px] text-brand">{selected.length} selected</p>
      )}
    </div>
  );
}

export default function FilterPanel({
  open,
  filters,
  setFilters,
  availableSources,
  availableTypes,
  availableAuthors,
  availableCategories,
  absoluteYearMin,
  absoluteYearMax,
  absoluteCitationMax,
  activeCount,
  onClear,
}: FilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-slate-200 rounded p-5 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Filters{' '}
              {activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-brand text-white rounded-full text-[10px]">
                  {activeCount}
                </span>
              )}
            </span>
            {activeCount > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={11} /> Clear all
              </button>
            )}
          </div>

          {/* Main filters: Source, Category, Results per Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <PillGroup
              label="SOURCE"
              options={availableSources}
              selected={filters.sources}
              onChange={sources => setFilters({ ...filters, sources })}
            />
            <SearchablePillGroup
              label="CATEGORY"
              options={availableCategories}
              selected={filters.categories}
              onChange={categories => setFilters({ ...filters, categories })}
            />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">
                RESULTS PER SEARCH
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={filters.topK}
                  onChange={e => setFilters({ ...filters, topK: Number(e.target.value) })}
                  className="flex-1 accent-brand"
                />
                <span className="text-sm font-semibold text-slate-700 w-6 text-right">{filters.topK}</span>
              </div>
            </div>
          </div>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <motion.span
              animate={{ rotate: showAdvanced ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              ▶
            </motion.span>
            Advanced filters
          </button>

          {/* Advanced filters: Result Type, Authors, Year Range, Paper Filter, Citations */}
          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Left: Result Type, Publication Status, Paper/ArXiv ID */}
                    <div className="space-y-4">
                      <PillGroup
                        label="RESULT TYPE"
                        options={availableTypes}
                        selected={filters.types}
                        onChange={types => setFilters({ ...filters, types })}
                        displayFn={capitalize}
                      />

                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">PUBLICATION STATUS</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(['All', 'Published', 'Preprint'] as const).map(opt => {
                            const active = opt === 'All'
                              ? filters.publicationStatus.length === 0
                              : filters.publicationStatus.includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => setFilters({
                                  ...filters,
                                  publicationStatus: opt === 'All' || active ? [] : [opt],
                                })}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                  active
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand/50 hover:text-brand'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">PAPER / ARXIV ID</p>
                        <input
                          type="text"
                          value={filters.paperFilter}
                          onChange={e => setFilters({ ...filters, paperFilter: e.target.value })}
                          placeholder="e.g. 2401.12345, Finite Hilbert stability"
                          maxLength={500}
                          className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand bg-white"
                        />
                        <p className="mt-1 text-[10px] text-slate-400">Comma-separated arXiv IDs or title keywords</p>
                      </div>
                    </div>

                    {/* Middle: Authors spanning full height */}
                    <AuthorSelect
                      options={cleanAuthors(availableAuthors)}
                      selected={filters.authors}
                      onChange={authors => setFilters({ ...filters, authors })}
                    />

                    {/* Right: Year Range, Citations */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">YEAR RANGE</p>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-[10px] text-slate-400">From</label>
                            <input
                              type="number"
                              min={absoluteYearMin}
                              max={filters.yearMax}
                              value={filters.yearMin}
                              onChange={e => setFilters({ ...filters, yearMin: Math.min(Number(e.target.value), filters.yearMax) })}
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-brand"
                            />
                          </div>
                          <span className="text-slate-300 mt-5">—</span>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-[10px] text-slate-400">To</label>
                            <input
                              type="number"
                              min={filters.yearMin}
                              max={absoluteYearMax}
                              value={filters.yearMax}
                              onChange={e => setFilters({ ...filters, yearMax: Math.max(Number(e.target.value), filters.yearMin) })}
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-brand"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">CITATIONS</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-[10px] text-slate-400">Min</label>
                            <input
                              type="number"
                              min={0}
                              max={filters.citationMax}
                              value={filters.citationMin}
                              onChange={e => setFilters({ ...filters, citationMin: Math.min(Number(e.target.value), filters.citationMax) })}
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-brand"
                            />
                          </div>
                          <span className="text-slate-300 mt-5">—</span>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-[10px] text-slate-400">Max</label>
                            <input
                              type="number"
                              min={filters.citationMin}
                              max={absoluteCitationMax}
                              value={filters.citationMax}
                              onChange={e => setFilters({ ...filters, citationMax: Math.max(Number(e.target.value), filters.citationMin) })}
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-brand"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.includeUnknownCitations}
                            onChange={e => setFilters({ ...filters, includeUnknownCitations: e.target.checked })}
                            className="accent-brand w-3.5 h-3.5 shrink-0"
                          />
                          <span className="text-[11px] text-slate-600">Include papers with unknown citation count</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
