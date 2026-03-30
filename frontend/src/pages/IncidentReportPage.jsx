import React, { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createIncident } from '../api/incidents'
import { getNearestResponders } from '../api/services'
import { LoadingSpinner, useToast, ToastContainer } from '../components/Common/Feedback'
import { AlertTriangle, MapPin, Send, Users } from 'lucide-react'

const IncidentMap = lazy(() => import('../components/Map/IncidentMap'))

const INCIDENT_TYPES = [
  { id: 'fire',      value: 'FIRE',      label: '🔥 Fire Emergency',   roles: ['admin', 'fire'] },
  { id: 'medical',   value: 'AMBULANCE', label: '🏥 Medical Emergency', roles: ['admin', 'hospital'] },
  { id: 'police',    value: 'POLICE',    label: '🚓 Police Emergency',  roles: ['admin', 'police'] },
  { id: 'accident',  value: 'AMBULANCE', label: '🚑 Road Accident',     roles: ['admin', 'police', 'fire', 'hospital'] },
  { id: 'flood',     value: 'FIRE',      label: '🌊 Flood / Disaster',  roles: ['admin', 'fire'] },
  { id: 'other',     value: 'POLICE',    label: '⚠️ Other Emergency',   roles: ['admin', 'police', 'fire', 'hospital'] },
]

const SEVERITY_LEVELS = [
  { value: 'low',      label: 'Low',      color: 'var(--green)' },
  { value: 'medium',   label: 'Medium',   color: 'var(--yellow)' },
  { value: 'high',     label: 'High',     color: 'var(--orange)' },
  { value: 'critical', label: 'Critical', color: 'var(--red)' },
]

export default function IncidentReportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role?.toLowerCase() || 'admin'

  const [form, setForm] = useState({
    type: '',
    severity: 'high',
    description: '',
    reporterName: user?.name || '',
    reporterPhone: '',
  })
  const [location, setLocation] = useState(null)
  const [nearestResponders, setNearestResponders] = useState([])
  const [loadingResponders, setLoadingResponders] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast()

  const availableTypes = INCIDENT_TYPES.filter(t =>
    t.roles.includes(role)
  )

  const handleLocationSelect = async ({ lat, lng }) => {
    setLocation({ lat, lng })
    // Fetch nearest responders for this location
    if (form.type) {
      setLoadingResponders(true)
      try {
        const resp = await getNearestResponders(lat, lng, form.type)
        setNearestResponders(Array.isArray(resp) ? resp : resp?.responders || [])
      } catch { setNearestResponders([]) }
      finally { setLoadingResponders(false) }
    }
  }

  const handleTypeChange = async (typeId) => {
    setForm(f => ({ ...f, type: typeId }))
    const selectedType = INCIDENT_TYPES.find(t => t.id === typeId)
    const dbValue = selectedType?.value || typeId
    if (location && typeId) {
      setLoadingResponders(true)
      try {
        const resp = await getNearestResponders(location.lat, location.lng, dbValue)
        setNearestResponders(Array.isArray(resp) ? resp : resp?.responders || [])
      } catch { setNearestResponders([]) }
      finally { setLoadingResponders(false) }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.type) { setError('Please select an incident type.'); return }
    if (!location) { setError('Please click the map to set the incident location.'); return }
    if (!form.reporterName.trim()) { setError('Please enter your name.'); return }
    if (!form.reporterPhone.trim()) { setError('Please enter a contact phone number.'); return }
    setError('')
    setSubmitting(true)
    try {
      const selectedType = INCIDENT_TYPES.find(t => t.id === form.type)
      const payload = {
        incident_type: selectedType?.value || form.type,
        latitude: location.lat,
        longitude: location.lng,
        notes: form.description,
        citizen_name: form.reporterName,
        citizen_phone: form.reporterPhone,
        location_description: '',
        created_by: user?.sub || user?.id || user?.userId,
      }
      console.log('Submitting incident payload:', payload)
      const result = await createIncident(payload)
      const incidentId = result.incident_id || result.id || result._id || 'N/A'
      const unitType = result.assigned_unit_type || ''
      const unitId = result.assigned_unit_id
        ? String(result.assigned_unit_id).slice(0, 8).toUpperCase()
        : null
      const unitMsg = unitId
        ? `${unitType} unit ${unitId} dispatched — now en route to scene.`
        : 'No responders currently available — incident logged and queued for dispatch.'
      const toastType = unitId ? toastSuccess : toastError
      toastType(
        unitId ? '✅ Incident Created & Dispatched' : '⚠️ Incident Created — Awaiting Responder',
        `ID: ${String(incidentId).slice(0, 8).toUpperCase()} — ${unitMsg}`
      )
      // Reset form but stay on page
      setLocation(null)
      setNearestResponders([])
      setForm(f => ({ ...f, type: '', description: '' }))
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Failed to submit incident.'
      toastError('Report Failed', msg)
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', animation: 'fade-in-up 0.4s ease' }}>

      {/* Left: Map */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="card-header">
            <MapPin size={13} />
            Select Incident Location *
            {location ? (
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green)' }}>
                ✓ {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            ) : (
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--red)' }}>
                Click map to set location
              </span>
            )}
          </div>
          <Suspense fallback={<LoadingSpinner message="Loading map…" />}>
            <IncidentMap
              onLocationSelect={handleLocationSelect}
              selectedLocation={location}
              responders={nearestResponders}
              height="460px"
            />
          </Suspense>
        </div>

        {/* Nearest responders preview */}
        {nearestResponders.length > 0 && (
          <div className="card">
            <div className="card-header">
              <Users size={13} />
              Nearest Responders ({nearestResponders.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {nearestResponders.slice(0, 5).map((r, i) => (
                <div key={r.id || i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600 }}>
                      {r.name || `Unit ${i + 1}`}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {r.type} · {r.status}
                    </div>
                  </div>
                  {r.distance != null && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--blue)' }}>
                      {r.distance < 1 ? `${(r.distance * 1000).toFixed(0)}m` : `${r.distance.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {loadingResponders && <LoadingSpinner message="Finding nearest responders…" size="sm" />}
      </div>

      {/* Right: Form */}
      <div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header"><AlertTriangle size={13} />Incident Details</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Type */}
              <div className="input-group">
                <label className="input-label">Incident Type *</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={e => handleTypeChange(e.target.value)}
                  required
                >
                  <option value="">Select type…</option>
                  {availableTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="input-group">
                <label className="input-label">Severity *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {SEVERITY_LEVELS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                      style={{
                        padding: '0.45rem',
                        border: `2px solid ${form.severity === s.value ? s.color : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: form.severity === s.value ? `${s.color}18` : 'transparent',
                        color: form.severity === s.value ? s.color : 'var(--text-muted)',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Describe the emergency situation…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><Users size={13} />Reporter Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Your Name *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Officer / Admin name"
                  value={form.reporterName}
                  onChange={e => setForm(f => ({ ...f, reporterName: e.target.value }))}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Contact Phone *</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={form.reporterPhone}
                  onChange={e => setForm(f => ({ ...f, reporterPhone: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location confirmation */}
          {location && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <MapPin size={13} color="var(--green)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--green)' }}>
                Location set: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255,45,74,0.1)', border: '1px solid rgba(255,45,74,0.4)',
              borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--red)' }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.88rem' }}
          >
            {submitting ? 'Submitting…' : (
              <><Send size={14} /> Dispatch Alert</>
            )}
          </button>
        </form>
      </div>
    </div>
    </>
  )
}