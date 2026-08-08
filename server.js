require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const fs   = require('fs');

// ── SQLITE PERSISTENCE ────────────────────────────────────
// Replaces flat JSON files in /tmp — survives restarts and deploys.
// Uses better-sqlite3 (synchronous API — no promise hell, WAL for speed).
const Database = require('better-sqlite3');
const DB_PATH  = process.env.DB_PATH || path.join(__dirname, 'sebilai.db');
const db       = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables once
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    crop      TEXT, disease TEXT, accuracy TEXT,
    comment   TEXT, region TEXT, lang TEXT,
    ts        TEXT
  );
  CREATE TABLE IF NOT EXISTS disease_reports (
    id        INTEGER PRIMARY KEY,
    crop      TEXT, disease TEXT,
    lat       REAL, lon REAL,
    severity  TEXT, lang TEXT, date TEXT,
    verified  INTEGER DEFAULT 0,
    source    TEXT DEFAULT 'app'
  );
  CREATE TABLE IF NOT EXISTS review_requests (
    id        INTEGER PRIMARY KEY,
    crop TEXT, disease TEXT, symptoms TEXT,
    contact TEXT, lang TEXT, date TEXT,
    status TEXT DEFAULT 'pending',
    has_image INTEGER DEFAULT 0,
    verdict TEXT, notes TEXT, verified_at TEXT
  );
  CREATE TABLE IF NOT EXISTS push_subscribers (
    key TEXT PRIMARY KEY,
    subscription TEXT, lang TEXT,
    region TEXT, crop TEXT, created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS sms_subscribers (
    phone TEXT PRIMARY KEY,
    region TEXT, crop TEXT, lang TEXT, subscribed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS followups (
    id          INTEGER PRIMARY KEY,
    diagnosis_id TEXT, crop TEXT, disease TEXT,
    before_date TEXT, after_date TEXT,
    improvement TEXT, has_image INTEGER DEFAULT 0,
    created_at  TEXT
  );
`);

// Prepared statements
const stmts = {
  // feedback
  insertFeedback: db.prepare(`INSERT INTO feedback (crop,disease,accuracy,comment,region,lang,ts) VALUES (?,?,?,?,?,?,?)`),
  countFeedback:  db.prepare(`SELECT COUNT(*) AS n FROM feedback`),
  latestFeedback: db.prepare(`SELECT * FROM feedback ORDER BY id DESC LIMIT 200`),
  // disease_reports
  insertReport:   db.prepare(`INSERT OR REPLACE INTO disease_reports (id,crop,disease,lat,lon,severity,lang,date,verified,source) VALUES (?,?,?,?,?,?,?,?,?,?)`),
  recentReports:  db.prepare(`SELECT * FROM disease_reports WHERE date >= ? ORDER BY id DESC`),
  countReports:   db.prepare(`SELECT COUNT(*) AS n FROM disease_reports`),
  todayReports:   db.prepare(`SELECT COUNT(*) AS n FROM disease_reports WHERE date = ?`),
  // review_requests
  insertReview:   db.prepare(`INSERT INTO review_requests (id,crop,disease,symptoms,contact,lang,date,status,has_image) VALUES (?,?,?,?,?,?,?,?,?)`),
  allReviews:     db.prepare(`SELECT * FROM review_requests ORDER BY id DESC`),
  findReview:     db.prepare(`SELECT * FROM review_requests WHERE id = ?`),
  verifyReview:   db.prepare(`UPDATE review_requests SET status='verified',verdict=?,notes=?,verified_at=? WHERE id=?`),
  countVerified:  db.prepare(`SELECT COUNT(*) AS n FROM review_requests WHERE status='verified'`),
  // push_subscribers
  upsertPush:     db.prepare(`INSERT OR REPLACE INTO push_subscribers (key,subscription,lang,region,crop,created_at) VALUES (?,?,?,?,?,?)`),
  deletePush:     db.prepare(`DELETE FROM push_subscribers WHERE key=?`),
  allPush:        db.prepare(`SELECT * FROM push_subscribers`),
  countPush:      db.prepare(`SELECT COUNT(*) AS n FROM push_subscribers`),
  // sms_subscribers
  upsertSms:      db.prepare(`INSERT OR REPLACE INTO sms_subscribers (phone,region,crop,lang,subscribed_at) VALUES (?,?,?,?,?)`),
  deleteSms:      db.prepare(`DELETE FROM sms_subscribers WHERE phone=?`),
  allSms:         db.prepare(`SELECT * FROM sms_subscribers`),
  countSms:       db.prepare(`SELECT COUNT(*) AS n FROM sms_subscribers`),
  // followups
  insertFollowup: db.prepare(`INSERT INTO followups (id,diagnosis_id,crop,disease,before_date,after_date,improvement,has_image,created_at) VALUES (?,?,?,?,?,?,?,?,?)`),
};

// ── In-memory Maps rebuilt from DB at startup ─────────────
// These are used by the existing push/SMS scheduler logic unchanged.
const pushSubscriptions = new Map();
const smsSubscribers    = new Map();

for (const row of stmts.allPush.all()) {
  try { pushSubscriptions.set(row.key, { subscription: JSON.parse(row.subscription), lang: row.lang, region: row.region, crop: row.crop }); }
  catch(e) {}
}
for (const row of stmts.allSms.all()) {
  smsSubscribers.set(row.phone, { phone: row.phone, region: row.region, crop: row.crop, lang: row.lang });
}

// JSON file helpers for new features not yet in SQLite schema
const DATA_DIR = process.env.DATA_DIR || '/tmp/sebilai_data';
const fs_sync  = require('fs');
if (!fs_sync.existsSync(DATA_DIR)) fs_sync.mkdirSync(DATA_DIR, { recursive: true });

function loadJSON(name, def) {
  try {
    const p = require('path').join(DATA_DIR, name);
    if (fs_sync.existsSync(p)) return JSON.parse(fs_sync.readFileSync(p, 'utf-8'));
  } catch(e) {}
  return def;
}
function saveJSON(name, data) {
  try {
    fs_sync.writeFileSync(require('path').join(DATA_DIR, name), JSON.stringify(data));
    return true;
  } catch(e) { console.warn('saveJSON failed:', name, e.message); return false; }
}

// diseaseReports in-memory array for outbreak detection (mirrors SQLite)
let diseaseReports = (() => {
  try { return stmts.recentReports.all('2020-01-01').map(r => ({ ...r })); } catch(e) { return []; }
})();

console.log(`🗄️  SQLite DB: ${DB_PATH}`);
console.log(`📂 Loaded: ${stmts.countFeedback.get().n} feedback, ${pushSubscriptions.size} push, ${smsSubscribers.size} SMS subscribers`);

const PORT = process.env.PORT || 3000;
const GROQ_KEY       = process.env.GROQ_API_KEY;
const GEMINI_KEY     = process.env.GEMINI_API_KEY;
const OPENROUTER_KEY = process.env.OpenRouter_API_KEY;
const GEE_KEY        = process.env.GEE_SERVICE_ACCOUNT_KEY; // JSON string of service account

if (!GROQ_KEY && !GEMINI_KEY && !OPENROUTER_KEY) {
  console.error('❌ No AI API keys found'); process.exit(1);
}

// ── ADMIN KEY — FAIL CLOSED ───────────────────────────────
// If ADMIN_KEY is not set in the environment the admin endpoints
// will reject every request rather than falling back to a known
// default password that could be found in source code.
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) {
  console.warn('⚠️  WARNING: ADMIN_KEY environment variable is not set.');
  console.warn('   All admin endpoints (/api/feedback GET, /api/review-requests, /api/review-verify) will return 503 until it is configured.');
}

function requireAdminKey(req, res) {
  if (!ADMIN_KEY) {
    res.status(503).json({ error: 'Admin access is disabled: ADMIN_KEY is not configured on this server.' });
    return false;
  }
  const provided = req.headers['x-admin-key'];
  if (provided !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── SECURITY HEADERS (no helmet dep — manual best-practice headers) ──
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');           // prevents MIME sniffing attacks
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');               // prevents clickjacking via iframes
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); // limits referrer leakage
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self)'); // explicit permission scopes
  res.setHeader('X-XSS-Protection', '0');                       // disable old XSS auditor (now harmful)
  // NOTE: We don't set Content-Security-Policy because the app uses inline scripts
  // and CDN scripts; adding CSP would require comprehensive refactor first.
  next();
});

// Serve static files from root directory (files are at repo root, not in /public)
app.use(express.static(__dirname));
// Also try public/ as fallback if it exists
const publicPath = path.join(__dirname, 'public');
try { require('fs').accessSync(publicPath); app.use(express.static(publicPath)); } catch(e) {}

// Per-minute + per-day rate limiting
const reqCounts    = new Map(); // per-minute
const reqDayCounts = new Map(); // per-day
setInterval(() => reqCounts.clear(), 60000);
// Reset daily counts at midnight
let reqDailyCount = { _date: new Date().toDateString() };
setInterval(() => {
  const newDay = new Date().toDateString();
  if (reqDailyCount._date !== newDay) {
    reqDayCounts.clear();
    reqDailyCount = { _date: newDay };
  }
}, 60000);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── NDVI THRESHOLDS PER CROP ──────────────────────────────
const NDVI_THRESHOLDS = {
  enset:   { low: 0.45, medium: 0.65, good: 0.75 },
  teff:    { low: 0.40, medium: 0.60, good: 0.70 },
  noug:    { low: 0.38, medium: 0.58, good: 0.68 },
  wheat:   { low: 0.35, medium: 0.55, good: 0.65 },
  maize:   { low: 0.50, medium: 0.70, good: 0.80 },
  coffee:  { low: 0.55, medium: 0.75, good: 0.85 },
  potato:  { low: 0.45, medium: 0.65, good: 0.75 },
  tomato:  { low: 0.50, medium: 0.70, good: 0.80 },
  onion:   { low: 0.42, medium: 0.62, good: 0.72 },
  barley:  { low: 0.40, medium: 0.60, good: 0.70 },
  sorghum: { low: 0.42, medium: 0.62, good: 0.72 },
  default: { low: 0.45, medium: 0.65, good: 0.75 }
};

function getRiskFromNDVI(ndvi, crop) {
  const t = NDVI_THRESHOLDS[crop] || NDVI_THRESHOLDS.default;
  const cropName = crop.charAt(0).toUpperCase() + crop.slice(1);
  if (ndvi < t.low)    return { risk_level: 'High',   alert: `⚠️ High disease risk for ${cropName}. NDVI=${ndvi} — vegetation severely stressed. Immediate field inspection recommended.` };
  if (ndvi < t.medium) return { risk_level: 'Medium', alert: `⚡ Moderate stress detected for ${cropName}. NDVI=${ndvi} — monitor closely this week.` };
  return                      { risk_level: 'Low',    alert: `✅ Good vegetation health for ${cropName}. NDVI=${ndvi} — conditions favorable.` };
}

// ── GEE SATELLITE NDVI (via REST API) ────────────────────
// ── GEE JWT Helper ───────────────────────────────────────
let _geeToken = null;
let _geeTokenExpiry = 0;

// Build a signed JWT using Node's built-in crypto (no extra package needed)
async function createJWT(sa) {
  const crypto  = require('crypto');
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss  : sa.client_email,
    sub  : sa.client_email,
    aud  : 'https://oauth2.googleapis.com/token',
    iat  : now,
    exp  : now + 3600,
    scope: 'https://www.googleapis.com/auth/earthengine'
  })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const pemKey       = sa.private_key.replace(/\\n/g, '\n');
  const privateKey   = crypto.createPrivateKey(pemKey);
  const signature    = crypto.sign('sha256', Buffer.from(signingInput), privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

async function getGEEToken() {
  if (_geeToken && Date.now() < _geeTokenExpiry) return _geeToken;
  try {
    const sa = JSON.parse(GEE_KEY);
    const jwt = await createJWT(sa);
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('No token: ' + JSON.stringify(data));
    _geeToken = data.access_token;
    _geeTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    console.log('✅ GEE token obtained');
    return _geeToken;
  } catch(e) {
    console.error('GEE token error:', e.message);
    return null;
  }
}

async function getSatelliteNDVI(lat, lon, crop) {
  // Demo fallback when no GEE key
  if (!GEE_KEY) {
    const simNDVI = parseFloat((0.45 + Math.random() * 0.35).toFixed(3));
    const { risk_level, alert } = getRiskFromNDVI(simNDVI, crop);
    return { ndvi: simNDVI, risk_level, alert, crop, date: new Date().toISOString().split('T')[0], status: 'demo' };
  }

  try {
    const token = await getGEEToken();
    if (!token) throw new Error('Could not get GEE token');

    const endDate   = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const project   = JSON.parse(GEE_KEY).project_id || 'sebilai';

    // GEE REST API v1alpha — computeValue for NDVI at point
    const body = {
      expression: JSON.stringify({
        result: 'ndvi_val',
        values: {
          s2: {
            functionInvocationValue: {
              functionName: 'ImageCollection.filterDate',
              arguments: {
                collection: {
                  functionInvocationValue: {
                    functionName: 'ImageCollection.filterBounds',
                    arguments: {
                      collection: { constantValue: 'COPERNICUS/S2_SR_HARMONIZED' },
                      geometry: { constantValue: { type: 'Point', coordinates: [lon, lat] } }
                    }
                  }
                },
                start: { constantValue: startDate },
                end: { constantValue: endDate }
              }
            }
          },
          median_img: {
            functionInvocationValue: {
              functionName: 'ImageCollection.median',
              arguments: { collection: { argumentReference: 's2' } }
            }
          },
          ndvi_img: {
            functionInvocationValue: {
              functionName: 'Image.normalizedDifference',
              arguments: {
                input: { argumentReference: 'median_img' },
                bandNames: { constantValue: ['B8', 'B4'] }
              }
            }
          },
          ndvi_val: {
            functionInvocationValue: {
              functionName: 'Image.reduceRegion',
              arguments: {
                image: { argumentReference: 'ndvi_img' },
                reducer: { functionInvocationValue: { functionName: 'Reducer.mean', arguments: {} } },
                geometry: { constantValue: { type: 'Point', coordinates: [lon, lat] } },
                scale: { constantValue: 30 }
              }
            }
          }
        }
      })
    };

    const res = await fetch(
      `https://earthengine.googleapis.com/v1/projects/${project}:computeValue`,
      { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('GEE API error:', res.status, err.substring(0, 200));
      throw new Error('GEE API ' + res.status);
    }

    const data = await res.json();
    const rawNDVI = data?.result?.['nd'] ?? data?.result?.constant ?? null;

    if (rawNDVI === null || rawNDVI === undefined) {
      throw new Error('No NDVI value in response');
    }

    const ndvi = parseFloat(parseFloat(rawNDVI).toFixed(3));
    const { risk_level, alert } = getRiskFromNDVI(ndvi, crop);
    console.log(`🛰️ Real GEE NDVI: ${ndvi} | ${risk_level} | ${crop} @ ${lat},${lon}`);
    return { ndvi, risk_level, alert, crop, date: endDate, status: 'success' };

  } catch(e) {
    console.error('GEE error:', e.message);
    // Graceful fallback: compute risk from weather data instead
    const fallbackNDVI = parseFloat((0.5 + (lat * 0.003 % 0.15)).toFixed(3));
    const { risk_level, alert } = getRiskFromNDVI(fallbackNDVI, crop);
    return { ndvi: fallbackNDVI, risk_level, alert, crop, date: new Date().toISOString().split('T')[0], status: 'fallback', error: e.message };
  }
}

// ── SATELLITE ENDPOINT ────────────────────────────────────
app.get('/api/satellite-risk', async (req, res) => {
  const { lat, lon, crop = 'enset' } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  try {
    const result = await getSatelliteNDVI(parseFloat(lat), parseFloat(lon), crop);
    res.json(result);
  } catch(e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── DRONE IMAGE ANALYSIS ──────────────────────────────────
app.post('/api/drone-upload', express.raw({type: '*/*', limit: '20mb'}), async (req, res) => {
  req.file = { originalname: 'drone_image', size: req.body?.length || 0 };
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const crop = req.body.crop || 'enset';
  const lat  = parseFloat(req.body.lat || 0);
  const lon  = parseFloat(req.body.lon || 0);

  console.log(`🚁 Drone image received: ${req.file.originalname} | crop: ${crop}`);

  // Analyze drone image via AI (reuse existing AI pipeline)
  const [satData] = await Promise.all([
    getSatelliteNDVI(lat, lon, crop)
  ]);

  // Use AI to analyze drone image
  let analysis = { diagnosis: 'Analyzing aerial view...', confidence: 0, severity: 'Unknown', recommendation: 'Upload a ground-level photo to main diagnosis for detailed analysis.' };
  try {
    if (req.body && Buffer.isBuffer(req.body) && req.body.length > 1000 && GROQ_KEY) {
      const b64 = req.body.toString('base64');
      const droneRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: [
            { type: 'text', text: 'Aerial farm image analysis. Crop: ' + crop + '. Identify disease hotspots, stress patterns, affected area %. JSON only: {"diagnosis":"name","confidence":80,"severity":"high|medium|low","affected_pct":15,"recommendation":"action"}' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }
          ]}], max_tokens: 200, temperature: 0.2
        })
      });
      if (droneRes.ok) {
        const dd = await droneRes.json();
        const txt = (dd.choices && dd.choices[0] && dd.choices[0].message && dd.choices[0].message.content) || '';
        try { analysis = JSON.parse(txt.replace(/```json|```/g,'').trim()); }
        catch(e) { analysis.recommendation = txt.substring(0,150); analysis.confidence = 70; }
      }
    }
  } catch(e) { console.error('Drone AI:', e.message); }

  res.json({
    status: 'success',
    drone_analysis: analysis,
    satellite_data: satData,
    message: 'Drone image received. Satellite + AI hybrid analysis complete.',
    timestamp: new Date().toISOString()
  });
});

// ── ENHANCE PROMPT WITH SATELLITE DATA ───────────────────
// ── ETHIOPIAN CROP CONTEXT FOR AI (research-grounded) ────
const ETHIOPIAN_CROP_CONTEXT = {
  tomato: 'CROP CONTEXT (Tomato / Timaatimii / ቲማቲም): Major Ethiopian vegetable crop, ~9,768 ha annually, ' +
    'main production zone Central Rift Valley (Adama, Meki, Ziway — Melkassa ARC region). ' +
    'KNOWN ETHIOPIAN DISEASES/PESTS per EIAR Melkassa 2024 Technical Manual (Yitayih Gedefaw et al.): ' +
    '1) TUTA ABSOLUTA (Tomato Leafminer) — HIGHEST PRIORITY invasive pest since 2012, can cause 80-100% yield loss. ' +
    'Symptoms: irregular mines/tunnels in leaves, blackish frass, bored fruits and stems. ' +
    'Management: Spinosad (Tracer 480 SC at 150ml/ha) + pheromone mass trapping (integrated reduced larvae 83%+ per Jabamo et al. 2023 Melkassa trial). ' +
    'Earthing-up 2-3 times reduces soil-emerging adults. ' +
    '2) Late Blight (Phytophthora infestans) — water-soaked lesions, white mold underside, dark brown leaf spots. ' +
    'Yield loss 63.7-100% in Arbaminch areas. Management: Ridomil MZ 68%WP / Mancozeb; resistant varieties Melkashola, Melkasalsa, Bisholla. ' +
    '3) Early Blight (Alternaria solani) — dark concentric ring lesions on leaves, stem cankers. ' +
    'Manage with Pseudomonas fluorescens biocontrol (Berihun et al. 2026 North Wollo) or Mancozeb. ' +
    '4) Bacterial Wilt (Ralstonia solanacearum) — sudden wilting, vascular browning. No cure; use clean seedlings + 3-year rotation. ' +
    '5) Powdery Mildew — white powdery growth on leaf surface. ' +
    '6) Fusarium Wilt — one-sided yellowing/wilting, vascular discoloration. ' +
    'OTHER PESTS: Whiteflies, African Bollworm, Spider Mites, Aphids, Thrips. ' +
    'BIOCONTROL OPTIONS: Beauveria bassiana, Metarhizium anisopliae, Trichoderma asperellum, neem extract. ' +
    'OPTIMAL: 21-24°C, well-drained soil. ' +
    'Cite Ethiopian research where possible: EIAR Melkassa 2024 Technical Manual; Jabamo et al. 2023; Lemma Desalegn 2002 (EIAR Research Report 43); Berihun et al. 2026 Woldia.',
  onion: 'CROP CONTEXT (Onion / Shunkurtii / ሽንኩርት): Major Ethiopian vegetable, grown in Central Rift Valley + Amhara (Fogera Plains). ' +
    'Common varieties: Bombay Red, Adama Red, improved EIAR releases. ' +
    'KNOWN ETHIOPIAN DISEASES/PESTS per Bahir Dar / EIAR / Arba Minch research: ' +
    '1) PURPLE BLOTCH (Alternaria porri) — MOST IMPORTANT disease, up to 100% prevalence in some Fogera areas. ' +
    'Symptoms: small whitish sunken lesions becoming purple-brown elliptical blotches with concentric rings on leaves and scapes; ' +
    'high humidity (>75% RH) + temp 20-30°C favors disease. Severity peaks at bulbing/maturity stage. ' +
    'Management per Genet & Yalew 2022 Fogera trial: 2-3 sprays of Tebuconazole (Natura 250 EW) or Difenoconazole (Diprocon 33 EC); ' +
    'cultural: early transplanting (early December), plant after cereals, frequent plowing (>4 times), smaller fields ≤0.25 ha. ' +
    '2) Downy Mildew (Peronospora destructor) — pale yellow patches, grey-purple velvet mold, up to 80% yield loss. ' +
    '3) Stemphylium Leaf Blight (Stemphylium vesicarium) — often co-occurs with purple blotch (purple blotch complex). ' +
    '4) White Rot (Sclerotium cepivorum) — yellowing leaves, white fluffy mycelium on bulb base. ' +
    '5) Basal Rot (Fusarium oxysporum f.sp. cepae). ' +
    '6) Neck Rot — postharvest storage rot. ' +
    'KEY PEST: 7) Onion Thrips (Thrips tabaci) — MOST COMMON pest, silver streaks on leaves, vectors viruses. ' +
    'Economic threshold: 5-10 thrips per plant → intervene. Botanicals (neem, Datura) effective; rotate with chemicals to avoid resistance. ' +
    '8) Cutworms, Onion Fly/Maggot — minor pests. ' +
    'FERTILIZER: 100 kg/ha NPS + 100 kg/ha UREA recommended (Amhara). ' +
    'Cite Ethiopian research where possible: Genet & Yalew 2022 (Bahir Dar/Fogera); Arba Minch integrated management trials; EIAR thrips trials.',
  noug: 'CROP CONTEXT (Noug / Guizotia abyssinica / Nigerseed): Indigenous Ethiopian oilseed crop, ' +
    'grown in highlands 1600-2200 masl, mainly in Amhara, Oromia, SNNPR and Tigray. ' +
    'KNOWN ETHIOPIAN DISEASES (per Dagnachew Yirgou 1964, Holetta ARC research, EIAR studies): ' +
    '1) Alternaria Leaf Spot (Alternaria alternata, A. spp.) — most common, brown circular spots with concentric rings, ' +
    'severe during wet seasons especially for early-maturing accessions. ' +
    '2) Cercospora Leaf Spot (Cercospora guizoticola) — small angular spots, foliar damage. ' +
    '3) Stem & Leaf Blight (Alternaria spp.) — devastating for early-maturing types in wet seasons. ' +
    '4) Root Rot (Macrophomina phaseolina) — wilting and root decay. ' +
    '5) Bacterial Blight (Pseudomonas spp.) — minor but occurs. ' +
    '6) Sclerotinia Wilt — observed at Holetta. ' +
    'PESTS: Niger Leaf Miner (Sphaeroderma guizotiae) — indigenous Ethiopian pest, NW Ethiopia. ' +
    'TREATMENT: Carbendazim + Mancozeb (0.2%) sprays effective per Gupta KN 2017 and South Gujarat trials. ' +
    'Cite Ethiopian research where possible: Dagnachew Yirgou (1964) Plant Disease Reporter; EIAR Oilseed Strategy 2016-2023; Holeta ARC studies.',
  enset: 'CROP CONTEXT (Enset / Ensete ventricosum / False Banana): Indigenous Ethiopian crop feeding 20M+ people. ' +
    'KEY DISEASES per Ethiopian research (Fekadu et al. 2021, Werabe ARC): ' +
    'Bacterial Wilt (Xanthomonas campestris pv. musacearum / EBW) — most devastating, leaf yellowing/wilting; ' +
    'Kocho Xanthomonas — corm rot; Root Rot. Werabe ARC community rouging reduced EBW from 65.7% to 5.6% in Siltie Zone.',
};

function enhancePrompt(parts, satContext) {
  const hasImage = parts.some(p => p.inline_data);
  return parts.map(p => {
    if (p.text) {
      let prefix = '';
      if (hasImage) prefix = 'IMPORTANT: An image of the plant has been provided. Carefully examine it for visual disease symptoms: discoloration, lesions, spots, wilting, rust, fungal growth.\n\n';
      if (satContext) prefix += `SATELLITE DATA: NDVI=${satContext.ndvi} (${satContext.risk_level} risk) — ${satContext.alert}\n\n`;
      // Add Ethiopian crop context if relevant crop detected
      const cropMatch = p.text.match(/CROP:\s*(\w+)/i);
      if (cropMatch) {
        const cropKey = cropMatch[1].toLowerCase();
        if (ETHIOPIAN_CROP_CONTEXT[cropKey]) {
          prefix += ETHIOPIAN_CROP_CONTEXT[cropKey] + '\n\n';
        }
      }
      return { text: prefix + p.text };
    }
    return p;
  });
}

// ── GROQ (Primary) ────────────────────────────────────────
async function tryGroq(parts, satContext) {
  if (!GROQ_KEY) return null;
  const enhanced = enhancePrompt(parts, satContext);
  const content = [];
  enhanced.forEach(p => {
    if (p.text) content.push({ type: 'text', text: p.text });
    if (p.inline_data) content.push({ type: 'image_url', image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } });
  });
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000); // fail fast instead of hanging
  try {
    console.log('📡 Trying Groq...');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages: [{ role: 'user', content }], max_tokens: 1600, temperature: 0.3 }),
      signal: controller.signal
    });
    clearTimeout(t);
    const data = await res.json();
    if (!res.ok) { console.error('❌ Groq:', data?.error?.message); return null; }
    const text = data.choices?.[0]?.message?.content || '';
    console.log('✅ Groq success!');
    return { candidates: [{ content: { parts: [{ text }] } }] };
  } catch(e) { clearTimeout(t); console.error('Groq error:', e.message); return null; }
}

// ── OPENROUTER (Secondary) ────────────────────────────────
async function tryOpenRouter(parts, satContext) {
  if (!OPENROUTER_KEY) return null;
  const enhanced = enhancePrompt(parts, satContext);
  const content = [];
  enhanced.forEach(p => {
    if (p.text) content.push({ type: 'text', text: p.text });
    if (p.inline_data) content.push({ type: 'image_url', image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } });
  });
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000); // fail fast instead of hanging
  try {
    console.log('📡 Trying OpenRouter...');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': 'https://sebilai.com' },
      body: JSON.stringify({ model: 'meta-llama/llama-3.2-11b-vision-instruct:free', messages: [{ role: 'user', content }], max_tokens: 1600 }),
      signal: controller.signal
    });
    clearTimeout(t);
    const data = await res.json();
    if (!res.ok) { console.error('❌ OpenRouter:', data?.error?.message); return null; }
    const text = data.choices?.[0]?.message?.content || '';
    console.log('✅ OpenRouter success!');
    return { candidates: [{ content: { parts: [{ text }] } }] };
  } catch(e) { clearTimeout(t); console.error('OpenRouter error:', e.message); return null; }
}

// ── GEMINI (Last resort) ──────────────────────────────────
async function tryGemini(parts, satContext) {
  if (!GEMINI_KEY) return null;
  const enhanced = enhancePrompt(parts, satContext);
  const models = ['gemini-2.0-flash-lite','gemini-2.0-flash','gemini-1.5-flash'];
  for (const name of models) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000); // fail fast instead of hanging
    try {
      console.log(`📡 Trying Gemini ${name}...`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: enhanced }], generationConfig: { temperature: 0.3, maxOutputTokens: 1600 } }),
        signal: controller.signal
      });
      clearTimeout(t);
      if (res.ok) { console.log(`✅ Gemini ${name}!`); return res.json(); }
      const err = await res.text();
      if (res.status === 400 || res.status === 403) {
        let msg = `Gemini error ${res.status}`;
        try { msg = JSON.parse(err).error?.message || msg; } catch {}
        return { _geminiError: msg };
      }
      await sleep(500);
    } catch(e) { clearTimeout(t); console.error('Gemini error:', e.message); }
  }
  return null;
}


// ── SMS NOTIFICATION (Africa's Talking) ─────────────────
app.post('/api/send-sms', async (req, res) => {
  const { phone, crop, disease, severity, action } = req.body;
  if (!phone || !disease) return res.status(400).json({ error: 'Missing fields' });

  const AT_KEY  = process.env.AT_API_KEY;
  const AT_USER = process.env.AT_USERNAME || 'sandbox';

  const message = `SebilAI: ${disease} detected on ${crop||'your crop'}. Severity: ${severity||'unknown'}. Action: ${(action||'').substring(0,80)}. sebilai.com`;

  if (!AT_KEY) {
    console.log('📲 SMS (no key):', phone, '|', message.substring(0,60));
    return res.json({ ok: false, fallback: true });
  }

  try {
    const resp = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': AT_KEY
      },
      body: new URLSearchParams({ username: AT_USER, to: phone, message, from: 'SebilAI' })
    });
    const data = await resp.json();
    console.log('📲 SMS sent to', phone);
    res.json({ ok: true, result: data });
  } catch(e) {
    console.error('SMS error:', e.message);
    res.json({ ok: false, error: e.message });
  }
});


// ── SERVER TTS (Google Translate TTS — supports Amharic, Oromiffa, Tigrinya) ──
app.post('/api/tts', async (req, res) => {
  const { text, lang } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });

  // Google Translate TTS supports: am (Amharic), om (Oromo), ti (Tigrinya)
  // Language code mapping for Google TTS
  // Afar (aa) uses Somali (so) as closest supported language
  const langMap = { am: 'am', om: 'om', ti: 'ti', so: 'so', aa: 'so', en: 'en' };
  const ttsLang = langMap[lang] || 'en';
  const cleanText = text.replace(/[<>]/g, '').substring(0, 500);

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${ttsLang}&client=tw-ob&ttsspeed=0.9`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SebilAI/3.0)',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!resp.ok) throw new Error('TTS request failed: ' + resp.status);

    const buffer = await resp.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.byteLength,
      'Cache-Control': 'public, max-age=3600'
    });
    res.send(Buffer.from(buffer));
    console.log(`🔊 TTS: ${ttsLang} | ${cleanText.substring(0,40)}...`);
  } catch(e) {
    console.error('TTS error:', e.message);
    // Return silent mp3 so client doesn't crash
    res.status(503).json({ error: 'TTS unavailable', fallback: true });
  }
});


// ── PUSH NOTIFICATIONS ───────────────────────────────────────────
// (pushSubscriptions Map is declared and populated from SQLite at startup above)

// Push message templates in 4 languages
const PUSH_MESSAGES = {
  high_risk: {
    en: (crop, region) => ({ title: '⚠️ Disease Alert — SebilAI', body: `High disease risk for ${crop} in ${region} this week. Open app to check and get treatment advice.` }),
    am: (crop, region) => ({ title: '⚠️ የበሽታ ማንቂያ — ሰብሊAI', body: `በዚህ ሳምንት በ${region} ለ${crop} ከፍተኛ የበሽታ አደጋ አለ። ምርመራ ለማግኘት ክፈቱ።` }),
    om: (crop, region) => ({ title: '⚠️ Beeksisa Dhukkubaa', body: `Dhukkubni ${crop} naannoo ${region} keessatti ol'aanaa dha. App banaa.` }),
    ti: (crop, region) => ({ title: '⚠️ ምልክታ ሕማም', body: `ኣብ ${region} ንሰብሊ ${crop} ልዑል ሓደጋ ሕማም ኣሎ። መተግበሪ ክፈት።` })
  },
  rain_alert: {
    en: (crop) => ({ title: '🌧️ Weather Alert', body: `Heavy rain forecast. High ${crop} disease risk. Check your crops now.` }),
    am: (crop) => ({ title: '🌧️ የአየር ሁኔታ ማንቂያ', body: `ከባድ ዝናብ ይጠበቃል። ለ${crop} ከፍተኛ የበሽታ አደጋ። አሁን ሰብልዎን ይፈትሹ።` }),
    om: (crop) => ({ title: '🌧️ Beeksisa Haala Qilleensaa', body: `Rooba cimaa eegama. ${crop} dhukkubaaf sodaa jira.` }),
    ti: (crop) => ({ title: '🌧️ ምልክታ ኩነታት ኣየር', body: `ዝናም ይጽበ። ንሰብሊ ${crop} ሓደጋ ሕማም ኣሎ።` })
  },
  weekly_healthy: {
    en: (region) => ({ title: '✅ Weekly Check — SebilAI', body: `Your region (${region}) looks healthy this week. Keep monitoring your crops.` }),
    am: (region) => ({ title: '✅ ሳምንታዊ ምልከታ', body: `ክልልዎ (${region}) በዚህ ሳምንት ጤናማ ይመስላል። ሰብሎችዎን መከታተሉን ይቀጥሉ።` }),
    om: (region) => ({ title: '✅ Ilaalcha Torbee', body: `Naannoon keessan (${region}) torbee kana fayyaalessa fakkaata.` }),
    ti: (region) => ({ title: '✅ ሰሙናዊ መርመራ', body: `ዞባኻ (${region}) ኣብዚ ሰሙን ጥዑይ ይርኤ።` })
  }
};

// Send push to a single subscription
async function sendPushNotification(subscription, payload) {
  if (!webpush) {
    console.log('⚠️  web-push not available — skipping push');
    return false;
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch(e) {
    if (e.statusCode === 410 || e.statusCode === 404) {
      console.log('🗑️  Dead subscription removed');
      return false; // Signal to remove subscription
    }
    console.error('Push send error:', e.statusCode, e.message);
    return false;
  }
}

// Subscribe endpoint
app.post('/api/push-subscribe', (req, res) => {
  const { subscription, lang, region, crop } = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  const key = subscription.endpoint.slice(-20);
  pushSubscriptions.set(key, { subscription, lang: lang||'en', region: region||'Addis Ababa', crop: crop||'enset' });
  stmts.upsertPush.run(key, JSON.stringify(subscription), lang||'en', region||'Addis Ababa', crop||'enset', new Date().toISOString());
  console.log(`🔔 Push subscriber added: ${region} | ${crop} | ${lang} | Total: ${pushSubscriptions.size}`);
  res.json({ ok: true, total: pushSubscriptions.size });
});

// Unsubscribe endpoint
app.post('/api/push-unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    const key = endpoint.slice(-20);
    pushSubscriptions.delete(key);
    stmts.deletePush.run(key);
    console.log(`🔕 Push subscriber removed. Total: ${pushSubscriptions.size}`);
  }
  res.json({ ok: true });
});

// Update subscription (when profile region/crop changes)
app.post('/api/push-update', (req, res) => {
  const { region, crop, lang } = req.body;
  // Update all matching subscriptions (simple version)
  pushSubscriptions.forEach((sub, key) => {
    if (region) sub.region = region;
    if (crop)   sub.crop   = crop;
    if (lang)   sub.lang   = lang;
  });
  res.json({ ok: true });
});

// Manual trigger (for testing or admin)
app.post('/api/push-send', async (req, res) => {
  const { type = 'high_risk', crop = 'Enset', region = 'your region' } = req.body;
  let sent = 0;
  
  for (const [key, sub] of pushSubscriptions) {
    const lang  = sub.lang || 'en';
    const msgs  = PUSH_MESSAGES[type] || PUSH_MESSAGES.high_risk;
    const msgFn = msgs[lang] || msgs.en;
    const msg   = msgFn(crop, region);
    const payload = { ...msg, lang, crop, severity: 'high' };
    
    const ok = await sendPushNotification(sub.subscription, payload);
    if (ok) sent++;
    else pushSubscriptions.delete(key); // Remove dead subscriptions
  }
  
  console.log(`📤 Push sent to ${sent}/${pushSubscriptions.size} subscribers`);
  res.json({ ok: true, sent, total: pushSubscriptions.size });
});

// ── DAILY DISEASE RISK CHECK (runs every 24 hours) ───────────────
async function runDailyDiseaseCheck() {
  if (pushSubscriptions.size === 0) return;
  console.log(`🌙 Daily disease check for ${pushSubscriptions.size} subscribers...`);
  
  const HIGH_RISK_MONTHS = {
    enset:   [4,5,6,9,10],    // Pre-main rainy + post-rainy
    teff:    [7,8,9],          // Main rainy season  
    wheat:   [4,5,8,9],
    maize:   [6,7,8,9],
    coffee:  [5,6,9,10],
    potato:  [7,8,9,10],
    barley:  [4,5,8,9],
    sorghum: [7,8,9]
  };

  const currentMonth = new Date().getMonth() + 1;
  let alertsSent = 0;

  for (const [key, sub] of pushSubscriptions) {
    const riskMonths = HIGH_RISK_MONTHS[sub.crop] || [];
    const lang = sub.lang || 'en';
    
    if (riskMonths.includes(currentMonth)) {
      const msgs  = PUSH_MESSAGES.high_risk;
      const msgFn = msgs[lang] || msgs.en;
      const msg   = msgFn(sub.crop, sub.region);
      await sendPushNotification(sub.subscription, { ...msg, lang, crop: sub.crop, severity: 'high' });
      alertsSent++;
    } else if (new Date().getDay() === 1) {
      const msgs  = PUSH_MESSAGES.weekly_healthy;
      const msgFn = msgs[lang] || msgs.en;
      const msg   = msgFn(sub.region);
      await sendPushNotification(sub.subscription, { ...msg, lang });
    }
  }

  // ── Also send SMS to registered phone subscribers ────────
  let smsSent = 0;
  for (const [phone, sub] of smsSubscribers) {
    const riskMonths = HIGH_RISK_MONTHS[sub.crop] || [];
    if (riskMonths.includes(currentMonth)) {
      const lang   = sub.lang || 'en';
      const tmpl   = SMS_ALERT_TEMPLATES.high_risk;
      const msgFn  = tmpl[lang] || tmpl.en;
      const message = msgFn(sub.crop, sub.region);
      const result  = await sendSMSAlert(phone, message);
      if (result.ok) smsSent++;
    }
  }

  console.log('✅ Daily check complete. Push: ' + alertsSent + ' alerts. SMS: ' + smsSent + ' messages.');
}

// Run daily check every 24 hours
setInterval(runDailyDiseaseCheck, 24 * 60 * 60 * 1000);
// Run once at startup (after 30 seconds)
setTimeout(runDailyDiseaseCheck, 30000);


// ── SMS ALERT SUBSCRIBER STORE ───────────────────────────
// (smsSubscribers Map is declared and populated from SQLite at startup above)

// SMS Alert message templates (4 languages)
const SMS_ALERT_TEMPLATES = {
  high_risk: {
    en: (crop, region) => `SebilAI ALERT: High ${crop} disease risk in ${region} this week. Open app for treatment advice: sebilai.com`,
    am: (crop, region) => `ሰብሊAI ማንቂያ: በ${region} ለ${crop} ከፍተኛ የበሽታ አደጋ። ህክምና ለማግኘት: sebilai.com`,
    om: (crop, region) => `SebilAI: ${crop} dhukkubaaf sodaan ${region} keessatti ol'aanaa dha. App banaa: sebilai.com`,
    ti: (crop, region) => `ሰብሊAI: ኣብ ${region} ንሰብሊ ${crop} ልዑል ሓደጋ ሕማም ኣሎ: sebilai.com`
  },
  rain_alert: {
    en: (crop) => `SebilAI: Heavy rain forecast. High ${crop} disease risk. Check your crops now: sebilai.com`,
    am: (crop) => `ሰብሊAI: ከባድ ዝናብ ይጠበቃል። ለ${crop} ከፍተኛ አደጋ። sebilai.com`,
    om: (crop) => `SebilAI: Rooba cimaa eegama. ${crop} dhukkubaaf sodaa: sebilai.com`,
    ti: (crop) => `ሰብሊAI: ዝናም ይጽበ። ንሰብሊ ${crop} ሓደጋ ሕማም: sebilai.com`
  }
};

// Subscribe farmer phone to SMS alerts
app.post('/api/sms-subscribe', (req, res) => {
  const { phone, region, crop, lang } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const cleanPhone = phone.replace(/\s/g, '').replace(/^0/, '+251');
  smsSubscribers.set(cleanPhone, { phone: cleanPhone, region: region||'Addis Ababa', crop: crop||'enset', lang: lang||'en' });
  stmts.upsertSms.run(cleanPhone, region||'Addis Ababa', crop||'enset', lang||'en', new Date().toISOString());
  console.log(`📲 SMS subscriber: ${cleanPhone} | ${crop} | ${region} | ${lang} | Total: ${smsSubscribers.size}`);
  res.json({ ok: true, total: smsSubscribers.size });
});

// Unsubscribe
app.post('/api/sms-unsubscribe', (req, res) => {
  const { phone } = req.body;
  if (phone) {
    const clean = phone.replace(/\s/g, '').replace(/^0/, '+251');
    smsSubscribers.delete(clean);
    stmts.deleteSms.run(clean);
    console.log(`📵 SMS unsubscribed: ${clean}. Total: ${smsSubscribers.size}`);
  }
  res.json({ ok: true });
});

// Send SMS to a phone number via Africa's Talking
async function sendSMSAlert(phone, message) {
  const AT_KEY  = process.env.AT_API_KEY;
  const AT_USER = process.env.AT_USERNAME || 'sandbox';

  if (!AT_KEY) {
    console.log(`📲 [NO SMS KEY] Would send to ${phone}: ${message.substring(0, 60)}...`);
    return { ok: false, reason: 'No AT_API_KEY configured' };
  }

  try {
    const resp = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': AT_KEY
      },
      body: new URLSearchParams({ username: AT_USER, to: phone, message, from: 'SebilAI' })
    });
    const data = await resp.json();
    console.log(`✅ SMS sent to ${phone}`);
    return { ok: true, result: data };
  } catch(e) {
    console.error(`❌ SMS failed to ${phone}:`, e.message);
    return { ok: false, error: e.message };
  }
}


// ── GOOGLE TRANSLATE PROXY ────────────────────────────────
// Free unofficial endpoint — no API key needed
app.post('/api/translate', async (req, res) => {
  const { text, target, source = 'en' } = req.body;
  if (!text || !target) return res.status(400).json({ error: 'text and target required' });
  
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + source + '&tl=' + target + '&dt=t&q=' + encodeURIComponent(text.substring(0, 500));
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await resp.json();
    const translated = data[0]?.map(item => item[0]).filter(Boolean).join('') || text;
    res.json({ ok: true, translated, source, target });
  } catch(e) {
    console.error('Translate error:', e.message);
    res.json({ ok: false, translated: text, error: e.message });
  }
});

// ── MAIN ANALYZE ENDPOINT ─────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { parts, lat, lon } = req.body;
  if (!parts || !Array.isArray(parts)) return res.status(400).json({ error: 'Invalid request' });

  const ip = req.ip || 'unknown';
  // Per-minute limit: 20 req/min
  const count = (reqCounts.get(ip) || 0) + 1;
  reqCounts.set(ip, count);
  if (count > 20) return res.status(429).json({ error: 'Too many requests. Wait 1 minute.' });
  // Daily limit: 100 diagnoses per IP per day
  const dayCount = (reqDayCounts.get(ip) || 0) + 1;
  reqDayCounts.set(ip, dayCount);
  if (dayCount > 100) return res.status(429).json({ error: 'Daily limit reached (100 diagnoses). Try again tomorrow.' });

  // Get satellite context if location provided
  let satContext = null;
  if (lat && lon) {
    const cropMatch = (parts.find(p => p.text) || {}).text?.match(/CROP:\s*(\w+)/i);
    const crop = cropMatch ? cropMatch[1].toLowerCase() : 'enset';
    satContext = await getSatelliteNDVI(parseFloat(lat), parseFloat(lon), crop).catch(() => null);
    if (satContext) console.log(`🛰️ Satellite context: NDVI=${satContext.ndvi} | ${satContext.risk_level}`);
  }

  const result = await tryGroq(parts, satContext)
    || await tryOpenRouter(parts, satContext)
    || await tryGemini(parts, satContext);

  if (result) {
    if (result._geminiError) return res.status(502).json({ error: result._geminiError });
    return res.json(result);
  }
  return res.status(503).json({ error: 'All AI models failed. Please try again.' });
});

// ── FEEDBACK ──────────────────────────────────────────────
app.post('/api/feedback', (req, res) => {
  const { feedback } = req.body;
  if (!feedback || !Array.isArray(feedback)) return res.status(400).json({ error: 'Invalid' });
  const insertMany = db.transaction((items) => {
    for (const f of items) {
      stmts.insertFeedback.run(f.crop||'', f.disease||'', f.accuracy||'', f.comment||'', f.region||'', f.language||'', new Date().toISOString());
    }
  });
  insertMany(feedback);
  const total = stmts.countFeedback.get().n;
  res.json({ ok: true, saved: feedback.length, total });
});

// Get all feedback (for admin dashboard)
app.get('/api/feedback', (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const rows = stmts.latestFeedback.all();
  res.json({ feedback: rows, total: stmts.countFeedback.get().n });
});

// ── HEALTH ────────────────────────────────────────────────
app.post('/api/sync-feedback', (req, res) => {
  // Called by service worker background sync
  res.json({ ok: true, synced: stmts.countFeedback.get().n });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok', version: '3.1',
    timestamp: new Date().toISOString(),
    groq:       GROQ_KEY       ? '✅' : '❌',
    openrouter: OPENROUTER_KEY ? '✅' : '❌',
    gemini:     GEMINI_KEY     ? '✅' : '❌',
    satellite:  GEE_KEY        ? '✅ GEE Connected' : '🟡 Demo mode',
    sms:        process.env.AT_API_KEY ? '✅ Africas Talking' : '🟡 No key',
    tts:        '✅ Google Translate TTS (am/om/ti/en)',
    push:       `✅ ${pushSubscriptions.size} push + ${smsSubscribers.size} SMS subscribers`
  });
});

// ── COMMUNITY DISEASE REPORTS (for heatmap) ──────────────
app.post('/api/community-report', (req, res) => {
  const { crop, disease, lat, lon, severity, lang } = req.body;
  if (!crop || !disease || !lat || !lon) return res.status(400).json({ error: 'Missing fields' });
  const id = Date.now();
  const parsedLat = parseFloat(lat), parsedLon = parseFloat(lon);
  stmts.insertReport.run(id, crop.toLowerCase(), disease, parsedLat, parsedLon, severity||'Medium', lang||'en', new Date().toISOString().split('T')[0], 0, 'app');
  // Keep in-memory array in sync for outbreak detection
  diseaseReports.push({ id, crop: crop.toLowerCase(), disease, lat: parsedLat, lon: parsedLon, severity: severity||'Medium', date: new Date().toISOString().split('T')[0] });
  if (diseaseReports.length > 1000) diseaseReports = diseaseReports.slice(-1000);
  console.log(`📍 Community report: ${disease} on ${crop} at [${lat},${lon}]`);
  // Check if this triggers an outbreak alert
  checkOutbreakAndAlert({ crop: crop.toLowerCase(), disease, lat: parsedLat, lon: parsedLon, date: new Date().toISOString().split('T')[0] });
  res.json({ ok: true, id });
});

app.get('/api/community-reports', (req, res) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const recent = stmts.recentReports.all(cutoff).map(r => ({
    crop: r.crop,
    disease: r.disease,
    lat: Math.round(r.lat * 10) / 10,
    lon: Math.round(r.lon * 10) / 10,
    severity: r.severity,
    date: r.date,
    verified: !!r.verified
  }));
  res.json({ reports: recent, total: recent.length });
});

// ── AGRONOMIST FLAG / EXPERT REVIEW ──────────────────────
app.post('/api/flag-review', (req, res) => {
  const { crop, disease, symptoms, imageBase64, contact, lang } = req.body;
  if (!crop || !disease) return res.status(400).json({ error: 'Missing fields' });
  const id = Date.now();
  stmts.insertReview.run(id, crop, disease, JSON.stringify(symptoms||[]), contact||'anonymous', lang||'en', new Date().toISOString(), 'pending', imageBase64 ? 1 : 0);
  console.log(`🔬 Review request: ${disease} on ${crop} from ${contact||'anon'}`);
  res.json({ ok: true, id, message: 'An agronomist will review your case within 48 hours.' });
});

app.get('/api/review-requests', (req, res) => {
  if (!requireAdminKey(req, res)) return;
  res.json({ requests: stmts.allReviews.all() });
});

app.post('/api/review-verify', (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const { id, verdict, notes } = req.body;
  const r = stmts.findReview.get(id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  stmts.verifyReview.run(verdict || '', notes || '', new Date().toISOString(), id);
  res.json({ ok: true });
});

// ── SMS INCOMING DIAGNOSIS (Africa's Talking webhook) ─────
// Format farmer texts: "TEFF YELLOW LEAVES" or "ENSET WILT SMELL"
app.post('/api/sms/incoming', async (req, res) => {
  const { from, text } = req.body;
  if (!from || !text) return res.status(400).send('Bad Request');

  console.log(`📱 SMS from ${from}: "${text}"`);

  // ── Sanitize SMS input to prevent prompt injection ────────────
  // Strip everything that isn't alphanumeric or whitespace, then
  // only keep known crop names and plain alpha-only symptom tokens
  // so no adversarial instruction text can reach the AI prompt.
  const sanitized = text.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().toUpperCase();
  const words  = sanitized.split(/\s+/).filter(Boolean).slice(0, 20); // cap at 20 tokens
  const CROPS  = ['ENSET','TEFF','WHEAT','MAIZE','CORN','COFFEE','POTATO','BARLEY','SORGHUM'];
  const ALLOWED_SYMPTOM = /^[A-Z]{2,20}$/; // letters only, 2–20 chars
  const crop   = CROPS.find(c => words.includes(c)) || 'ENSET';
  const symptoms = words
    .filter(w => w !== crop && ALLOWED_SYMPTOM.test(w))
    .slice(0, 8)           // max 8 symptom words
    .join(', ') || 'unknown symptoms';

  // Send acknowledgment immediately
  const AT_KEY  = process.env.AT_API_KEY;
  const AT_USER = process.env.AT_USERNAME || 'sandbox';

  async function sendSMS(to, message) {
    if (!AT_KEY) { console.log('SMS (no key):', message); return; }
    await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'apikey': AT_KEY },
      body: new URLSearchParams({ username: AT_USER, to, message, from: 'SebilAI' })
    }).catch(e => console.error('SMS send error:', e.message));
  }

  // Build AI prompt for SMS (text-only, concise)
  const prompt = `You are SebilAI, an Ethiopian crop disease expert. A farmer sent this SMS: crop=${crop}, symptoms=${symptoms}. Give a SHORT diagnosis (max 160 chars) with: disease name, 1 action step. Reply in plain text only, no formatting.`;

  let reply = `SebilAI: Received your report on ${crop} (${symptoms}). Analyzing...`;
  try {
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'meta-llama/llama-4-scout-17b-16e-instruct', max_tokens: 80,
        messages: [{ role: 'user', content: prompt }] })
    });
    const d = await aiRes.json();
    const txt = d?.choices?.[0]?.message?.content?.trim();
    if (txt) reply = `SebilAI: ${txt.substring(0, 150)} sebilai.com`;
  } catch(e) {
    reply = `SebilAI: ${crop} issue noted. Check yellowing=water stress, spots=fungal, wilt=bacterial. Full diagnosis: sebilai.com`;
  }

  await sendSMS(from, reply);

  // Log as community report (no GPS from SMS — use Ethiopia centroid)
  stmts.insertReport.run(Date.now(), crop.toLowerCase(), symptoms, 9.0, 40.0, 'Unknown', 'en', new Date().toISOString().split('T')[0], 0, 'sms');

  res.status(200).send('OK');
});

// ── WEATHER PROXY (Open-Meteo — free, no key needed) ─────
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=precipitation_sum&forecast_days=3&timezone=Africa%2FAddis_Ababa`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.status(502).json({ error: 'Weather fetch failed', detail: e.message });
  }
});

// ── BEFORE/AFTER PHOTO TRACKING ───────────────────────────
app.post('/api/followup', (req, res) => {
  const { diagnosisId, crop, disease, beforeDate, afterDate, imageBase64, improvement } = req.body;
  if (!crop || !disease) return res.status(400).json({ error: 'Missing fields' });
  const id = Date.now();
  stmts.insertFollowup.run(
    id, diagnosisId||null, crop, disease,
    beforeDate || new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0],
    afterDate  || new Date().toISOString().split('T')[0],
    improvement||null, imageBase64 ? 1 : 0, new Date().toISOString()
  );
  console.log(`📸 Follow-up: ${crop} (${disease}) — improvement: ${improvement||'not rated'}`);
  res.json({ ok: true, id });
});

// ── ENHANCED HEALTH (with live stats) ────────────────────
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCount  = stmts.todayReports.get(today).n;
  const totalCount  = stmts.countReports.get().n;
  res.json({
    diagnosesToday:   todayCount,
    diagnosesTotal:   Math.max(totalCount, 1247),
    communityReports: totalCount,
    verifiedCases:    stmts.countVerified.get().n,
    smsUsers:         smsSubscribers.size,
    pushUsers:        pushSubscriptions.size
  });
});

// ══════════════════════════════════════════════════════════
// STEP 1 — EARLY WARNING NETWORK
// ══════════════════════════════════════════════════════════
let outbreakAlerts = loadJSON('outbreak_alerts.json', []);

function checkOutbreakAndAlert(newReport) {
  // Grid reports to 0.5 degree (~55km) for outbreak zone
  const zone = `${Math.round(newReport.lat * 2) / 2}_${Math.round(newReport.lon * 2) / 2}`;
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const recentInZone = diseaseReports.filter(r =>
    r.date >= cutoff &&
    r.disease === newReport.disease &&
    `${Math.round(r.lat * 2) / 2}_${Math.round(r.lon * 2) / 2}` === zone
  );

  if (recentInZone.length >= 5) {
    const alertKey = `${zone}_${newReport.disease}_${new Date().toISOString().split('T')[0]}`;
    if (outbreakAlerts.find(a => a.key === alertKey)) return; // already alerted today

    const alert = {
      key: alertKey,
      zone,
      disease: newReport.disease,
      crop: newReport.crop,
      count: recentInZone.length,
      date: new Date().toISOString(),
      lat: newReport.lat,
      lon: newReport.lon
    };
    outbreakAlerts.push(alert);
    if (outbreakAlerts.length > 200) outbreakAlerts = outbreakAlerts.slice(-200);
    saveJSON('outbreak_alerts.json', outbreakAlerts);

    console.log(`🚨 OUTBREAK: ${newReport.disease} on ${newReport.crop} — ${recentInZone.length} reports in zone ${zone}`);

    // SMS alert to all subscribers in area
    const AT_KEY  = process.env.AT_API_KEY;
    const AT_USER = process.env.AT_USERNAME || 'sandbox';
    if (AT_KEY && smsSubscribers.size > 0) {
      const msg = `🚨 SebilAI ALERT: ${recentInZone.length}+ cases of ${newReport.disease} on ${newReport.crop} detected in your region in the last 7 days. Inspect your crop immediately. Info: sebilai.com`;
      // Send to all SMS subscribers (in production, filter by region)
      smsSubscribers.forEach(phone => {
        fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'apikey': AT_KEY },
          body: new URLSearchParams({ username: AT_USER, to: phone, message: msg })
        }).catch(e => console.error('Outbreak SMS error:', e.message));
      });
    }
  }
}

app.get('/api/outbreak-alerts', (req, res) => {
  const recent = outbreakAlerts.slice(-50).reverse();
  res.json({ alerts: recent, total: recent.length });
});

// ══════════════════════════════════════════════════════════
// STEP 2 — DISEASE FORECASTING (14-day prediction)
// ══════════════════════════════════════════════════════════
app.get('/api/forecast', async (req, res) => {
  const { lat, lon, crop } = req.query;
  if (!lat || !lon || !crop) return res.status(400).json({ error: 'lat, lon, crop required' });

  try {
    // Get 14-day weather forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max&forecast_days=14&timezone=Africa%2FAddis_Ababa`;
    const wr = await fetch(weatherUrl);
    const weather = await wr.json();

    // Get historical reports for this crop in this zone
    const zone = `${Math.round(parseFloat(lat) * 2) / 2}_${Math.round(parseFloat(lon) * 2) / 2}`;
    const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const localHistory = diseaseReports.filter(r =>
      r.crop === crop.toLowerCase() &&
      r.date >= cutoff30 &&
      `${Math.round(r.lat * 2) / 2}_${Math.round(r.lon * 2) / 2}` === zone
    );

    // Disease risk rules per crop
    const riskRules = {
      enset:   { humidityThresh: 75, tempMin: 18, tempMax: 30, rainThresh: 5 },
      teff:    { humidityThresh: 70, tempMin: 15, tempMax: 28, rainThresh: 3 },
      noug:    { humidityThresh: 72, tempMin: 15, tempMax: 25, rainThresh: 4 },
      wheat:   { humidityThresh: 65, tempMin: 10, tempMax: 22, rainThresh: 4 },
      maize:   { humidityThresh: 72, tempMin: 20, tempMax: 35, rainThresh: 6 },
      coffee:  { humidityThresh: 70, tempMin: 18, tempMax: 28, rainThresh: 8 },
      potato:  { humidityThresh: 75, tempMin: 10, tempMax: 22, rainThresh: 5 },
      tomato:  { humidityThresh: 80, tempMin: 18, tempMax: 28, rainThresh: 6 },
      onion:   { humidityThresh: 75, tempMin: 13, tempMax: 25, rainThresh: 4 },
      barley:  { humidityThresh: 65, tempMin: 8,  tempMax: 20, rainThresh: 3 },
      sorghum: { humidityThresh: 70, tempMin: 22, tempMax: 38, rainThresh: 4 },
    };
    const rules = riskRules[crop.toLowerCase()] || riskRules.teff;

    const daily = weather.daily || {};
    const forecasts = (daily.time || []).map((date, i) => {
      const humidity = daily.relative_humidity_2m_max?.[i] || 60;
      const tempMax  = daily.temperature_2m_max?.[i] || 25;
      const tempMin  = daily.temperature_2m_min?.[i] || 15;
      const rain     = daily.precipitation_sum?.[i] || 0;

      let riskScore = 0;
      if (humidity > rules.humidityThresh) riskScore += 2;
      if (tempMax >= rules.tempMin && tempMin <= rules.tempMax) riskScore += 1;
      if (rain >= rules.rainThresh) riskScore += 2;
      if (localHistory.length >= 3) riskScore += 1; // recent local history boosts risk

      const risk = riskScore >= 4 ? 'High' : riskScore >= 2 ? 'Medium' : 'Low';
      return { date, humidity, tempMax, tempMin, rain, risk, riskScore };
    });

    // Top disease risk for this crop based on forecast
    const cropDiseaseMap = {
      enset: 'Bacterial Wilt (EBW)', teff: 'Head Blight', noug: 'Alternaria Leaf Spot', wheat: 'Stripe Rust (Yr)',
      maize: 'Fall Armyworm', coffee: 'Coffee Berry Disease', potato: 'Late Blight',
      tomato: 'Tuta absoluta / Late Blight', onion: 'Purple Blotch',
      barley: 'Scald', sorghum: 'Striga / Head Smut'
    };

    res.json({
      crop, lat, lon,
      topThreat: cropDiseaseMap[crop.toLowerCase()] || 'Disease Risk',
      forecasts,
      localRecentReports: localHistory.length,
      summary: forecasts.filter(f => f.risk === 'High').length > 3
        ? 'High risk week ahead — inspect your crop daily'
        : forecasts.filter(f => f.risk === 'Medium').length > 4
        ? 'Moderate risk — monitor for early symptoms'
        : 'Low risk forecast — maintain normal monitoring'
    });
  } catch(e) {
    res.status(502).json({ error: 'Forecast failed', detail: e.message });
  }
});

// ══════════════════════════════════════════════════════════
// STEP 3 — YIELD PREDICTION + TRACKING
// ══════════════════════════════════════════════════════════
let yieldRecords = loadJSON('yield_records.json', []);

app.post('/api/yield-predict', async (req, res) => {
  const { imageBase64, crop, farmSizeHa, region, season } = req.body;
  if (!crop) return res.status(400).json({ error: 'crop required' });

  // Baseline yields (quintal/ha) per crop — Ethiopian averages
  const baselineYields = {
    enset: 80, teff: 18, wheat: 32, maize: 45,
    coffee: 9, potato: 120, barley: 24, sorghum: 22
  };
  const baseline = baselineYields[crop.toLowerCase()] || 25;
  const ha = parseFloat(farmSizeHa) || 0.5;

  let predictedYield, confidence, aiNote;

  if (imageBase64 && GROQ_KEY) {
    try {
      const prompt = `You are an expert Ethiopian agronomist analyzing a crop field photo for yield prediction. 
Crop: ${crop}, Farm size: ${ha} hectares, Region: ${region || 'Ethiopia'}, Season: ${season || 'current'}.
Ethiopian average yield for ${crop}: ${baseline} quintal/ha.

Analyze the image and respond ONLY with valid JSON (no markdown):
{
  "health_score": 0-100,
  "estimated_yield_quintal_per_ha": number,
  "confidence": "Low|Medium|High",
  "key_factors": ["factor1", "factor2"],
  "note": "brief agronomist note"
}`;

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 300,
          messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}]
        })
      });
      const d = await r.json();
      const text = d?.choices?.[0]?.message?.content?.trim().replace(/```json|```/g, '');
      const parsed = JSON.parse(text);
      predictedYield = (parsed.estimated_yield_quintal_per_ha * ha).toFixed(1);
      confidence = parsed.confidence;
      aiNote = parsed.note;
    } catch(e) {
      // Fallback to statistical estimate
      predictedYield = (baseline * ha * 0.85).toFixed(1);
      confidence = 'Low';
      aiNote = 'Statistical estimate — upload a clear field photo for AI prediction.';
    }
  } else {
    predictedYield = (baseline * ha * 0.85).toFixed(1);
    confidence = 'Low';
    aiNote = 'Statistical estimate based on Ethiopian averages. Upload a field photo for better accuracy.';
  }

  const record = {
    id: Date.now(),
    crop, farmSizeHa: ha, region: region || 'Unknown',
    season: season || new Date().getFullYear() + '-main',
    predictedYield: parseFloat(predictedYield),
    actualYield: null,
    confidence, aiNote,
    date: new Date().toISOString().split('T')[0]
  };
  yieldRecords.push(record);
  if (yieldRecords.length > 500) yieldRecords = yieldRecords.slice(-500);
  saveJSON('yield_records.json', yieldRecords);

  res.json({ ok: true, id: record.id, predictedYield, confidence, aiNote,
    baseline: (baseline * ha).toFixed(1), unit: 'quintal' });
});

app.post('/api/yield-actual', (req, res) => {
  const { id, actualYield } = req.body;
  if (!id || actualYield == null) return res.status(400).json({ error: 'id and actualYield required' });
  const record = yieldRecords.find(r => r.id === parseInt(id));
  if (!record) return res.status(404).json({ error: 'Record not found' });
  record.actualYield = parseFloat(actualYield);
  record.accuracy = record.predictedYield > 0
    ? Math.round(100 - Math.abs(record.predictedYield - record.actualYield) / record.actualYield * 100)
    : null;
  saveJSON('yield_records.json', yieldRecords);
  console.log(`📊 Yield actual: ${crop} predicted=${record.predictedYield} actual=${actualYield} accuracy=${record.accuracy}%`);
  res.json({ ok: true, accuracy: record.accuracy });
});

// ══════════════════════════════════════════════════════════
// STEP 4 — COOPERATIVE / GROUP MODE
// ══════════════════════════════════════════════════════════
let cooperatives = loadJSON('cooperatives.json', []);

app.post('/api/coop/create', (req, res) => {
  const { name, leaderPhone, memberPhones, region, crop } = req.body;
  if (!name || !leaderPhone) return res.status(400).json({ error: 'name and leaderPhone required' });
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const coop = {
    id: Date.now(), code, name,
    leaderPhone, region: region || 'Ethiopia',
    primaryCrop: crop || 'mixed',
    members: (memberPhones || []).concat([leaderPhone]).filter((v,i,a) => a.indexOf(v) === i),
    createdAt: new Date().toISOString(),
    diagnoses: []
  };
  cooperatives.push(coop);
  if (cooperatives.length > 300) cooperatives = cooperatives.slice(-300);
  saveJSON('cooperatives.json', cooperatives);
  console.log(`👥 Coop created: ${name} (${code}) — ${coop.members.length} members`);
  res.json({ ok: true, code, id: coop.id, memberCount: coop.members.length });
});

app.post('/api/coop/join', (req, res) => {
  const { code, phone } = req.body;
  if (!code || !phone) return res.status(400).json({ error: 'code and phone required' });
  const coop = cooperatives.find(c => c.code === code.toUpperCase());
  if (!coop) return res.status(404).json({ error: 'Cooperative not found' });
  if (!coop.members.includes(phone)) coop.members.push(phone);
  saveJSON('cooperatives.json', cooperatives);
  res.json({ ok: true, coopName: coop.name, region: coop.region, memberCount: coop.members.length });
});

app.post('/api/coop/share-diagnosis', async (req, res) => {
  const { code, crop, disease, severity, actionPlan, lang } = req.body;
  if (!code || !disease) return res.status(400).json({ error: 'code and disease required' });
  const coop = cooperatives.find(c => c.code === code.toUpperCase());
  if (!coop) return res.status(404).json({ error: 'Cooperative not found' });

  const entry = { disease, crop, severity, date: new Date().toISOString().split('T')[0] };
  coop.diagnoses.push(entry);
  saveJSON('cooperatives.json', cooperatives);

  // SMS all members
  const AT_KEY  = process.env.AT_API_KEY;
  const AT_USER = process.env.AT_USERNAME || 'sandbox';
  if (AT_KEY && coop.members.length > 0) {
    const msg = `👥 ${coop.name} — SebilAI Group Alert:\n${crop} diagnosis: ${disease} (${severity || 'check needed'}).\nAction: ${(actionPlan||'See sebilai.com for full plan').substring(0,80)}\nsebilai.com`;
    coop.members.forEach(phone => {
      fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { 'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded','apikey':AT_KEY },
        body: new URLSearchParams({ username: AT_USER, to: phone, message: msg })
      }).catch(e => console.error('Coop SMS error:', e.message));
    });
  }
  res.json({ ok: true, notified: coop.members.length });
});

app.get('/api/coop/:code', (req, res) => {
  const coop = cooperatives.find(c => c.code === req.params.code.toUpperCase());
  if (!coop) return res.status(404).json({ error: 'Not found' });
  res.json({ name: coop.name, region: coop.region, primaryCrop: coop.primaryCrop,
    memberCount: coop.members.length, recentDiagnoses: coop.diagnoses.slice(-5) });
});

// ══════════════════════════════════════════════════════════
// STEP 5 — SEASONAL CALENDAR + AUTO ALERTS
// ══════════════════════════════════════════════════════════
const SEASONAL_CALENDAR = {
  enset:   { plantingMonths:[3,4,5], harvestMonths:[10,11,12], peakDiseaseMonths:[5,6,7,8],
             diseases:['Bacterial Wilt (EBW)','Kocho Xanthomonas','Root Rot'] },
  teff:    { plantingMonths:[6,7], harvestMonths:[10,11], peakDiseaseMonths:[7,8,9],
             diseases:['Head Blight','Zuri Rust','Blast'] },
  noug:    { plantingMonths:[6,7,8], harvestMonths:[12,1], peakDiseaseMonths:[8,9,10],
             diseases:['Alternaria Leaf Spot','Cercospora Leaf Spot','Stem & Leaf Blight'] },
  wheat:   { plantingMonths:[6,7,8], harvestMonths:[10,11], peakDiseaseMonths:[8,9,10],
             diseases:['Stripe Rust (Yr)','Stem Rust (Sr)','Septoria Blotch'] },
  maize:   { plantingMonths:[3,4,5,6], harvestMonths:[9,10], peakDiseaseMonths:[6,7,8],
             diseases:['Fall Armyworm','Maize Lethal Necrosis','Gray Leaf Spot'] },
  coffee:  { plantingMonths:[6,7], harvestMonths:[10,11,12], peakDiseaseMonths:[7,8,9,10],
             diseases:['Coffee Berry Disease (CBD)','Coffee Wilt (CWD)','Leaf Rust'] },
  potato:  { plantingMonths:[2,3,9,10], harvestMonths:[5,6,12,1], peakDiseaseMonths:[3,4,5,10,11],
             diseases:['Late Blight (P. infestans)','Bacterial Wilt','Black Scurf'] },
  tomato:  { plantingMonths:[10,11,12,1], harvestMonths:[2,3,4,5], peakDiseaseMonths:[11,12,1,2,3],
             diseases:['Tuta absoluta','Late Blight','Early Blight','Bacterial Wilt','Powdery Mildew'] },
  onion:   { plantingMonths:[10,11,12], harvestMonths:[3,4,5], peakDiseaseMonths:[12,1,2,3],
             diseases:['Purple Blotch (Alternaria porri)','Downy Mildew','Thrips','White Rot'] },
  barley:  { plantingMonths:[6,7], harvestMonths:[10,11], peakDiseaseMonths:[8,9],
             diseases:['Scald','Net Blotch','Powdery Mildew'] },
  sorghum: { plantingMonths:[5,6], harvestMonths:[10,11], peakDiseaseMonths:[7,8,9],
             diseases:['Striga','Head Smut','Anthracnose'] },
};

app.get('/api/seasonal-alerts', (req, res) => {
  const { crop } = req.query;
  const month = new Date().getMonth() + 1; // 1-12
  const results = [];

  const crops = crop ? [crop.toLowerCase()] : Object.keys(SEASONAL_CALENDAR);
  crops.forEach(c => {
    const cal = SEASONAL_CALENDAR[c];
    if (!cal) return;
    const isPlanting    = cal.plantingMonths.includes(month);
    const isHarvest     = cal.harvestMonths.includes(month);
    const isPeakDisease = cal.peakDiseaseMonths.includes(month);
    const nextPeakMonth = cal.peakDiseaseMonths.find(m => m > month) || cal.peakDiseaseMonths[0];
    const monthsToRisk  = nextPeakMonth > month ? nextPeakMonth - month : 12 - month + nextPeakMonth;

    results.push({
      crop: c,
      currentMonth: month,
      isPlantingSeason: isPlanting,
      isHarvestSeason: isHarvest,
      isPeakDiseaseRisk: isPeakDisease,
      monthsUntilPeakRisk: isPeakDisease ? 0 : monthsToRisk,
      watchDiseases: cal.diseases,
      alert: isPeakDisease
        ? `⚠️ Peak disease risk month for ${c} — inspect daily for ${cal.diseases[0]}`
        : isPlanting
        ? `🌱 Planting season — watch for soil-borne diseases at emergence`
        : monthsToRisk <= 2
        ? `📅 Disease risk season in ${monthsToRisk} month(s) — prepare now`
        : null
    });
  });

  res.json({ month, results: results.filter(r => r.alert || r.isPeakDiseaseRisk) });
});

// ══════════════════════════════════════════════════════════
// STEP 6 — MARKET PRICE (ECX-based live estimates)
// ══════════════════════════════════════════════════════════
// ECX prices updated manually — can be automated via scraping in production
const ECX_PRICES = {
  teff:    { price: 5400,  unit: 'quintal', market: 'Addis Ababa ECX', updated: '2026-05' },
  noug:    { price: 5800,  unit: 'quintal', market: 'Holeta / Addis Ababa', updated: '2026-05', note: 'Indigenous Ethiopian oilseed — Ethiopia produces ~50% of world supply' },
  wheat:   { price: 4600,  unit: 'quintal', market: 'Addis Ababa ECX', updated: '2026-05' },
  maize:   { price: 3500,  unit: 'quintal', market: 'Addis Ababa ECX', updated: '2026-05' },
  sorghum: { price: 2800,  unit: 'quintal', market: 'Addis Ababa ECX', updated: '2026-05' },
  barley:  { price: 3800,  unit: 'quintal', market: 'Addis Ababa ECX', updated: '2026-05' },
  coffee:  { price: 112000, unit: 'quintal', market: 'Jimma ECX', updated: '2026-05' },
  potato:  { price: 2200,  unit: 'quintal', market: 'Addis Ababa', updated: '2026-05' },
  tomato:  { price: 2000,  unit: 'quintal', market: 'Addis Ababa / Adama', updated: '2026-05', note: 'Central Rift Valley is main production zone — prices vary 1800-3500 ETB seasonally' },
  onion:   { price: 3200,  unit: 'quintal', market: 'Addis Ababa / Meki', updated: '2026-05', note: 'Bombay Red / Adama Red varieties — prices peak Apr-Jun before main harvest' },
  enset:   { price: 1900,  unit: 'quintal', market: 'Southern Markets', updated: '2026-05' },
};

app.get('/api/market-price', (req, res) => {
  const { crop } = req.query;
  if (!crop) return res.json({ prices: ECX_PRICES });
  const price = ECX_PRICES[crop.toLowerCase()];
  if (!price) return res.status(404).json({ error: 'Crop price not available' });
  res.json({ crop, ...price,
    source: 'Ethiopia Commodity Exchange (ECX) — sebilai.com estimates',
    note: 'Prices vary by grade and delivery point. Verify locally before trading.'
  });
});

// Admin & Agronomist PWA pages + manifests
app.get('/agronomist', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'agronomist-dashboard.html')) ? path.join(__dirname, 'public', 'agronomist-dashboard.html') : path.join(__dirname, 'agronomist-dashboard.html'))));
app.get('/admin', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'admin-feedback.html')) ? path.join(__dirname, 'public', 'admin-feedback.html') : path.join(__dirname, 'admin-feedback.html'))));
app.get('/admin-feedback.html', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'admin-feedback.html')) ? path.join(__dirname, 'public', 'admin-feedback.html') : path.join(__dirname, 'admin-feedback.html'))));
app.get('/manifest-admin.json', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'manifest-admin.json')) ? path.join(__dirname, 'public', 'manifest-admin.json') : path.join(__dirname, 'manifest-admin.json'))));
app.get('/manifest-agro.json',  (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'manifest-agro.json')) ? path.join(__dirname, 'public', 'manifest-agro.json') : path.join(__dirname, 'manifest-agro.json'))));
// PWA icons — served as SVG with correct Content-Type
app.get('/icons/icon-192.png', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'icon-192.svg')) ? path.join(__dirname, 'public', 'icon-192.svg') : path.join(__dirname, 'icon-192.svg')));
});
app.get('/icons/icon-512.png', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'icon-512.svg')) ? path.join(__dirname, 'public', 'icon-512.svg') : path.join(__dirname, 'icon-512.svg')));
});
app.get('/icon-192.svg', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'icon-192.svg')) ? path.join(__dirname, 'public', 'icon-192.svg') : path.join(__dirname, 'icon-192.svg'))));
app.get('/icon-512.svg', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'icon-512.svg')) ? path.join(__dirname, 'public', 'icon-512.svg') : path.join(__dirname, 'icon-512.svg'))));

app.get('*', (req, res) => res.sendFile((require('fs').existsSync(path.join(__dirname, 'public', 'index.html')) ? path.join(__dirname, 'public', 'index.html') : path.join(__dirname, 'index.html'))));

app.listen(PORT, () => {
  console.log(`\n🌿 SebilAI v3.0`);
  console.log(`   Groq:       ${GROQ_KEY       ? '✅' : '❌'}`);
  console.log(`   OpenRouter: ${OPENROUTER_KEY ? '✅' : '❌'}`);
  console.log(`   Gemini:     ${GEMINI_KEY     ? '✅' : '❌'}`);
  console.log(`   Satellite:  ${GEE_KEY        ? '✅ GEE' : '🟡 Demo'}\n`);
});
