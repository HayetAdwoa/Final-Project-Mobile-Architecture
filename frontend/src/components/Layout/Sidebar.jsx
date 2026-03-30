import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, AlertTriangle, Truck, BarChart3,
  MapPin, Users, LogOut, Radio, Shield
} from 'lucide-react'

const ROLE_COLOR = {
  hospital: 'var(--hospital-teal)',
  police:   'var(--police-blue)',
  fire:     'var(--fire-orange)',
}

const ROLE_LABEL = {
  hospital: 'Hospital Admin',
  police:   'Police Admin',
  fire:     'Fire Service Admin',
  admin:    'System Admin',
}

// Menu items visible per role
const allMenuItems = [
  { path: '/dashboard',  label: 'Overview',        icon: LayoutDashboard, roles: null },
  { path: '/incidents',  label: 'Report Incident', icon: AlertTriangle,   roles: null },
  { path: '/dispatch',   label: 'Dispatch Status', icon: Truck,           roles: null },
  { path: '/tracking',   label: 'Live Tracking',   icon: MapPin,          roles: null },
  { path: '/analytics',  label: 'Analytics',       icon: BarChart3,       roles: ['admin', 'hospital', 'police', 'fire'] },
  { path: '/responders', label: 'Responders',      icon: Users,           roles: ['admin', 'police', 'fire'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role?.toLowerCase() || 'admin'
  const accentColor = ROLE_COLOR[role] || 'var(--red)'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = allMenuItems.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--red)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Radio size={16} color="#fff" />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.1em',
            color: 'var(--text-primary)',
          }}>NERDCP</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}>EMERGENCY OPS</div>
        </div>
      </div>

      {/* User Badge */}
      <div style={{
        padding: '0.9rem 1rem',
        margin: '0.75rem 0.75rem 0',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        borderLeft: `3px solid ${accentColor}`,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
        }}>
          {user?.name || user?.email?.split('@')[0] || 'Operator'}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: accentColor,
          marginTop: '0.15rem',
        }}>
          {ROLE_LABEL[role] || 'Administrator'}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: '0.25rem 0.25rem 0.5rem',
        }}>Navigation</div>
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '0.15rem',
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              fontSize: '0.78rem',
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '0.06em',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'rgba(255,45,74,0.12)' : 'transparent',
              borderLeft: isActive ? `2px solid var(--red)` : '2px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            <item.icon size={15} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem' }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
