import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-base)',
        fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem',
      }}>
        Authenticating…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role?.toLowerCase())) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
