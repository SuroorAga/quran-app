import { useState, useEffect } from 'react'
import styles from './SurahList.module.css'
import Logo from '../components/Logo.jsx'

export default function SurahList({ onOpen, darkMode, toggleDarkMode, lastRead, onResume }) {
  const [chapters, setChapters] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/data/chapters.json')
      .then(r => r.json())
      .then(setChapters)
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
      (filter === 'medinan' && ch.type === 'medinan') ||
      (filter === 'tafsir' && ch.has_tafsir)
    return matchSearch && matchFilter
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Logo size={36} />
        <div className={styles.headerText}>
          <div className={styles.headerTitle}>Qur'aanic Studies</div>
          <div className={styles.headerSub}>A Modern Tafsir · Mohammad Shafi</div>
        </div>
        <button className={styles.darkToggle} onClick={toggleDarkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

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
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div className={styles.filters}>
        {[['all','All 114'],['meccan','Meccan'],['medinan','Medinan'],['tafsir','With Tafsir']].map(([key, label]) => (
          <button
            key={key}
            className={`${styles.pill} ${filter === key ? styles.pillActive : ''}`}
            onClick={() => setFilter(key)}
          >{label}</button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No surahs found for "{search}"</div>
        )}
        {filtered.map(ch => (
          <button key={ch.id} className={styles.row} onClick={() => onOpen(ch)}>
            <div className={styles.numBadge}>{ch.id}</div>
            <div className={styles.info}>
              <div className={styles.name}>{ch.transliteration}</div>
              <div className={styles.meta}>
                {ch.type === 'meccan' ? 'Meccan' : 'Medinan'} · {ch.total_verses} verses
              </div>
              {ch.has_tafsir && (
                <div className={styles.tafsirTag}>Tafsir available</div>
              )}
            </div>
            <div className={styles.arabic}>{ch.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
