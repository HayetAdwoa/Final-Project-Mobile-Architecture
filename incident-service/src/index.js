const express = require('express');
const cors = require('cors');
require('dotenv').config();

const incidentRoutes = require('./routes/incidents');
const { connectRabbitMQ } = require('./mq');

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
app.options('/*', cors(corsOptions));
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
