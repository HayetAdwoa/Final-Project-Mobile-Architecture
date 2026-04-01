const express = require('express');
const cors = require('cors');
require('dotenv').config();

const incidentRoutes = require('./routes/incidents');
const { connectRabbitMQ } = require('./mq');
const db = require('./db');

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
app.use('/incidents', incidentRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const createIncidentsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS incidents (
      incident_id SERIAL PRIMARY KEY,
      citizen_name VARCHAR(255),
      citizen_phone VARCHAR(100),
      incident_type VARCHAR(100),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      location_description TEXT,
      notes TEXT,
      created_by VARCHAR(255),
      assigned_unit_id INTEGER,
      assigned_unit_type VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
      dispatched_at TIMESTAMP WITH TIME ZONE,
      resolved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;
  await db.query(createTableQuery);
};

async function start() {
  await createIncidentsTable();
  await connectRabbitMQ();

  const PORT = process.env.PORT || 4002;
  app.listen(PORT, () => {
    console.log(`Incident service running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start incident service', err);
  process.exit(1);
});
