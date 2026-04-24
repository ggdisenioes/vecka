require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const downloadsRoutes = require('./routes/downloads');
const webhooksRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cambia_esto_por_un_secreto_largo_y_aleatorio_en_produccion') {
  console.warn('\n⚠️  JWT_SECRET no configurado. Editá el archivo .env antes de ir a producción.\n');
}

// CORS
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Raw body para verificación de firma de webhook MP
app.use('/api/webhooks', express.raw({ type: '*/*' }));

// JSON para el resto
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', ts: new Date().toISOString() })
);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => {
  console.log(`\n🧵 VeCKA backend corriendo en http://localhost:${PORT}`);
  console.log(`   Frontend esperado en: ${FRONTEND_URL}`);
  console.log(`   MP webhook:           ${process.env.MP_WEBHOOK_URL || '(no configurado)'}\n`);
});
