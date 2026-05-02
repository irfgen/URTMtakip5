"""
Logging konfigürasyonu
"""

import logging
import logging.handlers
from pathlib import Path
import sys

def setup_logger(config):
    """Logger'ı konfigüre et"""
    
    # Logger oluştur
    logger = logging.getLogger('CADImportClient')
    logger.setLevel(config.log_level)
    
    # Önceki handler'ları temizle
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
        
    # Formatter oluştur
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (rotating)
    try:
        log_file = config.get('LOGGING', 'file', 'cad_import.log')
        max_size = config.getint('LOGGING', 'max_size_mb', 10) * 1024 * 1024
        backup_count = config.getint('LOGGING', 'backup_count', 5)
        
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(config.log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
    except Exception as e:
        logger.warning(f"Dosya log handler oluşturulamadı: {e}")
    
    return logger