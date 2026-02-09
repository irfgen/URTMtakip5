#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Windows spesifik yardımcı fonksiyonlar
"""

import os
import sys
import subprocess
import winreg
from pathlib import Path
import ctypes
from ctypes import wintypes

class WindowsUtils:
    @staticmethod
    def hide_console():
        """Console penceresini gizle"""
        try:
            ctypes.windll.kernel32.FreeConsole()
            return True
        except:
            return False

    @staticmethod
    def get_mapped_drives():
        """Eşlenmiş network drive'ları al"""
        drives = []
        try:
            # A-Z harfleri için kontrol et
            for drive_letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
                drive_path = f"{drive_letter}:\\"
                drive_type = ctypes.windll.kernel32.GetDriveTypeW(drive_path)

                # Drive type 4 = network drive
                if drive_type == 4:
                    # Network path'i al
                    buffer = ctypes.create_unicode_buffer(260)
                    result = ctypes.windll.mpr.WNetGetConnectionW(
                        drive_letter + ":", buffer, ctypes.byref(ctypes.wintypes.DWORD(260))
                    )
                    if result == 0:  # Success
                        drives.append({
                            'letter': drive_letter,
                            'path': drive_path,
                            'network_path': buffer.value,
                            'display_name': f"{drive_letter}: ({buffer.value})"
                        })
        except Exception as e:
            print(f"Network drive kontrolü hatası: {e}")

        return drives

    @staticmethod
    def get_common_cad_directories():
        """Yaygın CAD dizinlerini bul"""
        common_dirs = []

        # Kullanıcı dokümanları
        try:
            documents = Path.home() / "Documents"
            if documents.exists():
                # SolidWorks varsayılan dizinleri
                solidworks_dirs = [
                    documents / "SolidWorks Projects",
                    documents / "CAD Files",
                    documents / "3D Models",
                    documents / "Engineering"
                ]

                for directory in solidworks_dirs:
                    if directory.exists():
                        common_dirs.append({
                            'path': str(directory),
                            'type': 'local',
                            'description': f"Yerel: {directory.name}"
                        })
        except:
            pass

        # Program Files dizinlerinden örnekler
        try:
            program_files = ["C:\\Program Files", "C:\\Program Files (x86)"]
            for pf in program_files:
                solidworks_path = Path(pf) / "SOLIDWORKS Corp"
                if solidworks_path.exists():
                    common_dirs.append({
                        'path': str(solidworks_path),
                        'type': 'program',
                        'description': f"SolidWorks: {solidworks_path}"
                    })
        except:
            pass

        return common_dirs

    @staticmethod
    def is_path_accessible(path):
        """Dizine erişim kontrolü"""
        try:
            # Windows spesifik erişim kontrolü
            path_obj = Path(path)
            if not path_obj.exists():
                return False, "Dizin bulunamadı"

            if not path_obj.is_dir():
                return False, "Belirtilen yol bir dizin değil"

            # Okuma izni kontrolü
            try:
                list(path_obj.iterdir())
                return True, "Erişilebilir"
            except PermissionError:
                return False, "Erişim izni yok"
            except Exception as e:
                return False, f"Erişim hatası: {str(e)}"

        except Exception as e:
            return False, f"Kontrol hatası: {str(e)}"

    @staticmethod
    def normalize_windows_path(path):
        """Windows path'i normalize et"""
        try:
            # UNC path kontrolü
            if path.startswith('\\\\'):
                return path

            # Drive letter kontrolü
            if len(path) >= 2 and path[1] == ':':
                return path

            # Relative path'i absolute'a çevir
            return os.path.abspath(path)
        except:
            return path

    @staticmethod
    def get_file_system_info(path):
        """Dosya sistemi bilgilerini al"""
        try:
            path_obj = Path(path)
            if not path_obj.exists():
                return None

            statvfs = os.statvfs(path) if hasattr(os, 'statvfs') else None

            # Windows için disk alanı bilgisi
            if sys.platform == 'win32':
                free_bytes = ctypes.c_ulonglong(0)
                total_bytes = ctypes.c_ulonglong(0)
                ctypes.windll.kernel32.GetDiskFreeSpaceExW(
                    ctypes.c_wchar_p(str(path_obj)),
                    ctypes.pointer(free_bytes),
                    ctypes.pointer(total_bytes),
                    None
                )

                return {
                    'total_space': total_bytes.value,
                    'free_space': free_bytes.value,
                    'used_space': total_bytes.value - free_bytes.value,
                    'total_gb': round(total_bytes.value / (1024**3), 2),
                    'free_gb': round(free_bytes.value / (1024**3), 2),
                    'used_gb': round((total_bytes.value - free_bytes.value) / (1024**3), 2)
                }
        except Exception as e:
            print(f"Disk bilgisi alınamadı: {e}")
            return None

    @staticmethod
    def check_required_software():
        """Gerekli yazılımları kontrol et"""
        software_status = {
            'python': {
                'installed': True,
                'version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                'path': sys.executable
            }
        }

        # SolidWorks kontrolü
        try:
            # Registry'den SolidWorks kontrolü
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                               r"SOFTWARE\SolidWorks\Applications\SolidWorks") as key:
                sw_path = winreg.QueryValueEx(key, "Location")[0]
                software_status['solidworks'] = {
                    'installed': True,
                    'path': sw_path,
                    'version': 'Yüklü (Detay registry\'den alınamadı)'
                }
        except:
            software_status['solidworks'] = {
                'installed': False,
                'path': None,
                'version': None
            }

        return software_status

    @staticmethod
    def get_windows_version():
        """Windows sürüm bilgisi"""
        try:
            import platform
            return {
                'system': platform.system(),
                'release': platform.release(),
                'version': platform.version(),
                'machine': platform.machine(),
                'processor': platform.processor()
            }
        except:
            return {'system': 'Windows', 'release': 'Bilinmiyor'}

    @staticmethod
    def create_desktop_shortcut(name, target, icon_path=None, description=None):
        """Desktop kısayolu oluştur"""
        try:
            import win32com.client

            desktop = Path.home() / "Desktop"
            shortcut_path = desktop / f"{name}.lnk"

            shell = win32com.client.Dispatch("WScript.Shell")
            shortcut = shell.CreateShortCut(str(shortcut_path))
            shortcut.Targetpath = target
            if icon_path:
                shortcut.IconLocation = icon_path
            if description:
                shortcut.Description = description
            shortcut.save()

            return True, str(shortcut_path)
        except Exception as e:
            return False, f"Kısayol oluşturma hatası: {str(e)}"

if __name__ == "__main__":
    # Test fonksiyonları
    utils = WindowsUtils()

    print("=== Windows Utils Test ===")
    print(f"Windows Sürümü: {utils.get_windows_version()}")
    print(f"Eşlenmiş Sürücüler: {utils.get_mapped_drives()}")
    print(f"CAD Dizinleri: {utils.get_common_cad_directories()}")
    print(f"Yazılım Durumu: {utils.check_required_software()}")