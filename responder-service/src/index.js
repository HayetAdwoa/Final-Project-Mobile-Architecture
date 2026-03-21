const express = require('express');
const cors = require('cors');
require('dotenv').config();

const responderRoutes = require('./routes/responders');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/responders', responderRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`Responder service running on port ${PORT}`);
});