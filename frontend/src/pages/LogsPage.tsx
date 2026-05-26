import React, { useEffect, useState } from 'react'
import { getLogs, deleteLog, getStats } from '../lib/api'
import { Trash2, RefreshCw, Search, Filter } from 'lucide-react'
import { formatDate, truncate, statusBadgeClass } from '../lib/utils'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'sent', 'failed', 'pending']

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 })

  const load = async () => {
    setLoading(true)
    try {
      const [l, s] = await Promise.all([
        getLogs(page, 50, status === 'all' ? undefined : status),
        getStats(),
      ])
      setLogs(l.data)
      setStats(s.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status, page])

  const handleDelete = async (id: number) => {
    await deleteLog(id)
    toast.success('Log deleted')
    load()
  }

  const filtered = search
    ? logs.filter(l => l.to_address.includes(search) || l.subject.toLowerCase().includes(search.toLowerCase()))
    : logs

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Email Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {stats.total} total · {stats.sent} sent · {stats.failed} failed
          </p>
        </div>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: '1px solid', transition: 'all 0.2s',
                background: status === s ? 'var(--accent-glow)' : 'var(--bg-card)',
                borderColor: status === s ? 'var(--accent)' : 'var(--border)',
                color: status === s ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="log-search"
            className="input"
            style={{ paddingLeft: 32, width: 220 }}
            placeholder="Search email or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Loading…' : 'No logs found'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>To</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Type</th>
                <th>Retries</th>
                <th>Sent At</th>
                <th>Error</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{log.id}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{truncate(log.to_address, 28)}</td>
                  <td>{truncate(log.subject, 32)}</td>
                  <td>
                    <span className={statusBadgeClass(log.status)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {log.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: log.is_bulk ? 'rgba(96,180,240,0.12)' : 'rgba(124,106,247,0.12)', color: log.is_bulk ? 'var(--info)' : 'var(--accent)' }}>
                      {log.is_bulk ? 'Bulk' : 'Single'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{log.retries}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(log.sent_at)}</td>
                  <td style={{ fontSize: 12, color: 'var(--error)', maxWidth: 180 }}>{log.error_message ? truncate(log.error_message, 40) : '—'}</td>
                  <td>
                    <button className="btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(log.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        <button className="btn-secondary" style={{ padding: '6px 16px' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
        <span style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Page {page}</span>
        <button className="btn-secondary" style={{ padding: '6px 16px' }} onClick={() => setPage(p => p + 1)} disabled={logs.length < 50}>Next →</button>
      </div>
    </div>
  )
}
