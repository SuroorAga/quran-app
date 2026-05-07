import styles from './BurgerMenu.module.css'
import Logo from './Logo.jsx'

export default function BurgerMenu({ open, onClose, onNavigate, darkMode, toggleDarkMode, auth, context }) {
  if (!open) return null

  const nav = (action) => { action?.(); onClose() }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>

        {/* Top brand */}
        <div className={styles.brand}>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
          <div className={styles.brandCenter}>
            <Logo size={44} />
            <div className={styles.brandTitle}>Qur'aanic Studies</div>
            <div className={styles.brandSub}>A Modern Tafsir by Mohammad Shafi</div>
          </div>
          <div className={styles.brandAr}>﴿ اقۡرَأۡ بِاسۡمِ رَبِّكَ ﴾</div>
        </div>

        {/* Nav links */}
        <nav className={styles.nav}>
          {context === 'landing' ? (
            <button className={`${styles.navItem} ${styles.navItemPrimary}`} onClick={() => nav(onNavigate?.openApp)}>
              <span className={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              </span>
              <span className={styles.navLabel}>Open App</span>
              <span className={styles.navArrow}>→</span>
            </button>
          ) : (
            <button className={styles.navItem} onClick={() => nav(onNavigate?.surahs)}>
              <span className={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              </span>
              <span className={styles.navLabel}>Surahs</span>
            </button>
          )}

          <button className={styles.navItem} onClick={() => nav(onNavigate?.blog)}>
            <span className={styles.navIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>
            <span className={styles.navLabel}>Blog</span>
          </button>

          <button className={`${styles.navItem} ${styles.navItemBooks}`} onClick={() => nav(onNavigate?.books)}>
            <span className={styles.navIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </span>
            <span className={styles.navLabel}>Books</span>
            <span className={styles.shopBadge}>Shop</span>
          </button>

          {context !== 'landing' && (
            <button className={styles.navItem} onClick={() => nav(onNavigate?.home)}>
              <span className={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              <span className={styles.navLabel}>Home</span>
            </button>
          )}
        </nav>

        <div className={styles.divider} />

        {/* Dark mode toggle */}
        <div className={styles.setting}>
          <span className={styles.settingLabel}>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          <button className={`${styles.toggle} ${darkMode ? styles.toggleOn : ''}`} onClick={toggleDarkMode}>
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.divider} />

        {/* Auth */}
        <div className={styles.authArea}>
          {auth?.user ? (
            <div className={styles.userCard}>
              {auth.user.photoURL
                ? <img src={auth.user.photoURL} alt="" className={styles.userAvatar} />
                : <div className={styles.userAvatarFallback}>{auth.user.email[0].toUpperCase()}</div>
              }
              <div className={styles.userInfo}>
                <div className={styles.userName}>{auth.user.displayName}</div>
                <div className={styles.userEmail}>{auth.user.email}</div>
                <div className={styles.userSync}>☁ Synced across devices</div>
              </div>
              <button className={styles.signOutBtn} onClick={() => nav(auth.logOut)}>Sign out</button>
            </div>
          ) : (
            <button className={styles.signInBtn} onClick={() => nav(auth?.signIn)}>
              <GoogleIcon />
              Sign in with Google
            </button>
          )}
        </div>

        {/* Bottom ornament */}
        <div className={styles.ornament}>
          <span className={styles.ornamentLine} />
          <span className={styles.ornamentDot}>✦</span>
          <span className={styles.ornamentLine} />
        </div>

      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
