"""
BOM Extractor

STEP parse sonuçlarından BOM (Bill of Materials) çıkarır.
Hiyerarşik yapıyı korur ve çeşitli formatlarda export eder.
"""

import json
import csv
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime

# Excel export için
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

from .freecad_step_processor import STEPImportResult, AssemblyNode, PartInfo


@dataclass
class BOMItem:
    """BOM'daki bir item"""
    item_number: int
    part_number: str
    part_name: str
    description: str
    quantity: int
    level: int
    parent_assembly: str
    unit: str = "EA"
    material: Optional[str] = None
    volume: Optional[float] = None
    mass: Optional[float] = None
    supplier: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    
    # CAD bilgileri
    shape_type: Optional[str] = None
    bounding_box: Optional[Dict] = None
    surface_area: Optional[float] = None
    
    # Referanslar
    assembly_path: Optional[str] = None
    instance_path: Optional[str] = None


@dataclass
class BOMStructure:
    """BOM yapısı"""
    assembly_name: str
    total_items: int
    max_level: int
    created_date: datetime
    source_file: str
    items: List[BOMItem]
    hierarchy: Optional[Dict] = None
    statistics: Optional[Dict] = None
    
    def __post_init__(self):
        if not isinstance(self.created_date, datetime):
            self.created_date = datetime.now()


@dataclass
class BOMExportResult:
    """BOM export sonucu"""
    success: bool
    formats: List[str]
    file_paths: List[str]
    export_time: float
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class BOMExtractor:
    """BOM çıkarma sınıfı"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        
        # Config manager methodunu kullan
        if hasattr(config, 'get_bom_config'):
            self.bom_config = config.get_bom_config() or {}
        elif hasattr(config, 'get'):
            # ConfigParser object
            try:
                self.bom_config = dict(config['BOM_EXTRACTION']) if 'BOM_EXTRACTION' in config else {}
            except:
                self.bom_config = {}
        else:
            # Dict object
            self.bom_config = self.config.get('BOM_EXTRACTION', {})
    
    def extract_bom(self, import_result: STEPImportResult) -> Optional[BOMStructure]:
        """STEP parse sonucundan BOM çıkar"""
        if not parse_result.success or not parse_result.assembly_tree:
            self._log_error("Parse sonucu geçersiz, BOM çıkarılamıyor")
            return None
        
        start_time = time.time()
        self._log_info(f"BOM çıkarma başlatılıyor: {parse_result.file_path}")
        
        try:
            # Assembly adını belirle
            assembly_name = self._get_assembly_name(parse_result)
            
            # BOM item'larını oluştur
            bom_items = []
            item_counter = 1
            
            # Hiyerarşik olarak traverse et
            if self.bom_config.get('include_sub_assemblies', True):
                bom_items = self._extract_hierarchical_bom(
                    parse_result.assembly_tree, 
                    item_counter,
                    assembly_path=""
                )
            else:
                # Sadece part'ları al (flatten)
                bom_items = self._extract_flat_bom(parse_result.all_parts)
            
            # BOM yapısını oluştur
            bom_structure = BOMStructure(
                assembly_name=assembly_name,
                total_items=len(bom_items),
                max_level=max((item.level for item in bom_items), default=0),
                created_date=datetime.now(),
                source_file=parse_result.file_path,
                items=bom_items
            )
            
            # Hiyerarşi ve istatistikleri ekle
            bom_structure.hierarchy = self._build_hierarchy_dict(parse_result.assembly_tree)
            bom_structure.statistics = self._calculate_bom_statistics(bom_items)
            
            extract_time = time.time() - start_time
            self._log_info(f"BOM çıkarma tamamlandı: {len(bom_items)} items ({extract_time:.2f}s)")
            
            return bom_structure
            
        except Exception as e:
            self._log_error(f"BOM çıkarma hatası: {str(e)}")
            return None
    
    def _extract_hierarchical_bom(self, node: STEPAssemblyNode, 
                                 item_counter: int, 
                                 assembly_path: str = "",
                                 level: int = 0) -> List[BOMItem]:
        """Hiyerarşik BOM çıkar"""
        items = []
        
        # Assembly path güncelle
        current_path = f"{assembly_path}/{node.name}" if assembly_path else node.name
        
        # Bu assembly için entry (eğer root değilse)
        if level > 0:
            assembly_item = BOMItem(
                item_number=item_counter,
                part_number=node.label,
                part_name=node.name,
                description=f"Assembly - {node.name}",
                quantity=node.instance_count,
                level=level,
                parent_assembly=assembly_path.split('/')[-1] if assembly_path else "ROOT",
                category="Assembly",
                assembly_path=current_path,
                instance_path=current_path
            )
            items.append(assembly_item)
            item_counter += 1
        
        # Alt assembly'leri işle
        for child in node.children:
            child_items = self._extract_hierarchical_bom(
                child, 
                item_counter, 
                current_path, 
                level + 1
            )
            items.extend(child_items)
            item_counter += len(child_items)
        
        # Bu assembly'deki part'ları işle
        for part in node.parts:
            part_item = self._create_bom_item_from_part(
                part, 
                item_counter, 
                level + 1, 
                node.name,
                current_path
            )
            items.append(part_item)
            item_counter += 1
        
        return items
    
    def _extract_flat_bom(self, parts: List[STEPPartInfo]) -> List[BOMItem]:
        """Düz (flat) BOM çıkar"""
        items = []
        
        # Part'ları grupla ve say
        part_counts = {}
        for part in parts:
            key = (part.name, part.label)
            part_counts[key] = part_counts.get(key, 0) + 1
        
        # BOM item'larını oluştur
        for item_number, ((name, label), quantity) in enumerate(part_counts.items(), 1):
            # İlk part'ı bul (properties için)
            part_info = next(p for p in parts if p.name == name and p.label == label)
            
            item = self._create_bom_item_from_part(
                part_info, 
                item_number, 
                0, 
                "ROOT",
                "ROOT"
            )
            item.quantity = quantity
            items.append(item)
        
        return items
    
    def _create_bom_item_from_part(self, part: STEPPartInfo, 
                                  item_number: int, 
                                  level: int, 
                                  parent_assembly: str,
                                  assembly_path: str) -> BOMItem:
        """Part'tan BOM item oluştur"""
        # Part number ve name temizle
        part_number = self._clean_part_number(part.label or part.name)
        part_name = part.name or part.label or "Unknown Part"
        
        # Açıklama oluştur
        description = f"Part - {part_name}"
        if part.shape_type:
            description += f" ({part.shape_type})"
        
        # Category belirle
        category = self._determine_part_category(part)
        
        return BOMItem(
            item_number=item_number,
            part_number=part_number,
            part_name=part_name,
            description=description,
            quantity=1,  # Bu sonradan grouping'de ayarlanacak
            level=level,
            parent_assembly=parent_assembly,
            material=part.material,
            volume=part.volume,
            mass=part.mass,
            shape_type=part.shape_type,
            bounding_box=part.bounding_box,
            surface_area=part.surface_area,
            category=category,
            assembly_path=assembly_path,
            instance_path=f"{assembly_path}/{part_name}"
        )
    
    def _clean_part_number(self, raw_part_number: str) -> str:
        """Part number'ı temizle"""
        if not raw_part_number:
            return "UNKNOWN"
        
        # Genel temizlik
        cleaned = raw_part_number.strip()
        
        # FreeCAD'ın otomatik isimlendirmelerini temizle
        if cleaned.startswith('Unnamed'):
            cleaned = cleaned.replace('Unnamed', 'PART')
        
        # Özel karakterleri değiştir
        replacements = {
            ' ': '_',
            '/': '-',
            '\\': '-',
            ':': '-',
            '*': 'x',
            '?': '',
            '"': '',
            '<': '',
            '>': '',
            '|': ''
        }
        
        for old, new in replacements.items():
            cleaned = cleaned.replace(old, new)
        
        return cleaned.upper()
    
    def _determine_part_category(self, part: STEPPartInfo) -> str:
        """Part kategorisini belirle"""
        if not part.shape_type:
            return "Unknown"
        
        # Shape type'a göre kategori
        shape_categories = {
            'Solid': 'Machined Part',
            'Shell': 'Sheet Metal',
            'Face': 'Surface',
            'Wire': 'Wire/Cable',
            'Edge': 'Edge',
            'Vertex': 'Point',
            'Compound': 'Assembly'
        }
        
        return shape_categories.get(part.shape_type, 'Part')
    
    def _build_hierarchy_dict(self, node: STEPAssemblyNode, level: int = 0) -> Dict:
        """Hiyerarşi dictionary'si oluştur"""
        hierarchy = {
            'name': node.name,
            'label': node.label,
            'level': level,
            'is_assembly': node.is_assembly,
            'instance_count': node.instance_count,
            'part_count': len(node.parts),
            'children': [],
            'parts': [part.name for part in node.parts]
        }
        
        for child in node.children:
            child_hierarchy = self._build_hierarchy_dict(child, level + 1)
            hierarchy['children'].append(child_hierarchy)
        
        return hierarchy
    
    def _calculate_bom_statistics(self, items: List[BOMItem]) -> Dict[str, Any]:
        """BOM istatistikleri hesapla"""
        if not items:
            return {}
        
        stats = {
            'total_items': len(items),
            'total_quantity': sum(item.quantity for item in items),
            'max_level': max(item.level for item in items),
            'categories': {},
            'materials': {},
            'shape_types': {},
            'total_volume': 0,
            'total_mass': 0,
            'items_with_volume': 0,
            'items_with_mass': 0
        }
        
        # Kategori, malzeme ve shape type analizi
        for item in items:
            # Kategoriler
            if item.category:
                stats['categories'][item.category] = stats['categories'].get(item.category, 0) + item.quantity
            
            # Malzemeler
            if item.material:
                stats['materials'][item.material] = stats['materials'].get(item.material, 0) + item.quantity
            
            # Shape types
            if item.shape_type:
                stats['shape_types'][item.shape_type] = stats['shape_types'].get(item.shape_type, 0) + item.quantity
            
            # Hacim ve kütle
            if item.volume:
                stats['total_volume'] += item.volume * item.quantity
                stats['items_with_volume'] += 1
            
            if item.mass:
                stats['total_mass'] += item.mass * item.quantity
                stats['items_with_mass'] += 1
        
        return stats
    
    def _get_assembly_name(self, parse_result: STEPParseResult) -> str:
        """Assembly adını belirle"""
        if parse_result.assembly_tree and parse_result.assembly_tree.name != "Root Assembly":
            return parse_result.assembly_tree.name
        
        # Dosya adından assembly adı çıkar
        file_path = Path(parse_result.file_path)
        return file_path.stem.replace('_', ' ').replace('-', ' ').title()
    
    def export_bom(self, bom_structure: BOMStructure, 
                   output_dir: str, 
                   formats: List[str] = None) -> BOMExportResult:
        """BOM'u çeşitli formatlarda export et"""
        if formats is None:
            formats = self.bom_config.get('export_formats', ['json', 'excel', 'csv'])
        
        start_time = time.time()
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Dosya adı template
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"BOM_{bom_structure.assembly_name}_{timestamp}"
        
        exported_files = []
        errors = []
        
        self._log_info(f"BOM export başlatılıyor: {formats}")
        
        # JSON export
        if 'json' in formats:
            try:
                json_file = output_path / f"{base_name}.json"
                self._export_json(bom_structure, json_file)
                exported_files.append(str(json_file))
                self._log_info(f"JSON export: {json_file}")
            except Exception as e:
                errors.append(f"JSON export hatası: {str(e)}")
        
        # Excel export
        if 'excel' in formats:
            try:
                excel_file = output_path / f"{base_name}.xlsx"
                self._export_excel(bom_structure, excel_file)
                exported_files.append(str(excel_file))
                self._log_info(f"Excel export: {excel_file}")
            except Exception as e:
                errors.append(f"Excel export hatası: {str(e)}")
        
        # CSV export
        if 'csv' in formats:
            try:
                csv_file = output_path / f"{base_name}.csv"
                self._export_csv(bom_structure, csv_file)
                exported_files.append(str(csv_file))
                self._log_info(f"CSV export: {csv_file}")
            except Exception as e:
                errors.append(f"CSV export hatası: {str(e)}")
        
        # XML export (opsiyonel)
        if 'xml' in formats:
            try:
                xml_file = output_path / f"{base_name}.xml"
                self._export_xml(bom_structure, xml_file)
                exported_files.append(str(xml_file))
                self._log_info(f"XML export: {xml_file}")
            except Exception as e:
                errors.append(f"XML export hatası: {str(e)}")
        
        export_time = time.time() - start_time
        
        return BOMExportResult(
            success=len(exported_files) > 0,
            formats=formats,
            file_paths=exported_files,
            export_time=export_time,
            errors=errors
        )
    
    def _export_json(self, bom_structure: BOMStructure, file_path: Path):
        """JSON formatında export"""
        # BOM structure'ı serializable hale getir
        data = {
            'assembly_name': bom_structure.assembly_name,
            'total_items': bom_structure.total_items,
            'max_level': bom_structure.max_level,
            'created_date': bom_structure.created_date.isoformat(),
            'source_file': bom_structure.source_file,
            'items': [asdict(item) for item in bom_structure.items],
            'hierarchy': bom_structure.hierarchy,
            'statistics': bom_structure.statistics
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def _export_excel(self, bom_structure: BOMStructure, file_path: Path):
        """Excel formatında export"""
        if not PANDAS_AVAILABLE:
            raise ImportError("Pandas kütüphanesi gerekli (Excel export için)")
        
        # BOM items'ı DataFrame'e çevir
        items_data = []
        for item in bom_structure.items:
            item_dict = asdict(item)
            # Complex objeler için string conversion
            if item_dict['bounding_box']:
                item_dict['bounding_box'] = str(item_dict['bounding_box'])
            items_data.append(item_dict)
        
        df_items = pd.DataFrame(items_data)
        
        # Statistics DataFrame
        stats_data = []
        if bom_structure.statistics:
            for key, value in bom_structure.statistics.items():
                if isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        stats_data.append({'Category': key, 'Item': sub_key, 'Value': sub_value})
                else:
                    stats_data.append({'Category': 'General', 'Item': key, 'Value': value})
        
        df_stats = pd.DataFrame(stats_data)
        
        # Excel writer ile multiple sheets
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            # BOM sheet
            df_items.to_excel(writer, sheet_name='BOM', index=False)
            
            # Statistics sheet
            if not df_stats.empty:
                df_stats.to_excel(writer, sheet_name='Statistics', index=False)
            
            # Summary sheet
            summary_data = {
                'Property': ['Assembly Name', 'Total Items', 'Max Level', 'Created Date', 'Source File'],
                'Value': [
                    bom_structure.assembly_name,
                    bom_structure.total_items,
                    bom_structure.max_level,
                    bom_structure.created_date.strftime('%Y-%m-%d %H:%M:%S'),
                    bom_structure.source_file
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
    
    def _export_csv(self, bom_structure: BOMStructure, file_path: Path):
        """CSV formatında export"""
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Header
            headers = [
                'Item Number', 'Part Number', 'Part Name', 'Description', 
                'Quantity', 'Level', 'Parent Assembly', 'Unit',
                'Material', 'Volume', 'Mass', 'Category', 'Shape Type',
                'Assembly Path'
            ]
            writer.writerow(headers)
            
            # Items
            for item in bom_structure.items:
                row = [
                    item.item_number, item.part_number, item.part_name,
                    item.description, item.quantity, item.level,
                    item.parent_assembly, item.unit, item.material,
                    item.volume, item.mass, item.category,
                    item.shape_type, item.assembly_path
                ]
                writer.writerow(row)
    
    def _export_xml(self, bom_structure: BOMStructure, file_path: Path):
        """XML formatında export"""
        import xml.etree.ElementTree as ET
        
        root = ET.Element('BOM')
        root.set('assembly_name', bom_structure.assembly_name)
        root.set('total_items', str(bom_structure.total_items))
        root.set('created_date', bom_structure.created_date.isoformat())
        
        # Items
        items_elem = ET.SubElement(root, 'Items')
        for item in bom_structure.items:
            item_elem = ET.SubElement(items_elem, 'Item')
            item_elem.set('number', str(item.item_number))
            item_elem.set('part_number', item.part_number)
            item_elem.set('quantity', str(item.quantity))
            item_elem.set('level', str(item.level))
            
            # Alt elemanlar
            for field, value in asdict(item).items():
                if value is not None and field not in ['item_number', 'part_number', 'quantity', 'level']:
                    elem = ET.SubElement(item_elem, field)
                    elem.text = str(value)
        
        # XML'i dosyaya yaz
        tree = ET.ElementTree(root)
        tree.write(file_path, encoding='utf-8', xml_declaration=True)
    
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