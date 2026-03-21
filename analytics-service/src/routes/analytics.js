const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /analytics/response-times
router.get('/response-times', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT incident_type,
              COUNT(*) as total,
              ROUND(AVG(response_time_seconds)) as avg_response_seconds,
              MIN(response_time_seconds) as min_response_seconds,
              MAX(response_time_seconds) as max_response_seconds
       FROM incident_events
       WHERE response_time_seconds IS NOT NULL
       GROUP BY incident_type`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/incidents-by-type
router.get('/incidents-by-type', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT incident_type, COUNT(*) as total
       FROM incident_events
       GROUP BY incident_type
       ORDER BY total DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/resource-utilization
router.get('/resource-utilization', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT assigned_unit_type,
              COUNT(*) as total_assignments,
              COUNT(resolved_at) as total_resolved,
              ROUND(AVG(resolution_time_seconds)) as avg_resolution_seconds
       FROM incident_events
       WHERE assigned_unit_type IS NOT NULL
       GROUP BY assigned_unit_type`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        COUNT(*) as total_incidents,
        COUNT(dispatched_at) as total_dispatched,
        COUNT(resolved_at) as total_resolved,
        ROUND(AVG(response_time_seconds)) as avg_response_seconds
       FROM incident_events`
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;