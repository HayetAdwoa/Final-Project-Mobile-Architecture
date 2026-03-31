const express = require('express');
const cors = require('cors');
require('dotenv').config();

const incidentRoutes = require('./routes/incidents');
const { connectRabbitMQ } = require('./mq');

const app = express();
app.use(cors({
  origin: ['https://demo-frontend-busc.onrender.com', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json());

app.use('/incidents', incidentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4002;

async function start() {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Incident service running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start incident service', err);
  process.exit(1);
});
