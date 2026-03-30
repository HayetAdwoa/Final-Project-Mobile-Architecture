import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/Common/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import IncidentReportPage from './pages/IncidentReportPage'
import DispatchStatusPage from './pages/DispatchStatusPage'
import LiveTrackingPage from './pages/LiveTrackingPage'
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'
import RespondersPage from './pages/RespondersPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="incidents"  element={<IncidentReportPage />} />
          <Route path="dispatch"   element={<DispatchStatusPage />} />
          <Route path="tracking"   element={<LiveTrackingPage />} />
          <Route path="analytics"  element={<AnalyticsDashboardPage />} />
          <Route path="responders" element={
            <ProtectedRoute roles={['admin', 'police', 'fire']}>
              <RespondersPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
