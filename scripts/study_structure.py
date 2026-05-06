import pdfplumber

pdf_path = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
with pdfplumber.open(pdf_path) as pdf:
    # Print pages 6-12 in full, raw, no truncation
    for i in range(5, 13):
        text = pdf.pages[i].extract_text()
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print('='*60)
        print(text if text else '(no text)')
