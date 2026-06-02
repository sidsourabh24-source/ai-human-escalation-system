import pg from 'pg';
import dns from 'dns';
import { env } from './env.js';

// Force Node.js to prioritize IPv4 over IPv6 when resolving hostnames.
// This is critical for environments like Render that lack IPv6 outbound routing,
// preventing ENETUNREACH errors when connecting to databases (like Supabase).
dns.setDefaultResultOrder('ipv4first');

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
