"""
SolidWorks COM Automation Modülü
"""

import win32com.client
import pythoncom
import time
import os
from pathlib import Path
from typing import Optional, Tuple
import threading
import tempfile

class SolidWorksAPI:
    """SolidWorks COM automation sınıfı"""
    
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.sw_app = None
        self.is_connected = False
        self._lock = threading.Lock()
        
    def connect(self) -> bool:
        """SolidWorks'e bağlan"""
        try:
            with self._lock:
                # COM'u başlat
                pythoncom.CoInitialize()
                
                # SolidWorks uygulamasını al
                self.logger.info("SolidWorks'e bağlanılıyor...")
                self.sw_app = win32com.client.Dispatch("SldWorks.Application")
                
                if self.sw_app is None:
                    raise Exception("SolidWorks başlatılamadı")
                
                # SolidWorks'ü görünmez yap (background mode)
                self.sw_app.Visible = False
                
                # Versiyon bilgisini al
                version = self.sw_app.GetVersion()
                self.logger.info(f"SolidWorks bağlantısı başarılı - Version: {version}")
                
                self.is_connected = True
                return True
                
        except Exception as e:
            self.logger.error(f"SolidWorks bağlantı hatası: {str(e)}")
            self.is_connected = False
            return False
    
    def disconnect(self):
        """SolidWorks bağlantısını kes"""
        try:
            with self._lock:
                if self.sw_app:
                    # Açık dokümanları kapat
                    self.close_all_documents()
                    
                    # SolidWorks'ü kapat (isteğe bağlı)
                    if self.config.getboolean('SOLIDWORKS', 'close_after_processing', True):
                        self.sw_app.ExitApp()
                    
                    self.sw_app = None
                    
                # COM'u temizle
                pythoncom.CoUninitialize()
                
                self.is_connected = False
                self.logger.info("SolidWorks bağlantısı kesildi")
                
        except Exception as e:
            self.logger.error(f"SolidWorks bağlantı kesme hatası: {str(e)}")
    
    def is_available(self) -> bool:
        """SolidWorks mevcut mu kontrol et"""
        try:
            if not self.is_connected or not self.sw_app:
                return False
            # Basit bir işlem yaparak canlılığı test et
            _ = self.sw_app.GetVersion()
            return True
        except:
            return False
    
    def open_document(self, file_path: Path) -> Optional[object]:
        """Dokuman aç"""
        try:
            if not self.is_available():
                self.logger.error("SolidWorks bağlantısı mevcut değil")
                return None
            
            file_str = str(file_path.resolve())
            self.logger.info(f"Dosya açılıyor: {file_str}")
            
            # Dosya tipini belirle
            ext = file_path.suffix.lower()
            if ext in ['.sldprt', '.sldpart']:
                doc_type = 1  # swDocPART
            elif ext == '.sldasm':
                doc_type = 2  # swDocASSEMBLY
            elif ext == '.slddrw':
                doc_type = 3  # swDocDRAWING
            else:
                raise ValueError(f"Desteklenmeyen dosya türü: {ext}")
            
            # Timeout ayarları
            timeout = self.config.getint('SOLIDWORKS', 'timeout_seconds', 120)
            
            # Dosyayı aç
            errors = 0
            warnings = 0
            doc = self.sw_app.OpenDoc6(
                file_str,           # FileName
                doc_type,           # Type
                1,                  # Options (swOpenDocOptions_Silent)
                "",                 # Configuration
                errors,             # Errors
                warnings            # Warnings
            )
            
            if doc is None:
                raise Exception(f"Dosya açılamadı - Errors: {errors}, Warnings: {warnings}")
            
            self.logger.info(f"Dosya başarıyla açıldı: {file_path.name}")
            return doc
            
        except Exception as e:
            self.logger.error(f"Dosya açma hatası ({file_path}): {str(e)}")
            return None
    
    def close_document(self, doc):
        """Dokümanı kapat"""
        try:
            if doc:
                file_name = doc.GetPathName()
                self.sw_app.CloseDoc(file_name)
                self.logger.debug(f"Dosya kapatıldı: {file_name}")
        except Exception as e:
            self.logger.error(f"Dosya kapatma hatası: {str(e)}")
    
    def close_all_documents(self):
        """Tüm açık dokümanları kapat"""
        try:
            if not self.is_available():
                return
            
            # Tüm açık dokümanları al ve kapat
            doc_count = self.sw_app.GetDocumentCount()
            for i in range(doc_count):
                doc = self.sw_app.GetFirstDocument()
                if doc:
                    self.close_document(doc)
                    
        except Exception as e:
            self.logger.error(f"Tüm dokümanları kapatma hatası: {str(e)}")
    
    def zoom_to_fit(self, doc):
        """Modeli ekrana sığdır"""
        try:
            if doc:
                doc.ViewZoomtofit2()
                self.logger.debug("Zoom to fit uygulandı")
        except Exception as e:
            self.logger.error(f"Zoom to fit hatası: {str(e)}")
    
    def generate_thumbnail(self, file_path: Path, output_path: Path) -> bool:
        """PNG thumbnail oluştur"""
        try:
            # Dokümanı aç
            doc = self.open_document(file_path)
            if not doc:
                return False
            
            try:
                # Zoom to fit
                self.zoom_to_fit(doc)
                
                # Kısa bekleme (render için)
                time.sleep(0.5)
                
                # Output klasörünü oluştur
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                # PNG olarak kaydet
                output_str = str(output_path.resolve())
                
                errors = 0
                warnings = 0
                success = doc.Extension.SaveAs(
                    output_str,         # FileName
                    0,                  # Version (swSaveAsCurrentVersion)
                    1,                  # Options (swSaveAsOptions_Silent)
                    None,               # ExportData
                    errors,             # Errors
                    warnings            # Warnings
                )
                
                if not success:
                    raise Exception(f"SaveAs başarısız - Errors: {errors}, Warnings: {warnings}")
                
                # Dosyanın oluştuğunu kontrol et
                if not output_path.exists():
                    raise Exception("Thumbnail dosyası oluşturulamadı")
                
                self.logger.info(f"Thumbnail oluşturuldu: {output_path.name}")
                return True
                
            finally:
                # Dokümanı kapat
                self.close_document(doc)
                
        except Exception as e:
            self.logger.error(f"Thumbnail oluşturma hatası ({file_path}): {str(e)}")
            
            # Hatalı dosyayı temizle
            if output_path.exists():
                try:
                    output_path.unlink()
                except:
                    pass
                    
            return False
    
    def get_document_properties(self, file_path: Path) -> dict:
        """Doküman özelliklerini al"""
        properties = {}
        
        try:
            doc = self.open_document(file_path)
            if not doc:
                return properties
            
            try:
                # Temel bilgiler
                properties['file_name'] = file_path.name
                properties['file_path'] = str(file_path)
                properties['file_size'] = file_path.stat().st_size
                
                # SolidWorks özellikleri
                try:
                    properties['title'] = doc.GetTitle()
                except:
                    properties['title'] = file_path.stem
                
                # Custom properties
                try:
                    swCustomInfoType_Text = 30
                    custom_prop_mgr = doc.Extension.CustomPropertyManager("")
                    
                    if custom_prop_mgr:
                        prop_names = custom_prop_mgr.GetNames()
                        if prop_names:
                            for prop_name in prop_names:
                                try:
                                    val_out = ""
                                    resolved_val_out = ""
                                    custom_prop_mgr.Get2(prop_name, val_out, resolved_val_out)
                                    properties[f"custom_{prop_name}"] = resolved_val_out
                                except:
                                    pass
                except Exception as e:
                    self.logger.debug(f"Custom properties alınamadı: {str(e)}")
                
                return properties
                
            finally:
                self.close_document(doc)
                
        except Exception as e:
            self.logger.error(f"Dosya özellikleri alma hatası ({file_path}): {str(e)}")
            return properties
    
    def batch_process(self, file_list: list, progress_callback=None) -> dict:
        """Toplu dosya işleme"""
        results = {
            'total': len(file_list),
            'success': 0,
            'failed': 0,
            'files': []
        }
        
        for i, file_info in enumerate(file_list):
            try:
                file_path = Path(file_info['path'])
                
                # İlerleme bildirimi
                if progress_callback:
                    progress = (i / len(file_list)) * 100
                    progress_callback(progress, f"İşleniyor: {file_path.name}")
                
                # Thumbnail oluştur
                thumbnail_path = self.config.temp_directory / f"{file_path.stem}_thumb.png"
                
                success = self.generate_thumbnail(file_path, thumbnail_path)
                
                file_result = {
                    'file_path': str(file_path),
                    'file_name': file_path.stem,
                    'success': success,
                    'thumbnail_path': str(thumbnail_path) if success else None,
                    'error': None if success else "Thumbnail oluşturulamadı"
                }
                
                results['files'].append(file_result)
                
                if success:
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    
            except Exception as e:
                error_msg = f"Dosya işleme hatası: {str(e)}"
                self.logger.error(error_msg)
                
                results['files'].append({
                    'file_path': file_info.get('path', 'unknown'),
                    'file_name': 'unknown',
                    'success': False,
                    'thumbnail_path': None,
                    'error': error_msg
                })
                
                results['failed'] += 1
        
        # Final progress
        if progress_callback:
            progress_callback(100, f"Tamamlandı: {results['success']}/{results['total']}")
        
        return results
    
    def test_connection(self) -> Tuple[bool, str]:
        """Bağlantı testi"""
        try:
            if not self.is_connected:
                return False, "Bağlantı kurulmamış"
            
            if not self.sw_app:
                return False, "SolidWorks application objesi bulunamadı"
            
            # Version bilgisini al
            version = self.sw_app.GetVersion()
            return True, f"Bağlantı OK - Version: {version}"
            
        except Exception as e:
            return False, f"Test hatası: {str(e)}"
    
    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()