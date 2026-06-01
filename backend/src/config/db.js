import pg from 'pg';
import { env } from './env.js';

const config = env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPass,
      database: env.dbName
    };

// Supabase and other managed DBs require SSL in production environments
if (env.databaseUrl || env.nodeEnv === 'production') {
  config.ssl = { rejectUnauthorized: false };
}

const pool = new pg.Pool(config);

export default pool;
