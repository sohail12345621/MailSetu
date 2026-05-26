import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Server, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [host, setHost] = useState('smtp.gmail.com')
  const [port, setPort] = useState(587)
  const [loading, setLoading] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password, host, port)
      toast.success('Logged in successfully!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top left, rgba(124,106,247,0.15) 0%, var(--bg-primary) 60%)',
      padding: 24,
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'fixed', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7c6af7, #60b4f0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(124,106,247,0.4)',
          }}>
            <Mail size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Mail<span className="gradient-text">Setu</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Automated Email Sender</p>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Use your Gmail + App Password</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="email-input"
                  type="email"
                  className="input"
                  style={{ paddingLeft: 36 }}
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label">App Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="password-input"
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Advanced SMTP */}
            <button
              type="button"
              onClick={() => setAdvanced(a => !a)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              {advanced ? '▾' : '▸'} Advanced SMTP settings
            </button>

            {advanced && (
              <div style={{ display: 'flex', gap: 10 }} className="animate-fade-in">
                <div style={{ flex: 1 }}>
                  <label className="label">SMTP Host</label>
                  <div style={{ position: 'relative' }}>
                    <Server size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input" style={{ paddingLeft: 30, fontSize: 13 }} value={host} onChange={e => setHost(e.target.value)} />
                  </div>
                </div>
                <div style={{ width: 80 }}>
                  <label className="label">Port</label>
                  <input className="input" type="number" value={port} onChange={e => setPort(Number(e.target.value))} />
                </div>
              </div>
            )}

            <button id="login-btn" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, justifyContent: 'center', padding: '13px' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: 20, padding: '12px 14px',
            background: 'rgba(124,106,247,0.08)', borderRadius: 10,
            border: '1px solid rgba(124,106,247,0.2)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 <strong>Gmail App Password:</strong> Enable 2FA → Google Account → Security → App Passwords
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
