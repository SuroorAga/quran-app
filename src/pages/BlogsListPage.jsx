import { useState } from 'react'
import styles from './BlogsListPage.module.css'
import AppHeader from '../components/AppHeader.jsx'

function readingTime(content) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export default function BlogsListPage({ blogs, onOpenPost, onOpenAdmin, isAdmin, darkMode, toggleDarkMode, auth, onNavigate }) {
  const [query, setQuery] = useState('')

  const filtered = blogs.filter(p =>
    !query || p.title.toLowerCase().includes(query.toLowerCase()) ||
    stripHtml(p.content).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <AppHeader
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        auth={auth}
        title="Blog"
        subtitle="Mohammad Shafi"
        onNavigate={onNavigate}
        rightContent={
          <button className={styles.writeBtn} onClick={onOpenAdmin}>
            {isAdmin ? '✍ Write' : '🔐 Admin'}
          </button>
        }
      />

      {/* Search */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIco} width="15" height="15" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="5" stroke="var(--text-faint)" strokeWidth="2"/>
          <path d="M13 13l3 3" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search posts…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            {blogs.length === 0 ? (
              <>
                <div className={styles.emptyIcon}>✍️</div>
                <p>No posts yet</p>
                {isAdmin && <p className={styles.emptySub}>Tap <strong>✍ Write</strong> above to publish your first post.</p>}
              </>
            ) : (
              <>
                <div className={styles.emptyIcon}>🔍</div>
                <p>No posts match "{query}"</p>
              </>
            )}
          </div>
        )}

        {filtered.map(post => {
          const mins = readingTime(post.content)
          const preview = stripHtml(post.content).slice(0, 130)
          return (
            <button key={post.id} className={styles.card} onClick={() => onOpenPost(post)}>
              {post.coverImage && (
                <img src={post.coverImage} alt="" className={styles.cover} onError={e => e.target.style.display = 'none'} />
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardDate}>
                    {new Date(post.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className={styles.cardTime}>{mins} min read</span>
                </div>
                <div className={styles.cardTitle}>{post.title}</div>
                <div className={styles.cardPreview}>{preview}{preview.length >= 130 ? '…' : ''}</div>
                <div className={styles.cardRead}>Read →</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
