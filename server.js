const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ──────────────────────────────────────────────────────────────
// Database Connection
// ──────────────────────────────────────────────────────────────
const connectionString = 'postgresql://neondb_owner:npg_WkutSaeA1i7K@ep-wispy-water-avdsdy02-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({
  connectionString,
});

const JWT_SECRET = 'permapiola-secret-key-12345';

// Middleware to parse JWT token if present
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

// ──────────────────────────────────────────────────────────────
// Reveal schedule — one UTC datetime per group batch.
// Images are served ONLY after their reveal date has passed.
// ──────────────────────────────────────────────────────────────
const REVEAL_DATES = {
  1:  new Date('2026-07-14T00:00:00Z'),
  2:  new Date('2026-07-14T00:00:00Z'),
  3:  new Date('2026-07-14T00:00:00Z'),
  4:  new Date('2026-07-14T00:00:00Z'),
  5:  new Date('2026-07-14T00:00:00Z'),
  6:  new Date('2026-07-15T22:00:00Z'),
  7:  new Date('2026-07-15T22:00:00Z'),
  8:  new Date('2026-07-15T22:00:00Z'),
  9:  new Date('2026-07-16T08:11:00Z'),
  10: new Date('2026-07-16T08:11:00Z'),
  11: new Date('2026-07-16T08:11:00Z'),
  12: new Date('2026-07-16T20:15:00Z'),
  13: new Date('2026-07-16T20:15:00Z'),
  14: new Date('2026-07-16T20:15:00Z'),
  15: new Date('2026-07-17T08:15:00Z'),
  16: new Date('2026-07-17T08:15:00Z'),
  17: new Date('2026-07-17T08:15:00Z'),
  18: new Date('2026-07-17T08:15:00Z'),
  19: new Date('2026-07-17T20:15:00Z'),
  20: new Date('2026-07-17T20:15:00Z'),
  21: new Date('2026-07-17T20:15:00Z'),
  22: new Date('2026-07-17T20:15:00Z'),
  23: new Date('2026-07-18T08:15:00Z'),
  24: new Date('2026-07-18T08:15:00Z'),
  25: new Date('2026-07-18T20:15:00Z'),
  26: new Date('2026-07-18T20:15:00Z'),
  27: new Date('2026-07-18T20:15:00Z'),
  28: new Date('2026-07-19T08:15:00Z'),
  29: new Date('2026-07-19T08:15:00Z'),
  30: new Date('2026-07-19T08:15:00Z'),
};

function isGroupRevealed(groupNum) {
  const revealAt = REVEAL_DATES[groupNum];
  if (!revealAt) return false;
  return Date.now() >= revealAt.getTime();
}

app.get('/images/grupo:num.png', (req, res, next) => {
  const num = parseInt(req.params.num, 10);
  if (!isGroupRevealed(num)) {
    return res.status(403).send('Not yet revealed');
  }
  next();
});

// ──────────────────────────────────────────────────────────────
// Authentication Routes
// ──────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, rank) VALUES ($1, $2, $3) RETURNING id, username, rank',
      [username, hashedPassword, 'normal']
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        rank: user.rank
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const result = await pool.query('SELECT id, username, rank FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error en /me:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ──────────────────────────────────────────────────────────────
// Changelog Data & Buffer Calculation
// ──────────────────────────────────────────────────────────────

const PATCHES_DATA = [
  {
    number: 1,
    day: 3,
    revealDate: new Date('2026-07-10T12:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: 'Al matar un jugador obtienes +1 contenedor de vida permanente. Máximo 40 corazones.' },
      { tag: 'NUEVO', text: 'PartyGUI: crea escuadrones de hasta 5. Activa/desactiva fuego amigo y comparte waypoints.' },
      { tag: 'AJUSTE', text: 'Los jugadores que mueran en permadeath quedan en modo espectador sin posibilidad de respawnear.' },
      { tag: 'AJUSTE', text: 'Manzanas doradas reducidas un 60% en bastiones y fortalezas. Notch Apples desactivadas.' },
      { tag: 'NUEVO', text: 'Zonas de Muerte Instantánea: áreas del mapa donde cualquier daño mata sin importar la armadura. Rotan cada 48h.' },
      { tag: 'AJUSTE', text: 'Cooldown de EnderPearls doblado: de 1s a 2s para reducir escapes fáciles en PVP.' }
    ],
    mobs: [
      {
        name: 'Ultra Esqueleto Guerrero',
        img: 'https://minecraft.wiki/images/Skeleton.png',
        hearts: 50,
        equipment: ['Armadura de Diamante Completa', 'Bow Power V', 'Protección V'],
        drop: '20% — Arco Power IV'
      },
      {
        name: 'Ultra Esqueleto Infernal',
        img: 'https://minecraft.wiki/images/Wither_Skeleton.png',
        hearts: 50,
        equipment: ['Diamond Axe Fire Aspect XX', 'Sharpness C'],
        drop: '15% — Hacha de Diamante'
      },
      {
        name: 'Ultra Esqueleto Asesino',
        img: 'https://minecraft.wiki/images/Skeleton.png',
        hearts: 30,
        equipment: ['Crossbow Sharpness C', 'Speed IV'],
        drop: '10% — Ballesta Encantada'
      }
    ],
    items: [
      {
        name: 'Hyper Golden Apple +',
        img: 'https://minecraft.wiki/images/Enchanted_Golden_Apple_JE2_BE2.png',
        description: 'Da +2 contenedores de vida permanentes. Solo se puede consumir 1 vez por jugador.',
        droppedBy: 'Crafteable: 8 × Bloque de Oro + 1 Manzana (centro)',
        craftIngredients: '8 × Oro + Manzana'
      },
      {
        name: 'Escudo Rúnico',
        img: 'https://minecraft.wiki/images/Shield.png',
        description: 'Bloquea el 80% del daño de hechizos si llevas ≥3 libros encantados en inventario.',
        droppedBy: 'Crafteable — receta especial en herrería',
        craftIngredients: 'Herrería especial'
      }
    ]
  },
  {
    number: 2,
    day: 6,
    revealDate: new Date('2026-07-13T12:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: 'Almacenamiento de Muertes: los ítems del jugador eliminado se guardan en cofre reclamable solo por su asesino.' },
      { tag: 'AJUSTE', text: 'Un 50% de los Vindicators en mansiones son ahora Evokers con Resistencia III.' },
      { tag: 'AJUSTE', text: 'El Nether es hostil: Pigmans atacan a cualquier jugador en radio de 32 bloques.' },
      { tag: 'QUITADO', text: 'Tótems de No Morir eliminados del loot normal de cofres.' },
      { tag: 'AJUSTE', text: 'Los Creepers tienen el fuse más rápido (1.2s). Su explosión ignora el 30% de la protección.' }
    ],
    mobs: [
      {
        name: 'EvokerBoss',
        img: 'https://minecraft.wiki/images/Evoker.png',
        hearts: 100,
        equipment: ['SpinningBeam', 'AxeThrow', 'Invoca Vex III'],
        drop: '8% — Tótem de No Morir'
      }
    ],
    items: [
      {
        name: 'Tótem de No Morir',
        img: 'https://minecraft.wiki/images/Totem_of_Undying.png',
        description: 'Solo se obtiene del EvokerBoss. Ya no aparece en cofres de mansiones.',
        droppedBy: '8% de drop del EvokerBoss'
      }
    ]
  },
  {
    number: 3,
    day: 9,
    revealDate: new Date('2026-07-15T12:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: '3 zonas de PVP forzado en el mapa. Los jugadores dentro tienen su posición visible en el mapa de todos.' },
      { tag: 'AJUSTE', text: 'Fuego amigo activo en zonas neutrales. Las PartyGUI siguen protegiendo dentro del grupo.' },
      { tag: 'AJUSTE', text: 'Te ahogas 10x más rápido sin Poción de Respiración Acuática (3 segundos sin poción = muerte).' },
      { tag: 'AJUSTE', text: 'Herramientas sin Netherite al romper roca quitan 8 corazones si no tienes Protección IV.' },
      { tag: 'AJUSTE', text: 'Los Endermans tienen Fuerza X permanente. Mirarlos activa modo Berserk.' }
    ],
    mobs: [
      {
        name: 'Enderman Berserk',
        img: 'https://minecraft.wiki/images/Enderman.png',
        hearts: 40,
        equipment: ['Fuerza X', 'Modo Berserk al contacto visual', 'Daño: 8 corazones por golpe'],
        drop: '25% — Perla de Ender'
      },
      {
        name: 'Drowned Gigante',
        img: 'https://minecraft.wiki/images/Drowned.png',
        hearts: 60,
        equipment: ['Trident Channeling permanente', 'Daño triple vs. jugadores', 'Aparece en aguas > 30 bloques'],
        drop: '30% — Tridente Encantado'
      }
    ],
    items: [
      {
        name: 'Poción Invisibilidad Permanente',
        img: 'https://minecraft.wiki/images/Potion_of_Invisibility.png',
        description: 'Dura 10 min. Se cancela al atacar. Crafteable con 8 Fermented Spider Eyes + Botella Mágica.',
        droppedBy: 'Crafteable — 8 Fermented Spider Eyes + Botella Mágica',
        craftIngredients: '8 Fermented Spider Eyes + Botella Mágica'
      },
      {
        name: 'Tridente Encantado',
        img: 'https://minecraft.wiki/images/Trident.png',
        description: 'Tridente con Channeling permanente. Solo se obtiene del Drowned Gigante.',
        droppedBy: '30% drop — Drowned Gigante (océano profundo > 30 bloques)'
      }
    ]
  },
  {
    number: 4,
    day: 12,
    revealDate: new Date('2026-07-19T12:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: 'El Warden ahora dropea Corazón del Abismo. Permite craftear la Armadura de Warden.' },
      { tag: 'AJUSTE', text: 'Rango de detección acústica del Sculk Sensor aumentado un 20%.' },
      { tag: 'AJUSTE', text: 'La oscuridad inflige lentitud III de forma intermitente.' }
    ],
    mobs: [
      {
        name: 'Warden Colosal',
        img: 'https://minecraft.wiki/images/Warden.png',
        hearts: 500,
        equipment: ['Sonic Boom mejorado', 'Inmunidad a pociones de daño'],
        drop: '100% — Corazón del Abismo'
      }
    ],
    items: [
      {
        name: 'Armadura de Warden',
        img: 'https://minecraft.wiki/images/Netherite_Chestplate.png',
        description: 'Te hace inmune al efecto de Oscuridad y reduce el daño de proyectiles un 25%.',
        droppedBy: 'Crafteable con Corazón del Abismo + Armadura de Netherite'
      }
    ]
  },
  {
    number: 5,
    day: 15,
    revealDate: new Date('2026-07-22T12:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: 'Mecánica de fatiga por calor en el Nether: debes tomar pociones de resistencia al fuego para no deshidratarte.' }
    ],
    mobs: [],
    items: []
  }
];

// Add patches 6 to 10 dynamically as locked in future
for (let i = 6; i <= 10; i++) {
  const revealDate = new Date(Date.UTC(2026, 6, 22 + (i-5)*3, 12, 0, 0));
  PATCHES_DATA.push({
    number: i,
    day: i * 3,
    revealDate: revealDate,
    mechanics: [
      { tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }
    ],
    mobs: [],
    items: []
  });
}

app.get('/api/changelogs', authenticateToken, async (req, res) => {
  let userRank = 'normal';
  
  if (req.user) {
    try {
      const result = await pool.query('SELECT rank FROM users WHERE id = $1', [req.user.id]);
      if (result.rows.length > 0) {
        userRank = result.rows[0].rank.toLowerCase();
      }
    } catch (error) {
      console.error('Error consultando rango de usuario:', error);
    }
  }
  
  let bufferMs = 0;
  if (userRank === 'netherite') {
    bufferMs = 72 * 60 * 60 * 1000;
  } else if (userRank === 'diamond') {
    bufferMs = 48 * 60 * 60 * 1000;
  } else if (userRank === 'gold') {
    bufferMs = 24 * 60 * 60 * 1000;
  }
  
  const now = Date.now();
  
  const processedPatches = PATCHES_DATA.map(patch => {
    const revealTime = patch.revealDate.getTime();
    const isUnlocked = now >= (revealTime - bufferMs);
    
    if (isUnlocked) {
      return {
        number: patch.number,
        day: patch.day,
        revealDate: patch.revealDate.toISOString(),
        locked: false,
        mechanics: patch.mechanics,
        mobs: patch.mobs,
        items: patch.items
      };
    } else {
      const formattedDate = patch.revealDate.toLocaleString('es-ES', { 
        timeZone: 'UTC',
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' UTC';
      
      return {
        number: patch.number,
        day: patch.day,
        revealDate: patch.revealDate.toISOString(),
        locked: true,
        mechanics: [
          { tag: 'NUEVO', text: `🔒 Contenido bloqueado. Disponible el ${formattedDate} (o antes con rango superior).` }
        ],
        mobs: [],
        items: []
      };
    }
  });
  
  return res.json({ patches: processedPatches, userRank });
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

