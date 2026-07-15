const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────────────────────
// Reveal schedule — one UTC datetime per group batch.
// Images are served ONLY after their reveal date has passed.
// Update this object when a new batch is announced.
// ──────────────────────────────────────────────────────────────
const REVEAL_DATES = {
  1:  new Date('2026-07-14T00:00:00Z'), // Tandas 1 — ya anunciados
  2:  new Date('2026-07-14T00:00:00Z'), // Tandas 2 — ya anunciados
  3:  new Date('2026-07-14T00:00:00Z'), // Tandas 3 — ya anunciados
  4:  new Date('2026-07-14T00:00:00Z'), // Tandas 4 — ya anunciados
  5:  new Date('2026-07-14T00:00:00Z'), // Tandas 5 — ya anunciados
  6:  new Date('2026-07-16T04:00:00Z'), // Tandas 6 (+10h desde anuncio)
  7:  new Date('2026-07-16T04:00:00Z'), // Tandas 7
  8:  new Date('2026-07-16T04:00:00Z'), // Tandas 8
  9:  new Date('2026-07-16T16:00:00Z'), // Tandas 9  (+22h desde anuncio)
  10: new Date('2026-07-16T16:00:00Z'), // Tandas 10
  11: new Date('2026-07-16T16:00:00Z'), // Tandas 11
};

function isGroupRevealed(groupNum) {
  const revealAt = REVEAL_DATES[groupNum];
  if (!revealAt) return false; // Unknown group → block
  return Date.now() >= revealAt.getTime();
}

// ──────────────────────────────────────────────────────────────
// Guard: /images/grupoN.png  →  403 if not yet revealed
// ──────────────────────────────────────────────────────────────
app.get('/images/grupo:num.png', (req, res, next) => {
  const num = parseInt(req.params.num, 10);
  if (!isGroupRevealed(num)) {
    return res.status(403).send('Not yet revealed');
  }
  next();
});

// ──────────────────────────────────────────────────────────────
// Static files (Angular build output)
// ──────────────────────────────────────────────────────────────
const DIST = path.join(__dirname, 'dist/permapiola-web/browser');
app.use(express.static(DIST));

// SPA fallback — Angular routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PermaPiola server running on port ${PORT}`);
});
