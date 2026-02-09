"""
Dosya sistemi tarayıcı modülü
"""

import os
import hashlib
from pathlib import Path
from typing import List, Dict, Optional, Callable
import threading
import time

class FileScanner:
    """CAD dosyalarını tarayan sınıf"""
    
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.supported_extensions = config.supported_extensions
        self.max_file_size = config.getint('FILES', 'max_file_size_mb', 100) * 1024 * 1024
        self._stop_scanning = False
        
    def scan_directory(self, directory: Path, progress_callback: Optional[Callable] = None) -> List[Dict]:
        """Klasörü tara ve CAD dosyalarını bul"""
        
        self.logger.info(f"Klasör taranıyor: {directory}")
        self._stop_scanning = False
        
        found_files = []
        
        try:
            # Tüm dosyaları bul
            all_files = []
            for ext in self.supported_extensions:
                pattern = f"**/*{ext}"
                files = list(directory.rglob(pattern))
                all_files.extend(files)
            
            total_files = len(all_files)
            self.logger.info(f"Toplam {total_files} CAD dosyası bulundu")
            
            if total_files == 0:
                return found_files
            
            for i, file_path in enumerate(all_files):
                if self._stop_scanning:
                    self.logger.info("Tarama durduruldu")
                    break
                
                try:
                    # İlerleme bildirimi
                    if progress_callback:
                        progress = (i / total_files) * 100
                        progress_callback(progress, f"Taranıyor: {file_path.name}")
                    
                    # Dosya bilgilerini al
                    file_info = self.get_file_info(file_path)
                    if file_info:
                        found_files.append(file_info)
                        
                except Exception as e:
                    self.logger.warning(f"Dosya bilgisi alınamadı ({file_path}): {str(e)}")
            
            # Final progress
            if progress_callback and not self._stop_scanning:
                progress_callback(100, f"Tarama tamamlandı: {len(found_files)} dosya")
            
        except Exception as e:
            self.logger.error(f"Klasör tarama hatası: {str(e)}")
        
        self.logger.info(f"Tarama tamamlandı: {len(found_files)} geçerli dosya bulundu")
        return found_files
    
    def get_file_info(self, file_path: Path) -> Optional[Dict]:
        """Dosya bilgilerini al"""
        try:
            # Dosya varlığını kontrol et
            if not file_path.exists():
                return None
            
            # Dosya boyutu kontrolü
            file_size = file_path.stat().st_size
            if file_size > self.max_file_size:
                self.logger.warning(f"Dosya çok büyük ({file_size} bytes): {file_path}")
                return None
            
            if file_size == 0:
                self.logger.warning(f"Dosya boş: {file_path}")
                return None
            
            # Dosya hash'i hesapla
            file_hash = self.calculate_file_hash(file_path)
            
            # Dosya bilgilerini topla
            file_info = {
                'full_path': str(file_path.resolve()),
                'file_name': file_path.stem,  # Uzantısız dosya adı
                'extension': file_path.suffix.lower(),
                'file_size': file_size,
                'modified_time': file_path.stat().st_mtime,
                'hash': file_hash,
                'relative_path': str(file_path),
                'parent_dir': str(file_path.parent)
            }
            
            return file_info
            
        except Exception as e:
            self.logger.error(f"Dosya bilgisi alma hatası ({file_path}): {str(e)}")
            return None
    
    def calculate_file_hash(self, file_path: Path, algorithm: str = 'md5') -> str:
        """Dosya hash'i hesapla"""
        try:
            hash_obj = hashlib.new(algorithm)
            
            with open(file_path, 'rb') as f:
                # Büyük dosyalar için chunk'lar halinde oku
                chunk_size = 8192
                while chunk := f.read(chunk_size):
                    hash_obj.update(chunk)
            
            return hash_obj.hexdigest()
            
        except Exception as e:
            self.logger.error(f"Hash hesaplama hatası ({file_path}): {str(e)}")
            return ""
    
    def filter_files(self, files: List[Dict], filter_criteria: Dict) -> List[Dict]:
        """Dosyaları filtrele"""
        filtered_files = []
        
        for file_info in files:
            include_file = True
            
            # Uzantı filtresi
            if 'extensions' in filter_criteria:
                extensions = filter_criteria['extensions']
                if file_info['extension'] not in extensions:
                    include_file = False
            
            # Boyut filtresi
            if 'min_size' in filter_criteria:
                if file_info['file_size'] < filter_criteria['min_size']:
                    include_file = False
            
            if 'max_size' in filter_criteria:
                if file_info['file_size'] > filter_criteria['max_size']:
                    include_file = False
            
            # Dosya adı filtresi
            if 'name_pattern' in filter_criteria:
                pattern = filter_criteria['name_pattern'].lower()
                if pattern not in file_info['file_name'].lower():
                    include_file = False
            
            # Klasör filtresi
            if 'exclude_dirs' in filter_criteria:
                exclude_dirs = filter_criteria['exclude_dirs']
                parent_dir = file_info['parent_dir'].lower()
                for exclude_dir in exclude_dirs:
                    if exclude_dir.lower() in parent_dir:
                        include_file = False
                        break
            
            if include_file:
                filtered_files.append(file_info)
        
        return filtered_files
    
    def group_files_by_directory(self, files: List[Dict]) -> Dict[str, List[Dict]]:
        """Dosyaları klasörlere göre grupla"""
        groups = {}
        
        for file_info in files:
            parent_dir = file_info['parent_dir']
            if parent_dir not in groups:
                groups[parent_dir] = []
            groups[parent_dir].append(file_info)
        
        return groups
    
    def get_duplicate_files(self, files: List[Dict]) -> Dict[str, List[Dict]]:
        """Aynı hash'e sahip dosyaları bul (duplicates)"""
        hash_groups = {}
        
        for file_info in files:
            file_hash = file_info['hash']
            if file_hash:
                if file_hash not in hash_groups:
                    hash_groups[file_hash] = []
                hash_groups[file_hash].append(file_info)
        
        # Sadece birden fazla dosya içeren grupları döndür
        duplicates = {h: files for h, files in hash_groups.items() if len(files) > 1}
        return duplicates
    
    def get_scan_statistics(self, files: List[Dict]) -> Dict:
        """Tarama istatistikleri"""
        stats = {
            'total_files': len(files),
            'total_size': sum(f['file_size'] for f in files),
            'extensions': {},
            'directories': set(),
            'duplicates_count': 0
        }
        
        # Uzantı istatistikleri
        for file_info in files:
            ext = file_info['extension']
            if ext not in stats['extensions']:
                stats['extensions'][ext] = {'count': 0, 'size': 0}
            stats['extensions'][ext]['count'] += 1
            stats['extensions'][ext]['size'] += file_info['file_size']
            
            # Klasör sayısı
            stats['directories'].add(file_info['parent_dir'])
        
        stats['directories_count'] = len(stats['directories'])
        stats['directories'] = list(stats['directories'])
        
        # Duplicate sayısı
        duplicates = self.get_duplicate_files(files)
        stats['duplicates_count'] = sum(len(files) - 1 for files in duplicates.values())
        
        return stats
    
    def stop_scanning(self):
        """Taramayı durdur"""
        self._stop_scanning = True
        self.logger.info("Tarama durdurma sinyali gönderildi")
    
    def scan_directory_async(self, directory: Path, callback: Callable, progress_callback: Optional[Callable] = None):
        """Asenkron klasör tarama"""
        def scan_worker():
            try:
                files = self.scan_directory(directory, progress_callback)
                callback(files, None)
            except Exception as e:
                self.logger.error(f"Asenkron tarama hatası: {str(e)}")
                callback([], str(e))
        
        thread = threading.Thread(target=scan_worker, daemon=True)
        thread.start()
        return thread
    
    def watch_file_changes(self, files: List[Dict]) -> List[Dict]:
        """Dosya değişikliklerini kontrol et"""
        changed_files = []
        
        for file_info in files:
            try:
                file_path = Path(file_info['full_path'])
                
                if not file_path.exists():
                    # Dosya silinmiş
                    file_info['status'] = 'deleted'
                    changed_files.append(file_info)
                    continue
                
                # Dosya boyutu ve modifikasyon zamanı kontrolü
                current_size = file_path.stat().st_size
                current_mtime = file_path.stat().st_mtime
                
                if (current_size != file_info['file_size'] or 
                    current_mtime != file_info['modified_time']):
                    
                    # Hash'i yeniden hesapla
                    new_hash = self.calculate_file_hash(file_path)
                    
                    if new_hash != file_info['hash']:
                        # Dosya değişmiş
                        file_info['status'] = 'modified'
                        file_info['old_hash'] = file_info['hash']
                        file_info['hash'] = new_hash
                        file_info['file_size'] = current_size
                        file_info['modified_time'] = current_mtime
                        changed_files.append(file_info)
                
            except Exception as e:
                self.logger.error(f"Dosya değişiklik kontrolü hatası ({file_info['full_path']}): {str(e)}")
        
        return changed_files