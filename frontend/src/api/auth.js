import axios from 'axios'

const AUTH_URL = import.meta.env.VITE_AUTH_URL // from your .env

export async function loginUser(email, password) {
  try {
    const res = await axios.post(`${AUTH_URL}/auth/login`, { email, password })
    return res.data
  } catch (err) {
    // Axios errors: err.response.data may have backend message
    if (err.response && err.response.data && err.response.data.message) {
      throw new Error(err.response.data.message)
    }
    // Fallback generic message
    throw new Error('Login failed. Please check your credentials and try again.')
  }
}

export async function registerUser(payload) {
  try {
    const res = await axios.post(`${AUTH_URL}/auth/register`, payload)
    return res.data
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      throw new Error(err.response.data.message)
    }
    throw new Error('Registration failed. Please try again.')
  }
}
