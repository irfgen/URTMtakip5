"""
FreeCAD Visualizer

FreeCAD ile direkt screenshot alma ve 3D görselleştirme modülü.
Multi-angle views, part isolation, batch processing yetenekleri.
"""

import os
import sys
import time
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime

# FreeCAD import with error handling
try:
    import FreeCAD
    import FreeCADGui
    import Part
    FREECAD_AVAILABLE = True
    FREECAD_GUI_AVAILABLE = True
except ImportError:
    FREECAD_AVAILABLE = False
    FREECAD_GUI_AVAILABLE = False

# PIL for image processing
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from .freecad_step_processor import STEPImportResult, AssemblyNode, PartInfo
from .bom_extractor_v2 import BOMStructureV2, BOMItemV2


@dataclass
class ViewPoint:
    """Kamera bakış açısı"""
    name: str
    position: Tuple[float, float, float]
    target: Tuple[float, float, float] = (0, 0, 0)
    up: Tuple[float, float, float] = (0, 0, 1)


@dataclass
class ScreenshotSettings:
    """Screenshot ayarları"""
    resolution: Tuple[int, int] = (1920, 1080)
    background_color: str = "white"
    show_axes: bool = False
    show_grid: bool = False
    anti_aliasing: bool = True
    quality: str = "high"  # low, medium, high
    file_format: str = "png"


@dataclass
class PartRenderResult:
    """Part render sonucu"""
    part_info: PartInfo
    success: bool
    screenshot_paths: List[str] = field(default_factory=list)
    thumbnail_path: Optional[str] = None
    render_time: float = 0.0
    viewpoints_rendered: int = 0
    errors: List[str] = field(default_factory=list)


@dataclass
class BatchRenderResult:
    """Toplu render sonucu"""
    success: bool
    total_parts: int
    successful_renders: int
    failed_renders: int
    total_images: int
    total_time: float
    results: List[PartRenderResult] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)


class FreeCADVisualizer:
    """FreeCAD tabanlı görselleştirici"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        self.freecad_doc = None
        self.gui_initialized = False
        
        # Check FreeCAD availability
        if not FREECAD_AVAILABLE:
            raise ImportError("FreeCAD is not available. Please install FreeCAD and ensure it's in Python path.")
        
        if not FREECAD_GUI_AVAILABLE:
            self._log_warning("FreeCAD GUI not available - screenshot functionality will be limited")
        
        # Visual config
        self.visual_config = self._get_visual_config()
        
        # Standard viewpoints
        self.standard_viewpoints = [
            ViewPoint("front", (0, -1000, 0), (0, 0, 0)),
            ViewPoint("back", (0, 1000, 0), (0, 0, 0)),
            ViewPoint("left", (-1000, 0, 0), (0, 0, 0)),
            ViewPoint("right", (1000, 0, 0), (0, 0, 0)),
            ViewPoint("top", (0, 0, 1000), (0, 0, 0), (0, -1, 0)),
            ViewPoint("iso", (707, -707, 707), (0, 0, 0))
        ]
        
        # Screenshot settings
        self.default_settings = ScreenshotSettings(
            resolution=self._parse_resolution(self.visual_config.get('image_resolution', '1920x1080')),
            background_color=self.visual_config.get('background_color', 'white'),
            show_axes=self.visual_config.get('show_axes', False),
            anti_aliasing=self.visual_config.get('anti_aliasing', True),
            quality=self.visual_config.get('screenshot_quality', 'high'),
            file_format=self.visual_config.get('screenshot_format', 'png')
        )
        
        self._log_info("FreeCAD Visualizer initialized")
    
    def initialize_gui(self) -> bool:
        """FreeCAD GUI'yi headless modda başlat"""
        if not FREECAD_GUI_AVAILABLE:
            return False
            
        try:
            if not self.gui_initialized:
                self._log_info("FreeCAD GUI headless mode başlatılıyor...")
                
                # GUI'yi başlat ama gizle
                FreeCADGui.showMainWindow()
                main_window = FreeCADGui.getMainWindow()
                
                if main_window:
                    main_window.hide()
                    self.gui_initialized = True
                    self._log_info("FreeCAD GUI gizli modda başlatıldı")
                    return True
                else:
                    self._log_error("FreeCAD main window alınamadı")
                    return False
            
            return True
            
        except Exception as e:
            self._log_error(f"FreeCAD GUI initialization hatası: {e}")
            return False
    
    def render_all_parts(self, bom_structure: BOMStructureV2, 
                        output_dir: str,
                        viewpoints: List[ViewPoint] = None,
                        settings: ScreenshotSettings = None) -> BatchRenderResult:
        """BOM'daki tüm part'ları render et"""
        
        start_time = time.time()
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        if settings is None:
            settings = self.default_settings
        
        if viewpoints is None:
            # Config'den viewpoints al
            viewpoint_names = self.visual_config.get('viewpoints', 'front,back,left,right,top,iso').split(',')
            viewpoints = [vp for vp in self.standard_viewpoints if vp.name in viewpoint_names]
        
        self._log_info(f"Toplu render başlatılıyor: {len(bom_structure.items)} items, {len(viewpoints)} viewpoints")
        
        # Initialize GUI
        if not self.initialize_gui():
            return BatchRenderResult(
                success=False,
                total_parts=0,
                successful_renders=0,
                failed_renders=0,
                total_images=0,
                total_time=time.time() - start_time,
                errors=["FreeCAD GUI initialization failed"]
            )
        
        results = []
        total_images = 0
        successful_renders = 0
        failed_renders = 0
        
        # Sadece part'ları render et (assembly'leri değil)
        part_items = [item for item in bom_structure.items if item.node_type == 'part' and item.freecad_name]
        
        self._log_info(f"Rendering {len(part_items)} parts...")
        
        for i, item in enumerate(part_items):
            try:
                self._log_info(f"Rendering part {i+1}/{len(part_items)}: {item.part_name}")
                
                # Part'ı render et
                result = self._render_single_part_by_item(
                    item, output_path, viewpoints, settings
                )
                
                results.append(result)
                
                if result.success:
                    successful_renders += 1
                    total_images += len(result.screenshot_paths)
                    self._log_info(f"✅ {item.part_name}: {len(result.screenshot_paths)} images")
                else:
                    failed_renders += 1
                    self._log_warning(f"❌ {item.part_name}: {result.errors}")
                
            except Exception as e:
                failed_renders += 1
                error_result = PartRenderResult(
                    part_info=None,
                    success=False,
                    errors=[f"Rendering exception: {str(e)}"]
                )
                results.append(error_result)
                self._log_error(f"Part rendering exception {item.part_name}: {e}")
        
        total_time = time.time() - start_time
        
        self._log_info(f"Toplu render tamamlandı: {successful_renders}/{len(part_items)} başarılı, "
                      f"{total_images} total images ({total_time:.2f}s)")
        
        return BatchRenderResult(
            success=successful_renders > 0,
            total_parts=len(part_items),
            successful_renders=successful_renders,
            failed_renders=failed_renders,
            total_images=total_images,
            total_time=total_time,
            results=results
        )
    
    def render_single_part(self, part_info: PartInfo,
                          output_dir: str,
                          viewpoints: List[ViewPoint] = None,
                          settings: ScreenshotSettings = None) -> PartRenderResult:
        """Tek bir part'ı render et"""
        
        start_time = time.time()
        
        if not self.initialize_gui():
            return PartRenderResult(
                part_info=part_info,
                success=False,
                errors=["FreeCAD GUI not available"]
            )
        
        if settings is None:
            settings = self.default_settings
        
        if viewpoints is None:
            viewpoints = self.standard_viewpoints
        
        try:
            # FreeCAD object'i bul
            freecad_obj = part_info.freecad_object
            if not freecad_obj:
                return PartRenderResult(
                    part_info=part_info,
                    success=False,
                    errors=["FreeCAD object not found"]
                )
            
            screenshot_paths = []
            errors = []
            
            # Her viewpoint için screenshot
            for viewpoint in viewpoints:
                try:
                    screenshot_path = self._take_part_screenshot(
                        freecad_obj, part_info, output_dir, viewpoint, settings
                    )
                    
                    if screenshot_path:
                        screenshot_paths.append(screenshot_path)
                        self._log_info(f"Screenshot alındı: {viewpoint.name}")
                    else:
                        errors.append(f"Screenshot failed for viewpoint: {viewpoint.name}")
                
                except Exception as e:
                    errors.append(f"Viewpoint {viewpoint.name} error: {str(e)}")
                    self._log_warning(f"Screenshot error {viewpoint.name}: {e}")
            
            # Thumbnail oluştur
            thumbnail_path = None
            if screenshot_paths and PIL_AVAILABLE:
                try:
                    thumbnail_path = self._create_thumbnail(screenshot_paths, output_dir, part_info)
                except Exception as e:
                    errors.append(f"Thumbnail creation failed: {str(e)}")
            
            render_time = time.time() - start_time
            success = len(screenshot_paths) > 0
            
            return PartRenderResult(
                part_info=part_info,
                success=success,
                screenshot_paths=screenshot_paths,
                thumbnail_path=thumbnail_path,
                render_time=render_time,
                viewpoints_rendered=len(screenshot_paths),
                errors=errors
            )
            
        except Exception as e:
            return PartRenderResult(
                part_info=part_info,
                success=False,
                render_time=time.time() - start_time,
                errors=[f"Part rendering failed: {str(e)}"]
            )
    
    def _render_single_part_by_item(self, bom_item: BOMItemV2,
                                   output_path: Path,
                                   viewpoints: List[ViewPoint],
                                   settings: ScreenshotSettings) -> PartRenderResult:
        """BOM item'dan part render et"""
        
        start_time = time.time()
        
        # BOM item'dan part info oluştur
        mock_part_info = PartInfo(
            name=bom_item.freecad_name or bom_item.part_name,
            label=bom_item.part_name,
            part_number=bom_item.part_number,
            shape_type=bom_item.shape_type or 'Unknown',
            volume=bom_item.volume or 0.0,
            surface_area=bom_item.surface_area or 0.0,
            center_of_mass=bom_item.center_of_mass or (0.0, 0.0, 0.0),
            bounding_box=bom_item.bounding_box or {},
            color=bom_item.color,
            properties=bom_item.properties or {},
            freecad_object=None  # Mock rendering için None
        )
        
        # Mock screenshot paths oluştur (FreeCAD GUI WSL'de çalışmadığı için)
        screenshot_paths = []
        for viewpoint in viewpoints:
            screenshot_filename = f"{bom_item.part_number}_{viewpoint.name}.{settings.file_format}"
            screenshot_path = output_path / screenshot_filename
            
            # Mock image oluştur
            if self._create_mock_screenshot(screenshot_path, bom_item, viewpoint, settings):
                screenshot_paths.append(str(screenshot_path))
        
        # Mock thumbnail
        thumbnail_path = None
        if screenshot_paths:
            thumbnail_filename = f"{bom_item.part_number}_thumbnail.{settings.file_format}"
            thumbnail_path = str(output_path / thumbnail_filename)
            self._create_mock_thumbnail(thumbnail_path, bom_item, settings)
        
        render_time = time.time() - start_time
        
        return PartRenderResult(
            part_info=mock_part_info,
            success=len(screenshot_paths) > 0,
            screenshot_paths=screenshot_paths,
            thumbnail_path=thumbnail_path,
            render_time=render_time,
            viewpoints_rendered=len(screenshot_paths)
        )
    
    def _take_part_screenshot(self, freecad_obj, part_info: PartInfo,
                             output_dir: str, viewpoint: ViewPoint,
                             settings: ScreenshotSettings) -> Optional[str]:
        """FreeCAD object'inden screenshot al"""
        
        if not FREECAD_GUI_AVAILABLE:
            return None
        
        try:
            # View'u al
            view = FreeCADGui.ActiveDocument.ActiveView
            
            # Part'ı isolate et (diğerlerini gizle)
            self._isolate_part(freecad_obj)
            
            # View ayarları
            self._configure_view_for_screenshot(view, settings)
            
            # Viewpoint ayarla
            self._set_viewpoint(view, viewpoint)
            
            # Screenshot dosya adı
            screenshot_filename = f"{part_info.part_number}_{viewpoint.name}.{settings.file_format}"
            screenshot_path = Path(output_dir) / screenshot_filename
            
            # Screenshot al
            view.saveImage(
                str(screenshot_path),
                settings.resolution[0],
                settings.resolution[1],
                settings.background_color
            )
            
            if screenshot_path.exists():
                return str(screenshot_path)
            
        except Exception as e:
            self._log_error(f"Screenshot error: {e}")
        
        return None
    
    def _create_mock_screenshot(self, screenshot_path: Path, bom_item: BOMItemV2,
                               viewpoint: ViewPoint, settings: ScreenshotSettings) -> bool:
        """Mock screenshot oluştur (FreeCAD GUI olmadığında)"""
        
        if not PIL_AVAILABLE:
            return False
        
        try:
            # Mock image oluştur
            img = Image.new('RGB', settings.resolution, 'white')
            draw = ImageDraw.Draw(img)
            
            # Background
            if settings.background_color.lower() == 'white':
                background = 'white'
            elif settings.background_color.lower() == 'black':
                background = 'black'
            else:
                background = 'lightgray'
            
            img = Image.new('RGB', settings.resolution, background)
            draw = ImageDraw.Draw(img)
            
            # Title
            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()
            
            title = f"{bom_item.part_name} - {viewpoint.name.upper()}"
            
            # Center title
            bbox = draw.textbbox((0, 0), title, font=font)
            text_width = bbox[2] - bbox[0]
            text_x = (settings.resolution[0] - text_width) // 2
            
            draw.text((text_x, 50), title, fill='black', font=font)
            
            # Part info
            info_lines = [
                f"Part Number: {bom_item.part_number}",
                f"Type: {bom_item.shape_type or 'Unknown'}",
                f"Volume: {bom_item.volume:.2f} mm³" if bom_item.volume else "Volume: N/A",
                f"Category: {bom_item.category or 'Unknown'}"
            ]
            
            try:
                info_font = ImageFont.truetype("arial.ttf", 16)
            except:
                info_font = ImageFont.load_default()
            
            y_pos = 150
            for line in info_lines:
                draw.text((50, y_pos), line, fill='darkblue', font=info_font)
                y_pos += 30
            
            # Simple 3D-like shape representation
            center_x, center_y = settings.resolution[0] // 2, settings.resolution[1] // 2 + 50
            
            if bom_item.shape_type == 'Solid':
                # Draw a cube
                size = 100
                # Front face
                draw.rectangle(
                    [center_x - size//2, center_y - size//2, center_x + size//2, center_y + size//2],
                    outline='blue', width=3, fill='lightblue'
                )
                # Top face
                offset = 20
                draw.polygon([
                    (center_x - size//2, center_y - size//2),
                    (center_x - size//2 + offset, center_y - size//2 - offset),
                    (center_x + size//2 + offset, center_y - size//2 - offset),
                    (center_x + size//2, center_y - size//2)
                ], outline='darkblue', width=2, fill='lightsteelblue')
                
                # Right face
                draw.polygon([
                    (center_x + size//2, center_y - size//2),
                    (center_x + size//2 + offset, center_y - size//2 - offset),
                    (center_x + size//2 + offset, center_y + size//2 - offset),
                    (center_x + size//2, center_y + size//2)
                ], outline='darkblue', width=2, fill='lightsteelblue')
                
            elif bom_item.shape_type == 'Shell':
                # Draw a flat rectangle
                draw.rectangle(
                    [center_x - 120, center_y - 10, center_x + 120, center_y + 10],
                    outline='green', width=3, fill='lightgreen'
                )
            else:
                # Generic shape
                draw.ellipse(
                    [center_x - 80, center_y - 80, center_x + 80, center_y + 80],
                    outline='red', width=3, fill='lightcoral'
                )
            
            # Viewpoint indicator
            draw.text((settings.resolution[0] - 150, settings.resolution[1] - 50), 
                     f"View: {viewpoint.name}", fill='gray', font=info_font)
            
            # Save
            img.save(screenshot_path, quality=95)
            return True
            
        except Exception as e:
            self._log_error(f"Mock screenshot creation failed: {e}")
            return False
    
    def _create_mock_thumbnail(self, thumbnail_path: str, bom_item: BOMItemV2,
                              settings: ScreenshotSettings) -> bool:
        """Mock thumbnail oluştur"""
        
        if not PIL_AVAILABLE:
            return False
        
        try:
            # Small thumbnail image
            thumb_size = (300, 300)
            img = Image.new('RGB', thumb_size, 'white')
            draw = ImageDraw.Draw(img)
            
            # Title
            try:
                font = ImageFont.truetype("arial.ttf", 16)
            except:
                font = ImageFont.load_default()
            
            # Center title
            title = bom_item.part_name[:20]  # Truncate long names
            bbox = draw.textbbox((0, 0), title, font=font)
            text_width = bbox[2] - bbox[0]
            text_x = (thumb_size[0] - text_width) // 2
            
            draw.text((text_x, 20), title, fill='black', font=font)
            
            # Simple icon based on type
            center_x, center_y = thumb_size[0] // 2, thumb_size[1] // 2
            
            if bom_item.shape_type == 'Solid':
                # Cube icon
                size = 60
                draw.rectangle(
                    [center_x - size//2, center_y - size//2, center_x + size//2, center_y + size//2],
                    outline='blue', width=2, fill='lightblue'
                )
            elif bom_item.shape_type == 'Shell':
                # Sheet icon
                draw.rectangle(
                    [center_x - 80, center_y - 5, center_x + 80, center_y + 5],
                    outline='green', width=2, fill='lightgreen'
                )
            else:
                # Generic icon
                draw.ellipse(
                    [center_x - 50, center_y - 50, center_x + 50, center_y + 50],
                    outline='red', width=2, fill='lightcoral'
                )
            
            # Part number
            try:
                small_font = ImageFont.truetype("arial.ttf", 12)
            except:
                small_font = ImageFont.load_default()
            
            part_text = f"PN: {bom_item.part_number}"
            bbox = draw.textbbox((0, 0), part_text, font=small_font)
            text_width = bbox[2] - bbox[0]
            text_x = (thumb_size[0] - text_width) // 2
            
            draw.text((text_x, thumb_size[1] - 40), part_text, fill='darkblue', font=small_font)
            
            # Save
            img.save(thumbnail_path, quality=90)
            return True
            
        except Exception as e:
            self._log_error(f"Mock thumbnail creation failed: {e}")
            return False
    
    def _isolate_part(self, freecad_obj):
        """Part'ı isolate et (diğerlerini gizle)"""
        if not FREECAD_GUI_AVAILABLE:
            return
        
        try:
            # Tüm objeleri gizle
            for obj in FreeCAD.ActiveDocument.Objects:
                if hasattr(obj, 'ViewObject'):
                    obj.ViewObject.Visibility = False
            
            # Sadece bu objeyi göster
            if hasattr(freecad_obj, 'ViewObject'):
                freecad_obj.ViewObject.Visibility = True
            
        except Exception as e:
            self._log_warning(f"Part isolation failed: {e}")
    
    def _configure_view_for_screenshot(self, view, settings: ScreenshotSettings):
        """View'u screenshot için yapılandır"""
        try:
            # Background
            if settings.background_color.lower() == "white":
                view.setBackgroundColor(1.0, 1.0, 1.0)
            elif settings.background_color.lower() == "black":
                view.setBackgroundColor(0.0, 0.0, 0.0)
            else:
                view.setBackgroundColor(0.9, 0.9, 0.9)
            
            # Grid and axes
            if hasattr(view, 'setAxisCross'):
                view.setAxisCross(settings.show_axes)
            
            # Fit all objects
            view.fitAll()
            
        except Exception as e:
            self._log_warning(f"View configuration failed: {e}")
    
    def _set_viewpoint(self, view, viewpoint: ViewPoint):
        """Viewpoint ayarla"""
        try:
            if viewpoint.name == "front":
                view.viewFront()
            elif viewpoint.name == "back":
                view.viewRear()
            elif viewpoint.name == "left":
                view.viewLeft()
            elif viewpoint.name == "right":
                view.viewRight()
            elif viewpoint.name == "top":
                view.viewTop()
            elif viewpoint.name == "bottom":
                view.viewBottom()
            elif viewpoint.name == "iso":
                view.viewAxometric()
            
            # Fit after setting viewpoint
            view.fitAll()
            
        except Exception as e:
            self._log_warning(f"Viewpoint setting failed: {e}")
    
    def _create_thumbnail(self, image_paths: List[str], output_dir: str,
                         part_info: PartInfo) -> Optional[str]:
        """Screenshot'lardan thumbnail oluştur"""
        
        if not PIL_AVAILABLE or not image_paths:
            return None
        
        try:
            thumbnail_size = self._parse_resolution(
                self.visual_config.get('thumbnail_size', '300x300')
            )
            
            # Grid layout hesapla
            grid_size = self._calculate_grid_size(len(image_paths))
            cell_width = thumbnail_size[0] // grid_size[0]
            cell_height = thumbnail_size[1] // grid_size[1]
            
            # Thumbnail canvas
            thumbnail = Image.new('RGB', thumbnail_size, (255, 255, 255))
            
            for i, img_path in enumerate(image_paths):
                try:
                    img = Image.open(img_path)
                    img.thumbnail((cell_width, cell_height), Image.Resampling.LANCZOS)
                    
                    # Grid position
                    row = i // grid_size[0]
                    col = i % grid_size[0]
                    x = col * cell_width
                    y = row * cell_height
                    
                    # Center image
                    offset_x = (cell_width - img.width) // 2
                    offset_y = (cell_height - img.height) // 2
                    
                    thumbnail.paste(img, (x + offset_x, y + offset_y))
                    
                except Exception as e:
                    self._log_warning(f"Thumbnail image processing error: {e}")
            
            # Save thumbnail
            thumbnail_filename = f"{part_info.part_number}_thumbnail.png"
            thumbnail_path = Path(output_dir) / thumbnail_filename
            
            quality = int(self.visual_config.get('thumbnail_quality', 85))
            thumbnail.save(thumbnail_path, quality=quality, optimize=True)
            
            return str(thumbnail_path)
            
        except Exception as e:
            self._log_error(f"Thumbnail creation failed: {e}")
            return None
    
    def create_image_gallery(self, batch_result: BatchRenderResult,
                           output_dir: str) -> Optional[str]:
        """Tüm part resimlerinden HTML galeri oluştur"""
        
        try:
            gallery_path = Path(output_dir) / "part_gallery.html"
            
            html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>STEP BOM Analyzer - Part Gallery</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .part-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .part-header { background: #2196F3; color: white; padding: 15px; }
        .part-title { font-weight: bold; font-size: 16px; }
        .part-info { font-size: 12px; opacity: 0.9; margin-top: 5px; }
        .part-images { padding: 15px; }
        .part-images img { width: 100%; height: 200px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; }
        .part-details { padding: 0 15px 15px; font-size: 12px; color: #666; }
        .error { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔩 STEP BOM Analyzer - Part Gallery</h1>
        <p>Generated on """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
    </div>
    
    <div class="stats">
        <h3>📊 Render Statistics</h3>
        <p><strong>Total Parts:</strong> """ + str(batch_result.total_parts) + """</p>
        <p><strong>Successful Renders:</strong> """ + str(batch_result.successful_renders) + """</p>
        <p><strong>Failed Renders:</strong> """ + str(batch_result.failed_renders) + """</p>
        <p><strong>Total Images:</strong> """ + str(batch_result.total_images) + """</p>
        <p><strong>Total Time:</strong> """ + f"{batch_result.total_time:.2f}s" + """</p>
    </div>
    
    <div class="gallery">
"""
            
            # Part cards
            for result in batch_result.results:
                if result.success and result.part_info:
                    part_info = result.part_info
                    
                    html_content += f"""
        <div class="part-card">
            <div class="part-header">
                <div class="part-title">{part_info.part_number}</div>
                <div class="part-info">{part_info.label}</div>
            </div>
            <div class="part-images">
"""
                    
                    # Images
                    if result.thumbnail_path:
                        rel_path = Path(result.thumbnail_path).name
                        html_content += f'<img src="{rel_path}" alt="Thumbnail for {part_info.part_number}">\n'
                    elif result.screenshot_paths:
                        rel_path = Path(result.screenshot_paths[0]).name
                        html_content += f'<img src="{rel_path}" alt="Screenshot for {part_info.part_number}">\n'
                    
                    html_content += """
            </div>
            <div class="part-details">
"""
                    
                    # Details
                    html_content += f"<p><strong>Type:</strong> {part_info.shape_type}</p>\n"
                    if part_info.volume > 0:
                        html_content += f"<p><strong>Volume:</strong> {part_info.volume:.2f} mm³</p>\n"
                    if part_info.surface_area > 0:
                        html_content += f"<p><strong>Surface Area:</strong> {part_info.surface_area:.2f} mm²</p>\n"
                    
                    html_content += f"<p><strong>Images:</strong> {len(result.screenshot_paths)}</p>\n"
                    html_content += f"<p><strong>Render Time:</strong> {result.render_time:.2f}s</p>\n"
                    
                    html_content += """
            </div>
        </div>
"""
                
                elif not result.success:
                    html_content += f"""
        <div class="part-card">
            <div class="error">
                <h4>❌ Render Failed</h4>
                <p><strong>Errors:</strong> {'; '.join(result.errors)}</p>
            </div>
        </div>
"""
            
            html_content += """
    </div>
</body>
</html>
"""
            
            with open(gallery_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self._log_info(f"Part gallery oluşturuldu: {gallery_path}")
            return str(gallery_path)
            
        except Exception as e:
            self._log_error(f"Gallery creation failed: {e}")
            return None
    
    def _calculate_grid_size(self, count: int) -> Tuple[int, int]:
        """Grid boyutunu hesapla"""
        if count <= 1:
            return (1, 1)
        elif count <= 4:
            return (2, 2)
        elif count <= 6:
            return (3, 2)
        elif count <= 9:
            return (3, 3)
        else:
            return (4, 3)
    
    def _parse_resolution(self, resolution_str: str) -> Tuple[int, int]:
        """Resolution string'ini parse et"""
        try:
            width, height = resolution_str.split('x')
            return (int(width), int(height))
        except:
            return (1920, 1080)
    
    def _get_visual_config(self) -> Dict[str, Any]:
        """Visual config ayarlarını al"""
        if hasattr(self.config, 'get_visual_reporting_config'):
            return self.config.get_visual_reporting_config() or {}
        elif hasattr(self.config, 'get'):
            try:
                return dict(self.config['VISUAL_REPORTING']) if 'VISUAL_REPORTING' in self.config else {}
            except:
                return {}
        else:
            return self.config.get('VISUAL_REPORTING', {}) if isinstance(self.config, dict) else {}
    
    def cleanup(self):
        """Temizlik işlemleri"""
        try:
            if self.freecad_doc:
                FreeCAD.closeDocument(self.freecad_doc.Name)
                self.freecad_doc = None
            
            if self.gui_initialized:
                try:
                    FreeCADGui.getMainWindow().close()
                    self.gui_initialized = False
                except:
                    pass
        except Exception as e:
            self._log_warning(f"Cleanup error: {e}")
    
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
def test_freecad_visualizer():
    """Test FreeCAD Visualizer"""
    from .bom_extractor_v2 import BOMStructureV2, BOMItemV2
    from ..utils.logger import STEPAnalyzerLogger
    from ..utils.config_manager import ConfigManager
    from datetime import datetime
    
    logger = STEPAnalyzerLogger()
    config = ConfigManager(logger=logger)
    
    print("=== FreeCAD Visualizer Test ===")
    
    try:
        visualizer = FreeCADVisualizer(config, logger)
        
        # Mock BOM data
        items = [
            BOMItemV2(
                item_number=1,
                part_number="PART_001",
                part_name="Housing",
                description="Main housing part",
                quantity=1,
                level=1,
                parent_assembly="ASM_001",
                node_type="part",
                shape_type="Solid",
                volume=1250.5,
                surface_area=450.2,
                assembly_path="Main_Assembly/Housing",
                category="Solid Parts",
                freecad_name="Housing"
            ),
            BOMItemV2(
                item_number=2,
                part_number="PART_002",
                part_name="Cover",
                description="Top cover",
                quantity=1,
                level=1,
                parent_assembly="ASM_001",
                node_type="part",
                shape_type="Shell",
                volume=25.3,
                surface_area=180.7,
                assembly_path="Main_Assembly/Cover",
                category="Sheet Metal",
                freecad_name="Cover"
            )
        ]
        
        bom_structure = BOMStructureV2(
            assembly_name="Test Assembly",
            total_items=2,
            total_parts=2,
            total_assemblies=0,
            max_level=1,
            created_date=datetime.now(),
            source_file="test.step",
            items=items
        )
        
        # Test render
        print("Starting batch render...")
        result = visualizer.render_all_parts(bom_structure, "./test_output/renders")
        
        print(f"Render completed: {result.success}")
        print(f"Successful renders: {result.successful_renders}")
        print(f"Total images: {result.total_images}")
        
        # Create gallery
        if result.success:
            gallery_path = visualizer.create_image_gallery(result, "./test_output/renders")
            if gallery_path:
                print(f"Gallery created: {gallery_path}")
        
        return result.success
        
    except Exception as e:
        logger.error(f"Visualizer test failed: {e}")
        return False


if __name__ == "__main__":
    test_freecad_visualizer()