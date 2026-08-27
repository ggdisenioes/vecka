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

  CREATE TABLE IF NOT EXISTS products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    category     TEXT    NOT NULL,
    subcategory  TEXT,
    price        INTEGER NOT NULL,
    price_usd    REAL,
    format       TEXT    NOT NULL,
    sizes        TEXT,
    color        TEXT    NOT NULL DEFAULT '#f4e4d4',
    badge        TEXT,
    pdf_filename TEXT,
    active       INTEGER NOT NULL DEFAULT 1,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
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

function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO products (title, category, subcategory, price, price_usd, format, sizes, color, badge, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Molde Remera Básica Adulto', 'Moldes Digitales', 'Indumentaria Femenina', 1800, 2, 'PDF', 'XS-XXL', '#f4e4d4', null, 1],
    ['Molde Vestido Camisero', 'Moldes Digitales', 'Indumentaria Femenina', 2200, 2.5, 'PDF', 'XS-XXL', '#e8d5e8', 'Nuevo', 2],
    ['Molde Pantalón Palazzo', 'Moldes Digitales', 'Indumentaria Femenina', 2000, 2, 'PDF', 'XS-XXL', '#d4e8d4', null, 3],
    ['Molde Body Bebé 0-24m', 'Moldes Digitales', 'Bebés y Niños', 1500, 1.5, 'PDF', '0-24m', '#d4e8e8', 'Top ventas', 4],
    ['Molde Remera Infantil Colegial', 'Moldes Digitales', 'Bebés y Niños', 1600, 1.6, 'PDF', '2-16', '#e8ead4', 'Molde del mes', 5],
    ['Molde Bolso Bucket', 'Moldes Digitales', 'Accesorios', 1400, 1.5, 'PDF', 'Único', '#f0e4d8', null, 6],
    ['Kit Costuras Básicas — Papel', 'Moldes Impresos', 'Moldes Impresos', 5500, 6, 'Papel', 'XS-XXL', '#ecdfd4', null, 7],
    ['Set Agujas Schmetz x10', 'Mercería VeCKA', 'Mercería', 3200, 3.5, 'Físico', 'Surtido', '#f4e4d4', null, 8],
    ['Kit Entretelas Surtidas', 'Mercería VeCKA', 'Mercería', 4800, 5, 'Físico', '50cm x 100cm', '#e4ecd4', null, 9],
  ];

  const insertMany = db.transaction(() => {
    products.forEach(p => insert.run(...p));
  });
  insertMany();
  console.log('✅ Productos iniciales cargados');
}
seedProducts();

module.exports = db;
