"""
Ana pencere GUI modülü
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import time
from pathlib import Path
from typing import Optional

from core.solidworks_api import SolidWorksAPI
from core.file_scanner import FileScanner

class MainWindow:
    """Ana pencere sınıfı"""
    
    def __init__(self, config, logger, server_client):
        self.config = config
        self.logger = logger
        self.server_client = server_client
        
        # Ana pencere
        self.root = tk.Tk()
        self.root.title("CAD Import Client - ÜRTM Takip Sistemi")
        
        # Pencere boyutu
        width, height = self.config.window_size
        self.root.geometry(f"{width}x{height}")
        self.root.minsize(800, 600)
        
        # Core modüller
        self.solidworks_api = SolidWorksAPI(config, logger)
        self.file_scanner = FileScanner(config, logger)
        
        # UI durumu
        self.scanned_files = []
        self.selected_directory = None
        self.current_job = None
        self.is_processing = False
        
        # GUI bileşenlerini oluştur
        self.create_widgets()
        self.setup_server_callbacks()
        
        # İlk bağlantı
        self.connect_to_server()
        
    def create_widgets(self):
        """GUI bileşenlerini oluştur"""
        
        # Ana çerçeve
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Sütun ve satır ağırlıkları
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # 1. Server Durumu
        self.create_server_status_section(main_frame, 0)
        
        # 2. Klasör Seçimi
        self.create_folder_section(main_frame, 1)
        
        # 3. Dosya Listesi
        self.create_file_list_section(main_frame, 2)
        
        # 4. İşlem Butonları
        self.create_action_buttons_section(main_frame, 3)
        
        # 5. İlerleme ve Durum
        self.create_progress_section(main_frame, 4)
        
        # 6. Log Alanı
        self.create_log_section(main_frame, 5)
        
    def create_server_status_section(self, parent, row):
        """Server durumu bölümü"""
        frame = ttk.LabelFrame(parent, text="Server Bağlantısı", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        frame.columnconfigure(1, weight=1)
        
        # Server URL
        ttk.Label(frame, text="Server:").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        self.server_url_label = ttk.Label(frame, text=self.config.server_url, foreground="blue")
        self.server_url_label.grid(row=0, column=1, sticky=tk.W)
        
        # Bağlantı durumu
        ttk.Label(frame, text="Durum:").grid(row=0, column=2, sticky=tk.W, padx=(20, 5))
        self.connection_status_label = ttk.Label(frame, text="Bağlanıyor...", foreground="orange")
        self.connection_status_label.grid(row=0, column=3, sticky=tk.W)
        
        # Client ID
        ttk.Label(frame, text="Client ID:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5))
        self.client_id_label = ttk.Label(frame, text=self.server_client.client_id, font=("Courier", 8))
        self.client_id_label.grid(row=1, column=1, columnspan=3, sticky=tk.W)
        
    def create_folder_section(self, parent, row):
        """Klasör seçimi bölümü"""
        frame = ttk.LabelFrame(parent, text="Klasör Seçimi", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        frame.columnconfigure(1, weight=1)
        
        # Klasör yolu
        ttk.Label(frame, text="Klasör:").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        self.folder_path_var = tk.StringVar(value="Klasör seçilmedi")
        self.folder_path_label = ttk.Label(frame, textvariable=self.folder_path_var, relief="sunken")
        self.folder_path_label.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 5))
        
        # Klasör seç butonu
        self.select_folder_btn = ttk.Button(frame, text="Klasör Seç", command=self.select_folder)
        self.select_folder_btn.grid(row=0, column=2, padx=(5, 0))
        
        # Tarama butonu
        self.scan_btn = ttk.Button(frame, text="Tara", command=self.scan_folder, state="disabled")
        self.scan_btn.grid(row=0, column=3, padx=(5, 0))
        
        # Desteklenen formatlar
        formats = ", ".join(self.config.supported_extensions)
        ttk.Label(frame, text=f"Desteklenen formatlar: {formats}", font=("", 8), foreground="gray")
        ttk.Label(frame, text=f"Desteklenen formatlar: {formats}", font=("", 8), foreground="gray").grid(row=1, column=0, columnspan=4, sticky=tk.W, pady=(5, 0))
        
    def create_file_list_section(self, parent, row):
        """Dosya listesi bölümü"""
        frame = ttk.LabelFrame(parent, text="Bulunan Dosyalar", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(0, weight=1)
        parent.rowconfigure(row, weight=1)
        
        # Treeview
        columns = ("dosya", "klasor", "boyut", "durum")
        self.file_tree = ttk.Treeview(frame, columns=columns, show="tree headings", height=15)
        
        # Kolon başlıkları
        self.file_tree.heading("#0", text="Dosya Adı")
        self.file_tree.heading("dosya", text="Uzantı")
        self.file_tree.heading("klasor", text="Klasör")
        self.file_tree.heading("boyut", text="Boyut")
        self.file_tree.heading("durum", text="Durum")
        
        # Kolon genişlikleri
        self.file_tree.column("#0", width=300)
        self.file_tree.column("dosya", width=80)
        self.file_tree.column("klasor", width=200)
        self.file_tree.column("boyut", width=100)
        self.file_tree.column("durum", width=120)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.file_tree.yview)
        self.file_tree.configure(yscrollcommand=scrollbar.set)
        
        # Grid
        self.file_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # İstatistik etiketi
        self.stats_label = ttk.Label(frame, text="Dosya seçilmedi", font=("", 8))
        self.stats_label.grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(5, 0))
        
    def create_action_buttons_section(self, parent, row):
        """İşlem butonları bölümü"""
        frame = ttk.LabelFrame(parent, text="İşlemler", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # SolidWorks bağlantı durumu
        self.sw_status_label = ttk.Label(frame, text="SolidWorks: Bağlantı bekleniyor", foreground="orange")
        self.sw_status_label.grid(row=0, column=0, columnspan=4, sticky=tk.W, pady=(0, 5))
        
        # Butonlar
        self.connect_sw_btn = ttk.Button(frame, text="SolidWorks'e Bağlan", command=self.connect_solidworks)
        self.connect_sw_btn.grid(row=1, column=0, padx=(0, 5))
        
        self.check_parts_btn = ttk.Button(frame, text="Parça Kontrolü", command=self.check_parts, state="disabled")
        self.check_parts_btn.grid(row=1, column=1, padx=5)
        
        self.import_missing_btn = ttk.Button(frame, text="Eksikleri İmport Et", command=self.import_missing_parts, state="disabled")
        self.import_missing_btn.grid(row=1, column=2, padx=5)
        
        self.stop_btn = ttk.Button(frame, text="Durdur", command=self.stop_processing, state="disabled")
        self.stop_btn.grid(row=1, column=3, padx=(5, 0))
        
    def create_progress_section(self, parent, row):
        """İlerleme bölümü"""
        frame = ttk.LabelFrame(parent, text="İlerleme", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        frame.columnconfigure(0, weight=1)
        
        # İlerleme çubuğu
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(frame, variable=self.progress_var, maximum=100)
        self.progress_bar.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 5))
        
        # Durum etiketi
        self.status_var = tk.StringVar(value="Hazır")
        self.status_label = ttk.Label(frame, textvariable=self.status_var)
        self.status_label.grid(row=1, column=0, sticky=tk.W)
        
    def create_log_section(self, parent, row):
        """Log bölümü"""
        frame = ttk.LabelFrame(parent, text="İşlem Kayıtları", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(0, weight=1)
        
        # Text widget
        self.log_text = tk.Text(frame, height=8, wrap=tk.WORD)
        log_scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        
        # Grid
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        log_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Temizle butonu
        clear_log_btn = ttk.Button(frame, text="Temizle", command=self.clear_log)
        clear_log_btn.grid(row=1, column=0, sticky=tk.W, pady=(5, 0))
        
    def setup_server_callbacks(self):
        """Server event callback'lerini kur"""
        self.server_client.on('client_registered', self.on_client_registered)
        self.server_client.on('start_job_command', self.on_start_job_command)
        self.server_client.on('stop_job_command', self.on_stop_job_command)
        
    def connect_to_server(self):
        """Server'a bağlan"""
        def connect_worker():
            success = self.server_client.connect_to_server()
            self.root.after(0, lambda: self.update_connection_status(success))
            
        thread = threading.Thread(target=connect_worker, daemon=True)
        thread.start()
        
    def update_connection_status(self, connected):
        """Bağlantı durumunu güncelle"""
        if connected:
            self.connection_status_label.config(text="Bağlı", foreground="green")
            self.log_message("Server bağlantısı kuruldu")
        else:
            self.connection_status_label.config(text="Bağlantı Hatası", foreground="red")
            self.log_message("Server bağlantısı kurulamadı")
            
    def on_client_registered(self, data):
        """Client kayıt callback'i"""
        self.root.after(0, lambda: self.log_message(f"Client kaydı başarılı: {data.get('message', '')}"))
        
    def on_start_job_command(self, data):
        """İş başlatma komutu callback'i"""
        self.root.after(0, lambda: self.log_message(f"Web arayüzünden iş başlatma komutu alındı"))
        
    def on_stop_job_command(self, data):
        """İş durdurma komutu callback'i"""
        self.root.after(0, lambda: self.stop_processing())
        
    def select_folder(self):
        """Klasör seç"""
        folder = filedialog.askdirectory(title="CAD Dosyalarının Bulunduğu Klasörü Seçin")
        if folder:
            self.selected_directory = Path(folder)
            self.folder_path_var.set(str(self.selected_directory))
            self.scan_btn.config(state="normal")
            self.log_message(f"Klasör seçildi: {folder}")
            
    def scan_folder(self):
        """Klasörü tara"""
        if not self.selected_directory:
            return
            
        def progress_callback(progress, message):
            self.root.after(0, lambda: self.update_progress(progress, message))
            
        def scan_worker():
            try:
                self.scanned_files = self.file_scanner.scan_directory(
                    self.selected_directory, 
                    progress_callback
                )
                self.root.after(0, lambda: self.update_file_list())
            except Exception as e:
                self.root.after(0, lambda: self.log_message(f"Tarama hatası: {str(e)}"))
            finally:
                self.root.after(0, lambda: self.update_progress(0, "Tarama tamamlandı"))
                
        thread = threading.Thread(target=scan_worker, daemon=True)
        thread.start()
        
        self.log_message("Klasör taranıyor...")
        
    def update_file_list(self):
        """Dosya listesini güncelle"""
        # Mevcut öğeleri temizle
        for item in self.file_tree.get_children():
            self.file_tree.delete(item)
            
        # Dosyaları ekle
        for file_info in self.scanned_files:
            file_name = file_info['file_name']
            extension = file_info['extension']
            folder = file_info['parent_dir']
            size = self.format_file_size(file_info['file_size'])
            status = "Yeni"
            
            self.file_tree.insert("", "end", text=file_name, values=(extension, folder, size, status))
            
        # İstatistikleri güncelle
        stats = self.file_scanner.get_scan_statistics(self.scanned_files)
        stats_text = f"Toplam: {stats['total_files']} dosya, {self.format_file_size(stats['total_size'])}"
        self.stats_label.config(text=stats_text)
        
        # Butonları etkinleştir
        if self.scanned_files:
            self.check_parts_btn.config(state="normal")
            
        self.log_message(f"Tarama tamamlandı: {len(self.scanned_files)} dosya bulundu")
        
    def connect_solidworks(self):
        """SolidWorks'e bağlan"""
        def connect_worker():
            success = self.solidworks_api.connect()
            self.root.after(0, lambda: self.update_solidworks_status(success))
            
        thread = threading.Thread(target=connect_worker, daemon=True)
        thread.start()
        self.sw_status_label.config(text="SolidWorks: Bağlanıyor...", foreground="orange")
        
    def update_solidworks_status(self, connected):
        """SolidWorks durumunu güncelle"""
        if connected:
            self.sw_status_label.config(text="SolidWorks: Bağlı", foreground="green")
            self.connect_sw_btn.config(text="Bağlantıyı Kes", command=self.disconnect_solidworks)
            self.log_message("SolidWorks bağlantısı kuruldu")
        else:
            self.sw_status_label.config(text="SolidWorks: Bağlantı Hatası", foreground="red")
            self.log_message("SolidWorks bağlantısı kurulamadı")
            
    def disconnect_solidworks(self):
        """SolidWorks bağlantısını kes"""
        def disconnect_worker():
            self.solidworks_api.disconnect()
            self.root.after(0, lambda: self.update_solidworks_disconnected())
            
        thread = threading.Thread(target=disconnect_worker, daemon=True)
        thread.start()
        
    def update_solidworks_disconnected(self):
        """SolidWorks bağlantısı kesildi"""
        self.sw_status_label.config(text="SolidWorks: Bağlantı Kesildi", foreground="gray")
        self.connect_sw_btn.config(text="SolidWorks'e Bağlan", command=self.connect_solidworks)
        self.log_message("SolidWorks bağlantısı kesildi")
        
    def check_parts(self):
        """Parça kontrolü yap"""
        if not self.scanned_files:
            return
            
        def check_worker():
            try:
                part_codes = [f['file_name'] for f in self.scanned_files]
                result = self.server_client.check_parts(part_codes)
                
                if result:
                    self.root.after(0, lambda: self.update_part_status(result))
                else:
                    self.root.after(0, lambda: self.log_message("Parça kontrolü başarısız"))
                    
            except Exception as e:
                self.root.after(0, lambda: self.log_message(f"Parça kontrolü hatası: {str(e)}"))
                
        thread = threading.Thread(target=check_worker, daemon=True)
        thread.start()
        self.log_message("Parça kontrolü yapılıyor...")
        
    def update_part_status(self, result):
        """Parça durumlarını güncelle"""
        existing_parts = set(result.get('existing_parts', []))
        missing_parts = set(result.get('missing_parts', []))
        
        # Treeview'daki durumları güncelle
        for item in self.file_tree.get_children():
            file_name = self.file_tree.item(item)['text']
            
            if file_name in existing_parts:
                self.file_tree.set(item, 'durum', 'Mevcut')
            elif file_name in missing_parts:
                self.file_tree.set(item, 'durum', 'Eksik')
                
        # İmport butonunu etkinleştir
        if missing_parts:
            self.import_missing_btn.config(state="normal")
            
        self.log_message(f"Parça kontrolü tamamlandı: {len(existing_parts)} mevcut, {len(missing_parts)} eksik")
        
    def import_missing_parts(self):
        """Eksik parçaları import et"""
        if not self.solidworks_api.is_available():
            messagebox.showerror("Hata", "SolidWorks bağlantısı gerekli")
            return
            
        # Eksik parçaları bul
        missing_files = []
        for i, item in enumerate(self.file_tree.get_children()):
            status = self.file_tree.set(item, 'durum')
            if status == 'Eksik':
                missing_files.append(self.scanned_files[i])
                
        if not missing_files:
            messagebox.showinfo("Bilgi", "İmport edilecek eksik parça bulunamadı")
            return
            
        def import_worker():
            try:
                # İş başlat
                job_result = self.server_client.start_job(
                    f"CAD Import - {time.strftime('%Y-%m-%d %H:%M:%S')}",
                    len(missing_files)
                )
                
                if not job_result:
                    self.root.after(0, lambda: self.log_message("İş başlatılamadı"))
                    return
                    
                job_id = job_result['job']['id']
                self.current_job = job_id
                
                self.root.after(0, lambda: self.log_message(f"İmport işi başlatıldı (ID: {job_id})"))
                
                # Dosyaları işle
                success_count = 0
                fail_count = 0
                
                for i, file_info in enumerate(missing_files):
                    if not self.is_processing:
                        break
                        
                    try:
                        file_path = Path(file_info['full_path'])
                        
                        # İlerleme güncelle
                        progress = (i / len(missing_files)) * 100
                        message = f"İşleniyor: {file_path.name}"
                        self.root.after(0, lambda: self.update_progress(progress, message))
                        
                        # Server'a ilerleme gönder
                        self.server_client.emit_progress(job_id, progress, message)
                        
                        # Thumbnail oluştur
                        thumbnail_path = self.config.temp_directory / f"{file_path.stem}_thumb.png"
                        
                        if self.solidworks_api.generate_thumbnail(file_path, thumbnail_path):
                            # Server'a upload et
                            part_data = {
                                'part_code': file_info['file_name'],
                                'part_name': file_info['file_name'],
                                'file_path': str(file_path),
                                'file_hash': file_info.get('hash', '')
                            }
                            
                            upload_result = self.server_client.upload_part(part_data, thumbnail_path)
                            
                            if upload_result and upload_result.get('success'):
                                success_count += 1
                                self.server_client.emit_file_processed(str(file_path), 'success', str(thumbnail_path))
                                self.root.after(0, lambda: self.update_file_status(i, 'İmport Edildi'))
                            else:
                                fail_count += 1
                                error = upload_result.get('error', 'Upload hatası') if upload_result else 'Upload başarısız'
                                self.server_client.emit_file_processed(str(file_path), 'failed', None, error)
                                self.root.after(0, lambda: self.update_file_status(i, 'Hata'))
                        else:
                            fail_count += 1
                            self.server_client.emit_file_processed(str(file_path), 'failed', None, 'Thumbnail oluşturulamadı')
                            self.root.after(0, lambda: self.update_file_status(i, 'Thumbnail Hatası'))
                            
                        # İlerleme güncelle
                        self.server_client.update_job_progress(job_id, success_count, fail_count)
                        
                    except Exception as e:
                        fail_count += 1
                        error_msg = str(e)
                        self.server_client.emit_file_processed(str(file_path), 'failed', None, error_msg)
                        self.root.after(0, lambda: self.log_message(f"Dosya işleme hatası: {error_msg}"))
                        
                # İşi bitir
                final_state = 'completed' if self.is_processing else 'canceled'
                self.server_client.finish_job(job_id, final_state)
                
                # Final mesaj
                final_message = f"İmport tamamlandı: {success_count} başarılı, {fail_count} başarısız"
                self.root.after(0, lambda: self.update_progress(100, final_message))
                self.root.after(0, lambda: self.log_message(final_message))
                
            except Exception as e:
                self.root.after(0, lambda: self.log_message(f"İmport hatası: {str(e)}"))
            finally:
                self.root.after(0, lambda: self.import_finished())
                
        # UI'ı güncelle
        self.is_processing = True
        self.import_missing_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        
        # Worker thread'i başlat
        thread = threading.Thread(target=import_worker, daemon=True)
        thread.start()
        
    def update_file_status(self, file_index, status):
        """Dosya durumunu güncelle"""
        items = list(self.file_tree.get_children())
        if file_index < len(items):
            self.file_tree.set(items[file_index], 'durum', status)
            
    def stop_processing(self):
        """İşlemeyi durdur"""
        self.is_processing = False
        self.log_message("İşlem durduruluyor...")
        
    def import_finished(self):
        """İmport işlemi bitti"""
        self.is_processing = False
        self.current_job = None
        self.import_missing_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        
    def update_progress(self, progress, message):
        """İlerlemeyi güncelle"""
        self.progress_var.set(progress)
        self.status_var.set(message)
        
    def format_file_size(self, size_bytes):
        """Dosya boyutunu formatla"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024**2:
            return f"{size_bytes/1024:.1f} KB"
        elif size_bytes < 1024**3:
            return f"{size_bytes/(1024**2):.1f} MB"
        else:
            return f"{size_bytes/(1024**3):.1f} GB"
            
    def log_message(self, message):
        """Log mesajı ekle"""
        timestamp = time.strftime("%H:%M:%S")
        log_line = f"[{timestamp}] {message}\n"
        
        self.log_text.insert(tk.END, log_line)
        self.log_text.see(tk.END)
        
        # Logger'a da yaz
        self.logger.info(message)
        
    def clear_log(self):
        """Log'u temizle"""
        self.log_text.delete(1.0, tk.END)
        
    def run(self):
        """Ana döngüyü başlat"""
        try:
            # Pencereyi merkeze al
            self.root.update_idletasks()
            width = self.root.winfo_width()
            height = self.root.winfo_height()
            x = (self.root.winfo_screenwidth() // 2) - (width // 2)
            y = (self.root.winfo_screenheight() // 2) - (height // 2)
            self.root.geometry(f"{width}x{height}+{x}+{y}")
            
            # Ana döngü
            self.root.mainloop()
            
        except Exception as e:
            self.logger.error(f"GUI hatası: {str(e)}")
            messagebox.showerror("GUI Hatası", f"Arayüz hatası: {str(e)}")
        finally:
            # Temizlik
            self.cleanup()
            
    def cleanup(self):
        """Temizlik işlemleri"""
        try:
            self.is_processing = False
            if self.solidworks_api:
                self.solidworks_api.disconnect()
            if self.server_client:
                self.server_client.disconnect()
        except Exception as e:
            self.logger.error(f"Cleanup hatası: {str(e)}")