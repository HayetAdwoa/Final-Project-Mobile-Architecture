import axios from 'axios'

function getEnvValue(key) {
  const value = import.meta.env[key]
  return value && value !== 'undefined' ? String(value).trim() : undefined
}

const buildTimeAnalyticsUrl = getEnvValue('VITE_ANALYTICS_URL')
const buildTimeResponderUrl = getEnvValue('VITE_RESPONDER_URL')
const buildTimeDispatchUrl = getEnvValue('VITE_DISPATCH_URL')

const runtimeAnalyticsUrl = typeof window !== 'undefined'
  ? window.__RUNTIME_ENV__?.VITE_ANALYTICS_URL
  : undefined
const runtimeResponderUrl = typeof window !== 'undefined'
  ? window.__RUNTIME_ENV__?.VITE_RESPONDER_URL
  : undefined
const runtimeDispatchUrl = typeof window !== 'undefined'
  ? window.__RUNTIME_ENV__?.VITE_DISPATCH_URL
  : undefined

const ANALYTICS_BASE_URL = buildTimeAnalyticsUrl || runtimeAnalyticsUrl
const RESPONDER_BASE_URL = buildTimeResponderUrl || runtimeResponderUrl
const DISPATCH_BASE_URL = buildTimeDispatchUrl || runtimeDispatchUrl

if (!ANALYTICS_BASE_URL && !import.meta.env.DEV) {
  throw new Error('Missing VITE_ANALYTICS_URL in production. Set the analytics backend URL in your frontend environment.')
}

if (!RESPONDER_BASE_URL && !import.meta.env.DEV) {
  throw new Error('Missing VITE_RESPONDER_URL in production. Set the responder backend URL in your frontend environment.')
}

if (!DISPATCH_BASE_URL && !import.meta.env.DEV) {
  throw new Error('Missing VITE_DISPATCH_URL in production. Set the dispatch backend URL in your frontend environment.')
}

const analyticsClient = axios.create({ baseURL: ANALYTICS_BASE_URL ? `${ANALYTICS_BASE_URL}/analytics` : '/analytics' })
const responderClient = axios.create({ baseURL: RESPONDER_BASE_URL ? `${RESPONDER_BASE_URL}/responders` : '/responders' })
const dispatchClient = axios.create({ baseURL: DISPATCH_BASE_URL ? `${DISPATCH_BASE_URL}/dispatch` : '/dispatch' })

function authHeader() {
  const token = localStorage.getItem('nerdcp_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Analytics ────────────────────────────────────────────────
export async function getAnalyticsSummary() {
  const res = await analyticsClient.get(`/summary`, { headers: authHeader() })
  return res.data
}

export async function getIncidentsByType() {
  const res = await analyticsClient.get(`/incidents-by-type`, { headers: authHeader() })
  return res.data
}

export async function getResponseTimes() {
  const res = await analyticsClient.get(`/response-times`, { headers: authHeader() })
  return res.data
}

export async function getResourceUtilization() {
  const res = await analyticsClient.get(`/resource-utilization`, { headers: authHeader() })
  return res.data
}

// ── Responders ───────────────────────────────────────────────
export async function getNearestResponders(lat, lng, type) {
  const res = await responderClient.get(`/nearest`, {
    headers: authHeader(),
    params: { lat, lon: lng, type }
  })
  return res.data
}

export async function getAllResponders() {
  const res = await responderClient.get(`/`, { headers: authHeader() })
  return res.data
}

export async function getResponderById(id) {
  const res = await responderClient.get(`/${id}`, { headers: authHeader() })
  return res.data
}

// ── Dispatch ─────────────────────────────────────────────────
export async function getActiveDispatches() {
  const res = await dispatchClient.get(`/active`, { headers: authHeader() })
  return res.data
}
