// ============================================================
// SebilAI — centralized libSQL (Turso) client.
// CommonJS to match the rest of the codebase (require, not import).
//
// In production (Fly): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN — the
// database lives off the instance and survives restarts/redeploys.
// Locally (no Turso vars): falls back to a local file `file:sebilai.db`
// so the app and smoke tests still run offline.
// ============================================================
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL || 'file:sebilai.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const db = createClient(authToken ? { url, authToken } : { url });

// ── small async helpers (libSQL is promise-based) ──
// rows are returned as plain objects keyed by column name.
function rsToObjs(rs) {
  return rs.rows.map(row => {
    const o = {};
    rs.columns.forEach((c, i) => { o[c] = row[i]; });
    return o;
  });
}
async function dbAll(sql, args = []) { return rsToObjs(await db.execute({ sql, args })); }
async function dbGet(sql, args = []) { return rsToObjs(await db.execute({ sql, args }))[0]; }
async function dbRun(sql, args = []) { return db.execute({ sql, args }); }

// ── cold-start retry-with-backoff ──────────────────────────
// Fly scales the machine to zero when idle; on the first request the HTTP/2
// connection to Turso (aws-us-east-1, ~120ms from fra) isn't settled yet, so
// the first libSQL query throws "fetch failed". It works on the next attempt.
// Retry ONLY transient connection/network errors — never SQL/logic errors.
const RETRY_DELAYS_MS = [500, 1000, 2000, 4000, 8000]; // up to 5 attempts

function isTransientDbError(err) {
  const parts = [];
  let e = err;
  // walk the cause chain (undici wraps the real socket error in err.cause)
  for (let i = 0; e && i < 4; i++) { parts.push(String(e.message || ''), String(e.code || '')); e = e.cause; }
  const blob = parts.join(' ').toLowerCase();
  return /fetch failed|network|timeout|timed out|etimedout|econnreset|econnrefused|enotfound|eai_again|socket hang up|und_err|connect|stream closed|other side closed/.test(blob);
}

// Runs fn(); on a transient error waits RETRY_DELAYS_MS[i] and retries.
// Non-transient errors (e.g. SQL syntax) throw immediately. After the last
// attempt the error is rethrown so callers can decide what to do.
async function withRetry(fn, label = 'db op') {
  const max = RETRY_DELAYS_MS.length;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransientDbError(err)) throw err;          // SQL/logic error → fail fast
      if (attempt === max) {
        console.error(`[db retry] ${label}: attempt ${attempt}/${max} failed (${err.message}) — giving up`);
        throw err;
      }
      const delay = RETRY_DELAYS_MS[attempt - 1];
      console.warn(`[db retry] ${label}: attempt ${attempt}/${max} failed (${err.message}) — retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── schema + indexes (idempotent) ──
// Folds BOTH former driver groups (better-sqlite3 tables + the sqlite3
// init_db.js tables) into one place. Indexes cover every column used in a
// WHERE/JOIN — Turso meters rows scanned, so unindexed filters waste reads.
async function initSchema() {
  const ddl = [
    // ── feedback / reports / reviews / subscribers / followups ──
    `CREATE TABLE IF NOT EXISTS feedback (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       crop TEXT, disease TEXT, accuracy TEXT,
       comment TEXT, region TEXT, lang TEXT, ts TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS disease_reports (
       id INTEGER PRIMARY KEY,
       crop TEXT, disease TEXT, lat REAL, lon REAL,
       severity TEXT, lang TEXT, date TEXT,
       verified INTEGER DEFAULT 0, source TEXT DEFAULT 'app'
     )`,
    `CREATE TABLE IF NOT EXISTS review_requests (
       id INTEGER PRIMARY KEY,
       crop TEXT, disease TEXT, symptoms TEXT,
       contact TEXT, lang TEXT, date TEXT,
       status TEXT DEFAULT 'pending', has_image INTEGER DEFAULT 0,
       verdict TEXT, notes TEXT, verified_at TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS push_subscribers (
       key TEXT PRIMARY KEY,
       subscription TEXT, lang TEXT, region TEXT, crop TEXT, created_at TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS sms_subscribers (
       phone TEXT PRIMARY KEY,
       region TEXT, crop TEXT, lang TEXT, subscribed_at TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS followups (
       id INTEGER PRIMARY KEY,
       diagnosis_id TEXT, crop TEXT, disease TEXT,
       before_date TEXT, after_date TEXT,
       improvement TEXT, has_image INTEGER DEFAULT 0, created_at TEXT
     )`,
    // ── auth / catalog / diagnoses (formerly init_db.js) ──
    `CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT UNIQUE NOT NULL,
       password TEXT NOT NULL,
       role TEXT CHECK(role IN ('admin','agronomist')) DEFAULT 'agronomist',
       created_at TEXT DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS crops (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL UNIQUE,
       local_names TEXT, scientific_name TEXT, category TEXT,
       created_at TEXT DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS diseases (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       crop_id INTEGER, name TEXT NOT NULL,
       type TEXT CHECK(type IN ('Disease','Pest')),
       pathogen TEXT, symptoms TEXT, severity TEXT,
       management_cultural TEXT, management_biological TEXT, management_chemical TEXT,
       source TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (crop_id) REFERENCES crops(id)
     )`,
    `CREATE TABLE IF NOT EXISTS diagnoses (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       farmer_id TEXT DEFAULT 'anonymous',
       crop_id INTEGER NOT NULL, disease_id INTEGER,
       disease_name TEXT, severity TEXT, confidence REAL,
       photo_url TEXT, latitude REAL, longitude REAL,
       region TEXT, notes TEXT, impact_etb INTEGER DEFAULT 0,
       status TEXT DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (crop_id) REFERENCES crops(id)
     )`,
    `CREATE TABLE IF NOT EXISTS stats_cache (
       id INTEGER PRIMARY KEY CHECK(id = 1),
       total_diagnoses INTEGER DEFAULT 0,
       total_impact_etb INTEGER DEFAULT 0,
       last_updated TEXT DEFAULT CURRENT_TIMESTAMP
     )`,
    // ── indexes (every filtered/joined column) ──
    `CREATE INDEX IF NOT EXISTS idx_feedback_id          ON feedback(id)`,
    `CREATE INDEX IF NOT EXISTS idx_reports_date         ON disease_reports(date)`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_status       ON review_requests(status)`,
    `CREATE INDEX IF NOT EXISTS idx_users_username       ON users(username)`,
    `CREATE INDEX IF NOT EXISTS idx_diseases_crop_id     ON diseases(crop_id)`,
    `CREATE INDEX IF NOT EXISTS idx_diagnoses_created    ON diagnoses(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_diagnoses_latlon     ON diagnoses(latitude, longitude)`,
    // ── seed the singleton stats row ──
    `INSERT OR IGNORE INTO stats_cache (id) VALUES (1)`
  ];
  // Retry the whole DDL block — it's idempotent (IF NOT EXISTS / INSERT OR
  // IGNORE), so re-running after a cold-start "fetch failed" is safe.
  await withRetry(async () => {
    for (const sql of ddl) await db.execute(sql);
  }, 'initSchema');
}

module.exports = { db, dbAll, dbGet, dbRun, initSchema, withRetry };
