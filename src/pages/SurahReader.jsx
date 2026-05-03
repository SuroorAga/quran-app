import { useState, useEffect, useRef } from 'react'
import styles from './SurahReader.module.css'

export default function SurahReader({ surah, onBack, bookmarks }) {
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesVisible, setNotesVisible] = useState(true)
  const [hiddenNotes, setHiddenNotes] = useState(new Set())
  const [jumpVal, setJumpVal] = useState('')
  const [fontSize, setFontSize] = useState('md') // sm | md | lg
  const contentRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setVerses([])
    setHiddenNotes(new Set())
    fetch(`/data/surah_${surah.id}.json`)
      .then(r => r.json())
      .then(data => { setVerses(data); setLoading(false) })
  }, [surah.id])

  const toggleAllNotes = () => {
    if (notesVisible) {
      // Hide all
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
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setJumpVal('')
  }

  const fontSizes = { sm: '14px', md: '16px', lg: '19px' }
  const arabicSizes = { sm: '22px', md: '26px', lg: '32px' }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10l5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>{surah.transliteration} · {surah.name}</div>
          <div className={styles.headerSub}>Chapter {surah.id} · {surah.total_verses} verses · {surah.type === 'meccan' ? 'Meccan' : 'Medinan'}</div>
        </div>
        <button className={styles.fontBtn} onClick={() => setFontSize(f => f === 'sm' ? 'md' : f === 'md' ? 'lg' : 'sm')} title="Change font size">
          Aa
        </button>
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

          return (
            <div
              key={verse.ref}
              id={`verse-${surah.id}-${verse.id}`}
              className={styles.verseCard}
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

              <div className={styles.arabic} style={{ fontSize: arabicSizes[fontSize] }}>
                {verse.arabic}
              </div>

              <div className={styles.transliteration}>
                {verse.transliteration}
              </div>

              {hasTafsir && (
                <div className={styles.translation} style={{ fontSize: fontSizes[fontSize] }}>
                  {verse.translation}
                </div>
              )}

              {hasNotes && !noteHidden && (
                <div className={styles.notesBox}>
                  <div className={styles.notesLabel}>Mohammad Shafi's note</div>
                  <div className={styles.notesText}>{verse.notes}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
