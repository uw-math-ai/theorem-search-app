// Client helpers for the statement dependency graph (via the /api/graph proxy).

export interface Paper { title: string; external_id: string; source: string }

// Formal (Lean) and informal statements have separate dependency tables.
export type Formality = 'informal' | 'formal';

export interface Statement {
  statement_id: string;
  name: string;
  body?: string;
  slogan?: string;
  source?: string;  // 'arXiv' | 'Lean Repo' | etc.
  formality?: Formality;
  paper?: Paper;
}

export interface Neighbor extends Statement {
  direction: 'src' | 'dep';
  edge_type: string;
}

// API edge `location` values
export const EDGE_COLOR: Record<string, string> = {
  body:         '#7c3aed',
  pre_context:  '#2563eb',
  post_context: '#059669',
};
export const edgeColor = (t: string) => EDGE_COLOR[t] ?? '#94a3b8';

// Response: { root: { statement_id, name, statement?: { body }, paper?: { title, external_id, source } },
//             nodes: [{ statement_id, name, slogan }],
//             edges: [{ src_id, dep_id, dep_name, location }] }
export async function apiStatement(
  id: string,
  formality: Formality = 'informal',
): Promise<{ statement: Statement; neighbors: Neighbor[] }> {
  const r = await fetch(`/api/graph/statement/${encodeURIComponent(id)}?direction=both&formality=${formality}`);
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
    formality,
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
        formality,
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
        formality,
        edge_type: location,
        direction: 'dep',  // root is dep → neighbor "uses" root
      });
    }
  }

  return { statement, neighbors };
}
