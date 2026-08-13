'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, X, Loader2, ChevronRight } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';

const API_BASE = '/api/graph';
const NODE_R = 26;
const CHILD_DIST = 210;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Paper { title: string; external_id: string; source: string }

interface Statement {
  statement_id: string;
  name: string;
  body?: string;
  slogan?: string;
  source?: string;  // 'arXiv' | 'Lean Repo' | etc.
  paper?: Paper;
}

interface GraphNode extends Statement { x: number; y: number }

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  edge_type: string;
}

interface Neighbor extends Statement {
  direction: 'src' | 'dep';
  edge_type: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// API edge `location` values
const EDGE_COLOR: Record<string, string> = {
  body:         '#7c3aed',
  pre_context:  '#2563eb',
  post_context: '#059669',
};
const edgeColor = (t: string) => EDGE_COLOR[t] ?? '#94a3b8';

// Golden-angle spiral placement for children of a parent node
function childPos(parent: GraphNode, siblingIndex: number): { x: number; y: number } {
  const angle = (siblingIndex * 137.508 * Math.PI) / 180;
  return {
    x: parent.x + CHILD_DIST * Math.cos(angle),
    y: parent.y + CHILD_DIST * Math.sin(angle),
  };
}

const trunc = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s;

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiSearch(query: string): Promise<Statement[]> {
  const r = await fetch(`${API_BASE}/embedding?query=${encodeURIComponent(query)}&n_results=8`);
  if (!r.ok) throw new Error('search failed');
  const d = await r.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.results ?? []).map((x: any) => ({
    statement_id: x.statement_id as string,
    name: x.name as string,
    body: x.body as string | undefined,
    slogan: x.slogan as string | undefined,
    source: x.source as string | undefined,
    paper: x.title ? { title: x.title as string, external_id: x.external_id as string ?? '', source: x.source as string ?? '' } : undefined,
  }));
}

// Response: { root: { statement_id, name, statement?: { body }, paper?: { title, external_id, source } },
//             nodes: [{ statement_id, name, slogan }],
//             edges: [{ src_id, dep_id, dep_name, location }] }
async function apiStatement(id: string): Promise<{ statement: Statement; neighbors: Neighbor[] }> {
  const r = await fetch(`${API_BASE}/statement/${id}?direction=both`);
  if (!r.ok) throw new Error('fetch failed');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { root, nodes, edges } = await r.json() as { root: any; nodes: any[]; edges: any[] };

  const nodeMap = new Map<string, { statement_id: string; name: string; slogan?: string }>(
    nodes.map((n: { statement_id: string; name: string; slogan?: string }) => [n.statement_id, n])
  );
  const rootId = root.statement_id as string;
  const paperSource: string | undefined = root.paper?.source;

  const statement: Statement = {
    statement_id: rootId,
    name: root.name as string,
    body: root.statement?.body as string | undefined,
    slogan: nodeMap.get(rootId)?.slogan,
    source: paperSource,
    paper: root.paper ? {
      title: root.paper.title as string,
      external_id: root.paper.external_id as string,
      source: root.paper.source as string,
    } : undefined,
  };

  // Derive direct neighbors of root from edges
  const seen = new Set<string>();
  const neighbors: Neighbor[] = [];

  for (const edge of edges) {
    const srcId = edge.src_id as string;
    const depId = edge.dep_id as string;
    const location = (edge.location ?? 'body') as string;

    if (srcId === rootId) {
      // Root uses depId as a dependency
      if (seen.has(depId)) continue;
      seen.add(depId);
      const nb = nodeMap.get(depId);
      neighbors.push({
        statement_id: depId,
        name: nb?.name ?? (edge.dep_name as string | undefined) ?? depId,
        slogan: nb?.slogan,
        edge_type: location,
        direction: 'src',  // root is src → root "uses" this neighbor
      });
    } else if (depId === rootId) {
      // srcId uses root as a dependency
      if (seen.has(srcId)) continue;
      seen.add(srcId);
      const nb = nodeMap.get(srcId);
      if (!nb) continue;
      neighbors.push({
        statement_id: srcId,
        name: nb.name,
        slogan: nb.slogan,
        edge_type: location,
        direction: 'dep',  // root is dep → neighbor "uses" root
      });
    }
  }

  return { statement, neighbors };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<Neighbor[] | null>(null);
  const [loadingNb, setLoadingNb] = useState(false);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Statement[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);

  // viewport: pan (x,y) + zoom (scale)
  const [vp, setVp] = useState({ x: 0, y: 0, scale: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag state in refs so mouse handlers don't go stale
  const dragNode = useRef<{ id: string; ox: number; oy: number; mx: number; my: number; scale: number } | null>(null);
  const dragPan  = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);
  const didDrag  = useRef(false);

  const selectedNode = nodes.find(n => n.statement_id === selectedId) ?? null;

  // ── Search ──────────────────────────────────────────────────────────────────

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults(null);
    try {
      setSearchResults(await apiSearch(query.trim()));
      setShowDrop(true);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, [query]);

  // ── Pick a search result as a root node ──────────────────────────────────────

  const pickResult = useCallback((stmt: Statement) => {
    setShowDrop(false);
    setQuery('');
    setSelectedId(stmt.statement_id);
    if (nodes.find(n => n.statement_id === stmt.statement_id)) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = rect ? (rect.width  / 2 - vp.x) / vp.scale : 400;
    const y = rect ? (rect.height / 2 - vp.y) / vp.scale : 300;
    setNodes(prev => [...prev, { ...stmt, x, y }]);
  }, [nodes, vp]);

  // ── Traverse to a neighbor ────────────────────────────────────────────────────

  const traverse = useCallback((nb: Neighbor) => {
    if (!selectedId) return;
    const parent = nodes.find(n => n.statement_id === selectedId);
    if (!parent) return;

    if (!nodes.find(n => n.statement_id === nb.statement_id)) {
      const siblingCount = edges.filter(e => e.from === selectedId || e.to === selectedId).length;
      const { x, y } = childPos(parent, siblingCount);
      setNodes(prev => [...prev, { ...nb, x, y }]);
    }

    const edgeId = `${selectedId}→${nb.statement_id}@${nb.edge_type}`;
    setEdges(prev =>
      prev.find(e => e.id === edgeId)
        ? prev
        : [...prev, { id: edgeId, from: selectedId, to: nb.statement_id, edge_type: nb.edge_type }]
    );
    setSelectedId(nb.statement_id);
  }, [selectedId, nodes, edges]);

  // ── Load neighbors + enrich node data when selection changes ─────────────────

  useEffect(() => {
    if (!selectedId) { setNeighbors(null); return; }
    setLoadingNb(true);
    setNeighbors(null);
    apiStatement(selectedId)
      .then(({ statement, neighbors: nb }) => {
        setNodes(prev => prev.map(n => n.statement_id === selectedId ? { ...n, ...statement } : n));
        setNeighbors(nb);
      })
      .catch(() => setNeighbors([]))
      .finally(() => setLoadingNb(false));
  }, [selectedId]);

  // ── Global mouse move / up (handles node drag + pan) ─────────────────────────

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragNode.current) {
        const dx = e.clientX - dragNode.current.mx;
        const dy = e.clientY - dragNode.current.my;
        if (Math.abs(dx) + Math.abs(dy) > 3) didDrag.current = true;
        const { id, ox, oy, scale } = dragNode.current;
        setNodes(prev => prev.map(n =>
          n.statement_id === id ? { ...n, x: ox + dx / scale, y: oy + dy / scale } : n
        ));
      } else if (dragPan.current) {
        const dx = e.clientX - dragPan.current.mx;
        const dy = e.clientY - dragPan.current.my;
        if (Math.abs(dx) + Math.abs(dy) > 3) didDrag.current = true;
        setVp(v => ({ ...v, x: dragPan.current!.vx + dx, y: dragPan.current!.vy + dy }));
      }
    };
    const onUp = () => { dragNode.current = null; dragPan.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const k = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setVp(v => {
        const ns = Math.max(0.15, Math.min(5, v.scale * k));
        const f = ns / v.scale;
        return { scale: ns, x: mx - f * (mx - v.x), y: my - f * (my - v.y) };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
      <SiteHeader />

      {/* Toolbar */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-2 flex items-center gap-3 bg-white z-20 relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
            {searching
              ? <Loader2 size={12} className="animate-spin text-slate-400" />
              : <Search size={12} className="text-slate-400" />}
          </div>
          <input
            className="pl-7 pr-3 py-1.5 w-64 border border-slate-200 rounded-xs text-xs focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 bg-white"
            placeholder="Search to add a node…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDrop(false); }}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
          />
          {showDrop && searchResults && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-xs shadow-lg max-h-64 overflow-y-auto z-50">
              {searchResults.length === 0
                ? <p className="px-4 py-3 text-xs text-slate-400">No results.</p>
                : searchResults.map(s => (
                  <button
                    key={s.statement_id}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                    onClick={() => pickResult(s)}
                  >
                    <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{s.slogan ?? s.paper?.title ?? ''}</p>
                  </button>
                ))}
            </div>
          )}
        </div>

        {nodes.length > 0 && (
          <button
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => { setNodes([]); setEdges([]); setSelectedId(null); setNeighbors(null); setVp({ x: 0, y: 0, scale: 1 }); }}
          >
            Clear
          </button>
        )}

        <span className="ml-auto hidden sm:block text-[11px] text-slate-300">
          drag to pan · scroll to zoom · click node to expand
        </span>
        {nodes.length > 0 && (
          <span className="text-[11px] text-slate-400 shrink-0">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Canvas + side panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* SVG canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: dragPan.current ? 'grabbing' : 'grab' }}
          onMouseDown={e => {
            if (e.button !== 0 || dragNode.current) return;
            didDrag.current = false;
            dragPan.current = { mx: e.clientX, my: e.clientY, vx: vp.x, vy: vp.y };
          }}
          onClick={() => {
            if (!didDrag.current) { setSelectedId(null); setShowDrop(false); }
          }}
        >
          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2 px-6">
                <p className="text-sm font-medium text-slate-400">Search above to place your first node.</p>
                <p className="text-xs text-slate-300">Click a node to load its neighbors, then click a neighbor to traverse.</p>
              </div>
            </div>
          )}

          <svg ref={svgRef} className="w-full h-full" style={{ display: 'block' }}>
            <defs>
              {/* One marker per edge color */}
              {Object.entries(EDGE_COLOR).map(([type, color]) => (
                <marker
                  key={type}
                  id={`arrow-${type}`}
                  markerWidth="7" markerHeight="7"
                  refX="6" refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 7 3.5, 0 7" fill={color} fillOpacity="0.5" />
                </marker>
              ))}
              <marker id="arrow-default" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#94a3b8" fillOpacity="0.5" />
              </marker>
            </defs>

            <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>

              {/* Edges */}
              {edges.map(edge => {
                const src = nodes.find(n => n.statement_id === edge.from);
                const tgt = nodes.find(n => n.statement_id === edge.to);
                if (!src || !tgt) return null;
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const d = Math.hypot(dx, dy) || 1;
                const ux = dx / d; const uy = dy / d;
                const color = edgeColor(edge.edge_type);
                const markerId = EDGE_COLOR[edge.edge_type] ? `arrow-${edge.edge_type}` : 'arrow-default';
                return (
                  <line
                    key={edge.id}
                    x1={src.x + ux * NODE_R}
                    y1={src.y + uy * NODE_R}
                    x2={tgt.x - ux * (NODE_R + 7)}
                    y2={tgt.y - uy * (NODE_R + 7)}
                    stroke={color}
                    strokeOpacity={0.45}
                    strokeWidth={1.5}
                    markerEnd={`url(#${markerId})`}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const sel = node.statement_id === selectedId;
                const formal = node.source === 'Lean Repo';
                return (
                  <g
                    key={node.statement_id}
                    transform={`translate(${node.x},${node.y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      didDrag.current = false;
                      dragNode.current = { id: node.statement_id, ox: node.x, oy: node.y, mx: e.clientX, my: e.clientY, scale: vp.scale };
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (!didDrag.current) {
                        setSelectedId(prev => prev === node.statement_id ? null : node.statement_id);
                        setShowDrop(false);
                      }
                    }}
                  >
                    {/* Halo for selected */}
                    {sel && (
                      <circle r={NODE_R + 5} fill="#4b2e83" fillOpacity={0.12} />
                    )}
                    <circle
                      r={NODE_R}
                      fill={sel ? '#4b2e83' : (formal ? '#e0e7ff' : '#ede9fe')}
                      stroke={sel ? '#4b2e83' : (formal ? '#818cf8' : '#a78bfa')}
                      strokeWidth={sel ? 0 : 1.5}
                    />
                    {/* Label below */}
                    <text
                      y={NODE_R + 12}
                      textAnchor="middle"
                      fontSize={9}
                      fill={sel ? '#4b2e83' : '#64748b'}
                      fontWeight={sel ? 700 : 500}
                      style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {trunc(node.name, 22)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Side panel — selected node + neighbors */}
        {selectedNode && (
          <aside className="w-72 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">

            {/* Node header */}
            <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-slate-900 leading-tight">{selectedNode.name}</p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-0.5 text-slate-400 hover:text-slate-700 shrink-0 mt-0.5"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedNode.source && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs ${
                    selectedNode.source === 'Lean Repo'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-violet-50 text-violet-600'
                  }`}>
                    {selectedNode.source}
                  </span>
                )}
                {selectedNode.paper && (
                  <p className="text-[11px] text-slate-500 italic truncate flex-1 min-w-0">
                    {selectedNode.paper.title}
                  </p>
                )}
              </div>
              {selectedNode.slogan && (
                <p className="text-xs text-slate-600 leading-relaxed">{selectedNode.slogan}</p>
              )}
            </div>

            {/* Neighbors list */}
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 pt-3 pb-1.5 text-[9px] font-bold tracking-widest text-slate-400">
                NEIGHBORS{neighbors != null ? ` (${neighbors.length})` : ''}
              </p>

              {loadingNb && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={14} className="animate-spin text-slate-300" />
                </div>
              )}

              {!loadingNb && neighbors?.length === 0 && (
                <p className="px-4 py-3 text-xs text-slate-400">No neighbors found.</p>
              )}

              {neighbors?.map((nb, i) => {
                const visited = nodes.some(n => n.statement_id === nb.statement_id);
                const color = edgeColor(nb.edge_type);
                return (
                  <button
                    key={`${nb.statement_id}-${i}`}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group flex items-start gap-2"
                    onClick={() => traverse(nb)}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-slate-700 group-hover:text-brand transition-colors truncate">
                        {nb.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[9px] font-bold px-1 py-0.5 rounded-xs shrink-0"
                          style={{ backgroundColor: color + '20', color }}
                        >
                          {nb.edge_type}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {nb.direction === 'src' ? 'dependency' : 'dependent'}
                        </span>
                        {nb.source && (
                          <span className={`text-[9px] font-medium ${nb.source === 'Lean Repo' ? 'text-indigo-400' : 'text-violet-400'}`}>
                            {nb.source}
                          </span>
                        )}
                      </div>
                      {nb.slogan && (
                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{nb.slogan}</p>
                      )}
                    </div>
                    <ChevronRight
                      size={11}
                      className={`shrink-0 mt-0.5 transition-colors ${
                        visited ? 'text-brand' : 'text-slate-300 group-hover:text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
