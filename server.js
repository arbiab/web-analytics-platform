require('dotenv').config();
const express = require('express');
const { connectMongo } = require('./db/mongo');
const ActivityLog = require('./models/ActivityLog');
const KpiCache = require('./models/KpiCache');
const { Pool } = require('pg');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'analytics_secret_key_2024';

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'web_analytics_platform',
  password: process.env.DB_PASSWORD || 'postgres',
  port: 5433,
});

connectMongo();

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Lidhja dështoi:', err.message);
  } else {
    console.log('✅ U lidh me PostgreSQL me sukses!');
    release();
  }
});

// ── Middleware: verifiko JWT ───────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mungon.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token i pavlefshëm.' });
  }
}

// Middleware: vetëm Admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Vetëm Admin mund ta bëjë këtë.' });
  }
  next();
}

// ── Register API ───────────────────────────────────────────────────────────
// Krijon biznesin + Admin-in e parë njëkohësisht
app.post('/api/register', async (req, res) => {
  const { business_name, industry, username, password } = req.body;

  if (!business_name || !username || !password) {
    return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë së paku 6 karaktere.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kontrollo nëse username ekziston
    const existing = await client.query('SELECT user_id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ky username është i zënë.' });
    }

    // Krijo biznesin
    const bizResult = await client.query(
      'INSERT INTO businesses (name, industry) VALUES ($1, $2) RETURNING business_id',
      [business_name, industry || 'General']
    );
    const business_id = bizResult.rows[0].business_id;

    // Hash fjalëkalimin
    const password_hash = await bcrypt.hash(password, 10);

    // Krijo Admin-in
    const userResult = await client.query(
      'INSERT INTO users (business_id, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, role',
      [business_id, username, password_hash, 'Admin']
    );

    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role, business_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: { username: user.username, role: user.role, business_id }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register gabim:', err.message);
    res.status(500).json({ error: 'Gabim gjatë regjistrimit.' });
  } finally {
    client.release();
  }
});

// ── Login API ──────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Përdoruesi nuk ekziston.' });

    // Verifiko fjalëkalimin — suporton edhe plain text (për demo data)
    let valid = false;
    if (user.password_hash.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      valid = password === '123456'; // demo users
    }
    if (!valid) return res.status(401).json({ error: 'Fjalëkalim i gabuar.' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role, business_id: user.business_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    // Regjistro aktivitetin në MongoDB
    ActivityLog.create({
      business_id: user.business_id,
      user_id:     user.user_id,
      username:    user.username,
      action:      'login',
      details:     { role: user.role },
      ip_address:  req.ip,
    }).catch(err => console.error('Log gabim:', err.message));

    res.json({ token, user: { username: user.username, role: user.role, business_id: user.business_id } });
  } catch (err) {
    console.error('Login gabim:', err.message);
    res.status(500).json({ error: 'Gabim i serverit.' });
  }
});

// ── Users API (vetëm Admin) ────────────────────────────────────────────────
// Merr listën e punonjësve të biznesit
app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, role, created_at FROM users WHERE business_id = $1 ORDER BY created_at',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së përdoruesve.' });
  }
});

// Shto punonjës të ri
app.post('/api/users', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dhe password janë të detyrueshme.' });
  if (password.length < 6) return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë së paku 6 karaktere.' });

  try {
    const existing = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Ky username është i zënë.' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (business_id, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, role',
      [req.user.business_id, username, password_hash, role || 'BusinessUser']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Shto user gabim:', err.message);
    res.status(500).json({ error: 'Gabim gjatë shtimit të përdoruesit.' });
  }
});

// Fshi punonjës
app.delete('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    // Mos lejo fshirjen e vetes
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({ error: 'Nuk mund të fshish llogarinë tënde.' });
    }
    // Fshi vetëm nga biznesi i vet
    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 AND business_id = $2 RETURNING user_id',
      [id, req.user.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Përdoruesi nuk u gjet.' });
    res.json({ message: 'Përdoruesi u fshi.' });
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë fshirjes.' });
  }
});

// ── Revenue Growth API ─────────────────────────────────────────────────────
app.get('/api/revenue-growth', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const query = isAdmin
      ? `SELECT b.name AS business_name, DATE_TRUNC('month', t.transaction_date) AS month, SUM(t.amount) AS total_revenue
         FROM transactions t JOIN businesses b ON t.business_id = b.business_id
         GROUP BY b.name, DATE_TRUNC('month', t.transaction_date) ORDER BY b.name, month`
      : `SELECT b.name AS business_name, DATE_TRUNC('month', t.transaction_date) AS month, SUM(t.amount) AS total_revenue
         FROM transactions t JOIN businesses b ON t.business_id = b.business_id
         WHERE t.business_id = $1
         GROUP BY b.name, DATE_TRUNC('month', t.transaction_date) ORDER BY b.name, month`;
    const result = await pool.query(query, isAdmin ? [] : [req.user.business_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së të dhënave.' });
  }
});

// ── Inventory Turnover API ─────────────────────────────────────────────────
app.get('/api/inventory-turnover', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const query = isAdmin
      ? `SELECT b.name AS business_name, i.product_name, SUM(t.amount) AS total_sales, AVG(i.quantity) AS avg_inventory,
                CASE WHEN AVG(i.quantity) = 0 THEN NULL ELSE ROUND(SUM(t.amount) / AVG(i.quantity), 2) END AS turnover_ratio
         FROM inventory i JOIN businesses b ON i.business_id = b.business_id
         JOIN transactions t ON t.business_id = b.business_id
         GROUP BY b.name, i.product_name ORDER BY b.name, i.product_name`
      : `SELECT b.name AS business_name, i.product_name, SUM(t.amount) AS total_sales, AVG(i.quantity) AS avg_inventory,
                CASE WHEN AVG(i.quantity) = 0 THEN NULL ELSE ROUND(SUM(t.amount) / AVG(i.quantity), 2) END AS turnover_ratio
         FROM inventory i JOIN businesses b ON i.business_id = b.business_id
         JOIN transactions t ON t.business_id = b.business_id
         WHERE i.business_id = $1
         GROUP BY b.name, i.product_name ORDER BY b.name, i.product_name`;
    const result = await pool.query(query, isAdmin ? [] : [req.user.business_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së të dhënave.' });
  }
});

// ── Forecasts API ──────────────────────────────────────────────────────────
app.get('/api/forecasts', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT k.name AS kpi_name, f.forecast_date, f.forecast_value
      FROM forecasts f
      JOIN model_runs mr ON f.run_id = mr.run_id
      JOIN kpi_definitions k ON mr.kpi_id = k.kpi_id
      ORDER BY k.name, f.forecast_date
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së të dhënave.' });
  }
});

// ── Business Profile API ───────────────────────────────────────────────────
app.get('/api/business', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT business_id, name, industry, email, phone, address, city,
              website, employees, description, logo_url, created_at, updated_at
       FROM businesses WHERE business_id = $1`,
      [req.user.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Biznesi nuk u gjet.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së profilit.' });
  }
});

app.put('/api/business', authMiddleware, adminOnly, async (req, res) => {
  const { name, industry, email, phone, address, city, website, employees, description, logo_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE businesses SET
        name = COALESCE($1, name), industry = COALESCE($2, industry),
        email = $3, phone = $4, address = $5, city = $6,
        website = $7, employees = $8, description = $9, logo_url = $10,
        updated_at = CURRENT_TIMESTAMP
       WHERE business_id = $11 RETURNING *`,
      [name, industry, email, phone, address, city, website, employees, description, logo_url, req.user.business_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë përditësimit.' });
  }
});


// ── CSV Import API ─────────────────────────────────────────────────────────
const multer = require('multer');
const csv    = require('csv-parser');
const fs     = require('fs');

const upload = multer({ dest: 'uploads/' });

// Import Transactions nga CSV
// Kolonat e pritshme: amount, transaction_date
app.post('/api/import/transactions', authMiddleware, adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nuk u ngarkua asnjë file.' });

  const rows = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      const amount = parseFloat(row.amount || row.Amount || row.AMOUNT);
      const date   = row.transaction_date || row.date || row.Date || row.DATE;

      if (isNaN(amount) || !date) {
        errors.push(`Rresht i pavlefshëm: ${JSON.stringify(row)}`);
      } else {
        rows.push([req.user.business_id, req.user.user_id, amount, date]);
      }
    })
    .on('end', async () => {
      fs.unlinkSync(req.file.path); // Fshi file-n e përkohshme

      if (rows.length === 0) {
        return res.status(400).json({ error: 'Nuk u gjetën të dhëna të vlefshme.', errors });
      }

      try {
        const client = await pool.connect();
        let inserted = 0;
        try {
          await client.query('BEGIN');
          for (const row of rows) {
            await client.query(
              'INSERT INTO transactions (business_id, user_id, amount, transaction_date) VALUES ($1, $2, $3, $4)',
              row
            );
            inserted++;
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        res.json({ message: `U importuan ${inserted} transaksione me sukses!`, inserted, errors });
      } catch (err) {
        console.error('CSV import transactions gabim:', err.message);
        res.status(500).json({ error: 'Gabim gjatë importimit.' });
      }
    })
    .on('error', (err) => {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Gabim gjatë leximit të CSV.' });
    });
});

// Import Inventory nga CSV
// Kolonat e pritshme: product_name, quantity
app.post('/api/import/inventory', authMiddleware, adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nuk u ngarkua asnjë file.' });

  const rows = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      const product  = row.product_name || row.product || row.Product || row.PRODUCT;
      const quantity = parseInt(row.quantity || row.Quantity || row.QUANTITY);

      if (!product || isNaN(quantity)) {
        errors.push(`Rresht i pavlefshëm: ${JSON.stringify(row)}`);
      } else {
        rows.push([req.user.business_id, product, quantity]);
      }
    })
    .on('end', async () => {
      fs.unlinkSync(req.file.path);

      if (rows.length === 0) {
        return res.status(400).json({ error: 'Nuk u gjetën të dhëna të vlefshme.', errors });
      }

      try {
        const client = await pool.connect();
        let inserted = 0;
        try {
          await client.query('BEGIN');
          for (const row of rows) {
            // Nëse produkti ekziston, përditëso; ndryshe shto të ri
            await client.query(
              `INSERT INTO inventory (business_id, product_name, quantity)
               VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING`,
              row
            );
            inserted++;
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        res.json({ message: `U importuan ${inserted} produkte me sukses!`, inserted, errors });
      } catch (err) {
        console.error('CSV import inventory gabim:', err.message);
        res.status(500).json({ error: 'Gabim gjatë importimit.' });
      }
    });
});

app.listen(port, () => {
  console.log(`Server running → http://localhost:${port}`);
});

// ── Activity Logs API (MongoDB) ────────────────────────────────────────────
// Merr logs e aktivitetit për biznesin
app.get('/api/logs', authMiddleware, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ business_id: req.user.business_id })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    console.error('Logs gabim:', err.message);
    res.status(500).json({ error: 'Gabim gjatë marrjes së logs.' });
  }
});

// ── ML API Proxy ───────────────────────────────────────────────────────────
// Node.js i kalon kërkesat ML te Flask API (port 5000)
const http = require('http');

app.post('/api/ml/:model', authMiddleware, (req, res) => {
  const model      = req.params.model; // prophet ose lstm
  const postData   = JSON.stringify({
    ...req.body,
    business_id: req.user.business_id
  });

  const options = {
    hostname: 'localhost',
    port:     5000,
    path:     `/ml/${model}`,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch {
        res.status(500).json({ error: 'Gabim në ML API.' });
      }
    });
  });

  proxyReq.on('error', () => {
    res.status(503).json({ error: 'ML API nuk është e disponueshme.' });
  });

  proxyReq.write(postData);
  proxyReq.end();
});

// ── KPI Definitions API ────────────────────────────────────────────────────
app.get('/api/kpis', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM kpi_definitions WHERE business_id = $1 ORDER BY created_at',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së KPI-ve.' });
  }
});

app.post('/api/kpis', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, formula } = req.body;
  if (!name) return res.status(400).json({ error: 'Emri është i detyrueshëm.' });
  try {
    const result = await pool.query(
      'INSERT INTO kpi_definitions (business_id, name, description, formula) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.business_id, name, description, formula]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë shtimit.' });
  }
});

app.delete('/api/kpis/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM kpi_definitions WHERE kpi_id = $1 AND business_id = $2 RETURNING kpi_id',
      [req.params.id, req.user.business_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'KPI nuk u gjet.' });
    res.json({ message: 'KPI u fshi.' });
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë fshirjes.' });
  }
});

// ── Model Runs History API ─────────────────────────────────────────────────
app.get('/api/model-runs', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mr.run_id, mr.status, mr.run_date,
             k.name AS kpi_name,
             COUNT(f.forecast_id) AS forecast_count
      FROM model_runs mr
      JOIN kpi_definitions k ON mr.kpi_id = k.kpi_id
      LEFT JOIN forecasts f ON f.run_id = mr.run_id
      WHERE mr.business_id = $1
      GROUP BY mr.run_id, mr.status, mr.run_date, k.name
      ORDER BY mr.run_date DESC
      LIMIT 20
    `, [req.user.business_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së historikut.' });
  }
});

// ── Change Password API ────────────────────────────────────────────────────
app.put('/api/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Të dyja fushat janë të detyrueshme.' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Fjalëkalimi i ri duhet të ketë së paku 6 karaktere.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [req.user.user_id]);
    const user = result.rows[0];
    let valid = false;
    if (user.password_hash.startsWith('$2')) {
      valid = await bcrypt.compare(current_password, user.password_hash);
    } else {
      valid = current_password === user.password_hash;
    }
    if (!valid) return res.status(401).json({ error: 'Fjalëkalimi aktual është i gabuar.' });
    const new_hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [new_hash, req.user.user_id]);
    res.json({ message: 'Fjalëkalimi u ndryshua me sukses.' });
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë ndryshimit të fjalëkalimit.' });
  }
});