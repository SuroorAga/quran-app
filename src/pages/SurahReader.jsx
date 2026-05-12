import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './SurahReader.module.css'
import { useQuranAudio, RECITERS } from '../hooks/useQuranAudio.js'

const EN_SIZES = ['13px', '15px', '17px', '19px', '22px', '27px', '33px']
const AR_SIZES = ['20px', '24px', '28px', '33px', '38px', '46px', '56px']

export default function SurahReader({ surah, onBack, bookmarks, onSaveLastRead, initialVerseId, chapters = [], onNavigate, onGoHome }) {
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesVisible, setNotesVisible] = useState(true)
  const [hiddenNotes, setHiddenNotes] = useState(new Set())
  const [jumpVal, setJumpVal] = useState('')
  const [fontScale, setFontScale] = useState(() => parseInt(localStorage.getItem('fontScale') || '2'))
  const [copiedRef, setCopiedRef] = useState(null)
  const [highlightedRef, setHighlightedRef] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [refSheet, setRefSheet] = useState(null)
  const [refVerseData, setRefVerseData] = useState(null)
  const [refLoading, setRefLoading] = useState(false)
  const [showReciterPicker, setShowReciterPicker] = useState(false)
  const contentRef = useRef(null)
  const verseJumpTimer = useRef(null)

  const audio = useQuranAudio()

  const prevSurah = chapters.find(c => c.id === surah.id - 1)
  const nextSurah = chapters.find(c => c.id === surah.id + 1)

  useEffect(() => {
    localStorage.setItem('fontScale', fontScale)
  }, [fontScale])

  useEffect(() => {
    setLoading(true)
    setVerses([])
    setHiddenNotes(new Set())
    fetch(`/data/surah_${surah.id}.json`)
      .then(r => r.json())
      .then(data => { setVerses(data); setLoading(false) })
  }, [surah.id])

  // Scroll to resume position once verses load
  useEffect(() => {
    if (!loading && initialVerseId) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${surah.id}-${initialVerseId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }, [loading, initialVerseId])

  // Auto-scroll to playing verse
  useEffect(() => {
    if (!audio.playingRef) return
    const [, vid] = audio.playingRef.split(':').map(Number)
    const el = document.getElementById(`verse-${surah.id}-${vid}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [audio.playingRef, surah.id])

  // Track last visible verse for resume reading + scroll-to-top button
  useEffect(() => {
    const el = contentRef.current
    if (!el || !verses.length) return
    let timer
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 300)
      clearTimeout(timer)
      timer = setTimeout(() => {
        const cards = el.querySelectorAll('[data-verse-id]')
        for (const card of cards) {
          const rect = card.getBoundingClientRect()
          if (rect.top >= 0 && rect.top < window.innerHeight * 0.6) {
            onSaveLastRead(surah, parseInt(card.dataset.verseId))
            break
          }
        }
      }, 600)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => { el.removeEventListener('scroll', handleScroll); clearTimeout(timer) }
  }, [verses, surah])

  const toggleAllNotes = () => {
    if (notesVisible) {
      setHiddenNotes(new Set(verses.map(v => v.ref)))
      setNotesVisible(false)
    } else {
      setHiddenNotes(new Set())
      setNotesVisible(true)
    }
  }

  const toggleOneNote = (ref) => {
    setHiddenNotes(prev => {
      const next = new Set(prev)
      if (next.has(ref)) next.delete(ref)
      else next.add(ref)
      return next
    })
  }

  const scrollToVerse = useCallback((n) => {
    const el = document.getElementById(`verse-${surah.id}-${n}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const ref = verses.find(v => v.id === n)?.ref
      if (ref) {
        setHighlightedRef(ref)
        setTimeout(() => setHighlightedRef(null), 1800)
      }
    }
  }, [surah.id, verses])

  const handleVerseChange = (val) => {
    setJumpVal(val)
    clearTimeout(verseJumpTimer.current)
    const n = parseInt(val)
    if (n >= 1 && n <= surah.total_verses) {
      verseJumpTimer.current = setTimeout(() => scrollToVerse(n), 400)
    }
  }

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyVerse = (verse) => {
    const parts = [verse.arabic, verse.transliteration, verse.translation].filter(Boolean)
    navigator.clipboard.writeText(parts.join('\n\n')).then(() => {
      setCopiedRef(verse.ref)
      setTimeout(() => setCopiedRef(null), 1500)
    })
  }

  const navigateTo = (target) => {
    if (!target || !onNavigate) return
    contentRef.current?.scrollTo({ top: 0 })
    onNavigate(target)
  }

  const openRefSheet = (ref) => {
    const match = ref.match(/^(\d+):(\d+)(?:-(\d+))?$/)
    if (!match) return
    const surahId = parseInt(match[1])
    const startVerse = parseInt(match[2])
    const endVerse = match[3] ? parseInt(match[3]) : startVerse
    setRefSheet({ surahId, startVerse, endVerse, ref })
    setRefVerseData(null)
    setRefLoading(true)
    fetch(`/data/surah_${surahId}.json`)
      .then(r => r.json())
      .then(data => {
        const verses = data.filter(v => v.id >= startVerse && v.id <= endVerse)
        setRefVerseData(verses.length ? verses : null)
        setRefLoading(false)
      })
  }

  const closeRefSheet = () => {
    setRefSheet(null)
    setRefVerseData(null)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10l5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        {onGoHome && (
          <button className={styles.homeBtn} onClick={onGoHome} title="Go to home">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 18v-5h6v5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>{surah.transliteration} · {surah.name}</div>
          <div className={styles.headerSub}>Chapter {surah.id} · {surah.total_verses} verses · {surah.type === 'meccan' ? 'Meccan' : 'Medinan'}</div>
        </div>
        <div className={styles.fontControls}>
          <button
            className={styles.fontBtn}
            onClick={() => setFontScale(s => Math.max(0, s - 1))}
            disabled={fontScale === 0}
            title="Decrease font size"
          >A−</button>
          <button
            className={styles.fontBtn}
            onClick={() => setFontScale(s => Math.min(6, s + 1))}
            disabled={fontScale === 6}
            title="Increase font size"
          >A+</button>
        </div>
      </div>

      {/* Controls bar */}
      <div className={styles.controlBar}>
        <div className={styles.controlsLeft}>
          <select
            className={styles.surahSelect}
            value={surah.id}
            onChange={e => {
              const target = chapters.find(c => c.id === parseInt(e.target.value))
              if (target) navigateTo(target)
            }}
            title="Jump to surah"
          >
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>
                {ch.id}. {ch.transliteration}
              </option>
            ))}
          </select>
          <div className={styles.jumpDivider} />
          <input
            className={styles.jumpInput}
            type="number"
            min="1"
            max={surah.total_verses}
            placeholder={`Verse 1–${surah.total_verses}`}
            value={jumpVal}
            onChange={e => handleVerseChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                clearTimeout(verseJumpTimer.current)
                const n = parseInt(jumpVal)
                if (n >= 1 && n <= surah.total_verses) scrollToVerse(n)
                setJumpVal('')
              }
            }}
            title="Jump to verse"
          />
        </div>
        <div className={styles.notesToggleWrap}>
          <span className={styles.notesLabel}>Notes</span>
          <button
            className={`${styles.toggle} ${notesVisible ? styles.toggleOn : ''}`}
            onClick={toggleAllNotes}
            title={notesVisible ? 'Hide all notes' : 'Show all notes'}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
      </div>

      {/* Verses */}
      <div className={styles.content} ref={contentRef}>
        {/* Bismillah */}
        {surah.id !== 9 && (
          <div className={styles.bismillah}>
            <span className={styles.bismillahAr}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span className={styles.bismillahEn}>In the Name of Allah, the Gracious, the Merciful</span>
          </div>
        )}

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Loading {surah.transliteration}…
          </div>
        )}

        {verses.map(verse => {
          const hasTafsir = !!verse.translation
          const hasNotes = !!verse.notes
          const noteHidden = hiddenNotes.has(verse.ref)
          const isCopied = copiedRef === verse.ref
          const isHighlighted = highlightedRef === verse.ref

          return (
            <div
              key={verse.ref}
              id={`verse-${surah.id}-${verse.id}`}
              data-verse-id={verse.id}
              className={`${styles.verseCard} ${isHighlighted ? styles.verseCardHighlight : ''} ${audio.playingRef === verse.ref ? styles.verseCardPlaying : ''}`}
            >
              <div className={styles.verseTop}>
                <div className={styles.verseTopLeft}>
                  <span className={styles.verseBadge}>{verse.ref}</span>
                  <button
                    className={`${styles.playBtn} ${audio.playingRef === verse.ref ? styles.playBtnActive : ''}`}
                    onClick={() => audio.toggle(surah.id, verse.id, verses)}
                    title={audio.playingRef === verse.ref && audio.isPlaying ? 'Pause' : 'Play'}
                  >
                    {audio.playingRef === verse.ref && audio.isLoading
                      ? <span className={styles.playSpinner} />
                      : audio.playingRef === verse.ref && audio.isPlaying
                        ? <PauseIcon />
                        : <PlayIcon />
                    }
                  </button>
                </div>
                <div className={styles.verseBtns}>
                  <button
                    className={`${styles.saveBtn} ${bookmarks.isBookmarked(verse.ref) ? styles.saveBtnActive : ''}`}
                    onClick={() => bookmarks.toggleBookmark({ ...verse, surahName: surah.transliteration, surahId: surah.id })}
                  >
                    {bookmarks.isBookmarked(verse.ref) ? '✓ Saved' : 'Save'}
                  </button>
                  <button
                    className={`${styles.copyBtn} ${isCopied ? styles.copyBtnDone : ''}`}
                    onClick={() => copyVerse(verse)}
                  >
                    {isCopied ? '✓ Copied' : 'Copy'}
                  </button>
                  {hasNotes && (
                    <button
                      className={styles.noteToggleBtn}
                      onClick={() => toggleOneNote(verse.ref)}
                    >
                      {noteHidden ? 'Note' : 'Hide'}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.arabic} style={{ fontSize: AR_SIZES[fontScale] }}>
                {verse.arabic}
              </div>

              <div className={styles.transliteration} style={{ fontSize: EN_SIZES[fontScale] }}>
                {verse.transliteration}
              </div>

              {hasTafsir && (
                <div className={styles.translation} style={{ fontSize: EN_SIZES[fontScale] }}>
                  {verse.translation}
                </div>
              )}

              {hasNotes && !noteHidden && (
                <div className={styles.notesBox}>
                  <div className={styles.notesBoxLabel}>Mohammad Shafi's Note</div>
                  <div className={styles.notesText} style={{ fontSize: EN_SIZES[fontScale] }}>
                    {verse.notes.split('\n\n').filter(Boolean).map((para, i) => (
                      <div key={i} className={styles.notePara}>
                        <span className={styles.noteBullet}>•</span>
                        <span>{renderNoteText(para, openRefSheet)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Prev / Next surah navigation */}
        {!loading && (prevSurah || nextSurah) && (
          <div className={styles.surahNav}>
            <button
              className={styles.surahNavBtn}
              onClick={() => navigateTo(prevSurah)}
              disabled={!prevSurah}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M12 5L7 10l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>
                <span className={styles.surahNavLabel}>Previous</span>
                <span className={styles.surahNavName}>{prevSurah ? `${prevSurah.id}. ${prevSurah.transliteration}` : ''}</span>
              </span>
            </button>
            <button
              className={`${styles.surahNavBtn} ${styles.surahNavBtnNext}`}
              onClick={() => navigateTo(nextSurah)}
              disabled={!nextSurah}
            >
              <span>
                <span className={styles.surahNavLabel}>Next</span>
                <span className={styles.surahNavName}>{nextSurah ? `${nextSurah.id}. ${nextSurah.transliteration}` : ''}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button className={styles.scrollTopBtn} onClick={scrollToTop} title="Back to top">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 15V5M5 10l5-5 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Reference slide-up sheet */}
      {refSheet && (
        <div className={styles.refOverlay} onClick={closeRefSheet}>
          <div className={styles.refSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.refSheetHandle} />
            <div className={styles.refSheetHeader}>
              <span className={styles.refSheetBadge}>{refSheet.ref}</span>
              <button className={styles.refSheetClose} onClick={closeRefSheet}>✕</button>
            </div>
            {refLoading && (
              <div className={styles.refSheetLoading}>
                <div className={styles.spinner} />
              </div>
            )}
            {refVerseData && (
              <div className={styles.refSheetBody}>
                {refVerseData.map((v, i) => (
                  <div key={v.ref} className={i > 0 ? styles.refSheetVerseExtra : ''}>
                    {refVerseData.length > 1 && (
                      <div className={styles.refSheetVerseBadge}>{v.ref}</div>
                    )}
                    <div className={styles.refSheetArabic}>{v.arabic}</div>
                    {v.transliteration && (
                      <div className={styles.refSheetTranslit}>{v.transliteration}</div>
                    )}
                    {v.translation && (
                      <div className={styles.refSheetTranslation}>{v.translation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!refLoading && !refVerseData && (
              <div className={styles.refSheetLoading}>Verse not found.</div>
            )}
          </div>
        </div>
      )}

      {/* Mini audio player */}
      {audio.playingRef && (
        <div className={styles.audioPlayer}>
          <div className={styles.audioInfo}>
            <span className={styles.audioRef}>{audio.playingRef}</span>
            <button
              className={styles.audioReciterBtn}
              onClick={() => setShowReciterPicker(p => !p)}
              title="Change reciter"
            >
              {RECITERS.find(r => r.id === audio.reciter)?.name}
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className={styles.audioControls}>
            <button className={styles.audioSpeedBtn} onClick={audio.cycleSpeed} title="Tap to change speed">
              {audio.speed === 1 ? '1×' : `${audio.speed}×`}
            </button>
            <button className={styles.audioBtn} onClick={audio.playPrev} title="Previous verse">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 5L9 12l10 7V5z" fill="currentColor" opacity="0.8"/>
                <rect x="5" y="5" width="2" height="14" rx="1" fill="currentColor"/>
              </svg>
            </button>
            <button className={`${styles.audioBtn} ${styles.audioBtnMain}`} onClick={() => {
              const [sid, vid] = audio.playingRef.split(':').map(Number)
              audio.toggle(sid, vid, verses)
            }} title={audio.isPlaying ? 'Pause' : 'Play'}>
              {audio.isLoading
                ? <span className={styles.audioSpinner} />
                : audio.isPlaying ? <PauseIcon /> : <PlayIcon />
              }
            </button>
            <button className={styles.audioBtn} onClick={audio.playNext} title="Next verse">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 5l10 7-10 7V5z" fill="currentColor" opacity="0.8"/>
                <rect x="17" y="5" width="2" height="14" rx="1" fill="currentColor"/>
              </svg>
            </button>
            <button className={styles.audioStopBtn} onClick={audio.stop} title="Stop">✕</button>
          </div>
        </div>
      )}

      {/* Reciter picker */}
      {showReciterPicker && (
        <div className={styles.reciterOverlay} onClick={() => setShowReciterPicker(false)}>
          <div className={styles.reciterSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.reciterHandle} />
            <div className={styles.reciterTitle}>Choose Reciter</div>
            {RECITERS.map(r => (
              <button
                key={r.id}
                className={`${styles.reciterOption} ${audio.reciter === r.id ? styles.reciterOptionActive : ''}`}
                onClick={() => { audio.changeReciter(r.id); setShowReciterPicker(false) }}
              >
                <span>{r.name}</span>
                {audio.reciter === r.id && <span className={styles.reciterCheck}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 4l14 8-14 8V4z" fill="currentColor"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="4" height="16" rx="1" fill="currentColor"/>
      <rect x="15" y="4" width="4" height="16" rx="1" fill="currentColor"/>
    </svg>
  )
}

function renderNoteText(text, onRefClick) {
  const parts = text.split(/(\[\d{1,3}:\d{1,3}(?:-\d{1,3})?\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d{1,3}:\d{1,3}(?:-\d{1,3})?)\]$/)
    if (match) {
      return (
        <button key={i} className={styles.refLink} onClick={() => onRefClick(match[1])}>
          {part}
        </button>
      )
    }
    return <span key={i}>{part}</span>
  })
}
