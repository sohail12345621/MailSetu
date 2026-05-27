import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SendEmailPage from './pages/SendEmailPage'
import BulkSendPage from './pages/BulkSendPage'
import TemplatesPage from './pages/TemplatesPage'
import LogsPage from './pages/LogsPage'
import SchedulePage from './pages/SchedulePage'

function ProtectedLayout() {
  const { account, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading MailSetu…</p>
        </div>
      </div>
    )
  }

  if (!account) return <Navigate to="/login" replace />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/send" element={<SendEmailPage />} />
          <Route path="/bulk" element={<BulkSendPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            borderRadius: 12,
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#22d3a0', secondary: 'white' } },
          error: { iconTheme: { primary: '#f06060', secondary: 'white' } },
        }}
      />
    </AuthProvider>
  )
}
