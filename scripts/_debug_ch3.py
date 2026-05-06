import pdfplumber
from collections import defaultdict
import sys

pdf_path = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"

def is_bold(fontname):
    return 'Bold' in fontname or 'bold' in fontname or '-BD' in fontname

def classify_line(line_words):
    bold_count = sum(1 for w in line_words if is_bold(w.get('fontname', '')))
    sizes = [w.get('size', 0) for w in line_words]
    avg_size = sum(sizes) / len(sizes) if sizes else 0
    is_line_bold = bold_count > len(line_words) / 2
    return is_line_bold, avg_size

print("Opening PDF...", flush=True)
with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}", flush=True)
    
    # Scan for pages containing "3:1." or "3:2."
    ch3_page = None
    for i in range(0, 400):
        text = pdf.pages[i].extract_text() or ''
        if '3:1.' in text or '3:2.' in text:
            ch3_page = i
            print(f"Found 3:1/3:2 on page {i+1}", flush=True)
            break
    
    if ch3_page is None:
        print("Not found in first 400 pages")
        sys.exit(1)

    # Print word-level detail for 3 pages around Chapter 3 start
    for pg_idx in range(ch3_page - 1, ch3_page + 3):
        if pg_idx < 0:
            continue
        page = pdf.pages[pg_idx]
        words = page.extract_words(extra_attrs=["fontname", "size"])
        lines = defaultdict(list)
        for w in words:
            lines[round(w.get('top', 0))].append(w)

        print(f"\n{'='*70}", flush=True)
        print(f"PAGE {pg_idx+1}", flush=True)
        print('='*70, flush=True)
        for top in sorted(lines):
            lw = sorted(lines[top], key=lambda w: w.get('x0', 0))
            text = ' '.join(w.get('text','') for w in lw).strip()
            bold, size = classify_line(lw)
            b = 'B' if bold else ' '
            print(f"  [{b} {size:4.1f}pt] {text[:120]}", flush=True)
