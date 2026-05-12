import { useState, useEffect } from 'react'
import styles from './SurahList.module.css'
import AppHeader from '../components/AppHeader.jsx'

export default function SurahList({ onOpen, darkMode, toggleDarkMode, lastRead, onResume, onGoHome, auth, onOpenBooks, onOpenBlog }) {
  const [chapters, setChapters] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/data/chapters.json').then(r => r.json()).then(setChapters)
  }, [])

  const filtered = chapters.filter(ch => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      ch.transliteration.toLowerCase().includes(q) ||
      ch.name.includes(q) ||
      String(ch.id).includes(q)
    const matchFilter =
      filter === 'all' ||
      (filter === 'meccan' && ch.type === 'meccan') ||
      (filter === 'medinan' && ch.type === 'medinan')
    return matchSearch && matchFilter
  })

  return (
    <div className={styles.page}>

      <AppHeader
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        auth={auth}
        title="Qur'aanic Studies"
        subtitle="A Modern Tafsir · Mohammad Shafi"
        onNavigate={{ surahs: null, blog: onOpenBlog, books: onOpenBooks, home: onGoHome }}
      />

      {lastRead && (
        <button className={styles.resumeBanner} onClick={onResume}>
          <div className={styles.resumeInfo}>
            <span className={styles.resumeLabel}>Continue reading</span>
            <span className={styles.resumeTitle}>
              {lastRead.surah.transliteration}
              {lastRead.verseId ? ` · Verse ${lastRead.surah.id}:${lastRead.verseId}` : ''}
            </span>
          </div>
          <span className={styles.resumeArrow}>→</span>
        </button>
      )}

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="2"/>
          <path d="M13 13l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search surahs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>}
      </div>

      <div className={styles.filters}>
        {[['all','All 114'],['meccan','Meccan'],['medinan','Medinan']].map(([key, label]) => (
          <button key={key} className={`${styles.pill} ${filter === key ? styles.pillActive : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && <div className={styles.empty}>No surahs found for "{search}"</div>}
        {filtered.map(ch => (
          <button key={ch.id} className={styles.row} onClick={() => onOpen(ch)}>
            <div className={styles.numBadge}>{ch.id}</div>
            <div className={styles.info}>
              <div className={styles.name}>{ch.transliteration}</div>
              <div className={styles.meta}>{ch.type === 'meccan' ? 'Meccan' : 'Medinan'} · {ch.total_verses} verses</div>
            </div>
            <div className={styles.arabic}>{ch.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

