import pdfplumber

pdf_path = "/tmp/qur_pdf/QUR'AANIC STUDIES - A Modern Tafsir PART I.pdf"
with pdfplumber.open(pdf_path) as pdf:
    # Look at pages around surah 1 and 2 to understand the exact format
    # Then look for surah 3 start
    for i in range(5, 20):
        text = pdf.pages[i].extract_text()
        print(f"\n===== PAGE {i+1} =====")
        print(text[:2000] if text else '(no text)')
