#!/usr/bin/env python3
"""
check_all_data.py — Master data-quality checker for the Qur'aan app.

Runs 17 distinct check categories across every surah JSON file and reports
anything that could cause errors or bad UX in the app.

Check categories
────────────────
 1. CHAPTERS_INDEX   — chapters.json is complete, sequential, valid fields
 2. FILE_PRESENCE    — all 114 surah files exist in public/data and src/data
 3. JSON_VALIDITY    — files parse without errors
 4. STRUCTURE        — top-level is array, required fields present & typed
 5. REF_INTEGRITY    — ref matches "surah:verse" format, id matches verse number
 6. SEQUENTIAL_IDS   — no gaps or duplicates in verse id sequence
 7. VERSE_COUNT      — actual verse count matches chapters.json total_verses
 8. ARABIC_CONTENT   — arabic field non-empty and contains Arabic Unicode chars
 9. FIELD_SWAP       — translation/transliteration don't accidentally contain Arabic
10. EMPTY_FIELDS     — translation/transliteration empty where unexpected
11. SHORT_CONTENT    — suspiciously short translations or arabic text
12. NOTE_QUALITY     — orphan notes, drift detection, number consistency
13. CROSS_REFS       — [X:Y] refs inside notes point to valid surah numbers
14. HAS_TAFSIR_FLAG  — chapters.json has_tafsir flag matches actual note presence
15. SRC_PUBLIC_SYNC  — src/data and public/data files are byte-for-byte identical
16. VERSE_OF_THE_DAY — every ref in verseOfTheDay.js exists in actual data
17. APP_USAGE        — fields used by React app (ids, refs) are always safe

Severity levels
───────────────
  CRITICAL  App will break or data is corrupt
  WARNING   Likely wrong — should be reviewed
  ALERT     Possibly wrong — needs manual check
  INFO      Informational / cosmetic

Usage
─────
    python3 scripts/check_all_data.py                 # check all 114 surahs
    python3 scripts/check_all_data.py --surah 1 2 3   # specific surahs
    python3 scripts/check_all_data.py --quick         # skip src/public sync
    python3 scripts/check_all_data.py --verbose       # include INFO items
    python3 scripts/check_all_data.py --errors-only   # CRITICAL only
    python3 scripts/check_all_data.py --json          # machine-readable output
"""

import json
import re
import os
import sys
import argparse
import hashlib
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────────────────────────────

ROOT         = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA  = os.path.join(ROOT, "public", "data")
SRC_DATA     = os.path.join(ROOT, "src", "data")
CHAPTERS_PUB = os.path.join(PUBLIC_DATA, "chapters.json")
CHAPTERS_SRC = os.path.join(SRC_DATA, "chapters.json")
VOTD_JS      = os.path.join(ROOT, "src", "utils", "verseOfTheDay.js")

# ── Severity ───────────────────────────────────────────────────────────────────

CRITICAL = "CRITICAL"
WARNING  = "WARNING"
ALERT    = "ALERT"
INFO     = "INFO"

SEV_ORDER  = {CRITICAL: 0, WARNING: 1, ALERT: 2, INFO: 3}
SEV_ICONS  = {CRITICAL: "x", WARNING: "!", ALERT: "^", INFO: "i"}
SEV_COLORS = {CRITICAL: "\033[91m", WARNING: "\033[93m", ALERT: "\033[96m", INFO: "\033[90m"}
RESET      = "\033[0m"

# ── Issue model ────────────────────────────────────────────────────────────────

class Issue:
    def __init__(self, severity, code, location, message):
        self.severity = severity
        self.code     = code
        self.location = location
        self.message  = message

# ── Regex ──────────────────────────────────────────────────────────────────────

REF_PAT      = re.compile(r'^(\d+):(\d+)$')
ARABIC_RE    = re.compile(r'[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]')
CROSS_REF_RE = re.compile(r'\[(?:Q:\s*)?(\d+):(\d+)\]')
NOTE_NUM_RE  = re.compile(r'^(\d+[a-z]?)\.\s')
INLINE_NUM_RE= re.compile(r'(\d+[a-z]?)(?=\s|$|[,\.!?;])')
SUPERSCRIPT  = str.maketrans("\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079\u2070", "1234567890")
VOTD_RE_RE   = re.compile(r"'(\d+:\d+)'")

# ── Helpers ────────────────────────────────────────────────────────────────────

def _load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def _md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()

def _norm(text):
    return text.translate(SUPERSCRIPT) if text else ""

def _color(sev, text, use_color):
    if not use_color:
        return text
    return f"{SEV_COLORS[sev]}{text}{RESET}"

# ── Issue collector ────────────────────────────────────────────────────────────

class Report:
    def __init__(self):
        self._issues = []

    def add(self, severity, code, location, message):
        self._issues.append(Issue(severity, code, location, message))

    def issues(self, min_sev=INFO):
        cutoff = SEV_ORDER[min_sev]
        return [i for i in self._issues if SEV_ORDER[i.severity] <= cutoff]

    def by_severity(self, sev):
        return [i for i in self._issues if i.severity == sev]

    def total(self):
        return len(self._issues)


# ── CHECK 1 — chapters.json integrity ─────────────────────────────────────────

def check_chapters(report):
    result = None

    for label, path in [
        ("public/data/chapters.json", CHAPTERS_PUB),
        ("src/data/chapters.json",    CHAPTERS_SRC),
    ]:
        if not os.path.exists(path):
            report.add(CRITICAL, "CHAPTERS_FILE_MISSING", label, f"Not found: {path}")
            continue

        try:
            data = _load_json(path)
        except json.JSONDecodeError as e:
            report.add(CRITICAL, "CHAPTERS_JSON_ERROR", label, str(e))
            continue

        if not isinstance(data, list):
            report.add(CRITICAL, "CHAPTERS_NOT_LIST", label,
                        "chapters.json top-level is not a JSON array")
            continue

        ids = [c.get("id") for c in data if isinstance(c.get("id"), int)]
        expected = list(range(1, 115))
        missing = [i for i in expected if i not in ids]
        extra   = [i for i in ids if i < 1 or i > 114]
        dupes   = [i for i in ids if ids.count(i) > 1]

        if missing:
            report.add(WARNING, "CHAPTERS_MISSING_ENTRIES", label,
                        f"Missing chapter IDs: {missing}")
        if extra:
            report.add(WARNING, "CHAPTERS_OUT_OF_RANGE", label,
                        f"Chapter IDs outside 1-114: {extra}")
        if dupes:
            report.add(WARNING, "CHAPTERS_DUPLICATE_IDS", label,
                        f"Duplicate chapter IDs: {sorted(set(dupes))}")

        valid_types = {"meccan", "medinan"}
        for c in data:
            cid = c.get("id", "?")
            loc = f"chapters[{cid}]"

            for field in ("id", "name", "transliteration", "type",
                          "total_verses", "has_tafsir"):
                if field not in c:
                    report.add(WARNING, "CHAPTERS_MISSING_FIELD", loc,
                                f"Field '{field}' absent from chapters.json entry")

            if "type" in c and c["type"] not in valid_types:
                report.add(WARNING, "CHAPTERS_INVALID_TYPE", loc,
                            f"type='{c['type']}' - must be 'meccan' or 'medinan'")

            tv = c.get("total_verses")
            if tv is not None and (not isinstance(tv, int) or tv < 1):
                report.add(WARNING, "CHAPTERS_INVALID_VERSE_COUNT", loc,
                            f"total_verses={tv!r} - must be a positive integer")

        if path == CHAPTERS_PUB:
            result = {c["id"]: c for c in data if isinstance(c.get("id"), int)}

    if os.path.exists(CHAPTERS_PUB) and os.path.exists(CHAPTERS_SRC):
        if _md5(CHAPTERS_PUB) != _md5(CHAPTERS_SRC):
            report.add(WARNING, "CHAPTERS_SYNC_MISMATCH", "chapters.json",
                        "public/data/chapters.json and src/data/chapters.json differ - "
                        "they should be identical copies")

    return result or {}


# ── CHECK 2-14 — per-verse validation ─────────────────────────────────────────

REQUIRED_FIELDS = ("id", "ref", "arabic", "transliteration", "translation", "notes")
STRING_FIELDS   = ("ref", "arabic", "transliteration", "translation", "notes")

def _check_verse(verse, surah_num, chapters, report):
    ref      = verse.get("ref", f"{surah_num}:?")
    vid      = verse.get("id")
    arabic   = verse.get("arabic", "")
    translit = verse.get("transliteration", "")
    trans    = verse.get("translation", "")
    notes    = verse.get("notes", "")

    for field in REQUIRED_FIELDS:
        if field not in verse:
            report.add(CRITICAL, "MISSING_FIELD", ref,
                        f"Required field '{field}' is absent")

    if not isinstance(vid, int):
        report.add(CRITICAL, "ID_NOT_INTEGER", ref,
                    f"verse.id={vid!r} must be an integer (used in DOM element id lookup)")

    for field in STRING_FIELDS:
        val = verse.get(field)
        if val is not None and not isinstance(val, str):
            report.add(CRITICAL, "WRONG_FIELD_TYPE", ref,
                        f"Field '{field}' must be a string, got {type(val).__name__}: {val!r}")

    m = REF_PAT.match(ref)
    if not m:
        report.add(CRITICAL, "BAD_REF_FORMAT", ref,
                    f"ref='{ref}' is not 'surah:verse' format")
    else:
        ref_surah = int(m.group(1))
        ref_verse = int(m.group(2))
        if ref_surah != surah_num:
            report.add(CRITICAL, "WRONG_SURAH_IN_REF", ref,
                        f"ref says surah {ref_surah} but file is surah_{surah_num}.json")
        if isinstance(vid, int) and vid != ref_verse:
            report.add(CRITICAL, "ID_REF_MISMATCH", ref,
                        f"id={vid} but ref has verse number {ref_verse} - "
                        f"jump-to-verse and DOM lookup will break")

    if not arabic or not arabic.strip():
        report.add(WARNING, "EMPTY_ARABIC", ref,
                    "arabic field is empty - no Arabic text to display")
    elif not ARABIC_RE.search(arabic):
        report.add(WARNING, "NO_ARABIC_UNICODE", ref,
                    f"arabic field contains no Arabic Unicode characters: '{arabic[:80]}'")
    # Single/double Arabic letters are valid (Quranic muqatta'at e.g. Taha 20:1, Qaf 50:1)

    if not translit or not translit.strip():
        report.add(WARNING, "EMPTY_TRANSLITERATION", ref,
                    "transliteration field is empty")
    elif ARABIC_RE.search(translit):
        report.add(ALERT, "ARABIC_IN_TRANSLITERATION", ref,
                    f"transliteration contains Arabic characters - possible field swap: '{translit[:80]}'")

    if not trans or not trans.strip():
        ch = chapters.get(surah_num, {})
        if ch.get("has_tafsir"):
            report.add(WARNING, "EMPTY_TRANSLATION_TAFSIR_SURAH", ref,
                        "Translation is empty in a surah marked has_tafsir=true")
        else:
            report.add(WARNING, "EMPTY_TRANSLATION", ref,
                        "Translation field is empty - nothing to show in reader or search")
    else:
        if ARABIC_RE.search(trans):
            report.add(ALERT, "ARABIC_IN_TRANSLATION", ref,
                        f"translation contains Arabic characters - possible field swap: '{trans[:80]}'")
        if len(trans.strip()) < 5:
            report.add(ALERT, "VERY_SHORT_TRANSLATION", ref,
                        f"Translation is suspiciously short ({len(trans.strip())} chars): '{trans.strip()}'")

    if notes and notes.strip():
        notes_n = _norm(notes)
        trans_n = _norm(trans)

        if not trans or not trans.strip():
            report.add(WARNING, "ORPHAN_NOTE", ref,
                        f"Verse has a note but translation is empty - note preview: '{notes[:80]}'")

        trans_markers = set(INLINE_NUM_RE.findall(trans_n))
        note_open     = NOTE_NUM_RE.match(notes_n.strip())

        if trans_markers and note_open:
            opening = note_open.group(1)
            if opening not in trans_markers:
                report.add(ALERT, "NOTE_NUMBER_MISMATCH", ref,
                            f"Note opens with '{opening}.' but translation has markers "
                            f"{sorted(trans_markers)} - note may belong to a different verse. "
                            f"Preview: '{notes[:100]}'")

        if not note_open:
            stripped = notes.strip()
            if len(stripped) < 20:
                report.add(ALERT, "POSSIBLE_DRIFT_SHORT", ref,
                            f"Note has no number prefix and is very short "
                            f"({len(stripped)} chars) - likely a drifted fragment: '{stripped}'")
            elif stripped and stripped[0].islower():
                report.add(ALERT, "POSSIBLE_DRIFT_LOWERCASE", ref,
                            f"Note starts with lowercase - may be a mid-sentence fragment: '{stripped[:120]}'")

        for cm in CROSS_REF_RE.finditer(notes):
            cited_s = int(cm.group(1))
            cited_v = int(cm.group(2))
            if not (1 <= cited_s <= 114):
                report.add(WARNING, "INVALID_CROSS_REF", ref,
                            f"Note references [{cited_s}:{cited_v}] - surah {cited_s} does not exist")
            if cited_v < 1:
                report.add(WARNING, "INVALID_CROSS_REF_VERSE", ref,
                            f"Note references [{cited_s}:{cited_v}] - verse number must be >= 1")

    elif notes is not None and notes != "" and not notes.strip():
        report.add(ALERT, "WHITESPACE_ONLY_NOTE", ref,
                    "notes field contains only whitespace - will be treated as empty by the app")


# ── CHECK 2-14 — per-surah file ───────────────────────────────────────────────

def check_surah(surah_num, chapters, report):
    path  = os.path.join(PUBLIC_DATA, f"surah_{surah_num}.json")
    label = f"surah_{surah_num}"

    if not os.path.exists(path):
        report.add(CRITICAL, "FILE_MISSING", label,
                    f"public/data/surah_{surah_num}.json not found - "
                    f"app will crash trying to fetch this surah")
        return None

    try:
        verses = _load_json(path)
    except json.JSONDecodeError as e:
        report.add(CRITICAL, "JSON_PARSE_ERROR", label, f"File is not valid JSON: {e}")
        return None

    if not isinstance(verses, list):
        report.add(CRITICAL, "NOT_A_LIST", label,
                    f"Top-level JSON value is {type(verses).__name__}, expected array")
        return None

    if len(verses) == 0:
        report.add(CRITICAL, "EMPTY_SURAH", label, "Surah file contains zero verses")
        return verses

    ch = chapters.get(surah_num)
    if ch:
        expected = ch.get("total_verses", 0)
        actual   = len(verses)
        if actual != expected:
            report.add(WARNING, "VERSE_COUNT_MISMATCH", label,
                        f"chapters.json says {expected} verses, but file has {actual} - "
                        f"jump-to-verse range will be wrong for this surah")

    ids          = [v.get("id") for v in verses]
    expected_ids = list(range(1, len(verses) + 1))
    if ids != expected_ids:
        dupes   = sorted({i for i in ids if isinstance(i, int) and ids.count(i) > 1})
        missing = [i for i in expected_ids if i not in ids]
        if dupes:
            report.add(CRITICAL, "DUPLICATE_IDS", label,
                        f"Duplicate verse ids: {dupes} - React key collisions and wrong DOM ids")
        if missing:
            report.add(CRITICAL, "MISSING_IDS", label,
                        f"Missing verse ids (first 20): {missing[:20]} - "
                        f"scroll-to-verse and resume-reading will skip these verses")

    if ch:
        has_notes_in_data = any(
            isinstance(v.get("notes"), str) and v["notes"].strip()
            for v in verses
        )
        flag = ch.get("has_tafsir", False)

        if flag and not has_notes_in_data:
            report.add(WARNING, "HAS_TAFSIR_FLAG_WRONG", label,
                        "chapters.json has_tafsir=true but no verse has non-empty notes - flag is inaccurate")
        if not flag and has_notes_in_data:
            report.add(ALERT, "UNEXPECTED_NOTES_PRESENT", label,
                        "chapters.json has_tafsir=false but verses contain notes - "
                        "flag is inaccurate (notes will still display)")

    for verse in verses:
        _check_verse(verse, surah_num, chapters, report)

    return verses


# ── CHECK 15 — src/data vs public/data sync ───────────────────────────────────

def check_sync(surahs, report):
    for n in surahs:
        pub = os.path.join(PUBLIC_DATA, f"surah_{n}.json")
        src = os.path.join(SRC_DATA,    f"surah_{n}.json")

        if not os.path.exists(src):
            report.add(WARNING, "SRC_FILE_MISSING", f"src/surah_{n}",
                        f"src/data/surah_{n}.json not found - src/data should mirror public/data")
            continue

        if not os.path.exists(pub):
            continue

        if _md5(pub) != _md5(src):
            report.add(WARNING, "SRC_PUBLIC_SYNC_MISMATCH", f"surah_{n}",
                        f"public/data/surah_{n}.json and src/data/surah_{n}.json are different - "
                        f"one of them has stale data")


# ── CHECK 16 — Verse of the Day refs ──────────────────────────────────────────

def check_votd(all_refs, report):
    if not os.path.exists(VOTD_JS):
        report.add(WARNING, "VOTD_FILE_MISSING", "verseOfTheDay.js", f"Not found: {VOTD_JS}")
        return

    with open(VOTD_JS, encoding="utf-8") as f:
        content = f.read()

    in_block = False
    refs     = []
    for line in content.split("\n"):
        if "FEATURED_VERSES" in line and "=" in line:
            in_block = True
        if in_block:
            refs.extend(VOTD_RE_RE.findall(line))
        if in_block and "]" in line and "FEATURED_VERSES" not in line:
            break

    if not refs:
        report.add(ALERT, "VOTD_NO_REFS_PARSED", "verseOfTheDay.js",
                    "Could not parse any verse refs from FEATURED_VERSES - check the file format")
        return

    for ref in refs:
        if ref not in all_refs:
            report.add(WARNING, "VOTD_REF_MISSING", f"verseOfTheDay:{ref}",
                        f"Featured verse '{ref}' does not exist in any surah data file - "
                        f"Verse of the Day will be null for this ref")

    seen = {}
    for ref in refs:
        if ref in seen:
            report.add(INFO, "VOTD_DUPLICATE_REF", f"verseOfTheDay:{ref}",
                        f"'{ref}' appears more than once in FEATURED_VERSES")
        seen[ref] = True


# ── CHECK 17 — App-specific usage checks ──────────────────────────────────────

def check_app_usage(surah_num, verses, chapters, report):
    ch = chapters.get(surah_num, {})

    # Surah 1 verse 1 IS the bismillah; the app also renders a bismillah header
    # for all surahs except 9 - so surah 1 shows it twice.
    if surah_num == 1 and verses:
        v1_arabic = verses[0].get("arabic", "")
        if "\u0628\u0650\u0633\u0652\u0645\u0650" in v1_arabic or "\u0628\u0633\u0645" in v1_arabic:
            report.add(INFO, "BISMILLAH_SHOWN_TWICE", "surah_1:1",
                        "SurahReader renders a bismillah header (except surah 9). "
                        "Surah 1 verse 1 IS the bismillah, so it appears twice in the UI.")

    if surah_num == 9 and verses:
        v1_arabic = verses[0].get("arabic", "")
        if "\u0628\u0650\u0633\u0652\u0645\u0650" in v1_arabic or "\u0628\u0633\u0645" in v1_arabic:
            report.add(INFO, "SURAH_9_UNEXPECTED_BISMILLAH", "surah_9:1",
                        "Surah 9 verse 1 appears to contain bismillah text - verify this is correct.")

    actual   = len(verses)
    declared = ch.get("total_verses", actual)
    if actual != declared:
        report.add(INFO, "JUMP_RANGE_MISMATCH", f"surah_{surah_num}",
                    f"Jump-to-verse uses chapters.json total_verses={declared} as max, "
                    f"but actual verse count is {actual}.")

    for v in verses:
        vid = v.get("id")
        if not isinstance(vid, int) or vid < 1:
            report.add(CRITICAL, "INVALID_VERSE_ID_FOR_RESUME", v.get("ref", "?"),
                        f"verse.id={vid!r} must be a positive integer - "
                        f"resume-reading and jump-to-verse use it as a DOM id")


# ── Output helpers ─────────────────────────────────────────────────────────────

def _print_issues(issues, use_color):
    if not issues:
        return

    seen_locs = []
    by_loc    = defaultdict(list)
    for iss in issues:
        if iss.location not in by_loc:
            seen_locs.append(iss.location)
        by_loc[iss.location].append(iss)

    for loc in seen_locs:
        loc_issues = by_loc[loc]
        worst_sev  = min(loc_issues, key=lambda i: SEV_ORDER[i.severity]).severity
        icon       = SEV_ICONS[worst_sev]
        header     = _color(worst_sev, f"{icon} {loc}", use_color)
        print(f"\n{header}")
        for iss in loc_issues:
            icon2 = SEV_ICONS[iss.severity]
            label = _color(iss.severity, f"  {icon2} [{iss.severity}] {iss.code}", use_color)
            print(label)
            msg = iss.message
            indent = "       "
            while msg:
                chunk, msg = msg[:100], msg[100:]
                print(f"{indent}{chunk}")


def _print_summary(report, surahs_checked, use_color):
    all_issues = report.issues()

    print()
    print("=" * 65)
    print("  SUMMARY")
    print("=" * 65)
    print(f"  Surahs checked    : {surahs_checked}")
    print(f"  Total issues found: {len(all_issues)}")
    print()

    by_sev  = defaultdict(list)
    by_code = defaultdict(int)
    for iss in all_issues:
        by_sev[iss.severity].append(iss)
        by_code[iss.code] += 1

    if not all_issues:
        ok = "\033[92mAll checks passed - no issues found!\033[0m" if use_color else "All checks passed - no issues found!"
        print(f"  {ok}")
        return

    for sev in (CRITICAL, WARNING, ALERT, INFO):
        items = by_sev.get(sev, [])
        if not items:
            continue
        icon  = SEV_ICONS[sev]
        label = _color(sev, f"  {icon} {sev}: {len(items)} issue(s)", use_color)
        print(label)
        sev_codes = defaultdict(int)
        for i in items:
            sev_codes[i.code] += 1
        for code, cnt in sorted(sev_codes.items(), key=lambda x: -x[1]):
            print(f"     {code:<45} {cnt:>4}x")
        print()

    drifts = [i for i in all_issues
              if i.code in ("POSSIBLE_DRIFT_SHORT", "POSSIBLE_DRIFT_LOWERCASE", "NOTE_NUMBER_MISMATCH")]
    if drifts:
        print("-" * 65)
        print(f"  NOTE DRIFT ALERTS ({len(drifts)} total) - need manual review:")
        print("-" * 65)
        for iss in drifts:
            print(f"  {iss.location:<12}  {iss.code}")
            print(f"    {iss.message[:180]}")
        print()


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(
        description="Master data-quality checker for the Qur'aan app",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("--surah", type=int, nargs="+", metavar="N",
                    help="Specific surah number(s) to check (default: all 1-114)")
    ap.add_argument("--quick", action="store_true",
                    help="Skip src/data vs public/data sync check (faster)")
    ap.add_argument("--verbose", action="store_true",
                    help="Include INFO-level items in output")
    ap.add_argument("--errors-only", action="store_true",
                    help="Show CRITICAL issues only")
    ap.add_argument("--json", action="store_true",
                    help="Output results as JSON (for CI / tooling integration)")
    ap.add_argument("--no-color", action="store_true",
                    help="Disable ANSI color output")
    args = ap.parse_args()

    surahs    = args.surah or list(range(1, 115))
    use_color = not args.no_color and sys.stdout.isatty()

    if not args.json:
        print("=" * 65)
        print("  Qur'aan App - Master Data Validation")
        print("=" * 65)
        print(f"  Checking {len(surahs)} surah(s) ...\n")

    report = Report()

    if not args.json:
        print("[1/6] Validating chapters.json ...")
    chapters = check_chapters(report)
    if not chapters and not args.json:
        print("  x chapters.json could not be loaded - some checks will be skipped")

    if not args.json:
        print("[2/6] Validating surah files (public/data) ...")
    all_verse_data = {}
    all_refs       = set()

    for n in surahs:
        verses = check_surah(n, chapters, report)
        if verses:
            all_verse_data[n] = verses
            for v in verses:
                r = v.get("ref")
                if isinstance(r, str):
                    all_refs.add(r)

    if not args.json:
        print("[3/6] Checking src/data file presence ...")
    for n in surahs:
        src = os.path.join(SRC_DATA, f"surah_{n}.json")
        if not os.path.exists(src):
            report.add(WARNING, "SRC_FILE_MISSING", f"src/surah_{n}",
                        f"src/data/surah_{n}.json not found - src/data should always mirror public/data")

    if not args.quick:
        if not args.json:
            print("[4/6] Checking src/data <-> public/data sync ...")
        check_sync(surahs, report)
    else:
        if not args.json:
            print("[4/6] Skipped (--quick)")

    if not args.json:
        print("[5/6] Checking app-specific data usage ...")
    for n, verses in all_verse_data.items():
        check_app_usage(n, verses, chapters, report)

    if not args.json:
        print("[6/6] Checking Verse of the Day refs ...")
    check_votd(all_refs, report)

    if args.json:
        output = [
            {"severity": i.severity, "code": i.code,
             "location": i.location, "message": i.message}
            for i in report.issues(INFO)
        ]
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        if args.errors_only:
            min_sev = CRITICAL
        elif args.verbose:
            min_sev = INFO
        else:
            min_sev = ALERT

        visible = report.issues(min_sev)
        _print_issues(visible, use_color)
        _print_summary(report, len(surahs), use_color)

    sys.exit(1 if report.by_severity(CRITICAL) else 0)


if __name__ == "__main__":
    main()