"""
Konfigürasyon yönetimi
"""

import configparser
import os
from pathlib import Path
import logging

class ConfigManager:
    """Konfigürasyon dosyasını yöneten sınıf"""
    
    def __init__(self, config_file="config.ini"):
        self.config_file = Path(config_file)
        self.config = configparser.ConfigParser()
        self.load_config()
        
    def load_config(self):
        """Konfigürasyon dosyasını yükle"""
        if self.config_file.exists():
            self.config.read(self.config_file, encoding='utf-8')
        else:
            # Default konfigürasyon oluştur
            self.create_default_config()
            
    def create_default_config(self):
        """Varsayılan konfigürasyon oluştur"""
        self.config['SERVER'] = {
            'url': 'http://localhost:3000',
            'api_base': '/api/cad-import',
            'socket_namespace': '/cad-import',
            'timeout': '30'
        }
        
        self.config['CLIENT'] = {
            'client_name': 'CAD Import Client',
            'auto_reconnect': 'true',
            'heartbeat_interval': '30'
        }
        
        self.config['SOLIDWORKS'] = {
            'concurrent_models': '1',
            'retry_attempts': '3',
            'timeout_seconds': '120',
            'close_after_processing': 'true'
        }
        
        self.config['FILES'] = {
            'supported_extensions': '.sldprt,.sldpart,.sldasm',
            'thumbnail_quality': 'high',
            'temp_directory': './temp',
            'max_file_size_mb': '100'
        }
        
        self.config['LOGGING'] = {
            'level': 'INFO',
            'file': 'cad_import.log',
            'max_size_mb': '10',
            'backup_count': '5'
        }
        
        self.config['UI'] = {
            'window_width': '1200',
            'window_height': '800',
            'auto_refresh_interval': '5'
        }
        
        self.save_config()
        
    def save_config(self):
        """Konfigürasyonu dosyaya kaydet"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            self.config.write(f)
            
    def get(self, section, key, fallback=None):
        """Konfigürasyon değeri al"""
        return self.config.get(section, key, fallback=fallback)
        
    def getint(self, section, key, fallback=0):
        """Integer konfigürasyon değeri al"""
        return self.config.getint(section, key, fallback=fallback)
        
    def getfloat(self, section, key, fallback=0.0):
        """Float konfigürasyon değeri al"""
        return self.config.getfloat(section, key, fallback=fallback)
        
    def getboolean(self, section, key, fallback=False):
        """Boolean konfigürasyon değeri al"""
        return self.config.getboolean(section, key, fallback=fallback)
        
    def set(self, section, key, value):
        """Konfigürasyon değeri güncelle"""
        if not self.config.has_section(section):
            self.config.add_section(section)
        self.config.set(section, key, str(value))
        
    # Convenience methods
    @property
    def server_url(self):
        return self.get('SERVER', 'url', 'http://localhost:3000')
        
    @property
    def api_base(self):
        return self.get('SERVER', 'api_base', '/api/cad-import')
        
    @property
    def socket_namespace(self):
        return self.get('SERVER', 'socket_namespace', '/cad-import')
        
    @property
    def client_name(self):
        return self.get('CLIENT', 'client_name', 'CAD Import Client')
        
    @property
    def supported_extensions(self):
        ext_str = self.get('FILES', 'supported_extensions', '.sldprt,.sldpart,.sldasm')
        return [ext.strip() for ext in ext_str.split(',')]
        
    @property
    def temp_directory(self):
        temp_dir = Path(self.get('FILES', 'temp_directory', './temp'))
        temp_dir.mkdir(exist_ok=True)
        return temp_dir
        
    @property
    def log_level(self):
        level_str = self.get('LOGGING', 'level', 'INFO')
        return getattr(logging, level_str.upper(), logging.INFO)
        
    @property
    def window_size(self):
        width = self.getint('UI', 'window_width', 1200)
        height = self.getint('UI', 'window_height', 800)
        return width, height