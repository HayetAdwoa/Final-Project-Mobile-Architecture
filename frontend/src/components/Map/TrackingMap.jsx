import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'

// Animated vehicle marker
function makeVehicleIcon(type) {
  const colors = { ambulance: '#00e676', police: '#2979ff', fire: '#ff6d00', default: '#ffb300' }
  const color = colors[type?.toLowerCase()] || colors.default
  const labels = { ambulance: '🚑', police: '🚓', fire: '🚒', default: '🚐' }
  const label = labels[type?.toLowerCase()] || labels.default
  return L.divIcon({
    html: `
      <div style="position:relative; display:flex; align-items:center; justify-content:center;">
        <div style="
          width:36px; height:36px; border-radius:50%;
          background: ${color}22; border: 2px solid ${color};
          display:flex; align-items:center; justify-content:center;
          font-size:16px; box-shadow: 0 0 12px ${color}66;
          animation: pulse-vehicle 1.5s infinite;
        ">${label}</div>
      </div>
      <style>
        @keyframes pulse-vehicle {
          0%,100% { box-shadow: 0 0 8px ${color}66; }
          50% { box-shadow: 0 0 18px ${color}cc; }
        }
      </style>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Auto-recenter when positions update
function MapUpdater({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]))
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
    }
  }, [positions.length])
  return null
}

export default function TrackingMap({ messages = [], incidentLocation = null }) {
  // Build vehicle state from WS messages
  const vehicles = useMemo(() => {
    const map = {}
    messages.forEach(msg => {
      if (msg.vehicleId) {
        map[msg.vehicleId] = {
          id: msg.vehicleId,
          lat: msg.latitude ?? msg.lat,
          lng: msg.longitude ?? msg.lng,
          type: msg.type || 'default',
          name: msg.name || msg.vehicleId,
          speed: msg.speed,
          heading: msg.heading,
          timestamp: msg.recordedAt || msg.timestamp,
        }
      }
    })
    return Object.values(map)
  }, [messages])

  // Build trail for each vehicle (last 20 positions)
  const trails = useMemo(() => {
    const trailMap = {}
    messages.slice(-200).forEach(msg => {
      if (!msg.vehicleId) return
      const lat = msg.latitude ?? msg.lat
      const lng = msg.longitude ?? msg.lng
      if (!lat || !lng) return
      if (!trailMap[msg.vehicleId]) trailMap[msg.vehicleId] = []
      const trail = trailMap[msg.vehicleId]
      const last = trail[trail.length - 1]
      if (!last || last[0] !== lat || last[1] !== lng) {
        trail.push([lat, lng])
        if (trail.length > 20) trail.shift()
      }
    })
    return trailMap
  }, [messages])

  const allPositions = [
    ...vehicles.map(v => ({ lat: v.lat, lng: v.lng })),
    ...(incidentLocation ? [incidentLocation] : []),
  ]

  const defaultCenter = [5.6037, -0.1870] // Accra, Ghana

  return (
    <div style={{
      height: '100%', width: '100%',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
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

        <MapUpdater positions={allPositions} />

        {/* Incident marker */}
        {incidentLocation && (
          <Marker
            position={[incidentLocation.lat, incidentLocation.lng]}
            icon={L.divIcon({
              html: `<div style="
                width:20px; height:20px;
                background: var(--red, #ff2d4a);
                border: 2px solid white; border-radius: 50%;
                box-shadow: 0 0 0 5px rgba(255,45,74,0.4);
                animation: blink-dot 1.2s infinite;
              "></div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup><strong style={{ color: '#ff2d4a' }}>Incident Site</strong></Popup>
          </Marker>
        )}

        {/* Vehicle trails */}
        {Object.entries(trails).map(([id, trail]) => (
          trail.length > 1 && (
            <Polyline
              key={id}
              positions={trail}
              color="#2979ff"
              weight={2}
              opacity={0.5}
              dashArray="4 6"
            />
          )
        ))}

        {/* Vehicle markers */}
        {vehicles.map(v => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={makeVehicleIcon(v.type)}
          >
            <Popup>
              <strong>{v.name}</strong><br />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                {v.type?.toUpperCase()}<br />
                {v.lat?.toFixed(5)}, {v.lng?.toFixed(5)}<br />
                {v.speed != null && `Speed: ${v.speed} km/h`}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
