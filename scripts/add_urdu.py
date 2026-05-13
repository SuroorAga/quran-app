#!/usr/bin/env python3
"""
add_urdu.py — Fetch Urdu translations from alquran.cloud and add to all surah JSON files.
Uses Fateh Muhammad Jalandhari's translation (ur.jalandhry) — the most widely used Urdu Quran.

Usage:
    python3 scripts/add_urdu.py
    python3 scripts/add_urdu.py --surah 1 2   # specific surahs only
"""

import json, os, sys, time, argparse, urllib.request, urllib.error

ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "public", "data")
SRC_DIR    = os.path.join(ROOT, "src", "data")
API        = "https://api.alquran.cloud/v1/surah/{}/ur.jalandhry"

def fetch_urdu(surah_id, retries=3):
    url = API.format(surah_id)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "QuranApp/1.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read().decode())
            if data.get("status") != "OK":
                raise ValueError(f"API status: {data.get('status')}")
            ayahs = data["data"]["ayahs"]
            return {a["numberInSurah"]: a["text"] for a in ayahs}
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(2)

def process_surah(surah_id):
    pub_path = os.path.join(PUBLIC_DIR, f"surah_{surah_id}.json")
    src_path = os.path.join(SRC_DIR,    f"surah_{surah_id}.json")

    if not os.path.exists(pub_path):
        print(f"  SKIP — {pub_path} not found")
        return False

    with open(pub_path, encoding="utf-8") as f:
        verses = json.load(f)

    urdu_map = fetch_urdu(surah_id)

    updated = 0
    for v in verses:
        vid = v.get("id")
        if vid in urdu_map:
            v["urdu"] = urdu_map[vid]
            updated += 1
        elif "urdu" not in v:
            v["urdu"] = ""

    # Save to public/data
    with open(pub_path, "w", encoding="utf-8") as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)

    # Sync to src/data
    if os.path.exists(SRC_DIR):
        with open(src_path, "w", encoding="utf-8") as f:
            json.dump(verses, f, ensure_ascii=False, indent=2)

    return updated

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--surah", type=int, nargs="+")
    args = ap.parse_args()

    surahs = args.surah or list(range(1, 115))

    print("=" * 55)
    print("  Adding Urdu translations (Jalandhari)")
    print("=" * 55)

    ok = 0
    for i, sid in enumerate(surahs):
        print(f"  [{i+1:>3}/{len(surahs)}] Surah {sid:>3} ...", end="  ", flush=True)
        try:
            updated = process_surah(sid)
            print(f"{updated} verses ✓")
            ok += 1
        except Exception as e:
            print(f"ERROR — {e}")
        time.sleep(0.2)

    print()
    print(f"Done: {ok}/{len(surahs)} surahs updated.")

if __name__ == "__main__":
    main()
