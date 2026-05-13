import { useState } from 'react'
import styles from './BlogPost.module.css'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function readingTime(content) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPost({ post, onBack, auth, onEdit, blogs = [], onNavigate }) {
  const [shareOpen, setShareOpen] = useState(false)
  const isAdmin = auth?.isAdmin

  const currentIdx = blogs.findIndex(b => b.id === post.id)
  const prevPost   = currentIdx < blogs.length - 1 ? blogs[currentIdx + 1] : null
  const nextPost   = currentIdx > 0 ? blogs[currentIdx - 1] : null
  const mins       = readingTime(post.content)

  const plainText = () => post.content.replace(/<[^>]+>/g, '')

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`*${post.title}*\n\n${plainText().slice(0, 300)}…`)}`, '_blank')
    setShareOpen(false)
  }
  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(plainText())}`)
    setShareOpen(false)
  }
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setShareOpen(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10l5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className={styles.headerRight}>
          {isAdmin && onEdit && (
            <button className={styles.editBtn} onClick={() => onEdit(post)}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M14.5 2.5l3 3L6 17H3v-3L14.5 2.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
          )}
          <button className={styles.shareBtn} onClick={() => setShareOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      <div className={styles.scroll}>
        {post.coverImage && (
          <img src={post.coverImage} alt="" className={styles.coverImage} onError={e => e.target.style.display = 'none'} />
        )}

        <article className={styles.article}>
          <div className={styles.meta}>
            <span className={styles.metaDate}>{fmtDate(post.date)}</span>
            <span className={styles.metaTime}>{mins} min read</span>
          </div>

          <h1 className={styles.title}>{post.title}</h1>

          <div className={styles.byline}>
            <div className={styles.bylineAvatar}>م</div>
            <div>
              <div className={styles.bylineName}>Mohammad Shafi</div>
              <div className={styles.bylineRole}>Author · Qur'aanic Studies</div>
            </div>
          </div>

          <div className={styles.rule} />

          <div className={styles.body} dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Prev / Next */}
          {(prevPost || nextPost) && (
            <div className={styles.postNav}>
              {prevPost ? (
                <button className={styles.postNavBtn} onClick={() => onNavigate?.(prevPost)}>
                  <span className={styles.postNavLabel}>← Older</span>
                  <span className={styles.postNavTitle}>{prevPost.title}</span>
                </button>
              ) : <div />}
              {nextPost && (
                <button className={`${styles.postNavBtn} ${styles.postNavRight}`} onClick={() => onNavigate?.(nextPost)}>
                  <span className={styles.postNavLabel}>Newer →</span>
                  <span className={styles.postNavTitle}>{nextPost.title}</span>
                </button>
              )}
            </div>
          )}

          <div className={styles.footerShare}>
            <div className={styles.footerShareLabel}>Share this post</div>
            <div className={styles.footerBtns}>
              <button className={styles.footerWhatsapp} onClick={shareWhatsApp}><IconWhatsApp /> WhatsApp</button>
              <button className={styles.footerEmail} onClick={shareEmail}><IconEmail /> Email</button>
            </div>
          </div>
        </article>
      </div>

      {/* Slide-up share sheet */}
      {shareOpen && (
        <div className={styles.shareOverlay} onClick={() => setShareOpen(false)}>
          <div className={styles.shareSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.shareHandle} />
            <div className={styles.shareTitle}>Share</div>
            <button className={styles.shareOption} onClick={shareWhatsApp}>
              <span className={styles.shareOptionIcon}><IconWhatsApp /></span>
              Share on WhatsApp
            </button>
            <button className={styles.shareOption} onClick={shareEmail}>
              <span className={styles.shareOptionIcon}><IconEmail /></span>
              Share via Email
            </button>
            <button className={styles.shareOption} onClick={copyLink}>
              <span className={styles.shareOptionIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </span>
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function IconWhatsApp() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.918-1.417A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.073-1.119l-.292-.173-3.02.871.842-3.078-.19-.315A7.946 7.946 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>
  )
}

function IconEmail() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
