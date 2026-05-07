import styles from './BlogPost.module.css'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function BlogPost({ post, onBack }) {
  const shareWhatsApp = () => {
    const text = `*${post.title}*\n\n${post.content}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareEmail = () => {
    const subject = encodeURIComponent(post.title)
    const body = encodeURIComponent(post.content)
    window.open(`mailto:?subject=${subject}&body=${body}`)
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
        <div className={styles.shareBtns}>
          <button className={styles.whatsappBtn} onClick={shareWhatsApp}>
            <IconWhatsApp />
            WhatsApp
          </button>
          <button className={styles.emailBtn} onClick={shareEmail}>
            <IconEmail />
            Email
          </button>
        </div>
      </div>

      <div className={styles.scroll}>
        <article className={styles.article}>
          <div className={styles.meta}>{fmtDate(post.date)}</div>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.divider} />
          <div className={styles.body}>
            {post.content.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className={styles.footerShare}>
            <p className={styles.footerShareLabel}>Share this post</p>
            <div className={styles.shareBtns}>
              <button className={styles.whatsappBtn} onClick={shareWhatsApp}>
                <IconWhatsApp />
                Share via WhatsApp
              </button>
              <button className={styles.emailBtn} onClick={shareEmail}>
                <IconEmail />
                Share via Email
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.918-1.417A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.073-1.119l-.292-.173-3.02.871.842-3.078-.19-.315A7.946 7.946 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>
  )
}

function IconEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
