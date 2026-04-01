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

const seedDefaultIncidents = async () => {
  const { rows } = await db.query('SELECT COUNT(*) FROM incidents');
  if (rows[0].count === '0') {
    const incidents = [
      {
        citizen_name: 'John Doe',
        citizen_phone: '+233501234567',
        incident_type: 'Medical',
        latitude: 5.6037,
        longitude: -0.1870,
        location_description: 'Accra Central',
        notes: 'Found unconscious near the market.',
        created_by: 'hospital@nerdcp.gh',
        assigned_unit_id: 1,
        assigned_unit_type: 'Hospital',
        status: 'DISPATCHED',
        dispatched_at: new Date().toISOString(),
      },
      {
        citizen_name: 'Jane Smith',
        citizen_phone: '+233502345678',
        incident_type: 'Fire',
        latitude: 5.6148,
        longitude: -0.2050,
        location_description: 'Kumasi Road',
        notes: 'Kitchen fire at residential unit.',
        created_by: 'fire@nerdcp.gh',
        assigned_unit_id: 2,
        assigned_unit_type: 'Fire',
        status: 'CREATED',
      },
    ];

    for (const incident of incidents) {
      await db.query(
        `INSERT INTO incidents (
           citizen_name, citizen_phone, incident_type, latitude, longitude,
           location_description, notes, created_by, assigned_unit_id,
           assigned_unit_type, status, dispatched_at, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          incident.citizen_name,
          incident.citizen_phone,
          incident.incident_type,
          incident.latitude,
          incident.longitude,
          incident.location_description,
          incident.notes,
          incident.created_by,
          incident.assigned_unit_id,
          incident.assigned_unit_type,
          incident.status,
          incident.dispatched_at || null,
        ]
      );
    }
    console.log('Incident service: seeded default incidents');
  } else {
    console.log('Incident service: incidents already seeded');
  }
};

async function start() {
  await createIncidentsTable();
  await seedDefaultIncidents();
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
