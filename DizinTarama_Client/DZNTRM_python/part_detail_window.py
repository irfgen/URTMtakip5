#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Dizin Tarama Client - Part Detail Window Module
v1.2.0 - Parça detay görünümü penceresi
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import queue
import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
import os
import subprocess
import platform

# PIL/Pillow import kontrolü
PIL_AVAILABLE = False
try:
    from PIL import Image, ImageTk, UnidentifiedImageError
    PIL_AVAILABLE = True
    print("✅ PIL/Pillow available for image processing")
except ImportError as e:
    print(f"⚠️ PIL/Pillow not available: {e}")
    print("⚠️ Image features will be disabled")

import requests
from io import BytesIO


class PartDetailWindow:
    """
    Seçili parçalar için detay görünüm penceresi
    """

    def __init__(self, parent: tk.Tk, selected_parts: List[Dict], database_client, config: Dict = None):
        """
        PartDetailWindow başlatıcısı

        Args:
            parent: Ana pencere
            selected_parts: Seçili parçalar listesi
            database_client: DatabaseClient instance
            config: Yapılandırma sözlüğü
        """
        self.parent = parent
        self.selected_parts = selected_parts.copy()
        self.database_client = database_client
        self.config = config or {}

        # UI queue for thread-safe updates
        self.ui_queue = queue.Queue()

        # Part detail data
        self.part_details = {}
        self.loading_complete = False

        # Image cache
        self.image_cache = {}
        self.loading_images = set()

        # Image label tracking - CRITICAL: Early initialization
        self.card_image_labels = {}

        # Logger
        self.logger = logging.getLogger(f'{__name__}.PartDetailWindow')
        self.logger.setLevel(logging.DEBUG)

        # Server URL for image paths
        self.server_url = self.database_client.base_url if hasattr(self.database_client, 'base_url') else 'http://localhost:3000'

        # Pencere oluştur
        self.create_window()

        # Debug: Save button'ın varlığını kontrol et
        if hasattr(self, 'save_button'):
            print(f"✅ Save button exists in create_window: {self.save_button}")
            print(f"✅ Save button state: {self.save_button['state']}")
        else:
            print("❌ Save button not found after create_window!")

        # Part bilgilerini yükle
        self.fetch_part_details()

        # UI update loop başlat
        self.process_ui_updates()

    def get_image_url(self, path: str) -> Optional[str]:
        """
        Server relative path'i tam URL'e çevir

        Args:
            path: Server relative path (örn: /uploads/foto.png)

        Returns:
            Full URL or None if path is invalid
        """
        if not path:
            return None

        # Zaten full URL ise olduğu gibi döndür
        if path.startswith('http://') or path.startswith('https://'):
            return path

        # Server relative path'i full URL'e çevir
        if path.startswith('/'):
            return f"{self.server_url}{path}"
        else:
            return f"{self.server_url}/{path}"

    def load_image_from_url(self, url: str, size: tuple = (200, 200), image_label=None) -> Optional['ImageTk.PhotoImage']:
        """
        URL'den resim yükle ve boyutlandır

        Args:
            url: Resim URL'i
            size: Hedef boyut (width, height)
            image_label: Güncellenecek label widget (varsa)

        Returns:
            PhotoImage objesi veya None
        """
        if not PIL_AVAILABLE:
            self.logger.warning("PIL not available - cannot load images")
            return None

        if not url:
            self.logger.warning("Empty URL provided")
            return None

        if url in self.loading_images:
            self.logger.debug(f"Image already loading: {url}")
            return None

        # Cache'de var mı kontrol et
        if url in self.image_cache:
            self.logger.debug(f"Image found in cache: {url}")
            cached_image = self.image_cache[url]
            # Eğer image_label verildiyse, hemen güncelle
            if image_label:
                try:
                    image_label.config(image=cached_image, text="")
                    image_label.image = cached_image
                except Exception as e:
                    self.logger.error(f"Cache image display error: {str(e)}")
            return cached_image

        self.loading_images.add(url)
        self.logger.info(f"Starting image load: {url}")

        # image_label'ı tracking için sakla
        if image_label and url not in self.card_image_labels:
            self.card_image_labels[url] = []
        if image_label and image_label not in self.card_image_labels.get(url, []):
            self.card_image_labels[url].append(image_label)

        def load_in_background():
            try:
                # URL'den resim indir
                self.logger.debug(f"Downloading image from: {url}")
                response = requests.get(url, timeout=15, headers={'User-Agent': 'URTM-Client/1.2'})

                if response.status_code == 200:
                    self.logger.debug(f"Image downloaded successfully: {len(response.content)} bytes")

                    # Resmi işle
                    image = Image.open(BytesIO(response.content))

                    # Boyutlandır ve koru
                    original_size = image.size
                    image.thumbnail(size, Image.Resampling.LANCZOS)
                    self.logger.debug(f"Image resized from {original_size} to {image.size}")

                    # PIL'den Tkinter'e çevir
                    photo_image = ImageTk.PhotoImage(image)

                    # Cache'e ekle
                    self.image_cache[url] = photo_image

                    # UI'yı güncelle
                    self.ui_queue.put(('image_loaded', url, photo_image))
                    self.logger.info(f"Image loaded successfully: {url}")
                else:
                    self.logger.warning(f"HTTP error {response.status_code} for {url}")

            except requests.RequestException as e:
                self.logger.warning(f"Request error for {url}: {str(e)}")
            except UnidentifiedImageError as e:
                self.logger.warning(f"Invalid image format for {url}: {str(e)}")
            except Exception as e:
                self.logger.error(f"Unexpected error loading {url}: {str(e)}")
            finally:
                self.loading_images.discard(url)

        # Background thread'de yükle
        thread = threading.Thread(target=load_in_background, daemon=True)
        thread.start()

        return None

    def create_image_frame(self, parent: ttk.Frame, title: str, image_url: str, fallback_text: str) -> ttk.Frame:
        """
        Görsel için frame oluştur

        Args:
            parent: Ana frame
            title: Başlık
            image_url: Resim URL'i
            fallback_text: Resim yoksa gösterilecek metin

        Returns:
            ttk.Frame: Görsel frame'i
        """
        image_frame = ttk.Frame(parent)

        # Başlık
        title_label = ttk.Label(image_frame, text=title, font=('Arial', 9, 'bold'), name="title_label")
        title_label.pack(pady=(0, 5))

        # Resim için placeholder (her zaman oluştur)
        # ttk.Label height parametresini desteklemediği için Frame kullanıyoruz
        placeholder_frame = ttk.Frame(image_frame, width=180, height=120)
        placeholder_frame.pack(pady=5)
        placeholder_frame.pack_propagate(False)

        image_label = ttk.Label(placeholder_frame, text="⏳ Yükleniyor...", foreground='gray', name="image_label")
        image_label.place(relx=0.5, rely=0.5, anchor='center')

        # Resmi yükleme butonu ve URL gösterimi
        controls_frame = ttk.Frame(image_frame)
        controls_frame.pack(pady=(5, 0))

        # URL gösterimi
        url_text = image_url.split('/')[-1] if '/' in image_url else image_url[:30]
        url_label = ttk.Label(controls_frame, text=f"📎 {url_text}", font=('Arial', 8), foreground='blue')
        url_label.pack()

        # Resmi doğrudan tarayıcıda aç butonu
        def open_image_in_browser():
            try:
                import webbrowser
                webbrowser.open(image_url)
            except Exception as e:
                messagebox.showerror("Hata", f"Resim açılamadı: {str(e)}")

        open_button = ttk.Button(controls_frame, text="🌐 Tarayıcıda Aç", command=open_image_in_browser, width=15)
        open_button.pack(pady=(2, 0))

        # PIL mevcutsa resim yükle
        if PIL_AVAILABLE:
            try:
                # Resmi yükle - image_label'ı doğrudan parametre olarak gönder
                image_tk = self.load_image_from_url(image_url, (150, 150), image_label)
                if image_tk:
                    # Cache'den hemen geldiği için güncelle
                    image_label.config(image=image_tk, text="")
                    image_label.image = image_tk  # Referans korumak için
                    open_button.config(text="🔄 Yenile")  # Buton metnini değiştir
                else:
                    # Arka planda yükleme başlatıldı
                    image_label.config(text="⏳ Yükleniyor...")
            except Exception as e:
                self.logger.error(f"Image frame creation error: {str(e)}")
                image_label.config(text="❌ Yükleme Hatası")
        else:
            # PIL yoksa bilgilendirme göster
            image_label.config(text="⚠️ PIL Gerekli")
            # PIL kurulum bilgisi
            info_label = ttk.Label(controls_frame, text="Kurulum: pip install Pillow", font=('Arial', 7), foreground='gray')
            info_label.pack(pady=(2, 0))

        # URL'yi kopyala butonu
        def copy_url_to_clipboard():
            try:
                parent.clipboard_clear()
                parent.clipboard_append(image_url)
                messagebox.showinfo("Kopyalandı", "URL panoya kopyalandı!")
            except Exception as e:
                messagebox.showerror("Hata", f"Kopyalama başarısız: {str(e)}")

        copy_button = ttk.Button(controls_frame, text="📋 URL Kopyala", command=copy_url_to_clipboard, width=15)
        copy_button.pack(pady=(2, 0))

        # Image label tracking zaten load_image_from_url içinde yapılıyor

        return image_frame

    def create_window(self) -> None:
        """Detay penceresini oluştur"""
        # Ana pencere
        self.window = tk.Toplevel(self.parent)
        self.window.title(f"Parça Detayları ({len(self.selected_parts)} adet)")

        # Pencere boyutu
        window_width = self.config.get('detail_window_width', 1000)
        window_height = self.config.get('detail_window_height', 700)
        self.window.geometry(f"{window_width}x{window_height}")

        # Pencereyi merkeze al
        self.window.transient(self.parent)
        self.window.grab_set()

        # Link stilini tanımla
        style = ttk.Style()
        style.configure(
            'Link.TButton',
            foreground='blue',
            font=('Consolas', 9, 'underline'),
            relief='flat',
            padding=(5, 2)  # Daha fazla padding
        )
        style.map(
            'Link.TButton',
            foreground=[('active', 'darkblue'), ('pressed', 'darkblue')],
            background=[('active', '#f0f0f0')]  # Hover background
        )

        # Ana frame
        self.main_frame = ttk.Frame(self.window)
        self.main_frame.pack(fill='both', expand=True, padx=10, pady=10)

        # DEBUG: Test butonu - En üste
        debug_frame = ttk.Frame(self.main_frame)
        debug_frame.pack(fill='x', pady=(0, 10))

        debug_button = ttk.Button(
            debug_frame,
            text="🔥 TEST KAYDET BUTONU",
            command=self.save_parts_to_database,
            width=30
        )
        debug_button.pack()
        print(f"🔥 DEBUG: Test button created: {debug_button}")

        self.create_header()
        self.create_content_area()
        self.create_footer()

    def create_header(self) -> None:
        """Header bölümü oluştur"""
        header_frame = ttk.Frame(self.main_frame)
        header_frame.pack(fill='x', pady=(0, 10))

        # Geri butonu
        self.back_button = ttk.Button(
            header_frame,
            text="← Geri",
            command=self.go_back,
            style="Accent.TButton"
        )
        self.back_button.pack(side='left')

        # Başlık
        title_label = ttk.Label(
            header_frame,
            text=f"Seçili Parçalar Detayı ({len(self.selected_parts)} adet)",
            font=('Arial', 12, 'bold')
        )
        title_label.pack(side='left', padx=(20, 0))

        # 🆕 Alternatif Kaydet Butonu (Header'da)
        self.header_save_button = ttk.Button(
            header_frame,
            text="💾 KAYDET",
            command=self.save_parts_to_database
        )
        self.header_save_button.pack(side='right')
        print(f"✅ Header save button created: {self.header_save_button}")

        # Yenile butonu
        self.refresh_button = ttk.Button(
            header_frame,
            text="🔄 Yenile",
            command=self.refresh_data,
            state='disabled'  # Loading tamamlanınca aktif olur
        )
        self.refresh_button.pack(side='right')

        # Progress bar
        self.progress_var = tk.StringVar(value="Parça bilgileri yükleniyor...")
        progress_label = ttk.Label(header_frame, textvariable=self.progress_var)
        progress_label.pack(side='right', padx=(0, 10))

    def create_content_area(self) -> None:
        """Content alanı oluştur"""
        # Canvas ve scrollbar için frame
        canvas_frame = ttk.Frame(self.main_frame)
        canvas_frame.pack(fill='both', expand=True)

        # Canvas ve scrollbar
        self.canvas = tk.Canvas(canvas_frame, highlightthickness=0)
        self.v_scrollbar = ttk.Scrollbar(canvas_frame, orient='vertical', command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.v_scrollbar.set)

        # Scrollable frame
        self.scrollable_frame = ttk.Frame(self.canvas)
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        # Canvas'a frame'i ekle
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")

        # Pack canvas ve scrollbar
        self.canvas.pack(side="left", fill="both", expand=True)
        self.v_scrollbar.pack(side="right", fill="y")

        # Mouse wheel binding
        self.canvas.bind("<MouseWheel>", self._on_mousewheel)
        self.scrollable_frame.bind("<MouseWheel>", self._on_mousewheel)

        # Loading indicator
        self.loading_frame = ttk.Frame(self.scrollable_frame)
        self.loading_frame.pack(fill='x', pady=20)

        loading_label = ttk.Label(
            self.loading_frame,
            text="🔄 Parça bilgileri veritabanından yükleniyor...",
            font=('Arial', 11)
        )
        loading_label.pack()

        self.loading_progress = ttk.Progressbar(
            self.loading_frame,
            mode='indeterminate'
        )
        self.loading_progress.pack(fill='x', pady=(10, 0))
        self.loading_progress.start(10)

    def create_footer(self) -> None:
        """Footer bölümü oluştur"""
        footer_frame = ttk.Frame(self.main_frame)
        footer_frame.pack(fill='x', pady=(10, 0))

        # Sol taraf - Kaydet butonu
        left_frame = ttk.Frame(footer_frame)
        left_frame.pack(side='left', fill='x', expand=True)

        # 🆕 Veritabanına Kaydet Butonu
        self.save_button = ttk.Button(
            left_frame,
            text="💾 VERİTABANINA KAYDET",
            command=self.save_parts_to_database,
            width=25
        )
        self.save_button.pack(side='left', padx=(0, 10))

        # Debug: Butonu görünür olduğundan emin ol
        print(f"✅ Save button created in footer: {self.save_button}")
        print(f"✅ Save button text: {self.save_button['text']}")
        print(f"✅ Save button state: {self.save_button['state']}")

        # Orta - İstatistik bilgileri
        center_frame = ttk.Frame(footer_frame)
        center_frame.pack(side='left', expand=True)

        self.stats_var = tk.StringVar(value="Hazırlanıyor...")
        stats_label = ttk.Label(center_frame, textvariable=self.stats_var, font=('Arial', 9))
        stats_label.pack()

        # Sağ taraf - Kapat butonu
        right_frame = ttk.Frame(footer_frame)
        right_frame.pack(side='right')

        # Kapat butonu
        close_button = ttk.Button(
            right_frame,
            text="Kapat",
            command=self.close_window
        )
        close_button.pack()

    def _on_mousewheel(self, event) -> None:
        """Mouse wheel scroll handler"""
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def fetch_part_details(self) -> None:
        """Parça detaylarını arka planda çek"""
        def fetch_background():
            try:
                self.ui_queue.put(('progress', 'Veritabanı bağlantısı kontrol ediliyor...'))

                # Part adlarını topla
                part_names = [part.get('parcaAdi', '') for part in self.selected_parts]

                self.ui_queue.put(('progress', f'Toplu parça bilgisi sorgulanıyor... ({len(part_names)} parça)'))

                # Bulk API çağrısı
                response = self.database_client.get_bulk_part_info(part_names)

                if response.get('success'):
                    self.ui_queue.put(('progress', 'Parça bilgileri işleniyor...'))

                    # API sonuçlarını parça detaylarıyla eşleştir
                    api_parts = {p.get('partName'): p for p in response.get('data', {}).get('parts', [])}

                    for i, part in enumerate(self.selected_parts):
                        part_name = part.get('parcaAdi', '')
                        api_data = api_parts.get(part_name, {})

                        # Combined part data oluştur
                        combined_data = self.combine_part_data(part, api_data)
                        self.part_details[part_name] = combined_data

                        # Progress update
                        progress = f"İşleniyor... ({i + 1}/{len(self.selected_parts)})"
                        self.ui_queue.put(('progress', progress))

                    self.ui_queue.put(('loading_complete', response.get('data', {})))

                else:
                    error_msg = response.get('error', {}).get('message', 'Bilinmeyen hata')
                    self.ui_queue.put(('error', f'API hatası: {error_msg}'))

            except Exception as e:
                self.logger.error(f"Part detail fetch error: {str(e)}")
                self.ui_queue.put(('error', f'Parça bilgileri yüklenemedi: {str(e)}'))

        # Background thread başlat
        fetch_thread = threading.Thread(target=fetch_background, daemon=True)
        fetch_thread.start()

    def combine_part_data(self, scan_data: Dict, api_data: Dict) -> Dict[str, Any]:
        """
        Tarama verisi ile API verisini birleştir

        Args:
            scan_data: Dosya tarama verisi
            api_data: API'den gelen parça verisi

        Returns:
            Dict: Birleştirilmiş parça verisi
        """
        combined = scan_data.copy()

        # API bilgileri varsa ekle
        if api_data.get('found'):
            part_data = api_data.get('partData', {})
            combined['database'] = {
                'exists': True,
                'data': part_data,
                'missing_fields': api_data.get('missingFields', []),
                'completion_rate': api_data.get('completionRate', 0.0)
            }
        else:
            combined['database'] = {
                'exists': False,
                'reason': api_data.get('reason', 'Parça sistemde bulunamadı'),
                'suggestions': api_data.get('suggestions', [])
            }

        return combined

    def process_ui_updates(self) -> None:
        """UI güncellemelerini işle"""
        try:
            while True:
                queue_item = self.ui_queue.get_nowait()

                # Queue item'in formatını kontrol et
                if isinstance(queue_item, tuple) and len(queue_item) == 2:
                    action, data = queue_item
                elif isinstance(queue_item, tuple) and len(queue_item) > 2:
                    # Eğer 2'den fazla değer varsa sadece ilk ikisini al
                    self.logger.warning(f"Queue item has {len(queue_item)} elements, taking first 2: {queue_item}")
                    action, data = queue_item[0], queue_item[1]
                elif isinstance(queue_item, str):
                    # Eğer sadece string varsa action olarak kullan, data'yı None yap
                    self.logger.debug(f"Queue item is string: {queue_item}")
                    action, data = queue_item, None
                else:
                    # Bilinmeyen format
                    self.logger.error(f"Unknown queue item format: {queue_item} (type: {type(queue_item)})")
                    continue

                if action == 'progress':
                    self.progress_var.set(data)
                elif action == 'loading_complete':
                    self.on_loading_complete(data)
                elif action == 'image_loaded':
                    self.handle_image_loaded(data)
                elif action == 'error':
                    self.show_error(data)
                else:
                    self.logger.warning(f"Unknown action in queue: {action}")

        except queue.Empty:
            pass
        except Exception as e:
            self.logger.error(f"Error processing UI updates: {str(e)}")
        finally:
            # 100ms sonra tekrar kontrol et
            if hasattr(self, 'window') and self.window:
                self.window.after(100, self.process_ui_updates)

    def handle_image_loaded(self, image_data: tuple) -> None:
        """Yüklenen resmi işle"""
        try:
            # Tuple uzunluğunu kontrol et
            if len(image_data) >= 2:
                url, photo_image = image_data[0], image_data[1]
            elif len(image_data) == 1:
                url = image_data[0]
                photo_image = None
            else:
                self.logger.error(f"Invalid image_data format: {image_data}")
                return

            # Image cache'i güncelle
            self.image_cache[url] = photo_image

            # Kartları yenile
            if hasattr(self, 'card_image_labels') and url in self.card_image_labels:
                for label_widget in self.card_image_labels[url]:
                    if photo_image:
                        label_widget.config(image=photo_image, text="")
                        label_widget.image = photo_image
                    else:
                        self.logger.warning(f"No photo_image for URL: {url}")
        except Exception as e:
            self.logger.error(f"Image loading UI update failed: {str(e)}")

    def auto_load_images(self) -> None:
        """2 saniye sonra resimleri otomatik olarak yükler"""
        try:
            self.logger.debug("Starting auto image loading after 2 seconds delay")
            self.progress_var.set("🔄 Resimler otomatik yükleniyor...")

            # Tüm parça detaylarındaki resim URL'lerini topla
            image_urls = []
            for part_name, part_data in self.part_details.items():
                db_data = part_data.get('database', {})
                if db_data.get('exists'):
                    part_info = db_data.get('data', {})

                    # Parça resmi
                    foto_path = part_info.get('foto_path')
                    if foto_path:
                        foto_url = self.get_image_url(foto_path)
                        image_urls.append(foto_url)

                    # Teknik resim
                    teknik_path = part_info.get('teknik_resim_path')
                    if teknik_path:
                        teknik_url = self.get_image_url(teknik_path)
                        image_urls.append(teknik_url)

            # Resimleri yükle
            loaded_count = 0
            for url in image_urls:
                if url not in self.image_cache:
                    # Resmi yükle (image_label olmadan, sadece cache için)
                    image_tk = self.load_image_from_url(url)
                    if image_tk:
                        loaded_count += 1

            # Progress'i güncelle
            if loaded_count > 0:
                self.progress_var.set(f"✅ {loaded_count} resim otomatik yüklendi")
                # 3 saniya sonra eski mesaja geri dön
                self.window.after(3000, lambda: self.progress_var.set(
                    f"✅ Yükleme tamamlandı - {len(self.part_details)} parça"
                ))
            else:
                self.progress_var.set(f"✅ Tüm resimler zaten cache'te mevcut")
                # 3 saniya sonra eski mesaja geri dön
                self.window.after(3000, lambda: self.progress_var.set(
                    f"✅ Yükleme tamamlandı - {len(self.part_details)} parça"
                ))

            self.logger.debug(f"Auto image loading completed. Loaded {loaded_count} new images")

        except Exception as e:
            self.logger.error(f"Auto image loading failed: {str(e)}")
            self.progress_var.set("⚠️ Otomatik resim yükleme tamamlanamadı")

    def on_loading_complete(self, api_stats: Dict) -> None:
        """Loading tamamlandığında çağrılır"""
        self.loading_complete = True

        # Loading indicator'ları kapat
        self.loading_progress.stop()
        self.loading_frame.destroy()

        # Refresh button'u aktif et
        self.refresh_button.config(state='normal')

        # Progress mesajını güncelle
        found_count = api_stats.get('foundCount', 0)
        not_found_count = api_stats.get('notFoundCount', 0)
        self.progress_var.set(f"✅ Yükleme tamamlandı - {found_count} bulundu, {not_found_count} bulunamadı")

        # Part card'larını oluştur (card_image_labels zaten __init__ içinde oluşturuldu)
        self.create_part_cards()

        # İstatistikleri güncelle
        self.update_stats(api_stats)

        # 2 saniye sonra otomatik resim yükleme başlat
        self.window.after(2000, self.auto_load_images)

    def create_part_cards(self) -> None:
        """Parça kartlarını oluştur"""
        cards_per_row = self.config.get('cards_per_row', 1)
        card_spacing = self.config.get('card_spacing', 10)

        for i, (part_name, part_data) in enumerate(self.part_details.items()):
            # Card frame
            card_frame = self.create_part_card(part_data)
            card_frame.pack(fill='x', pady=card_spacing, padx=10)

    def create_part_card(self, part_data: Dict) -> ttk.LabelFrame:
        """
        Tek parça kartı oluştur

        Args:
            part_data: Parça verisi

        Returns:
            ttk.LabelFrame: Parça kartı frame'i
        """
        part_name = part_data.get('parcaAdi', 'Bilinmeyen Parça')
        db_data = part_data.get('database', {})
        db_exists = db_data.get('exists', False)

        # Durum ikonu
        status_icon = "✅" if db_exists else "❌"
        loading_icon = "🔄" if not self.loading_complete else ""

        # Card frame
        card_title = f"📦 {part_name} [{status_icon}{loading_icon}]"
        card_frame = ttk.LabelFrame(self.scrollable_frame, text=card_title, padding="10")

        # CAD Dosyalar bölümü
        self.create_cad_files_section(card_frame, part_data)

        # Veritabanı bilgileri bölümü
        self.create_database_section(card_frame, db_data)

        # Görseller bölümü
        if db_exists:
            self.create_visuals_section(card_frame, db_data.get('data', {}))

        # Eksik bilgiler bölümü
        if db_exists and db_data.get('missing_fields'):
            self.create_missing_fields_section(card_frame, db_data.get('missing_fields', []))

        return card_frame

    def create_cad_files_section(self, parent: ttk.LabelFrame, part_data: Dict) -> None:
        """CAD dosyalar bölümü oluştur"""
        cad_frame = ttk.LabelFrame(parent, text="CAD Dosyalar", padding="5")
        cad_frame.pack(fill='x', pady=(0, 10))

        # Debug: Tüm part_data'yı log'la
        self.logger.info(f"CAD Files - Part data keys: {list(part_data.keys())}")
        self.logger.info(f"CAD Files - sldprt_files: {part_data.get('sldprt_files', [])}")
        self.logger.info(f"CAD Files - slddrw_files: {part_data.get('slddrw_files', [])}")
        self.logger.info(f"CAD Files - pdf_files: {part_data.get('pdf_files', [])}")

        # 3D Model (.sldprt)
        sldprt_files = part_data.get('sldprt_files', [])
        self.logger.info(f"3D Model files found: {sldprt_files}")

        if sldprt_files and len(sldprt_files) > 0:
            file_path = sldprt_files[0]
            file_name = os.path.basename(file_path)

            # Dosya için container frame
            file_frame = ttk.Frame(cad_frame)
            file_frame.pack(fill='x', anchor='w', pady=2)

            ttk.Label(file_frame, text="├─ 3D Model (.sldprt): ✅", font=('Consolas', 9)).pack(side='left')

            # Tıklanabilir dosya linki - daha belirgin stil
            file_link = ttk.Button(
                file_frame,
                text=f"📂 {file_name}",
                command=lambda fp=file_path: self.open_file(fp),  # Lambda with default value
                style='Link.TButton',
                width=25,  # Genişliği artır
                cursor='hand2'  # Hand cursor
            )
            file_link.pack(side='left', padx=(5, 0))
            self.logger.debug(f"✅ Added 3D Model button: {file_name}")
        else:
            # Hem log'a yaz hem de ekranda göster
            error_text = "├─ 3D Model (.sldprt): ❌ 3D dosya bulunamadı"
            self.logger.warning(error_text)
            ttk.Label(cad_frame, text=error_text, font=('Consolas', 9), foreground='red').pack(anchor='w', pady=2)

        # Çizim (.slddrw)
        slddrw_files = part_data.get('slddrw_files', [])
        self.logger.info(f"Drawing files found: {slddrw_files}")

        if slddrw_files and len(slddrw_files) > 0:
            file_path = slddrw_files[0]
            file_name = os.path.basename(file_path)

            # Dosya için container frame
            file_frame = ttk.Frame(cad_frame)
            file_frame.pack(fill='x', anchor='w', pady=2)

            ttk.Label(file_frame, text="├─ Çizim (.slddrw): ✅", font=('Consolas', 9)).pack(side='left')

            # Tıklanabilir dosya linki - daha belirgin stil
            file_link = ttk.Button(
                file_frame,
                text=f"📂 {file_name}",
                command=lambda fp=file_path: self.open_file(fp),  # Lambda with default value
                style='Link.TButton',
                width=25,  # Genişliği artır
                cursor='hand2'  # Hand cursor
            )
            file_link.pack(side='left', padx=(5, 0))
            self.logger.debug(f"✅ Added Drawing button: {file_name}")
        else:
            # Hem log'a yaz hem de ekranda göster
            error_text = "├─ Çizim (.slddrw): ❌ Çizim dosyası bulunamadı"
            self.logger.warning(error_text)
            ttk.Label(cad_frame, text=error_text, font=('Consolas', 9), foreground='orange').pack(anchor='w', pady=2)

        # PDF
        pdf_files = part_data.get('pdf_files', [])
        self.logger.info(f"PDF files found: {pdf_files}")

        if pdf_files and len(pdf_files) > 0:
            file_path = pdf_files[0]
            file_name = os.path.basename(file_path)

            # Dosya için container frame
            file_frame = ttk.Frame(cad_frame)
            file_frame.pack(fill='x', anchor='w', pady=2)

            ttk.Label(file_frame, text="└─ Teknik Resim (.pdf): ✅", font=('Consolas', 9)).pack(side='left')

            # Tıklanabilir dosya linki - daha belirgin stil
            file_link = ttk.Button(
                file_frame,
                text=f"📂 {file_name}",
                command=lambda fp=file_path: self.open_file(fp),  # Lambda with default value
                style='Link.TButton',
                width=25,  # Genişliği artır
                cursor='hand2'  # Hand cursor
            )
            file_link.pack(side='left', padx=(5, 0))
            self.logger.debug(f"✅ Added PDF button: {file_name}")
        else:
            # Hem log'a yaz hem de ekranda göster
            error_text = "└─ Teknik Resim (.pdf): ❌ Teknik resim bulunamadı"
            self.logger.warning(error_text)
            ttk.Label(cad_frame, text=error_text, font=('Consolas', 9), foreground='orange').pack(anchor='w', pady=2)

        # Debug: Toplam durum
        total_files = len(sldprt_files) + len(slddrw_files) + len(pdf_files)
        self.logger.info(f"CAD Files Summary - Total files: {total_files} (3D: {len(sldprt_files)}, 2D: {len(slddrw_files)}, PDF: {len(pdf_files)})")

    def create_database_section(self, parent: ttk.LabelFrame, db_data: Dict) -> None:
        """Veritabanı bilgileri bölümü oluştur"""
        db_frame = ttk.LabelFrame(parent, text="Veritabanı Bilgileri", padding="5")
        db_frame.pack(fill='x', pady=(0, 10))

        if db_data.get('exists'):
            data = db_data.get('data', {})

            # Durum
            ttk.Label(db_frame, text="├─ Durum: ✅ Sistemde kayıtlı", font=('Consolas', 9), foreground='green').pack(anchor='w')

            # Stok bilgileri
            stok_adeti = data.get('stokAdeti', 0)
            kritik_stok = data.get('kritik_stok', 0)
            stok_text = f"├─ Stok Adedi: {stok_adeti} adet" if stok_adeti > 0 else "├─ Stok Adedi: ⚠️ Bilgi eksik"
            ttk.Label(db_frame, text=stok_text, font=('Consolas', 9)).pack(anchor='w')

            kritik_text = f"├─ Kritik Stok: {kritik_stok} adet" if kritik_stok > 0 else "├─ Kritik Stok: ⚠️ Tanımlanmamış"
            ttk.Label(db_frame, text=kritik_text, font=('Consolas', 9)).pack(anchor='w')

            # Maliyet
            maliyet = data.get('tedarikBedeli', 0)
            maliyet_text = f"├─ Maliyet: {maliyet:.2f} TL" if maliyet > 0 else "├─ Maliyet: ⚠️ Hesaplanmamış"
            ttk.Label(db_frame, text=maliyet_text, font=('Consolas', 9)).pack(anchor='w')

            # Malzeme
            stok_karti = data.get('stokKarti')
            if stok_karti:
                malzeme = f"{stok_karti.get('malzeme_cinsi', '')} - {stok_karti.get('kesit', '')}x{stok_karti.get('boy', '')}mm"
                ttk.Label(db_frame, text=f"├─ Malzeme: {malzeme}", font=('Consolas', 9)).pack(anchor='w')
            else:
                ttk.Label(db_frame, text="├─ Malzeme: ⚠️ Belirtilmemiş", font=('Consolas', 9), foreground='orange').pack(anchor='w')

            # Üretim türü
            imal_mi = data.get('imalMi', False)
            uretim_text = "└─ Üretim Türü: İmal" if imal_mi else "└─ Üretim Türü: Satın Alma"
            ttk.Label(db_frame, text=uretim_text, font=('Consolas', 9)).pack(anchor='w')

        else:
            ttk.Label(db_frame, text="└─ Durum: ❌ Sistemde bulunamadı", font=('Consolas', 9), foreground='red').pack(anchor='w')

            # Öneriler varsa göster
            suggestions = db_data.get('suggestions', [])
            if suggestions:
                ttk.Label(db_frame, text="   Benzer parçalar:", font=('Consolas', 9), foreground='blue').pack(anchor='w')
                for suggestion in suggestions[:3]:
                    ttk.Label(db_frame, text=f"   • {suggestion.get('code', '')}", font=('Consolas', 9), foreground='blue').pack(anchor='w')

    def create_visuals_section(self, parent: ttk.LabelFrame, data: Dict) -> None:
        """Görseller bölümü oluştur"""
        visuals_frame = ttk.LabelFrame(parent, text="Görseller", padding="5")
        visuals_frame.pack(fill='x', pady=(0, 10))

        # Görseller için ana container
        images_container = ttk.Frame(visuals_frame)
        images_container.pack(fill='x')

        # Parça resmi
        foto_path = data.get('foto_path')
        if foto_path:
            foto_url = self.get_image_url(foto_path)
            foto_frame = self.create_image_frame(
                images_container,
                "📷 Parça Resmi",
                foto_url,
                "Yükleniyor..."
            )
            foto_frame.pack(side='left', padx=(0, 20))
        else:
            ttk.Label(visuals_frame, text="├─ Parça Resmi: ❌ Resim bulunmuyor", font=('Consolas', 9), foreground='orange').pack(anchor='w')

        # Teknik çizim
        teknik_resim_path = data.get('teknik_resim_path')
        if teknik_resim_path:
            teknik_url = self.get_image_url(teknik_resim_path)
            teknik_frame = self.create_image_frame(
                images_container,
                "📋 Teknik Çizim",
                teknik_url,
                "Yükleniyor..."
            )
            teknik_frame.pack(side='left')
        else:
            ttk.Label(visuals_frame, text="└─ Teknik Çizim: ❌ Teknik resim yok", font=('Consolas', 9), foreground='orange').pack(anchor='w')

    def create_missing_fields_section(self, parent: ttk.LabelFrame, missing_fields: List[Dict]) -> None:
        """Eksik bilgiler bölümü oluştur"""
        if not missing_fields:
            return

        missing_frame = ttk.LabelFrame(parent, text="Eksik Bilgiler", padding="5")
        missing_frame.pack(fill='x', pady=(0, 10))

        field_names = [field.get('description', field.get('field', '')) for field in missing_fields]
        missing_text = ", ".join(field_names)

        ttk.Label(
            missing_frame,
            text=f"⚠️ {missing_text}",
            font=('Consolas', 9),
            foreground='orange',
            wraplength=800
        ).pack(anchor='w')

    def open_file(self, file_path: str) -> None:
        """Dosya aç (OS'a uygun şekilde)"""
        try:
            if platform.system() == 'Darwin':  # macOS
                subprocess.call(['open', file_path])
            elif platform.system() == 'Windows':  # Windows
                os.startfile(file_path)
            else:  # Linux
                subprocess.call(['xdg-open', file_path])
        except Exception as e:
            messagebox.showerror("Dosya Açma Hatası", f"Dosya açılamadı: {str(e)}")

    def open_url(self, url: str) -> None:
        """URL'yi varsayılan web tarayıcısında aç"""
        try:
            import webbrowser
            webbrowser.open(url)
        except Exception as e:
            messagebox.showerror("URL Açma Hatası", f"URL açılamadı: {str(e)}\nURL: {url}")

    def update_stats(self, api_stats: Dict) -> None:
        """İstatistikleri güncelle"""
        found_count = api_stats.get('foundCount', 0)
        not_found_count = api_stats.get('notFoundCount', 0)
        cache_hits = api_stats.get('statistics', {}).get('cacheHitCount', 0)

        stats_text = f"📊 Toplam: {len(self.selected_parts)} | Bulundu: {found_count} | Bulunamadı: {not_found_count}"
        if cache_hits > 0:
            stats_text += f" | Cache: {cache_hits} hit"

        self.stats_var.set(stats_text)

    def show_error(self, error_message: str) -> None:
        """Hata mesajı göster"""
        self.progress_var.set(f"❌ Hata: {error_message}")
        messagebox.showerror("Parça Detayları Hatası", error_message)

    def refresh_data(self) -> None:
        """Verileri yenile"""
        if not self.loading_complete:
            return

        # Cache'i temizle
        self.database_client.clear_cache()

        # UI'yi sıfırla
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()

        self.loading_complete = False

        # Loading indicator'ı yeniden oluştur
        self.create_content_area()

        # Refresh button'u deaktif et
        self.refresh_button.config(state='disabled')

        # Verileri yeniden yükle
        self.fetch_part_details()

    def go_back(self) -> None:
        """Ana ekrana geri dön"""
        self.close_window()

    def save_parts_to_database(self) -> None:
        """Seçili parçaları veritabanına kaydet"""
        if not self.selected_parts or len(self.selected_parts) == 0:
            messagebox.showwarning("Kaydedilecek Parça Yok", "Kaydedilecek parça bulunamadı!")
            return

        # Onay al
        result = messagebox.askyesno(
            "Veritabanına Kaydet",
            f"Seçili {len(self.selected_parts)} parçayı veritabanına kaydetmek istediğinize emin misiniz?\n\n" +
            "✅ Yeni parçalar eklenecek\n" +
            "✅ Mevcut parçalar güncellenecek\n" +
            "⚠️ Bu işlem geri alınamaz!"
        )

        if not result:
            return

        # Butonu devre dışı bırak ve loading göster
        self.save_button.config(state='disabled', text="💾 Kaydediliyor...")
        self.window.update_idletasks()

        try:
            # Parçaları API formatına çevir
            parts_to_save = []
            for part in self.selected_parts:
                # CAD dosyalarını part_data'dan al
                cad_data = self.part_details.get(part.get('parcaAdi', ''), {})
                sldprt_files = cad_data.get('sldprt_files', [])
                slddrw_files = cad_data.get('slddrw_files', [])
                pdf_files = cad_data.get('pdf_files', [])

                parts_to_save.append({
                    'fileName': part.get('parcaAdi', ''),
                    'parcaKodu': part.get('parcaAdi', ''),  # Dosya adından parça kodu
                    'parcaAdi': part.get('parcaAdi', ''),
                    'kaynak': 'dizin_tarama',
                    # CAD dosyaları bilgileri
                    'sldprt_yolu': sldprt_files[0] if sldprt_files else None,
                    'slddrw_yolu': slddrw_files[0] if slddrw_files else None,
                    'pdf_yolu': pdf_files[0] if pdf_files else None,
                    'has3D': len(sldprt_files) > 0,
                    'hasDrawing': len(slddrw_files) > 0,
                    'hasPDF': len(pdf_files) > 0
                })

            # Kaydetme işlemini yap
            save_result = self.database_client.save_parts_to_database(parts_to_save)

            if save_result['status'] == 'success':
                data = save_result.get('data', {})

                # Başarılı mesajı
                messagebox.showinfo(
                    "✅ Kaydetme Başarılı",
                    f"Parçalar başarıyla veritabanına kaydedildi!\n\n" +
                    f"📊 Toplam: {data.get('requestedCount', 0)} parça\n" +
                    f"✅ Başarılı: {data.get('successCount', 0)} parça\n" +
                    f"🆕 Yeni: {data.get('createdCount', 0)} parça\n" +
                    f"🔄 Güncellenen: {data.get('updatedCount', 0)} parça\n" +
                    f"⏱️ Süre: {data.get('executionTime', 'N/A')}\n" +
                    f"📈 Başarı Oranı: {data.get('statistics', {}).get('successRate', 0):.1f}%"
                )

                # Buton metnini güncelle
                self.save_button.config(text="✅ Kaydedildi")

            else:
                # Hata mesajı
                messagebox.showerror(
                    "❌ Kaydetme Hatası",
                    f"Kaydetme işlemi sırasında hata oluştu:\n\n" +
                    f"Hata Kodu: {save_result.get('error_code', 'BILINMEYEN')}\n" +
                    f"Hata Mesajı: {save_result.get('message', 'Bilinmeyen hata')}"
                )

                # Butonu tekrar aktif et
                self.save_button.config(state='normal', text="💾 Veritabanına Kaydet")

        except Exception as e:
            # Genel hata
            messagebox.showerror(
                "❌ Beklenmedik Hata",
                f"Beklenmedik bir hata oluştu:\n\n{str(e)}"
            )

            # Butonu tekrar aktif et
            self.save_button.config(state='normal', text="💾 Veritabanına Kaydet")

        finally:
            # Loading durdur
            self.window.update_idletasks()

    def close_window(self) -> None:
        """Pencereyi kapat"""
        self.window.destroy()


# Test fonksiyonu
def test_part_detail_window():
    """PartDetailWindow test fonksiyonu"""
    import sys

    # Fake database client
    class FakeDatabaseClient:
        def get_bulk_part_info(self, part_names):
            return {
                'success': True,
                'data': {
                    'foundCount': 1,
                    'notFoundCount': 1,
                    'parts': [
                        {
                            'partName': 'TEST_PART_001',
                            'found': True,
                            'partData': {'stokAdeti': 100, 'imalMi': True},
                            'completionRate': 0.8
                        },
                        {
                            'partName': 'TEST_PART_002',
                            'found': False,
                            'reason': 'Test parça bulunamadı'
                        }
                    ]
                }
            }

        def clear_cache(self):
            pass

    # Test verileri
    test_parts = [
        {
            'parcaAdi': 'TEST_PART_001',
            'has3D': True,
            'hasDrawing': False,
            'hasPDF': True,
            'sldprt': ['test1.sldprt'],
            'pdf': ['test1.pdf']
        },
        {
            'parcaAdi': 'TEST_PART_002',
            'has3D': True,
            'hasDrawing': True,
            'hasPDF': False,
            'sldprt': ['test2.sldprt'],
            'slddrw': ['test2.slddrw']
        }
    ]

    # Ana pencere
    root = tk.Tk()
    root.title("Test Ana Pencere")
    root.geometry("300x200")

    fake_client = FakeDatabaseClient()

    def open_detail_window():
        detail_window = PartDetailWindow(root, test_parts, fake_client)

    ttk.Button(root, text="Part Detail Window Aç", command=open_detail_window).pack(pady=50)

    root.mainloop()


if __name__ == "__main__":
    test_part_detail_window()