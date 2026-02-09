#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Dizin Tarama Client
Windows tabanlı kullanıcı bilgisayarında çalışan dizin tarama uygulaması
"""

import os
import sys
import json
import time
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import _tkinter
import requests
from pathlib import Path
import configparser
from datetime import datetime
import queue
import logging

# v1.2.0 - Yeni modüller
DATABASE_INTEGRATION = False  # Initialize first

# Import modüllerini ayrı ayrı dene
try:
    from database_client import DatabaseClient
    print("✅ DatabaseClient imported successfully")
except ImportError as e:
    print(f"⚠️ DatabaseClient import failed: {e}")
    DatabaseClient = None

try:
    from selection_manager import SelectionManager
    print("✅ SelectionManager imported successfully")
except ImportError as e:
    print(f"⚠️ SelectionManager import failed: {e}")
    SelectionManager = None

try:
    from part_detail_window import PartDetailWindow
    print("✅ PartDetailWindow imported successfully")
except ImportError as e:
    print(f"⚠️ PartDetailWindow import failed: {e}")
    PartDetailWindow = None

# Database integration'ı kontrol et - tkinter olmadan da çalışabilmeli
if DatabaseClient is not None and SelectionManager is not None:
    DATABASE_INTEGRATION = True
    print("✅ Database integration enabled")

    # PartDetailWindow için fake class oluştur (eğer tkinter yoksa)
    if PartDetailWindow is None:
        print("⚠️ PartDetailWindow disabled - tkinter not available")
        class PartDetailWindow:
            def __init__(self, parent, selected_parts, database_client, config):
                print("⚠️ PartDetailWindow is not available in this environment")
                messagebox.showinfo("Bilgi", "Parça detayları WSL ortamında gösterilemez.\nWindows ortamında kullanınız.")

            @property
            def window(self):
                return type('MockWindow', (), {'winfo_exists': lambda: False})()
else:
    DATABASE_INTEGRATION = False
    print("⚠️ Database integration disabled - some features may not work")

    # Test amaçlı fake sınıflar oluştur
    if DatabaseClient is None:
        class DatabaseClient:
            def __init__(self, server_url):
                self.server_url = server_url
            def test_connection(self):
                return True
            def get_bulk_part_info(self, parts):
                return {'success': True, 'data': {'parts': []}}
            def clear_cache(self):
                pass

    if SelectionManager is None:
        class SelectionManager:
            def __init__(self):
                pass
            def toggle_part_selection(self, part):
                return True
            def is_part_selected(self, part):
                return False
            def get_selected_parts(self):
                return []
            def get_selected_parts_data(self):
                return []
            def validate_selection(self):
                return {'valid': True}
            def clear_all_selections(self):
                pass
            def set_part_selection(self, part, selected):
                pass

# Version bilgilerini yukle
try:
    from version import get_version, get_version_full, get_version_info
    VERSION_AVAILABLE = True
except ImportError:
    VERSION_AVAILABLE = False
    def get_version():
        return "1.0.0"
    def get_version_full():
        return "1.0.0.unknown"
    def get_version_info():
        return {'version': '1.0.0', 'name': 'URTM Dizin Tarama Client'}

# Windows spesifik modülü yükle
if sys.platform == "win32":
    try:
        from windows_utils import WindowsUtils
        WINDOWS_UTILS_AVAILABLE = True
    except ImportError:
        WINDOWS_UTILS_AVAILABLE = False
        WindowsUtils = None
else:
    WINDOWS_UTILS_AVAILABLE = False
    WindowsUtils = None

class DizinTaramaClient:
    def __init__(self):
        self.root = tk.Tk()

        # Versiyon bilgilerini al
        self.version_info = get_version_info()
        window_title = f"{self.version_info['name']} v{get_version()}"
        self.root.title(window_title)
        self.root.geometry("900x700")

        # Yapılandırma
        self.config = configparser.ConfigParser()
        self.config_file = "config.ini"
        self.load_config()

        # Logging ayarları
        self.setup_logging()

        # API bağlantı durumu
        self.api_connected = False
        self.server_url = self.config.get('SERVER', 'url', fallback='http://localhost:3000')

        # Thread-safe queue for UI updates
        self.ui_queue = queue.Queue()

        # Tarama durumu
        self.scanning = False
        self.scan_thread = None

        # v1.2.0 - Yeni özellikler
        self.db_client = None
        self.selection_manager = None
        self.part_detail_window = None
        self.last_scan_data = None

        # Seçim sistemi için değişkenler
        self.checkboxes_enabled = False
        self.selection_stats = {}

        # DatabaseClient'ı başlat
        if DATABASE_INTEGRATION:
            try:
                self.db_client = DatabaseClient(self.server_url)
                self.selection_manager = SelectionManager()
                self.selection_manager.add_callback(self.on_selection_changed)
                self.logger.info("Database entegrasyonu başlatıldı")
            except Exception as e:
                self.logger.error(f"Database entegrasyon hatası: {e}")
                # Database integration failed for this instance, continue without it

        # GUI oluştur
        self.create_gui()

        # Periyodik UI güncelleme
        self.root.after(100, self.process_ui_queue)

        # Başlangıçta sunucu bağlantısını test et
        self.test_server_connection()

    def setup_logging(self):
        """Logging yapılandırması"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('dizin_tarama.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def load_config(self):
        """Yapılandırma dosyasını yükle"""
        if os.path.exists(self.config_file):
            self.config.read(self.config_file, encoding='utf-8')
        else:
            # Varsayılan yapılandırma oluştur
            self.config['SERVER'] = {
                'url': 'http://localhost:3000',
                'timeout': '30'
            }
            self.config['SCAN'] = {
                'extensions': '.sldprt,.slddrw,.pdf',
                'exclude_folders': 'IPTAL,iptal,temp,Temp',
                'max_depth': '10'
            }
            self.config['UI'] = {
                'last_directory': '',
                'auto_scan_interval': '0'
            }
            self.save_config()

    def save_config(self):
        """Yapılandırmayı kaydet"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            self.config.write(f)

    def create_gui(self):
        """GUI arayüzünü oluştur"""
        # Ana frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Grid yapılandırması
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        if DATABASE_INTEGRATION:
            main_frame.rowconfigure(6, weight=1)  # Results frame için
        else:
            main_frame.rowconfigure(5, weight=1)  # Results frame için

        # Başlık ve versiyon
        title_text = f"{self.version_info['name']}"
        title_label = ttk.Label(main_frame, text=title_text, font=('Arial', 14, 'bold'))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 5))

        version_text = f"Versiyon: {get_version_full()} | {self.version_info.get('release_date', '')}"
        version_label = ttk.Label(main_frame, text=version_text, font=('Arial', 9), foreground='gray')
        version_label.grid(row=1, column=0, columnspan=3, pady=(0, 15))

        # Sunucu durumu
        server_frame = ttk.LabelFrame(main_frame, text="Sunucu Bağlantısı", padding="5")
        server_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        server_frame.columnconfigure(1, weight=1)

        ttk.Label(server_frame, text="Sunucu URL:").grid(row=0, column=0, sticky=tk.W)
        self.server_url_var = tk.StringVar(value=self.server_url)
        self.server_entry = ttk.Entry(server_frame, textvariable=self.server_url_var, width=40)
        self.server_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5))

        self.test_button = ttk.Button(server_frame, text="Bağlantıyı Test Et",
                                     command=self.test_server_connection)
        self.test_button.grid(row=0, column=2, padx=(5, 0))

        self.connection_status = ttk.Label(server_frame, text="Bağlantı durumu bilinmiyor",
                                          foreground="orange")
        self.connection_status.grid(row=1, column=0, columnspan=3, pady=(5, 0))

        # Dizin seçimi
        dir_frame = ttk.LabelFrame(main_frame, text="Dizin Seçimi", padding="5")
        dir_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        dir_frame.columnconfigure(1, weight=1)

        ttk.Label(dir_frame, text="Taranacak Dizin:").grid(row=0, column=0, sticky=tk.W)
        self.directory_var = tk.StringVar(value=self.config.get('UI', 'last_directory', fallback=''))
        self.directory_entry = ttk.Entry(dir_frame, textvariable=self.directory_var, width=50)
        self.directory_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5))

        self.browse_button = ttk.Button(dir_frame, text="Gözat", command=self.browse_directory)
        self.browse_button.grid(row=0, column=2)

        # Tarama kontrolleri
        control_frame = ttk.LabelFrame(main_frame, text="Tarama Kontrolleri", padding="5")
        control_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))

        self.scan_button = ttk.Button(control_frame, text="Taramayı Başlat",
                                     command=self.start_scan, style="Accent.TButton")
        self.scan_button.grid(row=0, column=0, padx=(0, 10))

        self.stop_button = ttk.Button(control_frame, text="Durdur",
                                     command=self.stop_scan, state="disabled")
        self.stop_button.grid(row=0, column=1, padx=(0, 10))

        # Progress bar
        self.progress_var = tk.StringVar(value="Hazır")
        ttk.Label(control_frame, textvariable=self.progress_var).grid(row=0, column=2, padx=(10, 0))

        self.progress_bar = ttk.Progressbar(control_frame, mode='indeterminate')
        self.progress_bar.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(5, 0))

        # v1.2.0 - Seçim kontrolleri
        if DATABASE_INTEGRATION:
            selection_frame = ttk.LabelFrame(main_frame, text="Parça Seçimi", padding="5")
            selection_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 5))

            # Seçim kontrol butonları
            selection_buttons_frame = ttk.Frame(selection_frame)
            selection_buttons_frame.grid(row=0, column=0, columnspan=4, sticky=(tk.W, tk.E))

            self.select_all_button = ttk.Button(selection_buttons_frame, text="Tümünü Seç",
                                               command=self.select_all_parts, state="disabled")
            self.select_all_button.grid(row=0, column=0, padx=(0, 5))

            self.clear_selection_button = ttk.Button(selection_buttons_frame, text="Seçimi Temizle",
                                                    command=self.clear_selection, state="disabled")
            self.clear_selection_button.grid(row=0, column=1, padx=(0, 5))

            # Durum bazlı seçim
            self.select_complete_button = ttk.Button(selection_buttons_frame, text="Tam Olanları Seç",
                                                    command=lambda: self.select_by_status('complete'), state="disabled")
            self.select_complete_button.grid(row=0, column=2, padx=(0, 5))

            self.select_partial_button = ttk.Button(selection_buttons_frame, text="Kısmi Olanları Seç",
                                                   command=lambda: self.select_by_status('partial'), state="disabled")
            self.select_partial_button.grid(row=0, column=3, padx=(0, 5))

            # Detay görüntüleme butonu - daha görünür ve büyük
            self.show_details_button = ttk.Button(selection_buttons_frame, text="📋 Seçilen Parçaların Detaylarını Göster",
                                                 command=self.show_part_details, state="disabled")
            self.show_details_button.grid(row=0, column=4, padx=(20, 0))

            # İkinci satırda navigasyon butonu
            nav_frame = ttk.Frame(selection_frame)
            nav_frame.grid(row=2, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=(10, 0))

            self.detail_navigation_button = ttk.Button(nav_frame, text="➡️ Detay Sayfasına Geç",
                                                      command=self.navigate_to_detail_view, state="disabled")
            self.detail_navigation_button.grid(row=0, column=0, padx=(0, 10))

            # İstatistik bilgisi
            self.detail_info_label = ttk.Label(nav_frame, text="Seçili parçaların kartlarını görüntülemek için detay sayfasına geçin",
                                              font=('Arial', 9), foreground='gray')
            self.detail_info_label.grid(row=0, column=1, padx=(10, 0))

            # Seçim istatistikleri
            self.selection_stats_var = tk.StringVar(value="Seçili parça yok")
            self.selection_stats_label = ttk.Label(selection_frame, textvariable=self.selection_stats_var,
                                                  font=('Arial', 9), foreground='blue')
            self.selection_stats_label.grid(row=1, column=0, columnspan=4, pady=(5, 0))

        # Sonuçlar
        results_frame = ttk.LabelFrame(main_frame, text="Tarama Sonuçları", padding="5")
        if DATABASE_INTEGRATION:
            results_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        else:
            results_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        results_frame.columnconfigure(0, weight=1)
        results_frame.rowconfigure(0, weight=1)

        # Treeview for results
        if DATABASE_INTEGRATION:
            columns = ('☑', 'Parça Adı', '3D (.sldprt)', 'Çizim (.slddrw)', 'PDF (.pdf)', 'Durum', 'DB Durumu')
        else:
            columns = ('Parça Adı', '3D (.sldprt)', 'Çizim (.slddrw)', 'PDF (.pdf)', 'Durum')

        self.results_tree = ttk.Treeview(results_frame, columns=columns, show='headings', height=15)

        # Column headers
        for col in columns:
            self.results_tree.heading(col, text=col)
            if col == '☑':
                self.results_tree.column(col, width=40, anchor='center')
            elif col == 'Parça Adı':
                self.results_tree.column(col, width=200)
            elif col == 'Durum' or col == 'DB Durumu':
                self.results_tree.column(col, width=100)
            else:
                self.results_tree.column(col, width=80, anchor='center')

        # TreeView click event için bind
        if DATABASE_INTEGRATION:
            self.results_tree.bind('<Button-1>', self.on_tree_click)
            self.results_tree.bind('<Double-1>', self.on_tree_double_click)

        # Scrollbars
        v_scrollbar = ttk.Scrollbar(results_frame, orient=tk.VERTICAL, command=self.results_tree.yview)
        h_scrollbar = ttk.Scrollbar(results_frame, orient=tk.HORIZONTAL, command=self.results_tree.xview)
        self.results_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)

        self.results_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        v_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        h_scrollbar.grid(row=1, column=0, sticky=(tk.W, tk.E))

        # İstatistikler
        stats_frame = ttk.LabelFrame(main_frame, text="İstatistikler", padding="5")
        if DATABASE_INTEGRATION:
            stats_frame.grid(row=7, column=0, columnspan=3, sticky=(tk.W, tk.E))
        else:
            stats_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E))

        self.stats_text = tk.Text(stats_frame, height=4, state='disabled')
        self.stats_text.grid(row=0, column=0, sticky=(tk.W, tk.E))
        stats_frame.columnconfigure(0, weight=1)

        # Alt bar
        bottom_frame = ttk.Frame(main_frame)
        if DATABASE_INTEGRATION:
            bottom_frame.grid(row=8, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(10, 0))
        else:
            bottom_frame.grid(row=7, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(10, 0))
        bottom_frame.columnconfigure(0, weight=1)

        self.status_var = tk.StringVar(value="Hazır")
        status_label = ttk.Label(bottom_frame, textvariable=self.status_var)
        status_label.grid(row=0, column=0, sticky=tk.W)

        # Versiyon ve Ayarlar
        version_settings_frame = ttk.Frame(bottom_frame)
        version_settings_frame.grid(row=0, column=1, sticky=tk.E)

        about_button = ttk.Button(version_settings_frame, text="Hakkında", command=self.show_about)
        about_button.grid(row=0, column=0, padx=(0, 5))

        settings_button = ttk.Button(version_settings_frame, text="Ayarlar", command=self.show_settings)
        settings_button.grid(row=0, column=1)

    def process_ui_queue(self):
        """UI güncellemelerini işle"""
        try:
            while True:
                action, data = self.ui_queue.get_nowait()
                if action == 'status':
                    self.status_var.set(data)
                elif action == 'progress':
                    self.progress_var.set(data)
                elif action == 'connection':
                    self.update_connection_status(data)
                elif action == 'results':
                    self.update_results(data)
                elif action == 'scan_complete':
                    self.scan_complete(data)
                elif action == 'db_info_loaded':
                    self.update_database_info(data)
                elif action == 'db_info_error':
                    self.handle_database_error(data)
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self.process_ui_queue)

    def test_server_connection(self):
        """Sunucu bağlantısını test et"""
        def test():
            try:
                self.server_url = self.server_url_var.get()
                self.config.set('SERVER', 'url', self.server_url)
                self.save_config()

                response = requests.get(f"{self.server_url}/api/health", timeout=10)
                if response.status_code == 200:
                    self.api_connected = True
                    self.ui_queue.put(('connection', 'connected'))
                    self.logger.info(f"Sunucu bağlantısı başarılı: {self.server_url}")
                else:
                    self.api_connected = False
                    self.ui_queue.put(('connection', 'error'))
                    self.logger.warning(f"Sunucu yanıt vermiyor: {response.status_code}")
            except Exception as e:
                self.api_connected = False
                self.ui_queue.put(('connection', 'error'))
                self.logger.error(f"Sunucu bağlantı hatası: {str(e)}")

        threading.Thread(target=test, daemon=True).start()

    def update_connection_status(self, status):
        """Bağlantı durumunu güncelle"""
        if status == 'connected':
            self.connection_status.config(text="✓ Sunucuya bağlandı", foreground="green")
        elif status == 'error':
            self.connection_status.config(text="✗ Sunucuya bağlanılamıyor", foreground="red")
        else:
            self.connection_status.config(text="○ Bağlantı test ediliyor...", foreground="orange")

    def browse_directory(self):
        """Dizin seçici aç"""
        initial_dir = self.directory_var.get() or os.path.expanduser("~")

        # Windows'ta eşlenmiş sürücüleri kontrol et
        if WINDOWS_UTILS_AVAILABLE:
            try:
                mapped_drives = WindowsUtils.get_mapped_drives()
                if mapped_drives and not self.directory_var.get():
                    # İlk eşlenmiş sürücüyü başlangıç dizini olarak kullan
                    initial_dir = mapped_drives[0]['path']
            except:
                pass

        directory = filedialog.askdirectory(
            title="Taranacak Dizini Seçin",
            initialdir=initial_dir
        )
        if directory:
            # Windows path'i normalize et
            if WINDOWS_UTILS_AVAILABLE:
                directory = WindowsUtils.normalize_windows_path(directory)

            self.directory_var.set(directory)
            self.config.set('UI', 'last_directory', directory)
            self.save_config()

    def start_scan(self):
        """Taramayı başlat"""
        directory = self.directory_var.get().strip()
        if not directory:
            messagebox.showerror("Hata", "Lütfen taranacak dizini seçin")
            return

        if not os.path.exists(directory):
            messagebox.showerror("Hata", "Seçilen dizin bulunamadı")
            return

        if not self.api_connected:
            messagebox.showerror("Hata", "Sunucu bağlantısı yok. Önce sunucuya bağlanın.")
            return

        self.scanning = True
        self.scan_button.config(state="disabled")
        self.stop_button.config(state="normal")
        self.progress_bar.start(10)

        # Sonuçları temizle
        for item in self.results_tree.get_children():
            self.results_tree.delete(item)

        # Tarama thread'ini başlat
        self.scan_thread = threading.Thread(target=self.scan_directory, args=(directory,), daemon=True)
        self.scan_thread.start()

    def stop_scan(self):
        """Taramayı durdur"""
        self.scanning = False
        self.ui_queue.put(('status', 'Tarama durduruluyor...'))

    def scan_directory(self, directory):
        """Dizini tara"""
        try:
            self.ui_queue.put(('status', 'Dizin taraması başlatılıyor...'))
            self.ui_queue.put(('progress', 'Dosyalar toplanıyor...'))

            # Dosyaları topla
            file_data = self.collect_files(directory)

            if not self.scanning:
                return

            self.ui_queue.put(('progress', 'Dosyalar sunucuya gönderiliyor...'))

            # Sunucuya gönder
            result = self.send_scan_results(directory, file_data)

            if result:
                self.ui_queue.put(('scan_complete', result))
                self.ui_queue.put(('status', f'Tarama tamamlandı - {len(result.get("parcaListesi", []))} parça bulundu'))
            else:
                self.ui_queue.put(('status', 'Tarama başarısız oldu'))

        except Exception as e:
            self.logger.error(f"Tarama hatası: {str(e)}")
            self.ui_queue.put(('status', f'Tarama hatası: {str(e)}'))
        finally:
            self.scanning = False
            self.root.after(0, self.reset_scan_ui)

    def collect_files(self, directory):
        """Dosyaları topla ve hiyerarşik olarak gruplandır (Montaj + Parça - ENHANCED)"""
        # Tarama modunu kontrol et
        scan_mode = self.config.get('SCAN', 'mode', fallback='enhanced')  # 'legacy' or 'enhanced'

        if scan_mode == 'legacy':
            return self.collect_files_legacy(directory)
        else:
            return self.collect_files_enhanced(directory)

    def collect_files_enhanced(self, directory):
        """Gelişmiş dosya toplama - Montaj ve Parça hiyerarşisi ile"""
        # Desteklenen uzantılar
        part_extensions = ['.sldprt']
        assembly_extensions = ['.sldasm']
        drawing_extensions = ['.slddrw']
        pdf_extensions = ['.pdf']
        all_extensions = part_extensions + assembly_extensions + drawing_extensions + pdf_extensions

        exclude_folders = self.config.get('SCAN', 'exclude_folders', fallback='IPTAL,iptal,temp,Temp').split(',')
        max_depth = int(self.config.get('SCAN', 'max_depth', fallback='10'))

        # Veri yapıları
        assemblies = {}  # Montaj dosyaları
        parts = {}       # Parça dosyaları
        file_count = 0

        self.ui_queue.put(('status', f'🔍 Gelişmiş tarama: {directory}'))
        self.ui_queue.put(('progress', '📁 Dosyalar toplanıyor...'))

        for root, dirs, files in os.walk(directory):
            # Derinlik kontrolü
            current_depth = root[len(directory):].count(os.sep)
            if current_depth >= max_depth:
                dirs[:] = []  # Alt dizinlere inmeyeceğiz
                continue

            # Hariç tutulan klasörleri filtrele
            dirs[:] = [d for d in dirs if d not in exclude_folders]

            if not self.scanning:
                break

            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                file_name = os.path.splitext(file)[0]

                if file_ext in all_extensions:
                    file_count += 1

                    if file_ext in assembly_extensions:
                        # Montaj dosyası
                        if file_name not in assemblies:
                            assemblies[file_name] = {
                                'type': 'assembly',
                                'parcaAdi': file_name,
                                'sldasm': [],
                                'slddrw': [],
                                'pdf': [],
                                'children': {},
                                'level': current_depth,
                                'path': os.path.relpath(root, directory)
                            }

                        if file_ext == '.sldasm':
                            assemblies[file_name]['sldasm'].append(file_path)
                        elif file_ext == '.slddrw':
                            assemblies[file_name]['slddrw'].append(file_path)
                        elif file_ext == '.pdf':
                            assemblies[file_name]['pdf'].append(file_path)

                    elif file_ext in part_extensions:
                        # Parça dosyası
                        if file_name not in parts:
                            parts[file_name] = {
                                'type': 'part',
                                'parcaAdi': file_name,
                                'sldprt': [],
                                'slddrw': [],
                                'pdf': [],
                                'level': current_depth,
                                'parent_assembly': None,
                                'path': os.path.relpath(root, directory)
                            }

                        if file_ext == '.sldprt':
                            parts[file_name]['sldprt'].append(file_path)
                        elif file_ext == '.slddrw':
                            parts[file_name]['slddrw'].append(file_path)
                        elif file_ext == '.pdf':
                            parts[file_name]['pdf'].append(file_path)

                    if file_count % 50 == 0:  # Her 50 dosyada bir güncelle
                        self.ui_queue.put(('progress', f'📄 {file_count} dosya bulundu...'))

        # Hiyerarşik ilişkileri kur
        self.ui_queue.put(('progress', '🔗 İlişkiler kuruluyor...'))
        self.build_hierarchy(assemblies, parts, directory)

        return {
            'assemblies': assemblies,
            'parts': parts,
            'statistics': self.calculate_enhanced_statistics(assemblies, parts),
            'scanMode': 'enhanced'
        }

    def collect_files_legacy(self, directory):
        """Eski dosya toplama yöntemi (geriye uyumluluk)"""
        extensions = self.config.get('SCAN', 'extensions', fallback='.sldprt,.slddrw,.pdf').split(',')
        exclude_folders = self.config.get('SCAN', 'exclude_folders', fallback='IPTAL,iptal,temp,Temp').split(',')
        max_depth = int(self.config.get('SCAN', 'max_depth', fallback='10'))

        parcalar = {}
        file_count = 0

        for root, dirs, files in os.walk(directory):
            # Derinlik kontrolü
            current_depth = root[len(directory):].count(os.sep)
            if current_depth >= max_depth:
                dirs[:] = []  # Alt dizinlere inmeyeceğiz
                continue

            # Hariç tutulan klasörleri filtrele
            dirs[:] = [d for d in dirs if d not in exclude_folders]

            if not self.scanning:
                break

            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()

                if file_ext in extensions:
                    file_count += 1
                    part_name = os.path.splitext(file)[0]

                    if part_name not in parcalar:
                        parcalar[part_name] = {
                            'parcaAdi': part_name,
                            'sldprt': [],
                            'slddrw': [],
                            'pdf': []
                        }

                    if file_ext == '.sldprt':
                        parcalar[part_name]['sldprt'].append(file_path)
                    elif file_ext == '.slddrw':
                        parcalar[part_name]['slddrw'].append(file_path)
                    elif file_ext == '.pdf':
                        parcalar[part_name]['pdf'].append(file_path)

                    if file_count % 50 == 0:  # Her 50 dosyada bir güncelle
                        self.ui_queue.put(('progress', f'{file_count} dosya bulundu...'))

        return {
            'parcalar': parcalar,
            'scanMode': 'legacy'
        }

    def build_hierarchy(self, assemblies, parts, root_directory):
        """Montaj ve parça arasındaki hiyerarşik ilişkileri kur"""
        # Dizin yapısına göre ilişki kurma
        for part_name, part_data in parts.items():
            if part_data['sldprt']:
                part_path = part_data['sldprt'][0]
                relative_path = os.path.relpath(part_path, root_directory)
                path_parts = relative_path.split(os.sep)

                # Parça yolunda bir montaj dosyası adı geçiyorsa, onun child'ı kabul et
                for path_part in path_parts[:-1]:  # Son eleman dosya kendisi
                    path_part_clean = os.path.splitext(path_part)[0]
                    if path_part_clean in assemblies:
                        part_data['parent_assembly'] = path_part_clean
                        assemblies[path_part_clean]['children'][part_name] = part_data
                        break

    def calculate_enhanced_statistics(self, assemblies, parts):
        """Gelişmiş istatistikler hesapla"""
        total_assemblies = len(assemblies)
        total_parts = len(parts)

        # Montaj istatistikleri
        assemblies_with_files = len([a for a in assemblies.values() if a['sldasm']])
        assemblies_with_drawings = len([a for a in assemblies.values() if a['slddrw']])
        assemblies_with_children = len([a for a in assemblies.values() if a['children']])

        # Parça istatistikleri
        parts_with_3d = len([p for p in parts.values() if p['sldprt']])
        parts_with_drawings = len([p for p in parts.values() if p['slddrw']])
        parts_with_pdf = len([p for p in parts.values() if p['pdf']])

        # Bağımsız parçalar (herhangi bir montaja bağlı olmayan)
        standalone_parts = len([p for p in parts.values() if p['parent_assembly'] is None])

        # Komple assembly'ler (tüm alt parçaları bulunan)
        complete_assemblies = 0
        for assembly in assemblies.values():
            if assembly['children']:
                complete_assemblies += 1

        return {
            'totalAssemblies': total_assemblies,
            'totalParts': total_parts,
            'assembliesWithFiles': assemblies_with_files,
            'assembliesWithDrawings': assemblies_with_drawings,
            'assembliesWithChildren': assemblies_with_children,
            'partsWith3D': parts_with_3d,
            'partsWithDrawings': parts_with_drawings,
            'partsWithPDF': parts_with_pdf,
            'standaloneParts': standalone_parts,
            'completeAssemblies': complete_assemblies,
            'totalFiles': sum(
                len(a['sldasm']) + len(a['slddrw']) + len(a['pdf']) for a in assemblies.values()
            ) + sum(
                len(p['sldprt']) + len(p['slddrw']) + len(p['pdf']) for p in parts.values()
            )
        }

    def send_scan_results(self, directory, file_data):
        """Tarama sonuçlarını sunucuya gönder"""
        try:
            # Tarama modunu kontrol et
            scan_mode = file_data.get('scanMode', 'legacy')

            if scan_mode == 'enhanced':
                return self.send_enhanced_scan_results(directory, file_data)
            else:
                return self.send_legacy_scan_results(directory, file_data)

        except Exception as e:
            print(f"❌ Tarama sonuçları gönderme hatası: {e}")
            self.ui_queue.put(('status', f'Gönderim hatası: {str(e)}'))
            return None

    def send_enhanced_scan_results(self, directory, scan_data):
        """Gelişmiş tarama sonuçlarını sunucuya gönder"""
        try:
            assemblies = scan_data['assemblies']
            parts = scan_data['parts']
            statistics = scan_data['statistics']

            # Parça listesini oluştur (hem montaj hem de parçaları dahil)
            parca_listesi = []

            # Montajları ekle
            for assembly_name, assembly_data in assemblies.items():
                parca = {
                    'parcaAdi': assembly_name,
                    'type': 'assembly',
                    'sldprt': [],  # Montajların 3D modeli yok
                    'slddrw': assembly_data['slddrw'],
                    'pdf': assembly_data['pdf'],
                    'sldasm': assembly_data['sldasm'],  # Yeni alan
                    'has3D': False,  # Montajların kendisi 3D değil
                    'hasDrawing': len(assembly_data['slddrw']) > 0,
                    'hasPDF': len(assembly_data['pdf']) > 0,
                    'hasAssembly': len(assembly_data['sldasm']) > 0,  # Yeni alan
                    'level': assembly_data['level'],
                    'path': assembly_data['path'],
                    'childrenCount': len(assembly_data['children']),
                    'toplamDosya': len(assembly_data['sldasm']) + len(assembly_data['slddrw']) + len(assembly_data['pdf'])
                }
                parca_listesi.append(parca)

            # Parçaları ekle
            for part_name, part_data in parts.items():
                parca = {
                    'parcaAdi': part_name,
                    'type': 'part',
                    'sldprt': part_data['sldprt'],
                    'slddrw': part_data['slddrw'],
                    'pdf': part_data['pdf'],
                    'sldasm': [],  # Parçaların montaj dosyası yok
                    'has3D': len(part_data['sldprt']) > 0,
                    'hasDrawing': len(part_data['slddrw']) > 0,
                    'hasPDF': len(part_data['pdf']) > 0,
                    'hasAssembly': False,
                    'level': part_data['level'],
                    'path': part_data['path'],
                    'parentAssembly': part_data['parent_assembly'],
                    'toplamDosya': len(part_data['sldprt']) + len(part_data['slddrw']) + len(part_data['pdf'])
                }
                parca_listesi.append(parca)

            # Sunucuya POST et
            server_url = self.config.get('SERVER', 'url', fallback='http://localhost:3000')
            response = requests.post(
                f"{server_url}/api/dizin-tarama/client-result",
                json={
                    'data': {
                        'dizinYolu': directory,
                        'parcaListesi': parca_listesi,
                        'istatistikler': statistics,
                        'scanMode': 'enhanced',
                        'timestamp': datetime.now().isoformat()
                    },
                    'clientVersion': get_version_full(),
                    'scanTime': datetime.now().isoformat(),
                    'scanMode': 'enhanced'
                },
                timeout=30
            )

            if response.status_code == 200:
                return {
                    'success': True,
                    'parcaListesi': parca_listesi,
                    'istatistikler': statistics
                }
            else:
                print(f"❌ Sunucu hatası: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Sunucuya gönderim hatası: {e}")
            return None

    def send_legacy_scan_results(self, directory, file_data):
        """Eski tarama sonuçlarını sunucuya gönder (geriye uyumluluk)"""
        try:
            # Parça listesini hazırla
            parcalar = file_data.get('parcalar', {})
            parca_listesi = []
            for part_name, files in parcalar.items():
                parca = {
                    'parcaAdi': part_name,
                    'sldprt': files['sldprt'],
                    'slddrw': files['slddrw'],
                    'pdf': files['pdf'],
                    'has3D': len(files['sldprt']) > 0,
                    'hasDrawing': len(files['slddrw']) > 0,
                    'hasPDF': len(files['pdf']) > 0,
                    'toplamDosya': len(files['sldprt']) + len(files['slddrw']) + len(files['pdf'])
                }
                parca_listesi.append(parca)

            # İstatistikleri hesapla
            istatistikler = {
                'toplamParca': len(parca_listesi),
                'toplamSLDPRT': sum(len(p['sldprt']) for p in parca_listesi),
                'toplamSLDDRW': sum(len(p['slddrw']) for p in parca_listesi),
                'toplamPDF': sum(len(p['pdf']) for p in parca_listesi),
                'toplamDosya': sum(p['toplamDosya'] for p in parca_listesi),
                'eksikDrawing': len([p for p in parca_listesi if p['has3D'] and not p['hasDrawing']]),
                'eksikPDF': len([p for p in parca_listesi if p['has3D'] and not p['hasPDF']]),
                'tamDosyalar': len([p for p in parca_listesi if p['has3D'] and p['hasDrawing'] and p['hasPDF']])
            }

            # Sunucuya POST et
            payload = {
                'success': True,
                'data': {
                    'dizinYolu': directory,
                    'parcaListesi': sorted(parca_listesi, key=lambda x: x['parcaAdi']),
                    'istatistikler': istatistikler,
                    'taramaZamani': datetime.now().isoformat(),
                    'clientVersion': get_version_full()
                }
            }

            # Eğer API'ye direkt göndermek istersek
            response = requests.post(
                f"{self.server_url}/api/dizin-tarama/client-result",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                self.logger.info("Tarama sonuçları başarıyla sunucuya gönderildi")
                return payload['data']
            else:
                self.logger.error(f"Sunucu hatası: {response.status_code}")
                return payload['data']  # Local olarak da sonuçları döndür

        except Exception as e:
            self.logger.error(f"Sunucuya gönderim hatası: {str(e)}")
            # Hata olsa da local sonuçları döndür
            return payload['data'] if 'payload' in locals() else None

    def update_results(self, data):
        """Sonuçları GUI'de güncelle"""
        self.last_scan_data = data

        # Parça listesini treeview'e ekle
        for parca in data.get('parcaListesi', []):
            durum = 'Tam' if (parca['has3D'] and parca['hasDrawing'] and parca['hasPDF']) else \
                    'Kısmi' if (parca['has3D'] and (parca['hasDrawing'] or parca['hasPDF'])) else 'Eksik'

            if DATABASE_INTEGRATION and self.selection_manager:
                # SelectionManager'a parça bilgisini ekle
                part_data = {
                    'has3D': parca['has3D'],
                    'hasDrawing': parca['hasDrawing'],
                    'hasPDF': parca['hasPDF'],
                    'sldprt_files': parca.get('sldprt', []),
                    'slddrw_files': parca.get('slddrw', []),
                    'pdf_files': parca.get('pdf', []),
                    'durum': durum
                }
                self.selection_manager.set_part_data(parca['parcaAdi'], part_data)

                # Checkbox ile TreeView
                values = (
                    '☐',  # Checkbox - başlangıçta boş
                    parca['parcaAdi'],
                    len(parca['sldprt']),
                    len(parca['slddrw']),
                    len(parca['pdf']),
                    durum,
                    'Yükleniyor...'  # DB durumu
                )
            else:
                values = (
                    parca['parcaAdi'],
                    len(parca['sldprt']),
                    len(parca['slddrw']),
                    len(parca['pdf']),
                    durum
                )

            item_id = self.results_tree.insert('', 'end', values=values)

            # Part name'i item ID ile eşle
            if DATABASE_INTEGRATION:
                if not hasattr(self, 'tree_item_to_part'):
                    self.tree_item_to_part = {}
                self.tree_item_to_part[item_id] = parca['parcaAdi']

        # Selection kontrolleri etkinleştir
        if DATABASE_INTEGRATION:
            self.enable_selection_controls()
            # Database bilgilerini background'da yükle
            self.load_database_info_async()

        # İstatistikleri güncelle
        stats = data.get('istatistikler', {})
        stats_text = f"""Toplam Parça: {stats.get('toplamParca', 0)}
Toplam Dosya: {stats.get('toplamDosya', 0)} (3D: {stats.get('toplamSLDPRT', 0)}, Çizim: {stats.get('toplamSLDDRW', 0)}, PDF: {stats.get('toplamPDF', 0)})
Tam Dosyalar: {stats.get('tamDosyalar', 0)}, Eksik Çizim: {stats.get('eksikDrawing', 0)}, Eksik PDF: {stats.get('eksikPDF', 0)}
Tarama Zamanı: {data.get('taramaZamani', 'Bilinmiyor')}"""

        self.stats_text.config(state='normal')
        self.stats_text.delete(1.0, tk.END)
        self.stats_text.insert(1.0, stats_text)
        self.stats_text.config(state='disabled')

    def scan_complete(self, data):
        """Tarama tamamlandığında çağrılır"""
        self.update_results(data)
        self.reset_scan_ui()

    def reset_scan_ui(self):
        """Tarama UI'sını sıfırla"""
        self.scan_button.config(state="normal")
        self.stop_button.config(state="disabled")
        self.progress_bar.stop()
        self.progress_var.set("Hazır")

    def show_settings(self):
        """Ayarlar penceresini göster"""
        settings_window = tk.Toplevel(self.root)
        settings_window.title("Ayarlar")
        settings_window.geometry("500x400")
        settings_window.transient(self.root)
        settings_window.grab_set()

        notebook = ttk.Notebook(settings_window)
        notebook.pack(fill='both', expand=True, padx=10, pady=10)

        # Sunucu ayarları
        server_frame = ttk.Frame(notebook)
        notebook.add(server_frame, text="Sunucu")

        ttk.Label(server_frame, text="Sunucu URL:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        server_url_entry = ttk.Entry(server_frame, width=40)
        server_url_entry.insert(0, self.config.get('SERVER', 'url', fallback='http://localhost:3000'))
        server_url_entry.grid(row=0, column=1, padx=5, pady=5)

        ttk.Label(server_frame, text="Timeout (saniye):").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        timeout_entry = ttk.Entry(server_frame, width=10)
        timeout_entry.insert(0, self.config.get('SERVER', 'timeout', fallback='30'))
        timeout_entry.grid(row=1, column=1, sticky='w', padx=5, pady=5)

        # Tarama ayarları
        scan_frame = ttk.Frame(notebook)
        notebook.add(scan_frame, text="Tarama")

        ttk.Label(scan_frame, text="Dosya uzantıları (virgülle ayrılmış):").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        extensions_entry = ttk.Entry(scan_frame, width=40)
        extensions_entry.insert(0, self.config.get('SCAN', 'extensions', fallback='.sldprt,.slddrw,.pdf'))
        extensions_entry.grid(row=0, column=1, padx=5, pady=5)

        ttk.Label(scan_frame, text="Hariç tutulacak klasörler:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        exclude_entry = ttk.Entry(scan_frame, width=40)
        exclude_entry.insert(0, self.config.get('SCAN', 'exclude_folders', fallback='IPTAL,iptal,temp,Temp'))
        exclude_entry.grid(row=1, column=1, padx=5, pady=5)

        ttk.Label(scan_frame, text="Maksimum derinlik:").grid(row=2, column=0, sticky='w', padx=5, pady=5)
        depth_entry = ttk.Entry(scan_frame, width=10)
        depth_entry.insert(0, self.config.get('SCAN', 'max_depth', fallback='10'))
        depth_entry.grid(row=2, column=1, sticky='w', padx=5, pady=5)

        # Kaydet butonu
        def save_settings():
            self.config.set('SERVER', 'url', server_url_entry.get())
            self.config.set('SERVER', 'timeout', timeout_entry.get())
            self.config.set('SCAN', 'extensions', extensions_entry.get())
            self.config.set('SCAN', 'exclude_folders', exclude_entry.get())
            self.config.set('SCAN', 'max_depth', depth_entry.get())
            self.save_config()
            settings_window.destroy()
            messagebox.showinfo("Bilgi", "Ayarlar kaydedildi")

        ttk.Button(settings_window, text="Kaydet", command=save_settings).pack(pady=10)

    def show_about(self):
        """Hakkında penceresini göster"""
        about_window = tk.Toplevel(self.root)
        about_window.title("Hakkında")
        about_window.geometry("500x600")
        about_window.transient(self.root)
        about_window.grab_set()
        about_window.resizable(False, False)

        # Ana frame
        main_frame = ttk.Frame(about_window)
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)

        # Logo/İcon (text olarak)
        logo_frame = ttk.Frame(main_frame)
        logo_frame.pack(pady=(0, 20))

        logo_label = ttk.Label(logo_frame, text="📁", font=('Arial', 48))
        logo_label.pack()

        # Uygulama adı
        name_label = ttk.Label(main_frame, text=self.version_info['name'],
                              font=('Arial', 16, 'bold'))
        name_label.pack(pady=(0, 10))

        # Versiyon bilgileri
        version_frame = ttk.Frame(main_frame)
        version_frame.pack(pady=(0, 20))

        ttk.Label(version_frame, text=f"Versiyon: {get_version()}",
                 font=('Arial', 12)).pack()
        ttk.Label(version_frame, text=f"Build: {self.version_info.get('build', 'bilinmiyor')}",
                 font=('Arial', 10), foreground='gray').pack()
        ttk.Label(version_frame, text=f"Çıkış Tarihi: {self.version_info.get('release_date', 'bilinmiyor')}",
                 font=('Arial', 10), foreground='gray').pack()

        # Açıklama
        desc_label = ttk.Label(main_frame, text=self.version_info.get('description', ''),
                              font=('Arial', 10), wraplength=450, justify='center')
        desc_label.pack(pady=(0, 20))

        # Özellikler
        features_frame = ttk.LabelFrame(main_frame, text="Özellikler")
        features_frame.pack(fill='x', pady=(0, 20))

        features = [
            "✓ Otomatik CAD dosya tarama",
            "✓ Parça bazlı gruplandırma",
            "✓ Sunucu entegrasyonu",
            "✓ Windows network drive desteği",
            "✓ Kullanıcı dostu GUI",
            "✓ Esnek yapılandırma"
        ]

        for feature in features:
            ttk.Label(features_frame, text=feature, font=('Arial', 9)).pack(anchor='w', padx=10, pady=2)

        # Sürüm notları
        try:
            from version import get_release_notes
            notes_frame = ttk.LabelFrame(main_frame, text="Son Güncellemeler")
            notes_frame.pack(fill='both', expand=True, pady=(0, 20))

            notes_text = tk.Text(notes_frame, height=8, wrap=tk.WORD, font=('Consolas', 9))
            notes_scrollbar = ttk.Scrollbar(notes_frame, orient=tk.VERTICAL, command=notes_text.yview)
            notes_text.configure(yscrollcommand=notes_scrollbar.set)

            notes_text.pack(side=tk.LEFT, fill='both', expand=True, padx=(5, 0), pady=5)
            notes_scrollbar.pack(side=tk.RIGHT, fill='y', pady=5)

            # Sürüm notlarını ekle
            release_notes = get_release_notes()
            notes_content = '\n'.join(release_notes)
            notes_text.insert(tk.END, notes_content)
            notes_text.config(state='disabled')
        except:
            pass

        # Kapama butonu
        ttk.Button(main_frame, text="Tamam", command=about_window.destroy).pack(pady=(10, 0))

    # v1.2.0 - Yeni seçim sistemi metodları
    def on_tree_click(self, event):
        """TreeView click event handler"""
        if not DATABASE_INTEGRATION or not self.selection_manager:
            return

        region = self.results_tree.identify_region(event.x, event.y)
        if region == "cell":
            # Use identify() method which works in both old and new Tkinter versions
            element = self.results_tree.identify("element", event.x, event.y)
            column = self.results_tree.identify("column", event.x, event.y)
            if column == '#1':  # Checkbox kolonu
                item = self.results_tree.identify_row(event.y)
                if item and item in self.tree_item_to_part:
                    part_name = self.tree_item_to_part[item]
                    # Toggle selection
                    selected = self.selection_manager.toggle_part_selection(part_name)
                    self.update_tree_checkbox(item, selected)

    def on_tree_double_click(self, event):
        """TreeView double click - parça detayını göster"""
        if not DATABASE_INTEGRATION:
            messagebox.showinfo("Bilgi", "Veritabanı entegrasyonu aktif değil")
            return

        try:
            # Seçili item'ı al
            selected_items = self.results_tree.selection()
            if not selected_items:
                return

            item = selected_items[0]
            if item and item in self.tree_item_to_part:
                part_name = self.tree_item_to_part[item]
                self.logger.info(f"Double click detected for part: {part_name}")
                self.show_single_part_detail(part_name)
            else:
                self.logger.warning(f"Double click on unknown item: {item}")

        except Exception as e:
            self.logger.error(f"Double click handler error: {str(e)}")
            messagebox.showerror("Hata", f"Parça detayı açılamadı: {str(e)}")

    def update_tree_checkbox(self, item, selected):
        """TreeView'deki checkbox'ı güncelle"""
        values = list(self.results_tree.item(item, 'values'))
        values[0] = '☑' if selected else '☐'
        self.results_tree.item(item, values=values)

    def enable_selection_controls(self):
        """Seçim kontrollerini etkinleştir"""
        if not DATABASE_INTEGRATION:
            return

        self.select_all_button.config(state="normal")
        self.clear_selection_button.config(state="normal")
        self.select_complete_button.config(state="normal")
        self.select_partial_button.config(state="normal")
        self.show_details_button.config(state="normal")
        self.detail_navigation_button.config(state="normal")
        self.checkboxes_enabled = True

    def disable_selection_controls(self):
        """Seçim kontrollerini devre dışı bırak"""
        if not DATABASE_INTEGRATION:
            return

        self.select_all_button.config(state="disabled")
        self.clear_selection_button.config(state="disabled")
        self.select_complete_button.config(state="disabled")
        self.select_partial_button.config(state="disabled")
        self.show_details_button.config(state="disabled")
        self.detail_navigation_button.config(state="disabled")
        self.checkboxes_enabled = False

    def select_all_parts(self):
        """Tüm parçaları seç"""
        if not self.selection_manager:
            return

        selected_count = self.selection_manager.select_all_parts()
        self.logger.info(f"Tüm parçalar seçildi: {selected_count} parça")

        # TreeView'ı güncelle
        self.update_all_checkboxes()

    def clear_selection(self):
        """Tüm seçimleri kaldır"""
        if not self.selection_manager:
            return

        cleared_count = self.selection_manager.clear_all_selections()
        self.logger.info(f"Tüm seçimler kaldırıldı: {cleared_count} parça")

        # TreeView'ı güncelle
        self.update_all_checkboxes()

    def select_by_status(self, status):
        """Durum bazlı parça seçimi"""
        if not self.selection_manager:
            return

        selected_count = self.selection_manager.select_parts_by_status(status)
        self.logger.info(f"{status} durumundaki parçalar seçildi: {selected_count} parça")

        # TreeView'ı güncelle
        self.update_all_checkboxes()

    def update_all_checkboxes(self):
        """Tüm checkbox'ları güncelle"""
        if not self.selection_manager or not hasattr(self, 'tree_item_to_part'):
            return

        for item, part_name in self.tree_item_to_part.items():
            selected = self.selection_manager.is_part_selected(part_name)
            self.update_tree_checkbox(item, selected)

    def on_selection_changed(self, stats):
        """Seçim değiştiğinde çağrılır"""
        self.selection_stats = stats

        # İstatistik metnini güncelle
        if stats['selected_count'] == 0:
            stats_text = "Seçili parça yok"
        else:
            stats_text = f"Seçili: {stats['selected_count']}/{stats['total_parts']} parça "
            stats_text += f"({stats['selection_rate']:.1%}) - "
            stats_text += f"Tam: {stats['breakdown']['complete']}, "
            stats_text += f"Kısmi: {stats['breakdown']['partial']}, "
            stats_text += f"Eksik: {stats['breakdown']['incomplete']}"

        self.selection_stats_var.set(stats_text)

    def load_database_info_async(self):
        """Database bilgilerini asenkron yükle"""
        if not self.db_client or not self.last_scan_data:
            return

        def load_db_info():
            try:
                # Part listesi
                part_names = [p['parcaAdi'] for p in self.last_scan_data.get('parcaListesi', [])]

                if not part_names:
                    return

                self.ui_queue.put(('status', f'Database bilgileri yükleniyor... ({len(part_names)} parça)'))

                # Batch processing için parçaları 50'şerli gruplara böl
                batch_size = 50
                all_parts_data = []
                total_found = 0

                for i in range(0, len(part_names), batch_size):
                    batch = part_names[i:i + batch_size]
                    batch_num = (i // batch_size) + 1
                    total_batches = (len(part_names) + batch_size - 1) // batch_size

                    self.ui_queue.put(('status', f'Database sorgusu {batch_num}/{total_batches} ({len(batch)} parça)'))

                    response = self.db_client.get_bulk_part_info(batch)

                    if response.get('success'):
                        batch_data = response['data']
                        all_parts_data.extend(batch_data.get('parts', []))
                        total_found += batch_data.get('foundCount', 0)
                    else:
                        error_msg = response.get('error', {}).get('message', 'Bilinmeyen hata')
                        self.logger.error(f"Database bilgi yükleme hatası (batch {batch_num}): {error_msg}")

                        # 500 hatası özel durumu
                        if "500" in error_msg:
                            self.ui_queue.put(('status', f'Sunucu database hatası (batch {batch_num}). Backend loglarını kontrol edin.'))
                        else:
                            self.ui_queue.put(('status', f'Database sorgu hatası (batch {batch_num}): {error_msg}'))

                        # Continue with other batches even if one fails

                # Toplam sonucu hazırla
                combined_response = {
                    'parts': all_parts_data,
                    'foundCount': total_found,
                    'requestedCount': len(part_names)
                }

                if all_parts_data:
                    self.ui_queue.put(('db_info_loaded', combined_response))
                else:
                    error_message = 'Hiç parça bilgisi yüklenemedi.'
                    if "500" in str(response.get('error', {}).get('message', '')):
                        error_message += ' Backend sunucuda database problemi olabilir.'
                    self.ui_queue.put(('db_info_error', {'message': error_message}))

            except Exception as e:
                self.logger.error(f"Database bilgi yükleme exception: {str(e)}")
                self.ui_queue.put(('db_info_error', {'message': str(e)}))

        # Background thread'de çalıştır
        threading.Thread(target=load_db_info, daemon=True).start()

    def show_part_details(self):
        """Seçili parçaların detaylarını göster"""
        if not DATABASE_INTEGRATION:
            messagebox.showinfo("Bilgi", "Veritabanı entegrasyonu aktif değil")
            return

        if not self.selection_manager:
            messagebox.showerror("Hata", "Seçim yöneticisi mevcut değil")
            return

        selected_parts = self.selection_manager.get_selected_parts()
        if not selected_parts:
            messagebox.showwarning("Uyarı", "Lütfen önce parça seçin")
            return

        try:
            validation = self.selection_manager.validate_selection()
            if not validation['valid']:
                messagebox.showerror("Hata", validation['message'])
                return

            # Selected parts data
            selected_data = self.selection_manager.get_selected_parts_data()
            self.logger.info(f"Opening part details for {len(selected_data)} selected parts")

            # Part detail window'u aç
            if self.part_detail_window is None or not hasattr(self.part_detail_window, 'window') or not self.part_detail_window.window.winfo_exists():
                self.part_detail_window = PartDetailWindow(
                    parent=self.root,
                    selected_parts=selected_data,
                    database_client=self.db_client,
                    config={}
                )
                self.logger.info("Created new PartDetailWindow")
            else:
                # Pencere zaten var, öne getir
                self.part_detail_window.window.lift()
                self.part_detail_window.window.focus_set()
                self.logger.info("Focused existing PartDetailWindow")

        except Exception as e:
            self.logger.error(f"Show part details error: {str(e)}")
            messagebox.showerror("Hata", f"Parça detayları açılamadı: {str(e)}")

    def show_single_part_detail(self, part_name):
        """Tek parçanın detayını göster"""
        if not DATABASE_INTEGRATION:
            messagebox.showinfo("Bilgi", "Veritabanı entegrasyonu aktif değil")
            return

        if not self.selection_manager:
            messagebox.showerror("Hata", "Seçim yöneticisi mevcut değil")
            return

        try:
            # Geçici olarak bu parçayı seç
            original_selection = self.selection_manager.get_selected_parts()
            self.selection_manager.clear_all_selections()
            self.selection_manager.set_part_selection(part_name, True)

            # Selected data
            selected_data = self.selection_manager.get_selected_parts_data()
            self.logger.info(f"Opening single part detail for: {part_name}")

            # Detail window aç
            if self.part_detail_window is None or not hasattr(self.part_detail_window, 'window') or not self.part_detail_window.window.winfo_exists():
                self.part_detail_window = PartDetailWindow(
                    parent=self.root,
                    selected_parts=selected_data,
                    database_client=self.db_client,
                    config={}
                )
                self.logger.info("Created new PartDetailWindow for single part")
            else:
                # Pencere zaten var, öne getir
                self.part_detail_window.window.lift()
                self.part_detail_window.window.focus_set()
                self.logger.info("Focused existing PartDetailWindow for single part")

            # Orijinal seçimi geri yükle
            self.selection_manager.clear_all_selections()
            for original_part in original_selection:
                self.selection_manager.set_part_selection(original_part, True)

        except Exception as e:
            self.logger.error(f"Show single part detail error: {str(e)}")
            messagebox.showerror("Hata", f"Parça detayı açılamadı: {str(e)}")

    def navigate_to_detail_view(self):
        """Seçilen parçaların detay görüntülemesine yönlendir"""
        if not DATABASE_INTEGRATION:
            messagebox.showinfo("Bilgi", "Veritabanı entegrasyonu aktif değil")
            return

        if not self.selection_manager:
            messagebox.showerror("Hata", "Seçim sistemi aktif değil")
            return

        try:
            selected_parts = self.selection_manager.get_selected_parts()
            if not selected_parts:
                messagebox.showwarning("Uyarı", "Lütfen önce parça seçin")
                return

            validation = self.selection_manager.validate_selection()
            if not validation['valid']:
                messagebox.showerror("Hata", validation['message'])
                return

            # Selected parts data
            selected_data = self.selection_manager.get_selected_parts_data()
            self.logger.info(f"Navigate to detail view for {len(selected_data)} selected parts")

            # Detay penceresini aç veya öne getir
            if self.part_detail_window is None or not hasattr(self.part_detail_window, 'window') or not self.part_detail_window.window.winfo_exists():
                self.part_detail_window = PartDetailWindow(
                    parent=self.root,
                    selected_parts=selected_data,
                    database_client=self.db_client,
                    config={}
                )
                self.logger.info("Created new PartDetailWindow from navigation")
            else:
                # Pencere zaten var, öne getir
                self.part_detail_window.window.lift()
                self.part_detail_window.window.focus_set()
                self.logger.info("Focused existing PartDetailWindow from navigation")

        except Exception as e:
            self.logger.error(f"Navigate to detail view error: {str(e)}")
            messagebox.showerror("Hata", f"Detay sayfası açılamadı: {str(e)}")
            return

        # Kullanıcıyı bilgilendir
        self.logger.info(f"Detay sayfası açıldı: {len(selected_parts)} parça")
        messagebox.showinfo("Detay Sayfası",
                           f"Seçilen {len(selected_parts)} parçanın detay kartları açıldı.\n\n"
                           f"Her parçanın teknik bilgileri, dosya konumları ve "
                           f"database durumu detaylı olarak görüntülenmektedir.")

    def update_database_info(self, db_data):
        """Database bilgilerini TreeView'de güncelle"""
        if not hasattr(self, 'tree_item_to_part') or not hasattr(self, 'results_tree'):
            return

        parts_info = {part['partName']: part for part in db_data.get('parts', [])}

        for item, part_name in self.tree_item_to_part.items():
            try:
                # Check if item still exists in TreeView
                if not self.results_tree.exists(item):
                    continue

                part_info = parts_info.get(part_name, {})

                # DB durumunu güncelle
                values = list(self.results_tree.item(item, 'values'))
                if len(values) >= 7:  # DB Durumu kolonu var mı?
                    if part_info.get('found', False):
                        # Database'de var
                        db_status = "✓ Mevcut"

                        # Eksik alanları kontrol et
                        missing_fields = part_info.get('missingFields', [])
                        if missing_fields:
                            # missingFields dict listesi, sadece description'ları al
                            field_descriptions = []
                            for field in missing_fields:
                                if isinstance(field, dict) and 'description' in field:
                                    field_descriptions.append(field['description'])
                                elif isinstance(field, str):
                                    field_descriptions.append(field)
                            if field_descriptions:
                                db_status += f" (Eksik: {', '.join(field_descriptions)})"
                    else:
                        # Database'de yok
                        db_status = "✗ Kayıtsız"

                    values[6] = db_status
                    self.results_tree.item(item, values=values)
            except _tkinter.TclError:
                # Item no longer exists, skip it
                continue
            except Exception as e:
                self.logger.error(f"TreeView item güncelleme hatası ({part_name}): {e}")
                continue

        # Status güncelle
        found_count = db_data.get('foundCount', 0)
        total_count = db_data.get('requestedCount', 0)
        self.ui_queue.put(('status', f'Database bilgileri yüklendi: {found_count}/{total_count} parça bulundu'))

    def handle_database_error(self, error_data):
        """Database hata durumunu handle et"""
        error_message = error_data.get('message', 'Bilinmeyen database hatası')
        self.logger.error(f"Database hatası: {error_message}")

        # TreeView'deki DB durumunu hata olarak güncelle
        if hasattr(self, 'tree_item_to_part') and hasattr(self, 'results_tree'):
            try:
                for item, part_name in self.tree_item_to_part.items():
                    try:
                        # Check if item still exists in TreeView
                        if self.results_tree.exists(item):
                            values = list(self.results_tree.item(item, 'values'))
                            if len(values) >= 7:
                                values[6] = "⚠ Hata"
                                self.results_tree.item(item, values=values)
                    except _tkinter.TclError:
                        # Item no longer exists, skip it
                        continue
            except Exception as e:
                self.logger.error(f"TreeView güncelleme hatası: {e}")

        self.ui_queue.put(('status', f'Database hatası: {error_message}'))

    def run(self):
        """Uygulamayı çalıştır"""
        self.root.mainloop()

def main():
    """Ana fonksiyon"""
    try:
        print("Dizin Tarama Client baslatiliyor...")

        # Windows'ta console penceresi gizle (opsiyonel) - hata ayıklama için devre dışı
        # if sys.platform == "win32":
        #     try:
        #         import ctypes
        #         ctypes.windll.kernel32.FreeConsole()
        #     except:
        #         pass

        app = DizinTaramaClient()
        print("GUI baslatiliyor...")
        app.run()

    except Exception as e:
        error_msg = f"Program bir hatayla kapandi. Detaylar icin dizin_tarama.log dosyasini kontrol edin.\nHata: {str(e)}"
        print(error_msg)

        # Log dosyasına hata yaz
        try:
            logging.basicConfig(
                level=logging.ERROR,
                format='%(asctime)s - %(levelname)s - %(message)s',
                handlers=[
                    logging.FileHandler('dizin_tarama.log', encoding='utf-8', mode='a')
                ]
            )
            logger = logging.getLogger(__name__)
            logger.error(f"Program crash: {str(e)}", exc_info=True)
        except:
            pass

        # Windows'ta messagebox göster
        try:
            import tkinter as tk
            from tkinter import messagebox
            root = tk.Tk()
            root.withdraw()  # Ana pencereyi gizle
            messagebox.showerror("Hata", error_msg)
        except:
            pass

        sys.exit(1)

if __name__ == "__main__":
    main()