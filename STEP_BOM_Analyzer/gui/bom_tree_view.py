"""
BOM TreeView Widget

Hiyerarşik BOM görselleştirme için Tkinter TreeView widget'ı.
Expand/collapse, search, filter, context menu özellikleri.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from typing import Dict, List, Optional, Any, Callable
import json
import csv
from pathlib import Path

# BOM data structures
from core.bom_extractor_v2 import BOMStructureV2, BOMItemV2


class BOMTreeViewWidget:
    """BOM hiyerarşik görüntüleme widget'ı"""
    
    def __init__(self, parent_frame, config=None, logger=None):
        self.parent = parent_frame
        self.config = config or {}
        self.logger = logger
        
        # Data
        self.bom_structure: Optional[BOMStructureV2] = None
        self.filtered_items: List[BOMItemV2] = []
        self.search_term: str = ""
        self.filter_criteria: Dict[str, Any] = {}
        
        # Callbacks
        self.on_item_selected: Optional[Callable] = None
        self.on_item_double_click: Optional[Callable] = None
        
        # UI Components
        self.main_frame = None
        self.toolbar_frame = None
        self.tree_frame = None
        self.status_frame = None
        
        self.tree: Optional[ttk.Treeview] = None
        self.search_var = tk.StringVar()
        self.filter_var = tk.StringVar()
        self.status_label: Optional[tk.Label] = None
        
        self._create_ui()
    
    def _create_ui(self):
        """UI bileşenlerini oluştur"""
        # Main container
        self.main_frame = ttk.Frame(self.parent)
        self.main_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Toolbar
        self._create_toolbar()
        
        # TreeView container
        self._create_treeview()
        
        # Status bar
        self._create_status_bar()
    
    def _create_toolbar(self):
        """Toolbar oluştur"""
        self.toolbar_frame = ttk.Frame(self.main_frame)
        self.toolbar_frame.pack(fill='x', pady=(0, 5))
        
        # Search box
        ttk.Label(self.toolbar_frame, text="Ara:").pack(side='left', padx=(0, 5))
        search_entry = ttk.Entry(self.toolbar_frame, textvariable=self.search_var, width=30)
        search_entry.pack(side='left', padx=(0, 10))
        search_entry.bind('<KeyRelease>', self._on_search_changed)
        
        # Filter dropdown
        ttk.Label(self.toolbar_frame, text="Filtre:").pack(side='left', padx=(0, 5))
        filter_combo = ttk.Combobox(self.toolbar_frame, textvariable=self.filter_var, width=20)
        filter_combo['values'] = ('Tümü', 'Sadece Parts', 'Sadece Assemblies', 'Solid Parts', 'Sheet Metal')
        filter_combo.set('Tümü')
        filter_combo.pack(side='left', padx=(0, 10))
        filter_combo.bind('<<ComboboxSelected>>', self._on_filter_changed)
        
        # Buttons
        button_frame = ttk.Frame(self.toolbar_frame)
        button_frame.pack(side='right')
        
        ttk.Button(button_frame, text="Tümünü Aç", command=self._expand_all).pack(side='left', padx=2)
        ttk.Button(button_frame, text="Tümünü Kapat", command=self._collapse_all).pack(side='left', padx=2)
        ttk.Button(button_frame, text="Seçiliyi Export", command=self._export_selected).pack(side='left', padx=2)
        ttk.Button(button_frame, text="Yenile", command=self._refresh_tree).pack(side='left', padx=2)
    
    def _create_treeview(self):
        """TreeView oluştur"""
        self.tree_frame = ttk.Frame(self.main_frame)
        self.tree_frame.pack(fill='both', expand=True)
        
        # TreeView columns
        columns = (
            'part_number', 'part_name', 'description', 'quantity', 
            'type', 'shape_type', 'volume', 'category'
        )
        
        self.tree = ttk.Treeview(self.tree_frame, columns=columns, show='tree headings')
        
        # Column headers
        self.tree.heading('#0', text='Hiyerarşi', anchor='w')
        self.tree.heading('part_number', text='Part No', anchor='w')
        self.tree.heading('part_name', text='Part Adı', anchor='w')
        self.tree.heading('description', text='Açıklama', anchor='w')
        self.tree.heading('quantity', text='Miktar', anchor='center')
        self.tree.heading('type', text='Tip', anchor='center')
        self.tree.heading('shape_type', text='Şekil', anchor='center')
        self.tree.heading('volume', text='Hacim', anchor='e')
        self.tree.heading('category', text='Kategori', anchor='center')
        
        # Column widths
        self.tree.column('#0', width=200, minwidth=150)
        self.tree.column('part_number', width=120, minwidth=80)
        self.tree.column('part_name', width=150, minwidth=100)
        self.tree.column('description', width=200, minwidth=150)
        self.tree.column('quantity', width=60, minwidth=50)
        self.tree.column('type', width=80, minwidth=60)
        self.tree.column('shape_type', width=80, minwidth=60)
        self.tree.column('volume', width=100, minwidth=80)
        self.tree.column('category', width=100, minwidth=80)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(self.tree_frame, orient='vertical', command=self.tree.yview)
        h_scrollbar = ttk.Scrollbar(self.tree_frame, orient='horizontal', command=self.tree.xview)
        
        self.tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack components
        self.tree.pack(side='left', fill='both', expand=True)
        v_scrollbar.pack(side='right', fill='y')
        h_scrollbar.pack(side='bottom', fill='x')
        
        # Event bindings
        self.tree.bind('<<TreeviewSelect>>', self._on_tree_select)
        self.tree.bind('<Double-1>', self._on_tree_double_click)
        self.tree.bind('<Button-3>', self._on_tree_right_click)  # Right click
        
        # Context menu
        self._create_context_menu()
    
    def _create_context_menu(self):
        """Context menu oluştur"""
        self.context_menu = tk.Menu(self.tree, tearoff=0)
        self.context_menu.add_command(label="Detayları Göster", command=self._show_item_details)
        self.context_menu.add_command(label="Alt Elemanları Aç", command=self._expand_selected)
        self.context_menu.add_command(label="Alt Elemanları Kapat", command=self._collapse_selected)
        self.context_menu.add_separator()
        self.context_menu.add_command(label="Bu Elemanı Kopyala", command=self._copy_selected)
        self.context_menu.add_command(label="Bu Elemanı Export Et", command=self._export_selected_item)
        self.context_menu.add_separator()
        self.context_menu.add_command(label="Part Resmini Göster", command=self._show_part_image)
    
    def _create_status_bar(self):
        """Status bar oluştur"""
        self.status_frame = ttk.Frame(self.main_frame)
        self.status_frame.pack(fill='x', pady=(5, 0))
        
        self.status_label = tk.Label(
            self.status_frame, 
            text="BOM yüklenmedi",
            relief='sunken',
            anchor='w'
        )
        self.status_label.pack(fill='x')
    
    def load_bom(self, bom_structure: BOMStructureV2):
        """BOM structure'ını yükle ve görüntüle"""
        self.bom_structure = bom_structure
        self.filtered_items = bom_structure.items.copy()
        
        self._log_info(f"BOM yükleniyor: {bom_structure.assembly_name} ({len(bom_structure.items)} items)")
        
        # TreeView'ı temizle
        self.tree.delete(*self.tree.get_children())
        
        # Items'ları level'a göre organize et
        items_by_level = {}
        for item in bom_structure.items:
            level = item.level
            if level not in items_by_level:
                items_by_level[level] = []
            items_by_level[level].append(item)
        
        # Hiyerarşik olarak ekle
        parent_map = {}  # assembly_path -> tree_item_id
        
        for level in sorted(items_by_level.keys()):
            for item in items_by_level[level]:
                parent_id = self._find_parent_id(item, parent_map)
                tree_item_id = self._add_tree_item(item, parent_id)
                parent_map[item.assembly_path] = tree_item_id
        
        # Status güncelle
        self._update_status()
        
        # İlk seviyeyi genişlet
        for child in self.tree.get_children():
            self.tree.item(child, open=True)
    
    def _find_parent_id(self, item: BOMItemV2, parent_map: Dict[str, str]) -> str:
        """Item için parent tree ID'sini bul"""
        if item.level == 0:
            return ""  # Root level
        
        # Parent assembly path'ini bul
        path_parts = item.assembly_path.split('/')
        if len(path_parts) > 1:
            parent_path = '/'.join(path_parts[:-1])
            return parent_map.get(parent_path, "")
        
        return ""
    
    def _add_tree_item(self, item: BOMItemV2, parent_id: str) -> str:
        """TreeView'a item ekle"""
        # Icon seç
        icon_text = self._get_item_icon(item)
        
        # Values hazırla
        values = (
            item.part_number,
            item.part_name,
            item.description,
            str(item.quantity),
            item.node_type or "",
            item.shape_type or "",
            f"{item.volume:.2f}" if item.volume else "",
            item.category or ""
        )
        
        # TreeView item oluştur
        tree_item_id = self.tree.insert(
            parent_id,
            'end',
            text=f"{icon_text} {item.part_name}",
            values=values,
            tags=(item.node_type,)
        )
        
        # Color coding
        if item.node_type == 'assembly':
            self.tree.set(tree_item_id, '#0', f"📁 {item.part_name}")
        elif item.node_type == 'part':
            if item.shape_type == 'Solid':
                self.tree.set(tree_item_id, '#0', f"🔩 {item.part_name}")
            else:
                self.tree.set(tree_item_id, '#0', f"⚙️ {item.part_name}")
        
        # Store item reference
        self.tree.set(tree_item_id, 'item_ref', item)
        
        return tree_item_id
    
    def _get_item_icon(self, item: BOMItemV2) -> str:
        """Item için icon seç"""
        if item.node_type == 'assembly':
            return "📁"
        elif item.node_type == 'part':
            if item.shape_type == 'Solid':
                return "🔩"
            elif item.shape_type == 'Shell':
                return "📄"
            elif item.shape_type == 'Wire':
                return "〰️"
            else:
                return "⚙️"
        else:
            return "❓"
    
    def _on_search_changed(self, event=None):
        """Arama değiştiğinde"""
        self.search_term = self.search_var.get().lower()
        self._apply_filters()
    
    def _on_filter_changed(self, event=None):
        """Filtre değiştiğinde"""
        filter_value = self.filter_var.get()
        
        self.filter_criteria = {}
        if filter_value == 'Sadece Parts':
            self.filter_criteria['node_type'] = 'part'
        elif filter_value == 'Sadece Assemblies':
            self.filter_criteria['node_type'] = 'assembly'
        elif filter_value == 'Solid Parts':
            self.filter_criteria['shape_type'] = 'Solid'
        elif filter_value == 'Sheet Metal':
            self.filter_criteria['category'] = 'Sheet Metal'
        
        self._apply_filters()
    
    def _apply_filters(self):
        """Filtreleri uygula"""
        if not self.bom_structure:
            return
        
        # Filtrelenmiş items
        filtered = []
        
        for item in self.bom_structure.items:
            # Search filter
            if self.search_term:
                searchable_text = f"{item.part_name} {item.part_number} {item.description}".lower()
                if self.search_term not in searchable_text:
                    continue
            
            # Category filters
            if self.filter_criteria:
                match = True
                for key, value in self.filter_criteria.items():
                    item_value = getattr(item, key, None)
                    if item_value != value:
                        match = False
                        break
                if not match:
                    continue
            
            filtered.append(item)
        
        self.filtered_items = filtered
        self._refresh_display()
    
    def _refresh_display(self):
        """Görüntüyü yenile"""
        if not self.bom_structure:
            return
        
        # TreeView'ı temizle
        self.tree.delete(*self.tree.get_children())
        
        # Filtered items'ları ekle
        parent_map = {}
        items_by_level = {}
        
        for item in self.filtered_items:
            level = item.level
            if level not in items_by_level:
                items_by_level[level] = []
            items_by_level[level].append(item)
        
        for level in sorted(items_by_level.keys()):
            for item in items_by_level[level]:
                parent_id = self._find_parent_id(item, parent_map)
                tree_item_id = self._add_tree_item(item, parent_id)
                parent_map[item.assembly_path] = tree_item_id
        
        self._update_status()
    
    def _update_status(self):
        """Status bar'ı güncelle"""
        if not self.bom_structure:
            self.status_label.config(text="BOM yüklenmedi")
            return
        
        total_items = len(self.bom_structure.items)
        filtered_items = len(self.filtered_items)
        
        status_text = f"Toplam: {total_items} item"
        if filtered_items != total_items:
            status_text += f" | Gösterilen: {filtered_items} item"
        
        if self.bom_structure.statistics:
            stats = self.bom_structure.statistics
            parts = stats.get('total_parts', 0)
            assemblies = stats.get('total_assemblies', 0)
            status_text += f" | Parts: {parts} | Assemblies: {assemblies}"
        
        self.status_label.config(text=status_text)
    
    def _on_tree_select(self, event):
        """TreeView selection değiştiğinde"""
        selection = self.tree.selection()
        if selection and self.on_item_selected:
            tree_item_id = selection[0]
            item = self.tree.set(tree_item_id, 'item_ref')
            self.on_item_selected(item)
    
    def _on_tree_double_click(self, event):
        """TreeView double click"""
        item = self.tree.identify('item', event.x, event.y)
        if item and self.on_item_double_click:
            bom_item = self.tree.set(item, 'item_ref')
            self.on_item_double_click(bom_item)
    
    def _on_tree_right_click(self, event):
        """TreeView right click - context menu"""
        item = self.tree.identify('item', event.x, event.y)
        if item:
            self.tree.selection_set(item)
            self.context_menu.post(event.x_root, event.y_root)
    
    def _expand_all(self):
        """Tüm node'ları genişlet"""
        def expand_children(item):
            self.tree.item(item, open=True)
            for child in self.tree.get_children(item):
                expand_children(child)
        
        for item in self.tree.get_children():
            expand_children(item)
    
    def _collapse_all(self):
        """Tüm node'ları kapat"""
        def collapse_children(item):
            self.tree.item(item, open=False)
            for child in self.tree.get_children(item):
                collapse_children(child)
        
        for item in self.tree.get_children():
            collapse_children(item)
    
    def _expand_selected(self):
        """Seçili node'u genişlet"""
        selection = self.tree.selection()
        if selection:
            self.tree.item(selection[0], open=True)
    
    def _collapse_selected(self):
        """Seçili node'u kapat"""
        selection = self.tree.selection()
        if selection:
            self.tree.item(selection[0], open=False)
    
    def _refresh_tree(self):
        """Tree'yi yenile"""
        if self.bom_structure:
            self.load_bom(self.bom_structure)
    
    def _show_item_details(self):
        """Seçili item'ın detaylarını göster"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item = self.tree.set(selection[0], 'item_ref')
        if not isinstance(item, BOMItemV2):
            return
        
        # Detail dialog
        detail_window = tk.Toplevel(self.parent)
        detail_window.title(f"Part Detayları - {item.part_name}")
        detail_window.geometry("500x600")
        detail_window.transient(self.parent)
        
        # Scrollable text
        text_widget = tk.Text(detail_window, wrap='word', font=('Consolas', 10))
        scrollbar = ttk.Scrollbar(detail_window, command=text_widget.yview)
        text_widget.configure(yscrollcommand=scrollbar.set)
        
        # Content
        details = f"""Part Detayları
{'='*50}

Temel Bilgiler:
• Part Number: {item.part_number}
• Part Name: {item.part_name}
• Description: {item.description}
• Quantity: {item.quantity}
• Level: {item.level}
• Parent Assembly: {item.parent_assembly}

Tip ve Kategori:
• Node Type: {item.node_type}
• Shape Type: {item.shape_type}
• Category: {item.category}

Geometrik Bilgiler:
• Volume: {item.volume:.4f} mm³
• Surface Area: {item.surface_area:.4f} mm²
• Center of Mass: {item.center_of_mass}

Bounding Box:
{json.dumps(item.bounding_box, indent=2) if item.bounding_box else 'N/A'}

Boyutlar:
{json.dumps(item.dimensions, indent=2) if item.dimensions else 'N/A'}

FreeCAD Referansları:
• FreeCAD Name: {item.freecad_name}
• FreeCAD Label: {item.freecad_label}

Hiyerarşi:
• Assembly Path: {item.assembly_path}
• Instance Path: {item.instance_path}

Properties:
{json.dumps(item.properties, indent=2) if item.properties else 'N/A'}

Notlar:
{item.notes or 'N/A'}
"""
        
        text_widget.insert('1.0', details)
        text_widget.configure(state='disabled')
        
        # Pack
        text_widget.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
    
    def _copy_selected(self):
        """Seçili item'ı clipboard'a kopyala"""
        selection = self.tree.selection()
        if not selection:
            return
        
        values = self.tree.item(selection[0])['values']
        text = '\t'.join(str(v) for v in values)
        
        self.parent.clipboard_clear()
        self.parent.clipboard_append(text)
        
        messagebox.showinfo("Kopyalandı", "Seçili satır clipboard'a kopyalandı")
    
    def _export_selected(self):
        """Seçili item'ları export et"""
        if not self.filtered_items:
            messagebox.showwarning("Export", "Export edilecek item yok")
            return
        
        # File dialog
        file_path = filedialog.asksaveasfilename(
            title="BOM Export",
            defaultextension=".csv",
            filetypes=[
                ("CSV files", "*.csv"),
                ("JSON files", "*.json"),
                ("All files", "*.*")
            ]
        )
        
        if not file_path:
            return
        
        try:
            if file_path.endswith('.json'):
                self._export_json(file_path)
            else:
                self._export_csv(file_path)
            
            messagebox.showinfo("Export", f"Export tamamlandı:\n{file_path}")
        
        except Exception as e:
            messagebox.showerror("Export Hatası", f"Export başarısız:\n{str(e)}")
    
    def _export_selected_item(self):
        """Sadece seçili item'ı export et"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item = self.tree.set(selection[0], 'item_ref')
        if not isinstance(item, BOMItemV2):
            return
        
        # Single item export
        file_path = filedialog.asksaveasfilename(
            title="Part Export",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(item.__dict__, f, indent=2, ensure_ascii=False, default=str)
                
                messagebox.showinfo("Export", f"Part export tamamlandı:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Export Hatası", str(e))
    
    def _export_csv(self, file_path: str):
        """CSV export"""
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'item_number', 'part_number', 'part_name', 'description',
                'quantity', 'level', 'parent_assembly', 'node_type',
                'shape_type', 'volume', 'surface_area', 'category'
            ]
            
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for item in self.filtered_items:
                writer.writerow({
                    'item_number': item.item_number,
                    'part_number': item.part_number,
                    'part_name': item.part_name,
                    'description': item.description,
                    'quantity': item.quantity,
                    'level': item.level,
                    'parent_assembly': item.parent_assembly,
                    'node_type': item.node_type,
                    'shape_type': item.shape_type,
                    'volume': item.volume,
                    'surface_area': item.surface_area,
                    'category': item.category
                })
    
    def _export_json(self, file_path: str):
        """JSON export"""
        export_data = {
            'export_info': {
                'assembly_name': self.bom_structure.assembly_name if self.bom_structure else 'Unknown',
                'total_items': len(self.filtered_items),
                'export_timestamp': str(tk.datetime.datetime.now())
            },
            'items': [item.__dict__ for item in self.filtered_items]
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
    
    def _show_part_image(self):
        """Part resmini göster (placeholder)"""
        messagebox.showinfo("Part Resmi", "Part resim görüntüleme özelliği Phase 5'te geliştirilecek")
    
    def set_item_selected_callback(self, callback: Callable):
        """Item seçim callback'i ayarla"""
        self.on_item_selected = callback
    
    def set_item_double_click_callback(self, callback: Callable):
        """Item double click callback'i ayarla"""
        self.on_item_double_click = callback
    
    def get_selected_item(self) -> Optional[BOMItemV2]:
        """Seçili item'ı döndür"""
        selection = self.tree.selection()
        if selection:
            return self.tree.set(selection[0], 'item_ref')
        return None
    
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
def test_bom_tree_view():
    """BOM TreeView test"""
    root = tk.Tk()
    root.title("BOM TreeView Test")
    root.geometry("1200x800")
    
    # Mock BOM data
    from core.bom_extractor_v2 import BOMStructureV2, BOMItemV2
    from datetime import datetime
    
    # Create sample items
    items = [
        BOMItemV2(
            item_number=1,
            part_number="ASM_001",
            part_name="Main Assembly",
            description="Root assembly",
            quantity=1,
            level=0,
            parent_assembly="ROOT",
            node_type="assembly",
            assembly_path="Main_Assembly",
            category="Assembly"
        ),
        BOMItemV2(
            item_number=2,
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
            category="Solid Parts"
        ),
        BOMItemV2(
            item_number=3,
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
            category="Sheet Metal"
        )
    ]
    
    # Create BOM structure
    bom_structure = BOMStructureV2(
        assembly_name="Test Assembly",
        total_items=3,
        total_parts=2,
        total_assemblies=1,
        max_level=1,
        created_date=datetime.now(),
        source_file="test.step",
        items=items,
        statistics={
            'total_parts': 2,
            'total_assemblies': 1,
            'volume_stats': {
                'total': 1275.8,
                'average': 637.9
            }
        }
    )
    
    # Create widget
    tree_widget = BOMTreeViewWidget(root)
    tree_widget.load_bom(bom_structure)
    
    # Callbacks
    def on_select(item):
        print(f"Selected: {item.part_name if hasattr(item, 'part_name') else item}")
    
    def on_double_click(item):
        print(f"Double clicked: {item.part_name if hasattr(item, 'part_name') else item}")
    
    tree_widget.set_item_selected_callback(on_select)
    tree_widget.set_item_double_click_callback(on_double_click)
    
    root.mainloop()


if __name__ == "__main__":
    test_bom_tree_view()