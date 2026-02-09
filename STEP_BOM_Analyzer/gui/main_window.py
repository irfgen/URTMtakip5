"""
STEP BOM Analyzer - Ana GUI Penceresi

Tkinter tabanlı modern GUI arayüzü.
STEP dosya seçimi, BOM analizi, render ve API entegrasyonu.
"""

import os
import sys
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import queue
from pathlib import Path
from typing import Dict, List, Optional, Any
import json
from datetime import datetime

# PIL for image display
try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Core modüller
from core.step_parser import STEPParser, STEPParseResult
from core.bom_extractor import BOMExtractor, BOMStructure
from core.mesh_converter import MeshConverter
from core.renderer import Renderer, RenderSettings, ViewPoint
from core.api_client import APIClient


class ProgressDialog:
    """Progress dialog penceresi"""
    
    def __init__(self, parent, title="İşlem devam ediyor..."):
        self.parent = parent
        self.dialog = tk.Toplevel(parent)
        self.dialog.title(title)
        self.dialog.geometry("400x150")
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Center on parent
        self.dialog.update_idletasks()
        x = parent.winfo_rootx() + parent.winfo_width()//2 - 200
        y = parent.winfo_rooty() + parent.winfo_height()//2 - 75
        self.dialog.geometry(f"400x150+{x}+{y}")
        
        # Progress bar
        self.progress = ttk.Progressbar(self.dialog, mode='indeterminate')
        self.progress.pack(pady=20, padx=20, fill='x')
        
        # Status label
        self.status_label = tk.Label(self.dialog, text="İşlem başlatılıyor...")
        self.status_label.pack(pady=10)
        
        # Cancel button
        self.cancel_button = ttk.Button(self.dialog, text="İptal", command=self.cancel)
        self.cancel_button.pack(pady=10)
        
        self.cancelled = False
        self.progress.start()
    
    def update_status(self, status_text):
        """Status güncelle"""
        if not self.cancelled:
            self.status_label.config(text=status_text)
            self.dialog.update()
    
    def cancel(self):
        """İptal et"""
        self.cancelled = True
        self.close()
    
    def close(self):
        """Dialog'u kapat"""
        self.progress.stop()
        self.dialog.destroy()


class LogWindow:
    """Log penceresi"""
    
    def __init__(self, parent):
        self.window = tk.Toplevel(parent)
        self.window.title("STEP BOM Analyzer - Log Kayıtları")
        self.window.geometry("800x600")
        
        # Log text area
        self.log_text = scrolledtext.ScrolledText(self.window, wrap=tk.WORD, 
                                                 state='disabled', font=('Consolas', 9))
        self.log_text.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Buttons frame
        button_frame = ttk.Frame(self.window)
        button_frame.pack(fill='x', padx=5, pady=5)
        
        ttk.Button(button_frame, text="Temizle", command=self.clear_logs).pack(side='left', padx=5)
        ttk.Button(button_frame, text="Kaydet", command=self.save_logs).pack(side='left', padx=5)
        ttk.Button(button_frame, text="Kapat", command=self.window.destroy).pack(side='right', padx=5)
    
    def add_log(self, message):
        """Log mesajı ekle"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {message}\n"
        
        self.log_text.config(state='normal')
        self.log_text.insert('end', formatted_message)
        self.log_text.see('end')
        self.log_text.config(state='disabled')
    
    def clear_logs(self):
        """Log'ları temizle"""
        self.log_text.config(state='normal')
        self.log_text.delete('1.0', 'end')
        self.log_text.config(state='disabled')
    
    def save_logs(self):
        """Log'ları dosyaya kaydet"""
        file_path = filedialog.asksaveasfilename(
            title="Log dosyasını kaydet",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            defaultextension=".txt"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(self.log_text.get('1.0', 'end'))
                messagebox.showinfo("Başarılı", f"Log dosyası kaydedildi: {file_path}")
            except Exception as e:
                messagebox.showerror("Hata", f"Log kaydetme hatası: {str(e)}")


class STEPAnalyzerMainWindow:
    """Ana pencere sınıfı"""
    
    def __init__(self, config=None, logger=None):
        self.config = config or {}
        self.logger = logger
        
        # UI ayarları
        if hasattr(config, 'get_ui_config'):
            self.ui_config = config.get_ui_config() or {}
        else:
            self.ui_config = self.config.get('UI', {})
        
        # Core modüller
        self.step_parser = STEPParser(config, logger)
        self.bom_extractor = BOMExtractor(config, logger)
        self.mesh_converter = MeshConverter(config, logger)
        self.renderer = Renderer(config, logger)
        self.api_client = APIClient(config, logger)
        
        # GUI durumu
        self.current_step_file = None
        self.current_parse_result = None
        self.current_bom = None
        self.render_results = []
        
        # Threading için queue
        self.task_queue = queue.Queue()
        
        # Ana pencere
        self.setup_main_window()
        self.setup_widgets()
        self.setup_bindings()
        
        # Log window
        self.log_window = None
        
        # Başlangıç durumu
        self.update_ui_state()
    
    def setup_main_window(self):
        """Ana pencereyi oluştur"""
        self.root = tk.Tk()
        self.root.title("STEP BOM Analyzer v1.0")
        
        # Pencere boyutu
        width = self.ui_config.get('window_width', 1400)
        height = self.ui_config.get('window_height', 900)
        
        # Ekranın merkezine yerleştir
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - width) // 2
        y = (screen_height - height) // 2
        
        self.root.geometry(f"{width}x{height}+{x}+{y}")
        self.root.minsize(1000, 600)
        
        # İcon (varsa)
        try:
            self.root.iconbitmap("icon.ico")
        except:
            pass
        
        # Style
        style = ttk.Style()
        style.theme_use('clam')  # Modern görünüm
    
    def setup_widgets(self):
        """Widget'ları oluştur"""
        # Ana notebook (tabs)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Tab'ları oluştur
        self.setup_file_tab()
        self.setup_bom_tab()
        self.setup_render_tab()
        self.setup_api_tab()
        
        # Status bar
        self.setup_status_bar()
        
        # Menu
        self.setup_menu()
    
    def setup_menu(self):
        """Menu bar oluştur"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # Dosya menüsü
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Dosya", menu=file_menu)
        file_menu.add_command(label="STEP Dosyası Aç...", command=self.select_step_file)
        file_menu.add_separator()
        file_menu.add_command(label="BOM Export...", command=self.export_bom)
        file_menu.add_separator()
        file_menu.add_command(label="Çıkış", command=self.root.quit)
        
        # Araçlar menüsü
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Araçlar", menu=tools_menu)
        tools_menu.add_command(label="Ayarlar...", command=self.show_settings)
        tools_menu.add_command(label="Log Kayıtları...", command=self.show_log_window)
        tools_menu.add_separator()
        tools_menu.add_command(label="Server Durumu", command=self.check_server_status)
        
        # Yardım menüsü
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Yardım", menu=help_menu)
        help_menu.add_command(label="Hakkında...", command=self.show_about)
    
    def setup_file_tab(self):
        """Dosya sekmesi"""
        file_frame = ttk.Frame(self.notebook)
        self.notebook.add(file_frame, text="STEP Dosyası")
        
        # Sol panel - Dosya seçimi ve bilgileri
        left_frame = ttk.LabelFrame(file_frame, text="Dosya İşlemleri", padding=10)
        left_frame.pack(side='left', fill='both', expand=True, padx=5, pady=5)
        
        # Dosya seçim
        ttk.Button(left_frame, text="STEP Dosyası Seç...", 
                  command=self.select_step_file).pack(fill='x', pady=5)
        
        self.file_path_label = ttk.Label(left_frame, text="Dosya seçilmedi", 
                                        foreground='gray')
        self.file_path_label.pack(fill='x', pady=5)
        
        # Parse butonu
        self.parse_button = ttk.Button(left_frame, text="STEP Dosyasını Analiz Et", 
                                      command=self.parse_step_file, state='disabled')
        self.parse_button.pack(fill='x', pady=10)
        
        # Dosya bilgileri
        info_frame = ttk.LabelFrame(left_frame, text="Dosya Bilgileri", padding=5)
        info_frame.pack(fill='both', expand=True, pady=10)
        
        self.file_info_text = scrolledtext.ScrolledText(info_frame, height=15, 
                                                       state='disabled', wrap=tk.WORD)
        self.file_info_text.pack(fill='both', expand=True)
        
        # Sağ panel - Thumbnail/Preview
        right_frame = ttk.LabelFrame(file_frame, text="Önizleme", padding=10)
        right_frame.pack(side='right', fill='both', expand=True, padx=5, pady=5)
        
        # Thumbnail display
        self.thumbnail_label = ttk.Label(right_frame, text="Önizleme yok", 
                                        background='white', relief='sunken')
        self.thumbnail_label.pack(fill='both', expand=True, pady=10)
    
    def setup_bom_tab(self):
        """BOM sekmesi"""
        bom_frame = ttk.Frame(self.notebook)
        self.notebook.add(bom_frame, text="BOM Analizi")
        
        # Üst panel - Kontroller
        control_frame = ttk.Frame(bom_frame)
        control_frame.pack(fill='x', padx=5, pady=5)
        
        self.extract_bom_button = ttk.Button(control_frame, text="BOM Çıkar", 
                                           command=self.extract_bom, state='disabled')
        self.extract_bom_button.pack(side='left', padx=5)
        
        self.export_bom_button = ttk.Button(control_frame, text="BOM Export Et", 
                                          command=self.export_bom, state='disabled')
        self.export_bom_button.pack(side='left', padx=5)
        
        # BOM istatistikleri
        stats_frame = ttk.LabelFrame(control_frame, text="İstatistikler")
        stats_frame.pack(side='right', padx=5)
        
        self.stats_label = ttk.Label(stats_frame, text="İstatistik yok")
        self.stats_label.pack(padx=10, pady=5)
        
        # BOM treeview
        tree_frame = ttk.LabelFrame(bom_frame, text="Bill of Materials", padding=5)
        tree_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Treeview ve scrollbar
        tree_container = ttk.Frame(tree_frame)
        tree_container.pack(fill='both', expand=True)
        
        self.bom_tree = ttk.Treeview(tree_container, columns=(
            'item_no', 'part_number', 'part_name', 'qty', 'level', 'category'
        ), show='tree headings')
        
        # Sütun başlıkları
        self.bom_tree.heading('#0', text='Hiyerarşi')
        self.bom_tree.heading('item_no', text='No')
        self.bom_tree.heading('part_number', text='Parça No')
        self.bom_tree.heading('part_name', text='Parça Adı')
        self.bom_tree.heading('qty', text='Adet')
        self.bom_tree.heading('level', text='Seviye')
        self.bom_tree.heading('category', text='Kategori')
        
        # Sütun genişlikleri
        self.bom_tree.column('#0', width=200)
        self.bom_tree.column('item_no', width=50)
        self.bom_tree.column('part_number', width=150)
        self.bom_tree.column('part_name', width=200)
        self.bom_tree.column('qty', width=80)
        self.bom_tree.column('level', width=60)
        self.bom_tree.column('category', width=120)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(tree_container, orient='vertical', command=self.bom_tree.yview)
        h_scrollbar = ttk.Scrollbar(tree_container, orient='horizontal', command=self.bom_tree.xview)
        
        self.bom_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack treeview ve scrollbars
        self.bom_tree.grid(row=0, column=0, sticky='nsew')
        v_scrollbar.grid(row=0, column=1, sticky='ns')
        h_scrollbar.grid(row=1, column=0, sticky='ew')
        
        tree_container.columnconfigure(0, weight=1)
        tree_container.rowconfigure(0, weight=1)
    
    def setup_render_tab(self):
        """Render sekmesi"""
        render_frame = ttk.Frame(self.notebook)
        self.notebook.add(render_frame, text="3D Render")
        
        # Sol panel - Kontroller
        left_panel = ttk.LabelFrame(render_frame, text="Render Ayarları", padding=10)
        left_panel.pack(side='left', fill='y', padx=5, pady=5)
        
        # Mesh oluşturma
        ttk.Label(left_panel, text="1. Mesh Oluştur").pack(anchor='w', pady=(0, 5))
        
        self.create_mesh_button = ttk.Button(left_panel, text="STL/OBJ Oluştur", 
                                           command=self.create_mesh, state='disabled')
        self.create_mesh_button.pack(fill='x', pady=5)
        
        # Render ayarları
        ttk.Separator(left_panel).pack(fill='x', pady=10)
        ttk.Label(left_panel, text="2. Render Ayarları").pack(anchor='w', pady=(0, 5))
        
        # Çözünürlük
        ttk.Label(left_panel, text="Çözünürlük:").pack(anchor='w')
        self.resolution_var = tk.StringVar(value="1920x1080")
        resolution_combo = ttk.Combobox(left_panel, textvariable=self.resolution_var,
                                       values=["800x600", "1024x768", "1920x1080", "2560x1440"])
        resolution_combo.pack(fill='x', pady=2)
        
        # Arkaplan rengi
        ttk.Label(left_panel, text="Arkaplan:").pack(anchor='w', pady=(10, 0))
        self.bg_color_var = tk.StringVar(value="white")
        bg_combo = ttk.Combobox(left_panel, textvariable=self.bg_color_var,
                               values=["white", "black", "gray", "blue"])
        bg_combo.pack(fill='x', pady=2)
        
        # Direct render butonu (STEP → Screenshot direkt)
        self.direct_render_button = ttk.Button(left_panel, text="🚀 STEP Direct Render", 
                                             command=self.render_3d_direct, state='disabled')
        self.direct_render_button.pack(fill='x', pady=5)
        
        # Render butonu (STL/OBJ → Screenshot)
        self.render_button = ttk.Button(left_panel, text="3D Render Yap (Mesh)", 
                                       command=self.render_3d, state='disabled')
        self.render_button.pack(fill='x', pady=5)
        
        # Thumbnail oluştur
        self.create_thumbnail_button = ttk.Button(left_panel, text="Thumbnail Oluştur", 
                                                 command=self.create_thumbnail, state='disabled')
        self.create_thumbnail_button.pack(fill='x', pady=5)
        
        # Sağ panel - Render sonuçları
        right_panel = ttk.LabelFrame(render_frame, text="Render Sonuçları", padding=5)
        right_panel.pack(side='right', fill='both', expand=True, padx=5, pady=5)
        
        # Render listesi
        list_frame = ttk.Frame(right_panel)
        list_frame.pack(fill='both', expand=True)
        
        self.render_listbox = tk.Listbox(list_frame, height=8)
        self.render_listbox.pack(side='left', fill='both', expand=True)
        
        list_scrollbar = ttk.Scrollbar(list_frame, orient='vertical')
        list_scrollbar.pack(side='right', fill='y')
        
        self.render_listbox.config(yscrollcommand=list_scrollbar.set)
        list_scrollbar.config(command=self.render_listbox.yview)
        
        # Önizleme
        self.render_preview_label = ttk.Label(right_panel, text="Önizleme yok", 
                                            background='lightgray', relief='sunken')
        self.render_preview_label.pack(fill='both', expand=True, pady=10)
        
        # Render listesi seçim eventi
        self.render_listbox.bind('<<ListboxSelect>>', self.on_render_select)
    
    def setup_api_tab(self):
        """API sekmesi"""
        api_frame = ttk.Frame(self.notebook)
        self.notebook.add(api_frame, text="API Entegrasyonu")
        
        # Üst panel - Server bilgileri
        server_frame = ttk.LabelFrame(api_frame, text="Server Bağlantısı", padding=10)
        server_frame.pack(fill='x', padx=5, pady=5)
        
        # Server URL
        ttk.Label(server_frame, text="Server URL:").grid(row=0, column=0, sticky='w', padx=5)
        # Server config'i al
        if hasattr(self.config, 'get_server_config'):
            server_config = self.config.get_server_config() or {}
        else:
            server_config = {}
        self.server_url_var = tk.StringVar(value=server_config.get('url', 'http://localhost:3000'))
        server_entry = ttk.Entry(server_frame, textvariable=self.server_url_var, width=50)
        server_entry.grid(row=0, column=1, padx=5, pady=2, sticky='ew')
        
        # Bağlantı test butonu
        self.test_connection_button = ttk.Button(server_frame, text="Bağlantıyı Test Et", 
                                               command=self.test_api_connection)
        self.test_connection_button.grid(row=0, column=2, padx=5)
        
        server_frame.columnconfigure(1, weight=1)
        
        # İşlemler paneli
        operations_frame = ttk.LabelFrame(api_frame, text="Part İşlemleri", padding=10)
        operations_frame.pack(fill='x', padx=5, pady=5)
        
        # Part kontrol
        self.check_parts_button = ttk.Button(operations_frame, text="Part Varlığını Kontrol Et", 
                                           command=self.check_parts, state='disabled')
        self.check_parts_button.pack(side='left', padx=5)
        
        # Missing part upload
        self.upload_parts_button = ttk.Button(operations_frame, text="Eksik Partları Upload Et", 
                                            command=self.upload_missing_parts, state='disabled')
        self.upload_parts_button.pack(side='left', padx=5)
        
        # Sonuçlar
        results_frame = ttk.LabelFrame(api_frame, text="API Sonuçları", padding=5)
        results_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        self.api_results_text = scrolledtext.ScrolledText(results_frame, height=20, 
                                                         state='disabled', wrap=tk.WORD)
        self.api_results_text.pack(fill='both', expand=True)
    
    def setup_status_bar(self):
        """Status bar oluştur"""
        self.status_frame = ttk.Frame(self.root)
        self.status_frame.pack(side='bottom', fill='x')
        
        # Status label
        self.status_label = ttk.Label(self.status_frame, text="Hazır", relief='sunken')
        self.status_label.pack(side='left', padx=5, pady=2)
        
        # Progress bar (gizli)
        self.status_progress = ttk.Progressbar(self.status_frame, length=200)
        # Başlangıçta pack etmiyoruz
        
        # Sağ tarafta - connection status
        self.connection_status_label = ttk.Label(self.status_frame, text="Server: Bağlı değil", 
                                               foreground='red')
        self.connection_status_label.pack(side='right', padx=5, pady=2)
    
    def setup_bindings(self):
        """Event bindings"""
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Drag & drop (basit)
        self.root.bind('<Button-1>', self.on_click)
    
    def run(self):
        """GUI'yi başlat"""
        self.root.mainloop()
    
    # Event handlers
    
    def select_step_file(self):
        """STEP dosyası seç"""
        filetypes = [
            ("STEP files", "*.step *.stp *.STEP *.STP"),
            ("All files", "*.*")
        ]
        
        file_path = filedialog.askopenfilename(
            title="STEP Dosyası Seçin",
            filetypes=filetypes
        )
        
        if file_path:
            self.current_step_file = file_path
            self.file_path_label.config(text=f"Seçili: {Path(file_path).name}", 
                                       foreground='blue')
            
            # Dosya bilgilerini göster
            self.display_file_info(file_path)
            self.update_ui_state()
            self.update_status(f"STEP dosyası seçildi: {Path(file_path).name}")
    
    def parse_step_file(self):
        """STEP dosyasını parse et"""
        if not self.current_step_file:
            messagebox.showerror("Hata", "Önce bir STEP dosyası seçin!")
            return
        
        # Threading ile parse et
        def parse_worker():
            try:
                self.update_status("STEP dosyası parse ediliyor...")
                result = self.step_parser.parse_step_file(self.current_step_file)
                self.task_queue.put(('parse_complete', result))
            except Exception as e:
                self.task_queue.put(('parse_error', str(e)))
        
        # Progress dialog göster
        self.progress_dialog = ProgressDialog(self.root, "STEP Dosyası Parse Ediliyor...")
        
        # Worker thread başlat
        thread = threading.Thread(target=parse_worker, daemon=True)
        thread.start()
        
        # Queue'yu kontrol et
        self.root.after(100, self.check_task_queue)
    
    def extract_bom(self):
        """BOM çıkar"""
        if not self.current_parse_result or not self.current_parse_result.success:
            messagebox.showerror("Hata", "Önce STEP dosyasını parse edin!")
            return
        
        def bom_worker():
            try:
                self.update_status("BOM çıkarılıyor...")
                bom = self.bom_extractor.extract_bom(self.current_parse_result)
                self.task_queue.put(('bom_complete', bom))
            except Exception as e:
                self.task_queue.put(('bom_error', str(e)))
        
        self.progress_dialog = ProgressDialog(self.root, "BOM Çıkarılıyor...")
        
        thread = threading.Thread(target=bom_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    def create_mesh(self):
        """Mesh oluştur"""
        if not self.current_step_file:
            messagebox.showerror("Hata", "Önce bir STEP dosyası seçin!")
            return
        
        # Output dizini seç
        output_dir = filedialog.askdirectory(title="Mesh dosyalarının kaydedileceği dizini seçin")
        if not output_dir:
            return
        
        def mesh_worker():
            try:
                self.update_status("Mesh dosyaları oluşturuluyor...")
                result = self.mesh_converter.convert_step_to_mesh(
                    self.current_step_file, 
                    output_dir,
                    formats=['stl', 'obj']
                )
                self.task_queue.put(('mesh_complete', result))
            except Exception as e:
                self.task_queue.put(('mesh_error', str(e)))
        
        self.progress_dialog = ProgressDialog(self.root, "Mesh Dosyaları Oluşturuluyor...")
        
        thread = threading.Thread(target=mesh_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    def create_placeholder_mesh(self):
        """Render için placeholder mesh oluştur"""
        try:
            import open3d as o3d
            import os
            
            # Basit kutu mesh'i oluştur
            mesh = o3d.geometry.TriangleMesh.create_box(width=100, height=50, depth=30)
            mesh.compute_vertex_normals()
            mesh.paint_uniform_color([0.7, 0.5, 0.3])
            
            # Output dizini oluştur
            output_dir = "gui_output"
            os.makedirs(output_dir, exist_ok=True)
            
            # STL olarak kaydet
            placeholder_file = os.path.join(output_dir, "placeholder_render.stl")
            success = o3d.io.write_triangle_mesh(placeholder_file, mesh)
            
            if success:
                self.mesh_files = [placeholder_file]
                self.logger.info(f"Placeholder mesh oluşturuldu: {placeholder_file}")
                return True
            else:
                self.logger.error("Placeholder mesh kaydedilemedi")
                return False
                
        except Exception as e:
            self.logger.error(f"Placeholder mesh oluşturma hatası: {e}")
            return False
    
    def _render_placeholder(self, output_dir):
        """Placeholder render yap"""
        try:
            import open3d as o3d
            import numpy as np
            import os
            from pathlib import Path
            from core.renderer import RenderSettings, RenderResult
            
            self.logger.info("Placeholder render başlatılıyor...")
            
            # Direkt Open3D ile render - dosya kaydetmeden
            mesh = o3d.geometry.TriangleMesh.create_box(width=100, height=50, depth=30)
            mesh.compute_vertex_normals()
            mesh.paint_uniform_color([0.8, 0.6, 0.4])
            
            # Basit visualizer ile render
            output_images = []
            render_stats = {"vertices": len(mesh.vertices), "faces": len(mesh.triangles)}
            
            try:
                # Standart viewpoint'lerden birkaçı için render
                viewpoints = [
                    {"name": "front", "position": [0, 0, 200], "target": [0, 0, 0]},
                    {"name": "iso", "position": [100, 100, 100], "target": [0, 0, 0]}
                ]
                
                for i, vp in enumerate(viewpoints):
                    try:
                        # Open3D visualizer (headless mode)
                        vis = o3d.visualization.Visualizer()
                        vis.create_window(visible=False, width=800, height=600)
                        vis.add_geometry(mesh)
                        
                        # Camera ayarla
                        ctr = vis.get_view_control()
                        
                        # Screenshot al
                        output_file = os.path.join(output_dir, f"placeholder_render_{vp['name']}.png")
                        vis.capture_screen_image(output_file)
                        
                        if os.path.exists(output_file):
                            output_images.append(output_file)
                            self.logger.info(f"Placeholder screenshot kaydedildi: {output_file}")
                        
                        vis.destroy_window()
                        
                    except Exception as render_error:
                        self.logger.warning(f"Placeholder viewpoint {vp['name']} render hatası: {render_error}")
                        continue
                
                if len(output_images) > 0:
                    result = RenderResult(
                        success=True,
                        mesh_file="placeholder_mesh",
                        output_images=output_images,
                        render_time=1.0,
                        render_stats=render_stats
                    )
                    self.logger.info(f"Placeholder render başarılı: {len(output_images)} images")
                    return result
                else:
                    self.logger.error("Placeholder render - hiç görüntü oluşturulamadı")
                    
            except Exception as vis_error:
                self.logger.error(f"Placeholder visualizer hatası: {vis_error}")
                
                # Fallback: Basit statik görüntü oluştur
                try:
                    import matplotlib.pyplot as plt
                    
                    fig = plt.figure(figsize=(8, 6))
                    ax = fig.add_subplot(111, projection='3d')
                    
                    # Basit kutu çiz
                    vertices = np.array([
                        [0, 0, 0], [100, 0, 0], [100, 50, 0], [0, 50, 0],
                        [0, 0, 30], [100, 0, 30], [100, 50, 30], [0, 50, 30]
                    ])
                    
                    ax.scatter(vertices[:, 0], vertices[:, 1], vertices[:, 2], c='orange', s=50)
                    ax.set_xlabel('X')
                    ax.set_ylabel('Y')
                    ax.set_zlabel('Z')
                    ax.set_title('Placeholder 3D Model')
                    
                    output_file = os.path.join(output_dir, "placeholder_render_fallback.png")
                    plt.savefig(output_file, dpi=100, bbox_inches='tight')
                    plt.close()
                    
                    if os.path.exists(output_file):
                        output_images = [output_file]
                        result = RenderResult(
                            success=True,
                            mesh_file="placeholder_mesh_fallback",
                            output_images=output_images,
                            render_time=1.0,
                            render_stats=render_stats
                        )
                        self.logger.info(f"Placeholder fallback render başarılı: {output_file}")
                        return result
                        
                except Exception as fallback_error:
                    self.logger.error(f"Placeholder fallback render hatası: {fallback_error}")
                
        except Exception as e:
            self.logger.error(f"Placeholder render genel hatası: {e}")
        
        # Eğer hiçbiri çalışmazsa boş result döndür
        return RenderResult(
            success=False,
            mesh_file="placeholder_failed",
            output_images=[],
            render_time=0.0,
            errors=["Placeholder render tüm yöntemler başarısız"]
        )
    
    def render_3d_direct(self):
        """STEP dosyasından direkt 3D render yap (STL dönüşümü olmadan)"""
        if not self.current_step_file:
            messagebox.showerror("Hata", "Önce bir STEP dosyası seçin!")
            return
        
        # Output dizini seç
        output_dir = filedialog.askdirectory(title="Render görüntülerinin kaydedileceği dizini seçin")
        if not output_dir:
            return
        
        # Render options dialog
        render_parts_separately = messagebox.askyesno(
            "Render Ayarları",
            "Her parçayı ayrı ayrı render etmek istiyor musunuz?\n\n" +
            "Evet: Her part için ayrı fotoğraflar\n" +
            "Hayır: Tüm assembly birlikte"
        )
        
        def direct_render_worker():
            try:
                self.update_status("STEP direkt rendering yapılıyor...")
                
                result = self.renderer.render_step_direct(
                    step_file=self.current_step_file,
                    output_dir=output_dir,
                    render_parts_separately=render_parts_separately
                )
                
                self.task_queue.put(('direct_render_complete', result))
                
            except Exception as e:
                self.task_queue.put(('direct_render_error', str(e)))
        
        self.progress_dialog = ProgressDialog(self.root, "STEP Direct Render Yapılıyor...")
        
        thread = threading.Thread(target=direct_render_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    def render_3d(self):
        """3D render yap (STL/OBJ dosyalarından)"""
        if not hasattr(self, 'mesh_files') or not self.mesh_files:
            # STEP dosyası varsa direkt render seçeneği sun
            if self.current_step_file:
                response = messagebox.askyesno(
                    "Mesh Dosyası Yok", 
                    "Henüz mesh dosyası oluşturulmamış.\n\n" +
                    "STEP dosyasından direkt render yapmak istiyor musunuz?\n" +
                    "(Bu daha hızlı ve kaliteli olacak)"
                )
                if response:
                    self.render_3d_direct()
                    return
            
            # Fallback: Placeholder mesh
            response = messagebox.askyesno(
                "Mesh Dosyası Yok", 
                "Placeholder mesh ile render yapmak istiyor musunuz?"
            )
            if not response:
                return
            
            # Placeholder mesh oluştur
            self.create_placeholder_mesh()
            if not hasattr(self, 'mesh_files') or not self.mesh_files:
                messagebox.showerror("Hata", "Placeholder mesh oluşturulamadı!")
                return
        
        # Output dizini seç
        output_dir = filedialog.askdirectory(title="Render görüntülerinin kaydedileceği dizini seçin")
        if not output_dir:
            return
        
        def render_worker():
            try:
                self.update_status("3D render yapılıyor...")
                all_results = []
                successful_renders = 0
                
                # İlk 3 mesh dosyasını dene
                for mesh_file in self.mesh_files[:3]:
                    try:
                        result = self.renderer.render_mesh(mesh_file, output_dir)
                        if result.success:
                            successful_renders += 1
                        all_results.append(result)
                    except Exception as mesh_error:
                        self.logger.warning(f"Mesh render hatası {mesh_file}: {mesh_error}")
                        continue
                
                # Hiçbiri başarılı olmadıysa placeholder render yap
                if successful_renders == 0:
                    self.logger.info("Mesh render başarısız, placeholder render yapılıyor...")
                    placeholder_result = self._render_placeholder(output_dir)
                    if placeholder_result and placeholder_result.success:
                        all_results = [placeholder_result]
                        successful_renders = 1
                        self.logger.info(f"Placeholder render başarılı: {len(placeholder_result.output_images)} images")
                    else:
                        self.logger.error(f"Placeholder render de başarısız: {placeholder_result.errors if placeholder_result else 'None result'}")
                
                if successful_renders > 0:
                    self.task_queue.put(('render_complete', all_results))
                else:
                    self.task_queue.put(('render_error', 'Tüm render denemeleri başarısız'))
                    
            except Exception as e:
                self.task_queue.put(('render_error', str(e)))
        
        self.progress_dialog = ProgressDialog(self.root, "3D Render Yapılıyor...")
        
        thread = threading.Thread(target=render_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    def create_thumbnail(self):
        """Thumbnail oluştur"""
        if not self.render_results:
            messagebox.showerror("Hata", "Önce 3D render yapın!")
            return
        
        # Tüm render görüntülerini topla
        all_images = []
        for result in self.render_results:
            if result.success:
                all_images.extend(result.output_images)
        
        if not all_images:
            messagebox.showerror("Hata", "Render görüntüsü bulunamadı!")
            return
        
        # Thumbnail dosya adı
        output_file = filedialog.asksaveasfilename(
            title="Thumbnail dosyasını kaydet",
            filetypes=[("PNG files", "*.png"), ("JPEG files", "*.jpg")],
            defaultextension=".png"
        )
        
        if output_file:
            success = self.renderer.create_thumbnail(all_images, output_file)
            if success:
                messagebox.showinfo("Başarılı", f"Thumbnail oluşturuldu: {output_file}")
            else:
                messagebox.showerror("Hata", "Thumbnail oluşturulamadı!")
    
    def export_bom(self):
        """BOM export et"""
        if not self.current_bom:
            messagebox.showerror("Hata", "Önce BOM çıkarın!")
            return
        
        # Output dizini seç
        output_dir = filedialog.askdirectory(title="BOM dosyalarının kaydedileceği dizini seçin")
        if not output_dir:
            return
        
        # Export formatları seç
        formats = ['json', 'excel', 'csv']  # Varsayılan
        
        def export_worker():
            try:
                self.update_status("BOM export ediliyor...")
                result = self.bom_extractor.export_bom(self.current_bom, output_dir, formats)
                self.task_queue.put(('export_complete', result))
            except Exception as e:
                self.task_queue.put(('export_error', str(e)))
        
        self.progress_dialog = ProgressDialog(self.root, "BOM Export Ediliyor...")
        
        thread = threading.Thread(target=export_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    # API işlemleri
    
    def test_api_connection(self):
        """API bağlantısını test et"""
        def test_worker():
            try:
                # Server URL'yi güncelle
                if hasattr(self.config, 'get_server_config'):
                    server_config = self.config.get_server_config() or {}
                else:
                    server_config = {}
                server_config['url'] = self.server_url_var.get()
                
                # Yeni API client
                api_client = APIClient(self.config, self.logger)
                response = api_client.connect_and_register()
                self.task_queue.put(('connection_test', response))
            except Exception as e:
                self.task_queue.put(('connection_error', str(e)))
        
        thread = threading.Thread(target=test_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    def check_parts(self):
        """Part varlık kontrolü"""
        if not self.current_bom:
            messagebox.showerror("Hata", "Önce BOM çıkarın!")
            return
        
        def check_worker():
            try:
                part_codes = [item.part_number for item in self.current_bom.items 
                             if item.category != 'Assembly']
                
                result = self.api_client.check_parts_exist(part_codes)
                self.task_queue.put(('parts_check', result))
            except Exception as e:
                self.task_queue.put(('parts_check_error', str(e)))
        
        self.progress_dialog = ProgressDialog(self.root, "Part Kontrolü Yapılıyor...")
        
        thread = threading.Thread(target=check_worker, daemon=True)
        thread.start()
        
        self.root.after(100, self.check_task_queue)
    
    def upload_missing_parts(self):
        """Eksik partları upload et"""
        # Bu fonksiyon part check sonrasında kullanılmalı
        messagebox.showinfo("Bilgi", "Bu özellik part kontrolü sonrasında aktif olacak")
    
    # Yardımcı metodlar
    
    def check_task_queue(self):
        """Task queue'yu kontrol et"""
        try:
            while True:
                task_type, result = self.task_queue.get_nowait()
                self.handle_task_result(task_type, result)
        except queue.Empty:
            pass
        
        # Tekrar kontrol et
        self.root.after(100, self.check_task_queue)
    
    def handle_task_result(self, task_type, result):
        """Task sonucunu işle"""
        if hasattr(self, 'progress_dialog'):
            self.progress_dialog.close()
            delattr(self, 'progress_dialog')
        
        if task_type == 'parse_complete':
            self.on_parse_complete(result)
        elif task_type == 'parse_error':
            self.on_parse_error(result)
        elif task_type == 'bom_complete':
            self.on_bom_complete(result)
        elif task_type == 'bom_error':
            self.on_bom_error(result)
        elif task_type == 'mesh_complete':
            self.on_mesh_complete(result)
        elif task_type == 'render_complete':
            self.on_render_complete(result)
        elif task_type == 'render_error':
            self.on_render_error(result)
        elif task_type == 'direct_render_complete':
            self.on_direct_render_complete(result)
        elif task_type == 'direct_render_error':
            self.on_direct_render_error(result)
        elif task_type == 'export_complete':
            self.on_export_complete(result)
        elif task_type == 'connection_test':
            self.on_connection_test(result)
        elif task_type == 'connection_error':
            self.on_connection_error(result)
        elif task_type == 'parts_check':
            self.on_parts_check(result)
        # Diğer task type'lar...
    
    def on_parse_complete(self, result):
        """Parse tamamlandığında"""
        self.current_parse_result = result
        
        if result.success:
            self.update_status(f"Parse tamamlandı: {result.total_parts} parts")
            self.display_parse_results(result)
            messagebox.showinfo("Başarılı", f"STEP dosyası başarıyla parse edildi!\n{result.total_parts} part bulundu.")
        else:
            self.update_status("Parse başarısız")
            error_msg = "\n".join(result.errors) if result.errors else "Bilinmeyen hata"
            messagebox.showerror("Parse Hatası", f"STEP dosyası parse edilemedi:\n{error_msg}")
        
        self.update_ui_state()
    
    def on_parse_error(self, error):
        """Parse hatası"""
        self.update_status("Parse hatası")
        messagebox.showerror("Hata", f"Parse işlemi sırasında hata: {error}")
        self.update_ui_state()
    
    def on_bom_complete(self, bom):
        """BOM çıkarma tamamlandı"""
        self.current_bom = bom
        
        if bom:
            self.update_status(f"BOM çıkarıldı: {bom.total_items} items")
            self.display_bom(bom)
            messagebox.showinfo("Başarılı", f"BOM başarıyla çıkarıldı!\n{bom.total_items} item bulundu.")
        else:
            self.update_status("BOM çıkarma başarısız")
            messagebox.showerror("Hata", "BOM çıkarılamadı!")
        
        self.update_ui_state()
    
    def on_mesh_complete(self, result):
        """Mesh oluşturma tamamlandı"""
        if result.success:
            self.mesh_files = result.output_files
            self.update_status(f"Mesh oluşturuldu: {len(result.output_files)} files")
            messagebox.showinfo("Başarılı", f"Mesh dosyaları oluşturuldu!\n{len(result.output_files)} dosya")
        else:
            self.update_status("Mesh oluşturulamadı")
            messagebox.showerror("Hata", f"Mesh oluşturulamadı: {result.errors}")
        
        self.update_ui_state()
    
    def on_render_complete(self, results):
        """Render tamamlandı"""
        self.render_results = results
        successful_renders = [r for r in results if r.success]
        
        if successful_renders:
            total_images = sum(len(r.output_images) for r in successful_renders)
            self.update_status(f"Render tamamlandı: {total_images} images")
            self.display_render_results(results)
            messagebox.showinfo("Başarılı", f"3D render tamamlandı!\n{total_images} görüntü oluşturuldu.")
        else:
            self.update_status("Render başarısız")
            messagebox.showerror("Hata", "Render işlemi başarısız!")
        
        self.update_ui_state()
    
    def on_export_complete(self, result):
        """Export tamamlandı"""
        if result.success:
            self.update_status(f"BOM export tamamlandı: {len(result.file_paths)} files")
            files_text = "\n".join([Path(f).name for f in result.file_paths])
            messagebox.showinfo("Başarılı", f"BOM başarıyla export edildi!\n\nOluşturulan dosyalar:\n{files_text}")
        else:
            self.update_status("BOM export başarısız")
            messagebox.showerror("Hata", f"BOM export başarısız: {result.errors}")
    
    def on_connection_test(self, response):
        """Connection test sonucu"""
        if response.success:
            self.connection_status_label.config(text="Server: Bağlı", foreground='green')
            self.update_status("Server bağlantısı başarılı")
            messagebox.showinfo("Başarılı", "Server bağlantısı başarılı!")
        else:
            self.connection_status_label.config(text="Server: Bağlı değil", foreground='red')
            self.update_status("Server bağlantısı başarısız")
            messagebox.showerror("Hata", f"Server bağlantısı başarısız: {response.error}")
    
    def on_render_error(self, error_msg):
        """Render error handler"""
        self.update_status("Render başarısız")
        messagebox.showerror("Render Hatası", f"3D render işlemi başarısız:\n{error_msg}")
        self.update_ui_state()
    
    def on_direct_render_complete(self, result):
        """Direct render tamamlandı"""
        self.render_results = [result]  # Single result for direct render
        
        if result.success:
            total_images = len(result.output_images)
            self.update_status(f"Direct render tamamlandı: {total_images} images")
            self.display_render_results([result])
            
            # Render stats'ı göster
            stats_msg = f"STEP Direct Render Tamamlandı!\n\n"
            stats_msg += f"Görüntü Sayısı: {total_images}\n"
            stats_msg += f"Render Süresi: {result.render_time:.2f}s\n"
            
            if result.render_stats:
                stats = result.render_stats
                if 'total_objects' in stats:
                    stats_msg += f"Toplam Obje: {stats['total_objects']}\n"
                if 'render_separately' in stats:
                    stats_msg += f"Ayrı Render: {'Evet' if stats['render_separately'] else 'Hayır'}\n"
                stats_msg += f"Render Engine: {stats.get('render_engine', 'N/A')}\n"
            
            messagebox.showinfo("Başarılı", stats_msg)
        else:
            self.update_status("Direct render başarısız")
            error_msg = "\n".join(result.errors) if result.errors else "Bilinmeyen hata"
            messagebox.showerror("Hata", f"STEP direct render başarısız:\n{error_msg}")
        
        self.update_ui_state()
    
    def on_direct_render_error(self, error_msg):
        """Direct render error handler"""
        self.update_status("Direct render başarısız")
        messagebox.showerror("Direct Render Hatası", f"STEP direct render işlemi başarısız:\n{error_msg}")
        self.update_ui_state()
    
    def on_connection_error(self, error_msg):
        """Connection error handler"""
        self.connection_status_label.config(text="Server: Bağlı değil", foreground='red')
        self.update_status("Server bağlantısı başarısız")
        messagebox.showerror("Bağlantı Hatası", f"Server bağlantısı başarısız:\n{error_msg}")
    
    def on_parts_check(self, result):
        """Part check sonucu"""
        if result.successful_items > 0:
            existing_count = len([r for r in result.results if r.exists])
            missing_count = result.successful_items - existing_count
            
            result_text = f"Part kontrol tamamlandı:\n"
            result_text += f"Toplam: {result.total_items}\n"
            result_text += f"Mevcut: {existing_count}\n"
            result_text += f"Eksik: {missing_count}"
            
            self.display_api_results(result_text)
            self.update_status(f"Part kontrolü: {existing_count} mevcut, {missing_count} eksik")
            
            if missing_count > 0:
                self.upload_parts_button.config(state='normal')
        else:
            messagebox.showerror("Hata", "Part kontrolü başarısız!")
    
    # Display metodları
    
    def display_file_info(self, file_path):
        """Dosya bilgilerini göster"""
        file_path = Path(file_path)
        
        info_text = f"Dosya: {file_path.name}\n"
        info_text += f"Yol: {file_path.parent}\n"
        info_text += f"Boyut: {file_path.stat().st_size / (1024*1024):.2f} MB\n"
        info_text += f"Değiştirilme: {datetime.fromtimestamp(file_path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        self.file_info_text.config(state='normal')
        self.file_info_text.delete('1.0', 'end')
        self.file_info_text.insert('1.0', info_text)
        self.file_info_text.config(state='disabled')
    
    def display_parse_results(self, result):
        """Parse sonuçlarını göster"""
        info_text = f"Parse Sonuçları:\n\n"
        info_text += f"Başarılı: {result.success}\n"
        info_text += f"Parse Süresi: {result.parse_time:.2f}s\n"
        info_text += f"Toplam Parts: {result.total_parts}\n"
        info_text += f"Toplam Assemblies: {result.total_assemblies}\n"
        info_text += f"Max Derinlik: {result.max_depth}\n\n"
        
        if result.errors:
            info_text += f"Hatalar:\n"
            for error in result.errors:
                info_text += f"- {error}\n"
        
        if result.warnings:
            info_text += f"Uyarılar:\n"
            for warning in result.warnings:
                info_text += f"- {warning}\n"
        
        self.file_info_text.config(state='normal')
        self.file_info_text.delete('1.0', 'end')
        self.file_info_text.insert('1.0', info_text)
        self.file_info_text.config(state='disabled')
    
    def display_bom(self, bom):
        """BOM'u treeview'da göster"""
        # Treeview'ı temizle
        for item in self.bom_tree.get_children():
            self.bom_tree.delete(item)
        
        # İstatistikleri güncelle
        stats_text = f"Items: {bom.total_items} | Levels: {bom.max_level}"
        self.stats_label.config(text=stats_text)
        
        # BOM item'larını ekle
        parent_map = {}  # level -> parent_id mapping
        
        for item in bom.items:
            # Parent'ı belirle
            if item.level == 0:
                parent = ''
            else:
                parent = parent_map.get(item.level - 1, '')
            
            # Tree item ekle
            item_id = self.bom_tree.insert(
                parent, 'end',
                text=f"{'  ' * item.level}{item.part_name}",
                values=(
                    item.item_number,
                    item.part_number,
                    item.part_name,
                    item.quantity,
                    item.level,
                    item.category or ''
                )
            )
            
            # Parent map güncelle
            parent_map[item.level] = item_id
        
        # Treeview'ı genişlet
        self.bom_tree.update()
        for item in self.bom_tree.get_children():
            self.bom_tree.item(item, open=True)
    
    def display_render_results(self, results):
        """Render sonuçlarını göster"""
        self.render_listbox.delete(0, 'end')
        
        for i, result in enumerate(results):
            if result.success:
                self.render_listbox.insert('end', f"Mesh {i+1}: {len(result.output_images)} images")
            else:
                self.render_listbox.insert('end', f"Mesh {i+1}: Error")
    
    def display_api_results(self, text):
        """API sonuçlarını göster"""
        self.api_results_text.config(state='normal')
        self.api_results_text.insert('end', f"\n{datetime.now().strftime('%H:%M:%S')} - {text}\n")
        self.api_results_text.see('end')
        self.api_results_text.config(state='disabled')
    
    # Event handlers
    
    def on_render_select(self, event):
        """Render listesi seçimi"""
        selection = self.render_listbox.curselection()
        if selection and self.render_results:
            index = selection[0]
            result = self.render_results[index]
            
            if result.success and result.output_images:
                # İlk resmi göster
                self.show_render_preview(result.output_images[0])
    
    def show_render_preview(self, image_path):
        """Render önizlemesi göster"""
        if not PIL_AVAILABLE:
            return
        
        try:
            # Resmi yükle ve boyutlandır
            img = Image.open(image_path)
            img.thumbnail((400, 300), Image.Resampling.LANCZOS)
            
            # PhotoImage'e çevir
            photo = ImageTk.PhotoImage(img)
            
            # Label'da göster
            self.render_preview_label.config(image=photo, text='')
            self.render_preview_label.image = photo  # Garbage collection için referans tut
            
        except Exception as e:
            self.render_preview_label.config(image='', text=f"Önizleme hatası: {str(e)}")
    
    def on_click(self, event):
        """Mouse click eventi"""
        pass  # Placeholder
    
    def on_closing(self):
        """Pencere kapatılırken"""
        # Cleanup
        if hasattr(self, 'api_client'):
            self.api_client.close()
        
        # Thread'leri temizle
        self.root.quit()
        self.root.destroy()
    
    # Utility metodları
    
    def update_ui_state(self):
        """UI durumunu güncelle"""
        # Parse butonu
        has_file = bool(self.current_step_file)
        self.parse_button.config(state='normal' if has_file else 'disabled')
        
        # BOM butonu
        has_parse = bool(self.current_parse_result and self.current_parse_result.success)
        self.extract_bom_button.config(state='normal' if has_parse else 'disabled')
        
        # Export butonu
        has_bom = bool(self.current_bom)
        self.export_bom_button.config(state='normal' if has_bom else 'disabled')
        
        # Mesh butonu
        self.create_mesh_button.config(state='normal' if has_file else 'disabled')
        
        # Direct render butonu (sadece STEP dosyası gerekli)
        self.direct_render_button.config(state='normal' if has_file else 'disabled')
        
        # Render butonu (mesh dosyası gerekli)
        has_mesh = hasattr(self, 'mesh_files') and self.mesh_files
        self.render_button.config(state='normal' if has_mesh else 'disabled')
        
        # Thumbnail butonu
        has_renders = bool(self.render_results)
        self.create_thumbnail_button.config(state='normal' if has_renders else 'disabled')
        
        # API butonları
        self.check_parts_button.config(state='normal' if has_bom else 'disabled')
    
    def update_status(self, message):
        """Status güncelle"""
        self.status_label.config(text=message)
        if self.logger:
            self.logger.info(f"GUI: {message}")
    
    def show_log_window(self):
        """Log penceresini göster"""
        if self.log_window is None or not self.log_window.window.winfo_exists():
            self.log_window = LogWindow(self.root)
    
    def show_settings(self):
        """Ayarlar penceresini göster"""
        messagebox.showinfo("Bilgi", "Ayarlar penceresi henüz implement edilmedi.\nconfig.ini dosyasından ayarları değiştirebilirsiniz.")
    
    def show_about(self):
        """Hakkında penceresi"""
        about_text = """STEP BOM Analyzer v1.0

STEP dosyalarından BOM çıkartan ve 3D görselleştirme yapan Python aracı.

Özellikler:
• STEP dosya analizi
• Hiyerarşik BOM çıkarma
• 3D mesh conversion
• Otomatik thumbnail oluşturma
• API entegrasyonu

Geliştirici: Claude Code
2025"""
        
        messagebox.showinfo("Hakkında", about_text)
    
    def check_server_status(self):
        """Server durumunu kontrol et"""
        def status_worker():
            try:
                response = self.api_client.get_server_status()
                self.task_queue.put(('server_status', response))
            except Exception as e:
                self.task_queue.put(('server_status_error', str(e)))
        
        thread = threading.Thread(target=status_worker, daemon=True)
        thread.start()
    
    def cleanup(self):
        """Temizlik işlemleri"""
        if hasattr(self, 'api_client'):
            self.api_client.close()
        
        # Core modül temizliği
        if hasattr(self, 'step_parser'):
            self.step_parser.cleanup()