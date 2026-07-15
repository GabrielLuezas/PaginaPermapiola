const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────────────────────
// Server launch: August 8, 2026 at 22:00 Spain (CEST = UTC+2)
//                → 20:00 UTC
// ──────────────────────────────────────────────────────────────
const SERVER_START_UTC = new Date('2026-08-08T20:00:00Z');

// Hours after launch at which each group gets revealed
const GROUP_REVEAL_HOURS = {
  1:  0,   2:  0,   // Launch  → Grupos 1–2
  3:  12,  4:  12,  5:  12,   // +12h    → Grupos 3–5
  6:  24,  7:  24,  8:  24,   // +24h    → Grupos 6–8
  9:  36,  10: 36,  11: 36,   // +36h    → Grupos 9–11
};

function isGroupRevealed(groupNum) {
  const requiredHours = GROUP_REVEAL_HOURS[groupNum];
  if (requiredHours === undefined) return false; // Unknown group → block
  const now = Date.now();
  const elapsedHours = (now - SERVER_START_UTC.getTime()) / 3_600_000;
  return elapsedHours >= requiredHours;
}

// ──────────────────────────────────────────────────────────────
// Guard: /images/grupoN.png  →  403 if not yet revealed
// ──────────────────────────────────────────────────────────────
app.get('/images/grupo:num.png', (req, res, next) => {
  const num = parseInt(req.params.num, 10);
  if (!isGroupRevealed(num)) {
    return res.status(403).send('Not yet revealed');
  }
  next(); // Let the static middleware serve the file
});

// ──────────────────────────────────────────────────────────────
// Static files (Angular build output)
// ──────────────────────────────────────────────────────────────
const DIST = path.join(__dirname, 'dist/permapiola-web/browser');
app.use(express.static(DIST));

// SPA fallback — all other routes → index.html (Angular routing)
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PermaPiola server running on port ${PORT}`);
});
