# Qur'aanic Studies App — Requirements

## Overview
A web app (PWA) built for Mohammad Shafi's life work — a complete verse-by-verse tafsir of the Qur'aan. The app must be usable by his family and the general public, work on mobile browsers, and eventually be packaged as native iOS and Android apps.

---

## Current State (Already Built)
- Landing page with author info and feature highlights
- Surah list with search, Meccan/Medinan/Tafsir filters, dark mode
- Surah reader with Arabic, transliteration, translation, tafsir notes, font scaling, jump-to-verse, copy
- Full-text search across all 114 surahs
- Bookmarks with grouping by surah or recency
- Resume reading (last position saved to localStorage)
- Bottom navigation: Surahs / Search / Saved

## Data Status
- All 114 surahs have Arabic text, transliteration, and translation ✅
- Surahs 1–25 have grandfather's tafsir notes extracted from Part I PDF ✅
- Surahs 26–114 notes pending Part II PDF (to be added later) ⏳

---

## Requirements

### REQ-1: Data Extraction Pipeline
- **REQ-1.1** Extract tafsir notes from Part II PDF (surahs 26–114) using the same font-based extraction script when PDF is provided
- **REQ-1.2** Notes are identified by bold 10pt font (TimesNewRomanPS-BoldMT) in the PDF
- **REQ-1.3** Translation text is identified by regular 14pt font
- **REQ-1.4** Extraction must be resumable (checkpoint file) in case of interruption
- **REQ-1.5** Sync `src/data/` and `public/data/` to stay identical after any extraction

### REQ-2: Progressive Web App (PWA)
- **REQ-2.1** App must be installable on iPhone and Android home screen via browser
- **REQ-2.2** All 114 surahs must be readable offline after first visit
- **REQ-2.3** Service worker must cache all surah JSON files and static assets
- **REQ-2.4** App must show an "install" prompt on supported browsers
- **REQ-2.5** Manifest must include correct name, icons, theme color (gold/emerald)

### REQ-3: Share Verse Feature
- **REQ-3.1** Each verse must have a "Share" button alongside Save and Copy
- **REQ-3.2** Sharing generates a beautiful image card with: Arabic text, translation, verse ref, and app name
- **REQ-3.3** On mobile, use the native Web Share API (share sheet)
- **REQ-3.4** On desktop, copy a formatted text version to clipboard
- **REQ-3.5** Shared image must look good on WhatsApp, Instagram, and iMessage

### REQ-4: Juz (Para) Navigation
- **REQ-4.1** Add a "Juz" tab or filter so users can browse by the 30 Juz divisions
- **REQ-4.2** Each Juz shows which surahs and verse ranges it covers
- **REQ-4.3** Tapping a Juz opens the reader at the correct starting verse

### REQ-5: Verse of the Day
- **REQ-5.1** Landing page and/or home screen shows a featured verse each day
- **REQ-5.2** Verse rotates daily (deterministic based on date, no server needed)
- **REQ-5.3** User can save or share the verse of the day directly

### REQ-6: Reading Progress
- **REQ-6.1** Track which verses the user has scrolled past (read)
- **REQ-6.2** Show a progress bar or percentage on each surah in the list
- **REQ-6.3** Show overall Qur'aan reading progress (e.g. "12% complete")
- **REQ-6.4** Progress is stored in localStorage, no account required

### REQ-7: UI/UX Improvements
- **REQ-7.1** Surah reader header must stay fixed while scrolling
- **REQ-7.2** Smooth scroll-to-top button appears after scrolling down in reader
- **REQ-7.3** Verse cards should have a subtle highlight animation when jumped to
- **REQ-7.4** Search results must show which part of the text matched (already partially done)
- **REQ-7.5** Empty states (no bookmarks, no search results) must be friendly and helpful

### REQ-8: iOS & Android Packaging
- **REQ-8.1** Use Capacitor to wrap the Vite/React app into a native shell
- **REQ-8.2** iOS app must support safe area insets (notch, home indicator)
- **REQ-8.3** Android app must target API level 33+
- **REQ-8.4** App store metadata: name "Qur'aanic Studies", category "Education/Books"
- **REQ-8.5** This is the final step — done after PWA is stable

---

## Non-Requirements (Out of Scope)
- Audio recitation (future phase)
- User accounts or cloud sync
- Urdu translation (future phase)
- Multi-user or social features
