import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

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

export async function getPool(): Promise<Pool> {
  if (global._pgPool) return global._pgPool;

  const secret = await fetchSecret();

  global._pgPool = new Pool({
    host: process.env.RDS_WRITER_HOST,
    port: Number(secret.port ?? 5432),
    database: process.env.RDS_DB_NAME ?? secret.dbname,
    user: secret.username,
    password: secret.password,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return global._pgPool;
}
