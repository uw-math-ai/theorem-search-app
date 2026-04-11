'use client';

import React, { useState } from 'react';
import { Theorem } from '../data/mockTheorems';
import { Filters } from './FilterPanel';
import { ThumbsUp, ThumbsDown, User, BookOpen, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MathJax } from 'better-react-mathjax';
import { cleanLatexForDisplay, cleanTheoremName, cleanAuthors } from '../lib/latexClean';

interface TheoremCardProps {
  theorem: Theorem;
  activeQuery: string;
  filters: Filters;
}

export const TheoremCard: React.FC<TheoremCardProps> = ({ theorem, activeQuery, filters }) => {
  const [showSlogan, setShowSlogan] = useState(true);
  const [showLatex, setShowLatex] = useState(false);
  const [vote, setVote] = useState<1 | -1 | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [reported, setReported] = useState(false);

  const cleanedBody = cleanLatexForDisplay(theorem.theorem_body);
  const displayName = cleanTheoremName(theorem.theorem_name);

  const REPORT_REASONS = [
    "Slogan and precise statement don't align",
    'LaTeX is malformed',
    'Slogan is not descriptive',
    'Incorrect theorem type',
    'Other',
  ];

  const toggleReason = (reason: string) =>
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );

  const submitReport = async () => {
    if (selectedReasons.length === 0 || reported) return;
    setReported(true);
    setShowReport(false);
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slogan_id: theorem.slogan_id,
          reasons: selectedReasons,
          other_note: selectedReasons.includes('Other') ? otherText.trim() : null,
          query: activeQuery,
          url: theorem.link,
        }),
      });
    } catch {
      // fire-and-forget
    }
  };

  const submitFeedback = async (v: 1 | -1) => {
    if (vote !== null) return;
    setVote(v);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote: v,
          slogan_id: theorem.slogan_id,
          query: activeQuery,
          url: theorem.link,
          theorem_name: theorem.theorem_name,
          authors: theorem.authors,
          filters,
        }),
      });
    } catch {
      // fire-and-forget; don't undo the optimistic UI state
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded overflow-hidden hover:border-slate-300 transition-all duration-200"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 tracking-tight">
            <span className="truncate">
              {displayName}
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
                <span className="truncate max-w-35">{cleanAuthors(theorem.authors).join(', ')}</span>
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
            <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                onClick={() => setShowSlogan(v => !v)}
                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                  showSlogan
                    ? 'bg-white text-brand'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Slogan
              </button>
              <button
                onClick={() => setShowLatex(v => !v)}
                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                  showLatex
                    ? 'bg-white text-brand'
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
              className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-brand hover:bg-brand hover:text-white transition-all active:scale-95"
            >
              Link
            </a>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Feedback & Report */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => submitFeedback(1)}
              disabled={vote !== null}
              title={vote === 1 ? 'Upvoted' : 'Upvote'}
              className={`p-1.5 transition-colors ${
                vote === 1
                  ? 'text-brand'
                  : vote !== null
                  ? 'text-slate-200 cursor-default'
                  : 'text-slate-400 hover:text-brand'
              }`}
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={() => submitFeedback(-1)}
              disabled={vote !== null}
              title={vote === -1 ? 'Downvoted' : 'Downvote'}
              className={`p-1.5 transition-colors ${
                vote === -1
                  ? 'text-red-500'
                  : vote !== null
                  ? 'text-slate-200 cursor-default'
                  : 'text-slate-400 hover:text-red-500'
              }`}
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={() => !reported && setShowReport(v => !v)}
              disabled={reported}
              title={reported ? 'Reported' : 'Report an issue'}
              className={`p-1.5 transition-colors ${
                reported
                  ? 'text-orange-400 cursor-default'
                  : showReport
                  ? 'text-orange-400'
                  : 'text-slate-400 hover:text-orange-400'
              }`}
            >
              <Flag size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Report panel */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-b border-slate-100"
          >
            <div className="px-4 py-3 bg-orange-50/50 space-y-2">
              <p className="text-[10px] font-bold tracking-widest text-slate-400">REPORT AN ISSUE</p>
              <div className="space-y-1.5">
                {REPORT_REASONS.map(reason => (
                  <div key={reason}>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason)}
                        onChange={() => toggleReason(reason)}
                        className="accent-orange-400 w-3 h-3"
                      />
                      <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">
                        {reason}
                      </span>
                    </label>
                    {reason === 'Other' && selectedReasons.includes('Other') && (
                      <input
                        type="text"
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        placeholder="Please describe the issue…"
                        maxLength={500}
                        autoFocus
                        className="mt-1.5 ml-5 w-[calc(100%-1.25rem)] border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-orange-300 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => { setShowReport(false); setSelectedReasons([]); setOtherText(''); }}
                  className="px-2.5 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={selectedReasons.length === 0}
                  className="px-2.5 py-1 text-[10px] font-bold bg-orange-400 text-white rounded hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="py-3 px-4 bg-slate-50 rounded border border-slate-100 overflow-x-auto">
              <p className="text-[10px] font-bold text-slate-500 mb-1.5">{displayName}</p>
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
