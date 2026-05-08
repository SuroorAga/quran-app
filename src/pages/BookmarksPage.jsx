import { useState } from 'react'
import styles from './BookmarksPage.module.css'

export default function BookmarksPage({ bookmarks, onOpenSurah, auth }) {
  const [tab, setTab] = useState('all') // all | surah | recent

  const { bookmarks: saved, removeBookmark } = bookmarks

  const bySurah = saved.reduce((acc, b) => {
    const key = b.surahName || 'Unknown'
    if (!acc[key]) acc[key] = { id: b.surahId, verses: [] }
    acc[key].verses.push(b)
    return acc
  }, {})

  const byRecent = [...saved].sort((a, b) => b.savedAt - a.savedAt)

  const formatDate = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return d.toLocaleDateString()
  }

  const renderVerse = (b) => (
    <div key={b.ref} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.ref}>{b.ref}</span>
        <button
          className={styles.removeBtn}
          onClick={() => removeBookmark(b.ref)}
          title="Remove bookmark"
        >✕</button>
      </div>
      <div className={styles.arabic}>{b.arabic}</div>
      {b.translation && <div className={styles.translation}>{b.translation.substring(0, 120)}{b.translation.length > 120 ? '…' : ''}</div>}
      <div className={styles.cardFooter}>
        <span className={styles.date}>{formatDate(b.savedAt)}</span>
        {b.surahName && tab !== 'surah' && (
          <span className={styles.surahTag}>{b.surahName}</span>
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Saved Verses</div>
        <div className={styles.headerSub}>
          {saved.length === 0 ? 'None saved' : `${saved.length} verse${saved.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Sync banner */}
      {auth && !auth.user && (
        <button className={styles.syncBanner} onClick={auth.signIn}>
          <span>☁</span>
          <span>Sign in with Google to sync bookmarks across all your devices</span>
          <span className={styles.syncBannerCta}>Sign in →</span>
        </button>
      )}
      {auth && auth.user && bookmarks.synced && (
        <div className={styles.syncedBar}>
          <span>☁ Synced</span>
          <span className={styles.syncedEmail}>{auth.user.email}</span>
          <button className={styles.syncSignOut} onClick={auth.logOut}>Sign out</button>
        </div>
      )}

      <div className={styles.tabs}>
        {[['all','All'],['surah','By Surah'],['recent','Recent']].map(([key,label]) => (
          <button key={key} className={`${styles.tab} ${tab===key?styles.tabActive:''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className={styles.content}>
        {saved.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔖</div>
            <div>No saved verses yet</div>
            <div className={styles.emptySub}>Tap "Save" on any verse while reading to bookmark it here</div>
          </div>
        )}

        {tab === 'all' && saved.map(renderVerse)}

        {tab === 'surah' && Object.entries(bySurah).map(([name, data]) => (
          <div key={name}>
            <div className={styles.sectionHead}>
              <span>{name}</span>
              <button className={styles.openSurahBtn} onClick={() => onOpenSurah({ id: data.id, transliteration: name })}>
                Open surah →
              </button>
            </div>
            {data.verses.map(renderVerse)}
          </div>
        ))}

        {tab === 'recent' && byRecent.map(renderVerse)}
      </div>
    </div>
  )
}
