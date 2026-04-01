const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const { connectMongo } = require('./db');
const { connectRabbitMQ } = require('./mq');
const vehicleRoutes = require('./routes/vehicles');

async function start() {
  await connectMongo();
  await connectRabbitMQ();

  const app = express();
  app.use(cors({
  origin: ['https://demo-frontend-busc.onrender.com', 'http://localhost:5173'],
  credentials: true
}))
  app.use(express.json());

  app.use('/vehicles', vehicleRoutes);
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  const server = http.createServer(app);

  // WebSocket server for real-time tracking
  const wss = new WebSocket.Server({ server, path: '/ws/track' });
  const subscribers = new Map();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const incidentId = url.searchParams.get('incidentId');

    if (!incidentId) { ws.close(); return; }

    if (!subscribers.has(incidentId)) {
      subscribers.set(incidentId, new Set());
    }
    subscribers.get(incidentId).add(ws);
    console.log(`Client subscribed to incident ${incidentId}`);

    ws.on('close', () => {
      subscribers.get(incidentId)?.delete(ws);
    });
  });

  global.broadcastLocationUpdate = (incidentId, payload) => {
    const subs = subscribers.get(incidentId);
    if (!subs) return;
    const msg = JSON.stringify(payload);
    for (const ws of subs) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  };

  const PORT = process.env.PORT || 4003;
  server.listen(PORT, () => {
    console.log(`Dispatch service running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start dispatch service', err);
  process.exit(1);
});
