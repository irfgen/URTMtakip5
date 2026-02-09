"""
FreeCAD Direct Renderer

STEP dosyalarından direkt screenshot alan renderer.
STL dönüşümü olmadan FreeCAD GUI kullanarak görüntü oluşturur.
"""

import os
import sys
import time
import tempfile
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

# FreeCAD import with path detection
try:
    import FreeCAD
    import FreeCADGui
    import Part
    import Import
    FREECAD_AVAILABLE = True
    FREECAD_GUI_AVAILABLE = True
except ImportError:
    # Try conda path detection
    conda_prefix = os.environ.get('CONDA_PREFIX')
    if not conda_prefix:
        conda_prefix = str(Path(sys.executable).parent)
    
    conda_base = Path(conda_prefix)
    potential_paths = [
        conda_base / "Library" / "bin",
        conda_base / "Library" / "lib", 
        conda_base / "Lib" / "site-packages"
    ]
    
    for path in potential_paths:
        if path.exists() and str(path) not in sys.path:
            sys.path.insert(0, str(path))
    
    try:
        import FreeCAD
        import FreeCADGui
        import Part
        import Import
        FREECAD_AVAILABLE = True
        FREECAD_GUI_AVAILABLE = True
    except ImportError:
        try:
            import FreeCAD
            import Part
            import Import
            FREECAD_AVAILABLE = True
            FREECAD_GUI_AVAILABLE = False
        except ImportError:
            FREECAD_AVAILABLE = False
            FREECAD_GUI_AVAILABLE = False

from .renderer import RenderResult, RenderSettings, ViewPoint


@dataclass
class FreeCADRenderSettings:
    """FreeCAD özel render ayarları"""
    resolution: Tuple[int, int] = (1920, 1080)
    background_color: str = "white"  # "white", "black", "transparent"
    show_axes: bool = False
    show_grid: bool = False
    perspective_view: bool = True
    render_quality: str = "high"  # "low", "medium", "high"
    anti_aliasing: bool = True
    shadows: bool = False


class FreeCADRenderer:
    """FreeCAD ile direkt STEP rendering"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        self.freecad_doc = None
        self.gui_initialized = False
        
        # Render ayarları
        if hasattr(config, 'get_render_config'):
            self.render_config = config.get_render_config() or {}
        elif hasattr(config, 'get') and callable(config.get):
            # ConfigManager object
            try:
                self.render_config = dict(config.get('RENDERING')) if 'RENDERING' in config else {}
            except:
                self.render_config = {}
        else:
            # Dict object
            self.render_config = self.config.get('RENDERING', {})
        
        # Standart viewpoint'ler
        self.standard_viewpoints = [
            ViewPoint(name="front", position=[0, -1000, 0], target=[0, 0, 0]),
            ViewPoint(name="back", position=[0, 1000, 0], target=[0, 0, 0]),
            ViewPoint(name="left", position=[-1000, 0, 0], target=[0, 0, 0]),
            ViewPoint(name="right", position=[1000, 0, 0], target=[0, 0, 0]),
            ViewPoint(name="top", position=[0, 0, 1000], target=[0, 0, 0]),
            ViewPoint(name="bottom", position=[0, 0, -1000], target=[0, 0, 0]),
            ViewPoint(name="iso", position=[707, -707, 707], target=[0, 0, 0]),
        ]
        
        self._log_info(f"FreeCAD renderer initialized - Available: {FREECAD_AVAILABLE}, GUI: {FREECAD_GUI_AVAILABLE}")
        
        # Debug çıktısı
        if not FREECAD_GUI_AVAILABLE:
            self._log_warning("FreeCAD GUI mevcut değil - headless rendering devre dışı")
    
    def is_available(self) -> bool:
        """FreeCAD render mevcut mu?"""
        return FREECAD_AVAILABLE and FREECAD_GUI_AVAILABLE
    
    def initialize_gui(self) -> bool:
        """FreeCAD GUI'yi headless modda başlat"""
        if not self.is_available():
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
    
    def render_step_file(self, 
                        step_file: str,
                        output_dir: str,
                        viewpoints: List[ViewPoint] = None,
                        settings: FreeCADRenderSettings = None,
                        render_parts_separately: bool = False) -> RenderResult:
        """STEP dosyasından direkt screenshot al"""
        
        start_time = time.time()
        step_path = Path(step_file)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        if not step_path.exists():
            return RenderResult(
                success=False,
                mesh_file=str(step_path),
                output_images=[],
                render_time=0,
                errors=[f"STEP dosyası bulunamadı: {step_file}"]
            )
        
        if settings is None:
            settings = FreeCADRenderSettings()
        
        if viewpoints is None:
            viewpoints = self.standard_viewpoints[:4]  # front, back, left, right
        
        self._log_info(f"FreeCAD STEP rendering başlatılıyor: {step_file}")
        
        try:
            # GUI'yi başlat
            if not self.initialize_gui():
                # GUI başarısız ise headless render dene
                self._log_info("FreeCAD GUI başarısız, headless export deneniyor...")
                return self._render_headless_export(step_path, output_path, start_time)
            
            # Yeni document oluştur
            doc_name = f"StepRender_{int(time.time())}"
            self.freecad_doc = FreeCAD.newDocument(doc_name)
            
            try:
                # STEP dosyasını yükle
                self._log_info(f"STEP dosyası yükleniyor: {step_file}")
                Import.insert(str(step_path), doc_name)
                
                # Document'i recompute et
                self.freecad_doc.recompute()
                
                # GUI document oluştur
                gui_doc = FreeCADGui.getDocument(doc_name)
                if not gui_doc:
                    raise Exception("FreeCAD GUI document oluşturulamadı")
                
                output_images = []
                errors = []
                
                if render_parts_separately:
                    # Her part için ayrı render
                    parts = [obj for obj in self.freecad_doc.Objects if hasattr(obj, 'Shape')]
                    self._log_info(f"Toplam {len(parts)} part bulundu, ayrı ayrı render yapılıyor")
                    
                    for i, part in enumerate(parts):
                        part_images = self._render_single_part(
                            part, output_path, viewpoints, settings, i
                        )
                        output_images.extend(part_images)
                else:
                    # Tüm assembly'yi birlikte render
                    assembly_images = self._render_full_assembly(
                        gui_doc, output_path, viewpoints, settings
                    )
                    output_images.extend(assembly_images)
                
                # Render stats
                render_stats = {
                    "step_file": str(step_path),
                    "total_objects": len(self.freecad_doc.Objects),
                    "viewpoints_rendered": len(output_images),
                    "render_engine": "freecad_direct",
                    "render_separately": render_parts_separately
                }
                
                render_time = time.time() - start_time
                self._log_info(f"FreeCAD render tamamlandı: {len(output_images)} images ({render_time:.2f}s)")
                
                return RenderResult(
                    success=len(output_images) > 0,
                    mesh_file=str(step_path),
                    output_images=output_images,
                    render_time=render_time,
                    render_stats=render_stats,
                    errors=errors
                )
                
            finally:
                # Document'i temizle
                if self.freecad_doc:
                    FreeCAD.closeDocument(self.freecad_doc.Name)
                    self.freecad_doc = None
        
        except Exception as e:
            self._log_error(f"FreeCAD render hatası: {str(e)}")
            return RenderResult(
                success=False,
                mesh_file=str(step_path),
                output_images=[],
                render_time=time.time() - start_time,
                errors=[str(e)]
            )
    
    def _render_full_assembly(self, 
                             gui_doc,
                             output_path: Path,
                             viewpoints: List[ViewPoint],
                             settings: FreeCADRenderSettings) -> List[str]:
        """Tüm assembly'yi birlikte render et"""
        output_images = []
        
        try:
            # View'u al
            view = FreeCADGui.ActiveDocument.ActiveView
            
            # View ayarları
            self._configure_view(view, settings)
            
            # Her viewpoint için render
            for viewpoint in viewpoints:
                try:
                    self._set_viewpoint(view, viewpoint)
                    
                    # Screenshot filename
                    output_file = output_path / f"assembly_{viewpoint.name}.png"
                    
                    # Screenshot al
                    view.saveImage(
                        str(output_file),
                        settings.resolution[0],
                        settings.resolution[1],
                        settings.background_color
                    )
                    
                    if output_file.exists():
                        output_images.append(str(output_file))
                        self._log_info(f"Assembly screenshot: {viewpoint.name}")
                    else:
                        self._log_warning(f"Screenshot dosyası oluşturulamadı: {output_file}")
                
                except Exception as vp_error:
                    self._log_warning(f"Viewpoint {viewpoint.name} render hatası: {vp_error}")
                    continue
        
        except Exception as e:
            self._log_error(f"Assembly render hatası: {e}")
        
        return output_images
    
    def _render_single_part(self,
                           part,
                           output_path: Path,
                           viewpoints: List[ViewPoint],
                           settings: FreeCADRenderSettings,
                           part_index: int) -> List[str]:
        """Tek bir part'ı render et"""
        output_images = []
        
        try:
            part_name = part.Label if hasattr(part, 'Label') else f"Part_{part_index}"
            part_name = self._sanitize_filename(part_name)
            
            # Part'ı göster, diğerlerini gizle
            gui_doc = FreeCADGui.ActiveDocument
            
            # Tüm objeleri gizle
            for obj in self.freecad_doc.Objects:
                if hasattr(obj, 'ViewObject'):
                    obj.ViewObject.Visibility = False
            
            # Sadece bu part'ı göster
            if hasattr(part, 'ViewObject'):
                part.ViewObject.Visibility = True
            
            # View'u al
            view = FreeCADGui.ActiveDocument.ActiveView
            
            # View ayarları
            self._configure_view(view, settings)
            
            # Fit to screen
            view.fitAll()
            
            # Her viewpoint için render
            for viewpoint in viewpoints:
                try:
                    self._set_viewpoint(view, viewpoint)
                    
                    # Screenshot filename
                    output_file = output_path / f"{part_name}_{viewpoint.name}.png"
                    
                    # Screenshot al
                    view.saveImage(
                        str(output_file),
                        settings.resolution[0],
                        settings.resolution[1],
                        settings.background_color
                    )
                    
                    if output_file.exists():
                        output_images.append(str(output_file))
                        self._log_info(f"Part screenshot: {part_name} - {viewpoint.name}")
                    else:
                        self._log_warning(f"Part screenshot oluşturulamadı: {output_file}")
                
                except Exception as vp_error:
                    self._log_warning(f"Part {part_name} viewpoint {viewpoint.name} hatası: {vp_error}")
                    continue
        
        except Exception as e:
            self._log_error(f"Part render hatası: {e}")
        
        return output_images
    
    def _configure_view(self, view, settings: FreeCADRenderSettings):
        """View ayarlarını yapılandır"""
        try:
            # View type
            if settings.perspective_view:
                view.setCameraType("Perspective")
            else:
                view.setCameraType("Orthographic")
            
            # Background
            if settings.background_color.lower() == "white":
                view.setBackgroundColor(1.0, 1.0, 1.0)
            elif settings.background_color.lower() == "black":
                view.setBackgroundColor(0.0, 0.0, 0.0)
            else:
                view.setBackgroundColor(0.8, 0.8, 0.9)  # Light gray default
            
            # Grid ve axis
            if hasattr(view, 'setAxisCross'):
                view.setAxisCross(settings.show_axes)
            
            # Fit all objects
            view.fitAll()
            
        except Exception as e:
            self._log_warning(f"View configuration hatası: {e}")
    
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
            else:
                # Custom viewpoint
                if hasattr(view, 'setCameraOrientation'):
                    # Calculate camera direction from position to target
                    import FreeCAD
                    pos = FreeCAD.Vector(viewpoint.position)
                    target = FreeCAD.Vector(viewpoint.target)
                    direction = pos.sub(target)
                    direction.normalize()
                    
                    view.viewPosition(pos, direction)
            
            # Fit after setting viewpoint
            view.fitAll()
            
        except Exception as e:
            self._log_warning(f"Viewpoint setting hatası: {e}")
    
    def _sanitize_filename(self, filename: str) -> str:
        """Dosya adını temizle"""
        import re
        # Geçersiz karakterleri kaldır
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Boşlukları underscore yap
        filename = filename.replace(' ', '_')
        # Çoklu underscore'ları tek yap
        filename = re.sub(r'_+', '_', filename)
        return filename[:50]  # Max 50 karakter
    
    def _render_headless_export(self, step_path, output_path, start_time):
        """GUI olmadan STEP → STL → External render"""
        try:
            # STEP → STL export yap
            doc_name = f"HeadlessExport_{int(time.time())}"
            doc = FreeCAD.newDocument(doc_name)
            
            try:
                # STEP dosyasını yükle
                Import.insert(str(step_path), doc_name)
                doc.recompute()
                
                # STL export
                objects = [obj for obj in doc.Objects if hasattr(obj, 'Shape')]
                if not objects:
                    raise Exception("STEP dosyasında obje bulunamadı")
                
                stl_file = output_path / "temp_headless_export.stl"
                
                # Mesh export
                import Mesh
                import MeshPart
                mesh_objects = []
                
                self._log_info(f"Processing {len(objects)} objects for mesh conversion")
                
                for i, obj in enumerate(objects):
                    try:
                        if hasattr(obj, 'Shape') and obj.Shape.Faces:
                            self._log_info(f"Converting object {i}: {obj.Label if hasattr(obj, 'Label') else 'Unnamed'}")
                            
                            # MeshPart ile mesh oluştur
                            mesh = MeshPart.meshFromShape(
                                Shape=obj.Shape,
                                LinearDeflection=0.1,
                                AngularDeflection=0.1,
                                Relative=False
                            )
                            
                            if mesh.CountFacets > 0:
                                mesh_objects.append(mesh)
                                self._log_info(f"Object {i} mesh: {mesh.CountFacets} facets")
                            else:
                                self._log_warning(f"Object {i} empty mesh")
                                
                    except Exception as obj_error:
                        self._log_warning(f"Object {i} mesh conversion hatası: {obj_error}")
                        continue
                
                if mesh_objects:
                    output_images = []
                    
                    # Her mesh için ayrı render (part-by-part)
                    for i, mesh_obj in enumerate(mesh_objects[:10]):  # Max 10 part
                        try:
                            part_stl = output_path / f"temp_part_{i}.stl"
                            mesh_obj.write(str(part_stl))
                            
                            # Bu part için render
                            part_images = self._render_stl_with_matplotlib(
                                part_stl, output_path, part_index=i
                            )
                            output_images.extend(part_images)
                            
                            # Geçici dosyayı sil
                            try:
                                import os
                                os.remove(part_stl)
                            except:
                                pass
                                
                        except Exception as part_error:
                            self._log_warning(f"Part {i} render hatası: {part_error}")
                            continue
                    
                    # Birleştirilmiş render de yap
                    try:
                        combined_mesh = mesh_objects[0]
                        for mesh in mesh_objects[1:3]:  # Sadece ilk 3'ünü birleştir
                            combined_mesh = combined_mesh.unite(mesh)
                        
                        combined_mesh.write(str(stl_file))
                        combined_images = self._render_stl_with_matplotlib(
                            stl_file, output_path, part_index="combined"
                        )
                        output_images.extend(combined_images)
                    except Exception as combined_error:
                        self._log_warning(f"Combined render hatası: {combined_error}")
                    
                    if output_images:
                        return RenderResult(
                            success=True,
                            mesh_file=str(step_path),
                            output_images=output_images,
                            render_time=time.time() - start_time,
                            render_stats={"method": "headless_export", "objects": len(objects), "parts_rendered": len(mesh_objects)}
                        )
                
                raise Exception("Mesh export başarısız")
                
            finally:
                FreeCAD.closeDocument(doc_name)
                
        except Exception as e:
            self._log_error(f"Headless export hatası: {e}")
            return RenderResult(
                success=False,
                mesh_file=str(step_path),
                output_images=[],
                render_time=time.time() - start_time,
                errors=[f"Headless export hatası: {str(e)}"]
            )
    
    def _render_stl_with_matplotlib(self, stl_file, output_path, part_index=0):
        """STL dosyasını matplotlib ile render et"""
        try:
            import matplotlib.pyplot as plt
            from mpl_toolkits.mplot3d import Axes3D
            from mpl_toolkits.mplot3d.art3d import Poly3DCollection
            import numpy as np
            
            # STL parse et (daha çok triangle)
            vertices, faces = self._parse_stl_file(stl_file, max_triangles=5000)
            if len(vertices) == 0:
                return []
            
            output_images = []
            viewpoints = [
                {"name": "iso", "elev": 30, "azim": 45, "color": "lightblue"},
                {"name": "front", "elev": 0, "azim": 0, "color": "lightgreen"}
            ]
            
            for vp in viewpoints:
                fig = plt.figure(figsize=(10, 8), facecolor='white')
                ax = fig.add_subplot(111, projection='3d', facecolor='white')
                
                # Mesh triangles'ı solid olarak çiz
                triangles = []
                for face in faces:
                    if len(face) == 3:  # Valid triangle
                        triangle = vertices[face]
                        triangles.append(triangle)
                
                if triangles:
                    # Poly3DCollection ile solid render
                    collection = Poly3DCollection(
                        triangles[:min(2000, len(triangles))],  # İlk 2000 triangle
                        alpha=0.8,
                        facecolors=vp["color"],
                        edgecolors='black',
                        linewidths=0.1
                    )
                    ax.add_collection3d(collection)
                    
                    # Bounding box hesapla
                    all_vertices = np.array([v for triangle in triangles for v in triangle])
                    x_min, x_max = all_vertices[:, 0].min(), all_vertices[:, 0].max()
                    y_min, y_max = all_vertices[:, 1].min(), all_vertices[:, 1].max()
                    z_min, z_max = all_vertices[:, 2].min(), all_vertices[:, 2].max()
                    
                    # Axis limits set et
                    ax.set_xlim([x_min, x_max])
                    ax.set_ylim([y_min, y_max])
                    ax.set_zlim([z_min, z_max])
                    
                    # View ayarları
                    ax.view_init(elev=vp["elev"], azim=vp["azim"])
                    ax.set_title(f'STEP Part {part_index} - {vp["name"].title()}', fontsize=14)
                    
                    # Axis labels
                    ax.set_xlabel('X')
                    ax.set_ylabel('Y')
                    ax.set_zlabel('Z')
                    
                    # Grid
                    ax.grid(True)
                    
                    # Background
                    ax.xaxis.pane.fill = False
                    ax.yaxis.pane.fill = False
                    ax.zaxis.pane.fill = False
                    
                    # Kaydet
                    output_file = output_path / f"part_{part_index}_{vp['name']}.png"
                    plt.savefig(output_file, dpi=200, bbox_inches='tight', 
                              facecolor='white', edgecolor='none')
                    plt.close()
                    
                    output_images.append(str(output_file))
                    self._log_info(f"Part {part_index} matplotlib render: {vp['name']} ({len(triangles)} triangles)")
                else:
                    plt.close()
            
            return output_images
            
        except Exception as e:
            self._log_error(f"Matplotlib render hatası: {e}")
            return []
    
    def _parse_stl_file(self, stl_file, max_triangles=5000):
        """Geliştirilmiş STL parser"""
        try:
            import struct
            import numpy as np
            vertices = []
            faces = []
            vertex_dict = {}  # Duplicate vertices'leri birleştir
            
            self._log_info(f"STL parsing: {stl_file}")
            
            with open(stl_file, 'rb') as f:
                # Header oku
                header = f.read(80)
                triangle_count = struct.unpack('<I', f.read(4))[0]
                
                self._log_info(f"STL triangle count: {triangle_count}")
                
                # Triangles oku
                triangles_to_read = min(triangle_count, max_triangles)
                
                for i in range(triangles_to_read):
                    # Normal vector (skip)
                    f.read(12)
                    
                    # 3 vertices
                    face_vertices = []
                    for j in range(3):
                        x, y, z = struct.unpack('<fff', f.read(12))
                        
                        # Vertex'i yuvarlayarak unique yap
                        vertex_key = (round(x, 3), round(y, 3), round(z, 3))
                        
                        if vertex_key not in vertex_dict:
                            vertex_dict[vertex_key] = len(vertices)
                            vertices.append([x, y, z])
                        
                        face_vertices.append(vertex_dict[vertex_key])
                    
                    faces.append(face_vertices)
                    
                    # Attribute bytes
                    f.read(2)
            
            vertices_array = np.array(vertices) if vertices else np.array([]).reshape(0, 3)
            faces_array = np.array(faces) if faces else np.array([]).reshape(0, 3)
            
            self._log_info(f"STL parsed: {len(vertices)} vertices, {len(faces)} faces")
            return vertices_array, faces_array
            
        except Exception as e:
            self._log_error(f"STL parse hatası: {e}")
            return np.array([]).reshape(0, 3), np.array([]).reshape(0, 3)
    
    def cleanup(self):
        """Temizlik işlemleri"""
        try:
            if self.freecad_doc:
                FreeCAD.closeDocument(self.freecad_doc.Name)
                self.freecad_doc = None
            
            # GUI'yi kapat
            if self.gui_initialized:
                try:
                    FreeCADGui.getMainWindow().close()
                    self.gui_initialized = False
                except:
                    pass
                    
        except Exception as e:
            self._log_warning(f"Cleanup hatası: {e}")
    
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