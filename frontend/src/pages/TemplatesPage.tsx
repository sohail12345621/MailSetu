import React, { useState, useEffect } from 'react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../lib/api'
import RichTextEditor from '../components/RichTextEditor'
import { Plus, Edit2, Trash2, FileText, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Template { id: number; name: string; subject: string; html_body: string; created_at: string }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => getTemplates().then(r => setTemplates(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setName(''); setSubject(''); setBody(''); setEditing(null); setModal('create') }
  const openEdit = (tpl: Template) => { setName(tpl.name); setSubject(tpl.subject); setBody(tpl.html_body); setEditing(tpl); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const handleSave = async () => {
    if (!name || !subject) { toast.error('Name and subject are required'); return }
    setSaving(true)
    try {
      if (modal === 'create') {
        await createTemplate({ name, subject, html_body: body })
        toast.success('Template created!')
      } else if (editing) {
        await updateTemplate(editing.id, { name, subject, html_body: body })
        toast.success('Template updated!')
      }
      await load()
      closeModal()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return
    await deleteTemplate(id)
    toast.success('Deleted')
    load()
  }

  return (
    <div className="animate-fade-in" style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Email Templates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Create reusable templates for quick email composition</p>
        </div>
        <button id="create-template-btn" className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No templates yet</p>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Create your first email template</p>
          <button className="btn-primary" onClick={openCreate}><Plus size={15} /> Create Template</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {templates.map(tpl => (
            <div
              key={tpl.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.subject}</div>
                </div>
                <FileText size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
              </div>
              <div style={{
                fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
                dangerouslySetInnerHTML={{ __html: tpl.html_body.replace(/<[^>]*>/g, ' ').slice(0, 150) }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '7px' }} onClick={() => openEdit(tpl)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(tpl.id)} style={{ padding: '7px 12px' }}>
                  <Trash2 size={13} />
                </button>
              </div>
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
          <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{modal === 'create' ? 'New Template' : 'Edit Template'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Template Name</label>
                <input id="template-name" className="input" placeholder="e.g. Welcome Email" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Subject</label>
                <input id="template-subject" className="input" placeholder="Email subject line" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="label">Body</label>
                <RichTextEditor content={body} onChange={setBody} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button id="save-template-btn" className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
