"""
FreeCAD STEP Processor

Tamamen FreeCAD tabanlı STEP dosya import ve analiz modülü.
STL dönüşümü olmadan direkt FreeCAD ile assembly hiyerarşisi ve part analizi.
"""

import os
import sys
import time
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime

# FreeCAD import with error handling
try:
    import FreeCAD
    import Part
    import Import
    FREECAD_AVAILABLE = True
except ImportError:
    # Try alternative FreeCAD paths
    possible_paths = [
        "C:/Program Files/FreeCAD 0.20/bin",
        "C:/Program Files/FreeCAD 0.21/bin", 
        "/usr/lib/freecad/lib",
        "/usr/local/lib/freecad/lib"
    ]
    
    for path in possible_paths:
        if os.path.exists(path) and path not in sys.path:
            sys.path.insert(0, path)
    
    try:
        import FreeCAD
        import Part
        import Import
        FREECAD_AVAILABLE = True
    except ImportError:
        FREECAD_AVAILABLE = False


@dataclass
class PartInfo:
    """STEP Part bilgileri"""
    name: str
    label: str
    part_number: str
    shape_type: str
    volume: float = 0.0
    surface_area: float = 0.0
    center_of_mass: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    bounding_box: Dict[str, float] = field(default_factory=dict)
    material: Optional[str] = None
    color: Optional[Tuple[float, float, float]] = None
    properties: Dict[str, Any] = field(default_factory=dict)
    freecad_object: Any = None


@dataclass  
class AssemblyNode:
    """Assembly hiyerarşi node'u"""
    name: str
    label: str
    node_type: str  # 'assembly', 'part', 'compound'
    level: int
    parent: Optional['AssemblyNode'] = None
    children: List['AssemblyNode'] = field(default_factory=list)
    part_info: Optional[PartInfo] = None
    instance_count: int = 1
    transformation_matrix: Optional[Any] = None


@dataclass
class STEPImportResult:
    """STEP import sonucu"""
    success: bool
    step_file: str
    root_assembly: Optional[AssemblyNode] = None
    all_parts: List[PartInfo] = field(default_factory=list)
    assembly_tree: Dict[str, Any] = field(default_factory=dict)
    import_time: float = 0.0
    total_parts: int = 0
    total_assemblies: int = 0
    max_hierarchy_depth: int = 0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    freecad_document: Any = None


class FreeCADStepProcessor:
    """FreeCAD tabanlı STEP işlemci"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        self.freecad_doc = None
        
        # FreeCAD availability check
        if not FREECAD_AVAILABLE:
            raise ImportError("FreeCAD is not available. Please install FreeCAD and ensure it's in Python path.")
        
        # Config values
        self.max_file_size_mb = self._get_config('max_file_size_mb', 500)
        self.timeout_seconds = self._get_config('timeout_seconds', 300) 
        self.max_hierarchy_depth = self._get_config('max_assembly_depth', 20)
        self.precision = self._get_config('freecad_precision', 0.1)
        
        self._log_info("FreeCAD STEP Processor initialized")
    
    def import_step_file(self, step_file_path: str) -> STEPImportResult:
        """STEP dosyasını import et ve analiz et"""
        start_time = time.time()
        step_path = Path(step_file_path)
        
        # File validation
        validation_result = self._validate_step_file(step_path)
        if not validation_result['valid']:
            return STEPImportResult(
                success=False,
                step_file=str(step_path),
                errors=validation_result['errors']
            )
        
        self._log_info(f"Starting STEP import: {step_file_path}")
        
        try:
            # Create new FreeCAD document
            doc_name = f"STEPImport_{int(time.time())}"
            self.freecad_doc = FreeCAD.newDocument(doc_name)
            
            # Import STEP file
            self._log_info("Importing STEP file into FreeCAD...")
            Import.insert(str(step_path), doc_name)
            self.freecad_doc.recompute()
            
            # Analyze imported objects
            import_result = self._analyze_imported_objects(str(step_path), start_time)
            import_result.freecad_document = self.freecad_doc
            
            self._log_info(f"STEP import completed: {import_result.total_parts} parts, "
                          f"{import_result.total_assemblies} assemblies ({import_result.import_time:.2f}s)")
            
            return import_result
            
        except Exception as e:
            error_msg = f"STEP import failed: {str(e)}"
            self._log_error(error_msg)
            
            # Cleanup document
            if self.freecad_doc:
                try:
                    FreeCAD.closeDocument(self.freecad_doc.Name)
                except:
                    pass
                self.freecad_doc = None
            
            return STEPImportResult(
                success=False,
                step_file=str(step_path),
                import_time=time.time() - start_time,
                errors=[error_msg]
            )
    
    def _validate_step_file(self, step_path: Path) -> Dict[str, Any]:
        """STEP dosyasını validate et"""
        errors = []
        
        # File existence
        if not step_path.exists():
            errors.append(f"File not found: {step_path}")
        
        # File extension
        if step_path.suffix.lower() not in ['.step', '.stp']:
            errors.append(f"Invalid file extension: {step_path.suffix}")
        
        # File size
        try:
            file_size_mb = step_path.stat().st_size / (1024 * 1024)
            if file_size_mb > self.max_file_size_mb:
                errors.append(f"File too large: {file_size_mb:.1f}MB > {self.max_file_size_mb}MB")
        except:
            errors.append("Cannot determine file size")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'file_size_mb': file_size_mb if 'file_size_mb' in locals() else 0
        }
    
    def _analyze_imported_objects(self, step_file: str, start_time: float) -> STEPImportResult:
        """Import edilmiş objeleri analiz et"""
        all_objects = self.freecad_doc.Objects
        self._log_info(f"Analyzing {len(all_objects)} imported objects...")
        
        # Root level objects (no parent)
        root_objects = [obj for obj in all_objects if not hasattr(obj, 'InList') or len(obj.InList) == 0]
        
        # Build assembly hierarchy
        root_assembly = None
        all_parts = []
        assembly_count = 0
        max_depth = 0
        
        if len(root_objects) == 1:
            # Single root assembly
            root_obj = root_objects[0]
            root_assembly = self._build_assembly_tree(root_obj, level=0)
            assembly_count, part_count, max_depth = self._count_hierarchy(root_assembly)
            all_parts = self._extract_all_parts(root_assembly)
        else:
            # Multiple root objects - create virtual root
            root_assembly = AssemblyNode(
                name="Root_Assembly",
                label="Root Assembly", 
                node_type="assembly",
                level=0
            )
            
            for obj in root_objects:
                child_node = self._build_assembly_tree(obj, level=1, parent=root_assembly)
                root_assembly.children.append(child_node)
            
            assembly_count, part_count, max_depth = self._count_hierarchy(root_assembly)
            all_parts = self._extract_all_parts(root_assembly)
        
        # Build assembly tree dictionary
        assembly_tree = self._build_tree_dict(root_assembly) if root_assembly else {}
        
        return STEPImportResult(
            success=True,
            step_file=step_file,
            root_assembly=root_assembly,
            all_parts=all_parts,
            assembly_tree=assembly_tree,
            import_time=time.time() - start_time,
            total_parts=len(all_parts),
            total_assemblies=assembly_count,
            max_hierarchy_depth=max_depth,
            freecad_document=self.freecad_doc
        )
    
    def _build_assembly_tree(self, freecad_obj, level: int = 0, parent: AssemblyNode = None) -> AssemblyNode:
        """FreeCAD objeden assembly tree oluştur"""
        
        # Object basic info
        name = getattr(freecad_obj, 'Name', 'Unknown')
        label = getattr(freecad_obj, 'Label', name)
        
        # Determine object type
        node_type = self._determine_object_type(freecad_obj)
        
        # Create assembly node
        node = AssemblyNode(
            name=name,
            label=label,
            node_type=node_type,
            level=level,
            parent=parent
        )
        
        # If it's a part, extract part info
        if node_type == 'part' and hasattr(freecad_obj, 'Shape'):
            node.part_info = self._extract_part_info(freecad_obj)
        
        # Process children (for assemblies/compounds)
        if hasattr(freecad_obj, 'OutList'):
            for child_obj in freecad_obj.OutList:
                if level < self.max_hierarchy_depth:
                    child_node = self._build_assembly_tree(child_obj, level + 1, parent=node)
                    node.children.append(child_node)
        
        # For compound objects, also check Links
        if hasattr(freecad_obj, 'Links'):
            for link_obj in freecad_obj.Links:
                if level < self.max_hierarchy_depth:
                    child_node = self._build_assembly_tree(link_obj, level + 1, parent=node)
                    node.children.append(child_node)
        
        return node
    
    def _determine_object_type(self, freecad_obj) -> str:
        """FreeCAD object tipini belirle"""
        obj_type = type(freecad_obj).__name__
        
        if hasattr(freecad_obj, 'Shape') and freecad_obj.Shape:
            shape_type = freecad_obj.Shape.ShapeType
            if shape_type in ['Solid', 'CompSolid']:
                return 'part'
            elif shape_type in ['Compound', 'CompCompound']:
                return 'assembly' if hasattr(freecad_obj, 'OutList') and freecad_obj.OutList else 'compound'
        
        # Fallback based on object type
        if 'Part' in obj_type or 'Body' in obj_type:
            return 'part'
        elif 'Assembly' in obj_type or 'Group' in obj_type:
            return 'assembly'
        else:
            return 'compound'
    
    def _extract_part_info(self, freecad_obj) -> PartInfo:
        """FreeCAD object'ten part bilgilerini çıkar"""
        name = getattr(freecad_obj, 'Name', 'Unknown')
        label = getattr(freecad_obj, 'Label', name)
        
        # Generate part number
        part_number = self._generate_part_number(label)
        
        # Shape analysis
        shape_type = 'Unknown'
        volume = 0.0
        surface_area = 0.0
        center_of_mass = (0.0, 0.0, 0.0)
        bounding_box = {}
        
        if hasattr(freecad_obj, 'Shape') and freecad_obj.Shape:
            shape = freecad_obj.Shape
            shape_type = shape.ShapeType
            
            try:
                # Volume (for solids)
                if hasattr(shape, 'Volume'):
                    volume = float(shape.Volume)
                
                # Surface area
                if hasattr(shape, 'Area'):
                    surface_area = float(shape.Area)
                
                # Center of mass
                if hasattr(shape, 'CenterOfMass'):
                    com = shape.CenterOfMass
                    center_of_mass = (float(com.x), float(com.y), float(com.z))
                
                # Bounding box
                if hasattr(shape, 'BoundBox'):
                    bb = shape.BoundBox
                    bounding_box = {
                        'x_min': float(bb.XMin), 'x_max': float(bb.XMax),
                        'y_min': float(bb.YMin), 'y_max': float(bb.YMax),
                        'z_min': float(bb.ZMin), 'z_max': float(bb.ZMax),
                        'x_length': float(bb.XLength),
                        'y_length': float(bb.YLength), 
                        'z_length': float(bb.ZLength)
                    }
                
            except Exception as e:
                self._log_warning(f"Shape analysis error for {name}: {e}")
        
        # Color information
        color = None
        if hasattr(freecad_obj, 'ViewObject') and freecad_obj.ViewObject:
            try:
                if hasattr(freecad_obj.ViewObject, 'ShapeColor'):
                    shape_color = freecad_obj.ViewObject.ShapeColor
                    color = (shape_color[0], shape_color[1], shape_color[2])
            except:
                pass
        
        # Additional properties
        properties = {}
        if hasattr(freecad_obj, 'PropertiesList'):
            for prop_name in freecad_obj.PropertiesList:
                try:
                    prop_value = getattr(freecad_obj, prop_name)
                    if isinstance(prop_value, (str, int, float, bool)):
                        properties[prop_name] = prop_value
                except:
                    continue
        
        return PartInfo(
            name=name,
            label=label,
            part_number=part_number,
            shape_type=shape_type,
            volume=volume,
            surface_area=surface_area,
            center_of_mass=center_of_mass,
            bounding_box=bounding_box,
            color=color,
            properties=properties,
            freecad_object=freecad_obj
        )
    
    def _generate_part_number(self, label: str) -> str:
        """Label'den part number oluştur"""
        import re
        
        # Clean label
        part_number = re.sub(r'[^\w\-\.]', '_', label)
        part_number = re.sub(r'_+', '_', part_number)
        part_number = part_number.strip('_')
        
        if not part_number:
            part_number = f"PART_{int(time.time() * 1000) % 100000}"
        
        return part_number
    
    def _count_hierarchy(self, node: AssemblyNode) -> Tuple[int, int, int]:
        """Hiyerarşi istatistiklerini say"""
        assembly_count = 1 if node.node_type == 'assembly' else 0
        part_count = 1 if node.node_type == 'part' else 0
        max_depth = node.level
        
        for child in node.children:
            child_assemblies, child_parts, child_depth = self._count_hierarchy(child)
            assembly_count += child_assemblies
            part_count += child_parts
            max_depth = max(max_depth, child_depth)
        
        return assembly_count, part_count, max_depth
    
    def _extract_all_parts(self, node: AssemblyNode) -> List[PartInfo]:
        """Hiyerarşiden tüm part'ları çıkar"""
        parts = []
        
        if node.part_info:
            parts.append(node.part_info)
        
        for child in node.children:
            parts.extend(self._extract_all_parts(child))
        
        return parts
    
    def _build_tree_dict(self, node: AssemblyNode) -> Dict[str, Any]:
        """Assembly node'u dictionary'e dönüştür"""
        tree_dict = {
            'name': node.name,
            'label': node.label,
            'type': node.node_type,
            'level': node.level,
            'instance_count': node.instance_count,
            'children': []
        }
        
        if node.part_info:
            tree_dict['part_info'] = {
                'part_number': node.part_info.part_number,
                'shape_type': node.part_info.shape_type,
                'volume': node.part_info.volume,
                'surface_area': node.part_info.surface_area,
                'center_of_mass': node.part_info.center_of_mass,
                'bounding_box': node.part_info.bounding_box
            }
        
        for child in node.children:
            tree_dict['children'].append(self._build_tree_dict(child))
        
        return tree_dict
    
    def get_parts_by_type(self, import_result: STEPImportResult) -> Dict[str, List[PartInfo]]:
        """Part'ları tipe göre grupla"""
        parts_by_type = {}
        
        for part in import_result.all_parts:
            shape_type = part.shape_type
            if shape_type not in parts_by_type:
                parts_by_type[shape_type] = []
            parts_by_type[shape_type].append(part)
        
        return parts_by_type
    
    def get_assembly_statistics(self, import_result: STEPImportResult) -> Dict[str, Any]:
        """Assembly istatistiklerini al"""
        stats = {
            'total_parts': import_result.total_parts,
            'total_assemblies': import_result.total_assemblies,
            'max_hierarchy_depth': import_result.max_hierarchy_depth,
            'parts_by_type': {},
            'volume_stats': {},
            'area_stats': {}
        }
        
        # Parts by type
        parts_by_type = self.get_parts_by_type(import_result)
        for shape_type, parts in parts_by_type.items():
            stats['parts_by_type'][shape_type] = len(parts)
        
        # Volume and area statistics
        volumes = [p.volume for p in import_result.all_parts if p.volume > 0]
        areas = [p.surface_area for p in import_result.all_parts if p.surface_area > 0]
        
        if volumes:
            stats['volume_stats'] = {
                'total': sum(volumes),
                'average': sum(volumes) / len(volumes),
                'min': min(volumes),
                'max': max(volumes)
            }
        
        if areas:
            stats['area_stats'] = {
                'total': sum(areas),
                'average': sum(areas) / len(areas),
                'min': min(areas),
                'max': max(areas)
            }
        
        return stats
    
    def cleanup(self):
        """Temizlik işlemleri"""
        if self.freecad_doc:
            try:
                FreeCAD.closeDocument(self.freecad_doc.Name)
                self._log_info(f"FreeCAD document closed: {self.freecad_doc.Name}")
            except Exception as e:
                self._log_warning(f"Error closing FreeCAD document: {e}")
            finally:
                self.freecad_doc = None
    
    def _get_config(self, key: str, default: Any) -> Any:
        """Config değeri al"""
        if hasattr(self.config, 'get_step_processing_config'):
            config_dict = self.config.get_step_processing_config()
            return config_dict.get(key, default)
        elif hasattr(self.config, 'get'):
            return self.config.get('FREECAD_PROCESSING', key, fallback=default)
        else:
            return self.config.get(key, default) if isinstance(self.config, dict) else default
    
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
        self.cleanup()


# Test function
def test_freecad_step_processor():
    """Test function for development"""
    processor = FreeCADStepProcessor()
    
    # Test with a sample STEP file
    step_file = "test_sample.step"  # Replace with actual file
    if os.path.exists(step_file):
        result = processor.import_step_file(step_file)
        
        print(f"Import Success: {result.success}")
        print(f"Total Parts: {result.total_parts}")
        print(f"Total Assemblies: {result.total_assemblies}")
        print(f"Max Depth: {result.max_hierarchy_depth}")
        print(f"Import Time: {result.import_time:.2f}s")
        
        if result.errors:
            print(f"Errors: {result.errors}")
        
        processor.cleanup()
    else:
        print(f"Test file not found: {step_file}")


if __name__ == "__main__":
    test_freecad_step_processor()