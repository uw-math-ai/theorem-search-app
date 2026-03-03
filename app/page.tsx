"use client";

import React, { useState } from 'react';
import { Search, Filter, Info, Github } from 'lucide-react';
import { mockTheorems } from '@/src/data/mockTheorems';
import { TheoremCard } from '@/src/components/TheoremCard';
import { motion } from 'motion/react';
import { MathJaxContext } from 'better-react-mathjax';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTheorems = mockTheorems.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.prose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="min-h-screen flex flex-col">
        <MathJaxContext>
        {/* Navigation / Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-full mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-xl">
                Σ
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">
                Theorem<span className="text-brand">Search</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
                <a href="#" className="hover:text-brand transition-colors">Explore</a>
                <a href="#" className="hover:text-brand transition-colors">Datasets</a>
                <a href="#" className="hover:text-brand transition-colors">About</a>
              </nav>
              <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-full mx-auto w-full px-4 py-4">
          {/* Search Section */}
          <section className="mb-4">
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="text-slate-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search for a theorem..."
                className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none text-base shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors">
                  <Filter size={14} />
                  Filters
                </button>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className="space-y-1">
            <div className="flex items-center justify-between mb-1 px-1">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Results ({filteredTheorems.length})
              </h3>
              <div className="flex items-center gap-2 text-[9px] text-slate-400">
                <Info size={10} />
                <span>5 results per page</span>
              </div>
            </div>

            <div className="grid gap-6">
              {filteredTheorems.length > 0 ? (
                filteredTheorems.map((theorem) => (
                  <TheoremCard key={theorem.id} theorem={theorem} />
                ))
              ) : (
                <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
                  <p className="text-slate-400">No theorems found matching your search.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredTheorems.length > 0 && (
              <div className="flex justify-center mt-12 gap-2">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium shadow-sm shadow-brand/20">
                  1
                </button>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                  2
                </button>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Next
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-12 mt-20">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  Σ
                </div>
                <span className="font-bold text-slate-900">TheoremSearch</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                An open-source project dedicated to making mathematical knowledge more accessible through semantic search and plain-language summaries.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-600">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 mt-12 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} UW Math AI Lab
          </div>
        </footer>
        </MathJaxContext>
      </div>
  );
}
