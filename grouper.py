#!/usr/bin/env python3
import os
import sys
from collections import defaultdict

def get_part_name(file_path):
    """Extract part name from file path by removing extension"""
    file_name = os.path.basename(file_path)
    part_name = os.path.splitext(file_name)[0]
    return part_name

def group_files_by_part():
    """Group CAD files by part name"""

    # Read all the files from find command
    base_path = "/mnt/ripper_fr"

    # Find all relevant files
    import subprocess
    cmd = ["find", base_path, "-type", "f", "(", "-iname", "*.sldprt", "-o", "-iname", "*.slddrw", "-o", "-iname", "*.pdf", ")", "!", "-path", "*/IPTAL/*"]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print("Error running find command")
        return

    files = result.stdout.strip().split('\n')
    files = [f for f in files if f.strip()]  # Remove empty lines

    # Group files by part name
    parts = defaultdict(lambda: {'sldprt': [], 'slddrw': [], 'pdf': []})

    for file_path in files:
        if not file_path.strip():
            continue

        file_name = os.path.basename(file_path)
        part_name = os.path.splitext(file_name)[0]
        extension = os.path.splitext(file_name)[1].lower()

        if extension == '.sldprt':
            parts[part_name]['sldprt'].append(file_path)
        elif extension == '.slddrw':
            parts[part_name]['slddrw'].append(file_path)
        elif extension == '.pdf':
            parts[part_name]['pdf'].append(file_path)

    return parts

def write_grouped_report():
    """Write the grouped parts report to file"""
    parts = group_files_by_part()

    if not parts:
        print("No parts found")
        return

    output_file = "ripper_fr_parca_listesi.txt"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("=== RIPPER_FR PARÇA LİSTESİ VE DOSYA GRUPLANDıRMASı ===\n")
        f.write("Oluşturulma Tarihi: " + str(__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')) + "\n")
        f.write("SMB Paylaşım: //192.168.1.86/mzk makineler/KAPI_EBATLAMA_MAKINELERI/RIPPER_SERI_MAKINELER/RIPPER_FR\n")
        f.write("IPTAL klasörleri hariç tutulmuştur.\n\n")

        f.write(f"=== ÖZET ===\n")
        f.write(f"Toplam Parça Sayısı: {len(parts)}\n")

        # Count totals
        total_sldprt = sum(len(part['sldprt']) for part in parts.values())
        total_slddrw = sum(len(part['slddrw']) for part in parts.values())
        total_pdf = sum(len(part['pdf']) for part in parts.values())

        f.write(f"Toplam SLDPRT Dosyası: {total_sldprt}\n")
        f.write(f"Toplam SLDDRW Dosyası: {total_slddrw}\n")
        f.write(f"Toplam PDF Dosyası: {total_pdf}\n")
        f.write(f"Toplam Dosya: {total_sldprt + total_slddrw + total_pdf}\n\n")

        f.write("=== PARÇA BAZLI GRUPLAMA ===\n\n")

        # Sort parts alphabetically
        for part_name in sorted(parts.keys()):
            part_data = parts[part_name]

            f.write(f"📦 PARÇA: {part_name}\n")

            # Write SLDPRT files
            if part_data['sldprt']:
                f.write(f"  🔧 3D Çizim Dosyaları ({len(part_data['sldprt'])} adet):\n")
                for sldprt in sorted(part_data['sldprt']):
                    f.write(f"    - {sldprt}\n")

            # Write SLDDRW files
            if part_data['slddrw']:
                f.write(f"  📐 Drawing Dosyaları ({len(part_data['slddrw'])} adet):\n")
                for slddrw in sorted(part_data['slddrw']):
                    f.write(f"    - {slddrw}\n")

            # Write PDF files
            if part_data['pdf']:
                f.write(f"  📄 Teknik Resim Dosyaları ({len(part_data['pdf'])} adet):\n")
                for pdf in sorted(part_data['pdf']):
                    f.write(f"    - {pdf}\n")

            # Status information
            has_3d = bool(part_data['sldprt'])
            has_drawing = bool(part_data['slddrw'])
            has_pdf = bool(part_data['pdf'])

            f.write(f"  📊 Durum: ")
            status = []
            if has_3d:
                status.append("3D Çizim ✓")
            else:
                status.append("3D Çizim ✗")

            if has_drawing:
                status.append("Drawing Dosyası ✓")
            else:
                status.append("Drawing Dosyası ✗")

            if has_pdf:
                status.append("Teknik Resim Dosyası ✓")
            else:
                status.append("Teknik Resim Dosyası ✗")

            f.write(" | ".join(status))
            f.write("\n")
            f.write("-" * 80 + "\n\n")

        f.write("=== EKSİK DOSYA ANALİZİ ===\n\n")

        # Parts with missing drawings
        missing_drawings = [name for name, data in parts.items() if data['sldprt'] and not data['slddrw']]
        if missing_drawings:
            f.write(f"🚨 Drawing Dosyası Eksik Parçalar ({len(missing_drawings)} adet):\n")
            for part in sorted(missing_drawings):
                f.write(f"  - {part}\n")
            f.write("\n")

        # Parts with missing PDFs
        missing_pdfs = [name for name, data in parts.items() if data['sldprt'] and not data['pdf']]
        if missing_pdfs:
            f.write(f"📋 Teknik Resim Dosyası Eksik Parçalar ({len(missing_pdfs)} adet):\n")
            for part in sorted(missing_pdfs):
                f.write(f"  - {part}\n")
            f.write("\n")

        # Only drawing files (no 3D)
        only_drawings = [name for name, data in parts.items() if not data['sldprt'] and (data['slddrw'] or data['pdf'])]
        if only_drawings:
            f.write(f"⚠️  Sadece Drawing/Teknik Resim Dosyası Olan Parçalar ({len(only_drawings)} adet):\n")
            for part in sorted(only_drawings):
                f.write(f"  - {part}\n")

    print(f"Rapor başarıyla '{output_file}' dosyasına yazıldı.")
    print(f"Toplam {len(parts)} parça gruplanlandı.")

if __name__ == "__main__":
    write_grouped_report()