const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectRabbitMQ } = require('./mq');
const db = require('./db');
const analyticsRoutes = require('./routes/analytics');

const createIncidentEventsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS incident_events (
      incident_id INTEGER PRIMARY KEY,
      incident_type VARCHAR(100),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      created_at TIMESTAMP WITH TIME ZONE,
      assigned_unit_id INTEGER,
      assigned_unit_type VARCHAR(100),
      dispatched_at TIMESTAMP WITH TIME ZONE,
      resolved_at TIMESTAMP WITH TIME ZONE,
      response_time_seconds DOUBLE PRECISION,
      resolution_time_seconds DOUBLE PRECISION
    );
  `;
  await db.query(createTableQuery);
};

const seedSampleIncidentEvents = async () => {
  const { rows } = await db.query('SELECT COUNT(*) FROM incident_events');
  if (rows[0].count === '0') {
    const now = new Date();
    const events = [
      {
        incident_id: 1,
        incident_type: 'Medical',
        latitude: 5.6037,
        longitude: -0.1870,
        created_at: new Date(now.getTime() - 18 * 60000).toISOString(),
        assigned_unit_id: 3,
        assigned_unit_type: 'Hospital',
        dispatched_at: new Date(now.getTime() - 15 * 60000).toISOString(),
        resolved_at: new Date(now.getTime() - 5 * 60000).toISOString(),
        response_time_seconds: 180,
        resolution_time_seconds: 780,
      },
      {
        incident_id: 2,
        incident_type: 'Fire',
        latitude: 5.6148,
        longitude: -0.2050,
        created_at: new Date(now.getTime() - 30 * 60000).toISOString(),
        assigned_unit_id: 2,
        assigned_unit_type: 'Fire',
        dispatched_at: new Date(now.getTime() - 27 * 60000).toISOString(),
        resolved_at: new Date(now.getTime() - 10 * 60000).toISOString(),
        response_time_seconds: 180,
        resolution_time_seconds: 1200,
      },
      {
        incident_id: 3,
        incident_type: 'Police',
        latitude: 5.6200,
        longitude: -0.1900,
        created_at: new Date(now.getTime() - 45 * 60000).toISOString(),
        assigned_unit_id: 1,
        assigned_unit_type: 'Police',
        dispatched_at: new Date(now.getTime() - 42 * 60000).toISOString(),
        resolved_at: new Date(now.getTime() - 20 * 60000).toISOString(),
        response_time_seconds: 180,
        resolution_time_seconds: 1500,
      },
    ];

    for (const event of events) {
      await db.query(
        `INSERT INTO incident_events (
          incident_id, incident_type, latitude, longitude, created_at,
          assigned_unit_id, assigned_unit_type, dispatched_at, resolved_at,
          response_time_seconds, resolution_time_seconds
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (incident_id) DO NOTHING`,
        [
          event.incident_id,
          event.incident_type,
          event.latitude,
          event.longitude,
          event.created_at,
          event.assigned_unit_id,
          event.assigned_unit_type,
          event.dispatched_at,
          event.resolved_at,
          event.response_time_seconds,
          event.resolution_time_seconds,
        ]
      );
    }
    console.log('Analytics service: seeded default incident events');
  } else {
    console.log('Analytics service: event data already seeded');
  }
};

async function handleIncidentEvent(e) {
  const { eventType, incidentId } = e;

  if (eventType === 'incident.created') {
    await db.query(
      `INSERT INTO incident_events (incident_id, incident_type, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (incident_id) DO UPDATE SET
         incident_type = EXCLUDED.incident_type,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         created_at = EXCLUDED.created_at`,
      [incidentId, e.incidentType, e.latitude, e.longitude, e.createdAt]
    );
    console.log(`Stored incident.created for ${incidentId}`);

  } else if (eventType === 'incident.dispatched') {
    await db.query(
      `UPDATE incident_events
       SET assigned_unit_id = $1,
           assigned_unit_type = $2,
           dispatched_at = $3,
           response_time_seconds = EXTRACT(EPOCH FROM ($3::timestamptz - created_at))
       WHERE incident_id = $4`,
      [e.assignedUnitId, e.assignedUnitType, e.dispatchedAt, incidentId]
    );
    console.log(`Stored incident.dispatched for ${incidentId}`);

  } else if (eventType === 'incident.resolved') {
    await db.query(
      `UPDATE incident_events
       SET resolved_at = $1,
           resolution_time_seconds = EXTRACT(EPOCH FROM ($1::timestamptz - created_at))
       WHERE incident_id = $2`,
      [e.resolvedAt, incidentId]
    );
    console.log(`Stored incident.resolved for ${incidentId}`);
  }
}

async function start() {
  await createIncidentEventsTable();
  await seedSampleIncidentEvents();
  const ch = await connectRabbitMQ();

  const q = 'analytics-incident-events';
  await ch.assertQueue(q, { durable: true });
  await ch.bindQueue(q, 'emergency.platform.events', 'incident.*');

  ch.consume(q, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      console.log(`Received event: ${event.eventType}`);
      await handleIncidentEvent(event);
      ch.ack(msg);
    } catch (err) {
      console.error('Error handling event', err);
      ch.ack(msg);
    }
  });

  console.log('Listening for incident events on RabbitMQ...');

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

  app.use('/analytics', analyticsRoutes);
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  const PORT = process.env.PORT || 4004;
  app.listen(PORT, () => {
    console.log(`Analytics service running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start analytics service', err);
  process.exit(1);
});
