import pdfplumber

pdf_path = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    # Scan pages 50-100 to find surah 3
    for i in range(50, 120):
        text = pdf.pages[i].extract_text()
        if text and ('Al-Imran' in text or 'IMRAN' in text or '3:1' in text or 'Imran' in text):
            print(f"\n===== PAGE {i+1} =====")
            print(text[:2000])
            break
    else:
        # Just print pages 50-55 to see structure
        for i in range(50, 56):
            text = pdf.pages[i].extract_text()
            print(f"\n===== PAGE {i+1} =====")
            print(text[:1000] if text else '(no text)')
