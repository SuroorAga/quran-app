import styles from './LandingPage.module.css'

export default function LandingPage({ onEnter }) {
  return (
    <div className={styles.page}>

      {/* Nav */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.navLogo}>Qur'aanic Studies</span>
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
          <span>Qur'aanic Studies — A Modern Tafsir by Mohammad Shafi</span>
          <span>Mumbai, India · 2018</span>
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
