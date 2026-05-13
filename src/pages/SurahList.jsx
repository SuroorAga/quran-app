import { useState, useEffect } from 'react'
import styles from './SurahList.module.css'
import AppHeader from '../components/AppHeader.jsx'

export default function SurahList({ onOpen, darkMode, toggleDarkMode, lastRead, onResume, onGoHome, auth, onOpenBooks, onOpenBlog, getPercent, onResetProgress }) {
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
        onResetProgress={onResetProgress}
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
            <SurahProgressBadge id={ch.id} pct={getPercent ? getPercent(ch.id, ch.total_verses) : 0} />
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

function SurahProgressBadge({ id, pct }) {
  const size   = 36
  const stroke = 2.5
  const radius = (size / 2) - stroke
  const circ   = 2 * Math.PI * radius
  const offset = circ - (pct / 100) * circ
  const done   = pct === 100

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="var(--gold-border)" strokeWidth={stroke} opacity="0.5" />
        {/* Progress arc */}
        {pct > 0 && (
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke={done ? 'var(--gold)' : 'var(--gold)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            opacity={done ? 1 : 0.75}
          />
        )}
      </svg>
      {/* Number */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, fontFamily: 'Georgia, serif',
        color: done ? 'var(--gold-dark)' : 'var(--gold-dark)',
        background: 'var(--gold-light)',
        borderRadius: '50%',
        margin: stroke,
      }}>
        {done ? '✓' : id}
      </div>
    </div>
  )
}

