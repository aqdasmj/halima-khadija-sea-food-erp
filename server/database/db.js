const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let dbPath = path.resolve(__dirname, 'boat_finance.db');

if (process.env.NETLIFY || process.env.AWS_EXECUTION_ENV || process.env.LAMBDA_TASK_ROOT) {
  const tmpPath = path.join('/tmp', 'boat_finance.db');
  if (!fs.existsSync(tmpPath) && fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, tmpPath);
    } catch (e) {
      console.error('Copy to /tmp failed:', e);
    }
  }
  dbPath = tmpPath;
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'finance_manager',
        active_status INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS boats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        registration_number TEXT UNIQUE NOT NULL,
        owner_name TEXT NOT NULL,
        engine_details TEXT,
        crew_count INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS crew (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT,
        role TEXT NOT NULL,
        boat_id INTEGER,
        weekly_allowance REAL DEFAULT 0,
        monthly_salary REAL DEFAULT 0,
        notes TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE SET NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS crew_advances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        crew_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL DEFAULT 'advance',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (crew_id) REFERENCES crew(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        boat_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        paid_by TEXT,
        payment_method TEXT NOT NULL DEFAULT 'Cash',
        receipt_path TEXT,
        notes TEXT,
        month_locked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        boat_id INTEGER NOT NULL,
        fish_type TEXT NOT NULL,
        quantity REAL DEFAULT 0,
        sale_amount REAL NOT NULL,
        buyer_name TEXT,
        market_location TEXT,
        payment_received REAL DEFAULT 0,
        pending_payment REAL DEFAULT 0,
        notes TEXT,
        month_locked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        boat_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        problem TEXT,
        vendor_name TEXT,
        amount REAL NOT NULL,
        next_service_date TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS diesel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        boat_id INTEGER NOT NULL,
        litres REAL NOT NULL,
        price_per_litre REAL NOT NULL,
        total_amount REAL NOT NULL,
        trip_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS monthly_locks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_month TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'locked',
        locked_by TEXT,
        locked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables verified / initialized.');
  });
}

initDb();

module.exports = {
  db,
  dbPath,
  runAsync,
  allAsync,
  getAsync
};
