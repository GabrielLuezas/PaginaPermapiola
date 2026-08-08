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

const DAY1_REVEAL = new Date(Date.now() + 30 * 60 * 1000);
const DAY3_REVEAL = new Date(DAY1_REVEAL.getTime() + 3 * 24 * 60 * 60 * 1000);

const PATCHES_DATA = [
  {
    number: 1,
    day: 1,
    revealDate: DAY1_REVEAL,
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
          { rank: 'User (Sin rango)', amount: 'x2 MEDALLÓN', icon: '/images/items/medallion.png', badgeClass: 'user' },
          { rank: 'Gold Rank', amount: 'x3 MEDALLÓN', icon: '/images/items/medallion.png', badgeClass: 'gold' },
          { rank: 'Diamond Rank', amount: 'x4 MEDALLÓN', icon: '/images/items/medallion.png', badgeClass: 'diamond' },
          { rank: 'Netherite Rank', amount: 'x5 MEDALLÓN', icon: '/images/items/medallion.png', badgeClass: 'netherite' }
        ]
      },
      {
        name: 'SHOP NPC (TIENDA DE MEDALLONES)',
        img: '/images/npc_shop.png',
        description: 'Ubicado en el Pueblo del servidor. Interactúa con este NPC para abrir la tienda y canjear tus medallones acumulados por rangos temporales, pases de eventos e ítems exclusivos.',
        cooldown: 'Comando /medallonshop',
        guiTitle: '[MEDALLON SHOP]',
        guiGridRows: 3,
        guiGridCols: 9,
        guiSlots: [
          { row: 0, col: 0, name: 'Gold Rank (3 Días)', img: '/images/items/gold_rank.png' },
          { row: 0, col: 1, name: 'Diamond Rank (3 Días)', img: '/images/items/diamond_rank.png' },
          { row: 0, col: 2, name: 'Netherite Rank (3 Días)', img: '/images/items/netherite_rank.png' },
          { row: 0, col: 3, name: 'Rank Upgrade [TEMP]', img: '/images/items/gray_dye.png' },
          { row: 0, col: 7, name: 'Pase para Mega Dungeon', img: '/images/items/megadungeon_pass.png' },
          { row: 0, col: 8, name: 'Pase para Dragon Fight', img: '/images/items/anomaly_pass.png' },
          { row: 2, col: 0, name: 'Purifying Antidote', img: '/images/items/purifying_antidote.png' },
          { row: 2, col: 1, name: 'Bedrock Crowbar', img: '/images/items/bedrock_crowbar.png' },
          { row: 2, col: 2, name: 'Soul Wand', img: '/images/items/soul_wand.png' },
          { row: 2, col: 3, name: 'Potion of the Turtle God', img: '/images/items/potion_of_the_turtle_god.png' },
          { row: 2, col: 8, name: 'Mystery Airdrop', img: '/images/items/airdrop.svg' }
        ]
      },
      {
        name: 'MISIONES NPC',
        img: '/images/npc_misiones.png',
        description: 'Ubicado en el Pueblo del servidor. Interactúa con este NPC para acceder a las misiones diarias.',
        cooldown: 'Comando /misiones'
      }
    ],
    crafts: [
      {
        name: 'Bedrock Crowbar',
        img: '/images/items/bedrock_crowbar.png',
        description: 'Forjada en las profundidades del Nether para poder atravesar los límites. Habilidad: Bedrock Smasher — Al dar clic en un bloque de Bedrock estando en el techo del Nether, podrás romperlo y así atravesar el techo. (Límite: 5 usos).'
      },
      {
        name: 'Purifying Antidote',
        img: '/images/items/purifying_antidote.png',
        description: 'Antídoto universal capaz de purificar a cualquiera que lo tome. Habilidad: Cleanse — Al tomar el antídoto, remueve cualquier efecto negativo que el jugador tenga en ese momento.'
      },
      {
        name: 'Potion of the Turtle God',
        img: '/images/items/potion_of_the_turtle_god.png',
        description: 'Otorga Resistance IV (00:20) y Speed II (00:20). Al aplicarse otorga +40% de velocidad.'
      },
      {
        name: 'Soul Wand',
        img: '/images/items/soul_wand.png',
        description: 'Reliquia olvidada donde descansan almas perdidas esperando ser liberadas. Habilidad: Soul Attack — Al activarse, invoca almas aliadas que atacarán a cualquier enemigo que esté alrededor. (Enfriamiento: 2 minutos).'
      },
      {
        name: 'Esmeralda Reforzada',
        img: '/images/items/emerald_block.png',
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
          { row: 0, col: 0, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.png' },
          { row: 0, col: 1, name: 'Fragmento de Disco 5', count: 5, img: '/images/items/disc_fragment_5.png' },
          { row: 0, col: 2, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.png' },
          { row: 1, col: 0, name: 'Pata de Conejo', count: 5, img: '/images/items/rabbit_foot.png' },
          { row: 1, col: 1, name: 'Echo Shard', count: 10, img: '/images/items/echo_shard.png' },
          { row: 1, col: 2, name: 'Sculk Sensor', count: 5, img: '/images/items/sculk_sensor.png' },
          { row: 2, col: 0, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.png' },
          { row: 2, col: 1, name: 'Sculk Shrieker', count: 5, img: '/images/items/sculk_shrieker.png' },
          { row: 2, col: 2, name: 'Bloque de Diamante', count: 2, img: '/images/items/block_diamond.png' }
        ],
        result: { row: 1, col: 2, name: 'Shadow Dash', img: '/images/items/shadow_dash.png' }
      },
      {
        title: 'Alchemy Elixir',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Zanahoria dorada', count: 16, img: '/images/items/golden_carrot.png' },
          { row: 0, col: 1, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.png' },
          { row: 0, col: 2, name: 'Crema de Magma', count: 16, img: '/images/items/magma_cream.png' },
          { row: 1, col: 0, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.png' },
          { row: 1, col: 1, name: 'Bloque de Redstone', count: 64, img: '/images/items/block_redstone.png' },
          { row: 1, col: 2, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.png' },
          { row: 2, col: 0, name: 'Melón reluciente', count: 16, img: '/images/items/glistering_melon.png' },
          { row: 2, col: 1, name: 'Vara de Blaze', count: 16, img: '/images/items/blaze_rod.png' },
          { row: 2, col: 2, name: 'Ojo de Araña Fermentado', count: 16, img: '/images/items/fermented_spider_eye.png' }
        ],
        result: { row: 1, col: 2, name: 'Alchemy Elixir', img: '/images/items/alchemy_elixir.png' }
      },
      {
        title: 'Freezing Touch',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.png' },
          { row: 0, col: 1, name: 'Concha de nautilo', count: 5, img: '/images/items/nautilus_shell.png' },
          { row: 0, col: 2, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.png' },
          { row: 1, col: 0, name: 'Cristal de prismarina', count: 5, img: '/images/items/prismarine_crystal.png' },
          { row: 1, col: 1, name: 'Corazón del mar', img: '/images/items/heart_of_the_sea.png' },
          { row: 1, col: 2, name: 'Saco de tinta de calamar brillante', count: 5, img: '/images/items/grok_ink_sack.png' },
          { row: 2, col: 0, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.png' },
          { row: 2, col: 1, name: 'Fragmento de prismarina', count: 5, img: '/images/items/prismarine_shard.png' },
          { row: 2, col: 2, name: 'Hielo azul', count: 32, img: '/images/items/blue_ice.png' }
        ],
        result: { row: 1, col: 2, name: 'Freezing Touch', img: '/images/items/freezing_touch.png' }
      },
      {
        title: 'Lightning Reflexes',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.png' },
          { row: 0, col: 1, name: 'Piedra luminosa', count: 32, img: '/images/items/glowstone.png' },
          { row: 0, col: 2, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.png' },
          { row: 1, col: 0, name: 'Fragmento de amatista', count: 32, img: '/images/items/amethyst_shard.png' },
          { row: 1, col: 1, name: 'Pluma', count: 64, img: '/images/items/feather.png' },
          { row: 1, col: 2, name: 'Vara de Breeze', count: 32, img: '/images/items/breeze_rod.png' },
          { row: 2, col: 0, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.png' },
          { row: 2, col: 1, name: 'Grumo de resina', count: 32, img: '/images/items/resin_clump.png' },
          { row: 2, col: 2, name: 'Lingote de Netherite', img: '/images/items/netherite_ingot.png' }
        ],
        result: { row: 1, col: 2, name: 'Lightning Reflexes', img: '/images/items/lightning_reflexes.png' }
      },
      {
        title: 'Esmeralda Reforzada',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.png' },
          { row: 0, col: 1, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.png' },
          { row: 0, col: 2, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.png' },
          { row: 1, col: 0, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.png' },
          { row: 1, col: 1, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.png' },
          { row: 1, col: 2, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.png' },
          { row: 2, col: 0, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.png' },
          { row: 2, col: 1, name: 'Bloque de esmeralda', img: '/images/items/emerald_block.png' },
          { row: 2, col: 2, name: 'Mena de esmeralda', img: '/images/items/emerald_ore.png' }
        ],
        result: { row: 1, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' }
      },
      {
        title: "Herald's Badge I",
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' },
          { row: 0, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 0, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' },
          { row: 1, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 1, col: 1, name: 'Frasco ominoso', img: '/images/items/ominous_bottle.png' },
          { row: 1, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 2, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' },
          { row: 2, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 2, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' }
        ],
        result: { row: 1, col: 2, name: "Herald's Badge I", img: "/images/items/herald's_badge_I.png" }
      },
      {
        title: "Herald's Badge II",
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' },
          { row: 0, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 0, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' },
          { row: 1, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 1, col: 1, name: "Herald's Badge I", img: "/images/items/herald's_badge_I.png" },
          { row: 1, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 2, col: 0, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' },
          { row: 2, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 2, col: 2, name: 'Totem de la Inmortalidad', img: '/images/items/totem.png' }
        ],
        result: { row: 1, col: 2, name: "Herald's Badge II", img: "/images/items/herald's_badge_II.png" }
      },
      {
        title: "Herald's Badge III",
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 0, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 0, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 1, col: 0, name: 'Mena de esmeralda profunda', img: '/images/items/deepslate_emerald_ore.png' },
          { row: 1, col: 1, name: "Herald's Badge II", img: "/images/items/herald's_badge_II.png" },
          { row: 1, col: 2, name: 'Mena de esmeralda profunda', img: '/images/items/deepslate_emerald_ore.png' },
          { row: 2, col: 0, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 2, col: 1, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' },
          { row: 2, col: 2, name: 'Esmeralda Reforzada', img: '/images/items/emerald_block.png' }
        ],
        result: { row: 1, col: 2, name: "Herald's Badge III", img: "/images/items/herald's_badge_III.png" }
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
          img: '/images/items/shadow_dash.png',
          description: 'Rompe el aire con dos agachamientos rápidos. Pulsa Doble Shift para realizar un Dash hacia adelante. (Enfriamiento: 30 segundos).'
        },
        {
          name: 'Alchemy Elixir',
          img: '/images/items/alchemy_elixir.png',
          description: 'Extiende la alquimia en tus venas. Pociones bebidas o lanzadas: +50% de duración extra. (Pasivo - siempre activo).'
        },
        {
          name: 'Freezing Touch',
          img: '/images/items/freezing_touch.png',
          description: 'Tus golpes críticos acumulan un frío devastador. Cada 25 críticos, congela al mob en hielo 5s. Crea un área helada con Hielo y Nieve. Aplica Lentitud IV a mobs en 5 bloques por 5s. (Pasivo - se carga al asestar críticos).'
        },
        {
          name: 'Lightning Reflexes',
          img: '/images/items/lightning_reflexes.png',
          description: 'La agilidad concentrada en tres movimientos rápidos. Haz Shift 3 veces seguidas para otorgar Velocidad III por 20s. (Enfriamiento: 2 minutos).'
        },
        {
          name: "Herald's Badge I",
          img: "/images/items/herald's_badge_I.png",
          description: 'El símbolo de los protectores de todas las aldeas. Héroe de la Aldea I permanente. Los comerciantes te adoran. (Pasivo - siempre activo).'
        },
        {
          name: "Herald's Badge II",
          img: "/images/items/herald's_badge_II.png",
          description: 'El símbolo de los protectores de todas las aldeas. Héroe de la Aldea II permanente. Los comerciantes te adoran. (Pasivo - siempre activo).'
        },
        {
          name: "Herald's Badge III",
          img: "/images/items/herald's_badge_III.png",
          description: 'El símbolo de los protectores de todas las aldeas. Héroe de la Aldea III permanente. Los comerciantes te adoran. (Pasivo - siempre activo).'
        }
      ]
    }
  },
  {
    number: 2,
    day: 3,
    revealDate: DAY3_REVEAL,
    mechanics: [
      { tag: 'REMOVIDO', text: 'El casco de tortuga ya no es crafteable.' },
      { tag: 'NERFEO/BUFEO', text: 'Minar un bloque de Creaking Heart te dará Darkness por 1 minuto.' },
      { tag: 'NUEVO', text: 'Infección Wasted: Ha aparecido una nueva infección que afecta a los zombies y los convierte en una mejor versión de ellos mismos. Dándoles habilidades, más fuerza, rapidez y mucha inteligencia. Todos los Zombies son Wasted.' }
    ],
    effects: [
      {
        name: 'Chained Memory',
        img: '/images/placeholders/effect_placeholder.svg',
        description: 'Este efecto te impide pensar y recordar. Por lo tanto el jugador al tener este efecto, lo hace muy lento. Pierde significativamente su visión y habilidades básicas. Como poder cambiar de mano un objeto. O usar el escudo.'
      }
    ],
    dungeons: [
      {
        name: 'LOS MILENARIOS',
        img: '/images/mobs/milenario.png',
        description: 'En este castillo milenario se resguardaba una antigua civilización, donde protegían sus joyas y reliquias del caos que había afuera. Hasta que un día una enfermedad viral masacró a todos los que estaban dentro de ellas.'
      }
    ],
    mobs: [
      {
        name: 'Millenary Guard',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Este cadáver de un antiguo guarda de los milenarios es muy fuerte. Lleva una espada con él y defenderá el milenario con su vida.'
      },
      {
        name: 'Millenary Prototype',
        img: '/images/mobs/milenary_prototype.png',
        description: 'Este prototipo está hecho a base de los lingotes milenarios que se encuentran en la fábrica. Es el peor enemigo que te podés encontrar. Con su gran velocidad y resistencia puede destruirte de unos pocos golpes sin necesidad de exigirse mucho.'
      },
      {
        name: 'Millenary Crawler',
        img: '/images/placeholders/mob_placeholder.svg',
        description: 'Este pequeño prototipo al golpearte se sumergirá en tu cerebro y borrará toda tu memoria al instante. Dejándote tonto y en shock durante unos segundos pero si quieres cortar la duración, tendrás que usar un antídoto. (15s del efecto Chained Memory).'
      },
      {
        name: 'Kamikaze Machine',
        img: '/images/mobs/kamikaze_machine.png',
        description: 'Esta antigua máquina kamikaze lleva en sus manos una antorcha de Redstone. La cual utilizará en el momento que se acerque a ti para prender la mecha de su barril con dinamita.'
      },
      {
        name: 'Pale Cyclops',
        img: '/images/mobs/pale_cyclops.png',
        description: 'Su mordida es altamente mortal. Además de que al pegarte te dejará cegado durante varios segundos. Tiene una velocidad lenta y su vida es alta.'
      },
      {
        name: 'Pale Wasp',
        img: '/images/mobs/pale_wasp.png',
        description: 'Con su aguijón te dará una inyección letal de Veneno, Descomposición y Ceguera.'
      },
      {
        name: 'Wasted Crawler',
        img: '/images/mobs/wasted_crawler.png',
        description: 'Este zombie se arrastra por el piso. No hace mucho daño, ni es rápido pero al golpearte te intentará mantener para que los demás te cazen. (Te da lentitud 2)'
      },
      {
        name: 'Wasted Bomber',
        img: '/images/mobs/wasted_bomber.png',
        description: 'Este zombie que tiene una bomba en sus manos irá rápidamente hacia vos y prendera la bomba para explotar todo. Cuando te golpea enciende su tnt y hace una explosion de nivel 4 despues de 1.5 segundos'
      },
      {
        name: 'Wasted Walker',
        img: '/images/mobs/wasted_walker.png',
        description: 'Es el zombie común que todos vemos, tiene doble de fuerza y 3 corazones más.'
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
        img: '/images/items/millenary_plate.png',
        description: 'Placa especial a base de la aleación milenaria producida en la fábrica.'
      },
      {
        name: 'Millenary Ingot',
        img: '/images/items/millenary_ingot.png',
        description: 'Lingote especial a base de la aleación milenaria producido en la fábrica.'
      },
      {
        name: 'Sapphire Jewels',
        img: '/images/items/s_jewels.png',
        description: 'Reliquias y joyas de zafiro resguardadas en el castillo ancestral.'
      },
      {
        name: 'Ruby Jewels',
        img: '/images/items/r_jewels.png',
        description: 'Reliquias y joyas de rubí protegidas por la civilización milenaria.'
      },
      {
        name: 'Millenary Jewels',
        img: '/images/items/m_jewels.png',
        description: 'Antiguas joyas y tesoros sagrados recuperados de Los Milenarios.'
      },
      {
        name: 'Oblivion Chronicles',
        img: '/images/items/oblivion_book.png',
        description: 'Un libro dorado, perdido hace mucho tiempo, con demasiados conocimientos y poder. Pertenece a un escritor desconocido… y sus secretos se revelan poco a poco a quien logre utilizarlo correctamente.'
      },
      {
        name: 'Wasted Flesh',
        img: '/images/items/wasted_flesh.png',
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
          { row: 0, col: 0, name: 'Millenary Jewels', count: 6, img: '/images/items/m_jewels.png' },
          { row: 0, col: 1, name: 'Millenary Jewels', count: 6, img: '/images/items/m_jewels.png' },
          { row: 0, col: 2, name: 'Millenary Jewels', count: 6, img: '/images/items/m_jewels.png' },
          { row: 1, col: 0, name: 'Millenary Ingot', count: 4, img: '/images/items/millenary_ingot.png' },
          { row: 1, col: 1, name: 'Millenary Bar', count: 8, img: '/images/items/millenary_plate.png' },
          { row: 1, col: 2, name: 'Millenary Ingot', count: 4, img: '/images/items/millenary_ingot.png' },
          { row: 2, col: 0, name: 'Millenary Ingot', count: 4, img: '/images/items/millenary_ingot.png' },
          { row: 2, col: 2, name: 'Millenary Ingot', count: 4, img: '/images/items/millenary_ingot.png' }
        ],
        result: { row: 1, col: 2, name: 'Millenary Crown', img: '/images/items/millenary_crown.svg' }
      },
      {
        title: 'Acero en bruto',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Hierro en bruto', img: '/images/items/raw_iron.png' },
          { row: 0, col: 1, name: 'Hierro en bruto', img: '/images/items/raw_iron.png' },
          { row: 0, col: 2, name: 'Hierro en bruto', img: '/images/items/raw_iron.png' },
          { row: 1, col: 0, name: 'Hierro en bruto', img: '/images/items/raw_iron.png' },
          { row: 1, col: 1, name: 'Carbón', img: '/images/items/coal.png' },
          { row: 1, col: 2, name: 'Carbón', img: '/images/items/coal.png' },
          { row: 2, col: 0, name: 'Carbón', img: '/images/items/coal.png' },
          { row: 2, col: 1, name: 'Carbón', img: '/images/items/coal.png' }
        ],
        result: { row: 1, col: 2, name: 'Acero en bruto', img: '/images/items/raw_steel.png' }
      },
      {
        title: 'Lingotes de acero',
        type: 'furnace',
        input: { row: 0, col: 0, name: 'Acero en bruto', img: '/images/items/raw_steel.png' },
        fuel: { row: 0, col: 0, name: 'Cubo de Lava', img: '/images/items/lava_bucket.png' },
        result: { row: 0, col: 0, name: 'Lingotes de acero', img: '/images/items/steel_ingots.png' }
      },
      {
        title: 'Placas de acero',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 1, col: 0, name: 'Lingotes de acero', img: '/images/items/steel_ingots.png' },
          { row: 1, col: 1, name: 'Lingotes de acero', img: '/images/items/steel_ingots.png' },
          { row: 1, col: 2, name: 'Lingotes de acero', img: '/images/items/steel_ingots.png' }
        ],
        result: { row: 1, col: 2, name: 'Placas de acero', img: '/images/placeholders/dark_ingot_placeholder.svg' }
      },
      {
        title: 'Mesa',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Lana Verde', count: 2, img: '/images/items/green_wool.png' },
          { row: 0, col: 1, name: 'Palo', count: 4, img: '/images/items/stick.png' },
          { row: 0, col: 2, name: 'Lana Verde', count: 2, img: '/images/items/green_wool.png' },
          { row: 1, col: 0, name: 'Tronco de Roble', count: 16, img: '/images/items/oak_log.png' },
          { row: 1, col: 1, name: 'Tronco de Roble', count: 16, img: '/images/items/oak_log.png' },
          { row: 1, col: 2, name: 'Tronco de Roble', count: 16, img: '/images/items/oak_log.png' },
          { row: 2, col: 0, name: 'Pizarra profunda pulida', count: 12, img: '/images/items/polished_deepslate.png' },
          { row: 2, col: 2, name: 'Pizarra profunda pulida', count: 12, img: '/images/items/polished_deepslate.png' }
        ],
        result: { row: 1, col: 2, name: 'Mesa', img: '/images/placeholders/table_base_placeholder.svg' }
      },
      {
        title: 'OBLIVION WORKBENCH',
        type: 'crafting',
        gridCols: 3,
        gridRows: 3,
        slots: [
          { row: 0, col: 0, name: 'Cofre', img: '/images/items/chest.png' },
          { row: 0, col: 1, name: 'Oblivion Chronicles', img: '/images/items/oblivion_book.png' },
          { row: 0, col: 2, name: 'Mazo de acero', img: '/images/items/steel_mace.png' },
          { row: 1, col: 0, name: 'Placas de acero', img: '/images/placeholders/dark_ingot_placeholder.svg' },
          { row: 1, col: 1, name: 'Mesa', img: '/images/placeholders/table_base_placeholder.svg' },
          { row: 1, col: 2, name: 'Placas de acero', img: '/images/placeholders/dark_ingot_placeholder.svg' }
        ],
        result: { row: 1, col: 2, name: 'Oblivion Workbench', img: '/images/placeholders/oblivion_workbench.svg' }
      }
    ]
  },
  {
    number: 3,
    day: 7,
    revealDate: new Date('2026-08-14T19:00:00Z'),
    mechanics: [
      { tag: 'NUEVO', text: '3 zonas de PVP forzado en el mapa. Los jugadores dentro tienen su posición visible en el mapa de todos.' },
      { tag: 'NERFEO/BUFEO', text: 'Fuego amigo activo en zonas neutrales. Las PartyGUI siguen protegiendo dentro del grupo.' },
      { tag: 'NERFEO/BUFEO', text: 'Te ahogas 10x más rápido sin Poción de Respiración Acuática (3 segundos sin poción = muerte).' },
      { tag: 'NERFEO/BUFEO', text: 'Herramientas sin Netherite al romper roca quitan 8 corazones si no tienes Protección IV.' },
      { tag: 'NERFEO/BUFEO', text: 'Los Endermans tienen Fuerza X permanente. Mirarlos activa modo Berserk.' }
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
    crafts: [
      {
        name: 'Poción Invisibilidad Permanente',
        img: 'https://minecraft.wiki/images/Potion_of_Invisibility.png',
        description: 'Dura 10 min. Se cancela al atacar. Crafteable con 8 Fermented Spider Eyes + Botella Mágica.',
        droppedBy: 'Crafteable — 8 Fermented Spider Eyes + Botella Mágica',
        craftIngredients: '8 Fermented Spider Eyes + Botella Mágica'
      }
    ],
    loot: [
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
        img: 'https://minecraft.wiki/images/Warden.png',
        hearts: 500,
        equipment: ['Sonic Boom mejorado', 'Inmunidad a pociones de daño'],
        drop: '100% — Corazón del Abismo'
      }
    ],
    crafts: [
      {
        name: 'Armadura de Warden',
        img: 'https://minecraft.wiki/images/Netherite_Chestplate.png',
        description: 'Te hace inmune al efecto de Oscuridad y reduce el daño de proyectiles un 25%.',
        droppedBy: 'Crafteable con Corazón del Abismo + Armadura de Netherite'
      }
    ],
    loot: []
  },
  {
    number: 5,
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
    number: 6,
    day: 18,
    revealDate: new Date('2026-08-25T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 7,
    day: 21,
    revealDate: new Date('2026-08-28T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 8,
    day: 23,
    revealDate: new Date('2026-08-30T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 9,
    day: 25,
    revealDate: new Date('2026-09-01T19:00:00Z'),
    mechanics: [{ tag: 'NUEVO', text: '🔒 Contenido bloqueado.' }],
    mobs: [],
    crafts: [],
    loot: []
  },
  {
    number: 10,
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
        mobs: patch.mobs,
        crafts: patch.crafts || [],
        loot: patch.loot || [],
        recipes: patch.recipes || [],
        amuletSystem: patch.amuletSystem,
        npcs: patch.npcs || [],
        items: [...(patch.crafts || []), ...(patch.loot || [])]
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
const DIST = path.join(__dirname, 'dist/permapiola-web/browser');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(DIST));

// SPA fallback — Angular routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PermaPiola server running on port ${PORT}`);
});

