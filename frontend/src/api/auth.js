import axios from 'axios'

export async function loginUser(email, password) {
  const res = await axios.post(`/auth/login`, { email, password })
  return res.data
}

export async function registerUser(payload) {
  const res = await axios.post(`/auth/register`, payload)
  return res.data
}
