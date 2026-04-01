import axios from 'axios'

function getEnvValue(key) {
  const value = import.meta.env[key]
  return value && value !== 'undefined' ? String(value).trim() : undefined
}

const buildTimeAuthUrl = getEnvValue('VITE_AUTH_URL') || getEnvValue('VITE_AUTH_BASE_URL')
const runtimeAuthUrl = typeof window !== 'undefined'
  ? window.__RUNTIME_ENV__?.VITE_AUTH_URL || window.__RUNTIME_ENV__?.VITE_AUTH_BASE_URL
  : undefined

const AUTH_BASE_URL = buildTimeAuthUrl || runtimeAuthUrl

if (!AUTH_BASE_URL) {
  if (import.meta.env.DEV) {
    console.warn('VITE_AUTH_URL is not set; using local dev proxy /auth')
  } else {
    throw new Error('Missing VITE_AUTH_URL or VITE_AUTH_BASE_URL in production. Set the auth backend URL in your frontend environment.')
  }
}

const authClient = axios.create({ baseURL: AUTH_BASE_URL || '/auth' })

export async function loginUser(email, password) {
  const res = await authClient.post('/login', { email, password })
  return res.data
}

export async function registerUser(payload) {
  const res = await authClient.post('/register', payload)
  return res.data
}
