"""
Targeted fix: extract bold notes for surahs 73-76 from Part II files 09-10.
These surahs were missed because extract_part2_late.py looked for plain text notes,
but the PDF uses the same bold 10pt format as all other surahs.
"""

import pdfplumber
import json
import re
import os
from collections import defaultdict

DATA_DIR = "public/data"
PDF_FILES = [
    "/tmp/qur_part2/QuraanicStudies_PART_II_09.pdf",
    "/tmp/qur_part2/QuraanicStudies_PART_II_10.pdf",
]
TARGET_SURAHS = {73, 74, 75, 76}

CHAPTER_PAT = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
VERSE_PAT = re.compile(r'^(\d+):(\d+)\.\s*(.*)', re.DOTALL)
NOTE_START_PAT = re.compile(r'^(\d+[a-z]?)\.\s*(.*)', re.DOTALL)


def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname or '-BD' in fontname


def classify_line(line_words):
    bold_count = sum(1 for w in line_words if is_bold(w.get('fontname', '')))
    sizes = [w.get('size', 0) for w in line_words]
    avg_size = sum(sizes) / len(sizes) if sizes else 0
    return bold_count > len(line_words) / 2, avg_size


def extract_notes():
    notes = {}  # { "73:2": ["note text..."] }
    state = {'current_surah': None, 'current_verse_ref': None}

    for pdf_path in PDF_FILES:
        if not os.path.exists(pdf_path):
            print(f"SKIP (not found): {pdf_path}")
            continue
        print(f"Processing: {os.path.basename(pdf_path)}")
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                try:
                    words = page.extract_words(extra_attrs=["fontname", "size"])
                except Exception as e:
                    print(f"  ERROR page {i+1}: {e}")
                    continue

                lines = defaultdict(list)
                for w in words:
                    lines[round(w.get('top', 0))].append(w)

                for top in sorted(lines):
                    line_words = sorted(lines[top], key=lambda w: w.get('x0', 0))
                    line_text = ' '.join(w.get('text', '') for w in line_words).strip()
                    if not line_text:
                        continue

                    bold, avg_size = classify_line(line_words)

                    # Chapter header
                    if avg_size > 15:
                        m = CHAPTER_PAT.search(line_text)
                        if m:
                            state['current_surah'] = int(m.group(1))
                            state['current_verse_ref'] = None
                        continue

                    # Translation line (~14pt regular) — track verse ref
                    if not bold and avg_size > 12.5:
                        m = VERSE_PAT.match(line_text)
                        if m:
                            surah = int(m.group(1))
                            verse = int(m.group(2))
                            if state['current_surah'] == surah:
                                state['current_verse_ref'] = f"{surah}:{verse}"
                        continue

                    # Note line (bold, ~10pt)
                    if bold and avg_size < 12:
                        ref = state['current_verse_ref']
                        if not ref:
                            continue
                        # Only collect notes for target surahs
                        surah_num = int(ref.split(':')[0])
                        if surah_num not in TARGET_SURAHS:
                            continue
                        m = NOTE_START_PAT.match(line_text)
                        if m:
                            note_text = m.group(2).strip()
                            notes.setdefault(ref, []).append(note_text)
                        elif ref in notes and notes[ref]:
                            notes[ref][-1] += ' ' + line_text

    return notes


def merge_notes(notes):
    updated = 0
    for surah_num in TARGET_SURAHS:
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            print(f"  MISSING: {path}")
            continue
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)

        changed = False
        for verse in verses:
            ref = verse.get('ref', '')
            if ref in notes and notes[ref]:
                if not verse.get('notes', '').strip():
                    verse['notes'] = '\n\n'.join(notes[ref])
                    changed = True
                    updated += 1

        if changed:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(verses, f, ensure_ascii=False, indent=2)
            print(f"  Surah {surah_num}: updated")
        else:
            print(f"  Surah {surah_num}: no changes")

    print(f"\nTotal verses updated: {updated}")


def main():
    notes = extract_notes()

    by_surah = {}
    for ref in notes:
        s = ref.split(':')[0]
        by_surah[s] = by_surah.get(s, 0) + 1
    print(f"\nNotes found: {sum(by_surah.values())} verses across surahs {sorted(by_surah.keys(), key=int)}")

    print("\nMerging into JSON...")
    merge_notes(notes)

    print("\nVerification:")
    for s in sorted(TARGET_SURAHS):
        path = f"{DATA_DIR}/surah_{s}.json"
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)
        with_notes = sum(1 for v in verses if v.get('notes', '').strip())
        print(f"  Surah {s}: {with_notes}/{len(verses)} verses have notes")


if __name__ == "__main__":
    main()
