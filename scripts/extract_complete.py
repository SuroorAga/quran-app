"""
extract_complete.py - Full extraction and validation script.

PDF font structure (confirmed):
  18pt Bold  -> Chapter header  ("Chapter 3: Aale-Imran ...")
  10pt Reg   -> Transliteration ("1. Bismi Allahi ...")
   9pt Reg   -> Footnote superscripts (ignored)
  14pt Reg   -> Translation     ("3:1. In the name of ...")
  10pt Bold  -> Notes           ("1. Please refer ...")
  12pt Reg   -> Page numbers    (ignored)

Strategy (extract_slow.py approach - line-by-line, majority-vote font):
  - Reads one page at a time to keep memory low
  - Saves a checkpoint every 50 pages for crash recovery
  - Majority-vote bold detection per line avoids false positives from
    stray bold Arabic grammar markers within transliteration lines
  - Continuation lines (same font, no verse prefix) are appended to
    the current translation or note block

Extracts:
  1. Translations (14pt reg) -> translation field  (empty in surahs 3-114)
  2. Notes (10pt bold)       -> notes field        (patchy across all surahs)

Merges into JSON with configurable overwrite flags.
Runs an audit before and after showing coverage of all 4 fields.
"""

import pdfplumber
import json
import re
import os
from collections import defaultdict

PDF_PATH = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
DATA_DIR = "public/data"
CHECKPOINT = "scripts/full_extract_checkpoint.json"


# ── Font helpers ──────────────────────────────────────────────────────────────

def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname or '-BD' in fontname


def classify_line(line_words):
    """Return (is_bold, avg_size) for a list of word dicts."""
    bold_count = sum(1 for w in line_words if is_bold(w.get('fontname', '')))
    sizes = [w.get('size', 0) for w in line_words]
    avg_size = sum(sizes) / len(sizes) if sizes else 0
    is_line_bold = bold_count > len(line_words) / 2
    return is_line_bold, avg_size


# ── Text cleanup ──────────────────────────────────────────────────────────────

def clean_text(text):
    """Strip trailing Arabic grammar markers (short vowel tokens after sentence-end punctuation)."""
    text = re.sub(r'(?<=[.!?)"])\s+[a-zA-Z\-]{1,4}(\s+[a-zA-Z\-]{1,4})*\s*$', '', text)
    return text.strip()


# ── Checkpoint ────────────────────────────────────────────────────────────────

def load_checkpoint():
    if os.path.exists(CHECKPOINT):
        try:
            with open(CHECKPOINT) as f:
                data = json.load(f)
            last = data.get('last_page', -1)
            t = data.get('translations', {})
            n = data.get('notes', {})
            print(f"Resuming from checkpoint: {last + 1} pages done, "
                  f"{len(t)} translations, {len(n)} notes so far")
            return last, t, n
        except Exception as e:
            print(f"WARNING: checkpoint unreadable ({e}), starting fresh")
    return -1, {}, {}


def save_checkpoint(last_page, translations, notes):
    try:
        with open(CHECKPOINT, 'w') as f:
            json.dump(
                {'last_page': last_page, 'translations': translations, 'notes': notes},
                f, ensure_ascii=False
            )
    except OSError as e:
        print(f"WARNING: could not save checkpoint: {e}")


# ── Page processor ────────────────────────────────────────────────────────────

CHAPTER_PAT = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
VERSE_TRANS_PAT = re.compile(r'^(\d+):(\d+)\.\s*(.*)', re.DOTALL)
NOTE_START_PAT = re.compile(r'^(\d+[a-z]?)\.\s*(.*)', re.DOTALL)


def process_page(words, state):
    """
    Process one page of words, updating state in place.
    state keys:
      current_surah           - int or None
      current_verse_ref       - "S:V" string or None
      current_translation_ref - ref of the translation being built (for continuations)
      translations            - dict { "3:2": "In the name ..." }
      notes                   - dict { "3:2": ["note1 text", "note2 text"] }
    """
    translations = state['translations']
    notes = state['notes']

    # Group words into visual lines by rounded top coordinate
    lines = defaultdict(list)
    for w in words:
        lines[round(w.get('top', 0))].append(w)

    for top in sorted(lines):
        line_words = sorted(lines[top], key=lambda w: w.get('x0', 0))
        line_text = ' '.join(w.get('text', '') for w in line_words).strip()
        if not line_text:
            continue

        bold, avg_size = classify_line(line_words)

        # ── Chapter header: bold, large ──────────────────────────────────────
        if bold and avg_size > 15:
            m = CHAPTER_PAT.search(line_text)
            if m:
                state['current_surah'] = int(m.group(1))
                state['current_verse_ref'] = None
                state['current_translation_ref'] = None
            continue

        # ── Translation: regular, ~14pt ──────────────────────────────────────
        if not bold and avg_size > 12.5:
            m = VERSE_TRANS_PAT.match(line_text)
            if m:
                surah = int(m.group(1))
                verse = int(m.group(2))
                rest = m.group(3).strip()
                if state['current_surah'] and surah == state['current_surah']:
                    ref = f"{surah}:{verse}"
                    state['current_verse_ref'] = ref
                    state['current_translation_ref'] = ref
                    translations[ref] = rest
            elif state.get('current_translation_ref'):
                # Continuation of a multi-line translation
                ref = state['current_translation_ref']
                translations[ref] = (translations.get(ref, '') + ' ' + line_text).strip()
            continue

        # ── Note: bold, ~10pt ─────────────────────────────────────────────────
        if bold and avg_size < 12:
            # A note line ends any translation continuation
            state['current_translation_ref'] = None

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
                # Continuation of the previous note line
                if ref in notes and notes[ref]:
                    notes[ref][-1] += ' ' + line_text
            continue

        # Anything else (9pt footnote numbers, 12pt page numbers) - ignore


# ── Audit ─────────────────────────────────────────────────────────────────────

def audit_surahs(label=""):
    if label:
        print(f"\n=== Field Coverage Audit: {label} ===")
    else:
        print("\n=== Field Coverage Audit ===")
    print(f"{'Surah':>6} {'Verses':>6} {'Arabic':>7} {'Translit':>9} {'Meaning':>8} {'Notes':>6}")
    print("-" * 52)

    total = defaultdict(int)
    grand_verses = 0

    for s in range(1, 115):
        path = f"{DATA_DIR}/surah_{s}.json"
        if not os.path.exists(path):
            continue
        try:
            verses = json.load(open(path, encoding='utf-8'))
        except Exception:
            continue

        n = len(verses)
        arabic   = sum(1 for v in verses if v.get('arabic', '').strip())
        translit = sum(1 for v in verses if v.get('transliteration', '').strip())
        meaning  = sum(1 for v in verses if v.get('translation', '').strip())
        nts      = sum(1 for v in verses if v.get('notes', '').strip())

        grand_verses += n
        total['arabic']   += arabic
        total['translit'] += translit
        total['meaning']  += meaning
        total['notes']    += nts

        incomplete = arabic < n or translit < n or meaning < n or nts < n
        flag = ' <' if incomplete else ''
        print(f"{s:>6} {n:>6} {arabic:>7} {translit:>9} {meaning:>8} {nts:>6}{flag}")

    print("-" * 52)
    print(f"{'TOTAL':>6} {grand_verses:>6} "
          f"{total['arabic']:>7} {total['translit']:>9} "
          f"{total['meaning']:>8} {total['notes']:>6}")
    missing_meaning = grand_verses - total['meaning']
    missing_notes   = grand_verses - total['notes']
    if missing_meaning or missing_notes:
        print(f"\nMissing: {missing_meaning} meanings, {missing_notes} notes")


# ── Merge ─────────────────────────────────────────────────────────────────────

def merge_into_json(translations, notes,
                    overwrite_translations=False, overwrite_notes=False,
                    start_surah=1, end_surah=114):
    written_trans = 0
    written_notes = 0
    skipped_trans = 0
    skipped_notes = 0
    updated_files = 0

    for surah_num in range(start_surah, end_surah + 1):
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            continue

        try:
            with open(path, 'r', encoding='utf-8') as f:
                verses = json.load(f)
        except Exception as e:
            print(f"  ERROR reading {path}: {e}")
            continue

        changed = False
        for verse in verses:
            ref = verse.get('ref', '')

            # Translation
            if ref in translations and translations[ref]:
                if overwrite_translations or not verse.get('translation', '').strip():
                    verse['translation'] = translations[ref]
                    changed = True
                    written_trans += 1
                else:
                    skipped_trans += 1

            # Notes
            if ref in notes and notes[ref]:
                if overwrite_notes or not verse.get('notes', '').strip():
                    verse['notes'] = notes[ref]
                    changed = True
                    written_notes += 1
                else:
                    skipped_notes += 1

        if changed:
            try:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(verses, f, ensure_ascii=False, indent=2)
                updated_files += 1
            except OSError as e:
                print(f"  ERROR writing {path}: {e}")

    print(f"\nMerge results:")
    print(f"  {updated_files} files updated")
    print(f"  {written_trans} translations written, {skipped_trans} skipped (already had content)")
    print(f"  {written_notes} notes written, {skipped_notes} skipped (already had content)")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    audit_surahs("BEFORE extraction")

    last_done, translations, notes = load_checkpoint()

    state = {
        'current_surah': None,
        'current_verse_ref': None,
        'current_translation_ref': None,
        'translations': translations,
        'notes': notes,
    }

    print(f"\nOpening PDF: {PDF_PATH}")
    try:
        pdf_handle = pdfplumber.open(PDF_PATH)
    except FileNotFoundError:
        print(f"ERROR: PDF not found at {PDF_PATH}")
        return
    except Exception as e:
        print(f"ERROR opening PDF: {e}")
        return

    with pdf_handle as pdf:
        total = len(pdf.pages)
        print(f"Total pages: {total}  (resuming after page {last_done + 1})")

        for i, page in enumerate(pdf.pages):
            if i <= last_done:
                continue

            try:
                words = page.extract_words(extra_attrs=["fontname", "size"])
                process_page(words, state)
            except Exception as e:
                print(f"  ERROR on page {i + 1}: {e}")
                save_checkpoint(i - 1, state['translations'], state['notes'])
                continue

            if i % 50 == 0:
                save_checkpoint(i, state['translations'], state['notes'])
                print(f"  Page {i + 1:4d}/{total} | "
                      f"{len(state['translations'])} translations, "
                      f"{len(state['notes'])} notes collected")

    save_checkpoint(total - 1, state['translations'], state['notes'])
    print(f"\nExtraction done. Raw counts: "
          f"{len(state['translations'])} translations, {len(state['notes'])} notes")

    # Clean up trailing grammar artifacts
    translations_clean = {
        ref: clean_text(text)
        for ref, text in state['translations'].items()
        if text.strip()
    }
    notes_clean = {
        ref: clean_text('\n\n'.join(note_list))
        for ref, note_list in state['notes'].items()
        if note_list
    }
    print(f"After cleanup: {len(translations_clean)} translations, {len(notes_clean)} notes")

    # Preview surah 3 sample
    print("\n--- Sample: Surah 3 (first 5 verses) ---")
    for v_num in range(1, 6):
        ref = f"3:{v_num}"
        t = translations_clean.get(ref, '(none)')[:100]
        n = notes_clean.get(ref, '(none)')[:80]
        print(f"  {ref}  translation: {t}")
        print(f"       note:        {n}")
        print()

    print("Merging into JSON files...")
    merge_into_json(
        translations_clean,
        notes_clean,
        overwrite_translations=False,  # only fill empty translation fields
        overwrite_notes=False,          # only fill empty notes fields
        start_surah=1,
        end_surah=114,
    )

    audit_surahs("AFTER extraction")


if __name__ == "__main__":
    main()
