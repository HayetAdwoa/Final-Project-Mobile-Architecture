import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getIncidents } from '../api/incidents'
import { getAnalyticsSummary } from '../api/services'
import { LoadingSpinner, ErrorMessage } from '../components/Common/Feedback'
import StatusBadge from '../components/Common/StatusBadge'
import { AlertTriangle, Truck, Users, Clock, ArrowRight, TrendingUp, Activity } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const INCIDENT_TYPE_COLORS = {
  fire:      'var(--fire-orange)',
  medical:   'var(--hospital-teal)',
  police:    'var(--police-blue)',
  accident:  'var(--yellow)',
  default:   'var(--text-muted)',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary]     = useState(null)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sum, inc] = await Promise.all([
        getAnalyticsSummary().catch(() => null),
        getIncidents({ limit: 10 }).catch(() => []),
      ])
      setSummary(sum)
      setIncidents(Array.isArray(inc) ? inc : inc?.incidents || [])
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  const role = user?.role?.toLowerCase()

  const statTiles = [
    {
      label: 'Open Incidents',
      value: summary?.activeIncidents ?? incidents.filter(i => ['CREATED','DISPATCHED','active','dispatched'].includes(i.status)).length,
      icon: AlertTriangle,
      color: 'var(--red)',
      sub: 'Created + In Progress',
    },
    {
      label: 'In Progress',
      value: summary?.dispatchedUnits ?? incidents.filter(i => i.status === 'DISPATCHED' || i.status === 'dispatched').length,
      icon: Truck,
      color: 'var(--blue)',
      sub: 'Responder en route',
    },
    {
      label: 'Resolved Today',
      value: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'resolved').length,
      icon: Clock,
      color: 'var(--green)',
      sub: 'Closed incidents',
    },
    {
      label: 'Total Logged',
      value: summary?.totalToday ?? incidents.length,
      icon: Activity,
      color: 'var(--yellow)',
      sub: 'All time incidents',
    },
  ]

  if (loading) return <LoadingSpinner message="Loading operations overview…" />
  if (error) return <ErrorMessage error={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--red)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fade-in-up 0.4s ease',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '1.1rem',
            fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Operator'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {format(new Date(), "EEEE, dd MMMM yyyy • HH:mm")} · {role?.toUpperCase()} OPERATIONS
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/incidents')}>
          <AlertTriangle size={14} />
          Report Incident
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid-4" style={{ animation: 'fade-in-up 0.5s ease' }}>
        {statTiles.map((tile, i) => (
          <div
            key={tile.label}
            className="card"
            style={{
              borderLeft: `3px solid ${tile.color}`,
              animationDelay: `${i * 0.07}s`,
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <div className="stat-tile">
                <div className="stat-label">{tile.label}</div>
                <div className="stat-value" style={{ color: tile.color }}>{tile.value}</div>
                <div className="stat-sub">{tile.sub}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${tile.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <tile.icon size={18} color={tile.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent incidents table */}
      <div className="card" style={{ animation: 'fade-in-up 0.55s ease' }}>
        <div className="card-header">
          <Activity size={13} />
          Recent Incidents
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/dispatch')}
            style={{ marginLeft: 'auto', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        {incidents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            No incidents recorded yet
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 8).map(inc => (
                  <tr key={inc.incident_id || inc.id || inc._id}>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                        color: 'var(--text-mono)',
                      }}>
                        #{String(inc.incident_id || inc.id || inc._id).slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: '0.75rem',
                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: INCIDENT_TYPE_COLORS[(inc.incident_type || inc.type)?.toLowerCase()] || INCIDENT_TYPE_COLORS.default,
                      }}>
                        {inc.incident_type || inc.type || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {inc.location_description || (inc.latitude && `${Number(inc.latitude).toFixed(4)}, ${Number(inc.longitude).toFixed(4)}`) || (inc.location?.lat && `${Number(inc.location.lat).toFixed(4)}, ${Number(inc.location.lng).toFixed(4)}`) || 'N/A'}
                      </span>
                    </td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {inc.created_at ? formatDistanceToNow(new Date(inc.created_at), { addSuffix: true }) : inc.createdAt ? formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true }) : '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => navigate(`/tracking?incidentId=${inc.incident_id || inc.id || inc._id}`)}
                        style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role-specific quick actions */}
      <div className="grid-3" style={{ animation: 'fade-in-up 0.6s ease' }}>
        {role !== 'hospital' && (
          <div className="card" style={{ borderLeft: '3px solid var(--police-blue)', cursor: 'pointer' }}
            onClick={() => navigate('/responders')}>
            <div className="card-header"><Users size={13} />Responders</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              View and manage field responders, check availability, and unit assignments.
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.72rem' }}>
                Open Registry <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{ borderLeft: '3px solid var(--green)', cursor: 'pointer' }}
          onClick={() => navigate('/analytics')}>
          <div className="card-header"><TrendingUp size={13} />Analytics</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Response time trends, incident breakdown by type, and resource utilization.
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.72rem' }}>
              View Reports <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--blue)', cursor: 'pointer' }}
          onClick={() => navigate('/tracking')}>
          <div className="card-header"><Truck size={13} />Live Tracking</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Real-time GPS tracking of all dispatched vehicles via WebSocket feed.
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.72rem' }}>
              Open Map <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
