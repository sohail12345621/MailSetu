import React, { useState } from 'react'
import { sendBulk, uploadFiles } from '../lib/api'
import RichTextEditor from '../components/RichTextEditor'
import DropZone from '../components/DropZone'
import { Send, Loader2, CheckCircle2, XCircle, Info, Plus, Trash2, UserPlus } from 'lucide-react'
import { statusBadgeClass } from '../lib/utils'
import toast from 'react-hot-toast'

interface ContactRow {
  email: string
  name: string
  company: string
}

const emptyRow = (): ContactRow => ({ email: '', name: '', company: '' })

export default function BulkSendPage() {
  const [rows, setRows] = useState<ContactRow[]>([emptyRow()])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[]>([])

  /* ── row helpers ── */
  const updateRow = (i: number, field: keyof ContactRow, val: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const addRow = () => setRows(r => [...r, emptyRow()])

  const removeRow = (i: number) =>
    setRows(r => r.length === 1 ? [emptyRow()] : r.filter((_, idx) => idx !== i))

  /* paste multiple emails at once into the email field */
  const handleEmailPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    const parts = pasted.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
    if (parts.length <= 1) return          // single address → normal paste
    e.preventDefault()
    setRows(prev => {
      const next = [...prev]
      next[i] = { ...next[i], email: parts[0] }
      const newRows: ContactRow[] = parts.slice(1).map(em => ({ email: em, name: '', company: '' }))
      next.splice(i + 1, 0, ...newRows)
      return next
    })
    toast.success(`Added ${parts.length} emails`)
  }

  /* ── send ── */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const contacts = rows.filter(r => r.email.trim())
    if (!contacts.length) { toast.error('Add at least one email address'); return }

    // basic email validation
    const invalid = contacts.find(c => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
    if (invalid) { toast.error(`Invalid email: ${invalid.email}`); return }

    setSending(true)
    setProgress(0)
    setResults([])
    try {
      let attachment_paths: string[] = []
      if (files.length > 0) {
        const up = await uploadFiles(files)
        attachment_paths = up.data.files.map((f: any) => f.path)
      }
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

  const validCount = rows.filter(r => r.email.trim()).length

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Bulk Email Sender</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Enter email addresses below and send personalized emails to all of them at once
        </p>
      </div>

      {/* Variable hint */}
      <div style={{ padding: '12px 16px', background: 'rgba(96,180,240,0.08)', border: '1px solid rgba(96,180,240,0.2)', borderRadius: 10, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={15} color="var(--info)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Use <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 12 }}>{'{{name}}'}</code>{' '}
          <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 12 }}>{'{{company}}'}</code>{' '}
          in subject / body to personalize each email. You can also <strong>paste multiple emails</strong> (comma or newline separated) into any email field.
        </p>
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Recipient table ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label className="label" style={{ margin: 0 }}>
              Recipients&nbsp;
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                ({validCount} email{validCount !== 1 ? 's' : ''} ready)
              </span>
            </label>
            <button type="button" className="btn-secondary" onClick={addRow} style={{ gap: 6, padding: '6px 14px', fontSize: 13 }}>
              <UserPlus size={14} /> Add Row
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 160px 36px',
              gap: 0,
              background: 'var(--bg-hover)',
              borderBottom: '1px solid var(--border)',
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <span>Email Address *</span>
              <span>Name</span>
              <span>Company</span>
              <span />
            </div>

            {/* rows */}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 160px 36px',
                    gap: 0,
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    padding: '6px 10px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <input
                    className="input"
                    type="email"
                    placeholder="recipient@example.com"
                    value={row.email}
                    onChange={e => updateRow(i, 'email', e.target.value)}
                    onPaste={e => handleEmailPaste(i, e)}
                    style={{ margin: '0 4px 0 0', fontSize: 13, padding: '6px 10px', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Name"
                    value={row.name}
                    onChange={e => updateRow(i, 'name', e.target.value)}
                    style={{ margin: '0 4px', fontSize: 13, padding: '6px 10px', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Company"
                    value={row.company}
                    onChange={e => updateRow(i, 'company', e.target.value)}
                    style={{ margin: '0 4px', fontSize: 13, padding: '6px 10px', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    title="Remove row"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* add row shortcut */}
            <button
              type="button"
              onClick={addRow}
              style={{
                width: '100%', background: 'none', border: 'none', borderTop: '1px dashed var(--border)',
                padding: '9px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <Plus size={13} /> Add another recipient
            </button>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="label">Subject <span style={{ color: 'var(--error)' }}>*</span></label>
          <input id="bulk-subject" className="input" placeholder="Hello {{name}}, here's your update…" value={subject} onChange={e => setSubject(e.target.value)} required />
        </div>

        {/* Body */}
        <div>
          <label className="label">Email Body</label>
          <RichTextEditor content={body} onChange={setBody} placeholder="Dear {{name}}, ..." />
        </div>

        {/* Attachments */}
        <div>
          <label className="label">Attachments (sent to all)</label>
          <DropZone files={files} onChange={setFiles} />
        </div>

        {/* Progress */}
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
          {sending ? 'Sending…' : `Send to ${validCount || '…'} Contact${validCount !== 1 ? 's' : ''}`}
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
