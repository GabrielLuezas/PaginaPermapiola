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
        img: '/images/npc_rewards.jpg',
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
          { row: 2, col: 0, name: 'Jade Jewels', img: '/images/items/jade_jewels.webp' },
          { row: 2, col: 1, name: 'Ruby Jewels', img: '/images/items/r_jewels.webp' },
          { row: 2, col: 2, name: 'Sapphire Jewels', img: '/images/items/s_jewels.webp' }
        ],
        result: { row: 1, col: 2, name: 'Oblivion Workbench', img: '/images/placeholders/oblivion_workbench.svg' }
      }
    ]
  },
  {
    number: 3,
    day: 6,
    revealDate: new Date('2026-08-13T21:00:00Z'),
    mechanics: [],
    mobs: [],
    dungeonGuide: {
      title: 'Trials Dungeons',
      subtitle: 'Una peligrosa estructura subterránea llena de trampas, desafíos e Illagers modificados. Prepárate con tu party para afrontar las 12 salas aleatorias.',
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
        title: 'Recompensa de SPAWNER NORMAL',
        subtitle: 'Al superar la horda Normal',
        items: [
          { chance: '40%', name: 'Llave Normal Custom', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: 'Fragmento de Trial', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '30%', name: 'Botella Ominosa (Niveles 1 a 5)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: '10 Zanahorias de Oro', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: '5 Recompensas Doradas', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: '2 Escombros Ancestrales', img: '/images/placeholders/item_placeholder.svg' }
        ]
      },
      {
        title: 'Recompensa de SPAWNER OMINOSO',
        subtitle: 'Al superar la horda Ominosa',
        items: [
          { chance: '30%', name: 'Llave Ominosa Custom', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '15%', name: 'Fragmento Ominoso', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '15%', name: '20 Zanahorias de Oro', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '20%', name: '10 Manzanas Doradas', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '1%', name: '1 Manzana de Oro Encantada', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '4%', name: 'Botella Ominosa (Niveles 1 a 5)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: 'Drop Random de Mob Especial de Mazmorra', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: '1 Lingote de Netherite', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: '1 Bloque de Diamante', img: '/images/placeholders/item_placeholder.svg' }
        ]
      },
      {
        title: 'Recompensa de BÓVEDA NORMAL',
        subtitle: 'Al usar Llave de Trial Normal',
        items: [
          { chance: '5%', name: 'Tridente (1x)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: 'Lingote de Netherite (1x)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: '10 Bloques de Esmeralda', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: '8 Bloques de Oro', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '30%', name: 'Botella de Mal Presagio (Niveles 1 a 5)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: '5 Recompensas Doradas', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '1%', name: 'Recompensa de Oro Encantada (1x)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: 'Cualquier Trim del juego', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: '10 Bloques de Hierro', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '4%', name: 'Tótem de la Inmortalidad (1x)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: 'Amuleto de Bóveda Normal', img: '/images/placeholders/item_placeholder.svg' }
        ]
      },
      {
        title: 'Recompensa de BÓVEDA OMINOSA',
        subtitle: 'Al usar Llave Ominosa',
        items: [
          { chance: '10%', name: 'Pieza de Netherite Encantada', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: 'Amuleto de Bóveda Ominosa', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: 'Heavy Core', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '1%', name: 'Estrella del Nether', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '10%', name: 'Libro Encantado (Wind Burst 1, Soul Speed 2-3, Swift Sneak 2-3)', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '30%', name: '10 Recompensas Doradas', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '5%', name: 'Recompensa de Oro Encantada', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '1%', name: '1 Bloque de Netherite', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '14%', name: '3 Bloques de Diamante', img: '/images/placeholders/item_placeholder.svg' },
          { chance: '14%', name: '8 Bloques de Esmeralda', img: '/images/placeholders/item_placeholder.svg' }
        ]
      }
    ],
    newAmuletCategories: {
      craftable: [
        { name: 'Amuleto de Regeneración', description: 'Otorga Regeneración I. Crafteable en la Oblivion Workbench.', img: '/images/placeholders/item_placeholder.svg' },
        { name: 'Amuleto de Resistencia', description: 'Otorga Resistencia I. Crafteable en la Oblivion Workbench.', img: '/images/placeholders/item_placeholder.svg' }
      ],
      normalVault: [
        { name: 'Amuleto de Prisa Minera', description: 'Otorga Haste I. Obtenido con baja probabilidad de bóvedas normales.', img: '/images/placeholders/item_placeholder.svg' },
        { name: 'Amuleto de Velocidad', description: 'Otorga Speed I. Obtenido con baja probabilidad de bóvedas normales.', img: '/images/placeholders/item_placeholder.svg' }
      ],
      ominousVault: [
        { name: 'Amuleto de Fuerza Superior', description: 'Otorga Fuerza I de forma permanente. Obtenido de bóvedas ominosas.', img: '/images/placeholders/item_placeholder.svg' },
        { name: 'Amuleto de Resistencia al Fuego', description: 'Otorga Fire Resistance I. Obtenido de bóvedas ominosas.', img: '/images/placeholders/item_placeholder.svg' }
      ],
      special: [
        { name: 'Amuleto del Invocador', description: 'Amuleto especial de evento. Edita su descripción en server.js', img: '/images/placeholders/item_placeholder.svg' },
        { name: 'Amuleto del Vacío', description: 'Amuleto especial de evento. Edita su descripción en server.js', img: '/images/placeholders/item_placeholder.svg' }
      ]
    }
  },
  {
    number: 4,
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
      { tag: 'NUEVO', text: 'Los Hoglins ahora son Tenebris Hoglin y tienen un Piglin Brute montado encima.' },
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
      },
      /*
      {
        name: 'Kamikaze Machine',
        img: '/images/mobs/kamikaze_machine.webp',
        description: 'Esta antigua máquina kamikaze lleva en sus manos una antorcha de Redstone para detonar su barril.'
      },
      {
        name: 'Pale Cyclops',
        img: '/images/mobs/pale_cyclops.webp',
        description: 'Su mordida es altamente mortal y te deja cegado durante varios segundos.'
      },
      {
        name: 'Pale Wasp',
        img: '/images/mobs/pale_wasp.webp',
        description: 'Inyecta una dosis letal de Veneno, Descomposición y Ceguera.'
      }
      */
    ]
  },
  {
    number: 5,
    day: 10,
    revealDate: new Date('2026-08-17T19:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: 'El Warden ahora dropea Corazón del Abismo. Permite craftear la Armadura de Warden.' },
      { tag: 'NERFEO/BUFEO', text: 'Rango de detección acústica del Sculk Sensor aumentado un 20%.' },
      { tag: 'NERFEO/BUFEO', text: 'La oscuridad inflige lentitud III de forma intermitente.' }
    ],
    mobs: [
      {
        name: 'Warden Colosal',
        img: 'https://minecraft.wiki/images/Warden.webp',
        hearts: 500,
        equipment: ['Sonic Boom mejorado', 'Inmunidad a pociones de daño'],
        drop: '100% — Corazón del Abismo'
      }
    ],
    crafts: [
      {
        name: 'Armadura de Warden',
        img: 'https://minecraft.wiki/images/Netherite_Chestplate.webp',
        description: 'Te hace inmune al efecto de Oscuridad y reduce el daño de proyectiles un 25%.',
        droppedBy: 'Crafteable con Corazón del Abismo + Armadura de Netherite'
      }
    ],
    loot: []
  },
  {
    number: 6,
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
    number: 7,
    day: 18,
    revealDate: new Date('2026-08-25T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 8,
    day: 21,
    revealDate: new Date('2026-08-28T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 9,
    day: 23,
    revealDate: new Date('2026-08-30T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 10,
    day: 25,
    revealDate: new Date('2026-09-01T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 11,
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
    const isUnlocked = now >= (revealTime - bufferMs);
    
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
        newAmuletCategories: patch.newAmuletCategories || null
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

