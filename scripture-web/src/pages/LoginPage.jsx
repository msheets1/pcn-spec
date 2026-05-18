import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

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
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '48px 40px',
        maxWidth: 380,
        width: '100%',
        boxShadow: '0 8px 40px rgba(44,36,22,0.12)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#3d3222',
          margin: '0 0 8px',
        }}>
          Scripture Memorizer
        </h1>
        <p style={{
          fontSize: 16,
          color: '#8a7a62',
          margin: '0 0 40px',
          fontFamily: "'Instrument Sans', sans-serif",
        }}>
          Hide it in your heart
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            width: '100%',
            padding: '14px 24px',
            background: loading ? '#e0d8cc' : '#fff',
            border: '1.5px solid #e0d8cc',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            color: '#3d3222',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Instrument Sans', sans-serif",
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.15s',
          }}
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

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
          marginTop: 32,
          fontSize: 12,
          color: '#b4a88c',
          fontFamily: "'Instrument Sans', sans-serif",
          lineHeight: 1.5,
        }}>
          This app is invite-only. Sign in with an approved Google account to access your scriptures.
        </p>
      </div>
    </div>
  )
}
