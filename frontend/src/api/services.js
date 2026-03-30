import axios from 'axios'

// All URLs are relative — Vite proxy in vite.config.js routes them to correct ports
function authHeader() {
  const token = localStorage.getItem('nerdcp_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Analytics ────────────────────────────────────────────────
export async function getAnalyticsSummary() {
  const res = await axios.get(`/analytics/summary`, { headers: authHeader() })
  return res.data
}

export async function getIncidentsByType() {
  const res = await axios.get(`/analytics/incidents-by-type`, { headers: authHeader() })
  return res.data
}

export async function getResponseTimes() {
  const res = await axios.get(`/analytics/response-times`, { headers: authHeader() })
  return res.data
}

export async function getResourceUtilization() {
  const res = await axios.get(`/analytics/resource-utilization`, { headers: authHeader() })
  return res.data
}

// ── Responders ───────────────────────────────────────────────
export async function getNearestResponders(lat, lng, type) {
  const res = await axios.get(`/responders/nearest`, {
    headers: authHeader(),
    params: { lat, lon: lng, type }
  })
  return res.data
}

export async function getAllResponders() {
  const res = await axios.get(`/responders`, { headers: authHeader() })
  return res.data
}

export async function getResponderById(id) {
  const res = await axios.get(`/responders/${id}`, { headers: authHeader() })
  return res.data
}

// ── Dispatch ─────────────────────────────────────────────────
export async function getActiveDispatches() {
  const res = await axios.get(`/dispatch/active`, { headers: authHeader() })
  return res.data
}
