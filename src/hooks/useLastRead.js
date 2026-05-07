import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const LOCAL_KEY = 'lastRead'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) } catch { return null }
}

export function useLastRead(user) {
  const [lastRead, setLastRead] = useState(loadLocal)

  useEffect(() => {
    if (!user) {
      setLastRead(loadLocal())
      return
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && snap.data().lastRead) {
        const cloud = snap.data().lastRead
        setLastRead(cloud)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(cloud))
      }
    })

    return unsub
  }, [user?.uid])

  const saveLastRead = useCallback((surah, verseId) => {
    const data = { surah, verseId }
    setLastRead(data)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
    if (user) {
      setDoc(doc(db, 'users', user.uid), { lastRead: data }, { merge: true })
    }
  }, [user?.uid])

  return { lastRead, saveLastRead }
}
