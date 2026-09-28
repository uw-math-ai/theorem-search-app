'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, GripVertical, Loader2, Network } from 'lucide-react';
import { apiStatement, edgeColor, type Formality, type Neighbor, type Statement } from '../lib/graphApi';

const DEFAULT_W = 360;
const DEFAULT_H = 320;
const MIN_W = 300;
const MIN_H = 260;
const MAX_PER_SIDE = 8;          // dependencies on the left, dependents on the right
const NODE_R = 9;
const LABEL_PX_PER_CHAR = 4.3;   // 8px sans-serif, roughly
const CAPTION_H = 60;            // name line + 2 clamped slogan lines + padding
const HEADER_H = 62;             // drag bar + centered statement row

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

interface Placed {
  nb: Neighbor;
  x: number;
  y: number;
  side: 1 | -1;
  label: string;
}

/** Fit `text` into `px` of horizontal room, ellipsising if needed. */
function fit(text: string | undefined, px: number): string {
  const s = text ?? '';
  const max = Math.max(3, Math.floor(px / LABEL_PX_PER_CHAR));
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/**
 * Two columns: dependencies on the left, dependents on the right, with the
 * centred statement between them. Labels sit outside their column pointing
 * away from the centre, and rows are spaced by at least a node diameter, so
 * no circle can ever cover a label (an arc layout could, once a side held
 * more than a few nodes in a small panel). Each label is truncated to the
 * room actually left between its column and the panel edge.
 */
const ROW_GAP = 2 * NODE_R + 6;

/** How many nodes per side fit in `h` pixels of canvas. */
export function rowsThatFit(h: number): number {
  return Math.max(1, Math.min(MAX_PER_SIDE, Math.floor((h - 2 * (NODE_R + 4)) / ROW_GAP) + 1));
}

function layout(deps: Neighbor[], users: Neighbor[], w: number, h: number): Placed[] {
  const cy = h / 2;
  const placed: Placed[] = [];

  for (const [list, side] of [[deps, -1], [users, 1]] as const) {
    const n = list.length;
    if (!n) continue;
    const x = side === -1 ? w * 0.3 : w * 0.7;
    const room = side === -1 ? x - NODE_R - 8 : w - x - NODE_R - 8;
    const step = Math.min(ROW_GAP * 1.6, (h - 2 * (NODE_R + 4)) / Math.max(n - 1, 1));
    list.forEach((nb, i) => {
      const y = n === 1 ? cy : cy - ((n - 1) * step) / 2 + i * step;
      placed.push({ nb, x, y, side, label: fit(nb.name, room) });
    });
  }
  return placed;
}


/** Compact dependency-graph view of one search result, pinned to the page corner. */
export default function GraphPeek({ statementId, formality = 'informal' }: GraphPeekProps) {
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? wide;

  // Panel geometry. `offset` moves it from its bottom-right anchor.
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ mode: 'move' | 'resize'; mx: number; my: number;
                        w: number; h: number; ox: number; oy: number } | null>(null);

  // Statements the user has clicked through, starting from `statementId`;
  // a new `statementId` starts a fresh trail.
  const [walk, setWalk] = useState<{ root: string | null; trail: string[] }>({ root: null, trail: [] });
  const trail = walk.root === statementId ? walk.trail : statementId ? [statementId] : [];
  const setTrail = (next: string[]) => setWalk({ root: statementId, trail: next });
  const currentId = trail[trail.length - 1] ?? null;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [hovered, setHovered] = useState<Neighbor | null>(null);
  // The graph area is whatever the fixed-height panel leaves between header
  // and caption; measuring it (rather than subtracting constants) keeps the
  // SVG exact and can't drift with font or zoom changes.
  const graphRef = useRef<HTMLDivElement>(null);
  const [graphBox, setGraphBox] = useState({ w: DEFAULT_W, h: DEFAULT_H - HEADER_H - CAPTION_H });
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

  useEffect(() => {
    const el = graphRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setGraphBox({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // Drag the header to move, the top-left corner to resize.
  const startDrag = useCallback((mode: 'move' | 'resize') => (e: React.PointerEvent) => {
    e.preventDefault();
    drag.current = { mode, mx: e.clientX, my: e.clientY, w: size.w, h: size.h, ox: offset.x, oy: offset.y };
  }, [size, offset]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.mx;
      const dy = e.clientY - d.my;
      if (d.mode === 'move') {
        // Anchored bottom-right, so moving right/down means a positive offset;
        // clamp so the panel always stays on screen.
        setOffset({
          x: Math.min(16, Math.max(-(window.innerWidth - d.w - 32), d.ox + dx)),
          y: Math.min(16, Math.max(-(window.innerHeight - d.h - 32), d.oy + dy)),
        });
      } else {
        // The handle is the top-left corner: dragging left/up grows the panel.
        setSize({
          w: Math.max(MIN_W, Math.min(window.innerWidth - 48, d.w - dx)),
          h: Math.max(MIN_H, Math.min(window.innerHeight - 48, d.h - dy)),
        });
      }
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  if (!statementId) return null;

  const allDeps = (neighbors ?? []).filter(n => n.direction === 'src');
  const allUsers = (neighbors ?? []).filter(n => n.direction === 'dep');
  const svgW = graphBox.w;
  const svgH = Math.max(100, graphBox.h);
  // Only as many nodes per side as the panel is tall enough to label clearly;
  // resizing taller shows more.
  const perSide = rowsThatFit(svgH);
  const deps = allDeps.slice(0, perSide);
  const users = allUsers.slice(0, perSide);
  const hiddenCount = allDeps.length - deps.length + (allUsers.length - users.length);
  const placed = layout(deps, users, svgW, svgH);
  const cx = svgW / 2;
  const cy = svgH / 2;

  return (
    <div
      className="hidden md:flex flex-col fixed bottom-4 right-4 z-40 overflow-hidden bg-white border border-slate-200 rounded-xs shadow-lg"
      style={{
        width: size.w,
        // Fixed while open: nothing inside (a hovered node's slogan) may
        // change the panel's size.
        height: open ? size.h : undefined,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {/* Resize handle, top-left corner */}
      {open && (
        <div
          onPointerDown={startDrag('resize')}
          title="Drag to resize"
          className="absolute -top-1 -left-1 w-4 h-4 cursor-nwse-resize text-slate-300 hover:text-brand"
          style={{ touchAction: 'none' }}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden>
            <path d="M14 2 L2 14 M9 2 L2 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}

      {/* Header doubles as the move handle */}
      <div className="flex items-center gap-1.5 px-2 py-2" style={{ touchAction: 'none' }}>
        <span
          onPointerDown={startDrag('move')}
          title="Drag to move"
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0"
        >
          <GripVertical size={12} />
        </span>
        <button
          onClick={() => setToggled(!open)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-[10px] font-bold tracking-widest text-slate-500 hover:text-brand transition-colors"
        >
          <Network size={12} />
          DEPENDENCY GRAPH
          <span className="ml-auto">{open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}</span>
        </button>
      </div>

      {open && (
        <div className="flex flex-col flex-1 min-h-0 border-t border-slate-100">
          <div className="px-3 pt-2 flex items-center gap-2 min-w-0 shrink-0">
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
            <a
              href={`/explore?id=${encodeURIComponent(currentId ?? '')}&formality=${formality}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Explorer (new tab)"
              className="p-0.5 text-slate-400 hover:text-brand shrink-0"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          <div ref={graphRef} className="relative flex-1 min-h-0 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                <Loader2 size={16} className="animate-spin text-slate-300" />
              </div>
            )}
            <svg width={svgW} height={svgH} className="block">
              {placed.map(({ nb, x, y }) => (
                <line
                  key={`e-${nb.direction}-${nb.statement_id}`}
                  x1={cx} y1={cy} x2={x} y2={y}
                  stroke={edgeColor(nb.edge_type)} strokeOpacity={0.4} strokeWidth={1.2}
                />
              ))}
              {placed.map(({ nb, x, y, side, label }) => {
                const isHovered = hovered?.statement_id === nb.statement_id;
                return (
                  <g
                    key={`n-${nb.direction}-${nb.statement_id}`}
                    className="cursor-pointer"
                    onClick={() => setTrail([...trail, nb.statement_id])}
                    onPointerEnter={() => setHovered(nb)}
                    onPointerLeave={() => setHovered(null)}
                  >
                    <title>{`${nb.name}${nb.slogan ? ` — ${nb.slogan}` : ''}`}</title>
                    <circle
                      cx={x} cy={y} r={NODE_R}
                      fill={isHovered ? '#ddd6fe' : '#ede9fe'}
                      stroke={isHovered ? '#4b2e83' : '#a78bfa'}
                      strokeWidth={isHovered ? 2 : 1.2}
                    />
                    {/* Label points away from the centre, so no circle covers it. */}
                    <text
                      x={x + side * (NODE_R + 4)} y={y + 3}
                      textAnchor={side === -1 ? 'end' : 'start'}
                      fontSize={8}
                      fill={isHovered ? '#4b2e83' : '#64748b'}
                      fontWeight={isHovered ? 700 : 400}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              <g>
                <title>{center?.slogan ?? center?.name ?? ''}</title>
                <circle cx={cx} cy={cy} r={NODE_R + 4} fill="#4b2e83" />
              </g>
              {deps.length > 0 && <text x={6} y={12} fontSize={8} fill="#94a3b8">uses</text>}
              {users.length > 0 && (
                <text x={svgW - 6} y={12} fontSize={8} fill="#94a3b8" textAnchor="end">used by</text>
              )}
            </svg>
          </div>

          {/* Hovered node's slogan, or the hint that hovering shows it. Fixed
              height and clipped: this block must not resize on hover, or the
              panel jitters as the pointer moves between nodes. */}
          <div
            className="px-3 pb-2 pt-1.5 shrink-0 overflow-hidden border-t border-slate-100"
            style={{ height: CAPTION_H }}
          >
            <p className="text-[10px] font-semibold text-slate-700 truncate">
              {hovered
                ? hovered.name
                : !loading && neighbors?.length === 0
                  ? 'No dependencies recorded for this statement.'
                  : `${allDeps.length} dependenc${allDeps.length === 1 ? 'y' : 'ies'} · ${allUsers.length} dependent${allUsers.length === 1 ? '' : 's'}`
                    + (hiddenCount > 0 ? ` · ${hiddenCount} more in Explorer` : '')}
            </p>
            <p className={`text-[10px] leading-snug line-clamp-2 ${hovered ? 'text-slate-500' : 'text-slate-400 italic'}`}>
              {hovered
                ? hovered.slogan ?? 'No slogan for this statement.'
                : 'Hover over a node for its slogan · click to focus it  ·  drag to move, corner to resize'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
