const express = require('express');
const router = express.Router();
const db = require('../db');

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /responders - register a responder
router.post('/', async (req, res) => {
  try {
    const { name, type, latitude, longitude, organization_id } = req.body;
    const result = await db.query(
      `INSERT INTO responders (name, type, latitude, longitude, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type, latitude, longitude, organization_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /responders - list all
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM responders');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /responders/nearest?lat=&lon=&type=
router.get('/nearest', async (req, res) => {
  try {
    const { lat, lon, type } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const result = await db.query(
      `SELECT * FROM responders WHERE status = 'AVAILABLE' ${type ? "AND type = $1" : ""}`,
      type ? [type] : []
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No available responders found' });
    }

    // Find nearest using Haversine
    let nearest = null;
    let minDist = Infinity;
    for (const r of result.rows) {
      const dist = haversineDistance(
        parseFloat(lat), parseFloat(lon),
        parseFloat(r.latitude), parseFloat(r.longitude)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = r;
      }
    }

    res.json({
      unitId: nearest.responder_id,
      unitType: nearest.type,
      name: nearest.name,
      distanceMeters: Math.round(minDist),
      latitude: nearest.latitude,
      longitude: nearest.longitude,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /responders/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      `UPDATE responders SET status = $1 WHERE responder_id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;