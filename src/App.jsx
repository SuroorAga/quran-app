import { useState } from 'react'
import SurahList from './pages/SurahList.jsx'
import SurahReader from './pages/SurahReader.jsx'
import SearchPage from './pages/SearchPage.jsx'
import BookmarksPage from './pages/BookmarksPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import { useBookmarks } from './hooks/useBookmarks.js'
import styles from './App.module.css'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [tab, setTab] = useState('surahs')           // surahs | search | saved
  const [selectedSurah, setSelectedSurah] = useState(null) // { id, transliteration, name, total_verses, type }
  const bookmarks = useBookmarks()

  const openSurah = (surah) => {
    setSelectedSurah(surah)
    setTab('surahs')
  }

  const goBack = () => setSelectedSurah(null)

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />
  }

  return (
    <div className={styles.app}>
      <div className={styles.content}>
        {tab === 'surahs' && !selectedSurah && (
          <SurahList onOpen={openSurah} />
        )}
        {tab === 'surahs' && selectedSurah && (
          <SurahReader surah={selectedSurah} onBack={goBack} bookmarks={bookmarks} />
        )}
        {tab === 'search' && (
          <SearchPage onOpenSurah={openSurah} bookmarks={bookmarks} onSelectVerse={(surah) => { openSurah(surah); setTab('surahs'); }} />
        )}
        {tab === 'saved' && (
          <BookmarksPage bookmarks={bookmarks} onOpenSurah={(surah) => { openSurah(surah); setTab('surahs'); }} />
        )}
      </div>

      <nav className={styles.nav}>
        <button className={`${styles.navItem} ${tab === 'surahs' ? styles.navActive : ''}`} onClick={() => { setTab('surahs') }}>
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
  const c = active ? '#0F6E56' : '#999'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="2" rx="1" fill={c}/>
      <rect x="3" y="9" width="9" height="2" rx="1" fill={c}/>
      <rect x="3" y="14" width="14" height="2" rx="1" fill={c}/>
    </svg>
  )
}

function IconSearch({ active }) {
  const c = active ? '#0F6E56' : '#999'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5" stroke={c} strokeWidth="2"/>
      <path d="M13 13l3 3" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function IconSaved({ active }) {
  const c = active ? '#0F6E56' : '#999'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 3h10a1 1 0 011 1v12l-6-4-6 4V4a1 1 0 011-1z" stroke={c} strokeWidth="2" fill={active ? '#E1F5EE' : 'none'}/>
    </svg>
  )
}
