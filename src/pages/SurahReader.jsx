import { useState, useEffect, useRef } from 'react'
import styles from './SurahReader.module.css'

const EN_SIZES = ['13px', '15px', '17px', '19px', '22px']
const AR_SIZES = ['20px', '24px', '28px', '33px', '38px']

export default function SurahReader({ surah, onBack, bookmarks, onSaveLastRead, initialVerseId }) {
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesVisible, setNotesVisible] = useState(true)
  const [hiddenNotes, setHiddenNotes] = useState(new Set())
  const [jumpVal, setJumpVal] = useState('')
  const [fontScale, setFontScale] = useState(() => parseInt(localStorage.getItem('fontScale') || '2'))
  const [copiedRef, setCopiedRef] = useState(null)
  const [highlightedRef, setHighlightedRef] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const contentRef = useRef(null)

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

  const jumpToVerse = () => {
    const n = parseInt(jumpVal)
    if (n >= 1 && n <= surah.total_verses) {
      const el = document.getElementById(`verse-${surah.id}-${n}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Highlight the jumped-to verse briefly
        const ref = verses.find(v => v.id === n)?.ref
        if (ref) {
          setHighlightedRef(ref)
          setTimeout(() => setHighlightedRef(null), 1800)
        }
      }
    }
    setJumpVal('')
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
            onClick={() => setFontScale(s => Math.min(4, s + 1))}
            disabled={fontScale === 4}
            title="Increase font size"
          >A+</button>
        </div>
      </div>

      {/* Bismillah */}
      {surah.id !== 9 && (
        <div className={styles.bismillah}>
          <span className={styles.bismillahAr}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          <span className={styles.bismillahEn}>In the Name of Allah, the Gracious, the Merciful</span>
        </div>
      )}

      {/* Controls bar */}
      <div className={styles.controlBar}>
        <div className={styles.jumpWrap}>
          <input
            className={styles.jumpInput}
            type="number"
            placeholder={`1–${surah.total_verses}`}
            value={jumpVal}
            onChange={e => setJumpVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && jumpToVerse()}
          />
          <button className={styles.jumpBtn} onClick={jumpToVerse}>Go</button>
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
              className={`${styles.verseCard} ${isHighlighted ? styles.verseCardHighlight : ''}`}
            >
              <div className={styles.verseTop}>
                <span className={styles.verseBadge}>{verse.ref}</span>
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
                  <div className={styles.notesText} style={{ fontSize: EN_SIZES[fontScale] }}>{verse.notes}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button className={styles.scrollTopBtn} onClick={scrollToTop} title="Back to top">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 15V5M5 10l5-5 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
