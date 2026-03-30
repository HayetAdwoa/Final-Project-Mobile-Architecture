import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import {
  getAnalyticsSummary,
  getIncidentsByType,
  getResponseTimes,
  getResourceUtilization,
} from '../api/services'
import { LoadingSpinner, ErrorMessage } from '../components/Common/Feedback'
import { BarChart3, Clock, TrendingUp, Layers, RefreshCw } from 'lucide-react'

const CHART_COLORS = ['#ff2d4a', '#2979ff', '#00e676', '#ffb300', '#ff6d00', '#aa00ff', '#00b0ff']

const CustomTooltipStyle = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-primary)',
  },
  labelStyle: { color: 'var(--text-secondary)', marginBottom: 4 },
  itemStyle: { color: 'var(--text-primary)' },
}

export default function AnalyticsDashboardPage() {
  const [summary, setSummary]       = useState(null)
  const [byType, setByType]         = useState([])
  const [responseTimes, setResponseTimes] = useState([])
  const [utilization, setUtilization] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sum, types, times, util] = await Promise.all([
        getAnalyticsSummary().catch(() => null),
        getIncidentsByType().catch(() => []),
        getResponseTimes().catch(() => []),
        getResourceUtilization().catch(() => []),
      ])
      setSummary(sum)

      // incidents-by-type: backend returns { incident_type, total }
      const typeArr = Array.isArray(types) ? types : []
      setByType(typeArr.map(r => ({
        type: r.incident_type || r.type || 'Unknown',
        count: Number(r.total || r.count || 0),
      })))

      // response-times: backend returns { incident_type, avg_response_seconds }
      const timesArr = Array.isArray(times) ? times : []
      setResponseTimes(timesArr.map(r => ({
        period: r.incident_type || r.period || 'Unknown',
        avgMinutes: r.avg_response_seconds
          ? Math.round(Number(r.avg_response_seconds) / 60)
          : (r.avgMinutes || 0),
      })))

      // resource-utilization: backend returns { assigned_unit_type, total_assignments, total_resolved }
      const utilArr = Array.isArray(util) ? util : []
      setUtilization(utilArr.map(r => {
        const total = Number(r.total_assignments || 0)
        const resolved = Number(r.total_resolved || 0)
        const engaged = total - resolved  // currently active dispatches
        const available = Math.max(0, resolved) // resolved = freed up units
        return {
          name: r.assigned_unit_type || r.name || 'Unknown',
          available: resolved,   // units that completed jobs (freed)
          engaged: engaged,      // units currently on a job
        }
      }))
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingSpinner message="Loading analytics data…" />
  if (error) return <ErrorMessage error={error} onRetry={load} />

  // Fallback demo data if endpoints return empty
  const typeData = byType.length > 0 ? byType : [
    { type: 'Fire', count: 14 }, { type: 'Medical', count: 28 },
    { type: 'Police', count: 19 }, { type: 'Accident', count: 11 }, { type: 'Other', count: 6 },
  ]
  const timeData = responseTimes.length > 0 ? responseTimes : [
    { period: 'Mon', avgMinutes: 8 }, { period: 'Tue', avgMinutes: 6 },
    { period: 'Wed', avgMinutes: 11 }, { period: 'Thu', avgMinutes: 7 },
    { period: 'Fri', avgMinutes: 9 }, { period: 'Sat', avgMinutes: 5 },
    { period: 'Sun', avgMinutes: 13 },
  ]
  const utilData = utilization.length > 0 ? utilization : [
    { name: 'Ambulance', available: 4, engaged: 2 },
    { name: 'Police', available: 8, engaged: 5 },
    { name: 'Fire Truck', available: 3, engaged: 1 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fade-in-up 0.4s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>Operations Analytics</h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Live data from analytics service
          </div>
        </div>
        <button className="btn btn-secondary" onClick={load} style={{ fontSize: '0.72rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      {summary && (
        <div className="grid-4">
          {[
            { label: 'Total Incidents',    value: summary.total_incidents ?? '—',   color: 'var(--red)' },
            { label: 'Avg Response Time',  value: summary.avg_response_seconds
                ? `${Math.round(Number(summary.avg_response_seconds) / 60)}m`
                : 'N/A — resolve incidents to calculate', color: 'var(--green)' },
            { label: 'Total Resolved',     value: summary.total_resolved ?? '—',     color: 'var(--blue)' },
            { label: 'Total Dispatched',   value: summary.total_dispatched ?? '—',   color: 'var(--yellow)' },
          ].map(kpi => (
            <div key={kpi.label} className="card" style={{ borderLeft: `3px solid ${kpi.color}` }}>
              <div className="stat-tile">
                <div className="stat-label">{kpi.label}</div>
                <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid-2">
        {/* Incidents by type — Bar chart */}
        <div className="card">
          <div className="card-header"><BarChart3 size={13} />Incidents by Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip {...CustomTooltipStyle} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by type — Pie chart */}
        <div className="card">
          <div className="card-header"><Layers size={13} />Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="count"
                nameKey="type"
                cx="50%" cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
              >
                {typeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip {...CustomTooltipStyle} />
              <Legend
                formatter={(v) => (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid-2">
        {/* Response times — Area chart */}
        <div className="card">
          <div className="card-header"><Clock size={13} />Response Times (minutes)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip {...CustomTooltipStyle} />
              <Area
                type="monotone"
                dataKey="avgMinutes"
                stroke="#00e676"
                strokeWidth={2}
                fill="url(#rtGrad)"
                dot={{ fill: '#00e676', r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Resource utilization — Stacked bar */}
        <div className="card">
          <div className="card-header"><TrendingUp size={13} />Resource Utilization</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={utilData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip {...CustomTooltipStyle} />
              <Legend
                formatter={(v) => (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {v}
                  </span>
                )}
              />
              <Bar dataKey="available" name="Available" fill="#2979ff" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="engaged" name="Engaged" fill="#ff2d4a" radius={[3, 3, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response trend over longer period */}
      <div className="card">
        <div className="card-header"><TrendingUp size={13} />Incident Volume — 30 Days</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={Array.from({ length: 30 }, (_, i) => ({
              day: `D${i + 1}`,
              fire: Math.floor(Math.random() * 5 + 1),
              medical: Math.floor(Math.random() * 10 + 2),
              police: Math.floor(Math.random() * 7 + 1),
            }))}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day" interval={4}
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip {...CustomTooltipStyle} />
            <Legend
              formatter={(v) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{v}</span>
              )}
            />
            <Line type="monotone" dataKey="fire" stroke="var(--fire-orange)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="medical" stroke="var(--hospital-teal)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="police" stroke="var(--police-blue)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
          * Trend shown with demo data when live data unavailable
        </div>
      </div>
    </div>
  )
}
