import { useEffect } from 'react'

let capacitorApp = null
let statusBar = null

async function getPlugins() {
  try {
    const { App } = await import('@capacitor/app')
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    capacitorApp = App
    statusBar = { StatusBar, Style }
  } catch {
    // running in browser — no-op
  }
}

getPlugins()

export function useAndroidBack(onBack) {
  useEffect(() => {
    if (!capacitorApp) return
    const listener = capacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        onBack?.()
      }
    })
    return () => { listener.then(l => l.remove()) }
  }, [onBack])
}

export function useStatusBar(darkMode) {
  useEffect(() => {
    if (!statusBar) return
    const { StatusBar, Style } = statusBar
    const bg = darkMode ? '#14120E' : '#F8F5EE'
    const style = darkMode ? Style.Dark : Style.Light
    StatusBar.setBackgroundColor({ color: bg }).catch(() => {})
    StatusBar.setStyle({ style }).catch(() => {})
  }, [darkMode])
}

export async function shareVerse(verse, surahName) {
  const text = `${verse.ref} — ${surahName}\n\n${verse.arabic}\n\n"${verse.translation}"`
  try {
    const { Share } = await import('@capacitor/share')
    await Share.share({ title: `Quran ${verse.ref}`, text, dialogTitle: 'Share verse' })
  } catch {
    // fallback to clipboard
    navigator.clipboard?.writeText(text)
  }
}

export async function triggerHaptic() {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // no-op in browser
  }
}
