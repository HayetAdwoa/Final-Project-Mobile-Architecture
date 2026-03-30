import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(() => localStorage.getItem('nerdcp_token'))
  const [loading, setLoading] = useState(true)

  // Parse JWT payload to extract user info
  const parseJwt = (t) => {
    try {
      return JSON.parse(atob(t.split('.')[1]))
    } catch { return null }
  }

  useEffect(() => {
    if (token) {
      const payload = parseJwt(token)
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser(payload)
      } else {
        // Expired
        localStorage.removeItem('nerdcp_token')
        setToken(null)
      }
    }
    setLoading(false)
  }, [token])

  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password)
    const newToken = data.token || data.accessToken
    localStorage.setItem('nerdcp_token', newToken)
    setToken(newToken)
    setUser(parseJwt(newToken))
    return parseJwt(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nerdcp_token')
    setToken(null)
    setUser(null)
  }, [])

  const isRole = useCallback((...roles) => {
    return user && roles.includes(user.role?.toLowerCase())
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
