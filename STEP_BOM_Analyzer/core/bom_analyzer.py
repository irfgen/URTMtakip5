"""
BOM Analyzer Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül FreeCAD'dan çıkarılan BOM verilerini analiz eder ve işler.
Hierarchical BOM yapısını analiz eder ve istatistikleri sağlar.
"""

import json
import csv
import os
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import logging
from datetime import datetime

@dataclass
class BOMStatistics:
    """BOM İstatistikleri"""
    total_items: int = 0
    total_parts: int = 0
    total_assemblies: int = 0
    unique_parts: int = 0
    unique_assemblies: int = 0
    max_hierarchy_depth: int = 0
    total_volume: float = 0.0
    total_mass: float = 0.0
    part_count_distribution: Dict[str, int] = None
    assembly_complexity: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.part_count_distribution is None:
            self.part_count_distribution = {}
        if self.assembly_complexity is None:
            self.assembly_complexity = {}

@dataclass 
class PartInfo:
    """Part Bilgileri"""
    name: str
    label: str = ""
    quantity: int = 1
    volume: float = 0.0
    mass: float = 0.0
    surface_area: float = 0.0
    dimensions: Optional[Dict[str, float]] = None
    level: int = 0
    parent: str = ""
    part_type: str = "Part"
    
    def __post_init__(self):
        if self.dimensions is None:
            self.dimensions = {"length": 0, "width": 0, "height": 0}

class BOMAnalyzer:
    """BOM Analysis Engine"""
    
    def __init__(self):
        self.logger = self._setup_logger()
        self.bom_data = None
        self.statistics = None
        self.parts_registry = {}
        self.assemblies_registry = {}
        
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("BOMAnalyzer")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def load_bom_data(self, bom_file_path: str) -> bool:
        """BOM JSON dosyasını yükle"""
        try:
            self.logger.info(f"BOM verisi yükleniyor: {bom_file_path}")
            
            if not os.path.exists(bom_file_path):
                raise FileNotFoundError(f"BOM dosyası bulunamadı: {bom_file_path}")
            
            with open(bom_file_path, 'r', encoding='utf-8') as f:
                self.bom_data = json.load(f)
            
            self.logger.info("✅ BOM verisi başarıyla yüklendi")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ BOM yükleme hatası: {e}")
            return False
    
    def analyze_bom_structure(self) -> BOMStatistics:
        """BOM yapısını analiz et"""
        if not self.bom_data:
            raise RuntimeError("BOM verisi yüklenmemiş")
        
        self.logger.info("🔍 BOM yapı analizi başlatılıyor...")
        
        try:
            # İstatistikleri sıfırla
            self.parts_registry = {}
            self.assemblies_registry = {}
            
            # Mevcut istatistikleri al (eğer varsa)
            existing_stats = self.bom_data.get('statistics', {})
            
            # BOM yapısını traverse et
            bom_structure = self.bom_data.get('bom_structure', [])
            
            total_volume = 0.0
            total_mass = 0.0
            
            for root_item in bom_structure:
                self._analyze_item_recursive(root_item, 0, total_volume, total_mass)
            
            # İstatistikleri oluştur
            stats = BOMStatistics(
                total_items=existing_stats.get('total_items', 0),
                total_parts=existing_stats.get('total_parts', 0),
                total_assemblies=existing_stats.get('total_assemblies', 0),
                unique_parts=existing_stats.get('unique_parts', len(self.parts_registry)),
                unique_assemblies=existing_stats.get('unique_assemblies', len(self.assemblies_registry)),
                max_hierarchy_depth=existing_stats.get('max_hierarchy_depth', 0),
                total_volume=total_volume,
                total_mass=total_mass,
                part_count_distribution=self._calculate_part_distribution(),
                assembly_complexity=self._analyze_assembly_complexity()
            )
            
            self.statistics = stats
            
            self.logger.info("✅ BOM analizi tamamlandı")
            self.logger.info(f"📊 Toplam Part: {stats.total_parts} ({stats.unique_parts} benzersiz)")
            self.logger.info(f"🏗️  Toplam Assembly: {stats.total_assemblies} ({stats.unique_assemblies} benzersiz)")
            self.logger.info(f"📏 Maksimum Derinlik: {stats.max_hierarchy_depth}")
            
            return stats
            
        except Exception as e:
            self.logger.error(f"❌ BOM analiz hatası: {e}")
            raise
    
    def _analyze_item_recursive(self, item: Dict, level: int, total_volume: float, total_mass: float) -> Tuple[float, float]:
        """Item'ı recursive olarak analiz et"""
        try:
            item_name = item.get('name', 'Unknown')
            item_type = item.get('item_type', 'Part')
            quantity = item.get('quantity', 1)
            volume = item.get('volume', 0.0)
            mass = item.get('mass', 0.0)
            
            # Registry'e ekle
            if item_type == "Part":
                if item_name in self.parts_registry:
                    self.parts_registry[item_name]['quantity'] += quantity
                else:
                    self.parts_registry[item_name] = {
                        'name': item_name,
                        'label': item.get('label', ''),
                        'quantity': quantity,
                        'volume': volume,
                        'mass': mass,
                        'level': level,
                        'dimensions': item.get('dimensions', {})
                    }
            else:
                if item_name in self.assemblies_registry:
                    self.assemblies_registry[item_name]['quantity'] += quantity
                else:
                    self.assemblies_registry[item_name] = {
                        'name': item_name,
                        'label': item.get('label', ''),
                        'quantity': quantity,
                        'children_count': len(item.get('children', [])),
                        'level': level,
                        'complexity_score': self._calculate_complexity_score(item)
                    }
            
            # Volume ve mass topla
            total_volume += volume * quantity
            total_mass += mass * quantity
            
            # Children için recursive çağrı
            children = item.get('children', [])
            for child in children:
                child_volume, child_mass = self._analyze_item_recursive(child, level + 1, 0, 0)
                total_volume += child_volume
                total_mass += child_mass
            
            return total_volume, total_mass
            
        except Exception as e:
            self.logger.warning(f"Item analiz hatası ({item.get('name', 'Unknown')}): {e}")
            return 0.0, 0.0
    
    def _calculate_part_distribution(self) -> Dict[str, int]:
        """Part sayım dağılımını hesapla"""
        distribution = {
            'single_use': 0,        # 1 adet kullanılan
            'low_use': 0,          # 2-5 adet
            'medium_use': 0,       # 6-20 adet  
            'high_use': 0,         # 21-100 adet
            'very_high_use': 0     # 100+ adet
        }
        
        for part_info in self.parts_registry.values():
            quantity = part_info['quantity']
            
            if quantity == 1:
                distribution['single_use'] += 1
            elif quantity <= 5:
                distribution['low_use'] += 1
            elif quantity <= 20:
                distribution['medium_use'] += 1
            elif quantity <= 100:
                distribution['high_use'] += 1
            else:
                distribution['very_high_use'] += 1
        
        return distribution
    
    def _analyze_assembly_complexity(self) -> Dict[str, Any]:
        """Assembly karmaşıklık analizi"""
        if not self.assemblies_registry:
            return {}
        
        child_counts = [info['children_count'] for info in self.assemblies_registry.values()]
        complexity_scores = [info['complexity_score'] for info in self.assemblies_registry.values()]
        
        return {
            'average_children': sum(child_counts) / len(child_counts) if child_counts else 0,
            'max_children': max(child_counts) if child_counts else 0,
            'min_children': min(child_counts) if child_counts else 0,
            'average_complexity': sum(complexity_scores) / len(complexity_scores) if complexity_scores else 0,
            'most_complex_assembly': max(
                self.assemblies_registry.items(), 
                key=lambda x: x[1]['complexity_score']
            )[0] if self.assemblies_registry else None
        }
    
    def _calculate_complexity_score(self, assembly_item: Dict) -> float:
        """Assembly karmaşıklık skoru hesapla"""
        base_score = len(assembly_item.get('children', []))
        
        # Depth bonus
        depth_bonus = assembly_item.get('level', 0) * 0.5
        
        # Child variety bonus
        child_types = set()
        for child in assembly_item.get('children', []):
            child_types.add(child.get('item_type', 'Part'))
        variety_bonus = len(child_types) * 0.2
        
        return base_score + depth_bonus + variety_bonus
    
    def get_critical_parts(self, threshold: int = 50) -> List[Dict]:
        """Kritik partları al (yüksek kullanım miktarı)"""
        critical_parts = []
        
        for part_name, part_info in self.parts_registry.items():
            if part_info['quantity'] >= threshold:
                critical_parts.append({
                    'name': part_name,
                    'label': part_info['label'],
                    'quantity': part_info['quantity'],
                    'volume': part_info['volume'],
                    'mass': part_info['mass'],
                    'level': part_info['level']
                })
        
        # Quantity'e göre sırala (azalan)
        critical_parts.sort(key=lambda x: x['quantity'], reverse=True)
        
        return critical_parts
    
    def get_complex_assemblies(self, threshold: float = 10.0) -> List[Dict]:
        """Karmaşık assembly'leri al"""
        complex_assemblies = []
        
        for asm_name, asm_info in self.assemblies_registry.items():
            if asm_info['complexity_score'] >= threshold:
                complex_assemblies.append({
                    'name': asm_name,
                    'label': asm_info['label'],
                    'children_count': asm_info['children_count'],
                    'complexity_score': asm_info['complexity_score'],
                    'level': asm_info['level']
                })
        
        # Complexity score'a göre sırala (azalan)
        complex_assemblies.sort(key=lambda x: x['complexity_score'], reverse=True)
        
        return complex_assemblies
    
    def generate_part_usage_report(self) -> Dict:
        """Part kullanım raporu oluştur"""
        if not self.parts_registry:
            return {}
        
        # En çok kullanılan 10 part
        top_parts = sorted(
            self.parts_registry.values(),
            key=lambda x: x['quantity'],
            reverse=True
        )[:10]
        
        # Volume analizi
        volume_analysis = {
            'total_volume': sum(p['volume'] * p['quantity'] for p in self.parts_registry.values()),
            'largest_parts': sorted(
                self.parts_registry.values(),
                key=lambda x: x['volume'],
                reverse=True
            )[:5]
        }
        
        # Mass analizi
        mass_analysis = {
            'total_mass': sum(p['mass'] * p['quantity'] for p in self.parts_registry.values()),
            'heaviest_parts': sorted(
                self.parts_registry.values(),
                key=lambda x: x['mass'],
                reverse=True
            )[:5]
        }
        
        return {
            'part_count': len(self.parts_registry),
            'top_usage_parts': top_parts,
            'volume_analysis': volume_analysis,
            'mass_analysis': mass_analysis,
            'usage_distribution': self._calculate_part_distribution()
        }
    
    def export_analysis_to_csv(self, output_path: str) -> bool:
        """Analiz sonucunu CSV'ye export et"""
        try:
            self.logger.info(f"CSV export başlatılıyor: {output_path}")
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Parts section
                writer.writerow(['=== PARTS ANALYSIS ==='])
                writer.writerow(['Name', 'Label', 'Quantity', 'Volume', 'Mass', 'Level', 'Length', 'Width', 'Height'])
                
                for part_info in sorted(self.parts_registry.values(), key=lambda x: x['quantity'], reverse=True):
                    dims = part_info.get('dimensions', {})
                    writer.writerow([
                        part_info['name'],
                        part_info['label'],
                        part_info['quantity'],
                        f"{part_info['volume']:.3f}",
                        f"{part_info['mass']:.3f}",
                        part_info['level'],
                        f"{dims.get('length', 0):.2f}",
                        f"{dims.get('width', 0):.2f}",
                        f"{dims.get('height', 0):.2f}"
                    ])
                
                # Assemblies section
                writer.writerow([])
                writer.writerow(['=== ASSEMBLIES ANALYSIS ==='])
                writer.writerow(['Name', 'Label', 'Quantity', 'Children Count', 'Complexity Score', 'Level'])
                
                for asm_info in sorted(self.assemblies_registry.values(), key=lambda x: x['complexity_score'], reverse=True):
                    writer.writerow([
                        asm_info['name'],
                        asm_info['label'],
                        asm_info['quantity'],
                        asm_info['children_count'],
                        f"{asm_info['complexity_score']:.2f}",
                        asm_info['level']
                    ])
            
            self.logger.info("✅ CSV export tamamlandı")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ CSV export hatası: {e}")
            return False
    
    def export_statistics_to_json(self, output_path: str) -> bool:
        """İstatistikleri JSON'a export et"""
        try:
            if not self.statistics:
                raise RuntimeError("İstatistikler hesaplanmamış")
            
            self.logger.info(f"Statistics JSON export: {output_path}")
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            export_data = {
                'analysis_date': datetime.now().isoformat(),
                'statistics': asdict(self.statistics),
                'part_usage_report': self.generate_part_usage_report(),
                'critical_parts': self.get_critical_parts(),
                'complex_assemblies': self.get_complex_assemblies()
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info("✅ Statistics JSON export tamamlandı")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Statistics export hatası: {e}")
            return False

def test_bom_analyzer():
    """BOM Analyzer'ı test et"""
    try:
        print("🔍 BOM Analyzer Test")
        print("=" * 50)
        
        analyzer = BOMAnalyzer()
        
        # Test BOM dosyası yolu (gerçek dosya gerekli)
        test_bom_file = "test_data/hierarchical_bom.json"
        
        if os.path.exists(test_bom_file):
            print(f"📁 Test BOM dosyası: {test_bom_file}")
            
            # BOM yükle
            if analyzer.load_bom_data(test_bom_file):
                print("✅ BOM verisi yüklendi")
                
                # Analiz yap
                stats = analyzer.analyze_bom_structure()
                print(f"📊 Analiz tamamlandı: {stats.unique_parts} benzersiz part")
                
                # Critical parts
                critical = analyzer.get_critical_parts()
                print(f"⚠️  Kritik part sayısı: {len(critical)}")
                
            else:
                print("❌ BOM verisi yüklenemedi")
        else:
            print(f"⚠️  Test BOM dosyası bulunamadı: {test_bom_file}")
            print("💡 Gerçek BOM dosyası ile test edilmeli")
        
        return analyzer
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_bom_analyzer()