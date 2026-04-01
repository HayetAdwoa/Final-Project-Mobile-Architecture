import axios from 'axios'

function getEnvValue(key) {
  const value = import.meta.env[key]
  return value && value !== 'undefined' ? String(value).trim() : undefined
}

const buildTimeIncidentUrl = getEnvValue('VITE_INCIDENT_URL')
const runtimeIncidentUrl = typeof window !== 'undefined'
  ? window.__RUNTIME_ENV__?.VITE_INCIDENT_URL
  : undefined
const INCIDENT_BASE_URL = buildTimeIncidentUrl || runtimeIncidentUrl

if (!INCIDENT_BASE_URL && !import.meta.env.DEV) {
  throw new Error('Missing VITE_INCIDENT_URL in production. Set the incident backend URL in your frontend environment.')
}

const incidentClient = axios.create({ baseURL: INCIDENT_BASE_URL ? `${INCIDENT_BASE_URL}/incidents` : '/incidents' })

function authHeader() {
  const token = localStorage.getItem('nerdcp_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function createIncident(payload) {
  const res = await incidentClient.post('/', payload, {
    headers: authHeader()
  })
  return res.data
}

export async function getIncidents(params = {}) {
  const res = await incidentClient.get('/', {
    headers: authHeader(),
    params
  })
  return res.data
}

export async function getIncidentById(id) {
  const res = await incidentClient.get(`/${id}`, {
    headers: authHeader()
  })
  return res.data
}

export async function updateIncidentStatus(id, status) {
  const res = await incidentClient.put(`/${id}/status`, { status }, {
    headers: authHeader()
  })
  return res.data
}

export async function dispatchIncident(id) {
  const res = await incidentClient.post(`/${id}/dispatch`, {}, {
    headers: authHeader()
  })
  return res.data
}
