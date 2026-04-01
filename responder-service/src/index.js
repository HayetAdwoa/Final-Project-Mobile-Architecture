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

const seedDefaultResponders = async () => {
  const { rows } = await db.query('SELECT COUNT(*) FROM responders');
  if (rows[0].count === '0') {
    const responders = [
      { name: 'Police Unit 1', type: 'Police', latitude: 5.6037, longitude: -0.1870, organization_id: 1 },
      { name: 'Fire Truck 7', type: 'Fire', latitude: 5.6148, longitude: -0.2050, organization_id: 2 },
      { name: 'Hospital EMS 3', type: 'Hospital', latitude: 5.6248, longitude: -0.1990, organization_id: 3 },
    ];

    for (const responder of responders) {
      await db.query(
        `INSERT INTO responders (name, type, latitude, longitude, organization_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [responder.name, responder.type, responder.latitude, responder.longitude, responder.organization_id]
      );
    }
    console.log('Responder service: seeded default responders');
  } else {
    console.log('Responder service: responders already seeded');
  }
};

const PORT = process.env.PORT || 4005;

const start = async () => {
  try {
    await createRespondersTable();
    await seedDefaultResponders();
    app.listen(PORT, () => {
      console.log(`Responder service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize responder service database:', err);
    process.exit(1);
  }
};

start();

