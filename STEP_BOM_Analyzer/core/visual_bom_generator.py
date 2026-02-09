"""
Visual BOM Generator

Görsel BOM raporları oluşturmak için modül.
HTML, PDF ve Excel formatlarında detaylı BOM raporları üretir.
Part resimlerini entegre ederek kapsamlı dökümantasyon sağlar.
"""

import os
import json
from pathlib import Path

# Optional dependencies
try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import base64

# PDF generation
try:
    import weasyprint
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

# HTML template rendering
try:
    from jinja2 import Template
    JINJA2_AVAILABLE = True
except ImportError:
    JINJA2_AVAILABLE = False

# Image processing
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from .bom_extractor_v2 import BOMStructureV2, BOMItemV2
from .freecad_visualizer import BatchRenderResult, PartRenderResult


@dataclass
class BOMReportConfig:
    """BOM rapor konfigürasyonu"""
    include_images: bool = True
    include_thumbnails: bool = True
    include_part_details: bool = True
    include_geometry_info: bool = True
    include_assembly_tree: bool = True
    include_statistics: bool = True
    show_quantities: bool = True
    show_part_numbers: bool = True
    show_descriptions: bool = True
    group_by_category: bool = False
    
    # Visual settings
    thumbnail_size: Tuple[int, int] = (150, 150)
    image_quality: int = 85
    table_style: str = "modern"  # modern, classic, minimal
    
    # Report metadata
    title: str = "Bill of Materials Report"
    company: str = "ÜRTM Takip System"
    project_name: str = ""
    revision: str = "1.0"
    
    # Export settings
    formats: List[str] = field(default_factory=lambda: ["html", "excel"])
    separate_image_folder: bool = True


@dataclass
class BOMReportResult:
    """BOM rapor sonucu"""
    success: bool
    report_files: List[str] = field(default_factory=list)
    image_folder: Optional[str] = None
    total_parts: int = 0
    total_assemblies: int = 0
    generation_time: float = 0.0
    file_sizes: Dict[str, int] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)


class VisualBOMGenerator:
    """Görsel BOM rapor üreticisi"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        
        # Check dependencies
        self.capabilities = {
            'pdf': PDF_AVAILABLE,
            'templates': JINJA2_AVAILABLE,
            'images': PIL_AVAILABLE,
            'excel': XLSXWRITER_AVAILABLE
        }
        
        self._log_info("Visual BOM Generator initialized")
        if not PDF_AVAILABLE:
            self._log_warning("WeasyPrint not available - PDF generation disabled")
        if not JINJA2_AVAILABLE:
            self._log_warning("Jinja2 not available - using basic templating")
        if not PIL_AVAILABLE:
            self._log_warning("PIL not available - image processing limited")
        if not XLSXWRITER_AVAILABLE:
            self._log_warning("xlsxwriter not available - Excel generation disabled")
    
    def generate_visual_bom(self, 
                           bom_structure: BOMStructureV2,
                           render_result: BatchRenderResult = None,
                           output_dir: str = "./bom_reports",
                           report_config: BOMReportConfig = None) -> BOMReportResult:
        """Kapsamlı görsel BOM raporu oluştur"""
        
        import time
        start_time = time.time()
        
        if report_config is None:
            report_config = BOMReportConfig()
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        self._log_info(f"Visual BOM generation başlatılıyor: {bom_structure.assembly_name}")
        
        result = BOMReportResult(
            success=False,
            total_parts=bom_structure.total_parts,
            total_assemblies=bom_structure.total_assemblies
        )
        
        try:
            # Prepare data
            report_data = self._prepare_report_data(bom_structure, render_result, report_config)
            
            # Generate requested formats
            generated_files = []
            
            if "html" in report_config.formats:
                html_file = self._generate_html_report(report_data, output_path, report_config)
                if html_file:
                    generated_files.append(html_file)
            
            if "excel" in report_config.formats and XLSXWRITER_AVAILABLE:
                excel_file = self._generate_excel_report(report_data, output_path, report_config)
                if excel_file:
                    generated_files.append(excel_file)
            elif "excel" in report_config.formats:
                result.errors.append("Excel generation not available - xlsxwriter required")
            
            if "pdf" in report_config.formats and PDF_AVAILABLE:
                pdf_file = self._generate_pdf_report(report_data, output_path, report_config)
                if pdf_file:
                    generated_files.append(pdf_file)
            elif "pdf" in report_config.formats:
                result.errors.append("PDF generation not available - WeasyPrint required")
            
            # Calculate file sizes
            file_sizes = {}
            for file_path in generated_files:
                if os.path.exists(file_path):
                    file_sizes[os.path.basename(file_path)] = os.path.getsize(file_path)
            
            result.success = len(generated_files) > 0
            result.report_files = generated_files
            result.file_sizes = file_sizes
            result.generation_time = time.time() - start_time
            
            if report_config.separate_image_folder and render_result:
                result.image_folder = str(output_path / "images")
            
            self._log_info(f"Visual BOM generation tamamlandı: {len(generated_files)} files, "
                          f"{result.generation_time:.2f}s")
            
            return result
            
        except Exception as e:
            result.errors.append(f"BOM generation failed: {str(e)}")
            result.generation_time = time.time() - start_time
            self._log_error(f"Visual BOM generation failed: {e}")
            return result
    
    def _prepare_report_data(self, 
                           bom_structure: BOMStructureV2,
                           render_result: BatchRenderResult,
                           config: BOMReportConfig) -> Dict[str, Any]:
        """Rapor verisini hazırla"""
        
        # Part images mapping
        part_images = {}
        if render_result and render_result.results:
            for render in render_result.results:
                if render.success and render.part_info:
                    part_number = render.part_info.part_number
                    part_images[part_number] = {
                        'thumbnail': render.thumbnail_path,
                        'screenshots': render.screenshot_paths,
                        'render_time': render.render_time
                    }
        
        # Group by category if requested
        grouped_items = {}
        if config.group_by_category:
            for item in bom_structure.items:
                category = item.category or "Uncategorized"
                if category not in grouped_items:
                    grouped_items[category] = []
                grouped_items[category].append(item)
        else:
            grouped_items["All Parts"] = bom_structure.items
        
        # Statistics
        statistics = self._calculate_statistics(bom_structure)
        
        # Assembly tree
        assembly_tree = self._build_assembly_tree(bom_structure) if config.include_assembly_tree else None
        
        report_data = {
            'metadata': {
                'title': config.title,
                'company': config.company,
                'project_name': config.project_name or bom_structure.assembly_name,
                'revision': config.revision,
                'generated_date': datetime.now(),
                'source_file': bom_structure.source_file,
                'generator': 'STEP BOM Analyzer v2.0'
            },
            'bom_structure': bom_structure,
            'grouped_items': grouped_items,
            'part_images': part_images,
            'statistics': statistics,
            'assembly_tree': assembly_tree,
            'config': config,
            'render_stats': {
                'total_images': render_result.total_images if render_result else 0,
                'render_time': render_result.total_time if render_result else 0,
                'successful_renders': render_result.successful_renders if render_result else 0
            }
        }
        
        return report_data
    
    def _generate_html_report(self, 
                             report_data: Dict[str, Any],
                             output_path: Path,
                             config: BOMReportConfig) -> Optional[str]:
        """HTML raporu oluştur"""
        
        try:
            html_file = output_path / f"{report_data['metadata']['project_name']}_BOM.html"
            
            # Always use basic HTML generation for now
            html_content = self._generate_html_basic(report_data, config)
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self._log_info(f"HTML report generated: {html_file}")
            return str(html_file)
            
        except Exception as e:
            self._log_error(f"HTML report generation failed: {e}")
            return None
    
    def _generate_html_basic(self, report_data: Dict[str, Any], config: BOMReportConfig) -> str:
        """Basic HTML raporu (Jinja2 olmadan)"""
        
        metadata = report_data['metadata']
        bom_structure = report_data['bom_structure']
        grouped_items = report_data['grouped_items']
        part_images = report_data['part_images']
        statistics = report_data['statistics']
        
        html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{metadata['title']} - {metadata['project_name']}</title>
    <style>
        {self._get_html_styles(config.table_style)}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔩 {metadata['title']}</h1>
            <div class="metadata">
                <div class="metadata-grid">
                    <div><strong>Project:</strong> {metadata['project_name']}</div>
                    <div><strong>Company:</strong> {metadata['company']}</div>
                    <div><strong>Revision:</strong> {metadata['revision']}</div>
                    <div><strong>Generated:</strong> {metadata['generated_date'].strftime('%Y-%m-%d %H:%M:%S')}</div>
                    <div><strong>Source File:</strong> {metadata['source_file']}</div>
                    <div><strong>Generator:</strong> {metadata['generator']}</div>
                </div>
            </div>
        </div>
        
        <!-- Statistics -->"""
        
        if config.include_statistics:
            html += f"""
        <div class="statistics">
            <h2>📊 Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">{statistics['total_items']}</div>
                    <div class="stat-label">Total Items</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{statistics['total_parts']}</div>
                    <div class="stat-label">Unique Parts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{statistics['total_assemblies']}</div>
                    <div class="stat-label">Assemblies</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{statistics['max_level']}</div>
                    <div class="stat-label">Max Level</div>
                </div>
            </div>
            
            <div class="category-stats">
                <h3>Parts by Category</h3>
                <div class="category-grid">"""
            
            for category, count in statistics['categories'].items():
                html += f'<div class="category-item"><span class="category-name">{category}</span><span class="category-count">{count}</span></div>'
            
            html += """
                </div>
            </div>
        </div>"""
        
        # BOM Table
        html += """
        <div class="bom-section">
            <h2>📋 Bill of Materials</h2>"""
        
        for group_name, items in grouped_items.items():
            if config.group_by_category and len(grouped_items) > 1:
                html += f'<h3 class="group-header">📦 {group_name}</h3>'
            
            html += """
            <div class="table-container">
                <table class="bom-table">
                    <thead>
                        <tr>"""
            
            if config.include_images:
                html += '<th>Image</th>'
            if config.show_part_numbers:
                html += '<th>Part Number</th>'
            
            html += '<th>Part Name</th>'
            
            if config.show_descriptions:
                html += '<th>Description</th>'
            if config.show_quantities:
                html += '<th>Qty</th>'
            if config.include_geometry_info:
                html += '<th>Type</th><th>Volume (mm³)</th><th>Surface Area (mm²)</th>'
            
            html += '<th>Level</th><th>Assembly Path</th>'
            html += """
                        </tr>
                    </thead>
                    <tbody>"""
            
            for item in items:
                html += '<tr>'
                
                # Image
                if config.include_images:
                    if item.part_number in part_images and part_images[item.part_number]['thumbnail']:
                        img_path = part_images[item.part_number]['thumbnail']
                        # Convert to relative path
                        img_name = os.path.basename(img_path)
                        html += f'<td class="image-cell"><img src="images/{img_name}" alt="{item.part_name}" class="part-thumbnail"></td>'
                    else:
                        html += '<td class="image-cell"><div class="no-image">No Image</div></td>'
                
                # Part Number
                if config.show_part_numbers:
                    html += f'<td class="part-number">{item.part_number}</td>'
                
                # Part Name
                html += f'<td class="part-name">{item.part_name}</td>'
                
                # Description
                if config.show_descriptions:
                    html += f'<td class="description">{item.description or ""}</td>'
                
                # Quantity
                if config.show_quantities:
                    html += f'<td class="quantity">{item.quantity}</td>'
                
                # Geometry info
                if config.include_geometry_info:
                    html += f'<td class="shape-type">{item.shape_type or "Unknown"}</td>'
                    html += f'<td class="volume">{item.volume:.2f}</td>' if item.volume else '<td class="volume">N/A</td>'
                    html += f'<td class="surface-area">{item.surface_area:.2f}</td>' if item.surface_area else '<td class="surface-area">N/A</td>'
                
                # Level and Assembly Path
                html += f'<td class="level">{item.level}</td>'
                html += f'<td class="assembly-path">{item.assembly_path or ""}</td>'
                
                html += '</tr>'
            
            html += """
                    </tbody>
                </table>
            </div>"""
        
        html += """
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Generated by STEP BOM Analyzer v2.0 | ÜRTM Takip System</p>
            <p>Report generated on """ + metadata['generated_date'].strftime('%Y-%m-%d %H:%M:%S') + """</p>
        </div>
    </div>
</body>
</html>"""
        
        return html
    
    def _generate_excel_report(self, 
                              report_data: Dict[str, Any],
                              output_path: Path,
                              config: BOMReportConfig) -> Optional[str]:
        """Excel raporu oluştur"""
        
        if not XLSXWRITER_AVAILABLE:
            return None
        
        try:
            excel_file = output_path / f"{report_data['metadata']['project_name']}_BOM.xlsx"
            
            workbook = xlsxwriter.Workbook(str(excel_file))
            
            # Formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4F81BD',
                'font_color': 'white',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })
            
            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })
            
            number_format = workbook.add_format({
                'border': 1,
                'align': 'right',
                'valign': 'vcenter',
                'num_format': '#,##0.00'
            })
            
            # Summary worksheet
            summary_ws = workbook.add_worksheet('Summary')
            self._write_excel_summary(summary_ws, report_data, workbook)
            
            # BOM worksheet
            bom_ws = workbook.add_worksheet('BOM')
            self._write_excel_bom(bom_ws, report_data, config, workbook, header_format, cell_format, number_format)
            
            # Statistics worksheet
            if config.include_statistics:
                stats_ws = workbook.add_worksheet('Statistics')
                self._write_excel_statistics(stats_ws, report_data, workbook)
            
            workbook.close()
            
            self._log_info(f"Excel report generated: {excel_file}")
            return str(excel_file)
            
        except Exception as e:
            self._log_error(f"Excel report generation failed: {e}")
            return None
    
    def _write_excel_bom(self, worksheet, report_data, config, workbook, header_format, cell_format, number_format):
        """Excel BOM tabını yaz"""
        
        # Headers
        headers = []
        if config.show_part_numbers:
            headers.append('Part Number')
        headers.append('Part Name')
        if config.show_descriptions:
            headers.append('Description')
        if config.show_quantities:
            headers.append('Quantity')
        if config.include_geometry_info:
            headers.extend(['Type', 'Volume (mm³)', 'Surface Area (mm²)'])
        headers.extend(['Level', 'Assembly Path', 'Category'])
        
        # Write headers
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        # Data
        row = 1
        for group_name, items in report_data['grouped_items'].items():
            for item in items:
                col = 0
                
                if config.show_part_numbers:
                    worksheet.write(row, col, item.part_number, cell_format)
                    col += 1
                
                worksheet.write(row, col, item.part_name, cell_format)
                col += 1
                
                if config.show_descriptions:
                    worksheet.write(row, col, item.description or '', cell_format)
                    col += 1
                
                if config.show_quantities:
                    worksheet.write(row, col, item.quantity, cell_format)
                    col += 1
                
                if config.include_geometry_info:
                    worksheet.write(row, col, item.shape_type or 'Unknown', cell_format)
                    col += 1
                    worksheet.write(row, col, item.volume or 0, number_format)
                    col += 1
                    worksheet.write(row, col, item.surface_area or 0, number_format)
                    col += 1
                
                worksheet.write(row, col, item.level, cell_format)
                col += 1
                worksheet.write(row, col, item.assembly_path or '', cell_format)
                col += 1
                worksheet.write(row, col, item.category or 'Uncategorized', cell_format)
                
                row += 1
        
        # Auto-fit columns
        for col in range(len(headers)):
            worksheet.set_column(col, col, 15)
    
    def _write_excel_summary(self, worksheet, report_data, workbook):
        """Excel summary tabını yaz"""
        
        title_format = workbook.add_format({'bold': True, 'font_size': 16})
        label_format = workbook.add_format({'bold': True})
        
        metadata = report_data['metadata']
        
        row = 0
        worksheet.write(row, 0, 'STEP BOM Analysis Report', title_format)
        row += 2
        
        worksheet.write(row, 0, 'Project:', label_format)
        worksheet.write(row, 1, metadata['project_name'])
        row += 1
        
        worksheet.write(row, 0, 'Company:', label_format)
        worksheet.write(row, 1, metadata['company'])
        row += 1
        
        worksheet.write(row, 0, 'Generated:', label_format)
        worksheet.write(row, 1, metadata['generated_date'].strftime('%Y-%m-%d %H:%M:%S'))
        row += 1
        
        worksheet.write(row, 0, 'Source File:', label_format)
        worksheet.write(row, 1, metadata['source_file'])
        row += 2
        
        # Statistics
        stats = report_data['statistics']
        worksheet.write(row, 0, 'Statistics:', title_format)
        row += 1
        
        worksheet.write(row, 0, 'Total Items:', label_format)
        worksheet.write(row, 1, stats['total_items'])
        row += 1
        
        worksheet.write(row, 0, 'Unique Parts:', label_format)
        worksheet.write(row, 1, stats['total_parts'])
        row += 1
        
        worksheet.write(row, 0, 'Assemblies:', label_format)
        worksheet.write(row, 1, stats['total_assemblies'])
        row += 1
        
        worksheet.set_column(0, 0, 20)
        worksheet.set_column(1, 1, 30)
    
    def _write_excel_statistics(self, worksheet, report_data, workbook):
        """Excel statistics tabını yaz"""
        
        header_format = workbook.add_format({'bold': True, 'bg_color': '#4F81BD', 'font_color': 'white'})
        
        # Category statistics
        worksheet.write(0, 0, 'Category', header_format)
        worksheet.write(0, 1, 'Count', header_format)
        
        row = 1
        for category, count in report_data['statistics']['categories'].items():
            worksheet.write(row, 0, category)
            worksheet.write(row, 1, count)
            row += 1
    
    def _generate_pdf_report(self, 
                           report_data: Dict[str, Any],
                           output_path: Path,
                           config: BOMReportConfig) -> Optional[str]:
        """PDF raporu oluştur"""
        
        if not PDF_AVAILABLE:
            return None
        
        try:
            # First generate HTML
            html_content = self._generate_html_basic(report_data, config)
            
            # Convert to PDF
            pdf_file = output_path / f"{report_data['metadata']['project_name']}_BOM.pdf"
            
            weasyprint.HTML(string=html_content).write_pdf(str(pdf_file))
            
            self._log_info(f"PDF report generated: {pdf_file}")
            return str(pdf_file)
            
        except Exception as e:
            self._log_error(f"PDF report generation failed: {e}")
            return None
    
    def _get_html_styles(self, style_type: str = "modern") -> str:
        """HTML stilleri"""
        
        if style_type == "modern":
            return """
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
                .header h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                .metadata { margin-top: 1.5rem; }
                .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; text-align: left; }
                
                .statistics { padding: 2rem; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
                .stat-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
                .stat-number { font-size: 2rem; font-weight: bold; color: #667eea; }
                .stat-label { color: #666; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
                
                .category-stats { margin-top: 2rem; }
                .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 1rem; }
                .category-item { display: flex; justify-content: space-between; padding: 0.5rem 1rem; background: #e9ecef; border-radius: 4px; }
                .category-count { font-weight: bold; color: #667eea; }
                
                .bom-section { padding: 2rem; }
                .group-header { color: #667eea; margin: 2rem 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #667eea; }
                
                .table-container { overflow-x: auto; margin-bottom: 2rem; }
                .bom-table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                .bom-table th { background: #667eea; color: white; padding: 1rem 0.5rem; text-align: left; font-weight: 600; }
                .bom-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #e9ecef; }
                .bom-table tbody tr:hover { background-color: #f8f9fa; }
                
                .image-cell { text-align: center; width: 80px; }
                .part-thumbnail { max-width: 60px; max-height: 60px; object-fit: contain; border-radius: 4px; }
                .no-image { width: 60px; height: 60px; background: #e9ecef; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.7rem; border-radius: 4px; margin: 0 auto; }
                
                .part-number { font-family: 'Courier New', monospace; font-weight: bold; color: #2c3e50; }
                .part-name { font-weight: 500; }
                .description { font-style: italic; color: #666; }
                .quantity { text-align: center; font-weight: bold; }
                .level { text-align: center; }
                
                .footer { background: #f8f9fa; padding: 1rem 2rem; text-align: center; color: #666; font-size: 0.9rem; }
                
                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .metadata-grid { grid-template-columns: 1fr; }
                    .bom-table { font-size: 0.9rem; }
                }
            """
        else:
            return """
                body { font-family: Arial, sans-serif; margin: 20px; }
                .container { max-width: 1200px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .bom-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .bom-table th, .bom-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .bom-table th { background-color: #f2f2f2; }
            """
    
    def _calculate_statistics(self, bom_structure: BOMStructureV2) -> Dict[str, Any]:
        """BOM istatistikleri hesapla"""
        
        categories = {}
        shape_types = {}
        
        for item in bom_structure.items:
            # Category stats
            category = item.category or "Uncategorized"
            categories[category] = categories.get(category, 0) + 1
            
            # Shape type stats
            shape_type = item.shape_type or "Unknown"
            shape_types[shape_type] = shape_types.get(shape_type, 0) + 1
        
        return {
            'total_items': len(bom_structure.items),
            'total_parts': bom_structure.total_parts,
            'total_assemblies': bom_structure.total_assemblies,
            'max_level': bom_structure.max_level,
            'categories': categories,
            'shape_types': shape_types
        }
    
    def _build_assembly_tree(self, bom_structure: BOMStructureV2) -> Dict[str, Any]:
        """Assembly tree yapısı oluştur"""
        
        tree = {
            'name': bom_structure.assembly_name,
            'type': 'assembly',
            'children': []
        }
        
        # Simple tree structure based on levels
        level_items = {}
        for item in bom_structure.items:
            level = item.level
            if level not in level_items:
                level_items[level] = []
            level_items[level].append(item)
        
        return {
            'root': tree,
            'levels': level_items,
            'max_depth': max(level_items.keys()) if level_items else 0
        }
    
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
def test_visual_bom_generator():
    """Test Visual BOM Generator"""
    from .bom_extractor_v2 import BOMStructureV2, BOMItemV2
    from .freecad_visualizer import BatchRenderResult, PartRenderResult
    from ..utils.logger import STEPAnalyzerLogger
    from ..utils.config_manager import ConfigManager
    from datetime import datetime
    
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    print("=== Visual BOM Generator Test ===")
    
    try:
        generator = VisualBOMGenerator(config, logger)
        print("✅ Visual BOM Generator initialized")
        
        # Mock BOM data
        items = [
            BOMItemV2(
                item_number=1,
                part_number="HOUSING_001",
                part_name="Main Housing",
                description="Primary housing component",
                quantity=1,
                level=1,
                parent_assembly="ASM_MAIN",
                node_type="part",
                shape_type="Solid",
                volume=2500.5,
                surface_area=850.2,
                category="Structural"
            ),
            BOMItemV2(
                item_number=2,
                part_number="COVER_002",
                part_name="Top Cover",
                description="Protective top cover",
                quantity=1,
                level=1,
                parent_assembly="ASM_MAIN",
                node_type="part",
                shape_type="Shell",
                volume=125.3,
                surface_area=280.7,
                category="Covers"
            )
        ]
        
        bom_structure = BOMStructureV2(
            assembly_name="Test Product Assembly",
            total_items=2,
            total_parts=2,
            total_assemblies=0,
            max_level=1,
            created_date=datetime.now(),
            source_file="test_product.step",
            items=items
        )
        
        # Mock render result
        render_result = None  # Will work without images
        
        # Configure report
        report_config = BOMReportConfig(
            title="Test Product BOM Report",
            company="ÜRTM Takip System",
            project_name="Test Product",
            revision="1.0",
            formats=["html", "excel"],
            include_images=False  # Since we don't have real images
        )
        
        print("🎨 Generating visual BOM report...")
        result = generator.generate_visual_bom(
            bom_structure, render_result, "./test_output/bom_reports", report_config
        )
        
        print(f"✅ Report generation completed: {result.success}")
        print(f"📊 Generated files:")
        for file_path in result.report_files:
            file_name = os.path.basename(file_path)
            file_size = result.file_sizes.get(file_name, 0)
            print(f"   - {file_name} ({file_size:,} bytes)")
        
        print(f"⏱️  Generation time: {result.generation_time:.2f}s")
        
        if result.errors:
            print("⚠️  Errors:")
            for error in result.errors:
                print(f"   - {error}")
        
        return result.success
        
    except Exception as e:
        logger.error(f"Visual BOM Generator test failed: {e}")
        print(f"❌ Test failed: {e}")
        return False


if __name__ == "__main__":
    test_visual_bom_generator()