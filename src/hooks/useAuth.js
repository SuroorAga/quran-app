import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db, ADMIN_EMAILS } from '../firebase'

async function recordUser(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  await setDoc(ref, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastSeen: serverTimestamp(),
    // firstSeen only written once
    ...(snap.exists() ? {} : { firstSeen: serverTimestamp() }),
  }, { merge: true })
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      if (u) recordUser(u).catch(() => {})
    })
    return unsub
  }, [])

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email))

  const signIn = () => signInWithPopup(auth, googleProvider)
  const logOut = () => signOut(auth)

  return { user, loading, isAdmin, signIn, logOut }
}
