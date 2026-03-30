import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Radio, AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react'

const DEMO_ROLES = [
  { email: 'admin@nerdcp.gh',    password: 'admin123',    role: 'Admin',    color: 'var(--red)' },
  { email: 'police@nerdcp.gh',   password: 'police123',   role: 'Police',   color: 'var(--police-blue)' },
  { email: 'fire@nerdcp.gh',     password: 'fire123',     role: 'Fire',     color: 'var(--fire-orange)' },
  { email: 'hospital@nerdcp.gh', password: 'hospital123', role: 'Hospital', color: 'var(--hospital-teal)' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email, password) => setForm({ email, password })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.035,
        backgroundImage: `
          linear-gradient(var(--blue) 1px, transparent 1px),
          linear-gradient(90deg, var(--blue) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
        pointerEvents: 'none',
      }} />

      {/* Scan line */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.025 }}>
        <div style={{
          width: '100%', height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--blue), transparent)',
          animation: 'scan-line 7s linear infinite',
        }} />
      </div>

      {/* Glow blob left */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,45,74,0.07) 0%, transparent 70%)',
        top: '30%', left: '15%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* ── Main card ── */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 900,
        margin: '0 auto',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        animation: 'fade-in-up 0.5s ease forwards',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Left panel — branding */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
          borderRight: '1px solid var(--border)',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative corner accent */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 120, height: 120,
            background: 'var(--red)',
            opacity: 0.06,
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, background: 'var(--red)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px var(--red-glow)',
            }}>
              <Radio size={22} color="#fff" />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '1.4rem', letterSpacing: '0.12em', color: 'var(--text-primary)',
              }}>NERDCP</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                color: 'var(--text-muted)', letterSpacing: '0.08em',
              }}>SYSTEM v1.0</div>
            </div>
          </div>

          {/* Main title */}
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '2.8rem',
              fontWeight: 800, lineHeight: 1.08, marginBottom: '1.1rem',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              National<br />
              <span style={{ color: 'var(--red)' }}>Emergency</span><br />
              Response &<br />
              Dispatch<br />
              Platform
            </h1>

            <p style={{
              color: 'var(--text-muted)', fontSize: '0.9rem',
              lineHeight: 1.7, maxWidth: 300,
            }}>
              Unified command and control for Hospital, Police, and Fire Service
              emergency response operations across Ghana.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {['Hospital', 'Police', 'Fire Service'].map(svc => (
                <div key={svc} style={{
                  padding: '0.3rem 0.8rem',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.07em',
                }}>{svc}</div>
              ))}
            </div>
          </div>

          {/* Bottom footer text */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            color: 'var(--text-muted)', lineHeight: 1.7,
          }}>
            CPEN 421 · University of Ghana<br />
            Emergency Operations Platform
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          width: 400,
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.5rem',
        }}>
          {/* Header */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.3rem',
            }}>
              <Shield size={16} color="var(--red)" />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '1.25rem',
                fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--text-primary)',
              }}>Operator Sign-In</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              color: 'var(--text-muted)',
            }}>
              Authorised personnel only
            </div>
          </div>

          {/* Demo logins */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.68rem',
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: '0.6rem',
            }}>Quick Demo Login</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              {DEMO_ROLES.map(d => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d.email, d.password)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid var(--border)`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = d.color; e.currentTarget.style.background = 'var(--bg-card)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 700, color: d.color, letterSpacing: '0.06em',
                  }}>{d.role}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                    color: 'var(--text-muted)', marginTop: '0.1rem',
                  }}>{d.email}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>OR ENTER MANUALLY</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="operator@nerdcp.gh"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{
                    position: 'absolute', right: '0.85rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,45,74,0.1)',
                border: '1px solid rgba(255,45,74,0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <AlertTriangle size={15} color="var(--red)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--red)' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              {loading ? 'Authenticating…' : 'Access System'}
            </button>
          </form>

          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7,
          }}>
            Unauthorised access is strictly prohibited
          </div>
        </div>
      </div>
    </div>
  )
}
