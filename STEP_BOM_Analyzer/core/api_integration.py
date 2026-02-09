"""
API Integration Module

ÜRTM Takip sistemi ile entegrasyon için API istemcisi.
Part data senkronizasyonu, BOM yükleme ve doğrulama işlevleri.
"""

import requests
import json
import time
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urljoin

from .bom_extractor_v2 import BOMStructureV2, BOMItemV2
from .freecad_visualizer import BatchRenderResult


@dataclass
class APIConfig:
    """API konfigürasyon sınıfı"""
    base_url: str = "http://192.168.1.206:3000"
    api_base: str = "/api/cad-import"
    timeout: int = 30
    verify_ssl: bool = True
    cert_path: str = ""
    
    # Client kimlik bilgileri
    client_name: str = "STEP BOM Analyzer"
    client_id_prefix: str = "step_analyzer"
    auto_register: bool = True
    
    # Request ayarları
    batch_size: int = 50
    concurrent_requests: int = 3
    retry_attempts: int = 3
    retry_delay_seconds: int = 2


@dataclass 
class PartSyncResult:
    """Part senkronizasyon sonucu"""
    part_number: str
    success: bool
    action: str  # "created", "updated", "existed", "failed"
    server_part_id: Optional[str] = None
    error_message: Optional[str] = None
    response_data: Optional[Dict] = None


@dataclass
class BOMSyncResult:
    """BOM senkronizasyon sonucu"""
    success: bool
    assembly_name: str
    total_parts: int
    synced_parts: int
    failed_parts: int
    created_parts: int
    updated_parts: int
    existing_parts: int
    sync_time: float
    part_results: List[PartSyncResult] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    server_bom_id: Optional[str] = None


@dataclass
class ServerStatus:
    """Server durumu"""
    online: bool
    response_time: float
    server_version: Optional[str] = None
    client_registered: bool = False
    client_id: Optional[str] = None
    last_check: datetime = field(default_factory=datetime.now)


class URTMTakipAPIClient:
    """ÜRTM Takip sistemi API istemcisi"""
    
    def __init__(self, config: APIConfig = None, logger=None):
        self.config = config or APIConfig()
        self.logger = logger
        self.session = requests.Session()
        self.client_id = None
        self.server_status = ServerStatus(online=False, response_time=0.0)
        
        # Session headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': f'{self.config.client_name}/2.0',
            'Accept': 'application/json'
        })
        
        # SSL ayarları
        if not self.config.verify_ssl:
            self.session.verify = False
        elif self.config.cert_path:
            self.session.verify = self.config.cert_path
        
        self._log_info("ÜRTM Takip API Client initialized")
    
    def check_server_status(self) -> ServerStatus:
        """Server durumunu kontrol et"""
        
        start_time = time.time()
        
        try:
            # Health check endpoint
            health_url = urljoin(self.config.base_url, "/health")
            
            response = self.session.get(
                health_url,
                timeout=self.config.timeout
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json() if response.content else {}
                
                self.server_status = ServerStatus(
                    online=True,
                    response_time=response_time,
                    server_version=data.get('version'),
                    last_check=datetime.now()
                )
                
                self._log_info(f"Server online: {response_time:.2f}s response time")
                
            else:
                self.server_status = ServerStatus(
                    online=False,
                    response_time=response_time,
                    last_check=datetime.now()
                )
                self._log_warning(f"Server returned status {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            response_time = time.time() - start_time
            self.server_status = ServerStatus(
                online=False,
                response_time=response_time,
                last_check=datetime.now()
            )
            self._log_error(f"Server check failed: {e}")
        
        return self.server_status
    
    def register_client(self) -> bool:
        """Client'i server'a kaydet"""
        
        if not self.server_status.online:
            if not self.check_server_status().online:
                self._log_error("Cannot register client - server offline")
                return False
        
        try:
            # Client ID oluştur
            timestamp = int(time.time())
            client_hash = hashlib.md5(
                f"{self.config.client_name}_{timestamp}".encode()
            ).hexdigest()[:8]
            
            self.client_id = f"{self.config.client_id_prefix}_{client_hash}"
            
            # Registration data
            registration_data = {
                'client_id': self.client_id,
                'client_name': self.config.client_name,
                'client_type': 'step_analyzer',
                'version': '2.0',
                'capabilities': [
                    'step_import',
                    'bom_extraction', 
                    'part_rendering',
                    'visual_reporting'
                ],
                'registered_at': datetime.now().isoformat()
            }
            
            # Register endpoint
            register_url = urljoin(self.config.base_url, f"{self.config.api_base}/register")
            
            response = self.session.post(
                register_url,
                json=registration_data,
                timeout=self.config.timeout
            )
            
            if response.status_code in [200, 201]:
                self.server_status.client_registered = True
                self.server_status.client_id = self.client_id
                self._log_info(f"Client registered successfully: {self.client_id}")
                return True
            else:
                self._log_error(f"Client registration failed: {response.status_code}")
                return False
                
        except Exception as e:
            self._log_error(f"Client registration exception: {e}")
            return False
    
    def sync_bom_structure(self, 
                          bom_structure: BOMStructureV2,
                          render_result: BatchRenderResult = None,
                          include_images: bool = True) -> BOMSyncResult:
        """BOM yapısını server ile senkronize et"""
        
        start_time = time.time()
        
        # Ensure client is registered
        if not self.server_status.client_registered:
            if not self.register_client():
                return BOMSyncResult(
                    success=False,
                    assembly_name=bom_structure.assembly_name,
                    total_parts=0,
                    synced_parts=0,
                    failed_parts=0,
                    created_parts=0,
                    updated_parts=0,
                    existing_parts=0,
                    sync_time=time.time() - start_time,
                    errors=["Client registration failed"]
                )
        
        self._log_info(f"BOM senkronizasyon başlatılıyor: {bom_structure.assembly_name}")
        
        part_results = []
        created_count = 0
        updated_count = 0
        existing_count = 0
        failed_count = 0
        
        # Sync parts in batches
        for i in range(0, len(bom_structure.items), self.config.batch_size):
            batch = bom_structure.items[i:i + self.config.batch_size]
            
            self._log_info(f"Processing batch {i//self.config.batch_size + 1}: "
                          f"{len(batch)} parts")
            
            for item in batch:
                # Get render data for this part
                render_data = None
                if render_result and include_images:
                    render_data = self._get_part_render_data(item, render_result)
                
                # Sync individual part
                sync_result = self._sync_single_part(item, render_data)
                part_results.append(sync_result)
                
                # Count results
                if sync_result.success:
                    if sync_result.action == "created":
                        created_count += 1
                    elif sync_result.action == "updated":
                        updated_count += 1
                    elif sync_result.action == "existed":
                        existing_count += 1
                else:
                    failed_count += 1
                
                # Brief delay between requests
                time.sleep(0.1)
        
        # Create BOM assembly record
        server_bom_id = None
        if part_results and any(r.success for r in part_results):
            server_bom_id = self._create_bom_assembly_record(bom_structure, part_results)
        
        sync_time = time.time() - start_time
        synced_parts = created_count + updated_count + existing_count
        
        result = BOMSyncResult(
            success=synced_parts > 0,
            assembly_name=bom_structure.assembly_name,
            total_parts=len(bom_structure.items),
            synced_parts=synced_parts,
            failed_parts=failed_count,
            created_parts=created_count,
            updated_parts=updated_count,
            existing_parts=existing_count,
            sync_time=sync_time,
            part_results=part_results,
            server_bom_id=server_bom_id
        )
        
        self._log_info(f"BOM sync tamamlandı: {synced_parts}/{len(bom_structure.items)} "
                      f"parts synced ({sync_time:.2f}s)")
        
        return result
    
    def _sync_single_part(self, 
                         bom_item: BOMItemV2,
                         render_data: Dict = None) -> PartSyncResult:
        """Tek part'ı senkronize et"""
        
        try:
            # Part data hazırla
            part_data = self._prepare_part_data(bom_item, render_data)
            
            # Check if part exists
            existing_part = self._check_part_exists(bom_item.part_number)
            
            if existing_part:
                # Update existing part
                return self._update_part(bom_item.part_number, part_data, existing_part)
            else:
                # Create new part
                return self._create_part(part_data)
                
        except Exception as e:
            return PartSyncResult(
                part_number=bom_item.part_number,
                success=False,
                action="failed",
                error_message=str(e)
            )
    
    def _prepare_part_data(self, bom_item: BOMItemV2, render_data: Dict = None) -> Dict:
        """Part verilerini API format'a hazırla"""
        
        part_data = {
            'part_number': bom_item.part_number,
            'part_name': bom_item.part_name,
            'description': bom_item.description or '',
            'category': bom_item.category or 'Unknown',
            'shape_type': bom_item.shape_type or 'Unknown',
            'volume': bom_item.volume or 0.0,
            'surface_area': bom_item.surface_area or 0.0,
            'center_of_mass': bom_item.center_of_mass,
            'bounding_box': bom_item.bounding_box or {},
            'color': bom_item.color,
            'material': bom_item.properties.get('material', '') if bom_item.properties else '',
            'weight': bom_item.properties.get('weight', 0.0) if bom_item.properties else 0.0,
            
            # STEP BOM specific fields
            'source_assembly': bom_item.parent_assembly,
            'assembly_path': bom_item.assembly_path,
            'level': bom_item.level,
            'quantity': bom_item.quantity,
            'source_file': 'step_import',
            'import_date': datetime.now().isoformat(),
            'client_id': self.client_id
        }
        
        # Add render data if available
        if render_data:
            part_data.update({
                'has_thumbnail': render_data.get('has_thumbnail', False),
                'image_count': render_data.get('image_count', 0),
                'render_viewpoints': render_data.get('viewpoints', []),
                'thumbnail_base64': render_data.get('thumbnail_base64'),
                'images_base64': render_data.get('images_base64', [])
            })
        
        return part_data
    
    def _get_part_render_data(self, bom_item: BOMItemV2, render_result: BatchRenderResult) -> Dict:
        """Part render verilerini al"""
        
        render_data = {
            'has_thumbnail': False,
            'image_count': 0,
            'viewpoints': [],
            'thumbnail_base64': None,
            'images_base64': []
        }
        
        if not render_result or not render_result.results:
            return render_data
        
        # Find render result for this part
        part_render = None
        for result in render_result.results:
            if (result.success and result.part_info and 
                result.part_info.part_number == bom_item.part_number):
                part_render = result
                break
        
        if not part_render:
            return render_data
        
        # Process thumbnail
        if part_render.thumbnail_path and Path(part_render.thumbnail_path).exists():
            try:
                with open(part_render.thumbnail_path, 'rb') as f:
                    import base64
                    thumbnail_data = base64.b64encode(f.read()).decode('utf-8')
                    render_data['thumbnail_base64'] = thumbnail_data
                    render_data['has_thumbnail'] = True
            except Exception as e:
                self._log_warning(f"Thumbnail encoding failed for {bom_item.part_number}: {e}")
        
        # Process screenshots
        valid_images = []
        viewpoints = []
        
        for screenshot_path in part_render.screenshot_paths:
            if Path(screenshot_path).exists():
                try:
                    with open(screenshot_path, 'rb') as f:
                        import base64
                        image_data = base64.b64encode(f.read()).decode('utf-8')
                        valid_images.append(image_data)
                        
                        # Extract viewpoint from filename
                        filename = Path(screenshot_path).stem
                        viewpoint = filename.split('_')[-1] if '_' in filename else 'unknown'
                        viewpoints.append(viewpoint)
                        
                except Exception as e:
                    self._log_warning(f"Image encoding failed for {screenshot_path}: {e}")
        
        render_data.update({
            'image_count': len(valid_images),
            'viewpoints': viewpoints,
            'images_base64': valid_images
        })
        
        return render_data
    
    def _check_part_exists(self, part_number: str) -> Optional[Dict]:
        """Part'ın server'da olup olmadığını kontrol et"""
        
        try:
            check_url = urljoin(self.config.base_url, 
                               f"{self.config.api_base}/parts/{part_number}")
            
            response = self.session.get(check_url, timeout=self.config.timeout)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return None
            else:
                self._log_warning(f"Part check failed for {part_number}: {response.status_code}")
                return None
                
        except Exception as e:
            self._log_warning(f"Part check exception for {part_number}: {e}")
            return None
    
    def _create_part(self, part_data: Dict) -> PartSyncResult:
        """Yeni part oluştur"""
        
        try:
            create_url = urljoin(self.config.base_url, f"{self.config.api_base}/parts")
            
            response = self.session.post(
                create_url,
                json=part_data,
                timeout=self.config.timeout
            )
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                return PartSyncResult(
                    part_number=part_data['part_number'],
                    success=True,
                    action="created",
                    server_part_id=response_data.get('id'),
                    response_data=response_data
                )
            else:
                return PartSyncResult(
                    part_number=part_data['part_number'],
                    success=False,
                    action="failed",
                    error_message=f"Create failed: {response.status_code}"
                )
                
        except Exception as e:
            return PartSyncResult(
                part_number=part_data['part_number'],
                success=False,
                action="failed",
                error_message=str(e)
            )
    
    def _update_part(self, part_number: str, part_data: Dict, existing_part: Dict) -> PartSyncResult:
        """Mevcut part'ı güncelle"""
        
        try:
            # Check if update is needed
            if not self._part_needs_update(part_data, existing_part):
                return PartSyncResult(
                    part_number=part_number,
                    success=True,
                    action="existed",
                    server_part_id=existing_part.get('id'),
                    response_data=existing_part
                )
            
            # Update part
            update_url = urljoin(self.config.base_url, 
                               f"{self.config.api_base}/parts/{part_number}")
            
            response = self.session.put(
                update_url,
                json=part_data,
                timeout=self.config.timeout
            )
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                return PartSyncResult(
                    part_number=part_number,
                    success=True,
                    action="updated",
                    server_part_id=response_data.get('id'),
                    response_data=response_data
                )
            else:
                return PartSyncResult(
                    part_number=part_number,
                    success=False,
                    action="failed",
                    error_message=f"Update failed: {response.status_code}"
                )
                
        except Exception as e:
            return PartSyncResult(
                part_number=part_number,
                success=False,
                action="failed",
                error_message=str(e)
            )
    
    def _part_needs_update(self, new_data: Dict, existing_data: Dict) -> bool:
        """Part'ın güncellenmesi gerekip gerekmediğini kontrol et"""
        
        # Key fields to compare
        compare_fields = [
            'part_name', 'description', 'category', 'shape_type',
            'volume', 'surface_area', 'material', 'weight'
        ]
        
        for field in compare_fields:
            new_value = new_data.get(field)
            existing_value = existing_data.get(field)
            
            # Handle None values and type differences
            if new_value != existing_value:
                # Special handling for numeric fields
                if field in ['volume', 'surface_area', 'weight']:
                    new_val = float(new_value or 0)
                    existing_val = float(existing_value or 0)
                    if abs(new_val - existing_val) > 0.01:  # 0.01 tolerance
                        return True
                else:
                    return True
        
        # Check if new images are available
        if new_data.get('has_thumbnail') and not existing_data.get('has_thumbnail'):
            return True
        
        if new_data.get('image_count', 0) > existing_data.get('image_count', 0):
            return True
        
        return False
    
    def _create_bom_assembly_record(self, 
                                   bom_structure: BOMStructureV2,
                                   part_results: List[PartSyncResult]) -> Optional[str]:
        """BOM assembly kaydı oluştur"""
        
        try:
            # Successful part IDs
            part_ids = [r.server_part_id for r in part_results 
                       if r.success and r.server_part_id]
            
            if not part_ids:
                return None
            
            # Assembly data
            assembly_data = {
                'assembly_name': bom_structure.assembly_name,
                'source_file': bom_structure.source_file,
                'total_parts': bom_structure.total_parts,
                'total_assemblies': bom_structure.total_assemblies,
                'max_level': bom_structure.max_level,
                'created_date': bom_structure.created_date.isoformat(),
                'import_date': datetime.now().isoformat(),
                'client_id': self.client_id,
                'part_ids': part_ids,
                'bom_structure': {
                    'items': [
                        {
                            'part_number': item.part_number,
                            'part_name': item.part_name,
                            'quantity': item.quantity,
                            'level': item.level,
                            'assembly_path': item.assembly_path,
                            'parent_assembly': item.parent_assembly
                        }
                        for item in bom_structure.items
                    ]
                }
            }
            
            # Create assembly
            assembly_url = urljoin(self.config.base_url, f"{self.config.api_base}/assemblies")
            
            response = self.session.post(
                assembly_url,
                json=assembly_data,
                timeout=self.config.timeout
            )
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                assembly_id = response_data.get('id')
                self._log_info(f"BOM assembly record created: {assembly_id}")
                return assembly_id
            else:
                self._log_error(f"Assembly record creation failed: {response.status_code}")
                return None
                
        except Exception as e:
            self._log_error(f"Assembly record creation exception: {e}")
            return None
    
    def get_part_info(self, part_number: str) -> Optional[Dict]:
        """Server'dan part bilgisi al"""
        return self._check_part_exists(part_number)
    
    def search_parts(self, query: str, limit: int = 100) -> List[Dict]:
        """Part arama"""
        
        try:
            search_url = urljoin(self.config.base_url, f"{self.config.api_base}/parts/search")
            
            params = {
                'q': query,
                'limit': limit,
                'client_id': self.client_id
            }
            
            response = self.session.get(
                search_url,
                params=params,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                return response.json().get('parts', [])
            else:
                self._log_warning(f"Part search failed: {response.status_code}")
                return []
                
        except Exception as e:
            self._log_error(f"Part search exception: {e}")
            return []
    
    def close(self):
        """Session'ı kapat"""
        if self.session:
            self.session.close()
    
    def _log_info(self, message: str):
        if self.logger:
            self.logger.info(message)
    
    def _log_warning(self, message: str):
        if self.logger:
            self.logger.warning(message)
    
    def _log_error(self, message: str):
        if self.logger:
            self.logger.error(message)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# Test function
def test_api_integration():
    """Test API Integration"""
    from .bom_extractor_v2 import BOMStructureV2, BOMItemV2  
    from ..utils.logger import STEPAnalyzerLogger
    from ..utils.config_manager import ConfigManager
    from datetime import datetime
    
    logger = STEPAnalyzerLogger()
    config_manager = ConfigManager(logger=logger)
    
    print("=== API Integration Test ===")
    
    # API Config from config.ini
    api_config = APIConfig()
    if hasattr(config_manager, 'get_server_config'):
        server_config = config_manager.get_server_config()
        if server_config:
            api_config.base_url = server_config.get('url', api_config.base_url)
            api_config.api_base = server_config.get('api_base', api_config.api_base)
            api_config.timeout = int(server_config.get('timeout', api_config.timeout))
            api_config.verify_ssl = server_config.get('verify_ssl', 'true').lower() == 'true'
    
    try:
        with URTMTakipAPIClient(api_config, logger) as client:
            print("✅ API Client initialized")
            
            # Test server status
            print("🔍 Checking server status...")
            status = client.check_server_status()
            print(f"   Server online: {status.online}")
            print(f"   Response time: {status.response_time:.2f}s")
            
            if not status.online:
                print("⚠️ Server offline - testing with mock data only")
                return True
            
            # Test client registration
            print("📝 Registering client...")
            if client.register_client():
                print(f"   Client registered: {client.client_id}")
            else:
                print("   Client registration failed")
                return False
            
            # Create mock BOM for testing
            mock_items = [
                BOMItemV2(
                    item_number=1,
                    part_number="TEST_HOUSING_001",
                    part_name="Test Housing",
                    description="Test housing for API integration",
                    quantity=1,
                    level=1,
                    parent_assembly="TEST_ASM",
                    node_type="part",
                    shape_type="Solid",
                    volume=1500.0,
                    category="Test Parts"
                )
            ]
            
            mock_bom = BOMStructureV2(
                assembly_name="Test API Assembly",
                total_items=1,
                total_parts=1,
                total_assemblies=0,
                max_level=1,
                created_date=datetime.now(),
                source_file="api_test.step",
                items=mock_items
            )
            
            # Test BOM sync
            print("🔄 Testing BOM synchronization...")
            sync_result = client.sync_bom_structure(mock_bom, None, include_images=False)
            
            print(f"   Sync success: {sync_result.success}")
            print(f"   Synced parts: {sync_result.synced_parts}/{sync_result.total_parts}")
            print(f"   Created: {sync_result.created_parts}, Updated: {sync_result.updated_parts}")
            print(f"   Sync time: {sync_result.sync_time:.2f}s")
            
            if sync_result.errors:
                print("   Errors:")
                for error in sync_result.errors:
                    print(f"     - {error}")
            
            return sync_result.success
        
    except Exception as e:
        logger.error(f"API integration test failed: {e}")
        print(f"❌ Test failed: {e}")
        return False


if __name__ == "__main__":
    test_api_integration()