"""
STEP BOM Analyzer - Configuration Manager

Uygulama ayarlarını yönetir ve doğrular.
"""

import configparser
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional


class ConfigManager:
    """Configuration yönetimi için sınıf"""
    
    def __init__(self, config_file='config.ini', logger=None):
        self.config_file = Path(config_file)
        self.logger = logger
        self.config = configparser.ConfigParser()
        self._load_config()
        self._validate_config()
    
    def _load_config(self):
        """Config dosyasını yükle"""
        if not self.config_file.exists():
            self._create_default_config()
        
        try:
            self.config.read(self.config_file, encoding='utf-8')
            if self.logger:
                self.logger.info(f"Config dosyası yüklendi: {self.config_file}")
        except Exception as e:
            if self.logger:
                self.logger.error(f"Config dosyası yüklenemedi: {e}")
            raise
    
    def _create_default_config(self):
        """Varsayılan config dosyası oluştur"""
        default_config = {
            'SERVER': {
                'url': 'http://localhost:3000',
                'api_base': '/api/cad-import',
                'timeout': '30'
            },
            'CLIENT': {
                'client_name': 'STEP BOM Analyzer',
                'client_id_prefix': 'step_analyzer'
            },
            'STEP_PROCESSING': {
                'supported_extensions': '.step,.stp,.STEP,.STP',
                'max_file_size_mb': '500',
                'freecad_timeout_seconds': '300'
            },
            'RENDERING': {
                'screenshot_format': 'png',
                'image_resolution': '1920x1080',
                'background_color': 'white'
            },
            'LOGGING': {
                'level': 'INFO',
                'file': 'step_bom_analyzer.log',
                'max_size_mb': '10'
            }
        }
        
        # Config dosyasını yaz
        config = configparser.ConfigParser()
        for section, values in default_config.items():
            config[section] = values
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            config.write(f)
        
        if self.logger:
            self.logger.info(f"Varsayılan config dosyası oluşturuldu: {self.config_file}")
    
    def _validate_config(self):
        """Config dosyasını doğrula"""
        required_sections = ['SERVER', 'CLIENT', 'STEP_PROCESSING', 'RENDERING', 'LOGGING']
        
        for section in required_sections:
            if not self.config.has_section(section):
                if self.logger:
                    self.logger.warning(f"Eksik config section: {section}")
    
    def get(self, section: str, key: str, fallback: Any = None) -> str:
        """Config değeri al"""
        try:
            return self.config.get(section, key, fallback=fallback)
        except (configparser.NoSectionError, configparser.NoOptionError):
            if self.logger:
                self.logger.warning(f"Config bulunamadı: {section}.{key}, fallback: {fallback}")
            return fallback
    
    def get_int(self, section: str, key: str, fallback: int = 0) -> int:
        """Integer config değeri al"""
        try:
            return self.config.getint(section, key, fallback=fallback)
        except (configparser.NoSectionError, configparser.NoOptionError, ValueError):
            if self.logger:
                self.logger.warning(f"Config integer parse hatası: {section}.{key}, fallback: {fallback}")
            return fallback
    
    def get_float(self, section: str, key: str, fallback: float = 0.0) -> float:
        """Float config değeri al"""
        try:
            return self.config.getfloat(section, key, fallback=fallback)
        except (configparser.NoSectionError, configparser.NoOptionError, ValueError):
            if self.logger:
                self.logger.warning(f"Config float parse hatası: {section}.{key}, fallback: {fallback}")
            return fallback
    
    def get_bool(self, section: str, key: str, fallback: bool = False) -> bool:
        """Boolean config değeri al"""
        try:
            return self.config.getboolean(section, key, fallback=fallback)
        except (configparser.NoSectionError, configparser.NoOptionError, ValueError):
            if self.logger:
                self.logger.warning(f"Config boolean parse hatası: {section}.{key}, fallback: {fallback}")
            return fallback
    
    def get_list(self, section: str, key: str, separator: str = ',', fallback: list = None) -> list:
        """Liste config değeri al"""
        if fallback is None:
            fallback = []
        
        try:
            value = self.config.get(section, key)
            if not value:
                return fallback
            return [item.strip() for item in value.split(separator)]
        except (configparser.NoSectionError, configparser.NoOptionError):
            if self.logger:
                self.logger.warning(f"Config list parse hatası: {section}.{key}, fallback: {fallback}")
            return fallback
    
    def set(self, section: str, key: str, value: str):
        """Config değeri ayarla"""
        if not self.config.has_section(section):
            self.config.add_section(section)
        
        self.config.set(section, key, str(value))
        self._save_config()
    
    def _save_config(self):
        """Config dosyasını kaydet"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                self.config.write(f)
            
            if self.logger:
                self.logger.debug(f"Config dosyası kaydedildi: {self.config_file}")
        except Exception as e:
            if self.logger:
                self.logger.error(f"Config dosyası kaydedilemedi: {e}")
    
    # Özel getter metodları
    
    def get_server_config(self) -> Dict[str, Any]:
        """Server ayarlarını al"""
        return {
            'url': self.get('SERVER', 'url', 'http://localhost:3000'),
            'api_base': self.get('SERVER', 'api_base', '/api/cad-import'),
            'timeout': self.get_int('SERVER', 'timeout', 30),
            'verify_ssl': self.get_bool('SERVER', 'verify_ssl', True)
        }
    
    def get_client_config(self) -> Dict[str, Any]:
        """Client ayarlarını al"""
        return {
            'client_name': self.get('CLIENT', 'client_name', 'STEP BOM Analyzer'),
            'client_id_prefix': self.get('CLIENT', 'client_id_prefix', 'step_analyzer'),
            'auto_register': self.get_bool('CLIENT', 'auto_register', True)
        }
    
    def get_step_processing_config(self) -> Dict[str, Any]:
        """STEP processing ayarlarını al"""
        return {
            'supported_extensions': self.get_list('STEP_PROCESSING', 'supported_extensions', 
                                                 fallback=['.step', '.stp', '.STEP', '.STP']),
            'max_file_size_mb': self.get_int('STEP_PROCESSING', 'max_file_size_mb', 500),
            'max_assembly_depth': self.get_int('STEP_PROCESSING', 'max_assembly_depth', 10),
            'freecad_timeout_seconds': self.get_int('STEP_PROCESSING', 'freecad_timeout_seconds', 300),
            'freecad_gui_mode': self.get_bool('STEP_PROCESSING', 'freecad_gui_mode', False),
            'freecad_precision': self.get_float('STEP_PROCESSING', 'freecad_precision', 0.1)
        }
    
    def get_bom_config(self) -> Dict[str, Any]:
        """BOM extraction ayarlarını al"""
        return {
            'include_sub_assemblies': self.get_bool('BOM_EXTRACTION', 'include_sub_assemblies', True),
            'include_part_properties': self.get_bool('BOM_EXTRACTION', 'include_part_properties', True),
            'max_hierarchy_levels': self.get_int('BOM_EXTRACTION', 'max_hierarchy_levels', 20),
            'flatten_hierarchy': self.get_bool('BOM_EXTRACTION', 'flatten_hierarchy', False),
            'export_formats': self.get_list('BOM_EXTRACTION', 'export_formats', 
                                           fallback=['json', 'excel', 'csv'])
        }
    
    def get_rendering_config(self) -> Dict[str, Any]:
        """Rendering ayarlarını al"""
        return {
            'render_engine': self.get('RENDERING', 'render_engine', 'open3d'),
            'screenshot_format': self.get('RENDERING', 'screenshot_format', 'png'),
            'screenshot_quality': self.get('RENDERING', 'screenshot_quality', 'high'),
            'image_resolution': self.get('RENDERING', 'image_resolution', '1920x1080'),
            'background_color': self.get('RENDERING', 'background_color', 'white'),
            'mesh_format': self.get('RENDERING', 'mesh_format', 'stl'),
            'auto_camera_position': self.get_bool('RENDERING', 'auto_camera_position', True)
        }
    
    def get_api_config(self) -> Dict[str, Any]:
        """API entegrasyon ayarlarını al"""
        return {
            'batch_size': self.get_int('API_INTEGRATION', 'batch_size', 50),
            'concurrent_requests': self.get_int('API_INTEGRATION', 'concurrent_requests', 3),
            'retry_attempts': self.get_int('API_INTEGRATION', 'retry_attempts', 3),
            'retry_delay_seconds': self.get_int('API_INTEGRATION', 'retry_delay_seconds', 2),
            'auto_check_existing_parts': self.get_bool('API_INTEGRATION', 'auto_check_existing_parts', True),
            'upload_missing_parts': self.get_bool('API_INTEGRATION', 'upload_missing_parts', True)
        }
    
    def get_output_config(self) -> Dict[str, Any]:
        """Output ayarlarını al"""
        return {
            'output_directory': self.get('OUTPUT', 'output_directory', './output'),
            'temp_directory': self.get('OUTPUT', 'temp_directory', './temp'),
            'keep_temp_files': self.get_bool('OUTPUT', 'keep_temp_files', False),
            'include_timestamp': self.get_bool('OUTPUT', 'include_timestamp', True),
            'thumbnail_size': self.get('OUTPUT', 'thumbnail_size', '300x300'),
            'thumbnail_quality': self.get_int('OUTPUT', 'thumbnail_quality', 85)
        }
    
    def get_logging_config(self) -> Dict[str, Any]:
        """Logging ayarlarını al"""
        return {
            'level': self.get('LOGGING', 'level', 'INFO'),
            'log_file': self.get('LOGGING', 'file', 'step_bom_analyzer.log'),
            'max_size_mb': self.get_int('LOGGING', 'max_size_mb', 10),
            'backup_count': self.get_int('LOGGING', 'backup_count', 5),
            'console_output': self.get_bool('LOGGING', 'console_output', True)
        }
    
    def get_ui_config(self) -> Dict[str, Any]:
        """UI ayarlarını al"""
        return {
            'window_width': self.get_int('UI', 'window_width', 1400),
            'window_height': self.get_int('UI', 'window_height', 900),
            'theme': self.get('UI', 'theme', 'default'),
            'auto_refresh_interval': self.get_int('UI', 'auto_refresh_interval', 5),
            'show_detailed_progress': self.get_bool('UI', 'show_detailed_progress', True)
        }
    
    def export_to_json(self, file_path: str):
        """Config'i JSON formatında export et"""
        config_dict = {}
        for section_name in self.config.sections():
            config_dict[section_name] = dict(self.config[section_name])
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(config_dict, f, indent=2, ensure_ascii=False)
        
        if self.logger:
            self.logger.info(f"Config JSON olarak export edildi: {file_path}")