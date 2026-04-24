const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '30d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
    avatar: user.name.slice(0, 2).toUpperCase(),
    memberSince: new Date(user.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'El email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase(), hash, phone?.trim() || null);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(publicUser(user));
});

// PUT /api/auth/me
router.put('/me', requireAuth, (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name.trim(), phone?.trim() || null, req.userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json(publicUser(user));
});

// PUT /api/auth/password
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ error: 'Contraseña actual incorrecta' });

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.userId);
  res.json({ ok: true });
});

// GET /api/auth/users (admin only)
router.get('/users', requireAuth, (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  const users = db
    .prepare('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json(users.map(u => ({ ...publicUser(u), created_at: u.created_at })));
});

module.exports = router;
