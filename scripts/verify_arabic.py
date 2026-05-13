#!/usr/bin/env python3
"""
verify_arabic.py — Compare Arabic text in app JSON against alquran.cloud Uthmani text.
Also runs heuristic checks on transliteration and translation.

Usage:
    python3 scripts/verify_arabic.py                  # all 114 surahs
    python3 scripts/verify_arabic.py --surah 1 2 3    # specific surahs
    python3 scripts/verify_arabic.py --arabic-only    # skip heuristic checks
    python3 scripts/verify_arabic.py --no-color       # plain output
"""

import json
import os
import re
import sys
import time
import argparse
import urllib.request
import urllib.error
from collections import defaultdict

ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA = os.path.join(ROOT, "public", "data")

ARABIC_RE  = re.compile(r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]')
API_BASE   = "https://api.alquran.cloud/v1/surah/{}/quran-uthmani"

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
GREY   = "\033[90m"
RESET  = "\033[0m"

def col(text, color, use_color):
    return f"{color}{text}{RESET}" if use_color else text

def normalize_arabic(text):
    """Strip diacritics and normalize for comparison."""
    if not text:
        return ""
    # Remove tashkeel (diacritics)
    text = re.sub(r'[ؐ-ًؚ-ٰٟ]', '', text)
    # Normalize alef forms → plain alef
    text = re.sub(r'[آأإٱ]', 'ا', text)
    # Normalize teh marbuta → heh
    text = text.replace('ة', 'ه')
    # Normalize alef maqsura → yeh
    text = text.replace('ى', 'ي')
    # Remove tatweel
    text = text.replace('ـ', '')
    return text.strip()

def fetch_surah(surah_id):
    url = API_BASE.format(surah_id)
    req = urllib.request.Request(url, headers={"User-Agent": "QuranApp-Verify/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
        if data.get("status") != "OK":
            return None, f"API status: {data.get('status')}"
        ayahs = data["data"]["ayahs"]
        return {a["numberInSurah"]: a["text"] for a in ayahs}, None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, str(e)

def load_local(surah_id):
    path = os.path.join(PUBLIC_DATA, f"surah_{surah_id}.json")
    if not os.path.exists(path):
        return None, f"File not found: {path}"
    with open(path, encoding="utf-8") as f:
        return json.load(f), None

def check_arabic(surah_id, local_verses, api_verses, use_color):
    issues = []
    for v in local_verses:
        vid      = v.get("id")
        ref      = v.get("ref", f"{surah_id}:{vid}")
        local_ar = v.get("arabic", "").strip()
        api_ar   = api_verses.get(vid, "").strip()

        if not api_ar:
            issues.append((ref, "API_VERSE_MISSING", f"Verse {vid} not returned by API"))
            continue

        if not local_ar:
            issues.append((ref, "ARABIC_EMPTY", "Arabic field is empty in our data"))
            continue

        local_norm = normalize_arabic(local_ar)
        api_norm   = normalize_arabic(api_ar)

        if local_norm != api_norm:
            # Find first differing character
            diff_pos = next((i for i, (a, b) in enumerate(zip(local_norm, api_norm)) if a != b),
                            min(len(local_norm), len(api_norm)))
            context  = local_norm[max(0, diff_pos-5):diff_pos+10]
            issues.append((ref, "ARABIC_MISMATCH",
                f"Differs from Uthmani text at position ~{diff_pos}. "
                f"Local:  '{local_ar[:60]}'\n"
                f"{'':>14}API:    '{api_ar[:60]}'"))

    return issues

def check_transliteration(surah_id, local_verses):
    issues = []
    for v in local_verses:
        ref    = v.get("ref", f"{surah_id}:{v.get('id')}")
        translit = v.get("transliteration", "")
        arabic   = v.get("arabic", "")

        if not translit or not translit.strip():
            issues.append((ref, "TRANSLIT_EMPTY", "Transliteration is empty"))
            continue

        if ARABIC_RE.search(translit):
            issues.append((ref, "TRANSLIT_HAS_ARABIC",
                f"Contains Arabic characters — possible field swap: '{translit[:80]}'"))

        if arabic:
            ar_words = len(arabic.split())
            tr_words = len(translit.split())
            if tr_words < ar_words * 0.4:
                issues.append((ref, "TRANSLIT_TOO_SHORT",
                    f"Only {tr_words} words for {ar_words} Arabic words — may be truncated"))

        if re.search(r'\d{3,}', translit):
            issues.append((ref, "TRANSLIT_HAS_NUMBERS",
                f"Contains long number sequence — possible corruption: '{translit[:80]}'"))

    return issues

def check_translation(surah_id, local_verses):
    issues = []
    seen   = {}

    for v in local_verses:
        ref   = v.get("ref", f"{surah_id}:{v.get('id')}")
        trans = v.get("translation", "")

        if not trans or not trans.strip():
            issues.append((ref, "TRANS_EMPTY", "Translation is empty"))
            continue

        trans_stripped = trans.strip()

        if ARABIC_RE.search(trans_stripped):
            issues.append((ref, "TRANS_HAS_ARABIC",
                f"Contains Arabic characters — possible field swap: '{trans_stripped[:80]}'"))

        if len(trans_stripped) < 5:
            issues.append((ref, "TRANS_TOO_SHORT",
                f"Only {len(trans_stripped)} chars: '{trans_stripped}'"))

        # Detect book index contamination (A, B, C, ... pattern)
        if re.search(r'[A-Z],\s*[A-Z],\s*[A-Z]', trans_stripped):
            issues.append((ref, "TRANS_HAS_INDEX",
                f"Looks like book index leaked into translation: '{trans_stripped[:80]}'"))

        # Detect duplicate translations
        key = trans_stripped[:80]
        if key in seen:
            issues.append((ref, "TRANS_DUPLICATE",
                f"Same translation as {seen[key]} — possible copy error"))
        else:
            seen[key] = ref

        if re.search(r'\d{4,}', trans_stripped):
            issues.append((ref, "TRANS_HAS_LONG_NUMBER",
                f"Contains long number — possible corruption: '{trans_stripped[:80]}'"))

    return issues

def main():
    ap = argparse.ArgumentParser(description="Verify Arabic, transliteration and translation quality")
    ap.add_argument("--surah", type=int, nargs="+", metavar="N")
    ap.add_argument("--arabic-only", action="store_true", help="Skip heuristic checks")
    ap.add_argument("--no-color", action="store_true")
    args = ap.parse_args()

    surahs    = args.surah or list(range(1, 115))
    use_color = not args.no_color and sys.stdout.isatty()

    print("=" * 65)
    print("  Qur'aan App — Arabic / Transliteration / Translation Verify")
    print("=" * 65)
    print(f"  Checking {len(surahs)} surah(s) ...\n")

    all_issues     = []   # (surah_id, ref, code, msg)
    arabic_ok      = 0
    arabic_fail    = 0
    fetch_errors   = []

    for i, sid in enumerate(surahs):
        print(f"  [{i+1:>3}/{len(surahs)}] Surah {sid:>3} ...", end="  ", flush=True)

        local_verses, err = load_local(sid)
        if err:
            print(col(f"SKIP — {err}", RED, use_color))
            fetch_errors.append((sid, err))
            continue

        # ── Arabic: fetch from API ────────────────────────────────────────────
        api_verses, api_err = fetch_surah(sid)
        if api_err:
            print(col(f"API ERROR — {api_err}", RED, use_color))
            fetch_errors.append((sid, api_err))
            time.sleep(1)
            continue

        ar_issues = check_arabic(sid, local_verses, api_verses, use_color)

        if not args.arabic_only:
            tr_issues = check_transliteration(sid, local_verses)
            tn_issues = check_translation(sid, local_verses)
        else:
            tr_issues = []
            tn_issues = []

        surah_issues = ar_issues + tr_issues + tn_issues

        if surah_issues:
            ar_fail = len([x for x in surah_issues if 'ARABIC' in x[1]])
            arabic_fail += ar_fail
            arabic_ok   += len(local_verses) - ar_fail
            flag = col(f"{len(surah_issues)} issue(s)", YELLOW, use_color)
            print(flag)
            for ref, code, msg in surah_issues:
                lines = msg.split('\n')
                print(f"    {col(ref, CYAN, use_color)}  {code}")
                for line in lines:
                    print(f"      {line}")
            all_issues.extend((sid, ref, code, msg) for ref, code, msg in surah_issues)
        else:
            arabic_ok += len(local_verses)
            print(col("OK", GREEN, use_color))

        # Be polite to the API
        time.sleep(0.15)

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    print("=" * 65)
    print("  SUMMARY")
    print("=" * 65)
    print(f"  Surahs checked : {len(surahs)}")
    print(f"  Total issues   : {len(all_issues)}")
    print()

    if fetch_errors:
        print(col(f"  Fetch errors ({len(fetch_errors)}):", RED, use_color))
        for sid, err in fetch_errors:
            print(f"    Surah {sid}: {err}")
        print()

    by_code = defaultdict(list)
    for sid, ref, code, msg in all_issues:
        by_code[code].append((sid, ref, msg))

    if not by_code:
        print(col("  All checks passed!", GREEN, use_color))
    else:
        for code, items in sorted(by_code.items(), key=lambda x: -len(x[1])):
            print(f"  {code:<35} {len(items):>4}x")

    if all_issues:
        print()
        print("-" * 65)
        print("  ARABIC MISMATCHES (need manual fix):")
        print("-" * 65)
        arabic_mis = [(sid, ref, msg) for sid, ref, code, msg in all_issues if code == "ARABIC_MISMATCH"]
        if arabic_mis:
            for sid, ref, msg in arabic_mis:
                print(f"  {ref}")
                for line in msg.split('\n'):
                    print(f"    {line}")
        else:
            print(col("  None — all Arabic matches Uthmani text!", GREEN, use_color))

    print()

if __name__ == "__main__":
    main()
