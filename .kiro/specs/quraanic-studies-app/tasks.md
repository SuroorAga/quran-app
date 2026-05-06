# Qur'aanic Studies App — Implementation Tasks

Tasks are ordered easy → hard. Each builds on the previous.

---

## Phase 1: Quick Wins (1–2 hours each)

### TASK-1: Fix data sync
- [ ] Copy all `public/data/*.json` to `src/data/` (or update vite config to serve from one place)
- [ ] Verify `chapters.json` has `has_tafsir: true` for surahs 1–25
- Refs: REQ-1.5

### TASK-2: UI polish — reader improvements
- [ ] Fix surah reader header to stay sticky while scrolling
- [ ] Add scroll-to-top button (appears after 300px scroll)
- [ ] Add highlight animation on verse when jumped to via "Go" button
- [ ] Improve empty states on Bookmarks and Search pages
- Refs: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.5

### TASK-3: Verse of the Day
- [ ] Add `getVerseOfTheDay()` utility — picks a verse deterministically by date
- [ ] Show it on the SurahList home screen (above the surah list, below resume banner)
- [ ] Include Save and Share buttons on the card
- Refs: REQ-5.1, REQ-5.2, REQ-5.3

### TASK-4: Share verse feature
- [ ] Add Share button to each verse card in SurahReader
- [ ] On mobile: use `navigator.share()` with formatted text
- [ ] On desktop: copy formatted text to clipboard with confirmation
- [ ] Format: Arabic + translation + ref + "— Qur'aanic Studies by Mohammad Shafi"
- [ ] Stretch: canvas-based image card for sharing as image
- Refs: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4

---

## Phase 2: Core Features (half day each)

### TASK-5: Reading progress tracking
- [ ] Create `useReadingProgress` hook — stores read verse refs in localStorage
- [ ] Mark verses as read when they scroll into view (IntersectionObserver)
- [ ] Show progress bar on each surah row in SurahList
- [ ] Show total progress (X of 6236 verses) in SurahList header
- Refs: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4

### TASK-6: Juz navigation
- [ ] Add `juz.json` data file with 30 Juz, each with surah/verse start and end
- [ ] Add "Juz" filter pill to SurahList (alongside All / Meccan / Medinan / Tafsir)
- [ ] When a Juz is selected, show the surahs in that Juz
- [ ] Tapping opens SurahReader at the correct starting verse
- Refs: REQ-4.1, REQ-4.2, REQ-4.3

---

## Phase 3: PWA (1 day)

### TASK-7: Progressive Web App setup
- [ ] Install `vite-plugin-pwa` and configure in `vite.config.js`
- [ ] Create `public/manifest.json` with correct name, icons, colors
- [ ] Generate app icons (512x512, 192x192) using the existing Logo component
- [ ] Configure service worker to precache all surah JSON files
- [ ] Add install prompt banner in the app UI
- [ ] Test offline mode: open app, turn off wifi, verify all surahs still load
- Refs: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5

---

## Phase 4: Data (when Part II PDF is ready)

### TASK-8: Extract Part II notes (surahs 26–114)
- [ ] Receive Part II PDF from user
- [ ] Run `scripts/extract_slow.py` (or v2) against Part II PDF
- [ ] Verify note counts per surah look reasonable
- [ ] Update `chapters.json` `has_tafsir` flags for newly covered surahs
- Refs: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4

---

## Phase 5: Native App (last)

### TASK-9: Capacitor iOS & Android packaging
- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`
- [ ] `npx cap init` with app name and bundle ID
- [ ] Build the Vite app: `npm run build`
- [ ] `npx cap add ios` and `npx cap add android`
- [ ] Fix safe area insets for iOS notch
- [ ] Test on simulator/emulator
- [ ] Prepare app store assets (screenshots, description, icon)
- Refs: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5

---

## Order Summary
1. TASK-1 → TASK-2 → TASK-3 → TASK-4 (quick wins, visible improvements)
2. TASK-5 → TASK-6 (core features)
3. TASK-7 (PWA — makes it installable)
4. TASK-8 (when Part II PDF arrives)
5. TASK-9 (native app — final step)
