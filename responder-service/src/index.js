const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
app.options('/*', cors(corsOptions));
app.use(express.json());

app.use('/responders', responderRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`Responder service running on port ${PORT}`);
});
