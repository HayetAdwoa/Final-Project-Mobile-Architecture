const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [frontendUrl, 'http://localhost:5173'].filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/auth', authRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      organization_id INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE
    );
  `;

  await db.query(createTableQuery);
};

const seedDefaultUsers = async () => {
  const { rows } = await db.query('SELECT COUNT(*) FROM users');
  if (rows[0].count === '0') {
    const users = [
      { name: 'Admin', email: 'admin@nerdcp.gh', password: 'admin123', role: 'Admin' },
      { name: 'Police', email: 'police@nerdcp.gh', password: 'police123', role: 'Police' },
      { name: 'Fire', email: 'fire@nerdcp.gh', password: 'fire123', role: 'Fire' },
      { name: 'Hospital', email: 'hospital@nerdcp.gh', password: 'hospital123', role: 'Hospital' },
    ];

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await db.query(
        `INSERT INTO users (name, email, password_hash, role, organization_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hash, user.role, null]
      );
    }
    console.log('Auth service: seeded default users');
  } else {
    console.log('Auth service: users already seeded');
  }
};

const PORT = process.env.PORT || 4001;
const startServer = async () => {
  try {
    await createUsersTable();
    await seedDefaultUsers();
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize auth service database:', err);
    process.exit(1);
  }
};

startServer();

