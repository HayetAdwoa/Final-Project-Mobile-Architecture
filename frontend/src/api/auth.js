import axios from 'axios'

const AUTH_URL = import.meta.env.VITE_AUTH_URL

export async function loginUser(email, password) {
  const res = await axios.post(`${AUTH_URL}/auth/login`, { email, password })
  return res.data
}

export async function registerUser(payload) {
  const res = await axios.post(`${AUTH_URL}/auth/register`, payload)
  return res.data
}
