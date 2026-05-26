import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getLogs } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Send, Users, CheckCircle2, XCircle, Clock, ScrollText, ChevronRight, Zap } from 'lucide-react'
import { formatDate, truncate, statusBadgeClass } from '../lib/utils'

interface Stats { total: number; sent: number; failed: number; pending: number }

export default function DashboardPage() {
  const { account } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, pending: 0 })
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getLogs(1, 8)]).then(([s, l]) => {
      setStats(s.data)
      setLogs(l.data)
    }).finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { label: 'Total Sent', value: stats.total, icon: Send, color: '#7c6af7', bg: 'rgba(124,106,247,0.12)' },
    { label: 'Successful', value: stats.sent, icon: CheckCircle2, color: '#22d3a0', bg: 'rgba(34,211,160,0.12)' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: '#f06060', bg: 'rgba(240,96,96,0.12)' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: '#f0a960', bg: 'rgba(240,169,96,0.12)' },
  ]

  const QUICK_ACTIONS = [
    { label: 'Send Email', icon: Send, to: '/send', desc: 'Single email with attachments' },
    { label: 'Bulk Send', icon: Users, to: '/bulk', desc: 'Upload CSV, send to many' },
    { label: 'Schedule', icon: Clock, to: '/schedule', desc: 'Send at a later time' },
    { label: 'Templates', icon: ScrollText, to: '/templates', desc: 'Manage email templates' },
  ]

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Zap size={20} color="var(--accent)" />
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>Dashboard</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          Welcome back{account ? `, ${account.email.split('@')[0]}` : ''}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {account?.email} · {account?.smtp_host}:{account?.smtp_port}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                {loading ? '…' : value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {QUICK_ACTIONS.map(({ label, icon: Icon, to, desc }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s', display: 'flex',
                flexDirection: 'column', gap: 8,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Icon size={20} color="var(--accent)" />
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>Recent Activity</h2>
          <button onClick={() => navigate('/logs')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
            View All
          </button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {logs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No emails sent yet. <button onClick={() => navigate('/send')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Send your first email →</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-primary)' }}>{truncate(log.to_address, 30)}</td>
                    <td>{truncate(log.subject, 35)}</td>
                    <td>
                      <span className={`${statusBadgeClass(log.status)}`} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {log.status}
                      </span>
                    </td>
                    <td>{formatDate(log.sent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
