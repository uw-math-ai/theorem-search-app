'use client';

import React, { useState } from 'react';
import { Theorem } from '../data/mockTheorems';
import { ThumbsUp, ThumbsDown, User, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { MathJax } from 'better-react-mathjax';
import { cleanLatexForDisplay } from '../lib/latexClean';

interface TheoremCardProps {
  theorem: Theorem;
}

export const TheoremCard: React.FC<TheoremCardProps> = ({ theorem }) => {
  const [showSlogan, setShowSlogan] = useState(true);
  const [showLatex, setShowLatex] = useState(false);

  const cleanedBody = cleanLatexForDisplay(theorem.theorem_body);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm hover:border-slate-300 transition-all duration-200"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 tracking-tight">
            <span className="truncate">
              {theorem.theorem_name}
              {theorem.title && (
                <span className="ml-1.5 font-normal text-slate-500 italic">
                  — {theorem.title}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-medium text-slate-400">
            {theorem.authors.length > 0 && (
              <div className="flex items-center gap-1">
                <User size={10} />
                <span className="truncate max-w-35">{theorem.authors.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <BookOpen size={10} />
              <span className="italic truncate max-w-45">
                {theorem.source}
                {theorem.year ? ` (${theorem.year})` : ''}
              </span>
            </div>
            {theorem.primary_category && (
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-semibold text-slate-500">
                {theorem.primary_category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Toggles & Link */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setShowSlogan(v => !v)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  showSlogan
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Slogan
              </button>
              <button
                onClick={() => setShowLatex(v => !v)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  showLatex
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Precise Statement
              </button>
            </div>

            <a
              href={theorem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-brand hover:bg-brand hover:text-white transition-all shadow-sm active:scale-95"
            >
              Link
            </a>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-brand transition-colors" title="Upvote">
              <ThumbsUp size={14} />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Downvote">
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: (showSlogan || showLatex) ? 'auto' : 0,
          opacity: (showSlogan || showLatex) ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-4 py-3 space-y-3">
          {/* Slogan */}
          <motion.div
            initial={false}
            animate={{ height: showSlogan ? 'auto' : 0, opacity: showSlogan ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-slate-600 leading-relaxed text-xs">{theorem.theorem_slogan}</p>
          </motion.div>

          {/* Precise Statement */}
          <motion.div
            initial={false}
            animate={{ height: showLatex ? 'auto' : 0, opacity: showLatex ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="py-3 px-4 bg-slate-50 rounded-lg border border-slate-100 overflow-x-auto">
              <p className="text-[10px] font-bold text-slate-500 mb-1.5">{theorem.theorem_name}</p>
              <div className="text-sm text-slate-800">
                <MathJax dynamic>{cleanedBody}</MathJax>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
