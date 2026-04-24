const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');
const { createPreference } = require('../services/mercadopago');

const router = express.Router();

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
}

function optionalAuth(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev_secret');
  } catch {
    return null;
  }
}

// POST /api/orders — crea orden y preferencia de MercadoPago
router.post('/', async (req, res) => {
  const { items, buyer, shipping, paymentMethod } = req.body;

  if (!items?.length || !buyer?.email || !buyer?.name)
    return res.status(400).json({ error: 'Datos de pedido incompletos' });

  const hasPhysical = items.some(i => i.format === 'Papel' || i.format === 'Físico');
  const hasDigital = items.some(i => i.format === 'PDF');

  if (hasPhysical) {
    const { address, city, province, postalCode } = shipping || {};
    if (!address || !city || !province || !postalCode)
      return res.status(400).json({ error: 'Se requiere dirección de envío para productos físicos' });
  }

  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const shippingCost = hasPhysical ? (parseInt(process.env.SHIPPING_COST) || 3500) : 0;
  const total = subtotal + shippingCost;
  const orderId = generateOrderId();

  const authPayload = optionalAuth(req);
  const userId = authPayload?.userId || null;

  db.prepare(`
    INSERT INTO orders
      (id, user_id, user_name, user_email, user_phone, status, payment_method,
       subtotal, shipping_cost, total, has_physical, has_digital,
       shipping_name, shipping_address, shipping_city, shipping_province,
       shipping_postal_code, shipping_notes)
    VALUES (?,?,?,?,?,'pending',?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    orderId, userId, buyer.name.trim(), buyer.email.toLowerCase(), buyer.phone?.trim() || null,
    paymentMethod || 'mercadopago',
    subtotal, shippingCost, total,
    hasPhysical ? 1 : 0, hasDigital ? 1 : 0,
    shipping?.name?.trim() || null,
    shipping?.address?.trim() || null,
    shipping?.city?.trim() || null,
    shipping?.province?.trim() || null,
    shipping?.postalCode?.trim() || null,
    shipping?.notes?.trim() || null,
  );

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_title, product_format, product_category, price, price_usd, qty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of items) {
    insertItem.run(orderId, item.id, item.title, item.format, item.category || null, item.price, item.priceUSD || null, item.qty || 1);
  }

  // Crear preferencia de MercadoPago
  let initPoint = null;
  let sandboxInitPoint = null;
  let preferenceId = null;

  try {
    const mpItems = items.map(i => ({
      id: String(i.id),
      title: i.title,
      quantity: i.qty || 1,
      unit_price: i.price,
      currency_id: 'ARS',
    }));

    if (shippingCost > 0) {
      mpItems.push({
        id: 'envio',
        title: 'Envío Correo Argentino',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'ARS',
      });
    }

    const pref = await createPreference({
      orderId,
      items: mpItems,
      payer: { email: buyer.email, name: buyer.name },
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    });

    initPoint = pref.init_point;
    sandboxInitPoint = pref.sandbox_init_point;
    preferenceId = pref.id;

    db.prepare('UPDATE orders SET preference_id = ? WHERE id = ?').run(preferenceId, orderId);
  } catch (err) {
    console.error('MercadoPago preference error:', err.message);
  }

  res.status(201).json({ orderId, total, shippingCost, initPoint, sandboxInitPoint, preferenceId });
});

// GET /api/orders/my — órdenes del usuario autenticado
router.get('/my', requireAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.status, o.total, o.subtotal, o.shipping_cost, o.currency,
           o.has_physical, o.has_digital, o.payment_method, o.tracking_number,
           o.created_at, o.paid_at,
           GROUP_CONCAT(i.product_title, ' | ') AS items_summary,
           GROUP_CONCAT(i.product_format, ',') AS formats
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.userId);

  // Adjuntar tokens de descarga
  const withDownloads = orders.map(o => {
    if (!o.has_digital || o.status !== 'paid') return o;
    const downloads = db.prepare(`
      SELECT product_title, token, download_count, max_downloads, expires_at
      FROM digital_downloads WHERE order_id = ?
    `).all(o.id);
    return { ...o, downloads };
  });

  res.json(withDownloads);
});

// GET /api/orders/:id — detalle de orden (owner o admin)
router.get('/:id', requireAuth, (req, res) => {
  const order = db.prepare(`
    SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = 'admin')
  `).get(req.params.id, req.userId, req.userRole);

  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  const downloads = db.prepare(`
    SELECT product_title, token, download_count, max_downloads, expires_at
    FROM digital_downloads WHERE order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items, downloads });
});

// GET /api/orders — todas las órdenes (admin)
router.get('/', requireAuth, (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'No autorizado' });

  const orders = db.prepare(`
    SELECT o.id, o.status, o.total, o.user_name, o.user_email,
           o.has_physical, o.has_digital, o.tracking_number,
           o.created_at, o.paid_at,
           GROUP_CONCAT(i.product_title, ' | ') AS items_summary
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 200
  `).all();

  res.json(orders);
});

// PATCH /api/orders/:id/status — cambiar estado y tracking (admin)
router.patch('/:id/status', requireAuth, (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'No autorizado' });

  const { status, tracking_number } = req.body;
  const validStatuses = ['pending', 'paid', 'processing_shipment', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Estado inválido' });

  db.prepare(`
    UPDATE orders
    SET status = ?, tracking_number = COALESCE(?, tracking_number)
    WHERE id = ?
  `).run(status, tracking_number || null, req.params.id);

  res.json({ ok: true });
});

module.exports = router;
