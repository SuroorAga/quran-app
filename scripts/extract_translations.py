"""
Extract missing translations for surahs 10-11 (Part I PDF) and 26-114 (Part II PDFs).
Translation lines are 14pt regular text in the format: "73:2. Get up at night..."
Continuation lines are also 14pt regular and get appended to the previous translation.
"""

import pdfplumber
import json
import re
import os
from collections import defaultdict

DATA_DIR = "public/data"

PART1_PDF = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
PART2_PDFS = sorted([
    f"/tmp/qur_part2/QuraanicStudies_PART_II_{n:02d}.pdf"
    for n in range(1, 13)
    if os.path.exists(f"/tmp/qur_part2/QuraanicStudies_PART_II_{n:02d}.pdf")
])

CHAPTER_PAT = re.compile(r'Chapter\s+(\d+)\s*:', re.IGNORECASE)
VERSE_PAT = re.compile(r'^(\d+):(\d+)\.\s+(.*)', re.DOTALL)
NOTE_START_PAT = re.compile(r'^\d+[a-z]?\.\s+\S')
MANZIL_PAT = re.compile(r'^Manzil\s+', re.IGNORECASE)
PAGE_NUM_PAT = re.compile(r'^\d{3,4}$')


def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname or '-BD' in fontname


def classify_line(line_words):
    bold_count = sum(1 for w in line_words if is_bold(w.get('fontname', '')))
    sizes = [w.get('size', 0) for w in line_words]
    avg_size = sum(sizes) / len(sizes) if sizes else 0
    return bold_count > len(line_words) / 2, avg_size


def extract_translations(pdf_files, target_surahs=None):
    translations = {}  # { "32:2": "The revelation of..." }
    state = {
        'current_surah': None,
        'current_ref': None,
    }

    for pdf_path in pdf_files:
        if not os.path.exists(pdf_path):
            print(f"  SKIP (not found): {pdf_path}")
            continue
        print(f"  {os.path.basename(pdf_path)}...", end="", flush=True)

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

                    # Skip page headers, page numbers, manzil markers
                    if MANZIL_PAT.match(line_text) or PAGE_NUM_PAT.match(line_text):
                        continue

                    # Chapter header (bold, large)
                    if avg_size > 15:
                        m = CHAPTER_PAT.search(line_text)
                        if m:
                            state['current_surah'] = int(m.group(1))
                            state['current_ref'] = None
                        continue

                    # Bold lines = notes, skip
                    if bold:
                        continue

                    # Transliteration (~10pt regular) — skip, don't use as continuation
                    if avg_size < 12:
                        continue

                    # Translation line (~14pt regular)
                    if avg_size >= 12:
                        m = VERSE_PAT.match(line_text)
                        if m:
                            surah = int(m.group(1))
                            verse = int(m.group(2))
                            text = m.group(3).strip()

                            # Only collect target surahs
                            if target_surahs and surah not in target_surahs:
                                state['current_ref'] = None
                                continue

                            if state['current_surah'] == surah:
                                ref = f"{surah}:{verse}"
                                state['current_ref'] = ref
                                if ref not in translations:
                                    translations[ref] = text
                                # else: already have it, don't overwrite
                        else:
                            # Continuation of previous translation
                            ref = state['current_ref']
                            if ref and ref in translations:
                                # Make sure it's not a note start
                                if not NOTE_START_PAT.match(line_text):
                                    translations[ref] += ' ' + line_text

        print(" done")

    return translations


def merge_translations(translations, target_range):
    updated_surahs = 0
    updated_verses = 0

    for surah_num in target_range:
        path = f"{DATA_DIR}/surah_{surah_num}.json"
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)

        changed = False
        for verse in verses:
            ref = verse.get('ref', '')
            if ref in translations and translations[ref]:
                if not verse.get('translation', '').strip():
                    verse['translation'] = translations[ref]
                    changed = True
                    updated_verses += 1

        if changed:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(verses, f, ensure_ascii=False, indent=2)
            updated_surahs += 1

    print(f"  Updated {updated_verses} verses across {updated_surahs} surah files")
    return updated_verses


def audit(target_range):
    total_verses = 0
    total_with = 0
    missing_surahs = []
    for s in target_range:
        path = f"{DATA_DIR}/surah_{s}.json"
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)
        with_trans = sum(1 for v in verses if v.get('translation', '').strip())
        total_verses += len(verses)
        total_with += with_trans
        if with_trans < len(verses):
            missing_surahs.append((s, with_trans, len(verses)))
    print(f"  {total_with}/{total_verses} verses have translation")
    if missing_surahs:
        print(f"  Incomplete surahs ({len(missing_surahs)}): ", end="")
        for s, have, total in missing_surahs[:10]:
            print(f"{s}({have}/{total})", end=" ")
        if len(missing_surahs) > 10:
            print(f"... +{len(missing_surahs)-10} more", end="")
        print()
    else:
        print("  All complete!")


def main():
    # ── Part 1: Surahs 10-11 from Part I PDF ──────────────────────────────────
    print("=== Step 1: Surahs 10-11 (Part I PDF) ===")
    t1 = extract_translations([PART1_PDF], target_surahs={10, 11})
    in_range = {k: v for k, v in t1.items() if int(k.split(':')[0]) in {10, 11}}
    print(f"  Found translations for {len(in_range)} verses")
    merge_translations(t1, range(10, 12))
    audit(range(10, 12))

    # ── Part 2: Surahs 26-114 from Part II PDFs ───────────────────────────────
    print("\n=== Step 2: Surahs 26-114 (Part II PDFs) ===")
    t2 = extract_translations(PART2_PDFS)
    in_range2 = {k: v for k, v in t2.items() if int(k.split(':')[0]) >= 26}
    print(f"  Found translations for {len(in_range2)} verses")
    merge_translations(t2, range(26, 115))

    print("\n=== Final audit (surahs 10-11 + 26-114) ===")
    audit(list(range(10, 12)) + list(range(26, 115)))

    # Sample check
    print("\n=== Sample translations ===")
    for s in [32, 61, 73, 79, 114]:
        path = f"{DATA_DIR}/surah_{s}.json"
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as f:
            verses = json.load(f)
        for v in verses[:2]:
            trans = v.get('translation', '')
            print(f"  {v['ref']}: {trans[:80] if trans else '(empty)'}")


if __name__ == "__main__":
    main()
