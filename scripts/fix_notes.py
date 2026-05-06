"""
fix_notes.py — Clean up known data quality issues found by validate_data.py.

Three types of fixes:

  1. TRANSLIT paragraphs — each note is split into paragraphs; any paragraph
     that looks like Arabic transliteration is removed. Real English paragraphs
     are kept. Transliteration is detected by:
       - No note-number prefix AND dense 'AA' (≥5% of words), OR
       - No note-number prefix AND starts with an Arabic-prefix word

  2. DRIFT_SHORT — entire note is under 30 chars with no number prefix.
     Fragments like "Makkah.", "Angels.", "The Qur'aan." — cleared fully.

  3. DRIFT_LOWERCASE — no number prefix, starts lowercase, AND contains
     embedded 3-digit footnote numbers (e.g. "strength.467, 468 And Allah...").
     These are Quranic verse text that leaked into the notes field — cleared.

Pass --dry-run to preview without writing.
"""

import json
import re
import os
import sys

DATA_DIR = "public/data"

NOTE_NUM_PAT  = re.compile(r'^\d+[a-z]?\.\s')
AA_PAT        = re.compile(r'AA')
INLINE_FN_NUM = re.compile(r'\d{3}')

# Common English function words — if a paragraph contains NONE of these
# it is almost certainly Arabic transliteration, not English commentary.
ENGLISH_FUNCTION_WORDS = {
    'the', 'a', 'an', 'in', 'of', 'to', 'at', 'with', 'by', 'from', 'for',
    'and', 'or', 'but', 'that', 'this', 'is', 'are', 'was', 'were', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'be', 'been', 'not', 'it', 'its', 'he', 'his', 'she',
    'her', 'they', 'their', 'we', 'our', 'you', 'who', 'which', 'what',
    'when', 'where', 'if', 'as', 'on', 'so', 'than', 'about', 'also',
}


def has_note_number(text):
    return bool(NOTE_NUM_PAT.match(text.strip()))


def para_has_english(para):
    """Return True if the paragraph contains at least one English function word."""
    words = {w.lower().strip(".,;:!?'\"()[]") for w in para.split()}
    return bool(words & ENGLISH_FUNCTION_WORDS)


def is_para_translit(para):
    """
    Return True if this paragraph is Arabic transliteration, not English commentary.

    Core rule: a paragraph with NO English function words (the, a, in, of, is, …)
    is transliteration. Real English commentary always contains some of these words.
    One exception: numbered note lines (e.g. '1. text') are always kept.
    """
    stripped = para.strip()
    if not stripped:
        return False
    if has_note_number(stripped):
        return False   # numbered note paragraphs are real notes

    # Dense AA + no English = definitely transliteration (fast path)
    aa_count = len(AA_PAT.findall(stripped))
    words = stripped.split()
    if aa_count >= 3 and aa_count / max(len(words), 1) >= 0.05:
        return True

    # Main rule: no English function words → transliteration
    return not para_has_english(stripped)


def clean_note_text(text):
    """
    Strip transliteration paragraphs from a note.
    Returns (new_text, changed: bool).
    Pure transliteration → empty string.
    Mixed → only English paragraphs kept.
    """
    paras = [p.strip() for p in re.split(r'\n\n+', text) if p.strip()]
    if not paras:
        return text, False

    good = [p for p in paras if not is_para_translit(p)]
    if len(good) == len(paras):
        return text, False

    return '\n\n'.join(good), True


def is_drift_short(text):
    stripped = text.strip()
    if has_note_number(stripped) or len(stripped) >= 20:
        return False
    # Only clear if it has no explanation markers — pure noun labels like
    # "Angels.", "Makkah.", "The Qur'aan." that drifted from footnote labels
    has_explanation = bool(re.search(r'\b(i\.e|e\.g|see|refer|note|please|means|here|this|was|is|are|has|had)\b', stripped, re.IGNORECASE))
    return not has_explanation


def is_drift_lowercase(text):
    stripped = text.strip()
    if has_note_number(stripped) or not stripped:
        return False
    if stripped[0].isupper() or not stripped[0].islower():
        return False
    # Only auto-clear if it contains embedded 3-digit footnote markers —
    # a sign this is Quranic verse text mixed with note numbers, not commentary
    return bool(INLINE_FN_NUM.search(stripped))


# ── Per-file fixer ────────────────────────────────────────────────────────────

def fix_surah(surah_num, dry_run=False):
    path = f"{DATA_DIR}/surah_{surah_num}.json"
    if not os.path.exists(path):
        return 0

    with open(path, encoding="utf-8") as f:
        verses = json.load(f)

    fixed = 0
    for verse in verses:
        ref   = verse.get("ref", "")
        notes = verse.get("notes", "")
        if not notes or not notes.strip():
            continue

        new_notes = notes
        reason    = None

        if is_drift_short(notes):
            new_notes = ""
            reason = "DRIFT_SHORT"
        elif is_drift_lowercase(notes):
            new_notes = ""
            reason = "DRIFT_LOWERCASE"
        else:
            cleaned, changed = clean_note_text(notes)
            if changed:
                new_notes = cleaned
                reason = "TRANSLIT_STRIPPED" if cleaned else "TRANSLIT_AS_NOTE"

        if reason:
            old_preview = notes.strip()[:80].replace('\n', ' ')
            new_preview = new_notes.strip()[:60].replace('\n', ' ') if new_notes else "(cleared)"
            print(f"  [{reason}] {ref}")
            print(f"    was: \"{old_preview}\"")
            print(f"    now: \"{new_preview}\"")
            if not dry_run:
                verse["notes"] = new_notes
            fixed += 1

    if fixed and not dry_run:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(verses, f, ensure_ascii=False, indent=2)

    return fixed


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    dry_run = "--dry-run" in sys.argv
    surah_arg = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--surah=')), None)

    if dry_run:
        print("DRY RUN — no files will be changed.\n")

    total_fixed  = 0
    total_surahs = 0

    surahs = [surah_arg] if surah_arg else range(1, 115)
    for s in surahs:
        fixed = fix_surah(s, dry_run=dry_run)
        if fixed:
            label = "would fix" if dry_run else "fixed"
            print(f"  → Surah {s}: {label} {fixed} verse(s)\n")
            total_fixed  += fixed
            total_surahs += 1

    action = "Would fix" if dry_run else "Fixed"
    print(f"\n{action} {total_fixed} notes across {total_surahs} surahs.")
    if dry_run:
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
