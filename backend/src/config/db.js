import mysql from 'mysql2/promise';
import { env } from './env.js';

const pool = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPass,
  database: env.dbName,
  port: env.dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
