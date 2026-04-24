const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { getPayment } = require('../services/mercadopago');
const { sendDownloadEmail, sendPhysicalOrderEmail } = require('../services/mailer');

const router = express.Router();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function expiresAt(hours = 72) {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

// POST /api/webhooks/mercadopago
router.post('/mercadopago', async (req, res) => {
  // Siempre responder 200 primero para que MP no reintente
  res.status(200).json({ received: true });

  try {
    const raw = req.body;
    const bodyStr = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    const parsed = JSON.parse(bodyStr);

    if (parsed.type !== 'payment') return;

    const paymentId = parsed.data?.id;
    if (!paymentId) return;

    // Verificar firma HMAC si MP_WEBHOOK_SECRET está configurado
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret) {
      const xSig = req.headers['x-signature'] || '';
      const xReqId = req.headers['x-request-id'] || '';
      const ts = xSig.split(',').find(p => p.startsWith('ts='))?.split('=')[1] || '';
      const v1 = xSig.split(',').find(p => p.startsWith('v1='))?.split('=')[1] || '';
      const manifest = `id:${paymentId};request-id:${xReqId};ts:${ts};`;
      const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      if (expected !== v1) {
        console.warn('[WEBHOOK] Firma MP inválida — ignorando');
        return;
      }
    }

    // Obtener detalles del pago desde MP
    const payment = await getPayment(paymentId);
    if (!payment || payment.status !== 'approved') return;

    // Buscar la orden por external_reference o preference_id
    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? OR preference_id = ?')
      .get(payment.external_reference, payment.preference_id);

    if (!order) {
      console.warn('[WEBHOOK] Orden no encontrada para payment', paymentId);
      return;
    }
    if (order.status === 'paid') return; // ya procesado (idempotencia)

    // Marcar como pagada
    db.prepare('UPDATE orders SET status = ?, payment_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('paid', String(paymentId), order.id);

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    // Generar tokens de descarga para productos digitales
    const downloadLinks = [];
    for (const item of items) {
      if (item.product_format !== 'PDF') continue;

      const token = generateToken();
      const filePath = `product_${item.product_id}.pdf`;

      db.prepare(`
        INSERT INTO digital_downloads (order_id, product_id, product_title, token, file_path, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(order.id, item.product_id, item.product_title, token, filePath, expiresAt(72));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      downloadLinks.push({
        title: item.product_title,
        url: `${frontendUrl}?download=${token}`,
        token,
      });
    }

    // Emails
    if (downloadLinks.length > 0) {
      await sendDownloadEmail(order.user_email, order.user_name, downloadLinks, order.id);
    }
    if (order.has_physical) {
      const physicalItems = items.filter(i => i.product_format !== 'PDF');
      await sendPhysicalOrderEmail(order.user_email, order.user_name, physicalItems, order);
    }

    console.log(`[WEBHOOK] Orden ${order.id} pagada. Digitales: ${downloadLinks.length}, Físicos: ${order.has_physical ? 'sí' : 'no'}`);
  } catch (err) {
    console.error('[WEBHOOK] Error procesando notificación MP:', err.message);
  }
});

module.exports = router;
