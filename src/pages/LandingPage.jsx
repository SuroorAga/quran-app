import { useState, useEffect } from 'react'
import styles from './LandingPage.module.css'
import Logo from '../components/Logo.jsx'
import BurgerMenu from '../components/BurgerMenu.jsx'
import { getVerseOfTheDayRef } from '../utils/verseOfTheDay.js'

// ── Social media links — fill in real URLs here ──────────────────────────
const SOCIAL_LINKS = [
  // { platform: 'facebook',  url: 'https://facebook.com/YOUR_PAGE',    label: 'Facebook'  },
  // { platform: 'instagram', url: 'https://instagram.com/YOUR_HANDLE', label: 'Instagram' },
  // { platform: 'twitter',   url: 'https://twitter.com/YOUR_HANDLE',   label: 'Twitter / X' },
  // { platform: 'youtube',   url: 'https://youtube.com/@YOUR_CHANNEL', label: 'YouTube'   },
  // { platform: 'whatsapp',  url: 'https://wa.me/YOUR_NUMBER',         label: 'WhatsApp'  },
]

export default function LandingPage({ onEnter, blogs = [], onOpenBlog, onWriteBlog, onOpenBooks, auth, darkMode, toggleDarkMode }) {
  const [votd, setVotd] = useState(null)
  const [votdSurah, setVotdSurah] = useState(null)
  const [burgerOpen, setBurgerOpen] = useState(false)

  useEffect(() => {
    const ref = getVerseOfTheDayRef()
    const [surahId, verseId] = ref.split(':').map(Number)
    Promise.all([
      fetch(`/data/surah_${surahId}.json`).then(r => r.json()),
      fetch('/data/chapters.json').then(r => r.json())
    ]).then(([verses, chapters]) => {
      const verse = verses.find(v => v.id === verseId)
      const surah = chapters.find(c => c.id === surahId)
      if (verse) setVotd({ ...verse, surahId })
      if (surah) setVotdSurah(surah)
    }).catch(() => {})
  }, [])
  return (
    <div className={styles.page}>

      <BurgerMenu
        open={burgerOpen}
        onClose={() => setBurgerOpen(false)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        auth={auth}
        context="landing"
        onNavigate={{
          openApp: onEnter,
          blog: onOpenBlog,
          books: onOpenBooks,
        }}
      />

      {/* Nav */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <button className={styles.burgerBtn} onClick={() => setBurgerOpen(true)}>
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
          </button>
          <span className={styles.navLogo}>
            <Logo size={28} />
            Qur'aanic Studies
          </span>
          <button className={styles.navCta} onClick={onEnter}>Open App</button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.heroBgCircle1} />
          <div className={styles.heroBgCircle2} />
          <div className={styles.heroBgGrid} />
        </div>
        <div className={styles.heroInner}>
          <div className={styles.bismillahWrap}>
            <div className={styles.heroLogo}>
              <Logo size={96} />
            </div>
            <span className={styles.bismillahAr}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span className={styles.bismillahEn}>In the Name of Allah, the Gracious, the Merciful</span>
          </div>
          <h1 className={styles.heroTitle}>Qur'aanic Studies</h1>
          <p className={styles.heroSubtitle}>A Modern Tafsir</p>
          <p className={styles.heroAuthor}>by Mohammad Shafi</p>
          <p className={styles.heroDesc}>
            Read, study and reflect upon all 114 Surahs with Arabic text,
            transliteration, English translation, and verse-by-verse tafsir notes
            rooted entirely in the Qur'aan itself.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.ctaPrimary} onClick={onEnter}>
              Begin Reading
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className={styles.ctaSecondary} onClick={onEnter}>
              Browse Surahs
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}><span className={styles.statNum}>114</span><span className={styles.statLabel}>Surahs</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><span className={styles.statNum}>6,236</span><span className={styles.statLabel}>Verses</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><span className={styles.statNum}>9</span><span className={styles.statLabel}>Notes in Al-Fatiha</span></div>
          </div>
        </div>
      </section>

      {/* Verse of the Day */}
      {votd && (
        <section className={styles.votdSection}>
          <div className={styles.sectionInner}>
            <div className={styles.votdCard}>
              <div className={styles.votdMeta}>
                <span className={styles.votdLabel}>Verse of the Day</span>
                <span className={styles.votdDate}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className={styles.votdArabic}>{votd.arabic}</div>
              {votd.translation && (
                <p className={styles.votdTranslation}>
                  {votd.translation.length > 220 ? votd.translation.slice(0, 220) + '…' : votd.translation}
                </p>
              )}
              <div className={styles.votdFooter}>
                <span className={styles.votdRef}>
                  {votd.ref}{votdSurah ? ` · ${votdSurah.transliteration}` : ''}
                </span>
                <button className={styles.votdCta} onClick={onEnter}>
                  Read with Tafsir →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>What's inside</p>
          <h2 className={styles.sectionTitle}>Everything you need to study the Qur'aan</h2>
          <div className={styles.featureGrid}>
            <FeatureCard
              icon={<IconBook />}
              title="Arabic Text"
              desc="Every verse in its original Arabic script, faithfully rendered with full diacritical marks for precise recitation."
            />
            <FeatureCard
              icon={<IconTranslit />}
              title="Transliteration"
              desc="MSA-USC standard romanisation beneath each verse to help you follow along with the Arabic pronunciation."
            />
            <FeatureCard
              icon={<IconTranslate />}
              title="English Translation"
              desc="Mohammad Shafi's clear, contemporary translation that preserves the depth and nuance of the original Arabic."
            />
            <FeatureCard
              icon={<IconNotes />}
              title="Tafsir Notes"
              desc="Verse-by-verse scholarly commentary drawing exclusively on the Qur'aan itself — no external traditions, just Qur'aanic light."
            />
            <FeatureCard
              icon={<IconSearch />}
              title="Full-Text Search"
              desc="Instantly search across all 114 Surahs — in translations, transliterations, and tafsir notes — to find any verse."
            />
            <FeatureCard
              icon={<IconBookmark />}
              title="Save Verses"
              desc="Bookmark any verse and revisit it anytime. Your saved verses are grouped by Surah or sorted by date."
            />
          </div>
        </div>
      </section>

      {/* Blog posts */}
      <section className={styles.blogsSection}>
        <div className={styles.sectionInner}>
          <div className={styles.blogsSectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>From the Author</p>
              <h2 className={styles.sectionTitle}>Mohammad Shafi's Reflections</h2>
            </div>
            {onWriteBlog && (
              <button className={styles.writeBtn} onClick={onWriteBlog}>
                ✍ Write a Post
              </button>
            )}
          </div>

          {blogs.length === 0 ? (
            <div className={styles.blogsEmpty}>
              <p>No posts yet. Tap <strong>Write a Post</strong> to publish your first reflection.</p>
            </div>
          ) : (
            <div className={styles.blogsGrid}>
              {blogs.slice(0, 3).map(post => (
                <button key={post.id} className={styles.blogCard} onClick={() => onOpenBlog?.(post)}>
                  <div className={styles.blogCardDate}>
                    {new Date(post.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 className={styles.blogCardTitle}>{post.title}</h3>
                  <p className={styles.blogCardSnippet}>
                    {post.content.slice(0, 160)}{post.content.length > 160 ? '…' : ''}
                  </p>
                  <span className={styles.blogCardReadMore}>Read more →</span>
                </button>
              ))}
            </div>
          )}

          {blogs.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className={styles.ctaSecondary} onClick={onEnter}>View all {blogs.length} posts</button>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section className={styles.about}>
        <div className={styles.sectionInner}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutText}>
              <p className={styles.sectionEyebrow}>About the Author</p>
              <h2 className={styles.sectionTitle}>Mohammad Shafi</h2>
              <p className={styles.aboutDesc}>
                Written from Mumbai, India and completed on 14th May 2018, this tafsir
                was born from a conviction that the Qur'aan's divine Message remains valid
                for all times — and must be studied in the changing perspectives of changing times.
              </p>
              <p className={styles.aboutDesc}>
                Unlike commentaries that confine the universal Message to 7th-century circumstances,
                this Modern Tafsir helps readers understand Islam in its pristine simplicity,
                clarity, beauty, and purity — through the Qur'aan's own words.
              </p>
              <blockquote className={styles.quote}>
                "Study the Qur'aan in Qur'aanic light to understand Islam in its pristine simplicity, clarity, beauty, and purity."
                <cite>— Mohammad Shafi</cite>
              </blockquote>
            </div>
            <div className={styles.aboutVisual}>
              <div className={styles.aboutCard}>
                <div className={styles.aboutCardAr}>﴿ اقۡرَأۡ بِاسۡمِ رَبِّكَ ﴾</div>
                <div className={styles.aboutCardEn}>"Read in the name of your Lord"</div>
                <div className={styles.aboutCardRef}>Surah Al-Alaq · 96:1</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaBannerTitle}>Begin your study today</h2>
          <p className={styles.ctaBannerSub}>All 114 Surahs, with tafsir, available instantly — no account required.</p>
          <button className={styles.ctaBannerBtn} onClick={onEnter}>
            Open Qur'aanic Studies
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerTitle}>Qur'aanic Studies</span>
            <span className={styles.footerSub}>A Modern Tafsir by Mohammad Shafi · Mumbai, India · 2018</span>
          </div>
          {SOCIAL_LINKS.length > 0 && (
            <div className={styles.socialRow}>
              {SOCIAL_LINKS.map(({ platform, url, label }) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  title={label}
                  aria-label={label}
                >
                  <SocialIcon platform={platform} />
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>

    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{desc}</p>
    </div>
  )
}

function IconBook() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
}
function IconTranslit() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h10M4 17h7"/></svg>
}
function IconTranslate() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h12M9 3v2m0 0c0 3-1.5 6-4 8m4-8c0 3 1.5 6 4 8M5 13c1 .9 2.4 1.6 4 2"/><path d="M13 21l4-9 4 9M15.5 16h5"/></svg>
}
function IconNotes() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
}
function IconSearch() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
}
function IconBookmark() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
}

function SocialIcon({ platform }) {
  if (platform === 'facebook') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  )
  if (platform === 'instagram') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
  )
  if (platform === 'twitter') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
  if (platform === 'youtube') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12z"/>
    </svg>
  )
  if (platform === 'whatsapp') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.918-1.417A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
    </svg>
  )
  if (platform === 'linkedin') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  )
  return null
}
