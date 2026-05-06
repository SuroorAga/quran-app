"""
validate_data.py — Data integrity checker for extracted Qur'aan JSON files.

Checks performed per verse:
  1. STRUCTURAL   — required fields exist and have correct types
  2. REF FORMAT   — ref matches "surah:verse" and id matches verse number
  3. NOTE DRIFT   — note text doesn't start with a fragment that looks like
                    it belongs to a different verse (e.g. a sentence that
                    references a completely different topic with no connection
                    to the translation)
  4. NOTE NUMBER  — if translation contains inline note markers (superscript
                    numbers like "¹" or trailing digits), the note text should
                    start with a matching number "N." or "Na."
  5. ORPHAN NOTE  — verse has a note but translation is empty (can't verify
                    the note belongs here)
  6. VERSE COUNT  — actual verse count matches chapters.json total_verses
  7. SEQUENTIAL   — verse ids are sequential with no gaps or duplicates
  8. CROSS-REF    — notes that mention "[X:Y]" style refs are checked to
                    ensure the surah number X is plausible (exists 1-114)

Usage:
    python3 scripts/validate_data.py                  # check all surahs
    python3 scripts/validate_data.py --surah 3        # check one surah
    python3 scripts/validate_data.py --surah 1 --surah 2 --surah 3
    python3 scripts/validate_data.py --data-dir src/data
    python3 scripts/validate_data.py --verbose        # show passing checks too
"""

import json
import re
import os
import sys
import argparse
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────

DEFAULT_DATA_DIR = "public/data"
CHAPTERS_FILE    = "public/data/chapters.json"

# Inline note markers in translation text — superscript unicode or plain digits
# at end of a word (e.g. "Truth9" or "Truth¹")
INLINE_NOTE_PAT = re.compile(r'(\d+[a-z]?)(?=\s|$|[,\.!?;])')
SUPERSCRIPT_MAP = str.maketrans("¹²³⁴⁵⁶⁷⁸⁹⁰", "1234567890")

# Note opening pattern: "7." or "7a." or "1a." at the start of note text
NOTE_OPEN_PAT = re.compile(r'^(\d+[a-z]?)\.\s')

# Cross-reference pattern inside note text: [2:61] or Q: 4:82
CROSS_REF_PAT = re.compile(r'\[(?:Q:\s*)?(\d+):(\d+)\]')

# Sentence-fragment heuristic: note text that is suspiciously short AND
# doesn't start with a note number is likely a drifted fragment
MIN_NOTE_LENGTH = 20  # characters — shorter than this with no number = suspect

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_chapters():
    try:
        with open(CHAPTERS_FILE, encoding="utf-8") as f:
            chapters = json.load(f)
        return {c["id"]: c for c in chapters}
    except Exception as e:
        print(f"WARNING: could not load chapters.json: {e}")
        return {}


def load_surah(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def normalise_note_markers(text):
    """Convert superscript unicode digits to ASCII."""
    return text.translate(SUPERSCRIPT_MAP)


# ── Per-verse checks ──────────────────────────────────────────────────────────

def check_verse(verse, surah_num, issues):
    ref      = verse.get("ref", "")
    vid      = verse.get("id")
    arabic   = verse.get("arabic", "")
    translit = verse.get("transliteration", "")
    trans    = verse.get("translation", "")
    notes    = verse.get("notes", "")

    # 1. Required fields present
    for field in ("id", "ref", "arabic", "transliteration", "translation", "notes"):
        if field not in verse:
            issues.append((ref, "MISSING_FIELD", f"Field '{field}' is absent"))

    # 2. Ref format
    ref_match = re.match(r'^(\d+):(\d+)$', ref)
    if not ref_match:
        issues.append((ref, "BAD_REF_FORMAT", f"ref='{ref}' is not 'surah:verse'"))
    else:
        ref_surah = int(ref_match.group(1))
        ref_verse = int(ref_match.group(2))
        if ref_surah != surah_num:
            issues.append((ref, "WRONG_SURAH_IN_REF",
                           f"ref says surah {ref_surah} but file is surah {surah_num}"))
        if vid is not None and vid != ref_verse:
            issues.append((ref, "ID_VERSE_MISMATCH",
                           f"id={vid} but ref verse number={ref_verse}"))

    # Skip note checks if notes field is empty
    if not notes or not notes.strip():
        return

    notes_norm = normalise_note_markers(notes)
    trans_norm = normalise_note_markers(trans)

    # 3. Orphan note — note exists but translation is empty
    if not trans or not trans.strip():
        issues.append((ref, "ORPHAN_NOTE",
                       f"Has a note but translation is empty — cannot verify alignment. "
                       f"Note preview: '{notes[:80]}'"))

    # 4. Note number consistency
    #    Find all inline markers in the translation
    trans_markers = set(INLINE_NOTE_PAT.findall(trans_norm))
    #    Find the opening number of the note text
    note_open = NOTE_OPEN_PAT.match(notes_norm.strip())

    if trans_markers and note_open:
        opening_num = note_open.group(1)
        if opening_num not in trans_markers:
            issues.append((ref, "NOTE_NUMBER_MISMATCH",
                           f"Note opens with '{opening_num}.' but translation "
                           f"markers are {sorted(trans_markers)}. "
                           f"Note preview: '{notes[:100]}'"))

    # 5. Note drift heuristic — note has no opening number AND is short
    #    This catches fragments like "the suppressors of Truth among..."
    if not note_open:
        note_stripped = notes.strip()
        if len(note_stripped) < MIN_NOTE_LENGTH:
            issues.append((ref, "POSSIBLE_DRIFT_SHORT",
                           f"Note has no number prefix and is very short ({len(note_stripped)} chars). "
                           f"Likely a drifted fragment: '{note_stripped}'"))
        elif not trans or not trans.strip():
            # Already flagged as orphan above, skip double-reporting
            pass
        else:
            # Check if the note text looks completely unrelated to the translation
            # by seeing if it starts with a lowercase letter (mid-sentence fragment)
            first_char = note_stripped[0] if note_stripped else ""
            if first_char.islower():
                issues.append((ref, "POSSIBLE_DRIFT_LOWERCASE",
                               f"Note starts with lowercase — may be a mid-sentence fragment: "
                               f"'{note_stripped[:120]}'"))

    # 6. Cross-reference sanity — [X:Y] refs inside notes should have valid surah X
    for m in CROSS_REF_PAT.finditer(notes):
        cited_surah = int(m.group(1))
        cited_verse = int(m.group(2))
        if not (1 <= cited_surah <= 114):
            issues.append((ref, "INVALID_CROSS_REF",
                           f"Note references [{cited_surah}:{cited_verse}] — surah {cited_surah} doesn't exist"))


# ── Per-surah checks ──────────────────────────────────────────────────────────

def check_surah(surah_num, data_dir, chapters, verbose=False):
    path = os.path.join(data_dir, f"surah_{surah_num}.json")
    issues = []
    info   = []

    if not os.path.exists(path):
        return surah_num, [("—", "FILE_MISSING", f"{path} not found")], []

    try:
        verses = load_surah(path)
    except json.JSONDecodeError as e:
        return surah_num, [("—", "JSON_PARSE_ERROR", str(e))], []

    if not isinstance(verses, list):
        return surah_num, [("—", "NOT_A_LIST", "Top-level JSON is not an array")], []

    # Verse count check
    if surah_num in chapters:
        expected = chapters[surah_num]["total_verses"]
        actual   = len(verses)
        if actual != expected:
            issues.append(("—", "VERSE_COUNT_MISMATCH",
                           f"Expected {expected} verses, found {actual}"))
        elif verbose:
            info.append(f"  ✓ Verse count: {actual}")

    # Sequential id check
    ids = [v.get("id") for v in verses]
    expected_ids = list(range(1, len(verses) + 1))
    if ids != expected_ids:
        dupes = [i for i in ids if ids.count(i) > 1]
        missing = [i for i in expected_ids if i not in ids]
        if dupes:
            issues.append(("—", "DUPLICATE_IDS", f"Duplicate ids: {sorted(set(dupes))}"))
        if missing:
            issues.append(("—", "MISSING_IDS", f"Missing ids: {missing[:20]}"))

    # Per-verse checks
    for verse in verses:
        check_verse(verse, surah_num, issues)

    return surah_num, issues, info


# ── Summary helpers ───────────────────────────────────────────────────────────

SEVERITY = {
    "FILE_MISSING":           "ERROR",
    "JSON_PARSE_ERROR":       "ERROR",
    "NOT_A_LIST":             "ERROR",
    "MISSING_FIELD":          "ERROR",
    "BAD_REF_FORMAT":         "ERROR",
    "WRONG_SURAH_IN_REF":     "ERROR",
    "ID_VERSE_MISMATCH":      "ERROR",
    "VERSE_COUNT_MISMATCH":   "WARNING",
    "DUPLICATE_IDS":          "WARNING",
    "MISSING_IDS":            "WARNING",
    "NOTE_NUMBER_MISMATCH":   "WARNING",
    "ORPHAN_NOTE":            "WARNING",
    "POSSIBLE_DRIFT_SHORT":   "ALERT",
    "POSSIBLE_DRIFT_LOWERCASE": "ALERT",
    "INVALID_CROSS_REF":      "WARNING",
}

ICONS = {"ERROR": "✗", "WARNING": "⚠", "ALERT": "⚡"}


def print_issues(surah_num, issues, info, verbose):
    if not issues and not verbose:
        return

    has_errors   = any(SEVERITY.get(code, "WARNING") == "ERROR"   for _, code, _ in issues)
    has_warnings = any(SEVERITY.get(code, "WARNING") != "ERROR"   for _, code, _ in issues)

    status = "✗ ERRORS" if has_errors else ("⚠ WARNINGS" if has_warnings else "✓ OK")
    print(f"\nSurah {surah_num:>3}  {status}")

    for line in info:
        print(line)

    for ref, code, msg in issues:
        sev  = SEVERITY.get(code, "WARNING")
        icon = ICONS.get(sev, "?")
        print(f"  {icon} [{sev}] {ref}  {code}")
        print(f"       {msg}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Validate extracted Qur'aan JSON data")
    parser.add_argument("--surah",    type=int, action="append", metavar="N",
                        help="Surah number(s) to check (default: all 1-114)")
    parser.add_argument("--data-dir", default=DEFAULT_DATA_DIR,
                        help=f"Path to data directory (default: {DEFAULT_DATA_DIR})")
    parser.add_argument("--verbose",  action="store_true",
                        help="Show passing checks as well as failures")
    parser.add_argument("--errors-only", action="store_true",
                        help="Only show ERROR severity issues (skip warnings/alerts)")
    args = parser.parse_args()

    data_dir = args.data_dir
    surahs   = args.surah if args.surah else list(range(1, 115))

    print(f"Validating {len(surahs)} surah(s) in '{data_dir}' …")

    chapters = load_chapters()

    total_issues  = defaultdict(int)   # code -> count
    total_surahs_with_issues = 0
    all_issues = []  # (surah_num, ref, code, msg)

    for s in surahs:
        surah_num, issues, info = check_surah(s, data_dir, chapters, args.verbose)

        if args.errors_only:
            issues = [(r, c, m) for r, c, m in issues
                      if SEVERITY.get(c, "WARNING") == "ERROR"]

        print_issues(surah_num, issues, info, args.verbose)

        if issues:
            total_surahs_with_issues += 1
            for _, code, _ in issues:
                total_issues[code] += 1
            for ref, code, msg in issues:
                all_issues.append((surah_num, ref, code, msg))

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Surahs checked : {len(surahs)}")
    print(f"Surahs with issues: {total_surahs_with_issues}")

    if total_issues:
        print("\nIssue breakdown:")
        for code, count in sorted(total_issues.items(), key=lambda x: -x[1]):
            sev  = SEVERITY.get(code, "WARNING")
            icon = ICONS.get(sev, "?")
            print(f"  {icon} {code:<30} {count:>4}x")

        # Show all ALERT issues in one place for easy review
        alerts = [(s, r, c, m) for s, r, c, m in all_issues
                  if SEVERITY.get(c, "WARNING") == "ALERT"]
        if alerts:
            print(f"\n{'─'*60}")
            print(f"ALL DRIFT ALERTS ({len(alerts)} total) — these need manual review:")
            print(f"{'─'*60}")
            for surah_num, ref, code, msg in alerts:
                print(f"  Surah {surah_num:>3}  {ref:<8}  {code}")
                print(f"    {msg[:200]}")
    else:
        print("\n✓ No issues found!")

    # Exit code: 1 if any errors, 0 otherwise
    has_errors = any(
        SEVERITY.get(c, "WARNING") == "ERROR"
        for _, _, c, _ in all_issues
    )
    sys.exit(1 if has_errors else 0)


if __name__ == "__main__":
    main()
