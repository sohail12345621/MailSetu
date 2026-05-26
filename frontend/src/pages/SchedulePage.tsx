import React, { useState, useEffect } from 'react'
import { getSchedules, createSchedule, cancelSchedule, uploadFiles } from '../lib/api'
import RichTextEditor from '../components/RichTextEditor'
import DropZone from '../components/DropZone'
import { Clock, Plus, X, Loader2, CalendarClock, Ban } from 'lucide-react'
import { formatDate, truncate, statusBadgeClass } from '../lib/utils'
import toast from 'react-hot-toast'

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  const load = () => getSchedules().then(r => setSchedules(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!to || !subject || !scheduledAt) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      let attachment_paths: string[] = []
      if (files.length > 0) {
        const up = await uploadFiles(files)
        attachment_paths = up.data.files.map((f: any) => f.path)
      }
      await createSchedule({
        to, subject, html_body: body,
        scheduled_at: new Date(scheduledAt).toISOString(),
        attachment_paths,
      })
      toast.success('Email scheduled!')
      setModal(false); setTo(''); setSubject(''); setBody(''); setScheduledAt(''); setFiles([])
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Scheduling failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (job_id: string) => {
    if (!confirm('Cancel this scheduled email?')) return
    await cancelSchedule(job_id)
    toast.success('Cancelled')
    load()
  }

  // Min datetime (now)
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Scheduled Emails</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Schedule emails to be sent at a specific time</p>
        </div>
        <button id="schedule-btn" className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Schedule Email
        </button>
      </div>

      {/* Scheduled list */}
      {schedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <CalendarClock size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No scheduled emails</p>
          <button className="btn-primary" onClick={() => setModal(true)}><Plus size={15} /> Schedule Email</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {schedules.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(96,180,240,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={18} color="var(--info)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {truncate(s.subject, 50)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  To: {s.to_address} · Scheduled: {formatDate(s.scheduled_at)}
                </div>
              </div>
              <span className={statusBadgeClass(s.status)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                {s.status}
              </span>
              {s.status === 'scheduled' && (
                <button className="btn-danger" onClick={() => handleCancel(s.job_id)}>
                  <Ban size={13} style={{ marginRight: 4 }} /> Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Schedule Email</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">To <span style={{ color: 'var(--error)' }}>*</span></label>
                <input id="sched-to" className="input" placeholder="recipient@example.com" value={to} onChange={e => setTo(e.target.value)} required />
              </div>
              <div>
                <label className="label">Subject <span style={{ color: 'var(--error)' }}>*</span></label>
                <input id="sched-subject" className="input" placeholder="Email subject" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div>
                <label className="label">Schedule Date & Time <span style={{ color: 'var(--error)' }}>*</span></label>
                <input
                  id="sched-datetime"
                  type="datetime-local"
                  className="input"
                  min={minDateTime}
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Message</label>
                <RichTextEditor content={body} onChange={setBody} />
              </div>
              <div>
                <label className="label">Attachments</label>
                <DropZone files={files} onChange={setFiles} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button id="confirm-schedule-btn" type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
                  {saving ? 'Scheduling…' : 'Schedule Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
