import styles from './BooksPage.module.css'
import AppHeader from '../components/AppHeader.jsx'

const BOOKS = [
  { asin: '1791794173', volume: 'I',   manzil: 'Manzil I',   surahs: 'Al-Fatihah – Al-Baqarah',  arabic: 'اقْرَأْ',  meaning: 'Read' },
  { asin: '1791973752', volume: 'II',  manzil: 'Manzil II',  surahs: 'Al-Baqarah – Al-Imran',    arabic: 'نُورٌ',    meaning: 'Light' },
  { asin: '1792035624', volume: 'III', manzil: 'Manzil III', surahs: 'An-Nisa – Al-Maʾidah',     arabic: 'هُدًى',    meaning: 'Guidance' },
  { asin: '1792183186', volume: 'IV',  manzil: 'Manzil IV',  surahs: 'Al-Anʿam – Al-Aʿraf',      arabic: 'رَحْمَة',  meaning: 'Mercy' },
  { asin: '1792189346', volume: 'V',   manzil: 'Manzil V',   surahs: 'Al-Anfal – Hud',           arabic: 'صِدْق',    meaning: 'Truth' },
  { asin: '1792634846', volume: 'VI',  manzil: 'Manzil VI',  surahs: 'Yusuf – Al-Kahf',          arabic: 'حِكْمَة',  meaning: 'Wisdom' },
  { asin: '1792673590', volume: 'VII', manzil: 'Manzil VII', surahs: 'Maryam – An-Nas',          arabic: 'سَلَام',   meaning: 'Peace' },
]

function amazonUrl(asin) {
  return `https://amazon.com/dp/${asin}`
}

function BookCover({ volume, arabic, meaning, manzil }) {
  return (
    <svg
      viewBox="0 0 160 240"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.coverSvg}
      aria-label={`Qur'aanic Studies Volume ${volume}`}
    >
      <defs>
        <linearGradient id={`bg-${volume}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D4A34" />
          <stop offset="100%" stopColor="#071F15" />
        </linearGradient>
        <linearGradient id={`shine-${volume}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(201,168,76,0.18)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="160" height="240" fill={`url(#bg-${volume})`} />

      {/* Shine overlay */}
      <rect width="80" height="240" fill={`url(#shine-${volume})`} opacity="0.4" />

      {/* Outer border */}
      <rect x="6" y="6" width="148" height="228" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.6" />

      {/* Inner border */}
      <rect x="11" y="11" width="138" height="218" fill="none" stroke="#C9A84C" strokeWidth="0.4" opacity="0.35" />

      {/* Corner ornaments */}
      <g stroke="#C9A84C" strokeWidth="1" fill="none" opacity="0.75">
        {/* TL */}
        <path d="M6 18 L6 6 L18 6" />
        <circle cx="6" cy="6" r="2" fill="#C9A84C" opacity="0.5" />
        {/* TR */}
        <path d="M154 18 L154 6 L142 6" />
        <circle cx="154" cy="6" r="2" fill="#C9A84C" opacity="0.5" />
        {/* BL */}
        <path d="M6 222 L6 234 L18 234" />
        <circle cx="6" cy="234" r="2" fill="#C9A84C" opacity="0.5" />
        {/* BR */}
        <path d="M154 222 L154 234 L142 234" />
        <circle cx="154" cy="234" r="2" fill="#C9A84C" opacity="0.5" />
      </g>

      {/* Series name at top */}
      <text x="80" y="28" textAnchor="middle" fill="#C9A84C" fontSize="6.5" fontFamily="Georgia, serif" letterSpacing="1.2" opacity="0.85">
        QUR'AANIC STUDIES
      </text>

      {/* Top divider */}
      <line x1="22" y1="34" x2="138" y2="34" stroke="#C9A84C" strokeWidth="0.5" opacity="0.4" />

      {/* Central diamond ornament */}
      <g transform="translate(80, 88)">
        <polygon points="0,-24 17,0 0,24 -17,0" fill="none" stroke="#C9A84C" strokeWidth="0.7" opacity="0.3" />
        <polygon points="0,-16 11,0 0,16 -11,0" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.2" />
      </g>

      {/* Arabic word — main focal point */}
      <text x="80" y="98" textAnchor="middle" fill="#E8C96A" fontSize="29" fontFamily="'Amiri', Georgia, serif" opacity="0.95">
        {arabic}
      </text>

      {/* Meaning */}
      <text x="80" y="114" textAnchor="middle" fill="#C9A84C" fontSize="7" fontFamily="Georgia, serif" fontStyle="italic" opacity="0.6">
        {meaning}
      </text>

      {/* Middle divider with diamond */}
      <line x1="22" y1="125" x2="67" y2="125" stroke="#C9A84C" strokeWidth="0.5" opacity="0.35" />
      <polygon points="80,121 84,125 80,129 76,125" fill="#C9A84C" opacity="0.4" />
      <line x1="93" y1="125" x2="138" y2="125" stroke="#C9A84C" strokeWidth="0.5" opacity="0.35" />

      {/* Volume number */}
      <text x="80" y="154" textAnchor="middle" fill="white" fontSize="26" fontFamily="Georgia, serif" fontWeight="bold" opacity="0.9">
        {volume}
      </text>
      <text x="80" y="165" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="Georgia, serif" letterSpacing="2">
        VOLUME
      </text>

      {/* Bottom divider */}
      <line x1="22" y1="175" x2="138" y2="175" stroke="#C9A84C" strokeWidth="0.5" opacity="0.4" />

      {/* Manzil at bottom */}
      <text x="80" y="189" textAnchor="middle" fill="#C9A84C" fontSize="8" fontFamily="Georgia, serif" fontWeight="bold" opacity="0.85">
        {manzil}
      </text>

      {/* Author */}
      <text x="80" y="202" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="6" fontFamily="Georgia, serif" fontStyle="italic">
        Mohammad Shafi
      </text>

      {/* Bottom spine line */}
      <rect x="0" y="0" width="6" height="240" fill="rgba(0,0,0,0.25)" />
      <rect x="0" y="0" width="2" height="240" fill="rgba(201,168,76,0.15)" />
    </svg>
  )
}

export default function BooksPage({ onBack, darkMode, toggleDarkMode, auth, onNavigate }) {
  return (
    <div className={styles.page}>
      <AppHeader
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        auth={auth}
        title="Books"
        subtitle="Qur'aanic Studies Series"
        onNavigate={onNavigate}
      />

      <div className={styles.scroll}>

        {/* Slim hero */}
        <div className={styles.hero}>
          <div className={styles.heroAr} aria-hidden="true">﴿ اقۡرَأۡ بِاسۡمِ رَبِّكَ ﴾</div>
          <h1 className={styles.heroTitle}>Qur'aanic Studies</h1>
          <p className={styles.heroSub}>A complete 7-volume tafsir by Mohammad Shafi · Available on Amazon</p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>7 Volumes</span>
            <span className={styles.badge}>Verse-by-Verse</span>
            <span className={styles.badge}>Paperback &amp; Digital</span>
          </div>
        </div>

        {/* Books grid */}
        <div className={styles.section}>
          <div className={styles.grid}>
            {BOOKS.map(book => (
              <div key={book.asin} className={styles.card}>
                <div className={styles.cardCover}>
                  <BookCover volume={book.volume} arabic={book.arabic} meaning={book.meaning} manzil={book.manzil} />
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
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className={styles.quote}>
          <div className={styles.quoteText}>
            "Study the Qur'aan in Qur'aanic light to understand Islam in its pristine simplicity, clarity, beauty, and purity."
          </div>
          <div className={styles.quoteAuthor}>— Mohammad Shafi</div>
        </div>

        <div className={styles.footer}>
          <p>Available worldwide through Amazon. Prices may vary by region.</p>
        </div>

      </div>
    </div>
  )
}
