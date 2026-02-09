#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SolidWorks COM Automation Wrapper

Bu script SolidWorks uygulamasını COM üzerinden kontrol ederek
3D model dosyalarından screenshot alır.

Kullanım:
    python solidworks_wrapper.py <input_file_path> <output_image_path>

Örnek:
    python solidworks_wrapper.py "C:\\Models\\part.sldprt" "C:\\Screenshots\\part.png"

Gereksinimler:
    - Windows işletim sistemi
    - SolidWorks kurulu olmalı
    - pywin32 kütüphanesi (pip install pywin32)
"""

import sys
import os
import time
import json
import logging
from pathlib import Path
import win32com.client as win32
import pythoncom


class SolidWorksWrapper:
    """SolidWorks COM automation wrapper class"""
    
    def __init__(self, timeout=30, visible=False, log_level='INFO'):
        """
        SolidWorks wrapper'ını başlat
        
        Args:
            timeout (int): İşlem timeout süresi (saniye)
            visible (bool): SolidWorks UI'ı görünür olsun mu
            log_level (str): Log seviyesi
        """
        self.timeout = timeout
        self.visible = visible
        self.sw_app = None
        self.active_doc = None
        
        # Logger setup
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
    def connect_to_solidworks(self):
        """
        SolidWorks'e bağlan veya başlat
        
        Returns:
            bool: Başarılı olursa True
        """
        try:
            self.logger.info("SolidWorks'e bağlanmaya çalışılıyor...")
            
            # COM initialize
            pythoncom.CoInitialize()
            
            try:
                # Mevcut SolidWorks instance'ına bağlanmaya çalış
                self.sw_app = win32.GetActiveObject("SldWorks.Application")
                self.logger.info("Mevcut SolidWorks instance'ına bağlandı")
            except:
                # Yeni SolidWorks instance başlat
                self.logger.info("Yeni SolidWorks instance başlatılıyor...")
                self.sw_app = win32.Dispatch("SldWorks.Application")
                
            if not self.sw_app:
                raise Exception("SolidWorks başlatılamadı")
                
            # SolidWorks görünürlük ayarı
            self.sw_app.Visible = self.visible
            
            self.logger.info(f"SolidWorks başarıyla başlatıldı (Görünür: {self.visible})")
            return True
            
        except Exception as e:
            self.logger.error(f"SolidWorks bağlantı hatası: {str(e)}")
            return False
    
    def open_document(self, file_path):
        """
        SolidWorks dosyasını aç
        
        Args:
            file_path (str): Açılacak dosya yolu
            
        Returns:
            bool: Başarılı olursa True
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Dosya bulunamadı: {file_path}")
                
            self.logger.info(f"Dosya açılıyor: {file_path}")
            
            # Dosya türünü belirle
            ext = Path(file_path).suffix.lower()
            doc_type_map = {
                '.sldprt': 1,  # swDocPART
                '.sldasm': 2,  # swDocASSEMBLY
                '.slddrw': 3,  # swDocDRAWING
                '.sldpart': 1  # Alternative part extension
            }
            
            if ext not in doc_type_map:
                raise ValueError(f"Desteklenmeyen dosya türü: {ext}")
                
            doc_type = doc_type_map[ext]
            
            # Dosyayı aç
            errors = win32.Dispatch("SldWorks.SwConst").swFileLoadError_e
            warnings = win32.Dispatch("SldWorks.SwConst").swFileLoadWarning_e
            
            self.active_doc = self.sw_app.OpenDoc6(
                file_path,      # FileName
                doc_type,       # Type
                2,              # Options (swOpenDocOptions_Silent)
                "",             # Configuration
                errors,         # Errors
                warnings        # Warnings
            )
            
            if not self.active_doc:
                raise Exception("Dosya açılamadı - SolidWorks hatası")
                
            # Dosyanın aktif olmasını bekle
            time.sleep(1)
            
            self.logger.info("Dosya başarıyla açıldı")
            return True
            
        except Exception as e:
            self.logger.error(f"Dosya açma hatası: {str(e)}")
            return False
    
    def setup_view(self):
        """
        Görünüm ayarlarını optimize et
        
        Returns:
            bool: Başarılı olursa True
        """
        try:
            if not self.active_doc:
                raise Exception("Açık doküman bulunamadı")
                
            self.logger.info("Görünüm ayarları yapılandırılıyor...")
            
            # Model görünümü al
            model_view = self.active_doc.ActiveView
            if not model_view:
                raise Exception("Aktif görünüm bulunamadı")
            
            # Zoom to fit
            self.active_doc.ViewZoomtofit2()
            
            # Isometric görünüm
            model_view.FrameState = 2  # swWindowState_Maximize
            
            # Render kalitesini ayarla
            # swViewDisplayMode_ShadedWithEdges = 5
            model_view.DisplayMode = 5
            
            # Arka plan rengini beyaz yap
            # swViewColorBackground = 0
            self.sw_app.SetUserPreferenceIntegerValue(0, 16777215)  # Beyaz (RGB)
            
            # Anti-aliasing aç
            self.sw_app.SetUserPreferenceToggle(60, True)  # swUserPreferenceToggle_UseAntiAliasing
            
            # Ekstra bekleme (render için)
            time.sleep(2)
            
            self.logger.info("Görünüm ayarları tamamlandı")
            return True
            
        except Exception as e:
            self.logger.error(f"Görünüm ayarlama hatası: {str(e)}")
            return False
    
    def save_screenshot(self, output_path, width=800, height=600):
        """
        Aktif dokümanın screenshot'ını al
        
        Args:
            output_path (str): Çıktı dosyası yolu
            width (int): Görüntü genişliği
            height (int): Görüntü yüksekliği
            
        Returns:
            bool: Başarılı olursa True
        """
        try:
            if not self.active_doc:
                raise Exception("Açık doküman bulunamadı")
                
            self.logger.info(f"Screenshot alınıyor: {output_path}")
            
            # Çıktı dizinini oluştur
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Model görünümü al
            model_view = self.active_doc.ActiveView
            if not model_view:
                raise Exception("Aktif görünüm bulunamadı")
            
            # Screenshot al
            # swSaveImageResolution_High = 3
            success = self.active_doc.SaveAs4(
                output_path,    # FileName
                0,              # SaveVersion (latest)
                0,              # Options
                None,           # Errors
                None            # Warnings
            )
            
            # Alternatif method: Direct screenshot
            if not success:
                self.logger.warning("SaveAs4 başarısız, alternatif method deneniyor...")
                
                # FrameCapture kullan
                model_view.FrameCapture2(output_path, width, height)
                
                # Dosyanın oluştuğunu kontrol et
                success = os.path.exists(output_path)
            
            if success:
                self.logger.info("Screenshot başarıyla kaydedildi")
                return True
            else:
                raise Exception("Screenshot kaydetme başarısız")
                
        except Exception as e:
            self.logger.error(f"Screenshot hatası: {str(e)}")
            return False
    
    def close_document(self):
        """
        Aktif dokümanı kapat (kaydetmeden)
        
        Returns:
            bool: Başarılı olursa True
        """
        try:
            if self.active_doc:
                self.logger.info("Doküman kapatılıyor...")
                self.sw_app.CloseDoc(self.active_doc.GetTitle())
                self.active_doc = None
                self.logger.info("Doküman kapatıldı")
            return True
        except Exception as e:
            self.logger.error(f"Doküman kapatma hatası: {str(e)}")
            return False
    
    def disconnect(self):
        """
        SolidWorks bağlantısını kapat
        """
        try:
            # Aktif dokümanı kapat
            self.close_document()
            
            # SolidWorks'u kapat (sadece başlattığımız instance'ı)
            if self.sw_app and not self.visible:
                self.logger.info("SolidWorks kapatılıyor...")
                self.sw_app.ExitApp()
                
            # COM cleanup
            pythoncom.CoUninitialize()
            
            self.logger.info("SolidWorks bağlantısı kapatıldı")
            
        except Exception as e:
            self.logger.error(f"Disconnect hatası: {str(e)}")
    
    def process_file(self, input_file, output_file, width=800, height=600):
        """
        Tam işlem: dosya aç -> screenshot al -> kapat
        
        Args:
            input_file (str): Giriş dosyası
            output_file (str): Çıktı dosyası
            width (int): Görüntü genişliği
            height (int): Görüntü yüksekliği
            
        Returns:
            dict: İşlem sonucu
        """
        result = {
            'success': False,
            'message': '',
            'input_file': input_file,
            'output_file': output_file,
            'processing_time': 0
        }
        
        start_time = time.time()
        
        try:
            # SolidWorks'e bağlan
            if not self.connect_to_solidworks():
                raise Exception("SolidWorks bağlantısı kurulamadı")
            
            # Dosyayı aç
            if not self.open_document(input_file):
                raise Exception("Dosya açılamadı")
            
            # Görünüm ayarla
            if not self.setup_view():
                raise Exception("Görünüm ayarlanamadı")
            
            # Screenshot al
            if not self.save_screenshot(output_file, width, height):
                raise Exception("Screenshot alınamadı")
            
            result['success'] = True
            result['message'] = 'İşlem başarılı'
            
        except Exception as e:
            result['message'] = str(e)
            self.logger.error(f"İşlem hatası: {str(e)}")
            
        finally:
            # Cleanup
            result['processing_time'] = time.time() - start_time
            self.close_document()
            
        return result


def main():
    """Ana fonksiyon - komut satırı kullanımı"""
    if len(sys.argv) != 3:
        print("Kullanım: python solidworks_wrapper.py <input_file> <output_file>")
        print("Örnek: python solidworks_wrapper.py C:\\models\\part.sldprt C:\\screenshots\\part.png")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Environment variables'dan config al
    timeout = int(os.environ.get('SOLIDWORKS_TIMEOUT', 30))
    visible = os.environ.get('SOLIDWORKS_VISIBLE', 'false').lower() == 'true'
    log_level = os.environ.get('SOLIDWORKS_LOG_LEVEL', 'INFO')
    width = int(os.environ.get('SCREENSHOT_WIDTH', 800))
    height = int(os.environ.get('SCREENSHOT_HEIGHT', 600))
    
    # Wrapper oluştur
    wrapper = SolidWorksWrapper(
        timeout=timeout,
        visible=visible,
        log_level=log_level
    )
    
    try:
        # İşlemi gerçekleştir
        result = wrapper.process_file(input_file, output_file, width, height)
        
        # Sonucu yazdır (JSON formatında)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Exit code
        sys.exit(0 if result['success'] else 1)
        
    except KeyboardInterrupt:
        print("İşlem kullanıcı tarafından iptal edildi")
        sys.exit(2)
        
    except Exception as e:
        error_result = {
            'success': False,
            'message': f'Beklenmeyen hata: {str(e)}',
            'input_file': input_file,
            'output_file': output_file,
            'processing_time': 0
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)
        
    finally:
        # Her durumda cleanup
        try:
            wrapper.disconnect()
        except:
            pass


if __name__ == "__main__":
    main()