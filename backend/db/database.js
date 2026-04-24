const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, '..', 'vecka.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'student',
    phone         TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                   TEXT    PRIMARY KEY,
    user_id              INTEGER,
    user_name            TEXT    NOT NULL,
    user_email           TEXT    NOT NULL,
    user_phone           TEXT,
    status               TEXT    NOT NULL DEFAULT 'pending',
    payment_method       TEXT,
    payment_id           TEXT,
    preference_id        TEXT,
    subtotal             INTEGER NOT NULL,
    shipping_cost        INTEGER NOT NULL DEFAULT 0,
    total                INTEGER NOT NULL,
    currency             TEXT    NOT NULL DEFAULT 'ARS',
    has_physical         INTEGER NOT NULL DEFAULT 0,
    has_digital          INTEGER NOT NULL DEFAULT 0,
    shipping_name        TEXT,
    shipping_address     TEXT,
    shipping_city        TEXT,
    shipping_province    TEXT,
    shipping_postal_code TEXT,
    shipping_notes       TEXT,
    tracking_number      TEXT,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at              DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id         TEXT    NOT NULL,
    product_id       INTEGER,
    product_title    TEXT    NOT NULL,
    product_format   TEXT    NOT NULL,
    product_category TEXT,
    price            INTEGER NOT NULL,
    price_usd        REAL,
    qty              INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS digital_downloads (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       TEXT    NOT NULL,
    product_id     INTEGER NOT NULL,
    product_title  TEXT    NOT NULL,
    token          TEXT    UNIQUE NOT NULL,
    file_path      TEXT    NOT NULL,
    download_count INTEGER NOT NULL DEFAULT 0,
    max_downloads  INTEGER NOT NULL DEFAULT 5,
    expires_at     DATETIME,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// Seed admin user on first boot
function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'vero@vecka.com.ar';
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return;

  const name = process.env.ADMIN_NAME || 'Vero (Admin)';
  const pass = process.env.ADMIN_PASSWORD || 'vecka-admin-2024';
  const hash = bcrypt.hashSync(pass, 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, hash, 'admin');
  console.log(`✅ Admin creado: ${email}`);
}
seedAdmin();

module.exports = db;
