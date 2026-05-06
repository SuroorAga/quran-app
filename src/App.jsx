import { useState, useEffect } from 'react'
import SurahList from './pages/SurahList.jsx'
import SurahReader from './pages/SurahReader.jsx'
import SearchPage from './pages/SearchPage.jsx'
import BookmarksPage from './pages/BookmarksPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import { useBookmarks } from './hooks/useBookmarks.js'
import styles from './App.module.css'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [tab, setTab] = useState('surahs')
  const [selectedSurah, setSelectedSurah] = useState(null)
  const [resumeVerseId, setResumeVerseId] = useState(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [chapters, setChapters] = useState([])

  useEffect(() => {
    fetch('/data/chapters.json').then(r => r.json()).then(setChapters)
  }, [])
  const [lastRead, setLastRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lastRead')) } catch { return null }
  })
  const bookmarks = useBookmarks()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const saveLastRead = (surah, verseId) => {
    const data = { surah, verseId }
    setLastRead(data)
    localStorage.setItem('lastRead', JSON.stringify(data))
  }

  const openSurah = (surah) => {
    setSelectedSurah(surah)
    setResumeVerseId(null)
    setTab('surahs')
    saveLastRead(surah, null)
    history.pushState({ surah: true }, '')
  }

  const resumeReading = () => {
    if (lastRead) {
      setSelectedSurah(lastRead.surah)
      setResumeVerseId(lastRead.verseId)
      setTab('surahs')
      history.pushState({ surah: true }, '')
    }
  }

  const goBack = () => {
    setSelectedSurah(null)
    history.back()
  }

  // Browser back button support
  useEffect(() => {
    const onPop = () => setSelectedSurah(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />
  }

  return (
    <div className={styles.app}>
      <div className={styles.content}>
        {tab === 'surahs' && !selectedSurah && (
          <SurahList
            onOpen={openSurah}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(d => !d)}
            lastRead={lastRead}
            onResume={resumeReading}
            onGoHome={() => setShowLanding(true)}
          />
        )}
        {tab === 'surahs' && selectedSurah && (
          <SurahReader
            surah={selectedSurah}
            onBack={goBack}
            bookmarks={bookmarks}
            onSaveLastRead={saveLastRead}
            initialVerseId={resumeVerseId}
            chapters={chapters}
            onNavigate={openSurah}
          />
        )}
        {tab === 'search' && (
          <SearchPage
            onOpenSurah={openSurah}
            bookmarks={bookmarks}
            onSelectVerse={(surah) => { openSurah(surah); setTab('surahs') }}
          />
        )}
        {tab === 'saved' && (
          <BookmarksPage
            bookmarks={bookmarks}
            onOpenSurah={(surah) => { openSurah(surah); setTab('surahs') }}
          />
        )}
      </div>

      <nav className={styles.nav}>
        <button className={`${styles.navItem} ${tab === 'surahs' ? styles.navActive : ''}`} onClick={() => setTab('surahs')}>
          <IconSurahs active={tab === 'surahs'} />
          <span>Surahs</span>
        </button>
        <button className={`${styles.navItem} ${tab === 'search' ? styles.navActive : ''}`} onClick={() => setTab('search')}>
          <IconSearch active={tab === 'search'} />
          <span>Search</span>
        </button>
        <button className={`${styles.navItem} ${tab === 'saved' ? styles.navActive : ''}`} onClick={() => setTab('saved')}>
          <IconSaved active={tab === 'saved'} />
          <span>Saved</span>
          {bookmarks.bookmarks.length > 0 && (
            <span className={styles.badge}>{bookmarks.bookmarks.length}</span>
          )}
        </button>
      </nav>
    </div>
  )
}

function IconSurahs({ active }) {
  const c = active ? 'var(--gold)' : 'var(--text-faint)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="2" rx="1" fill={c}/>
      <rect x="3" y="9" width="9" height="2" rx="1" fill={c}/>
      <rect x="3" y="14" width="14" height="2" rx="1" fill={c}/>
    </svg>
  )
}

function IconSearch({ active }) {
  const c = active ? 'var(--gold)' : 'var(--text-faint)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5" stroke={c} strokeWidth="2"/>
      <path d="M13 13l3 3" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function IconSaved({ active }) {
  const c = active ? 'var(--gold)' : 'var(--text-faint)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 3h10a1 1 0 011 1v12l-6-4-6 4V4a1 1 0 011-1z" stroke={c} strokeWidth="2" fill={active ? 'var(--gold-light)' : 'none'}/>
    </svg>
  )
}
