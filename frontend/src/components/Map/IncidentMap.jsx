import React, { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix default leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emergencyIcon = L.divIcon({
  html: `<div style="
    width:24px; height:24px;
    background: #ff2d4a;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 0 0 4px rgba(255,45,74,0.35), 0 4px 8px rgba(0,0,0,0.4);
  "></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

const responderIcon = L.divIcon({
  html: `<div style="
    width:20px; height:20px;
    background: #2979ff;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(41,121,255,0.4);
  "></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

function FlyTo({ position }) {
  const map = useMap()
  React.useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 15, { duration: 1.2 })
  }, [position])
  return null
}

export default function IncidentMap({
  onLocationSelect,
  selectedLocation,
  responders = [],
  height = '400px',
  readOnly = false,
}) {
  const defaultCenter = [5.6037, -0.1870] // Accra, Ghana
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const debounceRef = useRef(null)

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (!query.trim() || query.length < 3) { setSearchResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=gh`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        setSearchResults(data)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 400)
  }

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setFlyTarget({ lat, lng })
    onLocationSelect && onLocationSelect({ lat, lng, address: result.display_name })
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','))
    setSearchResults([])
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Search box */}
      {!readOnly && (
        <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type="text"
              placeholder="Search location (e.g. Legon, Accra)…"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              style={{ paddingLeft: '0.85rem', paddingRight: '2rem' }}
            />
            {searching && (
              <span style={{
                position: 'absolute', right: '0.75rem', top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'var(--text-muted)',
              }}>…</span>
            )}
          </div>

          {/* Dropdown results */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              zIndex: 2000,
              maxHeight: 220,
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectResult(r)}
                  style={{
                    padding: '0.6rem 0.85rem',
                    cursor: 'pointer',
                    borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {r.display_name.split(',')[0]}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {r.display_name.split(',').slice(1, 3).join(',')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{
        height,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
      }}>
        {!readOnly && !selectedLocation && (
          <div style={{
            position: 'absolute', top: 10, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(9,14,24,0.85)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.3rem 0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            zIndex: 1000,
            pointerEvents: 'none',
          }}>
            Search above or click map to set location
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />

          {!readOnly && onLocationSelect && (
            <ClickHandler onLocationSelect={onLocationSelect} />
          )}

          {flyTarget && <FlyTo position={flyTarget} />}

          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={emergencyIcon}
            >
              <Popup>
                <strong style={{ color: '#ff2d4a' }}>Incident Location</strong><br />
                {selectedLocation.address && (
                  <span style={{ fontSize: '0.75rem' }}>{selectedLocation.address.split(',').slice(0,2).join(',')}<br /></span>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                </span>
              </Popup>
            </Marker>
          )}

          {responders.map((r, i) => (
            r.latitude && r.longitude && (
              <Marker
                key={r.id || i}
                position={[r.latitude || r.lat, r.longitude || r.lng]}
                icon={responderIcon}
              >
                <Popup>
                  <strong>{r.name || `Responder ${i + 1}`}</strong><br />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                    {r.type || 'Unit'} — {r.status || 'Available'}
                  </span>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
