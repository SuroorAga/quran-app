import styles from './BooksPage.module.css'

const BOOKS = [
  { asin: '1791794173', volume: 'I',   manzil: 'Manzil I',   surahs: 'Al-Fatihah – Al-Baqarah' },
  { asin: '1791973752', volume: 'II',  manzil: 'Manzil II',  surahs: 'Al-Baqarah – Al-Imran' },
  { asin: '1792035624', volume: 'III', manzil: 'Manzil III', surahs: 'An-Nisa – Al-Maʾidah' },
  { asin: '1792183186', volume: 'IV',  manzil: 'Manzil IV',  surahs: 'Al-Anʿam – Al-Aʿraf' },
  { asin: '1792189346', volume: 'V',   manzil: 'Manzil V',   surahs: 'Al-Anfal – Hud' },
  { asin: '1792634846', volume: 'VI',  manzil: 'Manzil VI',  surahs: 'Yusuf – Al-Kahf' },
  { asin: '1792673590', volume: 'VII', manzil: 'Manzil VII', surahs: 'Maryam – An-Nas' },
]

function coverUrl(asin) {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`
}

function amazonUrl(asin) {
  return `https://amazon.com/dp/${asin}`
}

export default function BooksPage({ onBack }) {
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10l5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      <div className={styles.scroll}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroDecor} aria-hidden="true">
            <span className={styles.heroAr}>﴿ اقۡرَأۡ ﴾</span>
          </div>
          <p className={styles.heroEyebrow}>Now available on Amazon</p>
          <h1 className={styles.heroTitle}>Qur'aanic Studies</h1>
          <p className={styles.heroSubtitle}>A Modern Tafsir</p>
          <p className={styles.heroAuthor}>by Mohammad Shafi</p>
          <p className={styles.heroDesc}>
            A complete verse-by-verse commentary on the Holy Qur'aan in 7 volumes,
            drawing exclusively on the Qur'aan itself — written from Mumbai, India and
            completed in 2018.
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>7 Volumes</span>
            <span className={styles.badge}>Complete Tafsir</span>
            <span className={styles.badge}>Paperback &amp; Digital</span>
          </div>
        </div>

        {/* Books grid */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>The Complete Series</h2>
          <p className={styles.sectionSub}>Each volume covers one Manzil — the traditional weekly division of the Qur'aan.</p>
          <div className={styles.grid}>
            {BOOKS.map(book => (
              <div key={book.asin} className={styles.card}>
                <div className={styles.cardCover}>
                  <img
                    src={coverUrl(book.asin)}
                    alt={`Qur'aanic Studies Volume ${book.volume}`}
                    className={styles.coverImg}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                  />
                  <div className={styles.coverFallback}>
                    <span className={styles.coverFallbackVol}>Vol. {book.volume}</span>
                    <span className={styles.coverFallbackAr}>قرآنية</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardVol}>Volume {book.volume}</div>
                  <div className={styles.cardManzil}>{book.manzil}</div>
                  <div className={styles.cardSurahs}>{book.surahs}</div>
                  <a
                    href={amazonUrl(book.asin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.buyBtn}
                  >
                    Buy on Amazon
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle CTA */}
        <div className={styles.bundleBanner}>
          <div className={styles.bundleInner}>
            <h2 className={styles.bundleTitle}>Get all 7 volumes</h2>
            <p className={styles.bundleSub}>
              Complete your library with the full Qur'aanic Studies series — a lifelong reference for every Muslim household.
            </p>
            <div className={styles.bundleBtns}>
              {BOOKS.map(b => (
                <a key={b.asin} href={amazonUrl(b.asin)} target="_blank" rel="noopener noreferrer" className={styles.bundleVolBtn}>
                  Vol. {b.volume}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* About author */}
        <div className={styles.about}>
          <div className={styles.aboutCard}>
            <div className={styles.aboutQuote}>
              "Study the Qur'aan in Qur'aanic light to understand Islam in its pristine simplicity, clarity, beauty, and purity."
            </div>
            <div className={styles.aboutAuthor}>— Mohammad Shafi</div>
            <p className={styles.aboutDesc}>
              Written from Mumbai, India, this tafsir was born from a conviction that the Qur'aan's divine Message
              remains valid for all times — and must be studied in the changing perspectives of changing times.
              Unlike commentaries that confine the universal Message to 7th-century circumstances, this work
              helps readers understand Islam through the Qur'aan's own words.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <p>Available worldwide through Amazon. Prices may vary by region.</p>
        </div>

      </div>
    </div>
  )
}
