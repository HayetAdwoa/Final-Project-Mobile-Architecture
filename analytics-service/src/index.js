const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectRabbitMQ } = require('./mq');
const db = require('./db');
const analyticsRoutes = require('./routes/analytics');

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
