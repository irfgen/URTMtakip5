"""
STEP BOM Analyzer - Logging Sistemi

Detaylı loglama ve hata takibi için gelişmiş logger.
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path


class STEPAnalyzerLogger:
    """STEP Analyzer için özelleştirilmiş logger sınıfı"""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.logger = None
        self._setup_logger()
    
    def _setup_logger(self):
        """Logger'ı yapılandır"""
        # Logger oluştur
        self.logger = logging.getLogger('STEPBOMAnalyzer')
        self.logger.setLevel(logging.DEBUG)
        
        # Mevcut handler'ları temizle
        self.logger.handlers.clear()
        
        # Console handler
        self._setup_console_handler()
        
        # File handler
        self._setup_file_handler()
        
        # Format ayarla
        self._setup_formatters()
    
    def _setup_console_handler(self):
        """Console handler'ı ayarla"""
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        
        # Console formatter
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        
        self.logger.addHandler(console_handler)
    
    def _setup_file_handler(self):
        """File handler'ı ayarla"""
        # Log dosyası yolu
        log_file = self.config.get('log_file', 'step_bom_analyzer.log')
        max_size = self.config.get('max_size_mb', 10) * 1024 * 1024
        backup_count = self.config.get('backup_count', 5)
        
        # Log dizini oluştur
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        
        # File formatter (daha detaylı)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        
        self.logger.addHandler(file_handler)
    
    def _setup_formatters(self):
        """Özel formatlar için"""
        pass
    
    def debug(self, message, *args, **kwargs):
        """Debug level log"""
        self.logger.debug(message, *args, **kwargs)
    
    def info(self, message, *args, **kwargs):
        """Info level log"""
        self.logger.info(message, *args, **kwargs)
    
    def warning(self, message, *args, **kwargs):
        """Warning level log"""
        self.logger.warning(message, *args, **kwargs)
    
    def error(self, message, *args, **kwargs):
        """Error level log"""
        self.logger.error(message, *args, **kwargs)
    
    def critical(self, message, *args, **kwargs):
        """Critical level log"""
        self.logger.critical(message, *args, **kwargs)
    
    def log_step_operation(self, operation, file_path, duration=None, status="SUCCESS"):
        """STEP işlemi için özel log"""
        message = f"STEP {operation}: {file_path}"
        if duration:
            message += f" ({duration:.2f}s)"
        message += f" - {status}"
        
        if status == "SUCCESS":
            self.info(message)
        elif status == "ERROR":
            self.error(message)
        else:
            self.warning(message)
    
    def log_bom_extraction(self, assembly_name, part_count, level=0):
        """BOM çıkarma için özel log"""
        indent = "  " * level
        self.info(f"BOM: {indent}{assembly_name} ({part_count} parts)")
    
    def log_api_call(self, method, endpoint, status_code, response_time=None):
        """API çağrısı için özel log"""
        message = f"API {method} {endpoint} - {status_code}"
        if response_time:
            message += f" ({response_time:.3f}s)"
        
        if 200 <= status_code < 300:
            self.info(message)
        elif 400 <= status_code < 500:
            self.warning(message)
        else:
            self.error(message)
    
    def log_rendering_operation(self, operation, file_path, resolution=None, duration=None):
        """3D rendering işlemi için özel log"""
        message = f"RENDER {operation}: {file_path}"
        if resolution:
            message += f" @{resolution}"
        if duration:
            message += f" ({duration:.2f}s)"
        
        self.info(message)
    
    def log_error_with_context(self, error, context=None):
        """Hata ve context bilgisi ile log"""
        message = f"ERROR: {str(error)}"
        if context:
            message += f" | Context: {context}"
        
        self.error(message)
        
        # Exception traceback'i de logla
        if isinstance(error, Exception):
            import traceback
            self.debug(f"Traceback: {traceback.format_exc()}")
    
    def get_logger(self):
        """Raw logger objesini döndür"""
        return self.logger


class ProgressLogger:
    """İlerleme takibi için özel logger"""
    
    def __init__(self, main_logger, operation_name, total_items=None):
        self.logger = main_logger
        self.operation = operation_name
        self.total = total_items
        self.current = 0
        self.start_time = datetime.now()
    
    def update(self, increment=1, message=None):
        """İlerleme güncelle"""
        self.current += increment
        
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        if self.total:
            percentage = (self.current / self.total) * 100
            
            # ETA hesapla
            if self.current > 0:
                eta = (elapsed / self.current) * (self.total - self.current)
                eta_str = f"ETA: {eta:.1f}s"
            else:
                eta_str = "ETA: N/A"
            
            progress_msg = f"{self.operation}: {self.current}/{self.total} ({percentage:.1f}%) - {eta_str}"
        else:
            progress_msg = f"{self.operation}: {self.current} items processed ({elapsed:.1f}s)"
        
        if message:
            progress_msg += f" | {message}"
        
        self.logger.info(progress_msg)
    
    def finish(self, final_message=None):
        """İşlemi bitir"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        message = f"{self.operation} COMPLETED: {self.current} items in {elapsed:.2f}s"
        if final_message:
            message += f" | {final_message}"
        
        self.logger.info(message)