import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-w)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Header />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'var(--bg-base)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
