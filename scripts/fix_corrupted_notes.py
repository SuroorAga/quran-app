"""
Fix corrupted notes in surahs 77-114.
The extract_part2_late.py script mistakenly placed transliteration lines
into the notes field. This script:
  1. Re-extracts bold notes from the PDFs (correct method)
  2. Clears any verse note that looks like a transliteration
  3. Applies only the legitimate bold-detected notes
"""

import pdfplumber
import json
import re
import os
from collections import defaultdict

DATA_DIR = "public/data"
PDF_FILES = sorted([
    f"/tmp/qur_part2/QuraanicStudies_PART_II_{n:02d}.pdf"
    for n in range(1, 13)
    if os.path.exists(f"/tmp/qur_part2/QuraanicStudies_PART_II_{n:02d}.pdf")
])
TARGET_RANGE = range(77, 115)

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


def looks_like_transliteration(text):
    if not text:
        return False
    words = text.split()
    if len(words) > 15:
        return False
    if len(text) < 60 and re.search(r'[Aa][Aa]|oo|ee|iyy', text):
        return True
    return False


def extract_bold_notes():
    notes = {}
    state = {'current_surah': None, 'current_verse_ref': None}

    for pdf_path in PDF_FILES:
        print(f"  Scanning {os.path.basename(pdf_path)}...", end="", flush=True)
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                try:
                    words = page.extract_words(extra_attrs=["fontname", "size"])
                except Exception:
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
                    if avg_size > 15:
                        m = CHAPTER_PAT.search(line_text)
                        if m:
                            state['current_surah'] = int(m.group(1))
                            state['current_verse_ref'] = None
                        continue
                    if not bold and avg_size > 12.5:
                        m = VERSE_PAT.match(line_text)
                        if m:
                            surah, verse = int(m.group(1)), int(m.group(2))
                            if state['current_surah'] == surah:
                                state['current_verse_ref'] = f"{surah}:{verse}"
                        continue
                    if bold and avg_size < 12:
                        ref = state['current_verse_ref']
                        if not ref:
                            continue
                        m = NOTE_START_PAT.match(line_text)
                        if m:
                            notes.setdefault(ref, []).append(m.group(2).strip())
                        elif ref in notes and notes[ref]:
                            notes[ref][-1] += ' ' + line_text
        print(" done")
    return notes


def fix_surahs(bold_notes):
    total_cleared = 0
    total_added = 0

    for surah_num in TARGET_RANGE:
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)

        cleared = 0
        added = 0
        for verse in verses:
            ref = verse.get('ref', '')
            current_note = verse.get('notes', '')

            # Clear if it looks like a transliteration
            if looks_like_transliteration(current_note):
                verse['notes'] = ''
                cleared += 1

            # Apply bold-extracted note if verse now has no note
            if not verse.get('notes', '').strip() and ref in bold_notes and bold_notes[ref]:
                verse['notes'] = '\n\n'.join(bold_notes[ref])
                added += 1

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(verses, f, ensure_ascii=False, indent=2)

        final_notes = sum(1 for v in verses if v.get('notes', '').strip())
        print(f"  Surah {surah_num}: cleared {cleared} bad, added {added} good → {final_notes}/{len(verses)} verses have notes")
        total_cleared += cleared
        total_added += added

    print(f"\nTotal: cleared {total_cleared} corrupt notes, added {total_added} correct notes")


def main():
    print("Step 1: Re-extracting bold notes from PDFs...")
    bold_notes = extract_bold_notes()

    in_range = {k: v for k, v in bold_notes.items()
                if int(k.split(':')[0]) in TARGET_RANGE}
    print(f"  Found {len(in_range)} verse notes for surahs 77-114\n")

    print("Step 2: Fixing JSON files...")
    fix_surahs(bold_notes)

    print("\nFinal verification:")
    for s in sorted(TARGET_RANGE):
        path = f"{DATA_DIR}/surah_{s}.json"
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)
        with_notes = sum(1 for v in verses if v.get('notes', '').strip())
        if with_notes:
            print(f"  Surah {s}: {with_notes}/{len(verses)} verses have notes")


if __name__ == "__main__":
    main()
