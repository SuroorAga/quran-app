"""
Extract tafsir notes from the PDF and merge into existing surah JSON files.
Pattern in PDF:
  - Verse line: "2:5. Translation text here.7"  (footnote refs inline)
  - Note line:  "7. Note text here..."
  - Chapter header: "Chapter 3: Al-Imran (The Family of Imran)"
"""

import pdfplumber
import json
import re
import os

PDF_PATH = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
DATA_DIR = "public/data"

def extract_all_text(pdf):
    """Extract all text from PDF, page by page."""
    pages = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        pages.append(text or "")
    return pages

def parse_pdf_notes(pages):
    """
    Parse the PDF text and extract notes keyed by verse ref (e.g. "3:5").
    Returns: dict { "3:5": "note text...", ... }
    """
    # Join all pages with a page break marker
    full_text = "\n".join(pages)
    lines = full_text.split("\n")

    notes_by_ref = {}   # { "3:5": ["note1 text", "note2 text"] }
    current_surah = None
    current_verse = None
    note_map = {}       # { note_number: "text" }  for current chapter
    verse_notes = {}    # { "3:5": [note_numbers] }

    # Patterns
    chapter_pat = re.compile(r'^Chapter\s+(\d+)\s*:', re.IGNORECASE)
    verse_pat = re.compile(r'^(\d+):(\d+)\.\s+(.+)')
    note_ref_pat = re.compile(r'(\d+[a-z]?)\.')  # note number at start of line

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect chapter header
        m = chapter_pat.match(line)
        if m:
            current_surah = int(m.group(1))
            i += 1
            continue

        # Detect verse line: "2:5. Translation text"
        m = verse_pat.match(line)
        if m:
            current_verse = f"{m.group(1)}:{m.group(2)}"
            i += 1
            continue

        # Detect note line: starts with a number followed by period
        # e.g. "7. Note text here..."
        # Must be careful not to match verse numbers like "2:5."
        note_start = re.match(r'^(\d+[a-z]?)\.\s+(.+)', line)
        if note_start and current_surah:
            note_num = note_start.group(1)
            note_text = note_start.group(2)
            # Collect continuation lines
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                # Stop if we hit a new note, verse, chapter, or page header
                if (re.match(r'^\d+[a-z]?\.\s+', next_line) or
                    re.match(r'^\d+:\d+\.', next_line) or
                    chapter_pat.match(next_line) or
                    re.match(r'^Manzil\s+', next_line) or
                    re.match(r'^\d+$', next_line)):  # page number
                    break
                if next_line:
                    note_text += " " + next_line
                i += 1
            note_map[note_num] = note_text.strip()
            continue

        i += 1

    return note_map, verse_notes


def parse_pdf_structured(pages):
    """
    More structured parse: track which notes belong to which verse.
    Returns: { "surah:verse": "combined note text" }
    """
    full_text = "\n".join(pages)
    lines = full_text.split("\n")

    result = {}  # { "3:5": "note text" }

    current_surah = None
    # Maps note_number -> verse_ref for current surah
    note_to_verse = {}
    # Accumulate notes: note_number -> text
    note_texts = {}
    # Track verse order and their inline note refs
    verse_inline_notes = {}  # { "3:5": ["7", "8"] }

    chapter_pat = re.compile(r'^Chapter\s+(\d+)\s*:', re.IGNORECASE)
    verse_pat = re.compile(r'^(\d+):(\d+)\.\s+(.*)')
    note_line_pat = re.compile(r'^(\d+[a-z]?)\.\s+(.*)')
    manzil_pat = re.compile(r'^Manzil\s+', re.IGNORECASE)
    page_num_pat = re.compile(r'^\d+$')

    def flush_surah():
        """Attach collected notes to their verses."""
        if not current_surah:
            return
        for verse_ref, note_nums in verse_inline_notes.items():
            parts = []
            for n in note_nums:
                if n in note_texts:
                    parts.append(note_texts[n])
            if parts:
                result[verse_ref] = "\n\n".join(parts)

    i = 0
    current_verse_ref = None

    while i < len(lines):
        line = lines[i].strip()

        # Chapter header
        m = chapter_pat.match(line)
        if m:
            flush_surah()
            current_surah = int(m.group(1))
            note_to_verse = {}
            note_texts = {}
            verse_inline_notes = {}
            current_verse_ref = None
            i += 1
            continue

        # Skip manzil headers and page numbers
        if manzil_pat.match(line) or page_num_pat.match(line):
            i += 1
            continue

        # Verse line: "3:5. Translation text 7 8"
        m = verse_pat.match(line)
        if m and current_surah:
            surah_num = int(m.group(1))
            verse_num = int(m.group(2))
            if surah_num == current_surah:
                current_verse_ref = f"{surah_num}:{verse_num}"
                trans_text = m.group(3)
                # Extract inline note refs (superscript numbers at end or inline)
                note_refs = re.findall(r'(\d+[a-z]?)', trans_text)
                # Filter: only keep refs that look like note numbers (not verse refs)
                # Note refs are typically 1-3 digits, not matching surah:verse pattern
                if current_verse_ref not in verse_inline_notes:
                    verse_inline_notes[current_verse_ref] = []
                # We'll also collect notes that appear after this verse
                i += 1
                continue

        # Note line: "7. Note text..."
        m = note_line_pat.match(line)
        if m and current_surah:
            note_num = m.group(1)
            note_text = m.group(2)
            # Collect multi-line note
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                if (note_line_pat.match(next_line) or
                    verse_pat.match(next_line) or
                    chapter_pat.match(next_line) or
                    manzil_pat.match(next_line) or
                    page_num_pat.match(next_line)):
                    break
                if next_line:
                    note_text += " " + next_line
                i += 1
            note_texts[note_num] = note_text.strip()
            # Associate this note with the most recent verse
            if current_verse_ref:
                if current_verse_ref not in verse_inline_notes:
                    verse_inline_notes[current_verse_ref] = []
                verse_inline_notes[current_verse_ref].append(note_num)
            continue

        i += 1

    flush_surah()
    return result


def merge_notes_into_json(notes_by_ref):
    """Merge extracted notes into existing surah JSON files."""
    updated = 0
    skipped = 0

    for surah_num in range(3, 115):
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            print(f"  MISSING: {path}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            verses = json.load(f)

        changed = False
        for verse in verses:
            ref = verse.get("ref", "")
            if ref in notes_by_ref and notes_by_ref[ref]:
                existing = verse.get("notes", "")
                if not existing:
                    verse["notes"] = notes_by_ref[ref]
                    changed = True

        if changed:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(verses, f, ensure_ascii=False, indent=2)
            updated += 1
        else:
            skipped += 1

    print(f"\nDone: {updated} surah files updated, {skipped} unchanged.")


def main():
    print("Opening PDF...")
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        print("Extracting text from all pages...")
        pages = extract_all_text(pdf)

    print("Parsing notes from PDF...")
    notes_by_ref = parse_pdf_structured(pages)

    # Stats
    by_surah = {}
    for ref in notes_by_ref:
        s = ref.split(":")[0]
        by_surah[s] = by_surah.get(s, 0) + 1

    print(f"\nExtracted notes for {len(notes_by_ref)} verses across {len(by_surah)} surahs")
    print("Sample surahs with note counts:")
    for s in sorted(by_surah.keys(), key=int)[:20]:
        print(f"  Surah {s}: {by_surah[s]} verses with notes")

    # Show a sample
    sample_refs = [k for k in notes_by_ref if k.startswith("3:")][:3]
    for ref in sample_refs:
        print(f"\n--- {ref} ---")
        print(notes_by_ref[ref][:300])

    print("\nMerging into JSON files...")
    merge_notes_into_json(notes_by_ref)


if __name__ == "__main__":
    main()
