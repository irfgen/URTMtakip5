"""
API Client

ÜRTM Takip Backend API ile iletişim kurar.
Part kontrolü, upload ve BOM entegrasyonu sağlar.
"""

import json
import requests
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime

from .bom_extractor import BOMStructure, BOMItem


@dataclass
class APIResponse:
    """API yanıt yapısı"""
    success: bool
    status_code: int
    data: Optional[Dict] = None
    error: Optional[str] = None
    response_time: float = 0.0


@dataclass
class PartCheckResult:
    """Part kontrol sonucu"""
    part_code: str
    exists: bool
    part_data: Optional[Dict] = None


@dataclass
class PartUploadResult:
    """Part upload sonucu"""
    part_code: str
    success: bool
    uploaded_data: Optional[Dict] = None
    error: Optional[str] = None


@dataclass
class BatchOperationResult:
    """Toplu işlem sonucu"""
    total_items: int
    successful_items: int
    failed_items: int
    results: List[Union[PartCheckResult, PartUploadResult]]
    operation_time: float
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class APIClient:
    """ÜRTM Takip Backend API Client"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        
        # Config manager methodlarını kullan
        if hasattr(config, 'get_server_config'):
            self.server_config = config.get_server_config() or {}
            self.api_config = config.get_api_config() or {}
            client_config = config.get_client_config() or {}
        elif hasattr(config, 'get'):
            # ConfigParser object
            try:
                self.server_config = dict(config['SERVER']) if 'SERVER' in config else {}
                self.api_config = dict(config['API_INTEGRATION']) if 'API_INTEGRATION' in config else {}
                client_config = dict(config['CLIENT']) if 'CLIENT' in config else {}
            except:
                self.server_config = {}
                self.api_config = {}
                client_config = {}
        else:
            # Dict object
            self.server_config = self.config.get('SERVER', {})
            self.api_config = self.config.get('API_INTEGRATION', {})
            client_config = self.config.get('CLIENT', {})
        
        # API ayarları
        self.base_url = self.server_config.get('url', 'http://localhost:3000')
        self.api_base = self.server_config.get('api_base', '/api/cad-import')
        self.timeout = int(self.server_config.get('timeout', 30))
        
        # Client bilgileri
        self.client_id = f"{client_config.get('client_id_prefix', 'step_analyzer')}_{uuid.uuid4().hex[:8]}_{int(time.time())}"
        self.client_name = client_config.get('client_name', 'STEP BOM Analyzer')
        
        # Session
        self.session = requests.Session()
        self.session.timeout = self.timeout
        
        # Headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': f'STEP-BOM-Analyzer/1.0 ({self.client_name})',
            'X-Client-ID': self.client_id
        })
        
        self.is_registered = False
        
    def connect_and_register(self) -> APIResponse:
        """Server'a bağlan ve client'ı register et"""
        self._log_info(f"API server'a bağlanılıyor: {self.base_url}")
        
        try:
            # Sunucu sağlık kontrolü
            health_response = self._make_request('GET', '/health', timeout=10)
            if not health_response.success:
                self._log_warning(f"Sunucu sağlık kontrolü başarısız: {health_response.error}")
            
            # Client registration
            register_data = {
                'client_id': self.client_id,
                'client_name': self.client_name,
                'client_info': {
                    'type': 'STEP_BOM_Analyzer',
                    'version': '1.0.0',
                    'platform': 'Python',
                    'capabilities': ['step_parsing', 'bom_extraction', '3d_rendering'],
                    'connected_at': datetime.now().isoformat()
                }
            }
            
            response = self._make_request('POST', '/register-client', data=register_data)
            
            if response.success:
                self.is_registered = True
                self._log_info(f"Client başarıyla register edildi: {self.client_id}")
            else:
                self._log_error(f"Client registration başarısız: {response.error}")
            
            return response
            
        except Exception as e:
            error_msg = f"API bağlantı hatası: {str(e)}"
            self._log_error(error_msg)
            return APIResponse(success=False, status_code=0, error=error_msg)
    
    def check_parts_exist(self, part_codes: List[str]) -> BatchOperationResult:
        """Part kodlarının sistemde olup olmadığını kontrol et"""
        start_time = time.time()
        
        self._log_info(f"Part varlık kontrolü başlatılıyor: {len(part_codes)} parts")
        
        if not self.is_registered:
            self.connect_and_register()
        
        # Batch boyutu
        batch_size = self.api_config.get('batch_size', 50)
        all_results = []
        errors = []
        
        # Part kodlarını batch'lere böl
        for i in range(0, len(part_codes), batch_size):
            batch = part_codes[i:i + batch_size]
            
            try:
                check_data = {
                    'part_codes': batch,
                    'client_id': self.client_id
                }
                
                response = self._make_request('POST', '/check-parts', data=check_data)
                
                if response.success and response.data:
                    # Sonuçları parse et
                    existing_parts = response.data.get('existing_parts', [])
                    missing_parts = response.data.get('missing_parts', [])
                    
                    # Sonuç objelerini oluştur
                    for part_code in existing_parts:
                        all_results.append(PartCheckResult(
                            part_code=part_code,
                            exists=True
                        ))
                    
                    for part_code in missing_parts:
                        all_results.append(PartCheckResult(
                            part_code=part_code,
                            exists=False
                        ))
                
                else:
                    error_msg = f"Batch kontrol hatası: {response.error}"
                    errors.append(error_msg)
                    self._log_error(error_msg)
                    
                    # Hata durumunda part'ları unknown olarak işaretle
                    for part_code in batch:
                        all_results.append(PartCheckResult(
                            part_code=part_code,
                            exists=False  # Güvenli taraf
                        ))
            
            except Exception as e:
                error_msg = f"Batch {i//batch_size + 1} kontrol hatası: {str(e)}"
                errors.append(error_msg)
                self._log_error(error_msg)
        
        # İstatistikler
        successful_count = len([r for r in all_results if isinstance(r, PartCheckResult)])
        failed_count = len(part_codes) - successful_count
        
        operation_time = time.time() - start_time
        
        self._log_info(f"Part kontrolü tamamlandı: {successful_count} başarılı, {failed_count} başarısız ({operation_time:.2f}s)")
        
        return BatchOperationResult(
            total_items=len(part_codes),
            successful_items=successful_count,
            failed_items=failed_count,
            results=all_results,
            operation_time=operation_time,
            errors=errors
        )
    
    def upload_parts(self, bom_items: List[BOMItem], 
                    thumbnail_dir: Optional[str] = None) -> BatchOperationResult:
        """BOM item'larını part olarak upload et"""
        start_time = time.time()
        
        # Sadece eksik part'ları upload et (önceden kontrol edilmiş olmalı)
        missing_parts = [item for item in bom_items if not getattr(item, '_exists', False)]
        
        self._log_info(f"Part upload başlatılıyor: {len(missing_parts)} parts")
        
        if not self.is_registered:
            self.connect_and_register()
        
        all_results = []
        errors = []
        thumbnail_path = Path(thumbnail_dir) if thumbnail_dir else None
        
        for item in missing_parts:
            try:
                result = self._upload_single_part(item, thumbnail_path)
                all_results.append(result)
                
                if not result.success:
                    errors.append(f"Part upload hatası {item.part_number}: {result.error}")
            
            except Exception as e:
                error_msg = f"Part upload exception {item.part_number}: {str(e)}"
                errors.append(error_msg)
                self._log_error(error_msg)
                
                all_results.append(PartUploadResult(
                    part_code=item.part_number,
                    success=False,
                    error=str(e)
                ))
        
        # İstatistikler
        successful_count = len([r for r in all_results if r.success])
        failed_count = len(all_results) - successful_count
        
        operation_time = time.time() - start_time
        
        self._log_info(f"Part upload tamamlandı: {successful_count} başarılı, {failed_count} başarısız ({operation_time:.2f}s)")
        
        return BatchOperationResult(
            total_items=len(missing_parts),
            successful_items=successful_count,
            failed_items=failed_count,
            results=all_results,
            operation_time=operation_time,
            errors=errors
        )
    
    def _upload_single_part(self, bom_item: BOMItem, 
                           thumbnail_dir: Optional[Path]) -> PartUploadResult:
        """Tek bir part'ı upload et"""
        try:
            # Thumbnail dosyası bul
            thumbnail_file = None
            if thumbnail_dir and thumbnail_dir.exists():
                # Thumbnail dosya adı pattern'leri dene
                possible_names = [
                    f"{bom_item.part_number}.png",
                    f"{bom_item.part_number}.jpg",
                    f"{bom_item.part_name.replace(' ', '_')}.png",
                    f"{bom_item.part_name.replace(' ', '_')}.jpg"
                ]
                
                for name in possible_names:
                    thumb_path = thumbnail_dir / name
                    if thumb_path.exists():
                        thumbnail_file = thumb_path
                        break
            
            # Upload data hazırla
            if thumbnail_file:
                # Multipart form data ile upload
                files = {
                    'thumbnail': open(thumbnail_file, 'rb')
                }
                
                data = {
                    'part_code': bom_item.part_number,
                    'part_name': bom_item.part_name,
                    'client_id': self.client_id
                }
                
                # Description oluştur
                description_parts = [bom_item.description]
                if bom_item.material:
                    description_parts.append(f"Material: {bom_item.material}")
                if bom_item.category:
                    description_parts.append(f"Category: {bom_item.category}")
                
                data['description'] = " | ".join(description_parts)
                
                # Multipart request
                response = self._make_multipart_request('POST', '/upload-part', data=data, files=files)
                
                # File'ı kapat
                files['thumbnail'].close()
                
            else:
                # Thumbnail olmadan upload
                upload_data = {
                    'part_code': bom_item.part_number,
                    'part_name': bom_item.part_name,
                    'description': bom_item.description,
                    'client_id': self.client_id
                }
                
                response = self._make_request('POST', '/upload-part', data=upload_data)
            
            if response.success:
                return PartUploadResult(
                    part_code=bom_item.part_number,
                    success=True,
                    uploaded_data=response.data
                )
            else:
                return PartUploadResult(
                    part_code=bom_item.part_number,
                    success=False,
                    error=response.error
                )
        
        except Exception as e:
            return PartUploadResult(
                part_code=bom_item.part_number,
                success=False,
                error=str(e)
            )
    
    def start_import_job(self, job_name: str, total_files: int = 0) -> APIResponse:
        """Import işi başlat"""
        if not self.is_registered:
            self.connect_and_register()
        
        job_data = {
            'job_name': job_name,
            'client_id': self.client_id,
            'total_files': total_files,
            'config': {
                'type': 'STEP_BOM_Analysis',
                'analyzer_version': '1.0.0'
            }
        }
        
        response = self._make_request('POST', '/start-job', data=job_data)
        
        if response.success:
            self._log_info(f"Import job başlatıldı: {job_name}")
        else:
            self._log_error(f"Import job başlatma hatası: {response.error}")
        
        return response
    
    def update_job_progress(self, job_id: int, success_count: int = 0, fail_count: int = 0) -> APIResponse:
        """İş ilerlemesini güncelle"""
        progress_data = {
            'job_id': job_id,
            'success_count': success_count,
            'fail_count': fail_count,
            'client_id': self.client_id
        }
        
        return self._make_request('POST', '/update-job-progress', data=progress_data)
    
    def finish_job(self, job_id: int, final_state: str = 'completed') -> APIResponse:
        """İşi bitir"""
        finish_data = {
            'job_id': job_id,
            'final_state': final_state,
            'client_id': self.client_id
        }
        
        return self._make_request('POST', '/finish-job', data=finish_data)
    
    def get_server_status(self) -> APIResponse:
        """Server durumunu al"""
        return self._make_request('GET', '/status')
    
    def _make_request(self, method: str, endpoint: str, 
                     data: Optional[Dict] = None, 
                     timeout: Optional[int] = None) -> APIResponse:
        """HTTP request yap"""
        url = f"{self.base_url}{self.api_base}{endpoint}"
        request_timeout = timeout or self.timeout
        
        start_time = time.time()
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=request_timeout)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=request_timeout)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=request_timeout)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=request_timeout)
            else:
                raise ValueError(f"Desteklenmeyen HTTP method: {method}")
            
            response_time = time.time() - start_time
            
            # Log request
            if self.logger:
                self.logger.log_api_call(method, endpoint, response.status_code, response_time)
            
            # Response'u parse et
            try:
                response_data = response.json() if response.content else None
            except json.JSONDecodeError:
                response_data = None
            
            if response.status_code >= 200 and response.status_code < 300:
                return APIResponse(
                    success=True,
                    status_code=response.status_code,
                    data=response_data,
                    response_time=response_time
                )
            else:
                error_msg = response_data.get('error', f'HTTP {response.status_code}') if response_data else f'HTTP {response.status_code}'
                return APIResponse(
                    success=False,
                    status_code=response.status_code,
                    error=error_msg,
                    response_time=response_time
                )
        
        except requests.exceptions.Timeout:
            error_msg = f"Request timeout ({request_timeout}s): {endpoint}"
            self._log_error(error_msg)
            return APIResponse(
                success=False,
                status_code=408,
                error=error_msg,
                response_time=time.time() - start_time
            )
        
        except requests.exceptions.ConnectionError:
            error_msg = f"Connection error: {endpoint}"
            self._log_error(error_msg)
            return APIResponse(
                success=False,
                status_code=0,
                error=error_msg,
                response_time=time.time() - start_time
            )
        
        except Exception as e:
            error_msg = f"Request error: {str(e)}"
            self._log_error(error_msg)
            return APIResponse(
                success=False,
                status_code=0,
                error=error_msg,
                response_time=time.time() - start_time
            )
    
    def _make_multipart_request(self, method: str, endpoint: str, 
                               data: Optional[Dict] = None, 
                               files: Optional[Dict] = None) -> APIResponse:
        """Multipart HTTP request yap"""
        url = f"{self.base_url}{self.api_base}{endpoint}"
        
        start_time = time.time()
        
        try:
            # Multipart için headers'ı güncelle
            headers = self.session.headers.copy()
            if 'Content-Type' in headers:
                del headers['Content-Type']  # requests otomatik ayarlar
            
            response = requests.request(
                method=method,
                url=url,
                data=data,
                files=files,
                headers=headers,
                timeout=self.timeout
            )
            
            response_time = time.time() - start_time
            
            # Log request
            if self.logger:
                self.logger.log_api_call(method, endpoint, response.status_code, response_time)
            
            # Response'u parse et
            try:
                response_data = response.json() if response.content else None
            except json.JSONDecodeError:
                response_data = None
            
            if response.status_code >= 200 and response.status_code < 300:
                return APIResponse(
                    success=True,
                    status_code=response.status_code,
                    data=response_data,
                    response_time=response_time
                )
            else:
                error_msg = response_data.get('error', f'HTTP {response.status_code}') if response_data else f'HTTP {response.status_code}'
                return APIResponse(
                    success=False,
                    status_code=response.status_code,
                    error=error_msg,
                    response_time=response_time
                )
        
        except Exception as e:
            error_msg = f"Multipart request error: {str(e)}"
            self._log_error(error_msg)
            return APIResponse(
                success=False,
                status_code=0,
                error=error_msg,
                response_time=time.time() - start_time
            )
    
    def close(self):
        """Connection'ı kapat"""
        if self.session:
            self.session.close()
            self._log_info("API client connection kapatıldı")
    
    def __enter__(self):
        """Context manager enter"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()
    
    def _log_info(self, message: str):
        """Info log"""
        if self.logger:
            self.logger.info(message)
    
    def _log_warning(self, message: str):
        """Warning log"""
        if self.logger:
            self.logger.warning(message)
    
    def _log_error(self, message: str):
        """Error log"""
        if self.logger:
            self.logger.error(message)