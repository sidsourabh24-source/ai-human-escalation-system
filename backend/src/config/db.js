import pg from 'pg';
import dns from 'dns';
import { promisify } from 'util';
import { env } from './env.js';

const resolve4Async = promisify(dns.resolve4);

// Forces resolution of any hostname to a standard IPv4 address
async function resolveToIPv4(host) {
  try {
    const addresses = await resolve4Async(host);
    if (addresses && addresses.length > 0) {
      return addresses[0];
    }
    return host;
  } catch (error) {
    console.warn(`[db] IPv4 lookup failed for ${host}, using original:`, error.message);
    return host;
  }
}

let host = env.dbHost;
let connectionString = env.databaseUrl;

if (connectionString) {
  try {
    // Replaces the connection string's hostname with its direct IPv4 IP
    const url = new URL(connectionString);
    const resolvedIp = await resolveToIPv4(url.hostname);
    url.hostname = resolvedIp;
    connectionString = url.toString();
  } catch (err) {
    console.warn("[db] Failed to parse DATABASE_URL for IPv4 resolution:", err.message);
  }
} else if (host) {
  host = await resolveToIPv4(host);
}

const config = connectionString
  ? { connectionString }
  : {
      host: host,
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
