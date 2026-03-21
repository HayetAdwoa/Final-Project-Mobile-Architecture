const { mongoose } = require('../db');

const vehicleLocationSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true },
  incident_id: { type: String },
  latitude: Number,
  longitude: Number,
  accuracy_meters: Number,
  recorded_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VehicleLocation', vehicleLocationSchema);