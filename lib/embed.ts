import OpenAI from 'openai';

declare global {
  // eslint-disable-next-line no-var
  var _embedCache: Map<string, number[]> | undefined;
}
if (!global._embedCache) {
  global._embedCache = new Map();
}

const client = new OpenAI({
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

// Must stay in lockstep with DEFAULT_QUERY_PROMPT in api/models.py.
// Qwen3-Embedding-8B uses an Instruct/Query template; without it the model
// produces a generic embedding that ranks corrupted-slogan rows above real
// theorem statements.
export const DEFAULT_QUERY_PROMPT =
  'Instruct: Given a math problem, retrieve useful references, such as theorems, lemmas, and definitions, that are useful for solving the given problem.\nQuery: ';

export async function embedQuery(
  query: string,
  prompt: string | null = null,
): Promise<number[]> {
  const effectivePrompt = prompt === null ? DEFAULT_QUERY_PROMPT : prompt;
  const input = effectivePrompt + query;

  const hit = global._embedCache!.get(input);
  if (hit) return hit;

  const res = await client.embeddings.create({
    model: 'Qwen/Qwen3-Embedding-8B',
    input,
  });

  const vec = res.data[0].embedding;
  global._embedCache!.set(input, vec);
  return vec;
}
