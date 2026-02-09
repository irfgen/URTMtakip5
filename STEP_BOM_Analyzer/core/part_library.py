"""
STEP BOM Analyzer - Standard Parts Library
Manages standard parts database and integration with BOM analysis.
"""

import os
import json
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime
import hashlib
import requests
from urllib.parse import urlparse
import threading
import fnmatch


class PartCategory(Enum):
    FASTENER = "fastener"
    BEARING = "bearing"
    SPRING = "spring"
    GASKET = "gasket"
    O_RING = "o_ring"
    WASHER = "washer"
    NUT = "nut"
    BOLT = "bolt"
    SCREW = "screw"
    PIN = "pin"
    SEAL = "seal"
    ELECTRICAL = "electrical"
    PNEUMATIC = "pneumatic"
    HYDRAULIC = "hydraulic"
    CUSTOM = "custom"


@dataclass
class StandardPart:
    """Standard part definition"""
    part_id: str
    name: str
    description: str
    category: PartCategory
    manufacturer: str
    part_number: str
    specifications: Dict[str, Any]
    material: str
    dimensions: Dict[str, float]
    mass: float
    volume: float
    cost: Optional[float] = None
    supplier: Optional[str] = None
    datasheet_url: Optional[str] = None
    cad_file_path: Optional[str] = None
    image_path: Optional[str] = None
    tags: List[str] = None
    created_date: datetime = None
    modified_date: datetime = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.created_date is None:
            self.created_date = datetime.now()
        if self.modified_date is None:
            self.modified_date = datetime.now()


@dataclass
class PartMatch:
    """Part matching result"""
    detected_part_name: str
    standard_part: StandardPart
    confidence: float
    match_criteria: List[str]
    suggested_replacement: bool = False


class PartLibraryDB:
    """SQLite database for standard parts"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()
    
    def _init_database(self):
        """Initialize database schema"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            
            # Standard parts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS standard_parts (
                    part_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL,
                    manufacturer TEXT,
                    part_number TEXT,
                    specifications TEXT,
                    material TEXT,
                    dimensions TEXT,
                    mass REAL,
                    volume REAL,
                    cost REAL,
                    supplier TEXT,
                    datasheet_url TEXT,
                    cad_file_path TEXT,
                    image_path TEXT,
                    tags TEXT,
                    created_date TEXT,
                    modified_date TEXT
                )
            ''')
            
            # Search index table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS part_search_index (
                    part_id TEXT,
                    search_term TEXT,
                    weight REAL,
                    FOREIGN KEY(part_id) REFERENCES standard_parts(part_id)
                )
            ''')
            
            # Part aliases table (for common name variations)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS part_aliases (
                    part_id TEXT,
                    alias TEXT,
                    FOREIGN KEY(part_id) REFERENCES standard_parts(part_id)
                )
            ''')
            
            conn.commit()
            
        finally:
            conn.close()
    
    def add_part(self, part: StandardPart) -> bool:
        """Add standard part to database"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO standard_parts (
                    part_id, name, description, category, manufacturer, part_number,
                    specifications, material, dimensions, mass, volume, cost,
                    supplier, datasheet_url, cad_file_path, image_path, tags,
                    created_date, modified_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                part.part_id, part.name, part.description, part.category.value,
                part.manufacturer, part.part_number,
                json.dumps(part.specifications), part.material,
                json.dumps(part.dimensions), part.mass, part.volume, part.cost,
                part.supplier, part.datasheet_url, part.cad_file_path,
                part.image_path, json.dumps(part.tags),
                part.created_date.isoformat(), part.modified_date.isoformat()
            ))
            
            # Update search index
            self._update_search_index(cursor, part)
            
            conn.commit()
            return True
            
        except Exception as e:
            logging.error(f"Error adding part {part.part_id}: {e}")
            return False
        finally:
            conn.close()
    
    def _update_search_index(self, cursor, part: StandardPart):
        """Update search index for part"""
        # Remove old entries
        cursor.execute('DELETE FROM part_search_index WHERE part_id = ?', (part.part_id,))
        
        # Add search terms with weights
        search_terms = [
            (part.name, 1.0),
            (part.description, 0.8),
            (part.manufacturer, 0.6),
            (part.part_number, 0.9),
            (part.material, 0.5),
            (part.category.value, 0.7)
        ]
        
        # Add tags
        for tag in part.tags:
            search_terms.append((tag, 0.4))
        
        # Add dimension values
        for dim_name, dim_value in part.dimensions.items():
            search_terms.append((f"{dim_name}_{dim_value}", 0.3))
        
        for term, weight in search_terms:
            if term:
                cursor.execute(
                    'INSERT INTO part_search_index (part_id, search_term, weight) VALUES (?, ?, ?)',
                    (part.part_id, str(term).lower(), weight)
                )
    
    def search_parts(self, query: str, category: PartCategory = None) -> List[StandardPart]:
        """Search parts by query"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            
            query_lower = query.lower()
            
            # Build search query
            sql = '''
                SELECT p.*, SUM(i.weight) as relevance_score
                FROM standard_parts p
                LEFT JOIN part_search_index i ON p.part_id = i.part_id
                WHERE i.search_term LIKE ?
            '''
            params = [f'%{query_lower}%']
            
            if category:
                sql += ' AND p.category = ?'
                params.append(category.value)
            
            sql += '''
                GROUP BY p.part_id
                ORDER BY relevance_score DESC, p.name
                LIMIT 50
            '''
            
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            
            return [self._row_to_part(row) for row in rows]
            
        finally:
            conn.close()
    
    def get_part_by_id(self, part_id: str) -> Optional[StandardPart]:
        """Get part by ID"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM standard_parts WHERE part_id = ?', (part_id,))
            row = cursor.fetchone()
            return self._row_to_part(row) if row else None
        finally:
            conn.close()
    
    def _row_to_part(self, row) -> StandardPart:
        """Convert database row to StandardPart"""
        return StandardPart(
            part_id=row[0],
            name=row[1],
            description=row[2],
            category=PartCategory(row[3]),
            manufacturer=row[4],
            part_number=row[5],
            specifications=json.loads(row[6] or '{}'),
            material=row[7],
            dimensions=json.loads(row[8] or '{}'),
            mass=row[9],
            volume=row[10],
            cost=row[11],
            supplier=row[12],
            datasheet_url=row[13],
            cad_file_path=row[14],
            image_path=row[15],
            tags=json.loads(row[16] or '[]'),
            created_date=datetime.fromisoformat(row[17]),
            modified_date=datetime.fromisoformat(row[18])
        )


class PartMatcher:
    """Intelligent part matching engine"""
    
    def __init__(self, db: PartLibraryDB):
        self.db = db
        self.logger = logging.getLogger(__name__)
    
    def match_bom_parts(self, bom_parts: List[Dict[str, Any]]) -> List[PartMatch]:
        """Match BOM parts against standard library"""
        matches = []
        
        for bom_part in bom_parts:
            part_matches = self.find_matches(bom_part)
            matches.extend(part_matches)
        
        return matches
    
    def find_matches(self, bom_part: Dict[str, Any]) -> List[PartMatch]:
        """Find matches for a single BOM part"""
        part_name = bom_part.get('name', '')
        if not part_name:
            return []
        
        matches = []
        
        # Direct name search
        name_matches = self._search_by_name(part_name)
        for standard_part, confidence in name_matches:
            matches.append(PartMatch(
                detected_part_name=part_name,
                standard_part=standard_part,
                confidence=confidence,
                match_criteria=['name']
            ))
        
        # Dimensional matching
        if 'dimensions' in bom_part or any(key in bom_part for key in ['length', 'width', 'height', 'diameter']):
            dim_matches = self._search_by_dimensions(bom_part)
            for standard_part, confidence in dim_matches:
                matches.append(PartMatch(
                    detected_part_name=part_name,
                    standard_part=standard_part,
                    confidence=confidence,
                    match_criteria=['dimensions']
                ))
        
        # Material + category matching
        if 'material' in bom_part:
            material_matches = self._search_by_material(bom_part)
            for standard_part, confidence in material_matches:
                matches.append(PartMatch(
                    detected_part_name=part_name,
                    standard_part=standard_part,
                    confidence=confidence,
                    match_criteria=['material']
                ))
        
        # Remove duplicates and sort by confidence
        unique_matches = {}
        for match in matches:
            key = match.standard_part.part_id
            if key not in unique_matches or match.confidence > unique_matches[key].confidence:
                unique_matches[key] = match
        
        return sorted(unique_matches.values(), key=lambda x: x.confidence, reverse=True)[:5]
    
    def _search_by_name(self, part_name: str) -> List[Tuple[StandardPart, float]]:
        """Search by part name with fuzzy matching"""
        results = []
        
        # Extract key terms from part name
        terms = self._extract_search_terms(part_name)
        
        for term in terms:
            parts = self.db.search_parts(term)
            for part in parts:
                confidence = self._calculate_name_similarity(part_name, part.name)
                if confidence > 0.3:  # Minimum threshold
                    results.append((part, confidence))
        
        return results
    
    def _search_by_dimensions(self, bom_part: Dict[str, Any]) -> List[Tuple[StandardPart, float]]:
        """Search by dimensional similarity"""
        results = []
        
        # Extract dimensions
        bom_dimensions = self._extract_dimensions(bom_part)
        if not bom_dimensions:
            return results
        
        # Search for parts with similar dimensions
        # This is a simplified approach - in practice, you'd want more sophisticated matching
        for dim_name, dim_value in bom_dimensions.items():
            search_term = f"{dim_name}_{dim_value}"
            parts = self.db.search_parts(search_term)
            
            for part in parts:
                confidence = self._calculate_dimensional_similarity(bom_dimensions, part.dimensions)
                if confidence > 0.5:
                    results.append((part, confidence))
        
        return results
    
    def _search_by_material(self, bom_part: Dict[str, Any]) -> List[Tuple[StandardPart, float]]:
        """Search by material match"""
        material = bom_part.get('material', '')
        if not material:
            return []
        
        parts = self.db.search_parts(material)
        results = []
        
        for part in parts:
            if part.material.lower() == material.lower():
                confidence = 0.8
            elif material.lower() in part.material.lower():
                confidence = 0.6
            else:
                confidence = 0.3
            
            results.append((part, confidence))
        
        return results
    
    def _extract_search_terms(self, part_name: str) -> List[str]:
        """Extract searchable terms from part name"""
        # Remove common prefixes/suffixes
        name = part_name.lower().strip()
        
        # Common patterns to extract
        patterns = [
            r'bolt\s*m?(\d+)',      # Bolts
            r'screw\s*m?(\d+)',     # Screws
            r'bearing\s*(\d+)',     # Bearings
            r'washer\s*(\d+)',      # Washers
            r'o[_-]?ring',          # O-rings
            r'gasket',              # Gaskets
            r'spring'               # Springs
        ]
        
        terms = [name]  # Always include full name
        
        # Add individual words
        words = name.replace('_', ' ').replace('-', ' ').split()
        terms.extend([word for word in words if len(word) > 2])
        
        return list(set(terms))
    
    def _extract_dimensions(self, bom_part: Dict[str, Any]) -> Dict[str, float]:
        """Extract dimensions from BOM part"""
        dimensions = {}
        
        # Direct dimensions field
        if 'dimensions' in bom_part and isinstance(bom_part['dimensions'], dict):
            dimensions.update(bom_part['dimensions'])
        
        # Individual dimension fields
        for field in ['length', 'width', 'height', 'diameter', 'thickness']:
            if field in bom_part:
                try:
                    dimensions[field] = float(bom_part[field])
                except (ValueError, TypeError):
                    pass
        
        return dimensions
    
    def _calculate_name_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between two part names"""
        name1_lower = name1.lower().strip()
        name2_lower = name2.lower().strip()
        
        # Exact match
        if name1_lower == name2_lower:
            return 1.0
        
        # Substring match
        if name1_lower in name2_lower or name2_lower in name1_lower:
            return 0.8
        
        # Word overlap
        words1 = set(name1_lower.replace('_', ' ').replace('-', ' ').split())
        words2 = set(name2_lower.replace('_', ' ').replace('-', ' ').split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _calculate_dimensional_similarity(self, dims1: Dict[str, float], dims2: Dict[str, float]) -> float:
        """Calculate dimensional similarity"""
        if not dims1 or not dims2:
            return 0.0
        
        common_dims = set(dims1.keys()).intersection(set(dims2.keys()))
        if not common_dims:
            return 0.0
        
        similarities = []
        for dim in common_dims:
            val1, val2 = dims1[dim], dims2[dim]
            if val1 == 0 or val2 == 0:
                continue
            
            # Calculate percentage difference
            diff = abs(val1 - val2) / max(val1, val2)
            similarity = max(0, 1 - diff)
            similarities.append(similarity)
        
        return sum(similarities) / len(similarities) if similarities else 0.0


class PartLibraryManager:
    """Main part library management interface"""
    
    def __init__(self, library_dir: Path = None):
        self.library_dir = library_dir or Path("part_library")
        self.library_dir.mkdir(exist_ok=True)
        
        # Initialize database
        db_path = self.library_dir / "parts.db"
        self.db = PartLibraryDB(db_path)
        self.matcher = PartMatcher(self.db)
        
        self.logger = logging.getLogger(__name__)
        
        # Load default parts if database is empty
        self._ensure_default_parts()
    
    def _ensure_default_parts(self):
        """Add default standard parts if database is empty"""
        # Check if database has parts
        test_parts = self.db.search_parts("test")
        if test_parts:
            return  # Database already has parts
        
        # Add common fasteners
        default_parts = [
            StandardPart(
                part_id="bolt_m8_50",
                name="M8 x 50 Hex Bolt",
                description="ISO 4017 hex head bolt",
                category=PartCategory.BOLT,
                manufacturer="Generic",
                part_number="M8x50",
                specifications={"thread": "M8", "length": 50, "standard": "ISO 4017"},
                material="Steel",
                dimensions={"diameter": 8, "length": 50, "head_width": 13},
                mass=15.2,
                volume=2000,
                tags=["hex", "bolt", "m8", "iso4017"]
            ),
            StandardPart(
                part_id="nut_m8",
                name="M8 Hex Nut",
                description="ISO 4032 hex nut",
                category=PartCategory.NUT,
                manufacturer="Generic", 
                part_number="M8",
                specifications={"thread": "M8", "standard": "ISO 4032"},
                material="Steel",
                dimensions={"diameter": 8, "width": 13, "thickness": 6.5},
                mass=5.1,
                volume=650,
                tags=["hex", "nut", "m8", "iso4032"]
            ),
            StandardPart(
                part_id="washer_m8",
                name="M8 Flat Washer", 
                description="ISO 7089 flat washer",
                category=PartCategory.WASHER,
                manufacturer="Generic",
                part_number="M8",
                specifications={"inner_diameter": 8.4, "standard": "ISO 7089"},
                material="Steel",
                dimensions={"inner_diameter": 8.4, "outer_diameter": 16, "thickness": 1.6},
                mass=1.8,
                volume=230,
                tags=["flat", "washer", "m8", "iso7089"]
            ),
            StandardPart(
                part_id="bearing_6202",
                name="6202 Ball Bearing",
                description="Deep groove ball bearing",
                category=PartCategory.BEARING,
                manufacturer="Generic",
                part_number="6202",
                specifications={"bore": 15, "outer_diameter": 35, "width": 11},
                material="Steel",
                dimensions={"bore": 15, "outer_diameter": 35, "width": 11},
                mass=32.5,
                volume=4200,
                tags=["ball", "bearing", "6202", "deep_groove"]
            )
        ]
        
        for part in default_parts:
            self.db.add_part(part)
        
        self.logger.info(f"Added {len(default_parts)} default parts to library")
    
    def add_standard_part(self, part: StandardPart) -> bool:
        """Add standard part to library"""
        return self.db.add_part(part)
    
    def search_parts(self, query: str, category: PartCategory = None) -> List[StandardPart]:
        """Search standard parts"""
        return self.db.search_parts(query, category)
    
    def match_bom_parts(self, bom_parts: List[Dict[str, Any]]) -> List[PartMatch]:
        """Match BOM parts against standard library"""
        return self.matcher.match_bom_parts(bom_parts)
    
    def import_parts_from_csv(self, csv_file: Path) -> int:
        """Import parts from CSV file"""
        import csv
        
        imported_count = 0
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    try:
                        part = StandardPart(
                            part_id=row['part_id'],
                            name=row['name'],
                            description=row.get('description', ''),
                            category=PartCategory(row['category']),
                            manufacturer=row.get('manufacturer', ''),
                            part_number=row.get('part_number', ''),
                            specifications=json.loads(row.get('specifications', '{}')),
                            material=row.get('material', ''),
                            dimensions=json.loads(row.get('dimensions', '{}')),
                            mass=float(row.get('mass', 0)),
                            volume=float(row.get('volume', 0)),
                            cost=float(row['cost']) if row.get('cost') else None,
                            supplier=row.get('supplier'),
                            tags=json.loads(row.get('tags', '[]'))
                        )
                        
                        if self.db.add_part(part):
                            imported_count += 1
                            
                    except Exception as e:
                        self.logger.error(f"Error importing part from row {row}: {e}")
            
            self.logger.info(f"Imported {imported_count} parts from {csv_file}")
            return imported_count
            
        except Exception as e:
            self.logger.error(f"Error reading CSV file {csv_file}: {e}")
            return 0
    
    def export_library_to_csv(self, output_file: Path) -> bool:
        """Export entire library to CSV"""
        import csv
        
        try:
            # Get all parts
            all_parts = []
            for category in PartCategory:
                parts = self.db.search_parts("", category)
                all_parts.extend(parts)
            
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = [
                    'part_id', 'name', 'description', 'category', 'manufacturer',
                    'part_number', 'specifications', 'material', 'dimensions',
                    'mass', 'volume', 'cost', 'supplier', 'tags'
                ]
                
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for part in all_parts:
                    writer.writerow({
                        'part_id': part.part_id,
                        'name': part.name,
                        'description': part.description,
                        'category': part.category.value,
                        'manufacturer': part.manufacturer,
                        'part_number': part.part_number,
                        'specifications': json.dumps(part.specifications),
                        'material': part.material,
                        'dimensions': json.dumps(part.dimensions),
                        'mass': part.mass,
                        'volume': part.volume,
                        'cost': part.cost,
                        'supplier': part.supplier,
                        'tags': json.dumps(part.tags)
                    })
            
            self.logger.info(f"Exported {len(all_parts)} parts to {output_file}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error exporting library to {output_file}: {e}")
            return False


def part_library_example():
    """Example usage of part library"""
    
    # Initialize library
    library = PartLibraryManager()
    
    # Search for bolts
    bolts = library.search_parts("bolt", PartCategory.BOLT)
    print(f"Found {len(bolts)} bolts")
    
    # Example BOM parts
    bom_parts = [
        {
            'name': 'HEX BOLT M8x50',
            'material': 'Steel',
            'dimensions': {'diameter': 8, 'length': 50}
        },
        {
            'name': 'Ball Bearing 6202',
            'material': 'Steel'
        }
    ]
    
    # Match BOM parts
    matches = library.match_bom_parts(bom_parts)
    
    for match in matches:
        print(f"Detected: {match.detected_part_name}")
        print(f"Matched: {match.standard_part.name} (confidence: {match.confidence:.2f})")
        print(f"Criteria: {match.match_criteria}")
        print()


if __name__ == "__main__":
    part_library_example()