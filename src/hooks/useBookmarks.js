import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const LOCAL_KEY = 'quran_bookmarks'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

function persist(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

export function useBookmarks(user) {
  const [bookmarks, setBookmarks] = useState(loadLocal)
  const [synced, setSynced] = useState(false)
  const didMerge = useRef(false)

  useEffect(() => {
    if (!user) {
      // Signed out — use localStorage only
      setBookmarks(loadLocal())
      setSynced(false)
      didMerge.current = false
      return
    }

    const userDoc = doc(db, 'users', user.uid)

    // On first sign-in: push any local bookmarks up to Firestore (merge, no duplicates)
    if (!didMerge.current) {
      didMerge.current = true
      const local = loadLocal()
      if (local.length > 0) {
        getDoc(userDoc).then(snap => {
          const cloud = snap.exists() ? (snap.data().bookmarks || []) : []
          const cloudRefs = new Set(cloud.map(b => b.ref))
          const toAdd = local.filter(b => !cloudRefs.has(b.ref))
          if (toAdd.length > 0) {
            setDoc(userDoc, { bookmarks: [...cloud, ...toAdd] }, { merge: true })
          }
        })
      }
    }

    // Live-sync from Firestore
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists() && snap.data().bookmarks) {
        const cloud = snap.data().bookmarks
        setBookmarks(cloud)
        persist(cloud)
      }
      setSynced(true)
    })

    return unsub
  }, [user?.uid])

  const writeToFirestore = useCallback((items, uid) => {
    if (uid) setDoc(doc(db, 'users', uid), { bookmarks: items }, { merge: true })
  }, [])

  const isBookmarked = useCallback((ref) => bookmarks.some(b => b.ref === ref), [bookmarks])

  const toggleBookmark = useCallback((verse) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.ref === verse.ref)
      const next = exists
        ? prev.filter(b => b.ref !== verse.ref)
        : [{
            ref: verse.ref,
            arabic: verse.arabic,
            translation: verse.translation,
            surahName: verse.surahName,
            surahId: verse.surahId,
            savedAt: Date.now(),
          }, ...prev]
      persist(next)
      writeToFirestore(next, user?.uid)
      return next
    })
  }, [user?.uid, writeToFirestore])

  const removeBookmark = useCallback((ref) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.ref !== ref)
      persist(next)
      writeToFirestore(next, user?.uid)
      return next
    })
  }, [user?.uid, writeToFirestore])

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, synced }
}
