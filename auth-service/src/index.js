const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors({
  origin: ['https://demo-frontend-busc.onrender.com', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
