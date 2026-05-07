import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider, ADMIN_EMAILS } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email))

  const signIn = () => signInWithPopup(auth, googleProvider)
  const logOut = () => signOut(auth)

  return { user, loading, isAdmin, signIn, logOut }
}
