"""
Slow, safe extraction - processes one page at a time.
Saves progress to a checkpoint file after every page.
If it crashes, just run again - it will resume from where it left off.
"""

import pdfplumber
import json
import re
import os

PDF_PATH = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
DATA_DIR = "public/data"
CHECKPOINT = "scripts/notes_checkpoint.json"

def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname

def load_checkpoint():
    if os.path.exists(CHECKPOINT):
        with open(CHECKPOINT) as f:
            data = json.load(f)
        print(f"Resuming from checkpoint: {data['last_page']+1} pages done, {len(data['notes'])} notes so far")
        return data['last_page'], data['notes']
    return -1, {}

def save_checkpoint(last_page, notes):
    with open(CHECKPOINT, 'w') as f:
        json.dump({'last_page': last_page, 'notes': notes}, f, ensure_ascii=False)

def process_page(words, state):
    """
    Process one page worth of words.
    state = { current_surah, current_verse_ref, notes }
    Updates state in place.
    """
    notes = state['notes']
    chapter_pat = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
    verse_start_pat = re.compile(r'^(\d+):(\d+)\.')
    note_start_pat = re.compile(r'^(\d+[a-z]?)\.\s*(.*)', re.DOTALL)

    # Group words into lines by their vertical position (top coordinate)
    lines = {}
    for w in words:
        top = round(w.get('top', 0))
        if top not in lines:
            lines[top] = []
        lines[top].append(w)

    # Sort lines top to bottom
    for top in sorted(lines.keys()):
        line_words = sorted(lines[top], key=lambda w: w.get('x0', 0))

        # Reconstruct line text and detect dominant font
        line_text = ' '.join(w.get('text', '') for w in line_words).strip()
        if not line_text:
            continue

        # Check fonts in this line
        bold_count = sum(1 for w in line_words if is_bold(w.get('fontname', '')))
        sizes = [w.get('size', 0) for w in line_words]
        avg_size = sum(sizes) / len(sizes) if sizes else 0
        is_line_bold = bold_count > len(line_words) / 2

        # --- Chapter header (bold, ~18pt) ---
        if is_line_bold and avg_size > 15:
            m = chapter_pat.search(line_text)
            if m:
                state['current_surah'] = int(m.group(1))
                state['current_verse_ref'] = None
                continue

        # --- Translation line (regular, ~14pt) ---
        if not is_line_bold and avg_size > 12:
            m = verse_start_pat.match(line_text)
            if m:
                surah = int(m.group(1))
                verse = int(m.group(2))
                if state['current_surah'] and surah == state['current_surah']:
                    state['current_verse_ref'] = f"{surah}:{verse}"
            continue

        # --- Note line (bold, ~10pt) ---
        if is_line_bold and avg_size < 12:
            if not state['current_verse_ref']:
                continue
            m = note_start_pat.match(line_text)
            if m:
                note_text = m.group(2).strip()
                ref = state['current_verse_ref']
                if ref not in notes:
                    notes[ref] = []
                # Append to last note if this looks like a continuation
                # (no note number at start means continuation of previous note)
                notes[ref].append(note_text)
            else:
                # Continuation of previous note
                ref = state['current_verse_ref']
                if ref in notes and notes[ref]:
                    notes[ref][-1] += ' ' + line_text

def merge_notes_into_json(notes_by_ref):
    updated_surahs = 0
    updated_verses = 0

    for surah_num in range(3, 115):
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            continue

        with open(path, "r", encoding="utf-8") as f:
            verses = json.load(f)

        changed = False
        for verse in verses:
            ref = verse.get("ref", "")
            if ref in notes_by_ref and notes_by_ref[ref]:
                if not verse.get("notes"):
                    verse["notes"] = '\n\n'.join(notes_by_ref[ref])
                    changed = True
                    updated_verses += 1

        if changed:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(verses, f, ensure_ascii=False, indent=2)
            updated_surahs += 1

    print(f"  {updated_surahs} surah files updated, {updated_verses} verses now have notes")

def main():
    last_done, notes = load_checkpoint()

    state = {
        'current_surah': None,
        'current_verse_ref': None,
        'notes': notes
    }

    print(f"Opening PDF...")
    with pdfplumber.open(PDF_PATH) as pdf:
        total = len(pdf.pages)
        print(f"Total pages: {total}")

        for i, page in enumerate(pdf.pages):
            if i <= last_done:
                continue  # skip already processed pages

            try:
                words = page.extract_words(extra_attrs=["fontname", "size"])
                process_page(words, state)
            except Exception as e:
                print(f"  ERROR on page {i+1}: {e}")
                # Save and continue
                save_checkpoint(i - 1, state['notes'])
                continue

            # Save checkpoint every 50 pages
            if i % 50 == 0:
                save_checkpoint(i, state['notes'])
                note_count = len(state['notes'])
                print(f"  Page {i+1}/{total} done | {note_count} verse notes collected so far")

    # Final save
    save_checkpoint(total - 1, state['notes'])
    print(f"\nExtraction complete! {len(state['notes'])} verses with notes found.")

    # Show sample
    surah3 = {k: v for k, v in state['notes'].items() if k.startswith("3:")}
    print(f"\nSurah 3 sample ({len(surah3)} verses with notes):")
    for ref in sorted(surah3.keys(), key=lambda x: int(x.split(":")[1]))[:3]:
        print(f"  {ref}: {' '.join(state['notes'][ref])[:150]}...")

    print("\nMerging into JSON files...")
    merge_notes_into_json(state['notes'])

    print("\nDone! Run the app to see the notes.")

if __name__ == "__main__":
    main()
