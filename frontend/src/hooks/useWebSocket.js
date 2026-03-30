import { useEffect, useRef, useState, useCallback } from 'react'

const WS_BASE = import.meta.env.VITE_WS_DISPATCH_URL || 'ws://localhost:4003'

export function useTrackingSocket(incidentId) {
  const [messages, setMessages]   = useState([])
  const [status, setStatus]       = useState('disconnected') // connecting | open | closed | error
  const [lastUpdate, setLastUpdate] = useState(null)
  const wsRef = useRef(null)

  const connect = useCallback(() => {
    if (!incidentId) return
    const url = `${WS_BASE}/ws/track?incidentId=${incidentId}`
    setStatus('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('open')
    }

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data)
        setMessages(prev => [...prev.slice(-199), data]) // keep last 200
        setLastUpdate(new Date())
      } catch (e) {
        console.warn('WS parse error', e)
      }
    }

    ws.onerror = () => setStatus('error')

    ws.onclose = () => {
      setStatus('closed')
      // Auto-reconnect after 3s
      setTimeout(() => {
        if (wsRef.current === ws) connect()
      }, 3000)
    }
  }, [incidentId])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect on unmount
        wsRef.current.close()
      }
    }
  }, [connect])

  const clear = useCallback(() => setMessages([]), [])

  return { messages, status, lastUpdate, clear }
}

export function useGenericSocket(url) {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('disconnected')
  const wsRef = useRef(null)

  useEffect(() => {
    if (!url) return
    const ws = new WebSocket(url)
    wsRef.current = ws
    setStatus('connecting')
    ws.onopen = () => setStatus('open')
    ws.onmessage = (evt) => {
      try { setMessages(prev => [...prev.slice(-99), JSON.parse(evt.data)]) }
      catch { /* noop */ }
    }
    ws.onerror = () => setStatus('error')
    ws.onclose = () => setStatus('closed')
    return () => { ws.onclose = null; ws.close() }
  }, [url])

  return { messages, status }
}
