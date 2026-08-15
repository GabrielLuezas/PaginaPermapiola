const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ──────────────────────────────────────────────────────────────
// Database Connection
// ──────────────────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WkutSaeA1i7K@ep-wispy-water-avdsdy02-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

// Auto-initialize table on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rank VARCHAR(20) DEFAULT 'normal' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => {
  console.log('Database "users" table verified/created successfully.');
}).catch((err) => {
  console.error('Error verifying database "users" table:', err.message);
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
  31: new Date('2026-07-19T20:15:00Z'),
  32: new Date('2026-07-19T20:15:00Z'),
  33: new Date('2026-07-20T08:15:00Z'),
  34: new Date('2026-07-20T08:15:00Z'),
  35: new Date('2026-07-20T20:15:00Z'),
  36: new Date('2026-07-20T20:15:00Z'),
  37: new Date('2026-07-20T20:15:00Z'),
};

function isGroupRevealed(_groupNum) {
  return true;
}

app.get('/images/grupo:num.webp', (req, res, next) => {
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

const DAY1_REVEAL = new Date(Date.now() + 30 * 60 * 1000);
const DAY3_REVEAL = new Date(DAY1_REVEAL.getTime() + 3 * 24 * 60 * 60 * 1000);

const PATCHES_DATA = [
  {
    number: 1,
    day: 1,
    revealDate: new Date('2026-08-08T17:00:00Z'),
    mechanics: [
      { tag: 'NERFEO/BUFEO', text: 'Las arañas pueden ser un poco más pequeñas.' }
    ],
    effects: [],
    dungeons: [],
    mobs: [],
    npcs: [
      {
        name: 'REWARDS NPC',
        img: '/images/npc_rewards.webp',
        description: 'Ubicado en el Pueblo del servidor. Este NPC permite a todos los jugadores reclamar su recompensa diaria de medallones cada 24 horas. La cantidad de medallones otorgados aumenta según tu rango.',
        cooldown: 'Cada 24 horas',
        rewards: [
          { rank: 'User (Sin rango)', amount: 'x2 MEDALLÓN', icon: '/images/items/medallion.webp', badgeClass: 'user' },
          { rank: 'Gold Rank', amount: 'x3 MEDALLÓN', icon: '/images/items/medallion.webp', badgeClass: 'gold' },
          { rank: 'Diamond Rank', amount: 'x4 MEDALLÓN', icon: '/images/items/medallion.webp', badgeClass: 'diamond' },
          { rank: 'Netherite Rank', amount: 'x5 MEDALLÓN', icon: '/images/items/medallion.webp', badgeClass: 'netherite' }
        ]
      },
      {
        name: 'SHOP NPC (TIENDA DE MEDALLONES)',
        img: '/images/npc_shop.webp',
        description: 'Ubicado en el Pueblo del servidor. Interactúa con este NPC para abrir la tienda y canjear tus medallones acumulados por rangos temporales, pases de eventos e ítems exclusivos.',
        cooldown: 'Comando /medallonshop',
        guiTitle: '[MEDALLON SHOP]',
        guiGridRows: 3,
        guiGridCols: 9,
        guiSlots: [
          { row: 0, col: 0, name: 'Gold Rank (3 Días)', img: '/images/items/gold_rank.webp' },
          { row: 0, col: 1, name: 'Diamond Rank (3 Días)', img: '/images/items/diamond_rank.webp' },
          { row: 0, col: 2, name: 'Netherite Rank (3 Días)', img: '/images/items/netherite_rank.webp' },
          { row: 0, col: 3, name: 'Rank Upgrade [TEMP]', img: '/images/items/gray_dye.webp' },
          { row: 0, col: 7, name: 'Pase para Mega Dungeon', img: '/images/items/megadungeon_pass.webp' },
          { row: 0, col: 8, name: 'Pase para Dragon Fight', img: '/images/items/anomaly_pass.webp' },
          { row: 2, col: 0, name: 'Purifying Antidote', img: '/images/items/purifying_antidote.webp' },
          { row: 2, col: 1, name: 'Bedrock Crowbar', img: '/images/items/bedrock_crowbar.webp' },
          { row: 2, col: 2, name: 'Soul Wand', img: '/images/items/soul_wand.webp' },
          { row: 2, col: 3, name: 'Potion of the Turtle God', img: '/images/items/potion_of_the_turtle_god.webp' },
          { row: 2, col: 8, name: 'Mystery Airdrop', img: '/images/items/airdrop.svg' }
        ]
      },
      {
        name: 'MISIONES NPC',
        img: '/images/npc_misiones.webp',
        description: 'Ubicado en el Pueblo del servidor. Interactúa con este NPC para acceder a las misiones diarias.',
        cooldown: 'Comando /misiones'
      }
    ],
    crafts: [
      {
        name: 'Bedrock Crowbar',
        img: '/images/items/bedrock_crowbar.webp',
        description: 'Forjada en las profundidades del Nether para poder atravesar los límites. Habilidad: Bedrock Smasher — Al dar clic en un bloque de Bedrock estando en el techo del Nether, podrás romperlo y así atravesar el techo. (Límite: 5 usos).'
      },
      {
        name: 'Purifying Antidote',
        img: '/images/items/purifying_antidote.webp',
        description: 'Antídoto universal capaz de purificar a cualquiera que lo tome. Habilidad: Cleanse — Al tomar el antídoto, remueve cualquier efecto negativo que el jugador tenga en ese momento.'
      },
      {
        name: 'Potion of the Turtle God',
        img: '/images/items/potion_of_the_turtle_god.webp',
        description: 'Otorga Resistance IV (00:20) y Speed II (00:20). Al aplicarse otorga +40% de velocidad.'
      },
      {
        name: 'Soul Wand',
        img: '/images/items/soul_wand.webp',
        description: 'Reliquia olvidada donde descansan almas perdidas esperando ser liberadas. Habilidad: Soul Attack — Al activarse, invoca almas aliadas que atacarán a cualquier enemigo que esté alrededor. (Enfriamiento: 2 minutos).'
      },
      {
        name: 'Esmeralda Reforzada',
        img: '/images/items/emerald_block.webp',
        description: 'Bloque de esmeralda forjado con pizarra profunda mística y reforzada. (Material especial de crafteo).'
      }
    ],
    loot: [],
    recipes: [
      {
        title: 'Shadow Dash',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.webp' },
          { row: 0, col: 1, name: 'Fragmento de Disco 5', count: 5, img: '/images/items/disc_fragment_5.webp' },
          { row: 0, col: 2, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.webp' },
          { row: 1, col: 0, name: 'Pata de Conejo', count: 5, img: '/images/items/rabbit_foot.webp' },
          { row: 1, col: 1, name: 'Echo Shard', count: 10, img: '/images/items/echo_shard.webp' },
          { row: 1, col: 2, name: 'Sculk Sensor', count: 5, img: '/images/items/sculk_sensor.webp' },
          { row: 2, col: 0, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.webp' },
          { row: 2, col: 1, name: 'Sculk Shrieker', count: 5, img: '/images/items/sculk_shrieker.webp' },
          { row: 2, col: 2, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.webp' }
        ],
        result: { row: 1, col: 2, name: 'Shadow Dash', img: '/images/items/shadow_dash.webp' }
      },
      {
        title: 'Alchemy Elixir',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Zanahoria dorada', count: 16, img: '/images/items/golden_carrot.webp' },
          { row: 0, col: 1, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.webp' },
          { row: 0, col: 2, name: 'Crema de Magma', count: 16, img: '/images/items/magma_cream.webp' },
          { row: 1, col: 0, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.webp' },
          { row: 1, col: 1, name: 'Bloque de Redstone', count: 64, img: '/images/items/block_redstone.webp' },
          { row: 1, col: 2, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.webp' },
          { row: 2, col: 0, name: 'Melón reluciente', count: 16, img: '/images/items/glistering_melon.webp' },
          { row: 2, col: 1, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.webp' },
          { row: 2, col: 2, name: 'Ojo de Araña Fermentado', count: 16, img: '/images/items/fermented_spider_eye.webp' }
        ],
        result: { row: 1, col: 2, name: 'Alchemy Elixir', img: '/images/items/alchemy_elixir.webp' }
      },
      {
        title: 'Freezing Touch',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.webp' },
          { row: 0, col: 1, name: 'Concha de nautilo', count: 5, img: '/images/items/nautilus_shell.webp' },
          { row: 0, col: 2, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.webp' },
          { row: 1, col: 0, name: 'Cristal de prismarina', count: 5, img: '/images/items/prismarine_crystal.webp' },
          { row: 1, col: 1, name: 'Corazón del mar', img: '/images/items/heart_of_the_sea.webp' },
          { row: 1, col: 2, name: 'Saco de tinta de calamar brillante', count: 5, img: '/images/items/grok_ink_sack.webp' },
          { row: 2, col: 0, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.webp' },
          { row: 2, col: 1, name: 'Fragmento de prismarina', count: 5, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.webp' }
        ],
        result: { row: 1, col: 2, name: 'Freezing Touch', img: '/images/items/freezing_touch.webp' }
      },
      {
        title: 'Lightning Reflexes',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.webp' },
          { row: 0, col: 1, name: 'Piedra luminosa', count: 32, img: '/images/items/glowstone.webp' },
          { row: 0, col: 2, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.webp' },
          { row: 1, col: 0, name: 'Fragmento de amatista', count: 32, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 1, name: 'Pluma', count: 64, img: '/images/items/feather.webp' },
          { row: 1, col: 2, name: 'Vara de Breeze', count: 32, img: '/images/items/breeze_rod.webp' },
          { row: 2, col: 0, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.webp' },
          { row: 2, col: 1, name: 'Grumo de resina', count: 32, img: '/images/items/resin_clump.webp' },
          { row: 2, col: 2, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.webp' }
        ],
        result: { row: 1, col: 2, name: 'Lightning Reflexes', img: '/images/items/lightning_reflexes.webp' }
      },
      {
        title: 'Esmeralda Reforzada',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.webp' },
          { row: 0, col: 1, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.webp' },
          { row: 0, col: 2, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.webp' },
          { row: 1, col: 0, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.webp' },
          { row: 1, col: 1, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.webp' },
          { row: 1, col: 2, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.webp' },
          { row: 2, col: 0, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 1, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.webp' },
          { row: 2, col: 2, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.webp' }
        ],
        result: { row: 1, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' }
      },
      {
        title: "Herald's Badge I",
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' },
          { row: 0, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 0, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' },
          { row: 1, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 1, col: 1, name: 'Frasco ominoso', img: '/images/items/ominous_bottle.webp' },
          { row: 1, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' },
          { row: 2, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' }
        ],
        result: { row: 1, col: 2, name: "Herald's Badge I", img: "/images/items/herald's_badge_I.webp" }
      },
      {
        title: "Herald's Badge II",
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' },
          { row: 0, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 0, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' },
          { row: 1, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 1, col: 1, name: "Herald's Badge I", img: "/images/items/herald's_badge_I.webp" },
          { row: 1, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' },
          { row: 2, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.webp' }
        ],
        result: { row: 1, col: 2, name: "Herald's Badge II", img: "/images/items/herald's_badge_II.webp" }
      },
      {
        title: "Herald's Badge III",
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 0, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 0, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 1, col: 0, name: 'Mena de esmeralda profunda', img: '/images/items/deepslate_emerald_ore.webp' },
          { row: 1, col: 1, name: "Herald's Badge II", img: "/images/items/herald's_badge_II.webp" },
          { row: 1, col: 2, name: 'Mena de esmeralda profunda', img: '/images/items/deepslate_emerald_ore.webp' },
          { row: 2, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' },
          { row: 2, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.webp' }
        ],
        result: { row: 1, col: 2, name: "Herald's Badge III", img: "/images/items/herald's_badge_III.webp" }
      }
    ],
    amuletSystem: {
      title: 'SISTEMA DE AMULETOS',
      command: '/amuletos',
      description: 'Los amuletos son objetos que otorgarán buffos pasivos a los jugadores mientras se encuentren equipados. Al ejecutar el comando /amuletos se abre un menú especial con casillas exclusivas para equiparlos. De forma predeterminada cada jugador cuenta con 3 espacios para amuletos, y un 4º espacio adicional bloqueado que se podrá desbloquear en un futuro.',
      gridCols: 9,
      gridRows: 3,
      slots: [
        { row: 1, col: 1, name: 'Espacio de Amuleto 1 (Equipable)' },
        { row: 1, col: 3, name: 'Espacio de Amuleto 2 (Equipable)' },
        { row: 1, col: 5, name: 'Espacio de Amuleto 3 (Equipable)' },
        { row: 1, col: 7, name: '4º Espacio Bloqueado (Desbloqueable)', img: '/images/placeholders/barrier_placeholder.svg' }
      ],
      availableAmulets: [
        {
          name: 'Shadow Dash',
          img: '/images/items/shadow_dash.webp',
          description: 'Rompe el aire con dos agachamientos rápidos. Pulsa Doble Shift para realizar un Dash hacia adelante. (Enfriamiento: 30 segundos).'
        },
        {
          name: 'Alchemy Elixir',
          img: '/images/items/alchemy_elixir.webp',
          description: 'Extiende la alquimia en tus venas. Pociones bebidas o lanzadas: +50% de duración extra. (Pasivo - siempre activo).'
        },
        {
          name: 'Freezing Touch',
          img: '/images/items/freezing_touch.webp',
          description: 'Tus golpes críticos acumulan un frío devastador. Cada 25 críticos, congela al mob en hielo 5s. Crea un área helada con Hielo y Nieve. Aplica Lentitud IV a mobs en 5 bloques por 5s. (Pasivo - se carga al asestar críticos).'
        },
        {
          name: 'Lightning Reflexes',
          img: '/images/items/lightning_reflexes.webp',
          description: 'La agilidad concentrada en tres movimientos rápidos. Haz Shift 3 veces seguidas para otorgar Velocidad III por 20s. (Enfriamiento: 2 minutos).'
        },
        {
          name: "Herald's Badge I",
          img: "/images/items/herald's_badge_I.webp",
          description: 'El símbolo de los protectores de todas las aldeas. Héroe de la Aldea I permanente. Los comerciantes te adoran. (Pasivo - siempre activo).'
        },
        {
          name: "Herald's Badge II",
          img: "/images/items/herald's_badge_II.webp",
          description: 'El símbolo de los protectores de todas las aldeas. Héroe de la Aldea II permanente. Los comerciantes te adoran. (Pasivo - siempre activo).'
        },
        {
          name: "Herald's Badge III",
          img: "/images/items/herald's_badge_III.webp",
          description: 'El símbolo de los protectores de todas las aldeas. Héroe de la Aldea III permanente. Los comerciantes te adoran. (Pasivo - siempre activo).'
        }
      ]
    }
  },
  {
    number: 2,
    day: 3,
    revealDate: new Date('2026-08-08T00:00:00Z'),
    mechanics: [
      { tag: 'REMOVIDO', text: 'El casco de tortuga ya no es crafteable.' },
      { tag: 'NERFEO/BUFEO', text: 'Minar un bloque de Creaking Heart te dará Darkness por 1 minuto.' },
      { tag: 'NUEVO', text: 'Infección Wasted: Ha aparecido una nueva infección que afecta a los zombies y los convierte en una mejor versión de ellos mismos. Dándoles habilidades, más fuerza, rapidez y mucha inteligencia. Todos los Zombies son Wasted.' }
    ],
    effects: [
      {
        name: 'Chained Memory',
        img: '/images/efectos/chained.webp',
        description: 'Este efecto te impide pensar y recordar. Por lo tanto el jugador al tener este efecto, lo hace muy lento. Pierde significativamente su visión y habilidades básicas. Como poder cambiar de mano un objeto. O usar el escudo.'
      },
      {
        name: 'Immunity',
        img: '/images/efectos/invulnerability.webp',
        description: 'Otorga inmunidad temporal frente a efectos negativos y estados alterados.'
      }
    ],
    dungeons: [
      {
        name: 'LOS MILENARIOS',
        img: '/images/mobs/milenario.webp',
        description: 'En este castillo milenario se resguardaba una antigua civilización, donde protegían sus joyas y reliquias del caos que había afuera. Hasta que un día una enfermedad viral masacró a todos los que estaban dentro de ellas.'
      }
    ],
    mobs: [
      {
        name: 'Millenary Guard',
        img: '/images/mobs/millenary_guard.webp',
        description: 'Este cadáver de un antiguo guarda de los milenarios es muy fuerte. Lleva una espada con él y defenderá el milenario con su vida.'
      },
      {
        name: 'Millenary Prototype',
        img: '/images/mobs/milenary_prototype.webp',
        description: 'Este prototipo está hecho a base de los lingotes milenarios que se encuentran en la fábrica. Es el peor enemigo que te podés encontrar. Con su gran velocidad y resistencia puede destruirte de unos pocos golpes sin necesidad de exigirse mucho.'
      },
      {
        name: 'Millenary Crawler',
        img: '/images/mobs/millenary_crawler.webp',
        description: 'Este pequeño prototipo al golpearte se sumergirá en tu cerebro y borrará toda tu memoria al instante. Dejándote tonto y en shock durante unos segundos pero si quieres cortar la duración, tendrás que usar un antídoto. (15s del efecto Chained Memory).'
      },
      {
        name: 'Millenary Archer',
        img: '/images/mobs/millenary_archer.webp',
        description: 'Arquero de la antigua civilización milenaria. Sus flechas están imbuidas con la aleación milenaria, atravesando armaduras con facilidad y dejando a sus víctimas marcadas por la oscuridad.'
      },
      {
        name: 'Millenary Golem',
        img: '/images/mobs/millenary_golem.webp',
        description: 'Colosal constructo forjado con lingotes milenarios. Es el guardián más poderoso de Los Milenarios. Su fuerza es devastadora y su resistencia casi indestructible, capaz de arrasar con cualquier intruso que ose profanar el castillo.'
      },
      {
        name: 'Wasted Crawler',
        img: '/images/mobs/wasted_crawler.webp',
        description: 'Este zombie se arrastra por el piso. No hace mucho daño, ni es rápido pero al golpearte te intentará mantener para que los demás te cazen. (Te da lentitud 2)'
      },
      {
        name: 'Wasted Bomber',
        img: '/images/mobs/wasted_bomber.webp',
        description: 'Este zombie que tiene una bomba en sus manos irá rápidamente hacia vos y prendera la bomba para explotar todo. Cuando te golpea enciende su tnt y hace una explosion de nivel 4 despues de 1.5 segundos'
      },
      {
        name: 'Wasted Walker',
        img: '/images/mobs/wasted_walker.webp',
        description: 'Es el zombie común que todos vemos, tiene doble de fuerza y 3 corazones más.'
      },
      {
        name: 'Arcane Creeper',
        img: '/images/mobs/arcane_creeper.webp',
        description: 'Su explosión inflige daño masivo, siendo el creeper con mayor poder explosivo del servidor.'
      },
      {
        name: 'Solar Creeper',
        img: '/images/mobs/solar_creeper.webp',
        description: 'Al explotar invoca 4 Mini Creepers, prende fuego a los jugadores y aplica Wither, causando daño continuo incluso después de la explosión.'
      },
      {
        name: 'Chaos Creeper',
        img: '/images/mobs/chaos_creeper.webp',
        description: 'Atrae a los jugadores hacia él antes de explotar, provoca una gran destrucción del terreno, aplica Lentitud y Debilidad, y al morir genera una explosión adicional.'
      },
      {
        name: 'Nebula Creeper',
        img: '/images/mobs/nebula_creeper.webp',
        description: 'Su explosión aplica Levitación, Oscuridad (Darkness) y Fatiga Minera (Mining Fatigue), además de liberar una onda de choque que empuja a los jugadores, dejándolos completamente desorientados.'
      },
      {
        name: 'Father Hoglin',
        img: '/images/mobs/father_hoglin.webp',
        description: 'Hoglin modificado con un poder devastador. Su daño es extremadamente alto y aparece en todos los biomas del Nether excepto en Soul Sand Valley y Basalt Deltas.'
      },
      {
        name: 'Magician Piglin',
        img: '/images/mobs/magician_piglin.webp',
        description: 'Al golpearte suelta pociones con múltiples efectos negativos, convirtiéndose en una amenaza constante que debilita a sus víctimas con cada impacto.'
      },
      {
        name: 'Superior Piglin',
        img: '/images/mobs/superior_piglin.webp',
        description: 'Tiene una gran cantidad de vida y pega muy fuerte. Al golpearte aplica Mining Fatigue, reduciendo tu capacidad de minar y atacar.'
      },
      {
        name: 'Assasin Piglin',
        img: '/images/mobs/assasin_piglin.webp',
        description: 'Pega extremadamente fuerte pero tiene poca vida. Un asesino letal que puede eliminarte en pocos golpes si no lo derrotas rápido.'
      },
      {
        name: 'Scorched Piglin',
        img: '/images/mobs/scorched_piglin.webp',
        description: 'Al golpearte te quema por mucho tiempo, te deja cegado y con Wither. Invoca un Magma Cube pequeño al impactar y al morir se convierte en un Esqueleto Wither.'
      }
    ],
    crafts: [
      {
        name: 'Millenary Crown',
        img: '/images/items/millenary_crown.svg',
        description: 'Corona de una era olvidada capaz de conceder una bendición divina. Habilidad Millenary Blessing: Al tenerla equipada, el portador recibe una bendición la cual aumenta su velocidad y fuerza. (Otorgará Protection IV, Respiration III, Aqua Affinity, +3 Armor, +2 Armor Toughness, Irrompible).'
      }
    ],
    loot: [
      {
        name: 'Millenary Antidote',
        img: '/images/placeholders/item_placeholder.svg',
        description: 'Sustancia desarrollada en la Millenary Fabric para tratar el efecto Chained Memory, sin importar su origen. No elimina la causa pero destruye el bloqueo que encadena los recuerdos y restablece la estabilidad mental de forma temporal.'
      },
      {
        name: 'Millenary Bar',
        img: '/images/items/millenary_plate.webp',
        description: 'Placa especial a base de la aleación milenaria producida en la fábrica.'
      },
      {
        name: 'Millenary Ingot',
        img: '/images/items/millenary_ingot.webp',
        description: 'Lingote especial a base de la aleación milenaria producido en la fábrica.'
      },
      {
        name: 'Sapphire Jewels',
        img: '/images/items/s_jewels.webp',
        description: 'Reliquias y joyas de zafiro resguardadas en el castillo ancestral.'
      },
      {
        name: 'Ruby Jewels',
        img: '/images/items/r_jewels.webp',
        description: 'Reliquias y joyas de rubí protegidas por la civilización milenaria.'
      },
      {
        name: 'Jade Jewels',
        img: '/images/items/jade_jewels.webp',
        description: 'Joyas de jade antiguas halladas en las profundidades de Los Milenarios.'
      },
      {
        name: 'Millenary Jewels',
        img: '/images/items/m_jewels.webp',
        description: 'Antiguas joyas y tesoros sagrados recuperados de Los Milenarios.'
      },
      {
        name: 'Oblivion Chronicles',
        img: '/images/items/oblivion_book.webp',
        description: 'Un libro dorado, perdido hace mucho tiempo, con demasiados conocimientos y poder. Pertenece a un escritor desconocido… y sus secretos se revelan poco a poco a quien logre utilizarlo correctamente.'
      },
      {
        name: 'Wasted Flesh',
        img: '/images/items/wasted_flesh.webp',
        description: 'Carne podrida abandonada por el tiempo. Su aspecto es repulsivo y emana un olor insoportable.',
        droppedBy: 'Dropeado por todos los Wasted Zombies'
      }
    ],
    recipes: [
      {
        title: 'Millenary Crown',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 1, name: 'Jade Jewels', count: 64, img: '/images/items/jade_jewels.webp' },
          { row: 1, col: 0, name: 'Ruby Jewels', count: 64, img: '/images/items/r_jewels.webp' },
          { row: 1, col: 1, name: 'Millenary Jewels', count: 8, img: '/images/items/m_jewels.webp' },
          { row: 1, col: 2, name: 'Sapphire Jewels', count: 64, img: '/images/items/s_jewels.webp' },
          { row: 2, col: 0, name: 'Millenary Bars', count: 32, img: '/images/items/millenary_ingot.webp' },
          { row: 2, col: 1, name: 'Millenary Bars', count: 32, img: '/images/items/millenary_ingot.webp' },
          { row: 2, col: 2, name: 'Millenary Bars', count: 32, img: '/images/items/millenary_ingot.webp' }
        ],
        result: { row: 1, col: 2, name: 'Millenary Crown', img: '/images/items/millenary_crown.svg' }
      },
      {
        title: 'Acero en bruto',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Hierro en bruto', count: 16, img: '/images/items/raw_iron.webp' },
          { row: 0, col: 1, name: 'Hierro en bruto', count: 16, img: '/images/items/raw_iron.webp' },
          { row: 0, col: 2, name: 'Hierro en bruto', count: 16, img: '/images/items/raw_iron.webp' },
          { row: 1, col: 0, name: 'Hierro en bruto', count: 16, img: '/images/items/raw_iron.webp' },
          { row: 1, col: 1, name: 'Carbón', count: 16, img: '/images/items/coal.webp' },
          { row: 1, col: 2, name: 'Carbón', count: 16, img: '/images/items/coal.webp' },
          { row: 2, col: 0, name: 'Carbón', count: 16, img: '/images/items/coal.webp' },
          { row: 2, col: 1, name: 'Carbón', count: 16, img: '/images/items/coal.webp' }
        ],
        result: { row: 1, col: 2, name: 'Acero en bruto', img: '/images/items/raw_steel.webp' }
      },
      {
        title: 'Lingotes de acero',
        type: 'furnace',
        input: { row: 0, col: 0, name: 'Acero en bruto', img: '/images/items/raw_steel.webp' },
        fuel: { row: 0, col: 0, name: 'Carbón', img: '/images/items/coal.webp' },
        result: { row: 0, col: 0, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' }
      },
      {
        title: 'Placas de acero',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 1, col: 0, name: 'Lingotes de acero', count: 2, img: '/images/items/steel_ingots.webp' },
          { row: 1, col: 1, name: 'Lingotes de acero', count: 2, img: '/images/items/steel_ingots.webp' },
          { row: 1, col: 2, name: 'Lingotes de acero', count: 2, img: '/images/items/steel_ingots.webp' }
        ],
        result: { row: 1, col: 2, name: 'Placas de acero', img: '/images/placeholders/dark_ingot_placeholder.svg' }
      },
      {
        title: 'Mesa',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Lana Verde', count: 16, img: '/images/items/green_wool.webp' },
          { row: 0, col: 1, name: 'Millenary Jewels', count: 8, img: '/images/items/m_jewels.webp' },
          { row: 0, col: 2, name: 'Lana Verde', count: 16, img: '/images/items/green_wool.webp' },
          { row: 1, col: 0, name: 'Tronco de Roble', count: 64, img: '/images/items/oak_log.webp' },
          { row: 1, col: 1, name: 'Tronco de Roble', count: 64, img: '/images/items/oak_log.webp' },
          { row: 1, col: 2, name: 'Tronco de Roble', count: 64, img: '/images/items/oak_log.webp' },
          { row: 2, col: 0, name: 'Pizarra profunda pulida', count: 64, img: '/images/items/polished_deepslate.webp' },
          { row: 2, col: 1, name: 'Palos', count: 64, img: '/images/items/stick.webp' },
          { row: 2, col: 2, name: 'Pizarra profunda pulida', count: 64, img: '/images/items/polished_deepslate.webp' }
        ],
        result: { row: 1, col: 2, name: 'Mesa', img: '/images/placeholders/table_base_placeholder.svg' }
      },
      {
        title: 'Mazo de acero',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' },
          { row: 0, col: 1, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' },
          { row: 0, col: 2, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' },
          { row: 1, col: 0, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' },
          { row: 1, col: 1, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' },
          { row: 1, col: 2, name: 'Lingotes de acero', img: '/images/items/steel_ingots.webp' },
          { row: 2, col: 1, name: 'Palo', img: '/images/items/stick.webp' }
        ],
        result: { row: 1, col: 2, name: 'Mazo de acero', img: '/images/items/steel_mace.webp' }
      },
      {
        title: 'OBLIVION WORKBENCH',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Cofre', img: '/images/items/chest.webp' },
          { row: 0, col: 1, name: 'Oblivion Chronicles', img: '/images/items/oblivion_book.webp' },
          { row: 0, col: 2, name: 'Mazo de acero', img: '/images/items/steel_mace.webp' },
          { row: 1, col: 0, name: 'Placas de acero', img: '/images/placeholders/dark_ingot_placeholder.svg' },
          { row: 1, col: 1, name: 'Mesa', img: '/images/placeholders/table_base_placeholder.svg' },
          { row: 1, col: 2, name: 'Placas de acero', img: '/images/placeholders/dark_ingot_placeholder.svg' },
          { row: 2, col: 0, name: 'Jade Jewels', count: 64, img: '/images/items/jade_jewels.webp' },
          { row: 2, col: 1, name: 'Ruby Jewels', count: 64, img: '/images/items/r_jewels.webp' },
          { row: 2, col: 2, name: 'Sapphire Jewels', count: 64, img: '/images/items/s_jewels.webp' }
        ],
        result: { row: 1, col: 2, name: 'Oblivion Workbench', img: '/images/placeholders/oblivion_workbench.svg' }
      }
    ]
  },
  {
    number: 3,
    day: 5,
    revealDate: new Date('2026-08-11T21:00:00Z'),
    mechanics: [],
    effects: [],
    dungeons: [],
    npcs: [],
    crafts: [],
    loot: [],
    recipes: [],
    mobs: [
      {
        name: 'Cyclone Skeleton',
        img: '/images/mobs/cyclone_archer.webp',
        description: 'Sus flechas al impactar generan un rayo que aplica Weakness, Mining Fatigue y Slowness.'
      },
      {
        name: 'Emperor Skeleton',
        img: '/images/mobs/emperor_archer.webp',
        description: 'Sus ataques quitan una gran cantidad de vida.'
      },
      {
        name: 'Magnetic Skeleton',
        img: '/images/mobs/magnetic_archer.webp',
        description: 'Te atrae hacia él con cada disparo.'
      },
      {
        name: 'Nightmare Skeleton',
        img: '/images/mobs/nightmare_archer.webp',
        description: 'Sus flechas te queman infinitamente, aplican Blindness y remueven todos tus efectos activos.'
      }
    ]
  },
  {
    number: 4,
    day: 6,
    revealDate: new Date('2026-08-13T20:00:00Z'),
    mechanics: [],
    mobs: [],
    dungeonGuide: {
      title: 'Trials Dungeons',
      subtitle: 'Una peligrosa estructura subterránea llena de desafíos y tesoros.',
      rules: [
        '<strong>Máximo de 6 jugadores</strong> por party.',
        'Solo puedes añadir hasta <strong>2 personas de otro team</strong>.',
        '<strong>No se podrá ni romper ni colocar</strong> ningún bloque.',
        '<strong>No se podrá poner</strong> ni agua ni lava ni nieve.',
        'Se podrán colocar y romper <strong>Ender Chests</strong>.'
      ],
      mainImg: '/images/interfaces/dungeonpreview.webp',
      steps: [
        {
          title: 'Crear la party',
          text: 'Primero, el líder de la party debe crear el grupo ejecutando el comando <code>/dungeonparty crear</code>.'
        },
        {
          title: 'Interfaz de la Party',
          text: 'Una vez creada, si usas el comando <code>/dungeonparty</code> se te abrirá la interfaz del grupo, donde podrás visualizar el estado actual de los miembros y los controles de la party.',
          img: '/images/interfaces/interfazparty.webp'
        },
        {
          title: 'Invitar jugadores',
          text: 'Puedes invitar a otros jugadores a unirse usando el comando <code>/dungeonparty invitar (NICKJUGADOR)</code>.'
        },
        {
          title: 'Aceptar la invitación',
          text: 'Los jugadores invitados pueden unirse aceptando la invitación mediante el comando <code>/dungeonparty aceptar</code>.'
        },
        {
          title: 'Expulsar jugadores',
          text: 'Si eres el líder, puedes echar a cualquier jugador de la party con el comando <code>/dungeonparty echar (NICKJUGADOR)</code>.'
        },
        {
          title: 'Indicar que estás listo',
          text: 'Cuando todos estén dentro del grupo, todos los jugadores deben marcar que están listos para empezar. Esto se hace usando el comando <code>/dungeonparty listo</code> o haciendo clic en la <strong>lana roja</strong> debajo de tu cabeza en la interfaz.',
          img: '/images/interfaces/interfazpartylisto.webp'
        },
        {
          title: 'Seleccionar Instancia de Dungeon',
          text: 'Una vez que todo el grupo esté listo, el líder deberá hacer clic en el ítem del <strong>Beacon (Faro)</strong> en la interfaz. Se abrirá un menú para seleccionar el slot o instancia de la dungeon.',
          importantNote: 'Habrá un máximo de 8 dungeons concurrentes al mismo tiempo. Si están todas llenas, no podrás entrar y tendrás que esperar a que una quede libre.',
          img: '/images/interfaces/seleccionarinstancia.webp'
        },
        {
          title: 'Sala de espera',
          text: 'Tras seleccionar la instancia, todos los jugadores serán teletransportados automáticamente a una sala de espera.',
          img: '/images/interfaces/salaespera.webp'
        },
        {
          title: 'Confirmar "Listo" en la sala de espera',
          text: 'Una vez dentro de la sala de espera, todos los miembros de la party deberán volver a marcar que están listos (usando el comando o abriendo el menú y haciendo clic en la lana verde).',
          img: '/images/interfaces/interfazpartylistosalaespera.webp'
        },
        {
          title: 'Inicio de la Mazmorra',
          text: 'Cuando todos los jugadores estén listos en la sala de espera, serán teletransportados directamente al inicio de la mazmorra.',
          importantNote: 'La dungeon consta de 12 salas aleatorias con un mini boss en cada recorrido. Cada run tiene salas aleatorias.',
          img: '/images/interfaces/salainiciodungeon.webp'
        },
        {
          title: 'Abandonar la Dungeon',
          text: 'Si necesitan salir antes de tiempo, cualquier jugador puede abandonar la mazmorra utilizando el comando <code>/dungeonparty abandonar</code>.'
        },
        {
          title: 'Terminar y reclamar victoria',
          text: 'Para completar la dungeon correctamente, los jugadores deben llegar a la sala final. Una vez que <strong>TODOS</strong> los jugadores de la party estén en dicha sala, el administrador/líder podrá finalizarla usando el comando <code>/dungeonparty terminar</code>.',
          img: '/images/interfaces/salafinaldungeon.webp'
        }
      ]
    },
    dungeonLoot: [
      {
        title: 'Recompensa de COFRE DE ESMERALDA',
        subtitle: 'Cofres situados sobre un bloque de esmeralda',
        items: [
          { chance: '80%', name: 'Bloques de Esmeralda (2 a 5x)', img: '/images/items/emerald_block.webp' },
          { chance: '80%', name: 'Bloques de Hierro (4 a 8x)', img: '/images/items/Block_iron.webp' },
          { chance: '80%', name: '10 a 20 Manzanas Doradas', img: '/images/items/Golden_Apple.webp' },
          { chance: '75%', name: 'Bloques de Oro (3 a 6x)', img: '/images/items/block_gold.webp' },
          { chance: '75%', name: 'Frascos de Experiencia (6 a 16x)', img: '/images/items/purifying_antidote.webp' },
          { chance: '70%', name: 'Bloques de Diamante (2 a 4x)', img: '/images/items/block_diamond.webp' },
          { chance: '50%', name: 'Llave de Mazmorra / Trial Key (1 a 2x)', img: '/images/items/Trial_Key.webp' },
          { chance: '30%', name: 'Botella Ominosa Nv 1 a 5 (1x)', img: '/images/items/ominous_bottle.webp' },
          { chance: '25%', name: 'Fragmentos de Netherite / Scrap (1 a 2x)', img: '/images/items/Ancient_Debris.webp' },
          { chance: '20%', name: 'Llave Ominosa de Mazmorra (1x)', img: '/images/items/Ominous_Trial_Key.webp' },
          { chance: '10%', name: 'Papel "Medallones gratis x[1-10]" (1x) [Nuevo]', img: '/images/items/Paper.webp' },
          { chance: '5%', name: 'Manzana de Oro Encantada / Notch (1x)', img: '/images/items/Enchanted_Golden_Apple.gif' },
          { chance: '5%', name: 'Amuleto Duplicador de Llaves', img: '/images/items/abyssal_key.webp' },
          { chance: '0.5%', name: 'Papel "Mystery gratis" (1x) [Nuevo]', img: '/images/items/Paper.webp' }
        ]
      },
      {
        title: 'Recompensa de SPAWNER NORMAL',
        subtitle: 'Al superar la horda Normal',
        items: [
          { chance: '40%', name: 'Llave de Mazmorra (1x) (2x con amuleto duplicador)', img: '/images/items/Trial_Key.webp' },
          { chance: '30%', name: 'Botella Ominosa Nv 1 a 5 (1x)', img: '/images/items/ominous_bottle.webp' },
          { chance: '10%', name: 'Fragmento de Trial (1x)', img: '/images/items/prismarine_shard.webp' },
          { chance: '10%', name: 'Zanahorias de Oro (10x)', img: '/images/items/golden_carrot.webp' },
          { chance: '5%', name: 'Manzanas Doradas (5x)', img: '/images/items/Golden_Apple.webp' },
          { chance: '5%', name: 'Escombros Ancestrales / Ancient Debris (2x)', img: '/images/items/Ancient_Debris.webp' }
        ]
      },
      {
        title: 'Recompensa de SPAWNER OMINOSO',
        subtitle: 'Al superar la horda Ominosa',
        items: [
          { chance: '30%', name: 'Llave Ominosa de Mazmorra (1x) (2x con amuleto duplicador)', img: '/images/items/Ominous_Trial_Key.webp' },
          { chance: '20%', name: 'Manzanas Doradas (10x)', img: '/images/items/Golden_Apple.webp' },
          { chance: '15%', name: 'Fragmento Ominoso (1x)', img: '/images/items/amethyst_shard.webp' },
          { chance: '15%', name: 'Zanahorias de Oro (20x)', img: '/images/items/golden_carrot.webp' },
          { chance: '5%', name: 'Drop Random de Mob Especial de Mazmorra (1 a 3x)', img: '/images/items/drop_random.webp' },
          { chance: '5%', name: 'Lingote de Netherite (1x)', img: '/images/items/netherite_ingot.webp' },
          { chance: '5%', name: 'Bloque de Diamante (1x)', img: '/images/items/block_diamond.webp' },
          { chance: '4%', name: 'Botella Ominosa Nv 1 a 5 (1x)', img: '/images/items/ominous_bottle.webp' },
          { chance: '1%', name: 'Manzana de Oro Encantada (1x)', img: '/images/items/Enchanted_Golden_Apple.gif' }
        ]
      },
      {
        title: 'Recompensa de BÓVEDA NORMAL',
        subtitle: 'Al usar Llave de Trial Normal',
        items: [
          { chance: '30%', name: 'Botella Ominosa Nv 1 a 5 (1x)', img: '/images/items/ominous_bottle.webp' },
          { chance: '10%', name: 'Bloques de Esmeralda (10x)', img: '/images/items/emerald_block.webp' },
          { chance: '10%', name: 'Bloques de Oro (8x)', img: '/images/items/block_gold.webp' },
          { chance: '10%', name: 'Bloques de Hierro (10x)', img: '/images/items/Block_iron.webp' },
          { chance: '10%', name: 'Manzanas Doradas (5x)', img: '/images/items/Golden_Apple.webp' },
          { chance: '10%', name: 'Amuleto de Bóveda Normal (1 al azar)', img: '/images/items/vital_pendant.webp' },
          { chance: '5%', name: 'Tridente (1x)', img: '/images/items/Trident.webp' },
          { chance: '5%', name: 'Lingote de Netherite (1x)', img: '/images/items/netherite_ingot.webp' },
          { chance: '5%', name: 'Plantilla de Herrería / Armor Trim (1x al azar)', img: '/images/items/trim_random.webp' },
          { chance: '2%', name: 'Tótem de la Inmortalidad (1x)', img: '/images/items/totem.webp' },
          { chance: '2%', name: 'Papel "Medallones gratis x[1-10]" (1x) [Nuevo]', img: '/images/items/Paper.webp' },
          { chance: '1%', name: 'Manzana de Oro Encantada (1x)', img: '/images/items/Enchanted_Golden_Apple.gif' }
        ]
      },
      {
        title: 'Recompensa de BÓVEDA OMINOSA',
        subtitle: 'Al usar Llave Ominosa',
        items: [
          { chance: '30%', name: 'Manzanas Doradas (10x)', img: '/images/items/Golden_Apple.webp' },
          { chance: '14%', name: 'Bloques de Diamante (3x)', img: '/images/items/block_diamond.webp' },
          { chance: '14%', name: 'Bloques de Esmeralda (8x)', img: '/images/items/emerald_block.webp' },
          { chance: '10%', name: 'Pieza de Netherite Encantada con Durabilidad Aumentada', img: '/images/items/Peto.webp' },
          { chance: '10%', name: 'Amuleto de Bóveda Ominosa (1 al azar)', img: '/images/items/shadow_eye.webp' },
          { chance: '10%', name: 'Libro Encantado Especial (Wind Burst I, Soul Speed II/III, Swift Sneak II/III)', img: '/images/items/oblivion_book.webp' },
          { chance: '4.5%', name: 'Manzana de Oro Encantada (1x)', img: '/images/items/Enchanted_Golden_Apple.gif' },
          { chance: '2.5%', name: 'Heavy Core (1x)', img: '/images/items/Heavy_Core.webp' },
          { chance: '2.5%', name: 'Papel "Medallones gratis x[1-10]" (1x) [Nuevo]', img: '/images/items/Paper.webp' },
          { chance: '1%', name: 'Bloque de Netherite (1x)', img: '/images/items/Block_Netherite.webp' },
          { chance: '1%', name: 'Estrella del Nether (1x)', img: '/images/items/Nether_Star.webp' },
          { chance: '0.5%', name: 'Papel "Mystery gratis" (1x) [Nuevo]', img: '/images/items/Paper.webp' }
        ]
      }
    ],
    newAmuletCategories: {
      craftable: [
        {
          name: 'Wind Shriek',
          description: 'Al borde de la muerte, el viento grita tu nombre. Al romperse un Tótem de la Inmortalidad, genera una ráfaga de viento radial que empuja hacia atrás a todos los enemigos en un radio de 8 bloques. Enfriamiento: 5 minutos.',
          img: '/images/items/wind_shriek.webp'
        },
        {
          name: 'Monarch Wings',
          description: 'Las alas eólicas del Monarca te impulsan a gran altura en el aire. Pulsa dos veces la tecla de salto en el aire para impulsarte con una ráfaga de viento y anular todo el daño por caída. Enfriamiento: 20 segundos.',
          img: '/images/items/monarch_wings.webp'
        },
        {
          name: 'Soul of the Hunt',
          description: 'Extrae la esencia vital de las criaturas derrotadas. Otorga +1 corazones (2 HP) y 2 segundos de saturacion por cada criatura (hostil) eliminada. No funciona con soportes de armadura.',
          img: '/images/items/soul_of_the_hunt.webp'
        },
        {
          name: 'Golden Idol',
          description: 'Los Piglins te respetan como si llevaras puesta una pieza de armadura de oro sagrada. Otorga inmunidad total al agro de los Piglins sin necesidad de vestir oro. (Pasivo - siempre activo).',
          img: '/images/items/golden_idol.webp'
        },
        {
          name: 'Herald\'s Badge IV',
          description: 'El símbolo de los protectores de todas las aldeas. Otorga Héroe de la Aldea IV permanente. (Pasivo - siempre activo).',
          img: '/images/items/herald\'s_badge_IV.webp'
        },
        {
          name: 'Herald\'s Badge V',
          description: 'El símbolo máximo de los protectores de todas las aldeas. Otorga Héroe de la Aldea V permanente. (Pasivo - siempre activo).',
          img: '/images/items/herald\'s_badge_V.webp'
        }
      ],
      normalVault: [
        {
          name: 'Vital Pendant',
          description: 'El calor de la vida misma fluye a través de este colgante. Al romperse un Tótem de la Inmortalidad, te otorga +4 corazones adicionales de vida instantánea y el efecto de Resistencia II. Enfriamiento: 1 minuto.',
          img: '/images/items/vital_pendant.webp'
        },
        {
          name: 'Cloak of Deception',
          description: 'La sombra te abraza en el sigilo. Te otorga invisibilidad completa al agacharse (shift). Se desactiva al moverte. (Pasivo - reactivo al movimiento).',
          img: '/images/items/cloak_of_deception.webp'
        },
        {
          name: 'Lava Shield',
          description: 'La calidez del magma protege tu piel frente a cualquier llama. Otorga el efecto de Resistencia al Fuego de forma infinita, haciéndote inmune al daño por fuego y lava. (Pasivo - siempre activo).',
          img: '/images/items/lava_shield.webp'
        },
        {
          name: 'Ocean\'s Grace',
          description: 'El poder de las profundidades marinas restaura tus fuerzas. Otorga de forma pasiva los efectos de Regeneración II y Saturación I constante mientras te encuentres sumergido en agua. (Pasivo - siempre activo).',
          img: '/images/items/ocean\'s_grace.webp'
        },
        {
          name: 'Berserker\'s Heart',
          description: 'La furia se despiela cuando te acorralan los enemigos. Otorga el efecto de Fuerza IV si te encuentras rodeado por 6 o más monstruos hostiles a menos de 6 bloques de distancia. (Pasivo - siempre activo).',
          img: '/images/items/berserker\'s_heart.webp'
        },
        {
          name: 'Spider\'s Claw',
          description: 'Las patas adosadas de una araña del vacío te permiten escalar superficies sólidas. Para trepar, mantén presionadas las teclas Shift + W al estar pegado a una pared.',
          img: '/images/items/spider\'s_claw.webp'
        },
        {
          name: 'Mushroom Hide',
          description: 'La piel fúngica endurecida repele las toxinas y la podredumbre del Nether. Cancela por completo los efectos dañinos de Veneno I y II, y Wither I y II. (Pasivo - siempre activo).',
          img: '/images/items/mushroom_hide.webp'
        },
        {
          name: 'Archer\'s Eye',
          description: 'Otorga precisión legendaria y potencia tus proyectiles a larga distancia. Aumenta un +10% el daño base de tus disparos con arco y un +1% de daño adicional por cada bloque de distancia a partir de los 30 bloques. (Pasivo - siempre activo).',
          img: '/images/items/archer\'s_eye.webp'
        }
      ],
      ominousVault: [
        {
          name: 'Shadow Eye',
          description: 'La oscuridad no puede tocarte mientras lo lleves equipado. Cancela por completo los efectos de Oscuridad (Darkness) y Ceguera (Blindness). (Pasivo - siempre activo).',
          img: '/images/items/shadow_eye.webp'
        },
        {
          name: 'Void Feather',
          description: 'Una pluma bendecida por el vacío eterno. Te salva de morir en el vacío al primer tick de daño, teletransportándote hacia la superficie segura del End y otorgándote Caída Lenta (Slow Falling). ¡Se consume al activarse!',
          img: '/images/items/void_feather.webp'
        },
        {
          name: 'Iron Guardians',
          description: 'Los protectores de metal acuden a tu llamado en momentos críticos. Al romperse un Tótem de la Inmortalidad, invoca inmediatamente 2 Golems de Hierro potenciados durante 20 segundos. Enfriamiento: 3 minutos.',
          img: '/images/items/iron_guardians.webp'
        },
        {
          name: 'Clock of Time',
          description: 'Doblega el flujo temporal a tu voluntad. Reduce el enfriamiento de todos los amuletos en 10 segundos.',
          img: '/images/items/clock_of_time.webp'
        },
        {
          name: 'Veil of Evasion',
          description: 'Permite esquivar golpes con reflejos sobrenaturales. Otorga un 5% de probabilidad de esquivar cualquier ataque y realizar automáticamente un dash evasivo de 5 bloques. (Pasivo - siempre activo).',
          img: '/images/items/veil_of_evasion.webp'
        },
        {
          name: 'Soul Reaper',
          description: 'Atrapa las almas de las criaturas caídas para absorber su esencia (+1 alma por mob eliminado, máx 200). Acumular almas otorga efectos permanentes: Velocidad I (25), Fuerza I (50), Resistencia I (75),  Velocidad II (125), Fuerza II (150), Vision nocturna (175), y Regeneración I junto a +4 corazones de absorcion que se restauran cada 2 minutos y 30 segundos (200). Consumir un Tótem de la Inmortalidad reduce un 35% tus almas. (Pasivo - siempre activo).',
          img: '/images/items/soul_reaper.webp'
        },
        {
          name: 'Shadow Decoy',
          description: 'Muestra un reflejo ilusorio en momentos de peligro fatal. Al recibir daño de muerte, cancela la muerte dejándote a 1 corazón, te otorga invisibilidad por 5 segundos y crea un clon falso en tu posición actual. Enfriamiento: 10 minutos.',
          img: '/images/items/shadow_decoy.webp'
        }
      ],
      special: [
        {
          name: 'Abyssal Key',
          description: 'Artefacto forjado en las profundidades de las Cámaras de Desafío (Trial Chambers). Duplica de forma automática cualquier llave (Trial Key u Ominous Key) obtenida al abrir Bóvedas (Vaults). (Pasivo - siempre activo).',
          img: '/images/items/abyssal_key.webp'
        }
      ]
    },
    dungeonDrops: {
      note: 'Estos materiales mientras estás en la dungeon se guardan en una interfaz a la que puedes acceder con el comando <code>/dungeonparty botin</code> donde se irán acumulando. Una vez finalizada la mazmorra, tendrás un tiempo de <strong>10 minutos</strong> para recoger todos los ítems acumulados antes de que se borren.',
      items: [
        { name: 'Fragmento de Trial', id: 'fragmento_trial', mcItem: 'PRISMARINE_SHARD', img: '/images/items/prismarine_shard.webp' },
        { name: 'Fragmento Ominoso', id: 'fragmento_ominoso', mcItem: 'AMETHYST_SHARD', img: '/images/items/amethyst_shard.webp' },
        { name: 'Montura Reforzada con Cobre', id: 'copper_reinforced_saddle', mcItem: 'SADDLE', img: '/images/items/Saddle.webp' },
        { name: 'Ballesta con Resortes de Cobre', id: 'copper_spring_crossbow', mcItem: 'CROSSBOW', img: '/images/items/Crossbow.webp' },
        { name: 'Hacha de Hierro Encobrada', id: 'copper_iron_axe', mcItem: 'IRON_AXE', img: '/images/items/Iron_axe.webp' },
        { name: 'Esmeralda Engarzada en Cobre', id: 'copper_mounted_emerald', mcItem: 'EMERALD', img: '/images/items/Emerald.webp' },
        { name: 'Matraz de Cobre Alquímico', id: 'alchemical_copper_flask', mcItem: 'GLASS_BOTTLE', img: '/images/items/Glass_Bottle.webp' },
        { name: 'Aleación Bruta de Oro y Cobre', id: 'raw_gold_copper_alloy', mcItem: 'RAW_GOLD', img: '/images/items/Raw_Gold.webp' },
        { name: 'Hongo Carmesí Metalizado', id: 'metallic_crimson_fungus', mcItem: 'CRIMSON_FUNGUS', img: '/images/items/Crimson_Fungus.webp' },
        { name: 'Vara Ígnea con Anillos de Cobre', id: 'copper_ringed_blaze_rod', mcItem: 'BLAZE_ROD', img: '/images/items/blaze_rod.webp' },
        { name: 'Lódo de Magma Cobrizo', id: 'copper_magma_mud', mcItem: 'MAGMA_CREAM', img: '/images/items/magma_cream.webp' },
        { name: 'Polvo de Arena Cobriza', id: 'copper_sand_dust', mcItem: 'RED_SAND', img: '/images/items/RedSand.webp' },
        { name: 'Núcleo Eólico Galvanizado', id: 'galvanized_wind_core', mcItem: 'BREEZE_ROD', img: '/images/items/breeze_rod.webp' },
        { name: 'Caparazón de Nautilus con Pátina', id: 'patina_nautilus_shell', mcItem: 'NAUTILUS_SHELL', img: '/images/items/nautilus_shell.webp' },
        { name: 'Lingote de Cobre Resonante', id: 'resonant_copper_ingot', mcItem: 'COPPER_INGOT', img: '/images/items/Copper_Ingotwebp.webp' },
        { name: 'Fragmento de Sculk Resonante', id: 'resonant_sculk_shard', mcItem: 'ECHO_SHARD', img: '/images/items/echo_shard.webp' },
        { name: 'Membrana Nocturna Conductora', id: 'conductive_phantom_membrane', mcItem: 'PHANTOM_MEMBRANE', img: '/images/items/Phantom_Membrane.webp' },
        { name: 'Rosa Mecánica de Cobre', id: 'copper_mechanical_rose', mcItem: 'POPPY', img: '/images/items/Rosa.webp' },
        { name: 'Gelatina con Limaduras de Cobre', id: 'copper_slime_gelatin', mcItem: 'SLIME_BALL', img: '/images/items/Slimeball.webp' },
        { name: 'Lágrima de Cobre Solidificada', id: 'solidified_copper_tear', mcItem: 'GHAST_TEAR', img: '/images/items/Ghast_Tear.webp' },
        { name: 'Ceniza Ósea Cobriza', id: 'copper_bone_ash', mcItem: 'BONE_MEAL', img: '/images/items/Bone_Meal.webp' },
        { name: 'Carne Putrefacta con Esquirlas de Cobre', id: 'copper_rotten_flesh', mcItem: 'ROTTEN_FLESH', img: '/images/items/Rotten_Flesh.webp' },
        { name: 'Fémur Chapado en Cobre', id: 'copper_plated_femur', mcItem: 'BONE', img: '/images/items/Bone.webp' },
        { name: 'Filamento de Cobre Sedoso', id: 'silky_copper_filament', mcItem: 'STRING', img: '/images/items/String.webp' },
        { name: 'Pólvora de Cobre Volátil', id: 'volatile_copper_gunpowder', mcItem: 'GUNPOWDER', img: '/images/items/Gunpowder.webp' },
        { name: 'Cristal de Hielo Conductor', id: 'conductive_ice_crystal', mcItem: 'AMETHYST_SHARD', img: '/images/items/amethyst_shard.webp' },
        { name: 'Espora Tóxica de Cobre', id: 'copper_toxic_spore', mcItem: 'SLIME_BALL', img: '/images/items/Slimeball.webp' },
        { name: 'Vendaje Resecado con Cobre', id: 'copper_dried_bandage', mcItem: 'PAPER', img: '/images/items/Paper.webp' },
        { name: 'Óptica Arácnida Oxidada', id: 'oxidized_spider_eye', mcItem: 'SPIDER_EYE', img: '/images/items/Spider_Eye.webp' },
        { name: 'Esponja Abisal Filtradora de Cobre', id: 'copper_abyssal_sponge', mcItem: 'WET_SPONGE', img: '/images/items/Wet_Sponge.webp' },
        { name: 'Escama de Prismarina Cobriza', id: 'copper_prismarine_scale', mcItem: 'PRISMARINE_SHARD', img: '/images/items/prismarine_shard.webp' }
      ]
    },
    recipes: [
      {
        title: 'Wind Shriek',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento de Trial', count: 8, img: '/images/items/prismarine_shard.webp' },
          { row: 0, col: 1, name: 'Lodo de Magma Cobrizo', count: 8, img: '/images/items/magma_cream.webp' },
          { row: 0, col: 2, name: 'Polvo de Arena Cobriza', count: 8, img: '/images/items/RedSand.webp' },
          { row: 1, col: 0, name: 'Núcleo Eólico Galvanizado', count: 8, img: '/images/items/breeze_rod.webp' },
          { row: 1, col: 1, name: 'Esmeralda Engarzada en Cobre', count: 8, img: '/images/items/Emerald.webp' },
          { row: 1, col: 2, name: 'Núcleo Eólico Galvanizado', count: 8, img: '/images/items/breeze_rod.webp' },
          { row: 2, col: 0, name: 'Caparazón de Nautilus con Pátina', count: 8, img: '/images/items/nautilus_shell.webp' },
          { row: 2, col: 1, name: 'Matraz de Cobre Alquímico', count: 8, img: '/images/items/Glass_Bottle.webp' },
          { row: 2, col: 2, name: 'Fragmento Ominoso', count: 8, img: '/images/items/amethyst_shard.webp' }
        ],
        result: { row: 1, col: 2, name: 'Wind Shriek', img: '/images/items/wind_shriek.webp' }
      },
      {
        title: 'Monarch Wings',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento de Trial', count: 8, img: '/images/items/prismarine_shard.webp' },
          { row: 0, col: 1, name: 'Fragmento de Sculk Resonante', count: 8, img: '/images/items/echo_shard.webp' },
          { row: 0, col: 2, name: 'Lingote de Cobre Resonante', count: 8, img: '/images/items/Copper_Ingotwebp.webp' },
          { row: 1, col: 0, name: 'Membrana Nocturna Conductora', count: 8, img: '/images/items/Phantom_Membrane.webp' },
          { row: 1, col: 1, name: 'Rosa Mecánica de Cobre', count: 8, img: '/images/items/Rosa.webp' },
          { row: 1, col: 2, name: 'Membrana Nocturna Conductora', count: 8, img: '/images/items/Phantom_Membrane.webp' },
          { row: 2, col: 0, name: 'Gelatina con Limaduras de Cobre', count: 8, img: '/images/items/Slimeball.webp' },
          { row: 2, col: 1, name: 'Núcleo Eólico Galvanizado', count: 8, img: '/images/items/breeze_rod.webp' },
          { row: 2, col: 2, name: 'Fragmento Ominoso', count: 8, img: '/images/items/amethyst_shard.webp' }
        ],
        result: { row: 1, col: 2, name: 'Monarch Wings', img: '/images/items/monarch_wings.webp' }
      },
      {
        title: 'Soul of the Hunt',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Lágrima de Cobre Solidificada', count: 5, img: '/images/items/Ghast_Tear.webp' },
          { row: 0, col: 1, name: 'Ceniza Ósea Cobriza', count: 5, img: '/images/items/Bone_Meal.webp' },
          { row: 0, col: 2, name: 'Carne Putrefacta con Esquirlas de Cobre', count: 5, img: '/images/items/Rotten_Flesh.webp' },
          { row: 1, col: 0, name: 'Fragmento Ominoso', count: 5, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 1, name: 'Manzana de Oro Encantada', count: 2, img: '/images/items/Enchanted_Golden_Apple.gif' },
          { row: 1, col: 2, name: 'Fragmento de Trial', count: 5, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 0, name: 'Fémur Chapado en Cobre', count: 5, img: '/images/items/Bone.webp' },
          { row: 2, col: 1, name: 'Filamento de Cobre Sedoso', count: 5, img: '/images/items/String.webp' },
          { row: 2, col: 2, name: 'Pólvora de Cobre Volátil', count: 5, img: '/images/items/Gunpowder.webp' }
        ],
        result: { row: 1, col: 2, name: 'Soul of the Hunt', img: '/images/items/soul_of_the_hunt.webp' }
      },
      {
        title: 'Golden Idol',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Hongo Carmesí Metalizado', count: 8, img: '/images/items/Crimson_Fungus.webp' },
          { row: 0, col: 1, name: 'Aleación Bruta de Oro y Cobre', count: 8, img: '/images/items/Raw_Gold.webp' },
          { row: 0, col: 2, name: 'Vara Ígnea con Anillos de Cobre', count: 8, img: '/images/items/blaze_rod.webp' },
          { row: 1, col: 0, name: 'Aleación Bruta de Oro y Cobre', count: 8, img: '/images/items/Raw_Gold.webp' },
          { row: 1, col: 1, name: 'Bloque de Oro', count: 32, img: '/images/items/block_gold.webp' },
          { row: 1, col: 2, name: 'Aleación Bruta de Oro y Cobre', count: 8, img: '/images/items/Raw_Gold.webp' },
          { row: 2, col: 0, name: 'Vara Ígnea con Anillos de Cobre', count: 8, img: '/images/items/blaze_rod.webp' },
          { row: 2, col: 1, name: 'Aleación Bruta de Oro y Cobre', count: 8, img: '/images/items/Raw_Gold.webp' },
          { row: 2, col: 2, name: 'Hongo Carmesí Metalizado', count: 8, img: '/images/items/Crimson_Fungus.webp' }
        ],
        result: { row: 1, col: 2, name: 'Golden Idol', img: '/images/items/golden_idol.webp' }
      },
      {
        title: 'Herald\'s Badge IV (Héroe de la Aldea IV)',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' },
          { row: 0, col: 1, name: 'Ballesta con Resortes de Cobre', count: 5, img: '/images/items/Crossbow.webp' },
          { row: 0, col: 2, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' },
          { row: 1, col: 0, name: 'Esmeralda Engarzada en Cobre', count: 5, img: '/images/items/Emerald.webp' },
          { row: 1, col: 1, name: 'Herald\'s Badge III', count: 1, img: '/images/items/herald\'s_badge_III.webp' },
          { row: 1, col: 2, name: 'Matraz de Cobre Alquímico', count: 5, img: '/images/items/Glass_Bottle.webp' },
          { row: 2, col: 0, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' },
          { row: 2, col: 1, name: 'Hacha de Hierro Encobrada', count: 5, img: '/images/items/Iron_axe.webp' },
          { row: 2, col: 2, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' }
        ],
        result: { row: 1, col: 2, name: 'Herald\'s Badge IV', img: '/images/items/herald\'s_badge_IV.webp' }
      },
      {
        title: 'Herald\'s Badge V (Héroe de la Aldea V)',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' },
          { row: 0, col: 1, name: 'Montura Reforzada con Cobre', count: 1, img: '/images/items/Saddle.webp' },
          { row: 0, col: 2, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' },
          { row: 1, col: 0, name: 'Montura Reforzada con Cobre', count: 1, img: '/images/items/Saddle.webp' },
          { row: 1, col: 1, name: 'Herald\'s Badge IV', count: 1, img: '/images/items/herald\'s_badge_IV.webp' },
          { row: 1, col: 2, name: 'Montura Reforzada con Cobre', count: 1, img: '/images/items/Saddle.webp' },
          { row: 2, col: 0, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' },
          { row: 2, col: 1, name: 'Montura Reforzada con Cobre', count: 1, img: '/images/items/Saddle.webp' },
          { row: 2, col: 2, name: 'Esmeralda Reforzada', count: 1, img: '/images/items/emerald_block.webp' }
        ],
        result: { row: 1, col: 2, name: 'Herald\'s Badge V', img: '/images/items/herald\'s_badge_V.webp' }
      },
      {
        title: 'Lingote de la Mazmorra',
        description: '<span style="color:#cbd5e1;">Lingote místico forjado con las reliquias de la mazmorra.</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Caparazón de Nautilus con Pátina', count: 10, img: '/images/items/nautilus_shell.webp' },
          { row: 0, col: 1, name: 'Escama de Prismarina Cobriza / Fragmento de Trial', count: 10, img: '/images/items/prismarine_shard.webp' },
          { row: 0, col: 2, name: 'Aleación Bruta de Oro y Cobre', count: 10, img: '/images/items/Raw_Gold.webp' },
          { row: 1, col: 0, name: 'Rosa Mecánica de Cobre', count: 10, img: '/images/items/Rosa.webp' },
          { row: 1, col: 1, name: 'Esponja Abisal Filtradora de Cobre', count: 4, img: '/images/items/Wet_Sponge.webp' },
          { row: 1, col: 2, name: 'Lingote de Cobre Resonante', count: 10, img: '/images/items/Copper_Ingotwebp.webp' },
          { row: 2, col: 0, name: 'Fémur Chapado en Cobre', count: 10, img: '/images/items/Bone.webp' },
          { row: 2, col: 1, name: 'Carne Putrefacta con Esquirlas de Cobre', count: 10, img: '/images/items/Rotten_Flesh.webp' },
          { row: 2, col: 2, name: 'Cristal de Hielo Conductor', count: 10, img: '/images/items/amethyst_shard.webp' }
        ],
        result: { row: 1, col: 2, name: 'Lingote de la Mazmorra', img: '/images/items/netherite_ingot.webp' }
      },
      {
        title: 'Escudo de la Mazmorra',
        description: '<span style="color:#cbd5e1;">Escudo de alta resistencia obtenido de reliquias de la mazmorra.</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento Ominoso', count: 3, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 1, name: 'Lingote de la Mazmorra', count: 1, img: '/images/items/netherite_ingot.webp' },
          { row: 0, col: 2, name: 'Fragmento Ominoso', count: 3, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 0, name: 'Fragmento de Trial', count: 3, img: '/images/items/prismarine_shard.webp' },
          { row: 1, col: 1, name: 'Fragmento de Trial', count: 3, img: '/images/items/prismarine_shard.webp' },
          { row: 1, col: 2, name: 'Fragmento de Trial', count: 3, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 1, name: 'Fragmento Ominoso', count: 3, img: '/images/items/amethyst_shard.webp' }
        ],
        result: { row: 1, col: 2, name: 'Escudo de la Mazmorra', img: '/images/items/Shield.webp' }
      },
      {
        title: 'Diamante Electrificado',
        description: '<span style="color:#cbd5e1;">Diamante sobrecargado de energía eléctrica y reliquias arcanas.</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Vendaje Resecado con Cobre', count: 10, img: '/images/items/Paper.webp' },
          { row: 0, col: 1, name: 'Matraz de Cobre Alquímico', count: 10, img: '/images/items/Glass_Bottle.webp' },
          { row: 0, col: 2, name: 'Lodo de Magma Cobrizo', count: 10, img: '/images/items/magma_cream.webp' },
          { row: 1, col: 0, name: 'Lágrima de Cobre Solidificada', count: 10, img: '/images/items/Ghast_Tear.webp' },
          { row: 1, col: 1, name: 'Pólvora de Cobre Volátil', count: 10, img: '/images/items/Gunpowder.webp' },
          { row: 1, col: 2, name: 'Ceniza Ósea Cobriza', count: 10, img: '/images/items/Bone_Meal.webp' },
          { row: 2, col: 0, name: 'Ballesta con Resortes de Cobre', count: 10, img: '/images/items/Crossbow.webp' },
          { row: 2, col: 1, name: 'Hacha de Hierro Encobrada', count: 10, img: '/images/items/Iron_axe.webp' },
          { row: 2, col: 2, name: 'Vara Ígnea con Anillos de Cobre', count: 10, img: '/images/items/blaze_rod.webp' }
        ],
        result: { row: 1, col: 2, name: 'Diamante Electrificado', img: '/images/items/Diamond.webp' }
      },
      {
        title: 'Espada Electrificada',
        description: '<span style="color:#55ff55; font-weight:bold;">Sharpness V</span> &nbsp;•&nbsp; <span style="color:#55ff55; font-weight:bold;">Smite V</span> &nbsp;•&nbsp; <span style="color:#55ff55; font-weight:bold;">Bane of Arthropods V</span><br><span style="color:#ff5555; font-weight:bold;">No se puede transformar a Netherita.</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 1, name: 'Diamante Electrificado', count: 1, img: '/images/items/diamond_rank.webp' },
          { row: 1, col: 1, name: 'Diamante Electrificado', count: 1, img: '/images/items/diamond_rank.webp' },
          { row: 2, col: 1, name: 'Palo', count: 1, img: '/images/items/stick.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Espada Electrificada',
          img: '/images/items/Diamond_Sword.webp'
        }
      },
      {
        title: 'Arco Infinito',
        description: '<span style="color:#55ff55; font-weight:bold;">Mending I</span> &nbsp;•&nbsp; <span style="color:#55ff55; font-weight:bold;">Infinity I</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 1, name: 'Fragmento de Trial', count: 12, img: '/images/items/prismarine_shard.webp' },
          { row: 0, col: 2, name: 'Filamento de Cobre Sedoso', count: 12, img: '/images/items/String.webp' },
          { row: 1, col: 0, name: 'Fragmento Ominoso', count: 12, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 2, name: 'Óptica Arácnida Oxidada', count: 12, img: '/images/items/Spider_Eye.webp' },
          { row: 2, col: 1, name: 'Fragmento de Trial', count: 12, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Filamento de Cobre Sedoso', count: 12, img: '/images/items/String.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Arco Infinito',
          img: '/images/items/Bow.webp'
        }
      },
      {
        title: 'Hacha de la Mazmorra',
        description: '<span style="color:#55ff55; font-weight:bold;">Unbreaking V</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 1, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 2, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 0, name: 'Fragmento de Sculk Resonante', count: 6, img: '/images/items/echo_shard.webp' },
          { row: 1, col: 1, name: 'Hacha de Netherite', count: 1, img: '/images/items/Netherite_Axe.webp' },
          { row: 1, col: 2, name: 'Montura Reforzada con Cobre', count: 6, img: '/images/items/Saddle.webp' },
          { row: 2, col: 0, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 1, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Hacha de la Mazmorra',
          img: '/images/items/Netherite_Axe.webp'
        }
      },
      {
        title: 'Lanza de la Mazmorra',
        description: '<span style="color:#55ff55; font-weight:bold;">Unbreaking V</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 1, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 2, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 0, name: 'Fragmento de Sculk Resonante', count: 6, img: '/images/items/echo_shard.webp' },
          { row: 1, col: 1, name: 'Lanza de Netherite', count: 1, img: '/images/items/Netherite_Spear.webp' },
          { row: 1, col: 2, name: 'Montura Reforzada con Cobre', count: 6, img: '/images/items/Saddle.webp' },
          { row: 2, col: 0, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 1, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Lanza de la Mazmorra',
          img: '/images/items/Netherite_Spear.webp'
        }
      },
      {
        title: 'Pico de la Mazmorra',
        description: '<span style="color:#55ff55; font-weight:bold;">Unbreaking V</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 1, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 2, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 0, name: 'Fragmento de Sculk Resonante', count: 6, img: '/images/items/echo_shard.webp' },
          { row: 1, col: 1, name: 'Pico de Netherite', count: 1, img: '/images/items/Netherite_Pickaxe.webp' },
          { row: 1, col: 2, name: 'Montura Reforzada con Cobre', count: 6, img: '/images/items/Saddle.webp' },
          { row: 2, col: 0, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 1, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Pico de la Mazmorra',
          img: '/images/items/Netherite_Pickaxe.webp'
        }
      },
      {
        title: 'Pala de la Mazmorra',
        description: '<span style="color:#55ff55; font-weight:bold;">Unbreaking V</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 1, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 2, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 0, name: 'Fragmento de Sculk Resonante', count: 6, img: '/images/items/echo_shard.webp' },
          { row: 1, col: 1, name: 'Pala de Netherite', count: 1, img: '/images/items/Netherite_Shovel.webp' },
          { row: 1, col: 2, name: 'Montura Reforzada con Cobre', count: 6, img: '/images/items/Saddle.webp' },
          { row: 2, col: 0, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 1, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Pala de la Mazmorra',
          img: '/images/items/Netherite_Shovel.webp'
        }
      },
      {
        title: 'Azada de la Mazmorra',
        description: '<span style="color:#55ff55; font-weight:bold;">Unbreaking V</span>',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 1, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 0, col: 2, name: 'Fragmento Ominoso', count: 4, img: '/images/items/amethyst_shard.webp' },
          { row: 1, col: 0, name: 'Fragmento de Sculk Resonante', count: 6, img: '/images/items/echo_shard.webp' },
          { row: 1, col: 1, name: 'Azada de Netherite', count: 1, img: '/images/items/Netherite_Hoe.webp' },
          { row: 1, col: 2, name: 'Montura Reforzada con Cobre', count: 6, img: '/images/items/Saddle.webp' },
          { row: 2, col: 0, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 1, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' },
          { row: 2, col: 2, name: 'Fragmento de Trial', count: 4, img: '/images/items/prismarine_shard.webp' }
        ],
        result: {
          row: 1,
          col: 2,
          name: 'Azada de la Mazmorra',
          img: '/images/items/Netherite_Hoe.webp'
        }
      }
    ]
  },
  {
    number: 5,
    day: 7,
    revealDate: new Date('2026-08-14T21:00:00Z'),
    raidsLevelUp: [
      {
        name: 'Pillager',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Ahora poseen Instant Damage I en sus proyectiles y sus flechas son explosivas.'
      },
      {
        name: 'Vindicator',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Su daño se ha visto incrementado significativamente y poseen Speed I de forma permanente.'
      },
      {
        name: 'Giant Ravager',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Un Ravager gigante con Speed II, una barra de vida adicional y daño aumentado.'
      },
      {
        name: 'Sorcerer',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Tiene un 50% de probabilidad de evitar ataques y ponerte a levitar durante unos segundos, invoca Decaying Ghoul en vez de vexes'
      },
      {
        name: 'Decaying Ghoul',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Poseen tamaño un poco más incrementado, su daño aumenta pero son más lentos. No llevan ningún ítem en la mano y pueden dar Congelación durante unos segundos.'
      },
      {
        name: 'Witcher',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Tiene un 30% de probabilidad de usar múltiples pociones a la vez al recibir golpes (Invisibilidad, Speed II, Regeneración I, Fire Resistance), te da Ceguera al golpearla, invoca pequeños Ghasts en lugar de Vexes, y puede invocar una horda de mini esqueletos y mini zombies al ser golpeada.'
      },
      {
        name: 'Mime',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Totalmente silencioso. Lleva frascos misteriosos en sus manos. Al golpearte tiene un 10% de probabilidad de lanzarte un frasco que otorga Ceguera y Descomposición, dejándote cegado con cada golpe. Al ser golpeado, tiene un 20% de probabilidad de volverse enorme con Fuerza aumentada (pero volviéndose más lento), y un 20% de probabilidad de obtener Velocidad V por unos segundos.'
      },
      {
        name: 'Executioner',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Pillager verdugo que porta un hacha gigante e inflige daño letal. Es el mob más fuerte de las Raids.'
      },
      {
        name: 'Jester',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Al golpearte tiene un 30% de probabilidad de dejar una TNT y huir. Al ser golpeado, su tamaño disminuye pero su velocidad y fuerza aumentan (se acumula hasta morir). Al morir, genera una Gift Box que al romperse explota con nivel 3.'
      }
    ],
    mechanics: [
      { tag: 'NUEVO', text: 'Todos los Creepers aparecen cargados / eléctricos.' },
      { tag: 'NUEVO', text: 'Al morir una tortuga, genera una explosión de nivel 10.' },
      { tag: 'NUEVO', text: 'Al romper un alga existe cierta probabilidad de spawnear un Pufferfish.' },
      { tag: 'NUEVO', text: 'Al morir un Iron Golem genera una explosión de nivel 3.' },
      { tag: 'NUEVO', text: 'Al romper grava existe cierta probabilidad de que aparezca una TNT encendida.' },
      { tag: 'NUEVO', text: 'Los Camellos ahora son reemplazados por Ravagers.' },
      { tag: 'NUEVO', text: 'Los Striders ahora son Ghasts.' },
      { tag: 'NUEVO', text: 'Todos los aldeanos libreros morirán al iniciar el Día 8.' },
      { tag: 'NERFEO/BUFEO', text: 'El daño por Cactus y Bayas Dulces causa 3 corazones de daño verdadero (ignora armadura).' },
      { tag: 'NERFEO/BUFEO', text: 'Picar, talar o cavar con una herramienta que no sea de Netherite no dropeará el bloque (Hachas, Picos y Palas).' },
      { tag: 'NERFEO/BUFEO', text: 'El daño por Congelación y Veneno se ha duplicado (x2).' },
      { tag: 'NERFEO/BUFEO', text: 'El daño por Ahogamiento se ha duplicado (x2).' },
      { tag: 'NERFEO/BUFEO', text: 'Tocar agua en biomas fríos te hace daño continuo, te congela y te da Slowness, Mining Fatigue y Weakness.' },
      { tag: 'NERFEO/BUFEO', text: 'Los disparos de ballesta de los Piglins te prenden fuego al impactar.' },
      { tag: 'NERFEO/BUFEO', text: 'Los Piglins poseen x2 de Fuerza y x2 de Velocidad.' },
      { tag: 'NERFEO/BUFEO', text: 'Los mobs hostiles ya no pueden subirse a barcos ni vagonetas.' },
      { tag: 'NERFEO/BUFEO', text: 'El ataque o embestida de las Cabras te elimina instantáneamente (Oneshot).' },
      { tag: 'NERFEO/BUFEO', text: 'Consumir papas venenosas o alimentos crudos te resta vida en lugar de nutrirte.' },
      { tag: 'NERFEO/BUFEO', text: 'Los Endermites al golpearte te aplican Ceguera.' },
      { tag: 'NERFEO/BUFEO', text: 'Los Pufferfish al inflarse provocan una explosión de nivel 5.' },
      { tag: 'NERFEO/BUFEO', text: 'Tocar bloques de Bedrock te aplica Ceguera y Descomposición (Wither).' },
      { tag: 'NERFEO/BUFEO', text: 'Tocar o interactuar con una nota musical (Note Block) te provocará Oneshot.' },
      { tag: 'NERFEO/BUFEO', text: 'Estar por debajo de la capa Y: -55 te aplica el efecto Oscuridad (Darkness).' },
      { tag: 'NERFEO/BUFEO', text: 'Las vallas y puertas tienen un 5% de probabilidad de romperse cada vez que las interactúas/usas.' },
      { tag: 'NERFEO/BUFEO', text: 'Picar Ancient Debris empieza a quemarte de inmediato.' },
      { tag: 'NERFEO/BUFEO', text: 'Recibir daño por un Magma Block te prenderá fuego.' },
      { tag: 'NERFEO/BUFEO', text: 'La Soul Sand (Arena de Almas) te aplica Lentitud III.' },
      { tag: 'NERFEO/BUFEO', text: 'Las flechas de los Strays te inmovilizan por completo durante 3 segundos.' },
      { tag: 'NERFEO/BUFEO', text: 'Los Enderman tienen x3 de daño, 10 corazones extra (+20 HP) y al golpearte te dan Ceguera.' }
    ],
    mobs: []
  },
  {
    number: 6,
    day: 10,
    revealDate: new Date('2026-08-17T19:00:00Z'),
    mechanics: [],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 7,
    day: 14,
    revealDate: new Date('2026-08-21T19:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: 'Mecánica de fatiga por calor en el Nether: debes tomar pociones de resistencia al fuego para no deshidratarte.' }
    ],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 8,
    day: 18,
    revealDate: new Date('2026-08-25T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 9,
    day: 21,
    revealDate: new Date('2026-08-28T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 10,
    day: 23,
    revealDate: new Date('2026-08-30T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 11,
    day: 25,
    revealDate: new Date('2026-09-01T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 12,
    day: 28,
    revealDate: new Date('2026-09-04T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  }
];

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
    // El Día 6 es especial y se revela para todos al mismo tiempo, sin acceso anticipado
    const effectiveBufferMs = (patch.day === 6) ? 0 : bufferMs;
    const isUnlocked = now >= (revealTime - effectiveBufferMs);
    
    if (isUnlocked) {
      return {
        number: patch.number,
        day: patch.day,
        revealDate: patch.revealDate.toISOString(),
        locked: false,
        mechanics: patch.mechanics,
        dungeons: patch.dungeons || [],
        effects: patch.effects || [],
        raidsLevelUp: patch.raidsLevelUp || [],
        mobs: patch.mobs,
        crafts: patch.crafts || [],
        loot: patch.loot || [],
        recipes: patch.recipes || [],
        amuletSystem: patch.amuletSystem,
        npcs: patch.npcs || [],
        items: [...(patch.crafts || []), ...(patch.loot || [])],
        dungeonGuide: patch.dungeonGuide || null,
        dungeonLoot: patch.dungeonLoot || [],
        newAmuletCategories: patch.newAmuletCategories || null,
        dungeonDrops: patch.dungeonDrops || null
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
        dungeons: [],
        effects: [],
        mobs: [],
        crafts: [],
        loot: [],
        items: []
      };
    }
  });
  
  return res.json({ patches: processedPatches, userRank });
});

// ──────────────────────────────────────────────────────────────
// Static files (Angular build output)
// ──────────────────────────────────────────────────────────────
let distPath = path.join(__dirname, 'dist/permapiola-web/browser');
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  if (fs.existsSync(path.join(__dirname, 'dist/permapiola-web', 'index.html'))) {
    distPath = path.join(__dirname, 'dist/permapiola-web');
  } else if (fs.existsSync(path.join(__dirname, 'dist/browser', 'index.html'))) {
    distPath = path.join(__dirname, 'dist/browser');
  } else if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    distPath = path.join(__dirname, 'dist');
  }
}

console.log(`Serving static files from: ${distPath}`);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(distPath));

// SPA fallback — Angular routing
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('PermaPiola API Backend is running successfully.');
  }
});

app.listen(PORT, () => {
  console.log(`PermaPiola server running on port ${PORT}`);
});

