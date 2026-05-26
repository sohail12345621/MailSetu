import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Send, Users, FileText, Clock, ScrollText,
  LogOut, Mail, ChevronLeft, ChevronRight, Settings
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send', icon: Send, label: 'Send Email' },
  { to: '/bulk', icon: Users, label: 'Bulk Send' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/schedule', icon: Clock, label: 'Schedule' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { account, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c6af7, #60b4f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Mail size={18} color="white" />
        </div>
        {!collapsed && (
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Mail<span className="gradient-text">Setu</span>
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 10px',
              borderRadius: 10,
              marginBottom: 2,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              border: `1px solid ${isActive ? 'rgba(124,106,247,0.3)' : 'transparent'}`,
            })}
          >
            <Icon size={17} style={{ flexShrink: 0 }} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Account info */}
      {!collapsed && account && (
        <div style={{
          margin: '0 8px 12px',
          padding: '10px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Logged in as</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {account.email}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '0 8px 16px', padding: '10px',
          borderRadius: 10, border: 'none',
          background: 'transparent', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 14, transition: 'color 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <LogOut size={17} style={{ flexShrink: 0 }} />
        {!collapsed && 'Logout'}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute', top: 24, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, transition: 'all 0.2s',
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}
