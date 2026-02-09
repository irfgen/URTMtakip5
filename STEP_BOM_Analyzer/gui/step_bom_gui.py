"""
STEP BOM GUI Application
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül tkinter tabanlı basit GUI sağlar.
İleri versiyonlarda daha advanced GUI framework'e geçilecek.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import os
import sys
from pathlib import Path
import threading
import json
from typing import Optional
import logging

# Ana dizini sys.path'e ekle
sys.path.append(str(Path(__file__).parent.parent))

try:
    from api import StepBomAPI
    from api.step_bom_api import AnalysisOptions, AnalysisResult
except ImportError as e:
    print(f"API import hatası: {e}")
    print("STEP BOM Analyzer core modülleri bulunamadı")
    sys.exit(1)

class StepBomGUI:
    """STEP BOM Analyzer GUI Sınıfı"""
    
    def __init__(self):
        # Ana window
        self.root = tk.Tk()
        self.root.title("STEP BOM Analyzer v3.0 - FreeCAD Native")
        self.root.geometry("900x700")
        self.root.minsize(800, 600)
        
        # Icon ayarla (eğer varsa)
        try:
            icon_path = Path(__file__).parent.parent / "assets" / "icon.ico"
            if icon_path.exists():
                self.root.iconbitmap(str(icon_path))
        except:
            pass
        
        # API instance
        try:
            self.api = StepBomAPI()
            self.api_available = True
        except Exception as e:
            self.api = None
            self.api_available = False
            print(f"API başlatma hatası: {e}")
        
        # Variables
        self.step_file_path = tk.StringVar()
        self.output_dir_path = tk.StringVar(value=str(Path.home() / "Documents" / "STEP_Analysis"))
        self.analysis_running = False
        
        # Analysis options
        self.enable_rendering = tk.BooleanVar(value=True)
        self.quick_mode = tk.BooleanVar(value=False)
        self.include_images = tk.BooleanVar(value=True)
        self.export_html = tk.BooleanVar(value=True)
        self.export_json = tk.BooleanVar(value=True)
        
        # GUI Setup
        self.setup_gui()
        
        # Status check
        if not self.api_available:
            self.log_message("❌ API başlatılamadı. Core modülleri kontrol edin.", "error")
        else:
            self.log_message("✅ STEP BOM Analyzer GUI başlatıldı", "info")
            self.check_installation()
    
    def setup_gui(self):
        """GUI bileşenlerini oluştur"""
        
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="STEP BOM Analyzer v3.0",
            font=("Arial", 16, "bold")
        )
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 10))
        
        subtitle_label = ttk.Label(
            main_frame,
            text="FreeCAD Native Edition - Professional STEP Analysis",
            font=("Arial", 10)
        )
        subtitle_label.grid(row=1, column=0, columnspan=3, pady=(0, 20))
        
        # File selection frame
        file_frame = ttk.LabelFrame(main_frame, text="STEP File Selection", padding="10")
        file_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        file_frame.columnconfigure(1, weight=1)
        
        ttk.Label(file_frame, text="STEP File:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        ttk.Entry(file_frame, textvariable=self.step_file_path).grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))
        ttk.Button(file_frame, text="Browse", command=self.browse_step_file).grid(row=0, column=2)
        
        ttk.Label(file_frame, text="Output Dir:").grid(row=1, column=0, sticky=tk.W, padx=(0, 10), pady=(10, 0))
        ttk.Entry(file_frame, textvariable=self.output_dir_path).grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(0, 10), pady=(10, 0))
        ttk.Button(file_frame, text="Browse", command=self.browse_output_dir).grid(row=1, column=2, pady=(10, 0))
        
        # Options frame
        options_frame = ttk.LabelFrame(main_frame, text="Analysis Options", padding="10")
        options_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Options - Left column
        options_left = ttk.Frame(options_frame)
        options_left.grid(row=0, column=0, sticky=(tk.W, tk.N), padx=(0, 20))
        
        ttk.Checkbutton(options_left, text="Enable 3D Rendering", variable=self.enable_rendering).grid(row=0, column=0, sticky=tk.W)
        ttk.Checkbutton(options_left, text="Quick Mode (Fast)", variable=self.quick_mode).grid(row=1, column=0, sticky=tk.W)
        ttk.Checkbutton(options_left, text="Include Images in Report", variable=self.include_images).grid(row=2, column=0, sticky=tk.W)
        
        # Options - Right column
        options_right = ttk.Frame(options_frame)
        options_right.grid(row=0, column=1, sticky=(tk.W, tk.N))
        
        ttk.Label(options_right, text="Export Formats:", font=("Arial", 10, "bold")).grid(row=0, column=0, sticky=tk.W, pady=(0, 5))
        ttk.Checkbutton(options_right, text="HTML Report", variable=self.export_html).grid(row=1, column=0, sticky=tk.W)
        ttk.Checkbutton(options_right, text="JSON Data", variable=self.export_json).grid(row=2, column=0, sticky=tk.W)
        
        # Buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.grid(row=4, column=0, columnspan=3, pady=(0, 10))
        
        self.analyze_button = ttk.Button(
            buttons_frame, 
            text="🚀 Analyze STEP File", 
            command=self.start_analysis,
            style="Accent.TButton"
        )
        self.analyze_button.grid(row=0, column=0, padx=(0, 10))
        
        ttk.Button(
            buttons_frame,
            text="🧪 System Test",
            command=self.run_system_test
        ).grid(row=0, column=1, padx=(0, 10))
        
        ttk.Button(
            buttons_frame,
            text="📁 Open Output",
            command=self.open_output_directory
        ).grid(row=0, column=2, padx=(0, 10))
        
        ttk.Button(
            buttons_frame,
            text="ℹ️ About",
            command=self.show_about
        ).grid(row=0, column=3)
        
        # Progress frame
        progress_frame = ttk.Frame(main_frame)
        progress_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        progress_frame.columnconfigure(0, weight=1)
        
        self.progress_var = tk.StringVar(value="Ready to analyze STEP files")
        ttk.Label(progress_frame, textvariable=self.progress_var).grid(row=0, column=0, sticky=tk.W)
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='indeterminate')
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(5, 0))
        
        # Log frame
        log_frame = ttk.LabelFrame(main_frame, text="Analysis Log", padding="10")
        log_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        main_frame.rowconfigure(6, weight=1)
        
        # Log text area
        self.log_text = scrolledtext.ScrolledText(
            log_frame, 
            height=15, 
            font=("Consolas", 9),
            state=tk.DISABLED
        )
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Log buttons
        log_buttons = ttk.Frame(log_frame)
        log_buttons.grid(row=1, column=0, sticky=tk.W, pady=(10, 0))
        
        ttk.Button(log_buttons, text="Clear Log", command=self.clear_log).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(log_buttons, text="Save Log", command=self.save_log).grid(row=0, column=1)
    
    def browse_step_file(self):
        """STEP dosyası seç"""
        filename = filedialog.askopenfilename(
            title="Select STEP File",
            filetypes=[
                ("STEP files", "*.step *.stp"),
                ("All files", "*.*")
            ]
        )
        if filename:
            self.step_file_path.set(filename)
            self.log_message(f"📁 STEP file selected: {os.path.basename(filename)}", "info")
    
    def browse_output_dir(self):
        """Output dizini seç"""
        directory = filedialog.askdirectory(title="Select Output Directory")
        if directory:
            self.output_dir_path.set(directory)
            self.log_message(f"📂 Output directory: {directory}", "info")
    
    def check_installation(self):
        """Installation kontrolü yap"""
        if not self.api_available:
            return
        
        try:
            test_result = self.api.test_installation()
            if test_result["success"]:
                freecad_version = "Unknown"
                try:
                    freecad_data = test_result["freecad_test"]["data"]
                    if freecad_data:
                        version_info = freecad_data.get("freecad_version", {}).get("build_info", {})
                        freecad_version = version_info.get("version_string", "Unknown")
                except:
                    pass
                
                self.log_message(f"✅ Installation OK - FreeCAD v{freecad_version}", "success")
            else:
                self.log_message(f"⚠️ Installation warning: {test_result.get('error', 'Unknown')}", "warning")
        
        except Exception as e:
            self.log_message(f"❌ Installation check error: {e}", "error")
    
    def start_analysis(self):
        """Analizi başlat"""
        if self.analysis_running:
            messagebox.showwarning("Analysis Running", "Analysis already in progress!")
            return
        
        step_file = self.step_file_path.get().strip()
        output_dir = self.output_dir_path.get().strip()
        
        if not step_file:
            messagebox.showerror("Error", "Please select a STEP file!")
            return
        
        if not os.path.exists(step_file):
            messagebox.showerror("Error", f"STEP file not found: {step_file}")
            return
        
        if not output_dir:
            messagebox.showerror("Error", "Please specify output directory!")
            return
        
        if not self.api_available:
            messagebox.showerror("Error", "API not available! Check installation.")
            return
        
        # Analysis'i thread'de çalıştır
        self.analysis_running = True
        self.analyze_button.config(state=tk.DISABLED, text="🔄 Analyzing...")
        self.progress_bar.start()
        
        analysis_thread = threading.Thread(
            target=self._run_analysis,
            args=(step_file, output_dir),
            daemon=True
        )
        analysis_thread.start()
    
    def _run_analysis(self, step_file: str, output_dir: str):
        """Analysis'i background thread'de çalıştır"""
        try:
            self.log_message("🚀 Starting STEP analysis...", "info")
            self.log_message(f"📁 File: {os.path.basename(step_file)}", "info")
            self.log_message(f"📂 Output: {output_dir}", "info")
            
            # Analysis options oluştur
            export_formats = []
            if self.export_html.get():
                export_formats.append("html")
            if self.export_json.get():
                export_formats.append("json")
            
            options = AnalysisOptions(
                enable_rendering=self.enable_rendering.get(),
                include_images=self.include_images.get(),
                export_formats=export_formats,
                quick_mode=self.quick_mode.get()
            )
            
            # Analysis çalıştır
            result = self.api.analyze_step_file(step_file, output_dir, options)
            
            # UI thread'de sonuç göster
            self.root.after(0, self._analysis_completed, result)
        
        except Exception as e:
            self.root.after(0, self._analysis_failed, str(e))
    
    def _analysis_completed(self, result: AnalysisResult):
        """Analysis tamamlandığında UI'yi güncelle"""
        self.analysis_running = False
        self.analyze_button.config(state=tk.NORMAL, text="🚀 Analyze STEP File")
        self.progress_bar.stop()
        
        if result.success:
            self.log_message("✅ Analysis completed successfully!", "success")
            self.log_message(f"⏱️ Execution time: {result.execution_time:.2f}s", "info")
            self.log_message(f"📁 Output directory: {result.output_directory}", "info")
            self.log_message(f"📋 Generated reports: {len(result.generated_reports)}", "info")
            
            # Summary göster
            try:
                summary = self.api.get_analysis_summary(result)
                if "step_analysis" in summary:
                    step_info = summary["step_analysis"]
                    self.log_message(f"📊 Objects: {step_info.get('total_objects', 0)}", "info")
                    self.log_message(f"🔧 Parts: {step_info.get('parts_count', 0)}", "info")
                    self.log_message(f"🏗️ Assemblies: {step_info.get('assemblies_count', 0)}", "info")
                
                if "bom_analysis" in summary:
                    bom_info = summary["bom_analysis"]
                    self.log_message(f"📦 Unique Parts: {bom_info.get('unique_parts', 0)}", "info")
                    self.log_message(f"📏 Max Depth: {bom_info.get('max_hierarchy_depth', 0)}", "info")
            
            except Exception as e:
                self.log_message(f"⚠️ Summary error: {e}", "warning")
            
            # Success messagebox
            messagebox.showinfo(
                "Analysis Complete",
                f"STEP analysis completed successfully!\n\n"
                f"Output directory: {result.output_directory}\n"
                f"Reports generated: {len(result.generated_reports)}\n"
                f"Execution time: {result.execution_time:.2f}s"
            )
            
            self.progress_var.set("Analysis completed successfully!")
        
        else:
            self.log_message(f"❌ Analysis failed: {result.error}", "error")
            messagebox.showerror("Analysis Failed", f"Analysis failed:\n{result.error}")
            self.progress_var.set("Analysis failed")
    
    def _analysis_failed(self, error: str):
        """Analysis başarısız olduğunda UI'yi güncelle"""
        self.analysis_running = False
        self.analyze_button.config(state=tk.NORMAL, text="🚀 Analyze STEP File")
        self.progress_bar.stop()
        
        self.log_message(f"❌ Analysis failed: {error}", "error")
        messagebox.showerror("Analysis Failed", f"Analysis failed:\n{error}")
        self.progress_var.set("Analysis failed")
    
    def run_system_test(self):
        """System test çalıştır"""
        if not self.api_available:
            messagebox.showerror("Error", "API not available!")
            return
        
        self.log_message("🧪 Running system test...", "info")
        
        def test_thread():
            try:
                test_result = self.api.test_installation()
                self.root.after(0, self._system_test_completed, test_result)
            except Exception as e:
                self.root.after(0, self._system_test_failed, str(e))
        
        threading.Thread(target=test_thread, daemon=True).start()
    
    def _system_test_completed(self, test_result: dict):
        """System test tamamlandığında sonucu göster"""
        if test_result["success"]:
            self.log_message("✅ System test passed!", "success")
            
            # FreeCAD info
            try:
                freecad_test = test_result["freecad_test"]
                if freecad_test["success"]:
                    freecad_data = freecad_test.get("data", {})
                    version_info = freecad_data.get("freecad_version", {}).get("build_info", {})
                    freecad_version = version_info.get("version_string", "Unknown")
                    
                    self.log_message(f"🔧 FreeCAD Version: {freecad_version}", "info")
                    self.log_message(f"⏱️ Test Time: {freecad_test['execution_time']:.2f}s", "info")
            except Exception as e:
                self.log_message(f"⚠️ Test info error: {e}", "warning")
            
            messagebox.showinfo("System Test", "System test passed successfully!")
        
        else:
            self.log_message(f"❌ System test failed: {test_result.get('error', 'Unknown error')}", "error")
            messagebox.showerror("System Test", f"System test failed:\n{test_result.get('error', 'Unknown error')}")
    
    def _system_test_failed(self, error: str):
        """System test başarısız olduğunda hata göster"""
        self.log_message(f"❌ System test exception: {error}", "error")
        messagebox.showerror("System Test", f"System test failed:\n{error}")
    
    def open_output_directory(self):
        """Output dizinini aç"""
        output_dir = self.output_dir_path.get().strip()
        if output_dir and os.path.exists(output_dir):
            os.startfile(output_dir)
            self.log_message(f"📁 Opened: {output_dir}", "info")
        else:
            messagebox.showwarning("Warning", "Output directory does not exist!")
    
    def show_about(self):
        """About dialog göster"""
        about_text = """STEP BOM Analyzer v3.0
FreeCAD Native Edition

Professional STEP file analysis tool with:
• Hierarchical BOM extraction
• 3D part rendering  
• Multi-format exports (HTML, JSON, CSV)
• Zero-configuration Windows installer

Powered by FreeCAD Python API
© 2025 ÜRTM Takip Ekibi"""
        
        messagebox.showinfo("About", about_text)
    
    def log_message(self, message: str, level: str = "info"):
        """Log mesajı ekle"""
        timestamp = tk.datetime.datetime.now().strftime("%H:%M:%S")
        
        # Color coding
        colors = {
            "info": "black",
            "success": "green", 
            "warning": "orange",
            "error": "red"
        }
        
        color = colors.get(level, "black")
        
        # UI thread'de log güncelle
        def update_log():
            self.log_text.config(state=tk.NORMAL)
            self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
            self.log_text.config(state=tk.DISABLED)
            self.log_text.see(tk.END)
        
        if threading.current_thread() == threading.main_thread():
            update_log()
        else:
            self.root.after(0, update_log)
    
    def clear_log(self):
        """Log'u temizle"""
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state=tk.DISABLED)
        self.log_message("Log cleared", "info")
    
    def save_log(self):
        """Log'u dosyaya kaydet"""
        filename = filedialog.asksaveasfilename(
            title="Save Log",
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    log_content = self.log_text.get(1.0, tk.END)
                    f.write(log_content)
                
                self.log_message(f"💾 Log saved: {filename}", "info")
                messagebox.showinfo("Save Log", f"Log saved successfully:\n{filename}")
            
            except Exception as e:
                self.log_message(f"❌ Log save error: {e}", "error")
                messagebox.showerror("Save Error", f"Failed to save log:\n{e}")
    
    def run(self):
        """GUI'yi başlat"""
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            self.root.destroy()

def main():
    """Ana GUI fonksiyonu"""
    try:
        # Import tkinter datetime for log timestamps
        import datetime
        tk.datetime = datetime
        
        app = StepBomGUI()
        app.run()
    
    except Exception as e:
        print(f"GUI başlatma hatası: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()