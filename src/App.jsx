import { useState, useEffect } from 'react'
import SurahList from './pages/SurahList.jsx'
import SurahReader from './pages/SurahReader.jsx'
import SearchPage from './pages/SearchPage.jsx'
import BookmarksPage from './pages/BookmarksPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import BlogAdmin from './pages/BlogAdmin.jsx'
import BlogPost from './pages/BlogPost.jsx'
import { useBookmarks } from './hooks/useBookmarks.js'
import { useLastRead } from './hooks/useLastRead.js'
import { useBlogs } from './hooks/useBlogs.js'
import { useAuth } from './hooks/useAuth.js'
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

  const blogs = useBlogs()
  const auth = useAuth()
  const { lastRead, saveLastRead } = useLastRead(auth.user)
  const bookmarks = useBookmarks(auth.user)

  useEffect(() => {
    fetch('/data/chapters.json').then(r => r.json()).then(setChapters)
  }, [])


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

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
        blogs={blogs.blogs}
        onOpenBlog={openBlogFromLanding}
        onWriteBlog={openBlogAdmin}
      />
    )
  }

  /* Blog post full-screen */
  if (selectedBlog) {
    return (
      <div className={styles.app}>
        <BlogPost post={selectedBlog} onBack={() => setSelectedBlog(null)} />
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
          onBack={() => setShowBlogAdmin(false)}
          auth={auth}
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
            auth={auth}
          />
        )}
        {tab === 'blogs' && (
          <BlogsListTab
            blogs={blogs.blogs}
            onOpenPost={setSelectedBlog}
            onOpenAdmin={() => setShowBlogAdmin(true)}
            isAdmin={auth.isAdmin}
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

function BlogsListTab({ blogs, onOpenPost, onOpenAdmin, isAdmin }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', background: 'var(--emerald)', borderBottom: '2px solid rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: 'white', fontSize: '17px', fontWeight: 'bold' }}>Mohammad Shafi's Blog</span>
        <button
          onClick={onOpenAdmin}
          style={{ background: 'var(--gold)', color: '#1A1714', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '15px', fontWeight: 'bold' }}
        >
          {isAdmin ? '✍ Write' : '🔐 Admin'}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✍️</div>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '8px' }}>No posts yet</p>
            <p style={{ fontSize: '15px', lineHeight: '1.7' }}>Tap <strong>✍ Write</strong> above to publish your first post.</p>
          </div>
        ) : blogs.map(post => (
          <button
            key={post.id}
            onClick={() => onOpenPost(post)}
            style={{ textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', width: '100%', display: 'block' }}
          >
            <div style={{ fontSize: '11px', color: 'var(--gold-dark)', marginBottom: '6px', fontStyle: 'italic' }}>
              {new Date(post.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '19px', fontWeight: 'bold', color: 'var(--text)', fontFamily: 'Georgia, serif', marginBottom: '8px', lineHeight: 1.3 }}>
              {post.title}
            </div>
            <div style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {post.content.slice(0, 140)}{post.content.length > 140 ? '…' : ''}
            </div>
          </button>
        ))}
      </div>
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
