"""
extract_part2.py - Extract tafsir notes from Part II PDF (surahs 26-114).
Same logic as extract_complete.py but pointed at Part II PDF.
"""

import pdfplumber
import json
import re
import os
import zipfile
from collections import defaultdict

ZIP_PATH = "/Users/aneesajaveed/Documents/Quran-APP_Kiro/quran-app/QuraanicStudies_ModernTafsir_PART_II_split.zip"
EXTRACT_DIR = "/tmp/qur_part2"
DATA_DIR = "public/data"
CHECKPOINT = "scripts/part2_checkpoint.json"


# ── Font helpers ──────────────────────────────────────────────────────────────

def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname or '-BD' in fontname

def classify_line(line_words):
    bold_count = sum(1 for w in line_words if is_bold(w.get('fontname', '')))
    sizes = [w.get('size', 0) for w in line_words]
    avg_size = sum(sizes) / len(sizes) if sizes else 0
    is_line_bold = bold_count > len(line_words) / 2
    return is_line_bold, avg_size


# ── Checkpoint ────────────────────────────────────────────────────────────────

def load_checkpoint():
    if os.path.exists(CHECKPOINT):
        try:
            with open(CHECKPOINT) as f:
                data = json.load(f)
            last = data.get('last_page', -1)
            n = data.get('notes', {})
            print(f"Resuming from checkpoint: {last + 1} pages done, {len(n)} notes so far")
            return last, n
        except Exception as e:
            print(f"WARNING: checkpoint unreadable ({e}), starting fresh")
    return -1, {}

def save_checkpoint(last_page, notes):
    try:
        with open(CHECKPOINT, 'w') as f:
            json.dump({'last_page': last_page, 'notes': notes}, f, ensure_ascii=False)
    except OSError as e:
        print(f"WARNING: could not save checkpoint: {e}")


# ── Page processor ────────────────────────────────────────────────────────────

CHAPTER_PAT = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
VERSE_TRANS_PAT = re.compile(r'^(\d+):(\d+)\.\s*(.*)', re.DOTALL)
NOTE_START_PAT = re.compile(r'^(\d+[a-z]?)\.\s*(.*)', re.DOTALL)

def process_page(words, state):
    notes = state['notes']
    lines = defaultdict(list)
    for w in words:
        lines[round(w.get('top', 0))].append(w)

    for top in sorted(lines):
        line_words = sorted(lines[top], key=lambda w: w.get('x0', 0))
        line_text = ' '.join(w.get('text', '') for w in line_words).strip()
        if not line_text:
            continue

        bold, avg_size = classify_line(line_words)

        # Chapter header: bold, large
        if bold and avg_size > 15:
            m = CHAPTER_PAT.search(line_text)
            if m:
                state['current_surah'] = int(m.group(1))
                state['current_verse_ref'] = None
            continue

        # Translation: regular, ~14pt — just track verse ref
        if not bold and avg_size > 12.5:
            m = VERSE_TRANS_PAT.match(line_text)
            if m:
                surah = int(m.group(1))
                verse = int(m.group(2))
                if state['current_surah'] and surah == state['current_surah']:
                    state['current_verse_ref'] = f"{surah}:{verse}"
            continue

        # Note: bold, ~10pt
        if bold and avg_size < 12:
            if not state['current_verse_ref']:
                continue
            m = NOTE_START_PAT.match(line_text)
            ref = state['current_verse_ref']
            if m:
                note_text = m.group(2).strip()
                if ref not in notes:
                    notes[ref] = []
                notes[ref].append(note_text)
            else:
                if ref in notes and notes[ref]:
                    notes[ref][-1] += ' ' + line_text


# ── Merge ─────────────────────────────────────────────────────────────────────

def merge_notes(notes_by_ref):
    updated_surahs = 0
    updated_verses = 0

    for surah_num in range(26, 115):
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            verses = json.load(f)

        changed = False
        for verse in verses:
            ref = verse.get('ref', '')
            if ref in notes_by_ref and notes_by_ref[ref]:
                if not verse.get('notes', '').strip():
                    verse['notes'] = '\n\n'.join(notes_by_ref[ref])
                    changed = True
                    updated_verses += 1

        if changed:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(verses, f, ensure_ascii=False, indent=2)
            updated_surahs += 1

    print(f"\nMerge complete: {updated_surahs} surah files updated, {updated_verses} verses now have notes")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Step 1: Extract zip
    print(f"Extracting zip: {ZIP_PATH}")
    os.makedirs(EXTRACT_DIR, exist_ok=True)
    with zipfile.ZipFile(ZIP_PATH) as z:
        files = z.namelist()
        print(f"Files in zip: {files}")
        z.extractall(EXTRACT_DIR)

    # Step 2: Find PDF(s)
    pdf_files = []
    for root, dirs, filenames in os.walk(EXTRACT_DIR):
        for fn in filenames:
            if fn.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, fn))

    print(f"\nFound PDFs: {pdf_files}")
    if not pdf_files:
        print("ERROR: No PDF found in zip!")
        return

    # Step 3: Process each PDF
    last_done, notes = load_checkpoint()
    state = {
        'current_surah': None,
        'current_verse_ref': None,
        'notes': notes,
    }

    for pdf_path in sorted(pdf_files):
        print(f"\nProcessing: {pdf_path}")
        with pdfplumber.open(pdf_path) as pdf:
            total = len(pdf.pages)
            print(f"Pages: {total}")

            for i, page in enumerate(pdf.pages):
                if i <= last_done:
                    continue
                try:
                    words = page.extract_words(extra_attrs=["fontname", "size"])
                    process_page(words, state)
                except Exception as e:
                    print(f"  ERROR on page {i+1}: {e}")
                    continue

                if i % 50 == 0:
                    save_checkpoint(i, state['notes'])
                    print(f"  Page {i+1}/{total} | {len(state['notes'])} verse notes collected")

        last_done = -1  # reset for next PDF file

    save_checkpoint(9999, state['notes'])
    print(f"\nExtraction complete! {len(state['notes'])} verses with notes found.")

    # Show which surahs got notes
    by_surah = {}
    for ref in state['notes']:
        s = ref.split(':')[0]
        by_surah[s] = by_surah.get(s, 0) + 1

    print(f"\nSurahs with notes extracted: {sorted(by_surah.keys(), key=int)}")
    for s in sorted(by_surah.keys(), key=int)[:10]:
        print(f"  Surah {s}: {by_surah[s]} verses with notes")

    print("\nMerging into JSON files (surahs 26-114)...")
    merge_notes(state['notes'])

    # Final check
    print("\nFinal verification:")
    for s in [26, 30, 50, 100, 114]:
        path = f"{DATA_DIR}/surah_{s}.json"
        if os.path.exists(path):
            with open(path) as f:
                verses = json.load(f)
            with_notes = sum(1 for v in verses if v.get('notes'))
            print(f"  Surah {s}: {with_notes}/{len(verses)} verses have notes")


if __name__ == "__main__":
    main()
