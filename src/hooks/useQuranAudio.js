import { useState, useRef, useEffect, useCallback } from 'react'

export const RECITERS = [
  { id: 'ar.alafasy',             name: 'Mishary Al-Afasy' },
  { id: 'ar.abdurrahmaansudais',  name: 'Abdul Rahman Al-Sudais' },
  { id: 'ar.shaatree',            name: 'Abu Bakr Al-Shatri' },
  { id: 'ar.minshawi',            name: 'Mohamed Al-Minshawi' },
]

export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const CDN = 'https://cdn.islamic.network/quran/audio/128'

const VERSE_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,15,36,30,35,23,11,11,14,11,6,
  22,11,8,6,3,5,4,5,12,5,4,5,5,7,3,6,3,5,4,5,6,5,8,3,4
]

const OFFSETS = VERSE_COUNTS.reduce((acc, count, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + VERSE_COUNTS[i - 1])
  return acc
}, [])

function globalVerseNumber(surahId, verseId) {
  return OFFSETS[surahId - 1] + verseId
}

export function useQuranAudio() {
  const [reciter, setReciter] = useState(() => localStorage.getItem('quranReciter') || 'ar.alafasy')
  const [speed, setSpeed] = useState(() => parseFloat(localStorage.getItem('quranSpeed') || '1'))
  const [playingRef, setPlayingRef] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const audioRef = useRef(null)
  const speedRef = useRef(speed)
  const stateRef = useRef({ surahId: null, verseId: null, verses: [], reciter })

  useEffect(() => { stateRef.current.reciter = reciter }, [reciter])
  useEffect(() => { speedRef.current = speed }, [speed])

  const _playGlobal = useCallback((surahId, verseId, verses, reciterId) => {
    const gn = globalVerseNumber(surahId, verseId)
    const url = `${CDN}/${reciterId}/${gn}.mp3`

    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.pause()
    }

    const audio = new Audio(url)
    audio.playbackRate = speedRef.current
    audioRef.current = audio
    stateRef.current = { surahId, verseId, verses, reciter: reciterId }

    setPlayingRef(`${surahId}:${verseId}`)
    setIsLoading(true)
    setIsPlaying(false)

    audio.oncanplay = () => {
      setIsLoading(false)
      audio.play().catch(() => {})
      setIsPlaying(true)
    }

    audio.onerror = () => { setIsLoading(false); setIsPlaying(false) }

    audio.onended = () => {
      const { surahId: sid, verseId: vid, verses: vs, reciter: rid } = stateRef.current
      const idx = vs.findIndex(v => v.id === vid)
      if (idx !== -1 && idx < vs.length - 1) {
        _playGlobal(sid, vs[idx + 1].id, vs, rid)
      } else {
        setIsPlaying(false)
        setPlayingRef(null)
      }
    }

    audio.onpause = () => setIsPlaying(false)
    audio.onplay  = () => setIsPlaying(true)
  }, [])

  const play = useCallback((surahId, verseId, verses) => {
    _playGlobal(surahId, verseId, verses, stateRef.current.reciter)
  }, [_playGlobal])

  const toggle = useCallback((surahId, verseId, verses) => {
    const ref = `${surahId}:${verseId}`
    if (playingRef === ref) {
      if (isPlaying) audioRef.current?.pause()
      else audioRef.current?.play().catch(() => {})
    } else {
      play(surahId, verseId, verses)
    }
  }, [playingRef, isPlaying, play])

  const playNext = useCallback(() => {
    const { surahId, verseId, verses, reciter: rid } = stateRef.current
    const idx = verses.findIndex(v => v.id === verseId)
    if (idx !== -1 && idx < verses.length - 1)
      _playGlobal(surahId, verses[idx + 1].id, verses, rid)
  }, [_playGlobal])

  const playPrev = useCallback(() => {
    const { surahId, verseId, verses, reciter: rid } = stateRef.current
    const idx = verses.findIndex(v => v.id === verseId)
    if (idx > 0) _playGlobal(surahId, verses[idx - 1].id, verses, rid)
  }, [_playGlobal])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setPlayingRef(null)
  }, [])

  const changeReciter = useCallback((id) => {
    setReciter(id)
    localStorage.setItem('quranReciter', id)
    stop()
  }, [stop])

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(speedRef.current)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    speedRef.current = next
    localStorage.setItem('quranSpeed', next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }, [])

  useEffect(() => () => { audioRef.current?.pause() }, [])

  return { playingRef, isPlaying, isLoading, reciter, speed, toggle, playNext, playPrev, stop, changeReciter, cycleSpeed }
}
