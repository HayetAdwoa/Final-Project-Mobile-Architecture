const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const { publishEvent } = require('../mq');

const RESPONDER_SERVICE_URL = process.env.RESPONDER_SERVICE_URL;

// POST /incidents - create new incident
router.post('/', async (req, res) => {
  try {
    const {
      citizen_name,
      citizen_phone,
      incident_type,
      latitude,
      longitude,
      location_description,
      notes,
      created_by,
    } = req.body;

    // 1. Create incident
    const result = await db.query(
      `INSERT INTO incidents (
         citizen_name, citizen_phone, incident_type,
         latitude, longitude, location_description,
         notes, created_by, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'CREATED')
       RETURNING *`,
      [citizen_name, citizen_phone, incident_type,
       latitude, longitude, location_description,
       notes, created_by]
    );
    const incident = result.rows[0];

    // 2. Find nearest responder
    const resp = await axios.get(
      `${RESPONDER_SERVICE_URL}/responders/nearest`,
      { params: { lat: latitude, lon: longitude, type: incident_type } }
    );
    const assigned = resp.data;

    // 3. Update incident to DISPATCHED
    const updateRes = await db.query(
      `UPDATE incidents
       SET assigned_unit_id = $1,
           assigned_unit_type = $2,
           status = 'DISPATCHED',
           dispatched_at = NOW()
       WHERE incident_id = $3
       RETURNING *`,
      [assigned.unitId, assigned.unitType, incident.incident_id]
    );
    const updated = updateRes.rows[0];

    // 4. Publish events to RabbitMQ
    await publishEvent('incident.created', {
      eventType: 'incident.created',
      incidentId: updated.incident_id,
      incidentType: updated.incident_type,
      latitude: updated.latitude,
      longitude: updated.longitude,
      createdBy: updated.created_by,
      createdAt: updated.created_at,
    });

    await publishEvent('incident.dispatched', {
      eventType: 'incident.dispatched',
      incidentId: updated.incident_id,
      assignedUnitId: updated.assigned_unit_id,
      assignedUnitType: updated.assigned_unit_type,
      dispatchedAt: updated.dispatched_at,
    });

    res.status(201).json(updated);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /incidents - list all
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM incidents ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /incidents/:id - get one
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM incidents WHERE incident_id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /incidents/:id/status - update status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const extra = status === 'RESOLVED' ? ', resolved_at = NOW()' : '';
    const result = await db.query(
      `UPDATE incidents SET status = $1 ${extra} WHERE incident_id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (status === 'RESOLVED') {
      await publishEvent('incident.resolved', {
        eventType: 'incident.resolved',
        incidentId: req.params.id,
        resolvedAt: result.rows[0].resolved_at,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;