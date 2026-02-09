#!/usr/bin/env python3
"""
STEP BOM Analyzer - Ana Program

STEP dosyalarından BOM çıkartan, 3D render ve screenshot alan Python aracı.
Mevcut CAD Import API sistemi ile entegre çalışır.
"""

import sys
import os
import traceback
from pathlib import Path

# Sistem bilgilerini al
import platform
import psutil

# Logging sistemi
from utils.logger import STEPAnalyzerLogger

# Config manager
from utils.config_manager import ConfigManager

# GUI
from gui.main_window import STEPAnalyzerMainWindow


class STEPBOMAnalyzer:
    """STEP BOM Analyzer Ana Sınıfı"""
    
    def __init__(self):
        self.logger = None
        self.config = None
        self.gui = None
        
    def initialize(self):
        """Uygulamayı başlat"""
        try:
            # Logger başlat
            self.logger = STEPAnalyzerLogger()
            self.logger.info("STEP BOM Analyzer başlatılıyor...")
            
            # Sistem bilgilerini logla
            self._log_system_info()
            
            # Config manager
            self.config = ConfigManager(logger=self.logger)
            
            # GUI başlat
            self.logger.info("Ana pencere açılıyor...")
            self.gui = STEPAnalyzerMainWindow(
                config=self.config, 
                logger=self.logger
            )
            
            return True
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Initialization hatası: {str(e)}")
                self.logger.error(traceback.format_exc())
            else:
                print(f"Critical initialization error: {e}")
            return False
    
    def run(self):
        """Uygulamayı çalıştır"""
        if not self.initialize():
            return False
            
        try:
            self.logger.info("STEP BOM Analyzer GUI başlatılıyor...")
            self.gui.run()
            return True
            
        except KeyboardInterrupt:
            self.logger.info("Kullanıcı tarafından durduruldu")
            return True
            
        except Exception as e:
            self.logger.error(f"Runtime hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            return False
            
        finally:
            self._cleanup()
    
    def _log_system_info(self):
        """Sistem bilgilerini logla"""
        try:
            self.logger.info(f"Platform: {platform.system()} {platform.release()}")
            self.logger.info(f"Python Version: {platform.python_version()}")
            self.logger.info(f"Architecture: {platform.architecture()}")
            self.logger.info(f"Machine: {platform.machine()}")
            self.logger.info(f"Processor: {platform.processor()}")
            
            # RAM bilgisi
            memory = psutil.virtual_memory()
            self.logger.info(f"Total RAM: {memory.total // (1024**3)} GB")
            self.logger.info(f"Available RAM: {memory.available // (1024**3)} GB")
            
        except Exception as e:
            self.logger.warning(f"Sistem bilgisi alınamadı: {e}")
    
    def _cleanup(self):
        """Temizlik işlemleri"""
        if self.logger:
            self.logger.info("STEP BOM Analyzer kapanıyor...")
        
        if self.gui:
            self.gui.cleanup()


def main():
    """Ana fonksiyon"""
    app = STEPBOMAnalyzer()
    
    try:
        success = app.run()
        sys.exit(0 if success else 1)
        
    except Exception as e:
        print(f"Kritik hata: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()