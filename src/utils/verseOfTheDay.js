/**
 * Returns a deterministic verse of the day based on the current date.
 * Uses a curated list of meaningful verse refs from surahs 1-25 (where notes exist).
 */

const FEATURED_VERSES = [
  '1:1', '1:2', '1:5', '1:6',
  '2:2', '2:3', '2:21', '2:25', '2:30', '2:45', '2:62', '2:112',
  '2:152', '2:177', '2:183', '2:255', '2:256', '2:285', '2:286',
  '3:7', '3:17', '3:26', '3:31', '3:85', '3:102', '3:133', '3:159', '3:185', '3:190',
  '4:1', '4:36', '4:58', '4:103', '4:135',
  '5:2', '5:8', '5:32', '5:48',
  '6:12', '6:54', '6:103', '6:162',
  '7:29', '7:56', '7:180', '7:205',
  '9:51', '9:71', '9:119',
  '10:62', '10:107',
  '11:6', '11:88',
  '12:64', '12:87', '12:101',
  '13:11', '13:28',
  '14:7', '14:31',
  '15:9', '15:49',
  '16:90', '16:97', '16:128',
  '17:23', '17:36', '17:44', '17:79',
  '18:10', '18:46', '18:107',
  '19:96',
  '20:14', '20:114',
  '21:107',
  '22:37', '22:46',
  '23:1', '23:115',
  '24:35', '24:55',
  '25:63', '25:74',
]

/**
 * Get today's featured verse ref.
 * Deterministic: same date always returns same verse.
 */
export function getVerseOfTheDayRef() {
  const now = new Date()
  // Day number since epoch
  const dayNum = Math.floor(now.getTime() / (1000 * 60 * 60 * 24))
  const idx = dayNum % FEATURED_VERSES.length
  return FEATURED_VERSES[idx]
}

/**
 * Given all loaded verse data (flat array), find the verse of the day.
 */
export function findVerseOfTheDay(allVerses) {
  const ref = getVerseOfTheDayRef()
  return allVerses.find(v => v.ref === ref) || null
}
