import { useState, useEffect } from 'react'
import SurahList from './pages/SurahList.jsx'
import SurahReader from './pages/SurahReader.jsx'
import SearchPage from './pages/SearchPage.jsx'
import BookmarksPage from './pages/BookmarksPage.jsx'
import BooksPage from './pages/BooksPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import BlogAdmin from './pages/BlogAdmin.jsx'
import BlogPost from './pages/BlogPost.jsx'
import BlogsListPage from './pages/BlogsListPage.jsx'
import AppHeader from './components/AppHeader.jsx'
import { useBookmarks } from './hooks/useBookmarks.js'
import { useLastRead } from './hooks/useLastRead.js'
import { useBlogs } from './hooks/useBlogs.js'
import { useAuth } from './hooks/useAuth.js'
import { useQuranProgress } from './hooks/useQuranProgress.js'
import styles from './App.module.css'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [tab, setTab] = useState('surahs')
  const [selectedSurah, setSelectedSurah] = useState(null)
  const [resumeVerseId, setResumeVerseId] = useState(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [chapters, setChapters] = useState([])
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [showBlogAdmin, setShowBlogAdmin] = useState(false)
  const [editBlogPost, setEditBlogPost] = useState(null)
  const [showBooks, setShowBooks] = useState(false)
  const openBooks = () => setShowBooks(true)

  const blogs = useBlogs()
  const auth = useAuth()
  const { lastRead, saveLastRead } = useLastRead(auth.user)
  const bookmarks = useBookmarks(auth.user)
  const { updateProgress, getPercent, resetProgress } = useQuranProgress()

  const trackLastRead = (surah, verseId) => {
    saveLastRead(surah, verseId)
    if (verseId) updateProgress(surah.id, verseId)
  }

  useEffect(() => {
    fetch('/data/chapters.json').then(r => r.json()).then(setChapters)
  }, [])


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const openSurah = (surah, verseId = null) => {
    setSelectedSurah(surah)
    setResumeVerseId(verseId)
    setTab('surahs')
    saveLastRead(surah, null)
    history.pushState({ surah: true }, '')
  }

  const openVerse = (surahId, verseId) => {
    const surah = chapters.find(c => c.id === surahId)
    if (!surah) return
    setShowLanding(false)
    openSurah(surah, verseId)
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

  const openBlogFromLanding = (post) => {
    setSelectedBlog(post)
    setShowBlogAdmin(false)
    setTab('blogs')
    setShowLanding(false)
  }

  const openBlogAdmin = () => {
    setShowBlogAdmin(true)
    setSelectedBlog(null)
    setTab('blogs')
    setShowLanding(false)
  }

  useEffect(() => {
    const onPop = () => setSelectedSurah(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (showLanding) {
    return (
      <LandingPage
        onEnter={() => setShowLanding(false)}
        onOpenVerse={openVerse}
        blogs={blogs.blogs}
        onOpenBlog={openBlogFromLanding}
        onWriteBlog={openBlogAdmin}
        onOpenBooks={() => { setShowLanding(false); setShowBooks(true); }}
        auth={auth}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(d => !d)}
      />
    )
  }

  /* Blog post full-screen */
  if (selectedBlog) {
    return (
      <div className={styles.app}>
        <BlogPost
          post={selectedBlog}
          onBack={() => setSelectedBlog(null)}
          auth={auth}
          onEdit={(post) => { setSelectedBlog(null); setEditBlogPost(post); setShowBlogAdmin(true) }}
          blogs={blogs.blogs}
          onNavigate={setSelectedBlog}
        />
      </div>
    )
  }

  /* Books full-screen */
  if (showBooks) {
    return (
      <div className={styles.app}>
        <BooksPage
          onBack={() => setShowBooks(false)}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(d => !d)}
          auth={auth}
          onNavigate={{ surahs: () => { setShowBooks(false); setTab('surahs') }, blog: () => { setShowBooks(false); setTab('blogs') }, books: null, home: () => { setShowBooks(false); setShowLanding(true) } }}
        />
      </div>
    )
  }

  /* Blog admin full-screen */
  if (showBlogAdmin) {
    return (
      <div className={styles.app}>
        <BlogAdmin
          blogs={blogs.blogs}
          onPublish={blogs.publish}
          onUpdate={blogs.update}
          onDelete={blogs.remove}
          onExport={blogs.exportAll}
          onImport={blogs.importFile}
          onBack={() => { setShowBlogAdmin(false); setEditBlogPost(null) }}
          auth={auth}
          initialEditPost={editBlogPost}
        />
      </div>
    )
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
            auth={auth}
            onOpenBooks={openBooks}
            onOpenBlog={() => setTab('blogs')}
            getPercent={getPercent}
            onResetProgress={resetProgress}
          />
        )}
        {tab === 'surahs' && selectedSurah && (
          <SurahReader
            surah={selectedSurah}
            onBack={goBack}
            bookmarks={bookmarks}
            onSaveLastRead={trackLastRead}
            initialVerseId={resumeVerseId}
            chapters={chapters}
            onNavigate={openSurah}
            onGoHome={() => { setShowLanding(true); setSelectedSurah(null) }}
          />
        )}
        {tab === 'search' && (
          <SearchPage
            onOpenSurah={openSurah}
            bookmarks={bookmarks}
            onSelectVerse={(surah) => { openSurah(surah); setTab('surahs') }}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(d => !d)}
            auth={auth}
            onNavigate={{ surahs: () => setTab('surahs'), blog: () => setTab('blogs'), books: openBooks, home: () => setShowLanding(true) }}
          />
        )}
        {tab === 'saved' && (
          <BookmarksPage
            bookmarks={bookmarks}
            onOpenSurah={(surah) => { openSurah(surah); setTab('surahs') }}
            onOpenVerse={(surahId, verseId) => {
              const ch = chapters.find(c => c.id === surahId)
              if (ch) { openSurah(ch, verseId); setTab('surahs') }
            }}
            auth={auth}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(d => !d)}
            onNavigate={{ surahs: () => setTab('surahs'), blog: () => setTab('blogs'), books: openBooks, home: () => setShowLanding(true) }}
          />
        )}
        {tab === 'blogs' && (
          <BlogsListPage
            blogs={blogs.blogs}
            onOpenPost={setSelectedBlog}
            onOpenAdmin={() => setShowBlogAdmin(true)}
            isAdmin={auth.isAdmin}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(d => !d)}
            auth={auth}
            onNavigate={{ surahs: () => setTab('surahs'), blog: null, books: openBooks, home: () => setShowLanding(true) }}
          />
        )}
      </div>

      <nav className={styles.nav}>
        <button className={styles.navItem} onClick={() => { setShowLanding(true); setSelectedSurah(null) }}>
          <IconHome />
          <span>Home</span>
        </button>
        <button className={`${styles.navItem} ${tab === 'surahs' ? styles.navActive : ''}`} onClick={() => { setTab('surahs'); setSelectedSurah(null) }}>
          <IconSurahs active={tab === 'surahs' && !selectedSurah} />
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
        <button className={`${styles.navItem} ${tab === 'blogs' ? styles.navActive : ''}`} onClick={() => setTab('blogs')}>
          <IconBlog active={tab === 'blogs'} />
          <span>Blog</span>
          {blogs.blogs.length > 0 && (
            <span className={styles.badge}>{blogs.blogs.length}</span>
          )}
        </button>
      </nav>
    </div>
  )
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
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
function IconBlog({ active }) {
  const c = active ? 'var(--gold)' : 'var(--text-faint)'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 4h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke={c} strokeWidth="1.8"/>
      <path d="M6 8h8M6 11h5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M13 13l2-2-1-1-2 2v1h1z" fill={c}/>
    </svg>
  )
}
