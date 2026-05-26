import React, { useState, useEffect } from 'react'
import { sendEmail, uploadFiles, getTemplates } from '../lib/api'
import RichTextEditor from '../components/RichTextEditor'
import DropZone from '../components/DropZone'
import { Send, Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SendEmailPage() {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [showCC, setShowCC] = useState(false)

  useEffect(() => {
    getTemplates().then(r => setTemplates(r.data)).catch(() => {})
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let attachment_paths: string[] = []
      if (files.length > 0) {
        const up = await uploadFiles(files)
        attachment_paths = up.data.files.map((f: any) => f.path)
      }
      await sendEmail({ to, cc: cc || null, bcc: bcc || null, subject, html_body: body, attachment_paths })
      toast.success('Email sent successfully! ✉️')
      setTo(''); setCc(''); setBcc(''); setSubject(''); setBody(''); setFiles([])
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === Number(id))
    if (tpl) { setSubject(tpl.subject); setBody(tpl.html_body) }
  }

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Send Email</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Compose and send a rich HTML email</p>
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Template selector */}
        {templates.length > 0 && (
          <div>
            <label className="label">Load Template</label>
            <div style={{ position: 'relative' }}>
              <select
                id="template-select"
                className="input"
                onChange={e => loadTemplate(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select a template…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* To */}
        <div>
          <label className="label">To <span style={{ color: 'var(--error)' }}>*</span></label>
          <input id="to-input" className="input" type="text" placeholder="recipient@example.com, another@example.com" value={to} onChange={e => setTo(e.target.value)} required />
        </div>

        {/* CC/BCC toggle */}
        <button type="button" onClick={() => setShowCC(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronDown size={14} style={{ transform: showCC ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          {showCC ? 'Hide' : 'Add'} CC / BCC
        </button>

        {showCC && (
          <div style={{ display: 'flex', gap: 12 }} className="animate-fade-in">
            <div style={{ flex: 1 }}>
              <label className="label">CC</label>
              <input id="cc-input" className="input" placeholder="cc@example.com" value={cc} onChange={e => setCc(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">BCC</label>
              <input id="bcc-input" className="input" placeholder="bcc@example.com" value={bcc} onChange={e => setBcc(e.target.value)} />
            </div>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="label">Subject <span style={{ color: 'var(--error)' }}>*</span></label>
          <input id="subject-input" className="input" placeholder="Enter email subject" value={subject} onChange={e => setSubject(e.target.value)} required />
        </div>

        {/* Body */}
        <div>
          <label className="label">Message <span style={{ color: 'var(--error)' }}>*</span></label>
          <RichTextEditor content={body} onChange={setBody} />
        </div>

        {/* Attachments */}
        <div>
          <label className="label">Attachments</label>
          <DropZone files={files} onChange={setFiles} />
        </div>

        {/* Send button */}
        <button id="send-btn" type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'Sending…' : 'Send Email'}
        </button>
      </form>
    </div>
  )
}
