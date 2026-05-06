"""
Extract notes from Part II files 10-12 (surahs ~73-114).
In these files notes are NOT bold - they're regular numbered paragraphs.
Pattern: line starting with a number+period after a verse line.
"""

import pdfplumber
import json
import re
import os
from collections import defaultdict

DATA_DIR = "public/data"

CHAPTER_PAT = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
VERSE_PAT = re.compile(r'^(\d+):(\d+)\.\s+(.+)')
NOTE_PAT = re.compile(r'^(\d+)\.\s+(.+)')
MANZIL_PAT = re.compile(r'^Manzil\s+', re.IGNORECASE)
PAGE_NUM_PAT = re.compile(r'^\d{3,4}$')

def extract_notes_text_based(pdf_files):
    notes = {}  # { "76:7": ["note text"] }
    current_surah = None
    current_verse_ref = None

    for pdf_path in sorted(pdf_files):
        print(f"Processing: {os.path.basename(pdf_path)}")
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                for line in text.split('\n'):
                    line = line.strip()
                    if not line:
                        continue

                    # Skip page headers and numbers
                    if MANZIL_PAT.match(line) or PAGE_NUM_PAT.match(line):
                        continue

                    # Chapter header
                    m = CHAPTER_PAT.match(line)
                    if m:
                        current_surah = int(m.group(1))
                        current_verse_ref = None
                        continue

                    # Verse line: "76:7. Translation text"
                    m = VERSE_PAT.match(line)
                    if m:
                        surah = int(m.group(1))
                        verse = int(m.group(2))
                        if current_surah and surah == current_surah:
                            current_verse_ref = f"{surah}:{verse}"
                        continue

                    # Note line: starts with number+period
                    m = NOTE_PAT.match(line)
                    if m and current_verse_ref:
                        note_text = m.group(2).strip()
                        if current_verse_ref not in notes:
                            notes[current_verse_ref] = []
                        notes[current_verse_ref].append(note_text)
                        continue

                    # Continuation of last note
                    if current_verse_ref and current_verse_ref in notes and notes[current_verse_ref]:
                        # Only append if it looks like prose (not a new verse or chapter)
                        if not VERSE_PAT.match(line) and not CHAPTER_PAT.match(line):
                            notes[current_verse_ref][-1] += ' ' + line

    return notes

def merge_notes(notes_by_ref):
    updated = 0
    for surah_num in range(73, 115):
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            continue
        with open(path) as f:
            verses = json.load(f)

        changed = False
        for verse in verses:
            ref = verse.get('ref', '')
            if ref in notes_by_ref and notes_by_ref[ref]:
                if not verse.get('notes', '').strip():
                    verse['notes'] = '\n\n'.join(notes_by_ref[ref])
                    changed = True
                    updated += 1

        if changed:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(verses, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated} verses in surahs 73-114")

def main():
    # Files 10-12 cover surahs ~73-114
    pdf_files = [
        f"/tmp/qur_part2/QuraanicStudies_PART_II_{n:02d}.pdf"
        for n in [10, 11, 12]
    ]
    pdf_files = [f for f in pdf_files if os.path.exists(f)]
    print(f"Processing {len(pdf_files)} files: {[os.path.basename(f) for f in pdf_files]}")

    notes = extract_notes_text_based(pdf_files)

    by_surah = {}
    for ref in notes:
        s = ref.split(':')[0]
        by_surah[s] = by_surah.get(s, 0) + 1

    print(f"\nFound notes for {len(notes)} verses across surahs: {sorted(by_surah.keys(), key=int)}")

    print("\nMerging into JSON...")
    merge_notes(notes)

    print("\nVerification:")
    for s in [76, 85, 100, 109, 110, 114]:
        path = f"{DATA_DIR}/surah_{s}.json"
        if os.path.exists(path):
            with open(path) as f:
                verses = json.load(f)
            with_notes = sum(1 for v in verses if v.get('notes'))
            print(f"  Surah {s}: {with_notes}/{len(verses)} verses have notes")

if __name__ == "__main__":
    main()
