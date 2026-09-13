/**
 * server.js
 * PISO Academy MongoDB Backup API Server
 * Express + Mongoose — cloud-backup layer for all player game records.
 *
 * Start: node server.js (or npm run dev for --watch mode)
 * Port:  4000 (configurable via PORT env var)
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');

const playersRouter = require('./routes/players');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow the Vite dev server and your production domain to call the API
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, mobile)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  console.log(`[${ts}] ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    service: 'PISO Academy MongoDB API',
    version: '1.0.0',
    database: dbState[mongoose.connection.readyState] || 'unknown',
    uptime: Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/players', playersRouter);

// Leaderboard shortcut (no accountId prefix needed)
app.get('/api/leaderboard', async (_req, res) => {
  res.redirect('/api/players/leaderboard');
});

// ─── 404 Catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set in .env — please copy .env.example to .env and fill in your Atlas URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    });
    console.log('✅  MongoDB Atlas connected');
    console.log(`📦  Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n[Server] SIGTERM received — closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n[Server] SIGINT received — closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   🏛️  PISO Academy MongoDB Backup API                ║');
    console.log(`║   🌐  http://localhost:${PORT}                          ║`);
    console.log('║   📊  GET  /health                                   ║');
    console.log('║   📤  POST /api/players/sync                         ║');
    console.log('║   📥  GET  /api/players/:accountId                   ║');
    console.log('║   🏆  GET  /api/players/leaderboard                  ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
  });
});
