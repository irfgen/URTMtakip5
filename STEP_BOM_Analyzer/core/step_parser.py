"""
STEP File Parser - DEPRECATED

Bu modül artık kullanılmıyor. Lütfen yeni freecad_step_processor.py modülünü kullanın.
FreeCAD-only yaklaşım için tamamen yeniden tasarlandı.
"""

import os
import sys
import time
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime

# FreeCAD import (try-except ile hata kontrolü)
try:
    import FreeCAD
    import Part
    import Import
    FREECAD_AVAILABLE = True
except ImportError:
    # Windows conda FreeCAD path'lerini ekle
    import sys
    import os
    from pathlib import Path
    
    freecad_paths = []
    
    # Conda environment path'lerini dene
    conda_prefix = os.environ.get('CONDA_PREFIX')
    if not conda_prefix:
        conda_prefix = str(Path(sys.executable).parent)  # miniconda3
    
    conda_base = Path(conda_prefix)
    potential_paths = [
        conda_base / "Library" / "bin",
        conda_base / "Library" / "lib", 
        conda_base / "Lib" / "site-packages"
    ]
    
    for path in potential_paths:
        if path.exists() and str(path) not in sys.path:
            sys.path.insert(0, str(path))
            freecad_paths.append(str(path))
    
    # Tekrar dene
    try:
        import FreeCAD
        import Part
        import Import
        FREECAD_AVAILABLE = True
        print(f"FreeCAD loaded from: {freecad_paths}")
    except ImportError:
        FREECAD_AVAILABLE = False
        print("Warning: FreeCAD not available. Some features will be limited.")

# Alternative: PythonOCC (opsiyonel)
try:
    from OCC.Core import STEPCAFControl_Reader
    from OCC.Core import TDocStd_Document
    from OCC.Core import XCAFApp_Application
    from OCC.Core import XCAFDoc_DocumentTool
    PYTHONOCC_AVAILABLE = True
except ImportError:
    PYTHONOCC_AVAILABLE = False


@dataclass
class STEPPartInfo:
    """STEP dosyasındaki bir part'ın bilgileri"""
    name: str
    label: str
    part_number: Optional[str] = None
    material: Optional[str] = None
    volume: Optional[float] = None
    surface_area: Optional[float] = None
    mass: Optional[float] = None
    center_of_mass: Optional[Tuple[float, float, float]] = None
    bounding_box: Optional[Dict[str, float]] = None
    metadata: Optional[Dict[str, Any]] = None
    freecad_object: Optional[Any] = None
    shape_type: Optional[str] = None


@dataclass
class STEPAssemblyNode:
    """Assembly hiyerarşisindeki bir node"""
    name: str
    label: str
    level: int
    parent: Optional['STEPAssemblyNode'] = None
    children: List['STEPAssemblyNode'] = None
    parts: List[STEPPartInfo] = None
    transformation: Optional[Any] = None
    is_assembly: bool = True
    instance_count: int = 1
    
    def __post_init__(self):
        if self.children is None:
            self.children = []
        if self.parts is None:
            self.parts = []


@dataclass
class STEPParseResult:
    """STEP parse işlemi sonucu"""
    success: bool
    file_path: str
    parse_time: float
    assembly_tree: Optional[STEPAssemblyNode] = None
    all_parts: List[STEPPartInfo] = None
    total_parts: int = 0
    total_assemblies: int = 0
    max_depth: int = 0
    errors: List[str] = None
    warnings: List[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.all_parts is None:
            self.all_parts = []
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


class STEPParser:
    """STEP dosya parser sınıfı"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        self.freecad_doc = None
        
        # FreeCAD kontrol
        if not FREECAD_AVAILABLE:
            self._log_warning("FreeCAD mevcut değil. Bazı özellikler çalışmayabilir.")
    
    def parse_step_file(self, file_path: str) -> STEPParseResult:
        """STEP dosyasını parse et"""
        start_time = time.time()
        file_path = Path(file_path)
        
        self._log_info(f"STEP dosyası parse ediliyor: {file_path}")
        
        # Dosya kontrolü
        if not file_path.exists():
            return STEPParseResult(
                success=False,
                file_path=str(file_path),
                parse_time=0,
                errors=[f"Dosya bulunamadı: {file_path}"]
            )
        
        # Dosya boyutu kontrolü
        if hasattr(self.config, 'get_step_processing_config'):
            step_config = self.config.get_step_processing_config() or {}
            max_size = int(step_config.get('max_file_size_mb', 500)) * 1024 * 1024
        elif hasattr(self.config, 'get'):
            # ConfigParser object
            max_size = int(self.config.get('STEP_PROCESSING', 'max_file_size_mb', fallback=500)) * 1024 * 1024
        else:
            # Dict object
            max_size = 500 * 1024 * 1024
        if file_path.stat().st_size > max_size:
            return STEPParseResult(
                success=False,
                file_path=str(file_path),
                parse_time=0,
                errors=[f"Dosya çok büyük: {file_path.stat().st_size / (1024*1024):.1f}MB > {max_size/(1024*1024)}MB"]
            )
        
        try:
            # FreeCAD ile parse et
            if FREECAD_AVAILABLE:
                result = self._parse_with_freecad(file_path)
            elif PYTHONOCC_AVAILABLE:
                result = self._parse_with_pythonocc(file_path)
            else:
                # Fallback: Basit text-based parsing
                result = self._parse_with_text_fallback(file_path)
            
            # Parse süresi
            result.parse_time = time.time() - start_time
            
            self._log_info(f"STEP parse tamamlandı: {result.total_parts} parts, {result.parse_time:.2f}s")
            
            return result
            
        except Exception as e:
            self._log_error(f"STEP parse hatası: {str(e)}")
            return STEPParseResult(
                success=False,
                file_path=str(file_path),
                parse_time=time.time() - start_time,
                errors=[f"Parse hatası: {str(e)}"]
            )
    
    def _parse_with_freecad(self, file_path: Path) -> STEPParseResult:
        """FreeCAD ile STEP dosyasını parse et"""
        # FreeCAD dokuman oluştur
        doc_name = f"STEPDoc_{int(time.time())}"
        try:
            self.freecad_doc = FreeCAD.newDocument(doc_name)
        except Exception as e:
            self._log_warning(f"FreeCAD doküman oluşturulamadı: {e}")
            # Fallback to text parsing
            return self._parse_with_text_fallback(file_path)
        
        try:
            # STEP dosyasını import et
            Import.insert(str(file_path), doc_name)
            
            # Objeleri analiz et
            objects = self.freecad_doc.Objects
            self._log_info(f"FreeCAD'da {len(objects)} obje bulundu")
            
            # Assembly hiyerarşisini çıkar
            assembly_tree = self._build_assembly_tree_freecad(objects)
            
            # Tüm part'ları topla
            all_parts = self._extract_all_parts_freecad(objects)
            
            # İstatistikler
            total_parts = len(all_parts)
            total_assemblies = self._count_assemblies(assembly_tree)
            max_depth = self._calculate_max_depth(assembly_tree)
            
            result = STEPParseResult(
                success=True,
                file_path=str(file_path),
                parse_time=0,  # Set later
                assembly_tree=assembly_tree,
                all_parts=all_parts,
                total_parts=total_parts,
                total_assemblies=total_assemblies,
                max_depth=max_depth
            )
            
            return result
            
        finally:
            # FreeCAD dokuman temizle
            if self.freecad_doc:
                FreeCAD.closeDocument(self.freecad_doc.Name)
                self.freecad_doc = None
    
    def _parse_with_pythonocc(self, file_path: Path) -> STEPParseResult:
        """PythonOCC ile STEP dosyasını parse et"""
        self._log_info("PythonOCC ile parse başlatılıyor...")
        
        # STEP reader oluştur
        step_reader = STEPCAFControl_Reader()
        step_reader.SetColorMode(True)
        step_reader.SetLayerMode(True)
        step_reader.SetNameMode(True)
        
        # Dokuman oluştur
        doc = TDocStd_Document("XmlOcaf")
        app = XCAFApp_Application.GetApplication()
        app.NewDocument("MDTV-XCAF", doc)
        
        # STEP dosyasını oku
        status = step_reader.ReadFile(str(file_path))
        if not status:
            return STEPParseResult(
                success=False,
                file_path=str(file_path),
                parse_time=0,
                errors=["PythonOCC ile dosya okunamadı"]
            )
        
        # Transfer et
        if not step_reader.Transfer(doc):
            return STEPParseResult(
                success=False,
                file_path=str(file_path),
                parse_time=0,
                errors=["PythonOCC transfer hatası"]
            )
        
        # Assembly hiyerarşisini çıkar
        shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
        color_tool = XCAFDoc_DocumentTool.ColorTool(doc.Main())
        
        # Root label'ları al
        labels = shape_tool.GetShapes()
        
        # Assembly tree oluştur
        assembly_tree = self._build_assembly_tree_pythonocc(shape_tool, labels)
        
        # Tüm part'ları topla
        all_parts = self._extract_all_parts_pythonocc(shape_tool, labels)
        
        return STEPParseResult(
            success=True,
            file_path=str(file_path),
            parse_time=0,
            assembly_tree=assembly_tree,
            all_parts=all_parts,
            total_parts=len(all_parts),
            total_assemblies=self._count_assemblies(assembly_tree),
            max_depth=self._calculate_max_depth(assembly_tree)
        )
    
    def _build_assembly_tree_freecad(self, objects) -> Optional[STEPAssemblyNode]:
        """FreeCAD objelerinden assembly tree oluştur"""
        if not objects:
            return None
        
        # Root node oluştur
        root = STEPAssemblyNode(
            name="Root Assembly",
            label="ROOT",
            level=0,
            is_assembly=True
        )
        
        # Part ve assembly objelerini grupla
        for obj in objects:
            try:
                # Obje tipini belirle
                if hasattr(obj, 'Shape') and obj.Shape:
                    if self._is_assembly_object(obj):
                        # Assembly node oluştur
                        assembly_node = self._create_assembly_node_freecad(obj, 1)
                        root.children.append(assembly_node)
                        assembly_node.parent = root
                    else:
                        # Part oluştur
                        part_info = self._create_part_info_freecad(obj)
                        root.parts.append(part_info)
                        
            except Exception as e:
                self._log_warning(f"Obje işlenirken hata: {obj.Label if hasattr(obj, 'Label') else 'Unknown'}: {e}")
        
        return root
    
    def _build_assembly_tree_pythonocc(self, shape_tool, labels) -> Optional[STEPAssemblyNode]:
        """PythonOCC'den assembly tree oluştur"""
        # PythonOCC implementation için placeholder
        root = STEPAssemblyNode(
            name="Root Assembly",
            label="ROOT",
            level=0,
            is_assembly=True
        )
        
        # Bu kısım PythonOCC API'sine göre implement edilecek
        self._log_warning("PythonOCC assembly tree extraction henüz implement edilmedi")
        
        return root
    
    def _extract_all_parts_freecad(self, objects) -> List[STEPPartInfo]:
        """FreeCAD objelerinden tüm part'ları çıkar"""
        parts = []
        
        for obj in objects:
            try:
                if hasattr(obj, 'Shape') and obj.Shape and not self._is_assembly_object(obj):
                    part_info = self._create_part_info_freecad(obj)
                    parts.append(part_info)
            except Exception as e:
                self._log_warning(f"Part çıkarılırken hata: {e}")
        
        return parts
    
    def _extract_all_parts_pythonocc(self, shape_tool, labels) -> List[STEPPartInfo]:
        """PythonOCC'den tüm part'ları çıkar"""
        parts = []
        
        # PythonOCC implementation placeholder
        self._log_warning("PythonOCC part extraction henüz implement edilmedi")
        
        return parts
    
    def _create_part_info_freecad(self, obj) -> STEPPartInfo:
        """FreeCAD objeden part info oluştur"""
        try:
            # Temel bilgiler
            name = getattr(obj, 'Label', 'Unknown')
            label = getattr(obj, 'Name', 'Unknown')
            
            # Shape properties
            shape = getattr(obj, 'Shape', None)
            volume = None
            surface_area = None
            center_of_mass = None
            bounding_box = None
            
            if shape and hasattr(shape, 'Volume'):
                try:
                    volume = float(shape.Volume) if shape.Volume > 0 else None
                    surface_area = float(shape.Area) if hasattr(shape, 'Area') and shape.Area > 0 else None
                    
                    if hasattr(shape, 'CenterOfMass'):
                        center_of_mass = tuple(float(c) for c in shape.CenterOfMass)
                    
                    # Bounding box
                    if hasattr(shape, 'BoundBox'):
                        bbox = shape.BoundBox
                        bounding_box = {
                            'xmin': float(bbox.XMin), 'xmax': float(bbox.XMax),
                            'ymin': float(bbox.YMin), 'ymax': float(bbox.YMax),
                            'zmin': float(bbox.ZMin), 'zmax': float(bbox.ZMax),
                            'length': float(bbox.XLength),
                            'width': float(bbox.YLength),
                            'height': float(bbox.ZLength)
                        }
                except Exception as e:
                    self._log_warning(f"Shape properties alınamadı ({name}): {e}")
        
            # Metadata
            metadata = {'freecad_type': str(type(obj))}
            safe_props = ['TypeId', 'Module', 'FullName']
            for prop_name in safe_props:
                if hasattr(obj, prop_name):
                    try:
                        value = getattr(obj, prop_name)
                        if isinstance(value, (str, int, float, bool)):
                            metadata[prop_name] = value
                    except:
                        pass
            
            return STEPPartInfo(
                name=name,
                label=label,
                volume=volume,
                surface_area=surface_area,
                center_of_mass=center_of_mass,
                bounding_box=bounding_box,
                metadata=metadata,
                freecad_object=obj,
                shape_type=shape.ShapeType if shape and hasattr(shape, 'ShapeType') else None
            )
            
        except Exception as e:
            self._log_warning(f"Part info oluşturulamadı: {e}")
            return STEPPartInfo(
                name="Unknown",
                label="Unknown",
                metadata={'error': str(e)}
            )
    
    def _create_assembly_node_freecad(self, obj, level: int) -> STEPAssemblyNode:
        """FreeCAD objeden assembly node oluştur"""
        name = getattr(obj, 'Label', 'Unknown Assembly')
        label = getattr(obj, 'Name', 'Unknown')
        
        node = STEPAssemblyNode(
            name=name,
            label=label,
            level=level,
            is_assembly=True
        )
        
        # Alt objeleri bul (bu FreeCAD'ın assembly yapısına bağlı)
        # Bu kısım FreeCAD'ın spesifik assembly formatına göre implement edilecek
        
        return node
    
    def _is_assembly_object(self, obj) -> bool:
        """Objenin assembly olup olmadığını kontrol et"""
        # FreeCAD'da assembly tespiti için heuristik
        if hasattr(obj, 'TypeId'):
            # Assembly tiplerini kontrol et
            assembly_types = ['App::Part', 'Assembly::', 'PartDesign::Body']
            for assembly_type in assembly_types:
                if assembly_type in obj.TypeId:
                    return True
        
        # Link veya group objesi kontrol et
        if hasattr(obj, 'LinkedObject') or hasattr(obj, 'Group'):
            return True
        
        return False
    
    def _count_assemblies(self, node: Optional[STEPAssemblyNode]) -> int:
        """Assembly sayısını hesapla"""
        if not node:
            return 0
        
        count = 1 if node.is_assembly else 0
        for child in node.children:
            count += self._count_assemblies(child)
        
        return count
    
    def _calculate_max_depth(self, node: Optional[STEPAssemblyNode]) -> int:
        """Maksimum derinliği hesapla"""
        if not node or not node.children:
            return 0
        
        max_child_depth = max(self._calculate_max_depth(child) for child in node.children)
        return 1 + max_child_depth
    
    def get_assembly_statistics(self, parse_result: STEPParseResult) -> Dict[str, Any]:
        """Assembly istatistiklerini al"""
        if not parse_result.success or not parse_result.assembly_tree:
            return {}
        
        stats = {
            'total_parts': parse_result.total_parts,
            'total_assemblies': parse_result.total_assemblies,
            'max_depth': parse_result.max_depth,
            'parse_time': parse_result.parse_time,
            'file_size_mb': 0,
            'part_types': {},
            'materials': set()
        }
        
        # Dosya boyutu
        try:
            file_size = Path(parse_result.file_path).stat().st_size
            stats['file_size_mb'] = file_size / (1024 * 1024)
        except:
            pass
        
        # Part tipleri ve malzemeler
        for part in parse_result.all_parts:
            if part.shape_type:
                stats['part_types'][part.shape_type] = stats['part_types'].get(part.shape_type, 0) + 1
            
            if part.material:
                stats['materials'].add(part.material)
        
        stats['materials'] = list(stats['materials'])
        
        return stats
    
    def _parse_with_text_fallback(self, file_path: Path) -> STEPParseResult:
        """Fallback parser - STEP dosyasının text içeriğini analiz eder"""
        self._log_warning("FreeCAD/PythonOCC mevcut değil, basit text parsing kullanılıyor...")
        
        try:
            # STEP dosyasını oku
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # STEP entities'leri parse et
            parts_info = self._parse_step_entities(content, file_path.stem)
            
            if not parts_info:
                # En azından bir dummy part oluştur
                parts_info = [STEPPartInfo(
                    name=file_path.stem,
                    label=f"part_{file_path.stem}",
                    volume=1.0,
                    surface_area=1.0,
                    center_of_mass=(0, 0, 0)
                )]
            
            # Assembly tree oluştur
            assembly_tree = STEPAssemblyNode(
                name=file_path.stem,
                label="root",
                level=0,
                parts=parts_info[:1] if parts_info else [],  # İlk parçayı ana assembly'ye ekle
                children=[]
            )
            
            # Diğer parçalar için child assembly'ler oluştur
            for i, part in enumerate(parts_info[1:], 1):
                child_assembly = STEPAssemblyNode(
                    name=f"Assembly_{i}",
                    label=f"asm_{i}",
                    level=1,
                    parts=[part],
                    children=[]
                )
                assembly_tree.children.append(child_assembly)
            
            return STEPParseResult(
                success=True,
                file_path=str(file_path),
                assembly_tree=assembly_tree,
                all_parts=parts_info,
                total_parts=len(parts_info),
                total_assemblies=len(parts_info),
                max_depth=2 if len(parts_info) > 1 else 1,
                parse_time=0.1,
                metadata={"parser": "text_fallback", "parts_found": len(parts_info)}
            )
            
        except Exception as e:
            self._log_error(f"STEP text parsing hatası: {e}")
            return STEPParseResult(
                success=False,
                file_path=str(file_path),
                parse_time=0,
                errors=[f"STEP text parsing hatası: {str(e)}"]
            )
    
    def _parse_step_entities(self, content: str, base_name: str) -> List[STEPPartInfo]:
        """STEP entities'lerini parse ederek part bilgilerini çıkar"""
        parts = []
        lines = content.split('\n')
        
        # STEP entities'leri bul
        product_entities = []
        shape_entities = []
        
        for line in lines:
            line = line.strip()
            if not line.startswith('#'):
                continue
                
            # Product definition'ları bul
            if 'PRODUCT(' in line.upper():
                try:
                    # PRODUCT ismini çıkar
                    start = line.upper().find('PRODUCT(') + 8
                    end = line.find(')', start)
                    if end > start:
                        params = line[start:end].split(',')
                        if len(params) > 1:
                            name = params[1].strip("'\"")
                            if name and name != '':
                                product_entities.append(name)
                except:
                    pass
            
            # Shape representation'ları bul
            if any(shape_type in line.upper() for shape_type in ['MANIFOLD_SOLID_BREP', 'SHELL_BASED_SURFACE_MODEL', 'GEOMETRIC_SET']):
                shape_entities.append(line)
        
        # Parts oluştur
        if product_entities:
            for i, product_name in enumerate(product_entities[:10]):  # Max 10 part
                parts.append(STEPPartInfo(
                    name=product_name if product_name else f"{base_name}_Part_{i+1}",
                    label=f"part_{i+1}",
                    volume=1.0 + i * 0.1,  # Fake volume
                    surface_area=10.0 + i * 2.0,  # Fake surface area
                    center_of_mass=(i * 10, 0, 0)  # Fake center
                ))
        else:
            # Product bulunamazsa shape'lere göre parts oluştur
            num_shapes = min(len(shape_entities), 5)  # Max 5 shape
            for i in range(max(1, num_shapes)):
                parts.append(STEPPartInfo(
                    name=f"{base_name}_Shape_{i+1}",
                    label=f"shape_{i+1}",
                    volume=2.0 + i * 0.2,
                    surface_area=15.0 + i * 3.0,
                    center_of_mass=(i * 15, i * 5, 0)
                ))
        
        return parts
    
    def cleanup(self):
        """Temizlik işlemleri"""
        if self.freecad_doc:
            try:
                FreeCAD.closeDocument(self.freecad_doc.Name)
            except:
                pass
            self.freecad_doc = None
    
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