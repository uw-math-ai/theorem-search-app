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

export async function embedQuery(query: string): Promise<number[]> {
  const hit = global._embedCache!.get(query);
  if (hit) return hit;

  const res = await client.embeddings.create({
    model: 'Qwen/Qwen3-Embedding-8B',
    input: query,
  });

  const vec = res.data[0].embedding;
  global._embedCache!.set(query, vec);
  return vec;
}
