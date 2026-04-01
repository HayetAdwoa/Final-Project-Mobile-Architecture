const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const responderRoutes = require('./routes/responders');

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
app.use('/responders', responderRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const createRespondersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS responders (
      responder_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      organization_id INTEGER,
      status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;
  await db.query(createTableQuery);
};

const PORT = process.env.PORT || 4005;

const start = async () => {
  try {
    await createRespondersTable();
    app.listen(PORT, () => {
      console.log(`Responder service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize responder service database:', err);
    process.exit(1);
  }
};

start();

