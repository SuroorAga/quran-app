import pdfplumber

pdf_path = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Check pages 6-10 (surah 1 & 2 start) for font info
    for page_idx in range(5, 11):
        page = pdf.pages[page_idx]
        print(f"\n{'='*60}")
        print(f"PAGE {page_idx+1}")
        print('='*60)
        
        words = page.extract_words(extra_attrs=["fontname", "size"])
        for w in words[:60]:
            font = w.get('fontname', '')
            size = w.get('size', '')
            text = w.get('text', '')
            # Flag bold fonts
            is_bold = 'Bold' in font or 'bold' in font or 'BD' in font or '-B' in font
            marker = " <<BOLD>>" if is_bold else ""
            print(f"  [{font:30s}] [{size:5.1f}] {text}{marker}")
