const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const router = express.Router();
const PDF_DIR = path.resolve(process.env.PDF_DIR || './uploads/pdfs');

// GET /api/downloads/:token
router.get('/:token', (req, res) => {
  const dl = db.prepare('SELECT * FROM digital_downloads WHERE token = ?').get(req.params.token);

  if (!dl) return res.status(404).json({ error: 'Link inválido o ya utilizado' });
  if (new Date(dl.expires_at) < new Date()) return res.status(410).json({ error: 'El link expiró. Contactá al soporte.' });
  if (dl.download_count >= dl.max_downloads) return res.status(410).json({ error: 'Se alcanzó el límite de descargas.' });

  const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(dl.order_id);
  if (!order || order.status !== 'paid') return res.status(402).json({ error: 'Pago no confirmado aún.' });

  const filePath = path.join(PDF_DIR, dl.file_path);
  if (!fs.existsSync(filePath)) {
    console.error('[DOWNLOADS] Archivo no encontrado:', filePath);
    return res.status(503).json({ error: 'Archivo temporalmente no disponible. Contactá al soporte.' });
  }

  db.prepare('UPDATE digital_downloads SET download_count = download_count + 1 WHERE token = ?').run(req.params.token);

  const safeTitle = dl.product_title.replace(/[^a-zA-ZÀ-ÿ0-9\s-]/g, '').trim().replace(/\s+/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="VeCKA_${safeTitle}.pdf"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
