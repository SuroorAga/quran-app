import { useState, useEffect } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db, ADMIN_EMAILS } from '../firebase'

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

async function recordUser(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  await setDoc(ref, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastSeen: serverTimestamp(),
    ...(snap.exists() ? {} : { firstSeen: serverTimestamp() }),
  }, { merge: true })
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle redirect result when returning from Google sign-in on mobile
    getRedirectResult(auth)
      .then(result => { if (result?.user) recordUser(result.user).catch(() => {}) })
      .catch(() => {})

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      if (u) recordUser(u).catch(() => {})
    })
    return unsub
  }, [])

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email))

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // Popup blocked or closed — fall back to redirect (works on all mobile browsers)
      if (e.code === 'auth/popup-blocked' ||
          e.code === 'auth/popup-closed-by-user' ||
          e.code === 'auth/cancelled-popup-request') {
        signInWithRedirect(auth, googleProvider)
      }
    }
  }

  const logOut = () => signOut(auth)

  return { user, loading, isAdmin, signIn, logOut }
}
