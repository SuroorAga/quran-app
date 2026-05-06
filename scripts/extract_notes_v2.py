"""
Extract tafsir notes from PDF using font detection.

Font rules (confirmed from PDF inspection):
  - TimesNewRomanPS-BoldMT @ 10pt  -> Notes (grandfather's commentary)
  - TimesNewRomanPSMT @ 14pt       -> Translation
  - TimesNewRomanPSMT @ 10pt       -> Transliteration
  - TimesNewRomanPS-BoldMT @ 18pt  -> Chapter headers
  - Arabic text                    -> Arabic (different font entirely)

Strategy:
  1. Walk every page word-by-word with font metadata
  2. Group consecutive words by font type into "blocks"
  3. A BOLD-10pt block that starts with a number+period is a note
  4. Track which verse (surah:verse ref) precedes each note
  5. Attach notes to their verse in the JSON
"""

import pdfplumber
import json
import re
import os
from collections import Counter

PDF_PATH = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
DATA_DIR = "public/data"


def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname or '-BD' in fontname


def is_note_font(word):
    """Bold 10pt = note text"""
    return is_bold(word.get('fontname', '')) and abs(word.get('size', 0) - 10.0) < 1.0


def is_translation_font(word):
    """Regular 14pt = translation"""
    fn = word.get('fontname', '')
    return not is_bold(fn) and abs(word.get('size', 0) - 14.0) < 1.0


def is_chapter_header(word):
    """Bold 18pt = chapter header"""
    return is_bold(word.get('fontname', '')) and abs(word.get('size', 0) - 18.0) < 1.0


def extract_blocks(pages_words):
    """
    Convert per-page word lists into a flat sequence of text blocks.
    Each block: { 'type': 'note'|'translation'|'header'|'other', 'text': '...' }
    Consecutive words of the same type — even across page boundaries — are merged.
    """
    blocks = []
    current_type = None
    current_words = []

    def flush():
        if current_words:
            text = ' '.join(current_words).strip()
            if text:
                blocks.append({'type': current_type, 'text': text})

    for words in pages_words:
        for w in words:
            text = w.get('text', '').strip()
            if not text:
                continue

            if is_chapter_header(w):
                wtype = 'header'
            elif is_note_font(w):
                wtype = 'note'
            elif is_translation_font(w):
                wtype = 'translation'
            else:
                wtype = 'other'

            if wtype != current_type:
                flush()
                current_type = wtype
                current_words = [text]
            else:
                current_words.append(text)

    flush()
    return blocks


def clean_note(text):
    """Strip trailing Arabic grammar markers (short vowel/case tokens after the last period)."""
    # Remove trailing sequences like "u", "a A i", "l l in" that appear after sentence-ending punctuation
    text = re.sub(r'(?<=[.!?)"])\s+[a-zA-Z\-]{1,4}(\s+[a-zA-Z\-]{1,4})*\s*$', '', text)
    return text.strip()


def parse_blocks(blocks):
    """
    Walk blocks and build: { "3:5": "note text...", ... }

    Logic:
    - 'header' block containing "Chapter N:" sets current surah
    - 'translation' block starting with "N:M." sets current verse ref
    - 'note' block starting with "N." or "Na." is a note for current verse
    - 'note' block NOT starting with that pattern is a continuation of the last note
      (handles notes fragmented across font-boundary artifacts)
    """
    result = {}  # { "3:5": ["note1", "note2"] }
    current_surah = None
    current_verse_ref = None

    chapter_pat = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
    verse_start_pat = re.compile(r'^(\d+):(\d+)\.')
    note_start_pat = re.compile(r'^(\d+[a-z]?)\.\s+(.+)', re.DOTALL)

    for block in blocks:
        btype = block['type']
        text = block['text']

        if btype == 'header':
            m = chapter_pat.search(text)
            if m:
                current_surah = int(m.group(1))
                current_verse_ref = None

        elif btype == 'translation':
            m = verse_start_pat.match(text)
            if m:
                surah = int(m.group(1))
                verse = int(m.group(2))
                if current_surah and surah == current_surah:
                    current_verse_ref = f"{surah}:{verse}"

        elif btype == 'note':
            if not current_verse_ref:
                continue
            m = note_start_pat.match(text)
            if m:
                note_text = m.group(2).strip()
                if current_verse_ref not in result:
                    result[current_verse_ref] = []
                result[current_verse_ref].append(note_text)
            elif current_verse_ref in result and result[current_verse_ref]:
                # Continuation of the previous note (fragmented block)
                result[current_verse_ref][-1] += ' ' + text

    # Join multiple notes per verse with double newline, then clean trailing artifacts
    return {ref: clean_note('\n\n'.join(notes)) for ref, notes in result.items()}


def merge_notes_into_json(notes_by_ref, start_surah=3, end_surah=114, overwrite=False):
    """Merge extracted notes into existing surah JSON files."""
    updated_surahs = 0
    updated_verses = 0
    skipped_verses = 0

    for surah_num in range(start_surah, end_surah + 1):
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            print(f"  MISSING: {path}")
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                verses = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"  ERROR reading {path}: {e}")
            continue

        changed = False
        for verse in verses:
            ref = verse.get("ref", "")
            if ref in notes_by_ref and notes_by_ref[ref]:
                if overwrite or not verse.get("notes"):
                    verse["notes"] = notes_by_ref[ref]
                    changed = True
                    updated_verses += 1
                else:
                    skipped_verses += 1

        if changed:
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(verses, f, ensure_ascii=False, indent=2)
                updated_surahs += 1
            except OSError as e:
                print(f"  ERROR writing {path}: {e}")

    print(f"\nMerge complete:")
    print(f"  {updated_surahs} surah files updated")
    print(f"  {updated_verses} verses written")
    if skipped_verses:
        print(f"  {skipped_verses} verses skipped (already had notes; use overwrite=True to replace)")


def main():
    print("Opening PDF...")
    try:
        with pdfplumber.open(PDF_PATH) as pdf:
            total = len(pdf.pages)
            print(f"Total pages: {total}")
            print("Extracting words with font data from all pages...")

            pages_words = []
            for i, page in enumerate(pdf.pages):
                if i % 50 == 0:
                    print(f"  Page {i+1}/{total}...")
                try:
                    words = page.extract_words(extra_attrs=["fontname", "size"])
                    pages_words.append(words)
                except Exception as e:
                    print(f"  WARNING: skipping page {i+1}: {e}")
                    pages_words.append([])
    except FileNotFoundError:
        print(f"ERROR: PDF not found at {PDF_PATH}")
        return
    except Exception as e:
        print(f"ERROR opening PDF: {e}")
        return

    print("\nGrouping into blocks by font type...")
    blocks = extract_blocks(pages_words)
    print(f"Total blocks: {len(blocks)}")

    counts = Counter(b['type'] for b in blocks)
    print(f"Block types: {dict(counts)}")

    print("\nParsing notes from blocks...")
    notes_by_ref = parse_blocks(blocks)

    by_surah = {}
    for ref in notes_by_ref:
        s = ref.split(":")[0]
        by_surah[s] = by_surah.get(s, 0) + 1

    print(f"\nExtracted notes for {len(notes_by_ref)} verses across {len(by_surah)} surahs")

    print("\n--- Sample: Surah 3 notes (first 5 verses) ---")
    surah3 = {k: v for k, v in notes_by_ref.items() if k.startswith("3:")}
    for ref in sorted(surah3.keys(), key=lambda x: int(x.split(":")[1]))[:5]:
        print(f"\n  {ref}: {notes_by_ref[ref][:300]}...")

    # Save only surah 3, overwriting existing notes with fresh extraction
    print("\nMerging into surah 3 JSON (overwrite=True)...")
    merge_notes_into_json(notes_by_ref, start_surah=3, end_surah=3, overwrite=True)

    print("\nVerification - Surah 3:")
    path = f"{DATA_DIR}/surah_3.json"
    try:
        with open(path) as f:
            verses = json.load(f)
        with_notes = sum(1 for v in verses if v.get('notes'))
        print(f"  Surah 3: {with_notes}/{len(verses)} verses have notes")
    except Exception as e:
        print(f"  ERROR reading verification: {e}")


if __name__ == "__main__":
    main()
