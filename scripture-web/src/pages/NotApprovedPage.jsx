import { supabase } from '../supabase.js'

export default function NotApprovedPage({ user }) {
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
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#3d3222', margin: '0 0 12px' }}>
          Access Pending
        </h1>
        <p style={{
          fontSize: 14,
          color: '#8a7a62',
          margin: '0 0 8px',
          fontFamily: "'Instrument Sans', sans-serif",
          lineHeight: 1.6,
        }}>
          You're signed in as <strong>{user.email}</strong>, but your account hasn't been approved yet.
        </p>
        <p style={{
          fontSize: 14,
          color: '#8a7a62',
          margin: '0 0 32px',
          fontFamily: "'Instrument Sans', sans-serif",
          lineHeight: 1.6,
        }}>
          Ask the app owner to approve your email address, then try again.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: '1.5px solid #d4cbb8',
            borderRadius: 10,
            fontSize: 14,
            color: '#8a7a62',
            cursor: 'pointer',
            fontFamily: "'Instrument Sans', sans-serif",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
