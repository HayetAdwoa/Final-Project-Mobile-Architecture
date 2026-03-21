const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.MONGO_DB || 'dispatchdb',
  });
  console.log('Connected to MongoDB');
}

module.exports = { connectMongo, mongoose };