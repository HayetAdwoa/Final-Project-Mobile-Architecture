const { mongoose } = require('../db');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true, unique: true },
  vehicle_type: { type: String, enum: ['AMBULANCE', 'POLICE_CAR', 'FIRE_TRUCK'], required: true },
  registration_plate: String,
  organization_id: String,
  driver_user_id: String,
  status: { type: String, enum: ['AVAILABLE', 'DISPATCHED', 'RETURNING', 'OFFLINE'], default: 'AVAILABLE' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);