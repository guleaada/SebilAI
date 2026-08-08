// SebilAI — standalone DB initializer (libSQL / Turso).
// `npm run init-db` runs this. It just calls the shared initSchema() from
// db/client.js, so the schema + indexes stay defined in exactly one place.
// Targets Turso when TURSO_DATABASE_URL/TURSO_AUTH_TOKEN are set, otherwise
// the local file:sebilai.db.
require('dotenv').config();
const { initSchema } = require('./db/client');

(async () => {
  console.log('🚀 Initializing SebilAI database (libSQL)...');
  try {
    await initSchema();
    console.log('✅ Schema + indexes initialized successfully!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Schema init failed:', e.message);
    process.exit(1);
  }
})();
