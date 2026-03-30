import React, { useState, useEffect } from 'react'
import { getAllResponders } from '../api/services'
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Common/Feedback'
import StatusBadge from '../components/Common/StatusBadge'
import { Users, Search, RefreshCw, Phone, MapPin } from 'lucide-react'

const TYPE_COLORS = {
  ambulance: 'var(--hospital-teal)',
  police:    'var(--police-blue)',
  fire:      'var(--fire-orange)',
  default:   'var(--text-muted)',
}

export default function RespondersPage() {
  const [responders, setResponders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllResponders()
      setResponders(Array.isArray(data) ? data : data?.responders || [])
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const allTypes = ['all', ...new Set(responders.map(r => r.type?.toLowerCase()).filter(Boolean))]

  const filtered = responders.filter(r => {
    const matchSearch = !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toString().includes(search) ||
      r.callSign?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || r.type?.toLowerCase() === typeFilter
    return matchSearch && matchType
  })

  if (loading && responders.length === 0) return <LoadingSpinner message="Loading responders…" />
  if (error) return <ErrorMessage error={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fade-in-up 0.4s ease' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} style={{
            position: 'absolute', left: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
          }} />
          <input
            className="input"
            type="text"
            placeholder="Search by name, ID, call sign…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {allTypes.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '0.35rem 0.75rem',
                background: typeFilter === t ? 'var(--red)' : 'var(--bg-elevated)',
                border: `1px solid ${typeFilter === t ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: typeFilter === t ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <button className="btn btn-secondary" onClick={load} style={{ fontSize: '0.72rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid-3">
        {[
          { label: 'Total Responders', value: responders.length, color: 'var(--blue)' },
          { label: 'Available', value: responders.filter(r => ['AVAILABLE','available','online'].includes(r.status)).length, color: 'var(--green)' },
          { label: 'Engaged', value: responders.filter(r => ['ENGAGED','engaged','dispatched','busy'].includes(r.status)).length, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div className="stat-tile">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Responders grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No Responders Found" description="Try adjusting your search or filters" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.75rem',
        }}>
          {filtered.map((r, i) => {
            const typeColor = TYPE_COLORS[r.type?.toLowerCase()] || TYPE_COLORS.default
            return (
              <div
                key={r.id || i}
                className="card"
                style={{ borderLeft: `3px solid ${typeColor}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700 }}>
                      {r.name || `Unit ${i + 1}`}
                    </div>
                    {r.callSign && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: typeColor, marginTop: '0.1rem' }}>
                        {r.callSign}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={r.status || 'offline'} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)',
                  }}>
                    <span style={{
                      background: `${typeColor}18`, border: `1px solid ${typeColor}`,
                      borderRadius: 2, padding: '0.1rem 0.45rem',
                      color: typeColor, fontWeight: 500, textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {r.type || 'Unknown'}
                    </span>
                    {r.vehicleType && (
                      <span style={{ color: 'var(--text-muted)' }}>{r.vehicleType}</span>
                    )}
                  </div>

                  {r.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      <Phone size={10} /> {r.phone}
                    </div>
                  )}

                  {(r.lat || r.latitude) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      <MapPin size={10} />
                      {Number(r.lat || r.latitude).toFixed(4)}, {Number(r.lng || r.longitude).toFixed(4)}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  ID: {String(r.id || r._id || i).slice(-8).toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
