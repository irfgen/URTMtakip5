#!/usr/bin/env python3
"""
CAD Import Client - Ana Giriş Noktası
ÜRTM Takip Sistemi için SolidWorks CAD dosyalarını import eden desktop client
"""

import sys
import os
import logging
import tkinter as tk
from tkinter import messagebox, ttk
import threading
import platform
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.logger import setup_logger
from utils.config_manager import ConfigManager
from core.server_client import ServerClient
from gui.main_window import MainWindow

class CADImportApp:
    """Ana uygulama sınıfı"""
    
    def __init__(self):
        self.config = None
        self.logger = None
        self.server_client = None
        self.main_window = None
        
    def initialize(self):
        """Uygulamayı başlat"""
        try:
            # Konfigürasyonu yükle
            self.config = ConfigManager()
            
            # Logger'ı kur
            self.logger = setup_logger(self.config)
            self.logger.info("CAD Import Client başlatılıyor...")
            
            # Sistem bilgilerini logla
            self.log_system_info()
            
            # SolidWorks kontrolü
            if not self.check_solidworks():
                self.logger.warning("SolidWorks bulunamadı veya erişilemiyor")
            
            # Server client'ını başlat
            self.server_client = ServerClient(self.config, self.logger)
            
            # Ana pencereyi oluştur
            self.create_main_window()
            
            return True
            
        except Exception as e:
            error_msg = f"Uygulama başlatılırken hata oluştu: {str(e)}"
            if self.logger:
                self.logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            
            # Hata mesajını göster
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("Başlatma Hatası", error_msg)
            return False
    
    def log_system_info(self):
        """Sistem bilgilerini logla"""
        self.logger.info(f"Platform: {platform.platform()}")
        self.logger.info(f"Python Version: {platform.python_version()}")
        self.logger.info(f"Architecture: {platform.architecture()}")
        self.logger.info(f"Machine: {platform.machine()}")
        self.logger.info(f"Processor: {platform.processor()}")
        
    def check_solidworks(self):
        """SolidWorks'ün yüklü olup olmadığını kontrol et"""
        try:
            import win32com.client
            sw_app = win32com.client.Dispatch("SldWorks.Application")
            sw_version = sw_app.GetVersion()
            self.logger.info(f"SolidWorks bulundu: Version {sw_version}")
            sw_app = None  # COM object'i serbest bırak
            return True
        except Exception as e:
            self.logger.warning(f"SolidWorks kontrolü başarısız: {str(e)}")
            return False
    
    def create_main_window(self):
        """Ana pencereyi oluştur"""
        self.main_window = MainWindow(
            config=self.config,
            logger=self.logger,
            server_client=self.server_client
        )
        
    def run(self):
        """Uygulamayı çalıştır"""
        if not self.initialize():
            return 1
            
        try:
            self.logger.info("Ana pencere açılıyor...")
            self.main_window.run()
            
        except KeyboardInterrupt:
            self.logger.info("Kullanıcı tarafından durduruldu")
            
        except Exception as e:
            self.logger.error(f"Çalışma zamanı hatası: {str(e)}", exc_info=True)
            messagebox.showerror("Çalışma Hatası", f"Beklenmeyen hata: {str(e)}")
            return 1
            
        finally:
            self.cleanup()
            
        return 0
    
    def cleanup(self):
        """Temizlik işlemleri"""
        try:
            if self.server_client:
                self.server_client.disconnect()
                
            if self.logger:
                self.logger.info("CAD Import Client kapatılıyor...")
                
        except Exception as e:
            print(f"Temizlik hatası: {str(e)}")

def main():
    """Ana fonksiyon"""
    app = CADImportApp()
    return app.run()

if __name__ == "__main__":
    sys.exit(main())