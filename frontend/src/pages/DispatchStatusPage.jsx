import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidents, updateIncidentStatus } from '../api/incidents'
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Common/Feedback'
import StatusBadge from '../components/Common/StatusBadge'
import { Truck, RefreshCw, MapPin, ChevronRight, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_FILTERS = [
  { value: 'all',        label: 'All' },
  { value: 'CREATED',    label: 'Created' },
  { value: 'DISPATCHED', label: 'In Progress' },
  { value: 'RESOLVED',   label: 'Resolved' },
]

const SEVERITY_COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' }

export default function DispatchStatusPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIncidents()
      const list = Array.isArray(data) ? data : data?.incidents || []
      list.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
      setIncidents(list)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setInterval(load, 20_000)
    return () => clearInterval(t)
  }, [])

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter(i => i.status === filter)

  const handleResolve = async (incidentId) => {
    setActionLoading(a => ({ ...a, [incidentId]: 'resolve' }))
    try {
      await updateIncidentStatus(incidentId, 'RESOLVED')
      await load()
    } catch (e) { alert(e?.response?.data?.error || 'Update failed') }
    finally { setActionLoading(a => ({ ...a, [incidentId]: null })) }
  }

  if (loading && incidents.length === 0) return <LoadingSpinner message="Loading dispatch status…" />
  if (error) return <ErrorMessage error={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fade-in-up 0.4s ease' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => {
            const count = s.value === 'all' ? incidents.length : incidents.filter(i => i.status === s.value).length
            return (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                style={{
                  padding: '0.35rem 0.8rem',
                  background: filter === s.value ? 'var(--red)' : 'var(--bg-elevated)',
                  border: `1px solid ${filter === s.value ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: filter === s.value ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}
              >
                {s.label}
                <span style={{
                  background: filter === s.value ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                  borderRadius: '10px', padding: '0 0.35rem',
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                }}>{count}</span>
              </button>
            )
          })}
        </div>
        <button className="btn btn-secondary" onClick={load} style={{ fontSize: '0.72rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Incident cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No Incidents" description={`No ${filter} incidents to display`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(inc => {
            const id = inc.incident_id || inc.id || inc._id
            const isActing = actionLoading[id]
            const incType = inc.incident_type || inc.type || 'Unknown'
            const lat = inc.latitude || inc.location?.lat
            const lng = inc.longitude || inc.location?.lng

            return (
              <div key={id} className="card" style={{ borderLeft: `4px solid var(--red)` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: 'rgba(255,45,74,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <AlertCircle size={20} color="var(--red)" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {incType}
                      </span>
                      <StatusBadge status={inc.status} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {lat && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <MapPin size={11} />
                          {inc.location_description || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`}
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        ID: #{String(id).slice(-8).toUpperCase()}
                      </span>
                      {(inc.created_at || inc.createdAt) && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(inc.created_at || inc.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {inc.notes && (
                      <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {inc.notes.slice(0, 180)}{inc.notes.length > 180 ? '…' : ''}
                      </p>
                    )}

                    {inc.assigned_unit_id && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{
                          background: 'var(--blue-dim)', border: '1px solid var(--blue)',
                          borderRadius: 2, padding: '0.15rem 0.5rem',
                          fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--blue)',
                        }}>
                          Unit: {inc.assigned_unit_id} · {inc.assigned_unit_type}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 110 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => navigate(`/tracking?incidentId=${id}`)}
                      style={{ fontSize: '0.7rem', justifyContent: 'space-between' }}
                    >
                      Track <ChevronRight size={12} />
                    </button>

                    {inc.status === 'DISPATCHED' && (
                      <button
                        className="btn btn-secondary"
                        disabled={!!isActing}
                        onClick={() => handleResolve(id)}
                        style={{ fontSize: '0.7rem', justifyContent: 'center', borderColor: 'var(--green)', color: 'var(--green)' }}
                      >
                        {isActing === 'resolve' ? '…' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
