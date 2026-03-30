import axios from 'axios'

// Use relative URLs so Vite proxy forwards to correct service
// Proxy config in vite.config.js handles the port routing
const BASE = ''

function authHeader() {
  const token = localStorage.getItem('nerdcp_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function createIncident(payload) {
  const res = await axios.post(`/incidents`, payload, {
    headers: authHeader()
  })
  return res.data
}

export async function getIncidents(params = {}) {
  const res = await axios.get(`/incidents`, {
    headers: authHeader(),
    params
  })
  return res.data
}

export async function getIncidentById(id) {
  const res = await axios.get(`/incidents/${id}`, {
    headers: authHeader()
  })
  return res.data
}

export async function updateIncidentStatus(id, status) {
  const res = await axios.put(`/incidents/${id}/status`, { status }, {
    headers: authHeader()
  })
  return res.data
}

export async function dispatchIncident(id) {
  const res = await axios.post(`/incidents/${id}/dispatch`, {}, {
    headers: authHeader()
  })
  return res.data
}
