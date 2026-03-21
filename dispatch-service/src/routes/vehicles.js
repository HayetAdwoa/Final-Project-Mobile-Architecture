const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const VehicleLocation = require('../models/VehicleLocation');
const { publishEvent } = require('../mq');

// POST /vehicles/register
router.post('/register', async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /vehicles/:id/location
router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { incident_id, latitude, longitude, accuracy_meters } = req.body;

    const loc = new VehicleLocation({
      vehicle_id: id,
      incident_id,
      latitude,
      longitude,
      accuracy_meters,
    });
    await loc.save();

    const payload = {
      eventType: 'location.updated',
      vehicleId: id,
      incidentId: incident_id,
      latitude,
      longitude,
      accuracyMeters: accuracy_meters,
      recordedAt: loc.recorded_at,
    };

    await publishEvent('location.updated', payload);

    if (incident_id && global.broadcastLocationUpdate) {
      global.broadcastLocationUpdate(incident_id, payload);
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /vehicles/:id/location
router.get('/:id/location', async (req, res) => {
  try {
    const locations = await VehicleLocation.find({ vehicle_id: req.params.id })
      .sort({ recorded_at: -1 })
      .limit(20);
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;