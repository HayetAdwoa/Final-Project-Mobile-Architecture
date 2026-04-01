import axios from 'axios'

const rawAuthUrl = import.meta.env.VITE_AUTH_URL
const AUTH_BASE_URL = rawAuthUrl && rawAuthUrl !== 'undefined' ? rawAuthUrl : '/auth'
const authClient = axios.create({ baseURL: AUTH_BASE_URL })

export async function loginUser(email, password) {
  const res = await authClient.post('/login', { email, password })
  return res.data
}

export async function registerUser(payload) {
  const res = await authClient.post('/register', payload)
  return res.data
}
