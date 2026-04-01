import axios from 'axios'

const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || '/auth',
})

export async function loginUser(email, password) {
  const res = await authClient.post('/login', { email, password })
  return res.data
}

export async function registerUser(payload) {
  const res = await authClient.post('/register', payload)
  return res.data
}
