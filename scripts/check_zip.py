import zipfile, os

path = '/Users/aneesajaveed/Documents/Quran-APP_Kiro/quran-app/QuraanicStudies_ModernTafsir_PART_II_split.zip'
print(f"File exists: {os.path.exists(path)}")
print(f"File size: {os.path.getsize(path) / 1024 / 1024:.1f} MB")

try:
    with zipfile.ZipFile(path) as z:
        files = z.namelist()
        print(f"Files inside: {len(files)}")
        for f in files:
            info = z.getinfo(f)
            print(f"  {f} ({info.file_size / 1024 / 1024:.1f} MB)")
except Exception as e:
    print(f"Error: {e}")
