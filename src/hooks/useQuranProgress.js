import { useState, useCallback } from 'react'

const KEY = 'quranProgress'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function useQuranProgress() {
  const [progress, setProgress] = useState(load)

  const updateProgress = useCallback((surahId, verseId) => {
    setProgress(prev => {
      const current = prev[surahId] || 0
      if (verseId <= current) return prev
      const next = { ...prev, [surahId]: verseId }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getPercent = useCallback((surahId, totalVerses) => {
    if (!totalVerses) return 0
    const highest = progress[surahId] || 0
    return Math.min(100, Math.round((highest / totalVerses) * 100))
  }, [progress])

  const resetProgress = useCallback(() => {
    localStorage.removeItem(KEY)
    setProgress({})
  }, [])

  return { updateProgress, getPercent, resetProgress }
}
