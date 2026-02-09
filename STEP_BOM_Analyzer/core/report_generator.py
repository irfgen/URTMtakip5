"""
Report Generator Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül işleme sonuçlarından kapsamlı raporlar oluşturur.
HTML, PDF, Excel ve JSON formatlarında rapor üretimi.
"""

import os
import json
import csv
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import logging
from datetime import datetime
import base64
from jinja2 import Template

@dataclass
class ReportConfig:
    """Rapor konfigürasyonu"""
    title: str = "STEP BOM Analysis Report"
    company_name: str = "ÜRTM Takip"
    include_images: bool = True
    include_statistics: bool = True
    include_bom_tree: bool = True
    template_style: str = "professional"
    export_formats: List[str] = None
    
    def __post_init__(self):
        if self.export_formats is None:
            self.export_formats = ["html", "json"]

class ReportGenerator:
    """Kapsamlı Rapor Üreteci"""
    
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.logger = self._setup_logger()
        
        # Template'leri yükle
        self.html_template = self._load_html_template()
        
        self.logger.info(f"✅ Report Generator başlatıldı: {output_dir}")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("ReportGenerator")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def generate_comprehensive_report(self, processing_result: Dict, 
                                    config: Optional[ReportConfig] = None) -> Dict:
        """Kapsamlı rapor oluştur"""
        if config is None:
            config = ReportConfig()
        
        self.logger.info("📋 Kapsamlı rapor oluşturuluyor...")
        
        try:
            # Rapor verisini hazırla
            report_data = self._prepare_report_data(processing_result, config)
            
            # Export formatlarına göre rapor üret
            generated_files = {}
            
            for format_type in config.export_formats:
                if format_type == "html":
                    html_file = self._generate_html_report(report_data, config)
                    if html_file:
                        generated_files["html"] = html_file
                
                elif format_type == "json":
                    json_file = self._generate_json_report(report_data, config)
                    if json_file:
                        generated_files["json"] = json_file
                
                elif format_type == "csv":
                    csv_file = self._generate_csv_report(report_data, config)
                    if csv_file:
                        generated_files["csv"] = csv_file
                
                elif format_type == "excel":
                    excel_file = self._generate_excel_report(report_data, config)
                    if excel_file:
                        generated_files["excel"] = excel_file
            
            self.logger.info(f"✅ Rapor oluşturma tamamlandı: {len(generated_files)} format")
            
            return {
                "success": True,
                "generated_files": generated_files,
                "report_data": report_data
            }
            
        except Exception as e:
            self.logger.error(f"❌ Rapor oluşturma hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _prepare_report_data(self, processing_result: Dict, config: ReportConfig) -> Dict:
        """Rapor verisini hazırla"""
        report_data = {
            "metadata": {
                "title": config.title,
                "company_name": config.company_name,
                "generation_date": datetime.now().isoformat(),
                "generation_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "analyzer_version": "3.0.0",
                "report_type": "Comprehensive STEP BOM Analysis"
            },
            "executive_summary": self._create_executive_summary(processing_result),
            "file_analysis": processing_result.get("step_analysis"),
            "bom_analysis": processing_result.get("bom_extraction"),
            "rendering_results": processing_result.get("part_rendering"),
            "processing_statistics": {
                "total_execution_time": processing_result.get("execution_time", 0),
                "output_files_count": len(processing_result.get("output_files", [])),
                "processing_success": processing_result.get("success", False)
            }
        }
        
        # Images'i include et (eğer isteniyorsa)
        if config.include_images:
            report_data["images"] = self._collect_images()
        
        return report_data
    
    def _create_executive_summary(self, processing_result: Dict) -> Dict:
        """Executive summary oluştur"""
        summary = {
            "processing_success": processing_result.get("success", False),
            "total_execution_time": f"{processing_result.get('execution_time', 0):.2f}s"
        }
        
        # STEP Analysis summary
        step_analysis = processing_result.get("step_analysis")
        if step_analysis:
            analysis_info = step_analysis.get("analysis", {})
            summary.update({
                "total_objects": analysis_info.get("total_objects", 0),
                "parts_count": analysis_info.get("parts_count", 0),
                "assemblies_count": analysis_info.get("assemblies_count", 0)
            })
        
        # BOM Analysis summary
        bom_analysis = processing_result.get("bom_extraction")
        if bom_analysis:
            bom_stats = bom_analysis.get("statistics", {})
            summary.update({
                "unique_parts": bom_stats.get("unique_parts", 0),
                "unique_assemblies": bom_stats.get("unique_assemblies", 0),
                "max_hierarchy_depth": bom_stats.get("max_hierarchy_depth", 0)
            })
        
        # Rendering summary
        rendering = processing_result.get("part_rendering")
        if rendering:
            summary["rendered_parts"] = rendering.get("successful_renders", 0)
        
        return summary
    
    def _collect_images(self) -> Dict:
        """Output dizinindeki görselleri topla"""
        images = {
            "renders": [],
            "thumbnails": [],
            "diagrams": []
        }
        
        # Render klasöründeki görselleri bul
        renders_dir = self.output_dir / "renders"
        if renders_dir.exists():
            for img_file in renders_dir.rglob("*.png"):
                if img_file.is_file():
                    # Base64 encode et
                    try:
                        with open(img_file, "rb") as f:
                            img_data = base64.b64encode(f.read()).decode("utf-8")
                        
                        images["renders"].append({
                            "filename": img_file.name,
                            "path": str(img_file.relative_to(self.output_dir)),
                            "data": img_data,
                            "size": img_file.stat().st_size
                        })
                    except Exception as e:
                        self.logger.warning(f"Görsel yüklenemedi {img_file}: {e}")
        
        return images
    
    def _generate_html_report(self, report_data: Dict, config: ReportConfig) -> Optional[str]:
        """HTML raporu oluştur"""
        try:
            self.logger.info("🌐 HTML raporu oluşturuluyor...")
            
            html_content = self.html_template.render(**report_data)
            
            html_file = self.output_dir / "comprehensive_report.html"
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self.logger.info(f"✅ HTML raporu kaydedildi: {html_file}")
            return str(html_file)
            
        except Exception as e:
            self.logger.error(f"❌ HTML rapor hatası: {e}")
            return None
    
    def _generate_json_report(self, report_data: Dict, config: ReportConfig) -> Optional[str]:
        """JSON raporu oluştur"""
        try:
            self.logger.info("📄 JSON raporu oluşturuluyor...")
            
            json_file = self.output_dir / "comprehensive_report.json"
            
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info(f"✅ JSON raporu kaydedildi: {json_file}")
            return str(json_file)
            
        except Exception as e:
            self.logger.error(f"❌ JSON rapor hatası: {e}")
            return None
    
    def _generate_csv_report(self, report_data: Dict, config: ReportConfig) -> Optional[str]:
        """CSV raporu oluştur"""
        try:
            self.logger.info("📊 CSV raporu oluşturuluyor...")
            
            csv_file = self.output_dir / "comprehensive_report.csv"
            
            with open(csv_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Header
                writer.writerow(['=== STEP BOM ANALYSIS REPORT ==='])
                writer.writerow(['Generated:', report_data['metadata']['generation_timestamp']])
                writer.writerow(['Company:', report_data['metadata']['company_name']])
                writer.writerow([])
                
                # Executive Summary
                writer.writerow(['=== EXECUTIVE SUMMARY ==='])
                summary = report_data['executive_summary']
                for key, value in summary.items():
                    writer.writerow([key.replace('_', ' ').title(), value])
                writer.writerow([])
                
                # BOM Structure (eğer varsa)
                bom_analysis = report_data.get('bom_analysis')
                if bom_analysis:
                    writer.writerow(['=== BOM STRUCTURE ==='])
                    bom_structure = bom_analysis.get('bom_structure', [])
                    
                    writer.writerow(['Level', 'Name', 'Type', 'Quantity', 'Volume', 'Mass'])
                    
                    self._write_bom_csv_recursive(writer, bom_structure, 0)
            
            self.logger.info(f"✅ CSV raporu kaydedildi: {csv_file}")
            return str(csv_file)
            
        except Exception as e:
            self.logger.error(f"❌ CSV rapor hatası: {e}")
            return None
    
    def _write_bom_csv_recursive(self, writer, items: List[Dict], level: int):
        """BOM yapısını CSV'ye recursive yaz"""
        for item in items:
            writer.writerow([
                level,
                item.get('name', ''),
                item.get('item_type', ''),
                item.get('quantity', 0),
                f"{item.get('volume', 0):.3f}",
                f"{item.get('mass', 0):.3f}"
            ])
            
            children = item.get('children', [])
            if children:
                self._write_bom_csv_recursive(writer, children, level + 1)
    
    def _generate_excel_report(self, report_data: Dict, config: ReportConfig) -> Optional[str]:
        """Excel raporu oluştur (gelecekte implementasyon)"""
        # Excel kütüphanesi gerekli - şimdilik placeholder
        self.logger.info("📈 Excel raporu - gelecekte implementasyon")
        return None
    
    def _load_html_template(self) -> Template:
        """HTML template'ini yükle"""
        template_str = """
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ metadata.title }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 2.5em;
        }
        .header .company {
            color: #7f8c8d;
            font-size: 1.2em;
            margin-top: 10px;
        }
        .header .date {
            color: #95a5a6;
            margin-top: 5px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background: #fafafa;
        }
        .section h2 {
            color: #34495e;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric {
            background: white;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .metric .value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .metric .label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .bom-tree {
            font-family: monospace;
            background: white;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .bom-item {
            margin: 2px 0;
            padding: 5px;
            border-radius: 3px;
        }
        .bom-item.assembly {
            background: #e8f6ff;
            font-weight: bold;
        }
        .bom-item.part {
            background: #f0f8f0;
        }
        .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .image-item {
            text-align: center;
            background: white;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #e0e0e0;
        }
        .image-item img {
            max-width: 100%;
            height: auto;
            border-radius: 3px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{ metadata.title }}</h1>
            <div class="company">{{ metadata.company_name }}</div>
            <div class="date">{{ metadata.generation_timestamp }}</div>
        </div>

        <!-- Executive Summary -->
        <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="summary-grid">
                <div class="metric">
                    <div class="value">{{ executive_summary.total_objects | default(0) }}</div>
                    <div class="label">Total Objects</div>
                </div>
                <div class="metric">
                    <div class="value">{{ executive_summary.parts_count | default(0) }}</div>
                    <div class="label">Parts</div>
                </div>
                <div class="metric">
                    <div class="value">{{ executive_summary.assemblies_count | default(0) }}</div>
                    <div class="label">Assemblies</div>
                </div>
                <div class="metric">
                    <div class="value">{{ executive_summary.max_hierarchy_depth | default(0) }}</div>
                    <div class="label">Max Depth</div>
                </div>
            </div>
        </div>

        <!-- Processing Statistics -->
        <div class="section">
            <h2>⚡ Processing Statistics</h2>
            <div class="summary-grid">
                <div class="metric">
                    <div class="value">{{ processing_statistics.total_execution_time }}s</div>
                    <div class="label">Execution Time</div>
                </div>
                <div class="metric">
                    <div class="value">{{ processing_statistics.output_files_count }}</div>
                    <div class="label">Generated Files</div>
                </div>
                <div class="metric">
                    <div class="value">{% if processing_statistics.processing_success %}✅{% else %}❌{% endif %}</div>
                    <div class="label">Status</div>
                </div>
            </div>
        </div>

        <!-- BOM Structure -->
        {% if bom_analysis and bom_analysis.bom_structure %}
        <div class="section">
            <h2>🏗️ BOM Structure</h2>
            <div class="bom-tree">
                {% for item in bom_analysis.bom_structure %}
                    {{ render_bom_item(item, 0) }}
                {% endfor %}
            </div>
        </div>
        {% endif %}

        <!-- Images -->
        {% if images and images.renders %}
        <div class="section">
            <h2>🖼️ Rendered Images</h2>
            <div class="images-grid">
                {% for img in images.renders[:6] %}
                <div class="image-item">
                    <img src="data:image/png;base64,{{ img.data }}" alt="{{ img.filename }}">
                    <div>{{ img.filename }}</div>
                </div>
                {% endfor %}
            </div>
        </div>
        {% endif %}

        <!-- Footer -->
        <div class="footer">
            Generated by STEP BOM Analyzer v{{ metadata.analyzer_version }} - {{ metadata.company_name }}
        </div>
    </div>

    {% macro render_bom_item(item, level) %}
        <div class="bom-item {{ 'assembly' if item.item_type == 'Assembly' else 'part' }}">
            {{ "  " * level }}├─ {{ item.name }} ({{ item.quantity }}x) - {{ item.item_type }}
        </div>
        {% for child in item.children %}
            {{ render_bom_item(child, level + 1) }}
        {% endfor %}
    {% endmacro %}
</body>
</html>
        """
        
        return Template(template_str)

# Test fonksiyonu
def test_report_generator():
    """Report Generator'ı test et"""
    try:
        print("📋 Report Generator Test")
        print("=" * 50)
        
        # Test output dizini
        test_output_dir = "test_reports"
        
        generator = ReportGenerator(test_output_dir)
        
        # Test verisi
        test_data = {
            "success": True,
            "execution_time": 45.3,
            "step_analysis": {
                "analysis": {
                    "total_objects": 25,
                    "parts_count": 18,
                    "assemblies_count": 7
                }
            },
            "bom_extraction": {
                "statistics": {
                    "unique_parts": 15,
                    "unique_assemblies": 5,
                    "max_hierarchy_depth": 3
                },
                "bom_structure": [
                    {
                        "name": "MainAssembly",
                        "item_type": "Assembly",
                        "quantity": 1,
                        "children": [
                            {
                                "name": "Part1",
                                "item_type": "Part",
                                "quantity": 2,
                                "children": []
                            }
                        ]
                    }
                ]
            },
            "output_files": ["report.json", "bom.csv", "render1.png"]
        }
        
        # Rapor konfigürasyonu
        config = ReportConfig(
            title="Test STEP BOM Analysis",
            export_formats=["html", "json", "csv"]
        )
        
        # Rapor oluştur
        result = generator.generate_comprehensive_report(test_data, config)
        
        if result["success"]:
            print("✅ Test raporu başarıyla oluşturuldu")
            for format_type, file_path in result["generated_files"].items():
                print(f"  📄 {format_type.upper()}: {file_path}")
        else:
            print(f"❌ Test raporu hatası: {result['error']}")
        
        return generator
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_report_generator()