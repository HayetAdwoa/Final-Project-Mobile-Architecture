import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Bell, Clock } from 'lucide-react'

const PAGE_TITLES = {
  '/dashboard':  'Operations Overview',
  '/incidents':  'Report Incident',
  '/dispatch':   'Dispatch Status',
  '/tracking':   'Vehicle Tracking',
  '/analytics':  'Analytics Dashboard',
  '/responders': 'Responder Registry',
}

export default function Header() {
  const location = useLocation()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const title = PAGE_TITLES[location.pathname] || 'Dashboard'

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Live clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}>
          <Clock size={12} />
          <span>{format(now, 'HH:mm:ss')}</span>
          <span style={{ color: 'var(--border-bright)' }}>|</span>
          <span>{format(now, 'dd MMM yyyy')}</span>
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="live-dot" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--green)',
            letterSpacing: '0.08em',
          }}>LIVE</span>
        </div>
      </div>
    </header>
  )
}
