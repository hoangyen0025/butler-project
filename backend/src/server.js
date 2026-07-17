const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const contractorRoutes = require('./routes/contractor');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Load backend/.env if present (OPENAI_API_KEY, etc.) without requiring dotenv.
(function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] == null) process.env[key] = value;
    }
  } catch {
    // ignore missing/unreadable .env
  }
})();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/contractor', contractorRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Maintenance API running at http://localhost:${PORT}`);
});
