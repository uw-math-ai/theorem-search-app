'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Loader2, Network } from 'lucide-react';
import { apiStatement, edgeColor, type Formality, type Neighbor, type Statement } from '../lib/graphApi';

const W = 320;
const H = 210;
const CX = W / 2;
const CY = H / 2;
const R = 78;           // neighbor ring radius
const NODE_R = 9;
const MAX_PER_SIDE = 8; // dependencies on the left, dependents on the right

// Spread `n` nodes over an arc on the left (side = -1) or right (side = 1).
function arcPos(i: number, n: number, side: 1 | -1) {
  const spread = Math.min(Math.PI * 0.8, 0.35 * Math.max(n - 1, 1));
  const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
  return { x: CX + side * R * Math.cos(a), y: CY + R * Math.sin(a) };
}

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

interface GraphPeekProps {
  /** Statement to center on; changes when the user picks another result. */
  statementId: string | null;
  formality?: Formality;
}

// The panel starts expanded only where the results column leaves room for it.
const WIDE_QUERY = '(min-width: 1536px)';
function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const isWide = () => window.matchMedia(WIDE_QUERY).matches;

interface Loaded {
  id: string;
  center: Statement | null;
  neighbors: Neighbor[];
}

/** Compact dependency-graph view of one search result, pinned to the page corner. */
export default function GraphPeek({ statementId, formality = 'informal' }: GraphPeekProps) {
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? wide;

  // Statements the user has clicked through, starting from `statementId`;
  // a new `statementId` starts a fresh trail.
  const [walk, setWalk] = useState<{ root: string | null; trail: string[] }>({ root: null, trail: [] });
  const trail = walk.root === statementId ? walk.trail : statementId ? [statementId] : [];
  const setTrail = (next: string[]) => setWalk({ root: statementId, trail: next });
  const currentId = trail[trail.length - 1] ?? null;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const loading = open && currentId !== null && loaded?.id !== currentId;
  const center = loaded?.center ?? null;
  const neighbors = loading ? null : loaded?.neighbors ?? null;

  useEffect(() => {
    if (!currentId || !open) return;
    let cancelled = false;
    apiStatement(currentId, formality)
      .then(({ statement, neighbors }) => {
        if (!cancelled) setLoaded({ id: currentId, center: statement, neighbors });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id: currentId, center: null, neighbors: [] });
      });
    return () => { cancelled = true; };
  }, [currentId, formality, open]);

  if (!statementId) return null;

  const deps = (neighbors ?? []).filter(n => n.direction === 'src');
  const users = (neighbors ?? []).filter(n => n.direction === 'dep');
  const shownDeps = deps.slice(0, MAX_PER_SIDE);
  const shownUsers = users.slice(0, MAX_PER_SIDE);
  const hidden = deps.length - shownDeps.length + users.length - shownUsers.length;

  const placed = [
    ...shownDeps.map((nb, i) => ({ nb, ...arcPos(i, shownDeps.length, -1) })),
    ...shownUsers.map((nb, i) => ({ nb, ...arcPos(i, shownUsers.length, 1) })),
  ];

  return (
    <div className="hidden md:block fixed bottom-4 right-4 z-40 w-[340px] bg-white border border-slate-200 rounded-xs shadow-lg">
      <button
        onClick={() => setToggled(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-widest text-slate-500 hover:text-brand transition-colors"
      >
        <Network size={12} />
        DEPENDENCY GRAPH
        <span className="ml-auto">{open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          <div className="px-3 pt-2 flex items-center gap-2 min-w-0">
            {trail.length > 1 && (
              <button
                onClick={() => setTrail(trail.slice(0, -1))}
                title="Back"
                className="p-0.5 text-slate-400 hover:text-brand shrink-0"
              >
                <ArrowLeft size={12} />
              </button>
            )}
            <p className="text-xs font-semibold text-slate-800 truncate flex-1" title={center?.slogan}>
              {center?.name ?? '…'}
              {center?.paper?.title && (
                <span className="ml-1 font-normal italic text-slate-400">— {center.paper.title}</span>
              )}
            </p>
            <Link
              href={`/explore?id=${encodeURIComponent(currentId ?? '')}&formality=${formality}`}
              title="Open in Explorer"
              className="p-0.5 text-slate-400 hover:text-brand shrink-0"
            >
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                <Loader2 size={16} className="animate-spin text-slate-300" />
              </div>
            )}
            <svg width={W} height={H} className="block mx-auto">
              {placed.map(({ nb, x, y }) => (
                <line
                  key={`e-${nb.direction}-${nb.statement_id}`}
                  x1={CX} y1={CY} x2={x} y2={y}
                  stroke={edgeColor(nb.edge_type)} strokeOpacity={0.4} strokeWidth={1.2}
                />
              ))}
              {placed.map(({ nb, x, y }) => (
                <g
                  key={`n-${nb.direction}-${nb.statement_id}`}
                  transform={`translate(${x},${y})`}
                  className="cursor-pointer"
                  onClick={() => setTrail([...trail, nb.statement_id])}
                >
                  <title>{`${nb.name}${nb.slogan ? ` — ${nb.slogan}` : ''}`}</title>
                  <circle r={NODE_R} fill="#ede9fe" stroke="#a78bfa" strokeWidth={1.2} />
                  <text
                    y={NODE_R + 9} textAnchor="middle" fontSize={8} fill="#64748b"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {trunc(nb.name, 16)}
                  </text>
                </g>
              ))}
              <g transform={`translate(${CX},${CY})`}>
                <title>{center?.slogan ?? center?.name ?? ''}</title>
                <circle r={NODE_R + 4} fill="#4b2e83" />
              </g>
              {shownDeps.length > 0 && (
                <text x={8} y={12} fontSize={8} fill="#94a3b8">uses</text>
              )}
              {shownUsers.length > 0 && (
                <text x={W - 8} y={12} fontSize={8} fill="#94a3b8" textAnchor="end">used by</text>
              )}
            </svg>
          </div>

          <p className="px-3 pb-2 text-[10px] text-slate-400">
            {!loading && neighbors?.length === 0
              ? 'No dependencies recorded for this statement.'
              : `${deps.length} dependenc${deps.length === 1 ? 'y' : 'ies'} · ${users.length} dependent${users.length === 1 ? '' : 's'}`
                + (hidden > 0 ? ` · ${hidden} more in Explorer` : '')}
          </p>
        </div>
      )}
    </div>
  );
}
