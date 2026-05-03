import { useState, useEffect, useRef } from 'react'
import styles from './SearchPage.module.css'

export default function SearchPage({ bookmarks, onSelectVerse }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | translation | notes
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [allVerses, setAllVerses] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Load all verse data once for search
  const loadAllVerses = async () => {
    if (allVerses) return allVerses
    setSearching(true)
    const chapters = await fetch('/data/chapters.json').then(r => r.json())
    const allData = []
    for (const ch of chapters) {
      const verses = await fetch(`/data/surah_${ch.id}.json`).then(r => r.json())
      verses.forEach(v => allData.push({ ...v, surahId: ch.id, surahName: ch.transliteration }))
    }
    setAllVerses(allData)
    setSearching(false)
    return allData
  }

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const run = async () => {
      const data = await loadAllVerses()
      const q = query.toLowerCase()
      const found = data.filter(v => {
        if (filter === 'translation') return v.translation?.toLowerCase().includes(q)
        if (filter === 'notes') return v.notes?.toLowerCase().includes(q)
        return (
          v.translation?.toLowerCase().includes(q) ||
          v.notes?.toLowerCase().includes(q) ||
          v.transliteration?.toLowerCase().includes(q) ||
          v.ref?.includes(q)
        )
      }).slice(0, 60)
      setResults(found)
    }
    const t = setTimeout(run, 300)
    return () => clearTimeout(t)
  }, [query, filter])

  const highlight = (text, q) => {
    if (!text || !q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className={styles.hl}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Search</div>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIco} width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
            <path d="M13 13l3 3" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="Search translations, notes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>}
        </div>
      </div>

      <div className={styles.filters}>
        {[['all','All'],['translation','Translation'],['notes','Notes']].map(([key,label]) => (
          <button key={key} className={`${styles.pill} ${filter===key?styles.pillActive:''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <div className={styles.content}>
        {!query && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <div>Search across all 114 surahs</div>
            <div className={styles.emptySub}>translations, transliterations and Mohammad Shafi's notes</div>
          </div>
        )}

        {searching && (
          <div className={styles.empty}>
            <div className={styles.spinner} />
            Loading all surahs for search…
          </div>
        )}

        {query && !searching && results.length === 0 && (
          <div className={styles.empty}>No results for "{query}"</div>
        )}

        {results.length > 0 && (
          <div className={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</div>
        )}

        {results.map(v => (
          <div key={v.ref} className={styles.result}>
            <div className={styles.resultTop}>
              <span className={styles.resultRef}>{v.ref}</span>
              <span className={styles.resultSurah}>{v.surahName}</span>
              <button
                className={`${styles.saveBtn} ${bookmarks.isBookmarked(v.ref) ? styles.saveBtnActive : ''}`}
                onClick={() => bookmarks.toggleBookmark({ ...v })}
              >
                {bookmarks.isBookmarked(v.ref) ? '✓' : 'Save'}
              </button>
            </div>
            <div className={styles.resultArabic}>{v.arabic}</div>
            {v.translation && (
              <div className={styles.resultTrans}>{highlight(v.translation, query)}</div>
            )}
            {v.notes && filter !== 'translation' && (
              <div className={styles.resultNote}>{highlight(v.notes.substring(0,120), query)}{v.notes.length > 120 ? '…' : ''}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
