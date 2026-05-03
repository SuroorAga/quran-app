import { useState, useEffect } from 'react'

const STORAGE_KEY = 'quran_bookmarks'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])

  const isBookmarked = (ref) => bookmarks.some(b => b.ref === ref)

  const toggleBookmark = (verse) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.ref === verse.ref)
      if (exists) return prev.filter(b => b.ref !== verse.ref)
      return [{
        ref: verse.ref,
        arabic: verse.arabic,
        translation: verse.translation,
        surahName: verse.surahName,
        surahId: verse.surahId,
        savedAt: Date.now()
      }, ...prev]
    })
  }

  const removeBookmark = (ref) => {
    setBookmarks(prev => prev.filter(b => b.ref !== ref))
  }

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark }
}
