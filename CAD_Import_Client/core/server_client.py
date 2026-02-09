"""
Server ile iletişim modülü
"""

import requests
import socketio
import threading
import time
import json
import uuid
import platform
from pathlib import Path
from typing import Optional, Dict, List, Callable

class ServerClient:
    """Server ile HTTP ve WebSocket iletişimi"""
    
    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        
        # Client ID oluştur
        self.client_id = f"cad_client_{uuid.uuid4().hex[:8]}_{int(time.time())}"
        
        # HTTP session
        self.session = requests.Session()
        self.session.timeout = config.getint('SERVER', 'timeout', 30)
        
        # Socket.IO client
        self.sio = socketio.Client()
        self.connected = False
        self.registered = False
        
        # Event callbacks
        self.callbacks = {}
        
        self.setup_socket_events()
        
    def setup_socket_events(self):
        """Socket.IO event'lerini kur"""
        
        @self.sio.event
        def connect():
            self.logger.info("Socket.IO bağlantısı kuruldu")
            self.connected = True
            self.register_client()
            
        @self.sio.event  
        def disconnect():
            self.logger.info("Socket.IO bağlantısı kesildi")
            self.connected = False
            self.registered = False
            
        @self.sio.event
        def registration_success(data):
            self.logger.info(f"Client kaydı başarılı: {data}")
            self.registered = True
            self.trigger_callback('client_registered', data)
            
        @self.sio.event
        def registration_error(data):
            self.logger.error(f"Client kayıt hatası: {data}")
            
        @self.sio.event
        def start_job_command(data):
            self.logger.info(f"İş başlatma komutu alındı: {data}")
            self.trigger_callback('start_job_command', data)
            
        @self.sio.event
        def stop_job_command(data):
            self.logger.info(f"İş durdurma komutu alındı: {data}")
            self.trigger_callback('stop_job_command', data)
            
        @self.sio.event
        def heartbeat_ack():
            # Heartbeat acknowledgment
            pass
            
    def connect_to_server(self) -> bool:
        """Server'a bağlan"""
        try:
            socket_url = f"{self.config.server_url}{self.config.socket_namespace}"
            self.logger.info(f"Socket.IO server'a bağlanılıyor: {socket_url}")
            
            self.sio.connect(socket_url)
            
            # Bağlantı kurulana kadar bekle
            timeout = 10
            start_time = time.time()
            while not self.connected and time.time() - start_time < timeout:
                time.sleep(0.1)
                
            if self.connected:
                self.logger.info("Server bağlantısı başarılı")
                return True
            else:
                self.logger.error("Server bağlantısı zaman aşımına uğradı")
                return False
                
        except Exception as e:
            self.logger.error(f"Server bağlantı hatası: {str(e)}")
            return False
            
    def register_client(self):
        """Client'ı server'a kaydet"""
        try:
            client_info = {
                'client_id': self.client_id,
                'client_name': self.config.client_name,
                'platform': platform.platform(),
                'python_version': platform.python_version(),
                'machine': platform.machine(),
                'connected_at': time.time()
            }
            
            self.sio.emit('register-client', client_info)
            self.logger.info(f"Client kayıt talebi gönderildi: {self.client_id}")
            
        except Exception as e:
            self.logger.error(f"Client kayıt hatası: {str(e)}")
            
    def disconnect(self):
        """Server bağlantısını kes"""
        try:
            if self.connected:
                self.sio.disconnect()
                self.logger.info("Server bağlantısı kesildi")
        except Exception as e:
            self.logger.error(f"Bağlantı kesme hatası: {str(e)}")
            
    def on(self, event: str, callback: Callable):
        """Event callback kaydet"""
        self.callbacks[event] = callback
        
    def trigger_callback(self, event: str, data):
        """Event callback'ini tetikle"""
        if event in self.callbacks:
            try:
                self.callbacks[event](data)
            except Exception as e:
                self.logger.error(f"Callback hatası ({event}): {str(e)}")
                
    # HTTP API Methods
    def get_api_url(self, endpoint: str) -> str:
        """API URL oluştur"""
        return f"{self.config.server_url}{self.config.api_base}{endpoint}"
        
    def api_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict]:
        """API isteği gönder"""
        try:
            url = self.get_api_url(endpoint)
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"API isteği hatası ({method} {endpoint}): {str(e)}")
            return None
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON decode hatası: {str(e)}")
            return None
            
    def index_files(self, files: List[Dict]) -> Optional[Dict]:
        """Dosyaları server'a indeksle"""
        return self.api_request(
            'POST', 
            '/index-files',
            json={
                'files': files,
                'client_id': self.client_id
            }
        )
        
    def check_parts(self, part_codes: List[str]) -> Optional[Dict]:
        """Parça varlık kontrolü yap"""
        return self.api_request(
            'POST',
            '/check-parts', 
            json={
                'part_codes': part_codes,
                'client_id': self.client_id
            }
        )
        
    def upload_part(self, part_data: Dict, thumbnail_path: Optional[Path] = None) -> Optional[Dict]:
        """Parça upload et"""
        files = {}
        if thumbnail_path and thumbnail_path.exists():
            files['thumbnail'] = open(thumbnail_path, 'rb')
            
        try:
            response = self.api_request(
                'POST',
                '/upload-part',
                data={
                    'part_code': part_data['part_code'],
                    'part_name': part_data.get('part_name', part_data['part_code']),
                    'file_path': part_data.get('file_path', ''),
                    'client_id': self.client_id,
                    'file_hash': part_data.get('file_hash', '')
                },
                files=files
            )
            return response
        finally:
            # Dosyaları kapat
            for f in files.values():
                if hasattr(f, 'close'):
                    f.close()
                    
    def start_job(self, job_name: str, total_files: int, config: Dict = None) -> Optional[Dict]:
        """İş başlat"""
        return self.api_request(
            'POST',
            '/start-job',
            json={
                'job_name': job_name,
                'client_id': self.client_id,
                'total_files': total_files,
                'config': config or {}
            }
        )
        
    def update_job_progress(self, job_id: int, success_count: int, fail_count: int) -> Optional[Dict]:
        """İş ilerlemesini güncelle"""
        return self.api_request(
            'POST',
            '/update-job-progress',
            json={
                'job_id': job_id,
                'success_count': success_count,
                'fail_count': fail_count,
                'client_id': self.client_id
            }
        )
        
    def finish_job(self, job_id: int, final_state: str = 'completed') -> Optional[Dict]:
        """İşi bitir"""
        return self.api_request(
            'POST',
            '/finish-job',
            json={
                'job_id': job_id,
                'final_state': final_state,
                'client_id': self.client_id
            }
        )
        
    def get_status(self) -> Optional[Dict]:
        """Server durumunu al"""
        return self.api_request('GET', '/status')
        
    def emit_progress(self, job_id: int, progress: float, status: str):
        """İlerleme durumunu Socket.IO ile gönder"""
        if self.connected:
            self.sio.emit('job-progress', {
                'job_id': job_id,
                'progress': progress,
                'status': status,
                'client_id': self.client_id
            })
            
    def emit_file_processed(self, file_path: str, status: str, thumbnail_path: str = None, error: str = None):
        """Dosya işleme durumunu gönder"""
        if self.connected:
            self.sio.emit('file-processed', {
                'file_path': file_path,
                'status': status,
                'client_id': self.client_id,
                'thumbnail_path': thumbnail_path,
                'error': error
            })
            
    def start_heartbeat(self, interval: int = 30):
        """Heartbeat başlat"""
        def heartbeat_worker():
            while self.connected:
                time.sleep(interval)
                if self.connected:
                    self.sio.emit('heartbeat', {'client_id': self.client_id})
                    
        if self.connected:
            heartbeat_thread = threading.Thread(target=heartbeat_worker, daemon=True)
            heartbeat_thread.start()