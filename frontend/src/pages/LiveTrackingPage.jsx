import React, { useState, lazy, Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTrackingSocket } from '../hooks/useWebSocket'
import { LoadingSpinner } from '../components/Common/Feedback'
import { MapPin, Wifi, WifiOff, Trash2, Activity, Play, Square, Navigation } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'

const TrackingMap = lazy(() => import('../components/Map/TrackingMap'))

const DISPATCH_URL = ''

const STATUS_COLORS = {
  open: 'var(--green)', connecting: 'var(--yellow)',
  closed: 'var(--text-muted)', error: 'var(--red)', disconnected: 'var(--text-muted)',
}

// Simulated route around Accra
const ACCRA_ROUTE = [
  [5.5600, -0.2010], [5.5650, -0.1980], [5.5700, -0.1940],
  [5.5760, -0.1900], [5.5820, -0.1860], [5.5880, -0.1820],
  [5.5940, -0.1790], [5.6000, -0.1840], [5.6037, -0.1870],
]

export default function LiveTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputId, setInputId]   = useState(searchParams.get('incidentId') || '')
  const [activeId, setActiveId] = useState(searchParams.get('incidentId') || '')
  const [vehicleId, setVehicleId] = useState('unit-alpha')
  const [simRunning, setSimRunning] = useState(false)
  const [simStep, setSimStep]   = useState(0)
  const [simStatus, setSimStatus] = useState('')
  const simRef = useRef(null)

  const { messages, status, lastUpdate, clear } = useTrackingSocket(activeId)

  const handleTrack = (id) => {
    if (!id.trim()) return
    setActiveId(id.trim())
    setSearchParams({ incidentId: id.trim() })
    setSimStep(0)
  }

  // Simulator: sends location updates automatically
  const startSimulation = () => {
    if (!activeId) { setSimStatus('Enter an Incident ID first'); return }
    setSimRunning(true)
    setSimStep(0)
    setSimStatus('Simulation started...')
  }

  const stopSimulation = () => {
    setSimRunning(false)
    clearInterval(simRef.current)
    setSimStatus('Simulation stopped')
  }

  useEffect(() => {
    if (!simRunning) return
    const route = ACCRA_ROUTE
    let step = simStep

    const tick = async () => {
      if (step >= route.length) {
        setSimStatus('✅ Vehicle arrived at scene')
        setSimRunning(false)
        return
      }
      const [lat, lng] = route[step]
      try {
        await axios.post(`${DISPATCH_URL}/vehicles/${vehicleId}/location`, {
          incident_id: activeId,
          latitude: lat,
          longitude: lng,
          accuracy_meters: 5,
        })
        setSimStatus(`📍 Step ${step + 1}/${route.length} — ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        setSimStep(step + 1)
        step++
      } catch (err) {
        setSimStatus(`Error: ${err.message}`)
        setSimRunning(false)
      }
    }

    tick() // run immediately
    simRef.current = setInterval(tick, 2000)
    return () => clearInterval(simRef.current)
  }, [simRunning, activeId, vehicleId])

  const vehicleMap = {}
  messages.forEach(m => { if (m.vehicleId) vehicleMap[m.vehicleId] = m })
  const vehicles = Object.values(vehicleMap)
  const wsColor = STATUS_COLORS[status] || 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - var(--header-h) - 3rem)', animation: 'fade-in-up 0.4s ease' }}>

      {/* Control bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <label className="input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
            Incident ID to Track
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                type="text"
                placeholder="Paste incident ID from Dispatch page…"
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setActiveId(inputId.trim())
                    setSearchParams({ incidentId: inputId.trim() })
                    setSimStep(0)
                  }
                }}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button
              onClick={() => {
                if (!inputId.trim()) return
                setActiveId(inputId.trim())
                setSearchParams({ incidentId: inputId.trim() })
                setSimStep(0)
              }}
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Track
            </button>
          </div>
          {!activeId && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Tip: Click "Track" on any incident in the Dispatch Status page to auto-fill this
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: wsColor }}>
          {status === 'open' ? <Wifi size={14} /> : <WifiOff size={14} />}
          {status.toUpperCase()}
          {lastUpdate && <span style={{ color: 'var(--text-muted)' }}>· {format(lastUpdate, 'HH:mm:ss')}</span>}
        </div>

        {messages.length > 0 && (
          <button className="btn btn-ghost" onClick={clear} style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Driver Simulator Panel */}
      <div className="card" style={{ borderLeft: '3px solid var(--blue)', flexShrink: 0 }}>
        <div className="card-header">
          <Navigation size={13} />
          Ambulance Driver Simulator
          <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            — simulates a vehicle driving to the incident scene
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="input-label">Vehicle / Unit ID</label>
            <input
              className="input"
              type="text"
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              placeholder="unit-alpha"
            />
          </div>

          {!simRunning ? (
            <button
              className="btn btn-primary"
              onClick={startSimulation}
              disabled={!activeId}
              style={{ marginTop: '1.25rem' }}
            >
              <Play size={13} /> Start Simulation
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={stopSimulation}
              style={{ marginTop: '1.25rem', borderColor: 'var(--red)', color: 'var(--red)' }}
            >
              <Square size={13} /> Stop
            </button>
          )}

          {simStatus && (
            <div style={{
              marginTop: '1.25rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              color: simRunning ? 'var(--green)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {simRunning && <span className="live-dot" />}
              {simStatus}
            </div>
          )}
        </div>
      </div>

      {/* Main content: map + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* Map */}
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
          {!activeId ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-muted)',
            }}>
              <MapPin size={36} strokeWidth={1} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Enter Incident ID
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
                Connect to a WebSocket stream to see live vehicle positions
              </div>
            </div>
          ) : (
            <Suspense fallback={<LoadingSpinner message="Loading tracking map…" />}>
              <TrackingMap messages={messages} />
            </Suspense>
          )}

          {status === 'open' && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(9,14,24,0.85)', backdropFilter: 'blur(4px)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green)',
              zIndex: 1000,
            }}>
              <span className="live-dot" />
              LIVE · {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>

          <div className="card" style={{ flexShrink: 0 }}>
            <div className="card-header"><Activity size={13} />Tracked Vehicles</div>
            {vehicles.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {activeId ? 'Waiting for data…' : 'Not connected'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {vehicles.map((v, i) => (
                  <div key={v.vehicleId || i} style={{
                    padding: '0.5rem 0.6rem', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--blue)',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {v.vehicleId}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {Number(v.latitude ?? v.lat)?.toFixed(5)}, {Number(v.longitude ?? v.lng)?.toFixed(5)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <Activity size={13} />
              Event Stream
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                {messages.length} events
              </span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {messages.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  No events yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                  {[...messages].reverse().slice(0, 50).map((msg, i) => (
                    <div key={i} style={{
                      padding: '0.35rem 0.5rem',
                      borderBottom: '1px solid rgba(30,51,88,0.4)',
                      fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)', lineHeight: 1.4,
                    }}>
                      <span style={{ color: 'var(--text-mono)' }}>
                        {msg.recordedAt || msg.timestamp ? format(new Date(msg.recordedAt || msg.timestamp), 'HH:mm:ss') : '—'}
                      </span>
                      {' '}{msg.vehicleId}{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {Number(msg.latitude ?? msg.lat)?.toFixed(4)},{Number(msg.longitude ?? msg.lng)?.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
