import { useState } from 'react'
import Logo from './Logo.jsx'
import BurgerMenu from './BurgerMenu.jsx'
import styles from './AppHeader.module.css'

export default function AppHeader({ darkMode, toggleDarkMode, auth, onNavigate, title, subtitle, rightContent, onResetProgress }) {
  const [burgerOpen, setBurgerOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <>
      <BurgerMenu
        open={burgerOpen}
        onClose={() => setBurgerOpen(false)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        auth={auth}
        context="app"
        onNavigate={onNavigate}
        onResetProgress={onResetProgress}
      />

      <div className={styles.header}>
        <button className={styles.burgerBtn} onClick={() => setBurgerOpen(true)} title="Menu">
          <BurgerIcon />
        </button>
        <button className={styles.logoBtn} onClick={onNavigate?.home} title="Back to home">
          <Logo size={32} />
        </button>
        <div className={styles.headerText}>
          <div className={styles.headerTitle}>{title || "Qur'aanic Studies"}</div>
          {subtitle && <div className={styles.headerSub}>{subtitle}</div>}
        </div>
        {rightContent}
        <button className={styles.darkToggle} onClick={toggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        {auth && (
          auth.user ? (
            <button className={styles.avatarBtn} onClick={() => setShowProfile(true)} title={auth.user.displayName}>
              {auth.user.photoURL
                ? <img src={auth.user.photoURL} alt="" className={styles.avatarImg} />
                : <span className={styles.avatarFallback}>{auth.user.email[0].toUpperCase()}</span>
              }
            </button>
          ) : (
            <button className={styles.signInBtn} onClick={auth.signIn}>Sign in</button>
          )
        )}
      </div>

      {showProfile && auth?.user && (
        <div className={styles.profileOverlay} onClick={() => setShowProfile(false)}>
          <div className={styles.profileSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.profileHandle} />
            <div className={styles.profileInfo}>
              {auth.user.photoURL && <img src={auth.user.photoURL} alt="" className={styles.profileAvatar} />}
              <div className={styles.profileName}>{auth.user.displayName}</div>
              <div className={styles.profileEmail}>{auth.user.email}</div>
              <div className={styles.profileSyncNote}>☁ Bookmarks &amp; reading progress synced</div>
            </div>
            <button className={styles.profileSignOut} onClick={() => { auth.logOut(); setShowProfile(false) }}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <line x1="3" y1="6"  x2="21" y2="6"  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="3" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function SunIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/><line x1="12" y1="1" x2="12" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
}
