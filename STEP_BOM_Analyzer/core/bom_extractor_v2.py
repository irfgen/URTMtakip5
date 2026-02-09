"""
BOM Extractor V2 - FreeCAD Architecture

Yeni freecad_step_processor ile entegre çalışan BOM çıkarıcı.
Hiyerarşik yapıyı korur ve çeşitli formatlarda export eder.
"""

import json
import csv
import xml.etree.ElementTree as ET
from xml.dom import minidom
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict, field
from datetime import datetime

# Excel export için
try:
    import pandas as pd
    import openpyxl
    PANDAS_AVAILABLE = True
    EXCEL_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    EXCEL_AVAILABLE = False

from .freecad_step_processor import STEPImportResult, AssemblyNode, PartInfo


@dataclass
class BOMItemV2:
    """BOM'daki bir item (V2 - FreeCAD uyumlu)"""
    item_number: int
    part_number: str
    part_name: str
    description: str
    quantity: int
    level: int
    parent_assembly: str
    unit: str = "EA"
    
    # Part bilgileri
    shape_type: Optional[str] = None
    volume: Optional[float] = None
    surface_area: Optional[float] = None
    center_of_mass: Optional[tuple] = None
    
    # Geometrik bilgiler
    bounding_box: Optional[Dict] = None
    dimensions: Optional[Dict] = None  # Length, Width, Height
    
    # Görsel bilgiler
    color: Optional[tuple] = None
    material: Optional[str] = None
    
    # Hiyerarşi bilgileri
    assembly_path: Optional[str] = None
    instance_path: Optional[str] = None
    node_type: Optional[str] = None  # 'assembly', 'part', 'compound'
    
    # CAD referansları
    freecad_name: Optional[str] = None
    freecad_label: Optional[str] = None
    
    # Metadata
    properties: Dict[str, Any] = field(default_factory=dict)
    notes: Optional[str] = None
    category: Optional[str] = None


@dataclass
class BOMStructureV2:
    """BOM yapısı V2"""
    assembly_name: str
    total_items: int
    total_parts: int
    total_assemblies: int
    max_level: int
    created_date: datetime
    source_file: str
    items: List[BOMItemV2]
    hierarchy: Optional[Dict] = None
    statistics: Optional[Dict] = None
    part_types: Optional[Dict] = None
    volume_analysis: Optional[Dict] = None
    
    def __post_init__(self):
        if not isinstance(self.created_date, datetime):
            self.created_date = datetime.now()


@dataclass
class BOMExportResultV2:
    """BOM export sonucu V2"""
    success: bool
    formats: List[str]
    file_paths: List[str]
    export_time: float
    total_items: int
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class BOMExtractorV2:
    """FreeCAD tabanlı BOM çıkarıcı V2"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        
        # Config ayarları
        self.bom_config = self._get_bom_config()
        
        # Sayaç
        self.item_counter = 1
    
    def extract_bom(self, import_result: STEPImportResult) -> Optional[BOMStructureV2]:
        """STEP import sonucundan BOM çıkar"""
        if not import_result.success or not import_result.root_assembly:
            self._log_error("Import sonucu geçersiz, BOM çıkarılamıyor")
            return None
        
        start_time = time.time()
        assembly_name = import_result.root_assembly.name
        
        self._log_info(f"BOM V2 çıkarma başlatılıyor: {assembly_name}")
        
        try:
            # Reset counter
            self.item_counter = 1
            
            # BOM item'larını çıkar
            if self.bom_config.get('include_assemblies', True):
                bom_items = self._extract_hierarchical_bom_v2(
                    import_result.root_assembly, 
                    assembly_path="",
                    level=0
                )
            else:
                # Flat BOM - sadece parts
                bom_items = self._extract_flat_bom_v2(import_result.all_parts)
            
            # BOM yapısını oluştur
            bom_structure = BOMStructureV2(
                assembly_name=assembly_name,
                total_items=len(bom_items),
                total_parts=import_result.total_parts,
                total_assemblies=import_result.total_assemblies,
                max_level=import_result.max_hierarchy_depth,
                created_date=datetime.now(),
                source_file=import_result.step_file,
                items=bom_items
            )
            
            # Analizleri ekle
            bom_structure.hierarchy = self._build_hierarchy_dict_v2(import_result.root_assembly)
            bom_structure.statistics = self._calculate_bom_statistics_v2(bom_items)
            bom_structure.part_types = self._analyze_part_types_v2(bom_items)
            bom_structure.volume_analysis = self._analyze_volumes_v2(bom_items)
            
            extract_time = time.time() - start_time
            self._log_info(f"BOM V2 çıkarma tamamlandı: {len(bom_items)} items ({extract_time:.2f}s)")
            
            return bom_structure
            
        except Exception as e:
            self._log_error(f"BOM V2 çıkarma hatası: {str(e)}")
            import traceback
            self._log_error(traceback.format_exc())
            return None
    
    def _extract_hierarchical_bom_v2(self, node: AssemblyNode, 
                                    assembly_path: str = "", 
                                    level: int = 0) -> List[BOMItemV2]:
        """Hiyerarşik BOM çıkar V2"""
        items = []
        
        # Assembly path güncelle
        current_path = f"{assembly_path}/{node.name}" if assembly_path else node.name
        parent_name = assembly_path.split('/')[-1] if assembly_path else "ROOT"
        
        # Bu node için BOM item oluştur
        if node.node_type == 'part' and node.part_info:
            # Part item
            part_item = self._create_bom_item_from_part(
                node.part_info, level, parent_name, current_path
            )
            items.append(part_item)
            
        elif node.node_type == 'assembly' and level > 0:
            # Assembly item (root değilse)
            assembly_item = self._create_bom_item_from_assembly(
                node, level, parent_name, current_path
            )
            items.append(assembly_item)
        
        # Children'ı işle
        for child in node.children:
            if level < self.bom_config.get('max_hierarchy_levels', 20):
                child_items = self._extract_hierarchical_bom_v2(
                    child, current_path, level + 1
                )
                items.extend(child_items)
        
        return items
    
    def _extract_flat_bom_v2(self, all_parts: List[PartInfo]) -> List[BOMItemV2]:
        """Flat BOM çıkar - sadece parts"""
        items = []
        
        for part in all_parts:
            item = self._create_bom_item_from_part(
                part, level=0, parent_assembly="ROOT", assembly_path=part.name
            )
            items.append(item)
        
        return items
    
    def _create_bom_item_from_part(self, part_info: PartInfo, 
                                  level: int, parent_assembly: str, 
                                  assembly_path: str) -> BOMItemV2:
        """PartInfo'dan BOM item oluştur"""
        
        # Dimensions hesapla
        dimensions = None
        if part_info.bounding_box:
            dimensions = {
                'length': part_info.bounding_box.get('x_length', 0),
                'width': part_info.bounding_box.get('y_length', 0),
                'height': part_info.bounding_box.get('z_length', 0)
            }
        
        # Description oluştur
        description_parts = [f"Shape: {part_info.shape_type}"]
        if part_info.volume > 0:
            description_parts.append(f"Vol: {part_info.volume:.2f}")
        if part_info.surface_area > 0:
            description_parts.append(f"Area: {part_info.surface_area:.2f}")
        
        description = " | ".join(description_parts)
        
        # Category belirle
        category = self._determine_part_category(part_info.shape_type)
        
        item = BOMItemV2(
            item_number=self.item_counter,
            part_number=part_info.part_number,
            part_name=part_info.label,
            description=description,
            quantity=1,  # Instance counting için geliştirilecek
            level=level,
            parent_assembly=parent_assembly,
            shape_type=part_info.shape_type,
            volume=part_info.volume,
            surface_area=part_info.surface_area,
            center_of_mass=part_info.center_of_mass,
            bounding_box=part_info.bounding_box,
            dimensions=dimensions,
            color=part_info.color,
            assembly_path=assembly_path,
            node_type='part',
            freecad_name=part_info.name,
            freecad_label=part_info.label,
            properties=part_info.properties,
            category=category
        )
        
        self.item_counter += 1
        return item
    
    def _create_bom_item_from_assembly(self, assembly_node: AssemblyNode,
                                     level: int, parent_assembly: str,
                                     assembly_path: str) -> BOMItemV2:
        """AssemblyNode'dan BOM item oluştur"""
        
        description = f"Assembly: {assembly_node.node_type} | Level: {level} | Children: {len(assembly_node.children)}"
        
        item = BOMItemV2(
            item_number=self.item_counter,
            part_number=f"ASM_{assembly_node.name}",
            part_name=assembly_node.label,
            description=description,
            quantity=assembly_node.instance_count,
            level=level,
            parent_assembly=parent_assembly,
            assembly_path=assembly_path,
            node_type=assembly_node.node_type,
            freecad_name=assembly_node.name,
            freecad_label=assembly_node.label,
            category='Assembly'
        )
        
        self.item_counter += 1
        return item
    
    def _determine_part_category(self, shape_type: str) -> str:
        """Shape type'dan category belirle"""
        category_map = {
            'Solid': 'Solid Parts',
            'CompSolid': 'Compound Parts',
            'Shell': 'Sheet Metal',
            'Face': 'Surface',
            'Wire': 'Wireframe',
            'Edge': 'Edge',
            'Vertex': 'Point'
        }
        return category_map.get(shape_type, 'Other')
    
    def _build_hierarchy_dict_v2(self, node: AssemblyNode) -> Dict[str, Any]:
        """Assembly hiyerarşisini dictionary'e dönüştür"""
        hierarchy = {
            'name': node.name,
            'label': node.label,
            'type': node.node_type,
            'level': node.level,
            'instance_count': node.instance_count,
            'children': []
        }
        
        # Part bilgileri varsa ekle
        if node.part_info:
            hierarchy['part_info'] = {
                'part_number': node.part_info.part_number,
                'volume': node.part_info.volume,
                'surface_area': node.part_info.surface_area,
                'shape_type': node.part_info.shape_type
            }
        
        # Children'ı ekle
        for child in node.children:
            hierarchy['children'].append(self._build_hierarchy_dict_v2(child))
        
        return hierarchy
    
    def _calculate_bom_statistics_v2(self, bom_items: List[BOMItemV2]) -> Dict[str, Any]:
        """BOM istatistikleri hesapla"""
        total_parts = len([item for item in bom_items if item.node_type == 'part'])
        total_assemblies = len([item for item in bom_items if item.node_type == 'assembly'])
        
        # Volume analizi
        volumes = [item.volume for item in bom_items if item.volume and item.volume > 0]
        areas = [item.surface_area for item in bom_items if item.surface_area and item.surface_area > 0]
        
        stats = {
            'total_items': len(bom_items),
            'total_parts': total_parts,
            'total_assemblies': total_assemblies,
            'max_level': max((item.level for item in bom_items), default=0),
            'unique_part_numbers': len(set(item.part_number for item in bom_items)),
        }
        
        if volumes:
            stats['volume_stats'] = {
                'total': sum(volumes),
                'average': sum(volumes) / len(volumes),
                'min': min(volumes),
                'max': max(volumes),
                'count': len(volumes)
            }
        
        if areas:
            stats['area_stats'] = {
                'total': sum(areas),
                'average': sum(areas) / len(areas),
                'min': min(areas),
                'max': max(areas),
                'count': len(areas)
            }
        
        return stats
    
    def _analyze_part_types_v2(self, bom_items: List[BOMItemV2]) -> Dict[str, int]:
        """Part tiplerini analiz et"""
        type_counts = {}
        
        for item in bom_items:
            if item.shape_type:
                type_counts[item.shape_type] = type_counts.get(item.shape_type, 0) + 1
            
            if item.category:
                category_key = f"Category_{item.category}"
                type_counts[category_key] = type_counts.get(category_key, 0) + 1
        
        return type_counts
    
    def _analyze_volumes_v2(self, bom_items: List[BOMItemV2]) -> Dict[str, Any]:
        """Hacim analizi yap"""
        parts_with_volume = [item for item in bom_items if item.volume and item.volume > 0]
        
        if not parts_with_volume:
            return {'total_volume': 0, 'part_count': 0}
        
        volumes = [item.volume for item in parts_with_volume]
        
        return {
            'total_volume': sum(volumes),
            'average_volume': sum(volumes) / len(volumes),
            'largest_part': max(parts_with_volume, key=lambda x: x.volume).part_name,
            'largest_volume': max(volumes),
            'smallest_part': min(parts_with_volume, key=lambda x: x.volume).part_name,
            'smallest_volume': min(volumes),
            'part_count': len(parts_with_volume)
        }
    
    def export_bom(self, bom_structure: BOMStructureV2, 
                   output_dir: str, 
                   formats: List[str] = None) -> BOMExportResultV2:
        """BOM'u çeşitli formatlarda export et"""
        if formats is None:
            formats = self.bom_config.get('export_formats', ['json', 'excel', 'csv'])
        
        start_time = time.time()
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        exported_files = []
        errors = []
        
        # Base filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"BOM_{bom_structure.assembly_name}_{timestamp}"
        
        try:
            # JSON Export
            if 'json' in formats:
                json_file = self._export_json_v2(bom_structure, output_path, base_filename)
                if json_file:
                    exported_files.append(json_file)
            
            # Excel Export
            if 'excel' in formats and EXCEL_AVAILABLE:
                excel_file = self._export_excel_v2(bom_structure, output_path, base_filename)
                if excel_file:
                    exported_files.append(excel_file)
            elif 'excel' in formats:
                errors.append("Excel export requested but openpyxl not available")
            
            # CSV Export
            if 'csv' in formats:
                csv_file = self._export_csv_v2(bom_structure, output_path, base_filename)
                if csv_file:
                    exported_files.append(csv_file)
            
            # XML Export
            if 'xml' in formats:
                xml_file = self._export_xml_v2(bom_structure, output_path, base_filename)
                if xml_file:
                    exported_files.append(xml_file)
            
        except Exception as e:
            errors.append(f"Export error: {str(e)}")
            self._log_error(f"BOM export error: {e}")
        
        export_time = time.time() - start_time
        success = len(exported_files) > 0
        
        if success:
            self._log_info(f"BOM export tamamlandı: {len(exported_files)} files ({export_time:.2f}s)")
        
        return BOMExportResultV2(
            success=success,
            formats=formats,
            file_paths=exported_files,
            export_time=export_time,
            total_items=len(bom_structure.items),
            errors=errors
        )
    
    def _export_json_v2(self, bom_structure: BOMStructureV2, output_path: Path, base_filename: str) -> Optional[str]:
        """JSON export"""
        try:
            json_file = output_path / f"{base_filename}.json"
            
            # BOM structure'ı dict'e dönüştür
            bom_dict = asdict(bom_structure)
            
            # Datetime'ı string'e dönüştür
            if isinstance(bom_dict['created_date'], datetime):
                bom_dict['created_date'] = bom_dict['created_date'].isoformat()
            
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(bom_dict, f, indent=2, ensure_ascii=False, default=str)
            
            return str(json_file)
            
        except Exception as e:
            self._log_error(f"JSON export error: {e}")
            return None
    
    def _export_excel_v2(self, bom_structure: BOMStructureV2, output_path: Path, base_filename: str) -> Optional[str]:
        """Excel export"""
        try:
            excel_file = output_path / f"{base_filename}.xlsx"
            
            with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
                # BOM Sheet
                bom_data = []
                for item in bom_structure.items:
                    bom_data.append({
                        'Item #': item.item_number,
                        'Part Number': item.part_number,
                        'Part Name': item.part_name,
                        'Description': item.description,
                        'Qty': item.quantity,
                        'Level': item.level,
                        'Parent': item.parent_assembly,
                        'Type': item.node_type,
                        'Shape': item.shape_type,
                        'Volume': item.volume,
                        'Surface Area': item.surface_area,
                        'Category': item.category,
                        'Assembly Path': item.assembly_path
                    })
                
                df_bom = pd.DataFrame(bom_data)
                df_bom.to_excel(writer, sheet_name='BOM', index=False)
                
                # Statistics Sheet
                if bom_structure.statistics:
                    stats_data = []
                    for key, value in bom_structure.statistics.items():
                        if isinstance(value, dict):
                            for sub_key, sub_value in value.items():
                                stats_data.append({
                                    'Metric': f"{key}.{sub_key}",
                                    'Value': sub_value
                                })
                        else:
                            stats_data.append({
                                'Metric': key,
                                'Value': value
                            })
                    
                    df_stats = pd.DataFrame(stats_data)
                    df_stats.to_excel(writer, sheet_name='Statistics', index=False)
                
                # Part Types Sheet
                if bom_structure.part_types:
                    types_data = [
                        {'Type': k, 'Count': v} 
                        for k, v in bom_structure.part_types.items()
                    ]
                    df_types = pd.DataFrame(types_data)
                    df_types.to_excel(writer, sheet_name='Part Types', index=False)
            
            return str(excel_file)
            
        except Exception as e:
            self._log_error(f"Excel export error: {e}")
            return None
    
    def _export_csv_v2(self, bom_structure: BOMStructureV2, output_path: Path, base_filename: str) -> Optional[str]:
        """CSV export"""
        try:
            csv_file = output_path / f"{base_filename}.csv"
            
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = [
                    'item_number', 'part_number', 'part_name', 'description', 
                    'quantity', 'level', 'parent_assembly', 'node_type', 
                    'shape_type', 'volume', 'surface_area', 'category', 'assembly_path'
                ]
                
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for item in bom_structure.items:
                    row = {
                        'item_number': item.item_number,
                        'part_number': item.part_number,
                        'part_name': item.part_name,
                        'description': item.description,
                        'quantity': item.quantity,
                        'level': item.level,
                        'parent_assembly': item.parent_assembly,
                        'node_type': item.node_type,
                        'shape_type': item.shape_type,
                        'volume': item.volume,
                        'surface_area': item.surface_area,
                        'category': item.category,
                        'assembly_path': item.assembly_path
                    }
                    writer.writerow(row)
            
            return str(csv_file)
            
        except Exception as e:
            self._log_error(f"CSV export error: {e}")
            return None
    
    def _export_xml_v2(self, bom_structure: BOMStructureV2, output_path: Path, base_filename: str) -> Optional[str]:
        """XML export"""
        try:
            xml_file = output_path / f"{base_filename}.xml"
            
            # Root element
            root = ET.Element("BOM")
            root.set("assembly_name", bom_structure.assembly_name)
            root.set("created_date", bom_structure.created_date.isoformat())
            root.set("source_file", bom_structure.source_file)
            root.set("total_items", str(bom_structure.total_items))
            
            # Items
            items_elem = ET.SubElement(root, "Items")
            
            for item in bom_structure.items:
                item_elem = ET.SubElement(items_elem, "Item")
                item_elem.set("number", str(item.item_number))
                
                # Required fields
                ET.SubElement(item_elem, "PartNumber").text = item.part_number
                ET.SubElement(item_elem, "PartName").text = item.part_name
                ET.SubElement(item_elem, "Description").text = item.description
                ET.SubElement(item_elem, "Quantity").text = str(item.quantity)
                ET.SubElement(item_elem, "Level").text = str(item.level)
                ET.SubElement(item_elem, "Parent").text = item.parent_assembly
                
                # Optional fields
                if item.node_type:
                    ET.SubElement(item_elem, "Type").text = item.node_type
                if item.shape_type:
                    ET.SubElement(item_elem, "ShapeType").text = item.shape_type
                if item.volume:
                    ET.SubElement(item_elem, "Volume").text = str(item.volume)
                if item.surface_area:
                    ET.SubElement(item_elem, "SurfaceArea").text = str(item.surface_area)
                if item.category:
                    ET.SubElement(item_elem, "Category").text = item.category
            
            # Statistics
            if bom_structure.statistics:
                stats_elem = ET.SubElement(root, "Statistics")
                for key, value in bom_structure.statistics.items():
                    stat_elem = ET.SubElement(stats_elem, "Statistic")
                    stat_elem.set("name", key)
                    stat_elem.text = str(value)
            
            # Pretty XML
            rough_string = ET.tostring(root, 'unicode')
            reparsed = minidom.parseString(rough_string)
            pretty_xml = reparsed.toprettyxml(indent="  ")
            
            with open(xml_file, 'w', encoding='utf-8') as f:
                f.write(pretty_xml)
            
            return str(xml_file)
            
        except Exception as e:
            self._log_error(f"XML export error: {e}")
            return None
    
    def _get_bom_config(self) -> Dict[str, Any]:
        """BOM config ayarlarını al"""
        if hasattr(self.config, 'get_bom_config'):
            return self.config.get_bom_config() or {}
        elif hasattr(self.config, 'get'):
            try:
                return dict(self.config['BOM_GENERATION']) if 'BOM_GENERATION' in self.config else {}
            except:
                return {}
        else:
            return self.config.get('BOM_GENERATION', {}) if isinstance(self.config, dict) else {}
    
    def _log_info(self, message: str):
        if self.logger:
            self.logger.info(message)
    
    def _log_warning(self, message: str):
        if self.logger:
            self.logger.warning(message)
    
    def _log_error(self, message: str):
        if self.logger:
            self.logger.error(message)


# Test function
def test_bom_extractor_v2():
    """BOM Extractor V2 test"""
    from .freecad_step_processor import FreeCADStepProcessor
    from ..utils.logger import STEPAnalyzerLogger
    from ..utils.config_manager import ConfigManager
    
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    # Mock test data (FreeCAD not available)
    print("BOM Extractor V2 - Mock test başlatılıyor...")
    
    extractor = BOMExtractorV2(config, logger)
    print("BOM Extractor V2 başarıyla oluşturuldu")
    
    return True


if __name__ == "__main__":
    test_bom_extractor_v2()