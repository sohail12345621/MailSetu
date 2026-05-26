import React, { useState, useRef } from 'react'
import { parseCsv, sendBulk, uploadFiles } from '../lib/api'
import RichTextEditor from '../components/RichTextEditor'
import DropZone from '../components/DropZone'
import { Upload, Send, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react'
import { statusBadgeClass } from '../lib/utils'
import toast from 'react-hot-toast'

export default function BulkSendPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[]>([])
  const [csvLoaded, setCsvLoaded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const r = await parseCsv(file)
      setContacts(r.data.contacts)
      setCsvLoaded(true)
      toast.success(`Loaded ${r.data.count} contacts`)
    } catch {
      toast.error('Failed to parse CSV. Check format.')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contacts.length) { toast.error('Upload a CSV first'); return }
    setSending(true)
    setProgress(0)
    setResults([])
    try {
      let attachment_paths: string[] = []
      if (files.length > 0) {
        const up = await uploadFiles(files)
        attachment_paths = up.data.files.map((f: any) => f.path)
      }
      // Simulate progress (real bulk sends are server-side)
      const interval = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 300)
      const r = await sendBulk({ contacts, subject, html_body: body, attachment_paths })
      clearInterval(interval)
      setProgress(100)
      setResults(r.data.results)
      toast.success(`Sent: ${r.data.sent} ✓  Failed: ${r.data.failed} ✗`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Bulk send failed')
    } finally {
      setSending(false)
    }
  }

  const columns = contacts.length > 0 ? Object.keys(contacts[0]) : []

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Bulk Email Sender</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Upload a CSV and send personalized emails to hundreds of contacts</p>
      </div>

      {/* Variable hint */}
      <div style={{ padding: '12px 16px', background: 'rgba(96,180,240,0.08)', border: '1px solid rgba(96,180,240,0.2)', borderRadius: 10, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={15} color="var(--info)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Use <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 12 }}>{'{{name}}'}</code> <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 12 }}>{'{{company}}'}</code> etc. in subject/body to personalize using CSV columns.
        </p>
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* CSV Upload */}
        <div>
          <label className="label">Contact List (CSV)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={15} /> Upload CSV
            </button>
            {csvLoaded && (
              <span style={{ fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> {contacts.length} contacts loaded
              </span>
            )}
          </div>
        </div>

        {/* Preview table */}
        {contacts.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'auto', maxHeight: 220 }}>
            <table className="data-table">
              <thead>
                <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {contacts.slice(0, 5).map((row, i) => (
                  <tr key={i}>{columns.map(c => <td key={c}>{row[c]}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {contacts.length > 5 && (
              <p style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                …and {contacts.length - 5} more rows
              </p>
            )}
          </div>
        )}

        <div>
          <label className="label">Subject <span style={{ color: 'var(--error)' }}>*</span></label>
          <input id="bulk-subject" className="input" placeholder="Hello {{name}}, here's your update…" value={subject} onChange={e => setSubject(e.target.value)} required />
        </div>

        <div>
          <label className="label">Email Body</label>
          <RichTextEditor content={body} onChange={setBody} placeholder="Dear {{name}}, ..." />
        </div>

        <div>
          <label className="label">Attachments (sent to all)</label>
          <DropZone files={files} onChange={setFiles} />
        </div>

        {/* Progress bar */}
        {sending && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Sending…</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button id="bulk-send-btn" type="submit" className="btn-primary" disabled={sending} style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Sending…' : `Send to ${contacts.length || '…'} Contacts`}
        </button>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: 32 }} className="animate-fade-in">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Send Results</h2>
          <div className="card" style={{ padding: 0, overflow: 'auto', maxHeight: 300 }}>
            <table className="data-table">
              <thead>
                <tr><th>Email</th><th>Status</th><th>Error</th></tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-primary)' }}>{r.email}</td>
                    <td>
                      <span className={statusBadgeClass(r.status)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {r.status === 'sent' ? <><CheckCircle2 size={10} style={{ display: 'inline', marginRight: 4 }} />sent</> : <><XCircle size={10} style={{ display: 'inline', marginRight: 4 }} />failed</>}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--error)' }}>{r.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
