import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, App.jsx auth listener picks up the new session automatically
  }

  const cardStyle = {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    maxWidth: 380,
    width: '100%',
    boxShadow: '0 8px 40px rgba(44,36,22,0.12)',
    textAlign: 'center',
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    border: '1.5px solid #e0d8cc',
    borderRadius: 12,
    fontSize: 15,
    color: '#3d3222',
    fontFamily: "'Instrument Sans', sans-serif",
    background: '#faf8f5',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: 12,
  }

  const btnStyle = (disabled) => ({
    width: '100%',
    padding: '14px 24px',
    background: disabled ? '#e0d8cc' : '#3d3222',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: disabled ? '#9a8e7e' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Instrument Sans', sans-serif",
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(168deg, #f5f0e8 0%, #ebe4d8 40%, #e0d6c4 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Crimson Pro', Georgia, serif",
      padding: 24,
    }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#3d3222', margin: '0 0 8px' }}>
          Scripture Memorizer
        </h1>
        <p style={{
          fontSize: 16,
          color: '#8a7a62',
          margin: '0 0 32px',
          fontFamily: "'Instrument Sans', sans-serif",
        }}>
          Hide it in your heart
        </p>

        {step === 'email' ? (
          <form onSubmit={sendOtp}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="submit" disabled={loading || !email} style={btnStyle(loading || !email)}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <p style={{
              fontSize: 13,
              color: '#8a7a62',
              margin: '0 0 16px',
              fontFamily: "'Instrument Sans', sans-serif",
            }}>
              Check <strong>{email}</strong> for a 6-digit code.
            </p>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              inputMode="numeric"
              style={{ ...inputStyle, letterSpacing: '0.2em', textAlign: 'center', fontSize: 20 }}
            />
            <button type="submit" disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null) }}
              style={{
                marginTop: 10,
                background: 'none',
                border: 'none',
                fontSize: 13,
                color: '#8a7a62',
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        {error && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            borderRadius: 8,
            fontSize: 13,
            color: '#c0392b',
            fontFamily: "'Instrument Sans', sans-serif",
          }}>
            {error}
          </div>
        )}

        <p style={{
          marginTop: 28,
          fontSize: 12,
          color: '#b4a88c',
          fontFamily: "'Instrument Sans', sans-serif",
          lineHeight: 1.5,
        }}>
          This app is invite-only. Sign in with an approved email to access your scriptures.
        </p>
      </div>
    </div>
  )
}
