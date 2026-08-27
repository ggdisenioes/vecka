const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const PDF_DIR = process.env.PDF_DIR || path.join(__dirname, '..', 'uploads', 'pdfs');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDF_DIR),
  filename: (req, _file, cb) => cb(null, `product_${req.params.id}.pdf`),
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se aceptan archivos PDF'));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// GET /api/products — public, active products
router.get('/', (_req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, id ASC').all();
  res.json(products);
});

// GET /api/products/all — admin, all products
router.get('/all', requireAuth, requireAdmin, (_req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC, id ASC').all();
  res.json(products);
});

// POST /api/products — admin, create product
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, category, subcategory, price, price_usd, format, sizes, color, badge } = req.body;
  if (!title || !category || !price || !format) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM products').get().m || 0;
  const result = db.prepare(`
    INSERT INTO products (title, category, subcategory, price, price_usd, format, sizes, color, badge, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, category || null, subcategory || null, price, price_usd || null, format, sizes || null, color || '#f4e4d4', badge || null, maxOrder + 1);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id — admin, update product
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { title, category, subcategory, price, price_usd, format, sizes, color, badge, active } = req.body;
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  db.prepare(`
    UPDATE products SET title=?, category=?, subcategory=?, price=?, price_usd=?, format=?, sizes=?, color=?, badge=?, active=?
    WHERE id=?
  `).run(title, category, subcategory || null, price, price_usd || null, format, sizes || null, color, badge || null, active ? 1 : 0, req.params.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

// POST /api/products/:id/pdf — admin, upload PDF
router.post('/:id/pdf', requireAuth, requireAdmin, (req, res, next) => {
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  next();
}, upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const filename = req.file.filename;
  db.prepare('UPDATE products SET pdf_filename = ? WHERE id = ?').run(filename, req.params.id);
  res.json({ ok: true, filename });
});

// DELETE /api/products/:id — admin, soft delete
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
