import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Theorem } from '../data/mockTheorems';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { ExternalLink, ThumbsUp, ThumbsDown, Flag, User, BookOpen, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { MathJax } from 'better-react-mathjax';

interface TheoremCardProps {
  theorem: Theorem;
}

export const TheoremCard: React.FC<TheoremCardProps> = ({ theorem }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(75); // Percentage of width for the prose side
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const actionsWidth = 40; // The fixed width of the actions panel
    const availableWidth = containerRect.width - actionsWidth;
    
    if (availableWidth <= 0) return;

    const relativeX = e.clientX - containerRect.left;
    let newPercent = (relativeX / availableWidth) * 100;
    
    // Constrain between 15% and 85%
    newPercent = Math.max(15, Math.min(85, newPercent));
    setSplitPercent(newPercent);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const snapToProse = () => {
    if (!isDragging) setSplitPercent(75);
  };

  const snapToLatex = () => {
    if (!isDragging) setSplitPercent(25);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm hover:border-slate-300 transition-all duration-200"
    >
      {/* Header Info */}
      <div className="px-3 py-1 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
          <div className="flex items-center gap-1">
            <User size={11} />
            <span className="truncate max-w-[150px]">{theorem.authors.join(', ')}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen size={11} />
            <span className="italic truncate max-w-[220px]">{theorem.source} ({theorem.year})</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={theorem.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand hover:opacity-80 flex items-center gap-1 text-[10px] font-bold"
          >
            Source <ExternalLink size={10} />
          </a>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-brand transition-colors"
            title={isExpanded ? "Show less" : "Show more"}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`flex flex-col md:flex-row ${isExpanded ? '' : 'min-h-[60px]'} relative select-none`}
      >
        {/* Left: Prose */}
        <div 
          onClick={snapToProse}
          style={{ width: `${splitPercent}%` }}
          className={`px-3 py-2 border-r border-slate-100 cursor-pointer transition-[background-color] duration-300 overflow-hidden ${
            splitPercent > 50 ? 'bg-white' : 'bg-slate-50/20'
          }`}
        >
          <h3 className={`text-sm font-bold text-slate-900 mb-0.5 leading-tight ${splitPercent > 30 ? '' : 'truncate'}`}>
            {theorem.title}
          </h3>
          <p className={`text-slate-600 leading-normal text-xs ${isExpanded ? '' : 'line-clamp-2'} ${splitPercent > 30 ? '' : 'truncate'}`}>
            {theorem.prose}
          </p>
        </div>

        {/* Draggable Divider */}
        <div 
          onMouseDown={handleMouseDown}
          className={`hidden md:flex absolute top-0 bottom-0 w-1.5 cursor-col-resize items-center justify-center z-10 group hover:bg-brand/10 transition-colors`}
          style={{ left: `calc(${splitPercent}% - 3px)` }}
        >
          <div className={`w-0.5 h-4 bg-slate-200 group-hover:bg-brand rounded-full transition-colors ${isDragging ? 'bg-brand' : ''}`} />
        </div>

        {/* Middle: LaTeX */}
          <div 
            onClick={snapToLatex}
            style={{ width: `${100 - splitPercent}%` }}
            className={`px-3 py-2 flex items-center justify-center border-r border-slate-100 cursor-pointer transition-[background-color] duration-300 overflow-hidden ${
              splitPercent <= 50 ? 'bg-white' : 'bg-slate-50/5'
            } ${isExpanded ? '' : 'overflow-hidden'}`}
          >
            <div className={`text-center max-w-full py-1 text-sm ${isExpanded ? '' : 'overflow-x-auto'} ${splitPercent <= 50 ? '' : 'scale-90 opacity-50'}`}>
              <MathJax inline={true}>
                {theorem.latex}
              </MathJax>
            </div>
          </div>
        

        {/* Right: Actions Panel */}
        <div className="flex-none w-10 bg-slate-50/30 flex flex-col items-center justify-center gap-1 py-2 z-20">
          <button className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-400 hover:text-brand shadow-sm transition-colors" title="Upvote">
            <ThumbsUp size={12} />
          </button>
          <button className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-400 hover:text-red-600 shadow-sm transition-colors" title="Downvote">
            <ThumbsDown size={12} />
          </button>
          <button className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-400 hover:text-orange-600 shadow-sm transition-colors" title="Flag">
            <Flag size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
