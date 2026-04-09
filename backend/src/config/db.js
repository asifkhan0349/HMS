const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let db;
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
  console.log('Connecting to PostgreSQL database...');
  db = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('Connecting to SQLite database (hms.db)...');
  const dbPath = path.resolve(__dirname, '../../hms.db');
  db = new sqlite3.Database(dbPath);
}

// Helper to query database
const query = async (sql, params) => {
  if (db instanceof Pool) {
    const res = await db.query(sql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

const run = async (sql, params) => {
  if (db instanceof Pool) {
    await db.query(sql, params);
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
};

module.exports = {
  db,
  query,
  run,
  isPostgres: db instanceof Pool
};
