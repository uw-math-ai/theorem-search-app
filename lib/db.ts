import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

declare global {
  // eslint-disable-next-line no-var
  var _pgPools: Map<string, Pool> | undefined;
}

// Logging tables (queries, feedback, theorem_reports) live in the default
// database (RDS_DB_NAME); search data and its filter metadata live in v2.
export const V2_DB = process.env.RDS_V2_DB_NAME ?? 'v2';

async function fetchSecret() {
  const sm = new SecretsManagerClient({
    region: process.env.APP_AWS_REGION,
    credentials: {
      accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
    },
  });
  const res = await sm.send(new GetSecretValueCommand({ SecretId: process.env.RDS_SECRET_ARN }));
  return JSON.parse(res.SecretString!);
}

export async function getPool(database?: string): Promise<Pool> {
  global._pgPools ??= new Map();
  const key = database ?? '';
  const existing = global._pgPools.get(key);
  if (existing) return existing;

  const s = await fetchSecret();
  const pool = new Pool({
    host: process.env.RDS_WRITER_HOST,
    port: Number(s.port ?? 5432),
    database: database ?? process.env.RDS_DB_NAME ?? s.dbname,
    user: s.username,
    password: s.password,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  global._pgPools.set(key, pool);
  return pool;
}
