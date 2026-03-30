import React from 'react'

export function LoadingSpinner({ message = 'Loading…', size = 'md' }) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 48 : 32

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '2rem',
      color: 'var(--text-muted)',
    }}>
      <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none"
        style={{ animation: 'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--red)" strokeWidth="2"
          strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
        {message}
      </span>
    </div>
  )
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div style={{
      background: 'rgba(255,45,74,0.08)',
      border: '1px solid rgba(255,45,74,0.3)',
      borderRadius: 'var(--radius-sm)',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--red)',
          textTransform: 'uppercase',
          marginBottom: '0.2rem',
        }}>Error</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {error?.message || String(error) || 'An unexpected error occurred.'}
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}
          style={{ whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
          Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '3rem 2rem', gap: '0.75rem',
      color: 'var(--text-muted)',
    }}>
      {Icon && <Icon size={36} strokeWidth={1} />}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '0.9rem',
        fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>{title}</div>
      {description && (
        <div style={{ fontSize: '0.78rem', textAlign: 'center', maxWidth: 280 }}>
          {description}
        </div>
      )}
    </div>
  )
}

// ── Toast Notification System ─────────────────────────────────────────────────
import { useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export function Toast({ id, type, title, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), type === 'success' ? 6000 : 8000)
    return () => clearTimeout(t)
  }, [id, type, onClose])

  const isSuccess = type === 'success'
  const color = isSuccess ? 'var(--green)' : 'var(--red)'
  const bg = isSuccess ? 'rgba(0,230,118,0.08)' : 'rgba(255,45,74,0.08)'

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      background: 'var(--bg-elevated)',
      border: `1px solid ${color}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius-md)',
      padding: '0.9rem 1rem',
      minWidth: 320, maxWidth: 420,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`,
      animation: 'fade-in-up 0.3s ease forwards',
      position: 'relative',
    }}>
      {isSuccess
        ? <CheckCircle size={20} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
        : <XCircle size={20} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      }
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '0.82rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: color, marginBottom: '0.25rem',
        }}>{title}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'break-all',
        }}>{message}</div>
      </div>
      <button onClick={() => onClose(id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', padding: 0, flexShrink: 0,
      }}>
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div style={{
      position: 'fixed', top: '1.25rem', right: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <Toast {...t} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, title, message }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((title, message) => addToast('success', title, message), [addToast])
  const error = useCallback((title, message) => addToast('error', title, message), [addToast])

  return { toasts, removeToast, success, error }
}
