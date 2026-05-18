import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { checkUserApproved, loadUserData, saveUserData } from './db.js'
import LoginPage from './pages/LoginPage.jsx'
import NotApprovedPage from './pages/NotApprovedPage.jsx'
import ScriptureApp from './ScriptureApp.jsx'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [approved, setApproved] = useState(null)    // null = checking
  const [userData, setUserData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  // Watch auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // When session changes, check approval and load data
  useEffect(() => {
    if (!session) {
      setApproved(null)
      setUserData(null)
      return
    }

    const init = async () => {
      const isApproved = await checkUserApproved(session.user.email)
      setApproved(isApproved)

      if (isApproved) {
        setDataLoading(true)
        const data = await loadUserData(session.user.id)
        setUserData(data)
        setDataLoading(false)
      }
    }

    init()
  }, [session?.user?.id])

  // Persist data to Supabase whenever it changes
  const persist = async (newData) => {
    setUserData(newData)
    await saveUserData(session.user.id, newData)
  }

  // Loading
  if (session === undefined || (session && approved === null)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(168deg, #f5f0e8 0%, #ebe4d8 40%, #e0d6c4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 48 }}>📖</div>
      </div>
    )
  }

  // Not signed in
  if (!session) return <LoginPage />

  // Signed in but not approved
  if (!approved) return <NotApprovedPage user={session.user} />

  // Approved — show app
  return (
    <ScriptureApp
      session={session}
      initialData={userData}
      dataLoading={dataLoading}
      persist={persist}
    />
  )
}
