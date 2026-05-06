import pdfplumber

# Check the last few PDFs to see what's on the pages
for num in ['10', '11', '12']:
    path = f"/tmp/qur_part2/QuraanicStudies_PART_II_{num}.pdf"
    print(f"\n=== FILE {num} ===")
    with pdfplumber.open(path) as pdf:
        for i in [0, 1, 2]:
            text = pdf.pages[i].extract_text()
            print(f"-- Page {i+1} --")
            print(text[:800] if text else '(no text)')
