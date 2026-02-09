"""
Workflow GUI Integration Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül Workflow Orchestrator'ı GUI ile entegre eder.
Real-time progress tracking ve advanced workflow control sağlar.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import sys
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

# Ana dizini sys.path'e ekle
sys.path.append(str(Path(__file__).parent.parent))

try:
    from core.workflow_orchestrator import (
        WorkflowOrchestrator, WorkflowProgress, WorkflowResult, WorkflowState
    )
    from api import StepBomAPI
    ORCHESTRATOR_AVAILABLE = True
except ImportError as e:
    print(f"Import hatası: {e}")
    print("Workflow dependencies bulunamadı")
    ORCHESTRATOR_AVAILABLE = False
    
    # Define placeholder classes for type hints
    class WorkflowOrchestrator: pass
    class WorkflowProgress: pass
    class WorkflowResult: pass
    class WorkflowState: pass

class WorkflowProgressDialog:
    """Advanced Workflow Progress Dialog"""
    
    def __init__(self, parent, workflow_name: str, orchestrator):
        self.parent = parent
        self.workflow_name = workflow_name
        self.orchestrator = orchestrator
        self.result = None
        self.cancelled = False
        
        # Dialog window
        self.dialog = tk.Toplevel(parent)
        self.dialog.title(f"Workflow Progress - {workflow_name}")
        self.dialog.geometry("600x500")
        self.dialog.minsize(500, 400)
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Center dialog
        self.dialog.geometry("+%d+%d" % (parent.winfo_rootx() + 50, parent.winfo_rooty() + 50))
        
        self.setup_ui()
        
        # Progress callback
        if hasattr(self.orchestrator, 'add_progress_callback'):
            self.orchestrator.add_progress_callback(self.on_progress_update)
    
    def setup_ui(self):
        """UI bileşenlerini oluştur"""
        main_frame = ttk.Frame(self.dialog, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 15))
        
        title_label = ttk.Label(
            header_frame, 
            text=f"Workflow: {self.workflow_name}",
            font=("Arial", 14, "bold")
        )
        title_label.pack(anchor=tk.W)
        
        # Progress Info Frame
        info_frame = ttk.LabelFrame(main_frame, text="Progress Information", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Current Step
        self.current_step_var = tk.StringVar(value="Preparing...")
        ttk.Label(info_frame, text="Current Step:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        ttk.Label(info_frame, textvariable=self.current_step_var, font=("Arial", 10, "bold")).grid(row=0, column=1, sticky=tk.W)
        
        # Step Description
        self.step_desc_var = tk.StringVar(value="Initializing workflow...")
        ttk.Label(info_frame, text="Description:").grid(row=1, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        desc_label = ttk.Label(info_frame, textvariable=self.step_desc_var, wraplength=400)
        desc_label.grid(row=1, column=1, sticky=tk.W, pady=(5, 0))
        
        # Progress percentage
        self.progress_percent_var = tk.StringVar(value="0%")
        ttk.Label(info_frame, text="Progress:").grid(row=2, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        ttk.Label(info_frame, textvariable=self.progress_percent_var, font=("Arial", 10, "bold")).grid(row=2, column=1, sticky=tk.W, pady=(5, 0))
        
        # Execution time
        self.exec_time_var = tk.StringVar(value="0.0s")
        ttk.Label(info_frame, text="Elapsed Time:").grid(row=3, column=0, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        ttk.Label(info_frame, textvariable=self.exec_time_var).grid(row=3, column=1, sticky=tk.W, pady=(5, 0))
        
        # Progress Bar
        progress_frame = ttk.Frame(main_frame)
        progress_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='determinate', length=400)
        self.progress_bar.pack(fill=tk.X)
        
        # State indicator
        self.state_var = tk.StringVar(value="PREPARING")
        state_frame = ttk.Frame(main_frame)
        state_frame.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(state_frame, text="State:").pack(side=tk.LEFT)
        self.state_label = ttk.Label(state_frame, textvariable=self.state_var, font=("Arial", 10, "bold"), foreground="blue")
        self.state_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # Activity Log
        log_frame = ttk.LabelFrame(main_frame, text="Activity Log", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        # Log text with scrollbar
        log_text_frame = ttk.Frame(log_frame)
        log_text_frame.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = tk.Text(
            log_text_frame, 
            height=10, 
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED
        )
        
        log_scrollbar = ttk.Scrollbar(log_text_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.config(yscrollcommand=log_scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X)
        
        self.cancel_button = ttk.Button(button_frame, text="Cancel Workflow", command=self.cancel_workflow)
        self.cancel_button.pack(side=tk.LEFT)
        
        self.close_button = ttk.Button(button_frame, text="Close", command=self.close_dialog, state=tk.DISABLED)
        self.close_button.pack(side=tk.RIGHT)
        
        # Protocol for window close
        self.dialog.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Start time tracking
        self.start_time = time.time()
        self.update_elapsed_time()
    
    def log_message(self, message: str, level: str = "info"):
        """Log mesajı ekle"""
        timestamp = time.strftime("%H:%M:%S")
        
        # Color mapping
        color_map = {
            "info": "black",
            "success": "green",
            "warning": "orange", 
            "error": "red"
        }
        
        def update_log():
            self.log_text.config(state=tk.NORMAL)
            self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
            
            # Color the last line
            last_line = self.log_text.index(tk.END + "-1c linestart")
            self.log_text.tag_add(level, last_line, tk.END + "-1c")
            self.log_text.tag_config(level, foreground=color_map.get(level, "black"))
            
            self.log_text.config(state=tk.DISABLED)
            self.log_text.see(tk.END)
        
        if threading.current_thread() == threading.main_thread():
            update_log()
        else:
            self.dialog.after(0, update_log)
    
    def on_progress_update(self, progress: WorkflowProgress):
        """Progress callback"""
        def update_ui():
            try:
                # Update progress info
                self.current_step_var.set(f"Step {progress.current_step}/{progress.total_steps}: {progress.step_name}")
                self.step_desc_var.set(progress.step_description)
                self.progress_percent_var.set(f"{progress.progress_percentage:.1f}%")
                
                # Update progress bar
                self.progress_bar['value'] = progress.progress_percentage
                
                # Update state
                state_colors = {
                    WorkflowState.PREPARING: "blue",
                    WorkflowState.STEP_IMPORT: "purple", 
                    WorkflowState.BOM_EXTRACTION: "orange",
                    WorkflowState.PART_RENDERING: "cyan",
                    WorkflowState.REPORT_GENERATION: "magenta",
                    WorkflowState.FINALIZING: "blue",
                    WorkflowState.COMPLETED: "green",
                    WorkflowState.FAILED: "red",
                    WorkflowState.CANCELLED: "gray"
                }
                
                state_name = progress.current_state.value.upper()
                self.state_var.set(state_name)
                self.state_label.config(foreground=state_colors.get(progress.current_state, "black"))
                
                # Log progress
                if progress.step_description:
                    if progress.current_state == WorkflowState.COMPLETED:
                        self.log_message(f"✅ {progress.step_description}", "success")
                        self.workflow_completed()
                    elif progress.current_state == WorkflowState.FAILED:
                        self.log_message(f"❌ {progress.step_description}", "error")
                        self.workflow_failed(progress.error_message)
                    elif progress.current_state == WorkflowState.CANCELLED:
                        self.log_message("🛑 Workflow cancelled", "warning")
                        self.workflow_cancelled()
                    else:
                        self.log_message(f"🔄 {progress.step_description}", "info")
                
                # Update warnings
                if progress.warnings:
                    for warning in progress.warnings:
                        self.log_message(f"⚠️ {warning}", "warning")
            
            except Exception as e:
                print(f"Progress update error: {e}")
        
        if threading.current_thread() == threading.main_thread():
            update_ui()
        else:
            self.dialog.after(0, update_ui)
    
    def update_elapsed_time(self):
        """Elapsed time'ı güncelle"""
        if hasattr(self, 'start_time'):
            elapsed = time.time() - self.start_time
            self.exec_time_var.set(f"{elapsed:.1f}s")
        
        # Her saniye güncelle
        self.dialog.after(1000, self.update_elapsed_time)
    
    def cancel_workflow(self):
        """Workflow'u iptal et"""
        if not self.cancelled:
            result = messagebox.askyesno(
                "Cancel Workflow", 
                "Are you sure you want to cancel the workflow?\n\nThis action cannot be undone.",
                parent=self.dialog
            )
            
            if result:
                self.cancelled = True
                self.cancel_button.config(state=tk.DISABLED)
                self.log_message("🛑 Cancellation requested...", "warning")
                
                # Orchestrator'a cancel sinyali gönder
                self.orchestrator.cancel_workflow()
    
    def workflow_completed(self):
        """Workflow tamamlandı"""
        self.cancel_button.config(state=tk.DISABLED)
        self.close_button.config(state=tk.NORMAL)
        self.log_message("🎉 Workflow completed successfully!", "success")
        
        # Auto-close after 5 seconds (optional)
        # self.dialog.after(5000, self.close_dialog)
    
    def workflow_failed(self, error: str):
        """Workflow başarısız"""
        self.cancel_button.config(state=tk.DISABLED)
        self.close_button.config(state=tk.NORMAL)
        self.log_message(f"💥 Workflow failed: {error}", "error")
    
    def workflow_cancelled(self):
        """Workflow iptal edildi"""
        self.cancel_button.config(state=tk.DISABLED)
        self.close_button.config(state=tk.NORMAL)
        self.log_message("🚫 Workflow cancelled", "warning")
    
    def close_dialog(self):
        """Dialog'u kapat"""
        # Progress callback'i kaldır
        try:
            self.orchestrator.remove_progress_callback(self.on_progress_update)
        except:
            pass
        
        self.dialog.destroy()
    
    def on_closing(self):
        """Window kapatıldığında"""
        if not self.cancelled and self.orchestrator.is_running:
            result = messagebox.askyesno(
                "Close Dialog",
                "Workflow is still running. Do you want to cancel it?",
                parent=self.dialog
            )
            
            if result:
                self.cancel_workflow()
                self.close_dialog()
        else:
            self.close_dialog()

class AdvancedWorkflowGUI:
    """Advanced Workflow Management GUI"""
    
    def __init__(self, parent_frame):
        self.parent_frame = parent_frame
        self.orchestrator = None
        self.api = None
        
        # Initialize components
        try:
            self.orchestrator = WorkflowOrchestrator()
            self.api = StepBomAPI()
            self.workflow_available = True
        except Exception as e:
            print(f"Workflow initialization error: {e}")
            self.workflow_available = False
        
        self.setup_ui()
    
    def setup_ui(self):
        """UI bileşenlerini oluştur"""
        # Main workflow frame
        workflow_frame = ttk.LabelFrame(self.parent_frame, text="Advanced Workflow Management", padding="10")
        workflow_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        if not self.workflow_available:
            # Error message
            error_label = ttk.Label(
                workflow_frame, 
                text="❌ Workflow system not available. Check core dependencies.",
                foreground="red"
            )
            error_label.pack(pady=20)
            return
        
        # Workflow selection
        selection_frame = ttk.Frame(workflow_frame)
        selection_frame.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(selection_frame, text="Select Workflow:").pack(side=tk.LEFT)
        
        self.workflow_var = tk.StringVar()
        self.workflow_combo = ttk.Combobox(
            selection_frame, 
            textvariable=self.workflow_var,
            state="readonly",
            width=20
        )
        self.workflow_combo.pack(side=tk.LEFT, padx=(10, 0))
        self.workflow_combo.bind("<<ComboboxSelected>>", self.on_workflow_selected)
        
        # Load available workflows
        self.load_workflows()
        
        # Workflow info display
        info_frame = ttk.LabelFrame(workflow_frame, text="Workflow Information", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.workflow_info_text = tk.Text(
            info_frame, 
            height=6, 
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED
        )
        self.workflow_info_text.pack(fill=tk.BOTH, expand=True)
        
        # Parameters frame
        params_frame = ttk.LabelFrame(workflow_frame, text="Parameters", padding="10")
        params_frame.pack(fill=tk.X, pady=(0, 15))
        
        # STEP file selection
        step_file_frame = ttk.Frame(params_frame)
        step_file_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Label(step_file_frame, text="STEP File:").pack(side=tk.LEFT)
        self.step_file_var = tk.StringVar()
        ttk.Entry(step_file_frame, textvariable=self.step_file_var).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 10))
        ttk.Button(step_file_frame, text="Browse", command=self.browse_step_file).pack(side=tk.RIGHT)
        
        # Output directory selection
        output_dir_frame = ttk.Frame(params_frame)
        output_dir_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Label(output_dir_frame, text="Output Dir:").pack(side=tk.LEFT)
        self.output_dir_var = tk.StringVar(value=str(Path.home() / "Documents" / "STEP_Analysis"))
        ttk.Entry(output_dir_frame, textvariable=self.output_dir_var).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 10))
        ttk.Button(output_dir_frame, text="Browse", command=self.browse_output_dir).pack(side=tk.RIGHT)
        
        # Advanced options
        options_frame = ttk.LabelFrame(workflow_frame, text="Options", padding="10")
        options_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Options checkboxes
        options_grid = ttk.Frame(options_frame)
        options_grid.pack(fill=tk.X)
        
        self.enable_rendering = tk.BooleanVar(value=True)
        self.include_images = tk.BooleanVar(value=True)
        self.export_html = tk.BooleanVar(value=True)
        self.export_json = tk.BooleanVar(value=True)
        
        ttk.Checkbutton(options_grid, text="Enable 3D Rendering", variable=self.enable_rendering).grid(row=0, column=0, sticky=tk.W, padx=(0, 20))
        ttk.Checkbutton(options_grid, text="Include Images", variable=self.include_images).grid(row=0, column=1, sticky=tk.W)
        ttk.Checkbutton(options_grid, text="Export HTML", variable=self.export_html).grid(row=1, column=0, sticky=tk.W, padx=(0, 20))
        ttk.Checkbutton(options_grid, text="Export JSON", variable=self.export_json).grid(row=1, column=1, sticky=tk.W)
        
        # Action buttons
        button_frame = ttk.Frame(workflow_frame)
        button_frame.pack(fill=tk.X)
        
        self.execute_button = ttk.Button(
            button_frame, 
            text="🚀 Execute Workflow", 
            command=self.execute_workflow,
            style="Accent.TButton"
        )
        self.execute_button.pack(side=tk.LEFT, padx=(0, 10))
        
        ttk.Button(button_frame, text="📋 Workflow Info", command=self.show_workflow_details).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="🧪 Test System", command=self.test_system).pack(side=tk.LEFT)
    
    def load_workflows(self):
        """Mevcut workflow'ları yükle"""
        try:
            workflows = self.orchestrator.list_workflows()
            self.workflow_combo['values'] = workflows
            
            if workflows:
                self.workflow_combo.set(workflows[0])
                self.on_workflow_selected(None)
        
        except Exception as e:
            print(f"Workflow loading error: {e}")
    
    def on_workflow_selected(self, event):
        """Workflow seçildiğinde"""
        workflow_name = self.workflow_var.get()
        if not workflow_name:
            return
        
        try:
            info = self.orchestrator.get_workflow_info(workflow_name)
            if info:
                # Info text'i güncelle
                info_text = f"Workflow: {info['name']}\n"
                info_text += f"Total Steps: {info['total_steps']}\n\n"
                info_text += "Steps:\n"
                
                for i, step in enumerate(info['steps'], 1):
                    required = "✓" if step['required'] else "○"
                    info_text += f"{i:2d}. {required} {step['name']}: {step['description']}\n"
                    if step['macro_name']:
                        info_text += f"    📋 Macro: {step['macro_name']}\n"
                    elif step['function_name']:
                        info_text += f"    🔧 Function: {step['function_name']}\n"
                    info_text += f"    ⏱️  Timeout: {step['timeout']}s\n"
                
                self.workflow_info_text.config(state=tk.NORMAL)
                self.workflow_info_text.delete(1.0, tk.END)
                self.workflow_info_text.insert(1.0, info_text)
                self.workflow_info_text.config(state=tk.DISABLED)
        
        except Exception as e:
            print(f"Workflow info error: {e}")
    
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
            self.step_file_var.set(filename)
    
    def browse_output_dir(self):
        """Output dizini seç"""
        directory = filedialog.askdirectory(title="Select Output Directory")
        if directory:
            self.output_dir_var.set(directory)
    
    def execute_workflow(self):
        """Workflow'u çalıştır"""
        workflow_name = self.workflow_var.get()
        step_file = self.step_file_var.get().strip()
        output_dir = self.output_dir_var.get().strip()
        
        # Validation
        if not workflow_name:
            messagebox.showerror("Error", "Please select a workflow!")
            return
        
        if not step_file:
            messagebox.showerror("Error", "Please select a STEP file!")
            return
        
        if not Path(step_file).exists():
            messagebox.showerror("Error", f"STEP file not found: {step_file}")
            return
        
        if not output_dir:
            messagebox.showerror("Error", "Please specify output directory!")
            return
        
        # Parameters hazırla
        parameters = {
            "step_file_path": step_file,
            "output_directory": output_dir,
            "rendering": {
                "enabled": self.enable_rendering.get(),
                "include_images": self.include_images.get()
            },
            "export": {
                "formats": [],
                "include_images": self.include_images.get()
            }
        }
        
        if self.export_html.get():
            parameters["export"]["formats"].append("html")
        if self.export_json.get():
            parameters["export"]["formats"].append("json")
        
        # Progress dialog oluştur
        progress_dialog = WorkflowProgressDialog(
            self.parent_frame.winfo_toplevel(),
            workflow_name,
            self.orchestrator
        )
        
        # Workflow'u thread'de çalıştır
        def run_workflow():
            try:
                result = self.orchestrator.execute_workflow(workflow_name, parameters)
                
                # Sonucu main thread'de işle
                self.parent_frame.after(0, lambda: self.workflow_completed(result, progress_dialog))
            
            except Exception as e:
                self.parent_frame.after(0, lambda: self.workflow_failed(str(e), progress_dialog))
        
        threading.Thread(target=run_workflow, daemon=True).start()
    
    def workflow_completed(self, result, progress_dialog):
        """Workflow tamamlandı callback"""
        if result.success:
            messagebox.showinfo(
                "Workflow Complete",
                f"Workflow '{result.workflow_name}' completed successfully!\n\n"
                f"Completed Steps: {result.completed_steps}/{result.total_steps}\n"
                f"Execution Time: {result.execution_time:.2f}s\n"
                f"Output Files: {len(result.output_files)}\n"
                f"Output Directory: {result.step_results.get('preparation', {}).get('data', {}).get('output_directory', 'Unknown')}"
            )
        else:
            messagebox.showerror(
                "Workflow Failed",
                f"Workflow '{result.workflow_name}' failed!\n\n"
                f"Error: {result.error}\n"
                f"Completed Steps: {result.completed_steps}/{result.total_steps}"
            )
    
    def workflow_failed(self, error: str, progress_dialog):
        """Workflow başarısız callback"""
        messagebox.showerror("Workflow Error", f"Workflow execution failed:\n{error}")
    
    def show_workflow_details(self):
        """Workflow detaylarını göster"""
        workflow_name = self.workflow_var.get()
        if not workflow_name:
            messagebox.showwarning("Warning", "Please select a workflow first!")
            return
        
        try:
            info = self.orchestrator.get_workflow_info(workflow_name)
            if info:
                details = f"Workflow Details: {info['name']}\n"
                details += "=" * 50 + "\n\n"
                details += f"Total Steps: {info['total_steps']}\n\n"
                
                for i, step in enumerate(info['steps'], 1):
                    details += f"Step {i}: {step['name']}\n"
                    details += f"  Description: {step['description']}\n"
                    details += f"  Required: {'Yes' if step['required'] else 'No'}\n"
                    details += f"  Timeout: {step['timeout']}s\n"
                    if step['macro_name']:
                        details += f"  Macro: {step['macro_name']}\n"
                    elif step['function_name']:
                        details += f"  Function: {step['function_name']}\n"
                    details += "\n"
                
                # Popup window ile göster
                detail_window = tk.Toplevel(self.parent_frame)
                detail_window.title(f"Workflow Details - {workflow_name}")
                detail_window.geometry("500x400")
                
                text_widget = tk.Text(detail_window, wrap=tk.WORD, padx=10, pady=10)
                scrollbar = ttk.Scrollbar(detail_window, orient=tk.VERTICAL, command=text_widget.yview)
                text_widget.config(yscrollcommand=scrollbar.set)
                
                text_widget.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
                scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
                
                text_widget.insert(1.0, details)
                text_widget.config(state=tk.DISABLED)
        
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get workflow details:\n{e}")
    
    def test_system(self):
        """System testi çalıştır"""
        try:
            if self.api:
                test_result = self.api.test_installation()
                
                if test_result["success"]:
                    messagebox.showinfo(
                        "System Test", 
                        "✅ System test passed!\n\n"
                        "All components are working correctly."
                    )
                else:
                    messagebox.showerror(
                        "System Test",
                        f"❌ System test failed!\n\n{test_result.get('error', 'Unknown error')}"
                    )
            else:
                messagebox.showerror("System Test", "API not available for testing!")
        
        except Exception as e:
            messagebox.showerror("System Test", f"Test execution failed:\n{e}")

def create_workflow_tab(notebook):
    """Workflow tab'ı oluştur"""
    workflow_frame = ttk.Frame(notebook)
    notebook.add(workflow_frame, text="Advanced Workflow")
    
    try:
        AdvancedWorkflowGUI(workflow_frame)
        return workflow_frame
    except Exception as e:
        # Error frame
        error_frame = ttk.Frame(workflow_frame)
        error_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(
            error_frame, 
            text="❌ Advanced Workflow not available",
            font=("Arial", 14, "bold"),
            foreground="red"
        ).pack(pady=(0, 10))
        
        ttk.Label(
            error_frame,
            text=f"Error: {str(e)}",
            wraplength=400
        ).pack()
        
        return workflow_frame


class WorkflowGUI:
    """Main Workflow GUI Application"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("STEP BOM Analyzer v3.0 - FreeCAD Native Edition")
        self.root.geometry("1200x800")
        self.root.minsize(800, 600)
        
        # Center window
        self.center_window()
        
        # Setup UI
        self.setup_ui()
    
    def center_window(self):
        """Center the window on screen"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def setup_ui(self):
        """Setup main UI"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="🚀 STEP BOM Analyzer v3.0", 
            font=("Arial", 18, "bold")
        )
        title_label.pack(pady=(0, 20))
        
        # Subtitle
        subtitle_label = ttk.Label(
            main_frame,
            text="FreeCAD Native Edition - Advanced STEP File Analysis & BOM Generation",
            font=("Arial", 11),
            foreground="gray"
        )
        subtitle_label.pack(pady=(0, 30))
        
        # Notebook for tabs
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Create tabs
        self.create_simple_tab()
        self.create_advanced_tab()
        self.create_about_tab()
        
        # Status bar
        self.status_var = tk.StringVar(value="Ready - Select a STEP file to begin analysis")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        status_bar.pack(fill=tk.X, pady=(10, 0))
    
    def create_simple_tab(self):
        """Create simple analysis tab"""
        simple_frame = ttk.Frame(self.notebook)
        self.notebook.add(simple_frame, text="🔍 Simple Analysis")
        
        # Instructions
        instructions = ttk.Label(
            simple_frame,
            text="Quick STEP File Analysis - Perfect for beginners",
            font=("Arial", 12, "bold"),
            foreground="blue"
        )
        instructions.pack(pady=20)
        
        # File selection frame
        file_frame = ttk.LabelFrame(simple_frame, text="File Selection", padding="15")
        file_frame.pack(fill=tk.X, padx=20, pady=(0, 20))
        
        # STEP file selection
        step_frame = ttk.Frame(file_frame)
        step_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(step_frame, text="STEP File:", font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        self.step_file_var = tk.StringVar()
        ttk.Entry(step_frame, textvariable=self.step_file_var, font=("Arial", 10)).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 10))
        ttk.Button(step_frame, text="Browse...", command=self.browse_step_file).pack(side=tk.RIGHT)
        
        # Output directory
        output_frame = ttk.Frame(file_frame)
        output_frame.pack(fill=tk.X)
        
        ttk.Label(output_frame, text="Output Folder:", font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        self.output_dir_var = tk.StringVar(value="./output")
        ttk.Entry(output_frame, textvariable=self.output_dir_var, font=("Arial", 10)).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 10))
        ttk.Button(output_frame, text="Browse...", command=self.browse_output_dir).pack(side=tk.RIGHT)
        
        # Options
        options_frame = ttk.LabelFrame(simple_frame, text="Analysis Options", padding="15")
        options_frame.pack(fill=tk.X, padx=20, pady=(0, 20))
        
        self.extract_bom_var = tk.BooleanVar(value=True)
        self.generate_images_var = tk.BooleanVar(value=True)
        self.export_json_var = tk.BooleanVar(value=True)
        
        ttk.Checkbutton(options_frame, text="Extract BOM (Bill of Materials)", variable=self.extract_bom_var).pack(anchor=tk.W)
        ttk.Checkbutton(options_frame, text="Generate 3D Images", variable=self.generate_images_var).pack(anchor=tk.W)
        ttk.Checkbutton(options_frame, text="Export JSON Report", variable=self.export_json_var).pack(anchor=tk.W)
        
        # Action buttons
        button_frame = ttk.Frame(simple_frame)
        button_frame.pack(fill=tk.X, padx=20, pady=20)
        
        ttk.Button(
            button_frame, 
            text="🚀 Start Analysis", 
            command=self.start_simple_analysis,
            style="Accent.TButton"
        ).pack(side=tk.LEFT, padx=(0, 10))
        
        ttk.Button(
            button_frame, 
            text="📁 Open Output Folder", 
            command=self.open_output_folder
        ).pack(side=tk.LEFT, padx=(0, 10))
        
        ttk.Button(
            button_frame, 
            text="ℹ️  Help", 
            command=self.show_help
        ).pack(side=tk.RIGHT)
    
    def create_advanced_tab(self):
        """Create advanced workflow tab"""
        if ORCHESTRATOR_AVAILABLE:
            try:
                create_workflow_tab(self.notebook)
            except Exception as e:
                self.create_error_tab("Advanced Workflow", f"Advanced features unavailable: {e}")
        else:
            self.create_error_tab("Advanced Workflow", "Advanced workflow system not available. Core dependencies missing.")
    
    def create_about_tab(self):
        """Create about tab"""
        about_frame = ttk.Frame(self.notebook)
        self.notebook.add(about_frame, text="ℹ️  About")
        
        # Scrollable text widget
        text_widget = tk.Text(about_frame, wrap=tk.WORD, padx=20, pady=20, font=("Arial", 11))
        scrollbar = ttk.Scrollbar(about_frame, orient=tk.VERTICAL, command=text_widget.yview)
        text_widget.config(yscrollcommand=scrollbar.set)
        
        about_text = f"""
🚀 STEP BOM Analyzer v3.0 - FreeCAD Native Edition

A powerful tool for analyzing STEP files and generating Bills of Materials (BOM) using FreeCAD's native Python API.

🔧 Features:
• Advanced STEP file parsing and analysis
• Automatic BOM (Bill of Materials) extraction
• 3D visualization and thumbnail generation  
• Multiple export formats (JSON, Excel, CSV, XML)
• Real-time progress tracking
• Advanced workflow management
• FreeCAD integration for precise 3D processing

🎯 System Requirements:
• FreeCAD 0.20 or newer
• Python 3.8+ (included with FreeCAD)
• Windows, Linux, or macOS

📂 Supported Formats:
• Input: .step, .stp files
• Output: JSON, Excel, CSV, XML, HTML, PNG images

🔗 Integration:
• Workflow Orchestrator for complex operations
• API integration for server communication
• Real-time progress monitoring
• Batch processing capabilities

📋 Usage:
1. Select a STEP file for analysis
2. Choose output directory
3. Configure analysis options
4. Click 'Start Analysis'
5. Review generated reports and images

⚙️ Advanced Features:
• Custom workflow definitions
• Macro-based processing
• Template management
• Performance monitoring
• Error handling and recovery

🐛 Troubleshooting:
• Ensure FreeCAD is properly installed
• Check that Python dependencies are available
• Run system test for diagnostics
• Review logs for detailed error information

💡 Tips:
• Use Simple Analysis for quick BOM extraction
• Use Advanced Workflow for complex processing
• Check output folder for generated files
• Large files may take several minutes to process

🔄 Version: 3.0 (FreeCAD Native)
📅 Build Date: 2024
🏢 ÜRTM Takip Integration Ready

For support and updates, check the main application logs and documentation.
        """
        
        text_widget.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        text_widget.insert(1.0, about_text.strip())
        text_widget.config(state=tk.DISABLED)
    
    def create_error_tab(self, tab_name: str, error_msg: str):
        """Create error tab when features are unavailable"""
        error_frame = ttk.Frame(self.notebook)
        self.notebook.add(error_frame, text=tab_name)
        
        container = ttk.Frame(error_frame)
        container.pack(expand=True)
        
        ttk.Label(
            container,
            text="⚠️ Feature Unavailable",
            font=("Arial", 16, "bold"),
            foreground="red"
        ).pack(pady=20)
        
        ttk.Label(
            container,
            text=error_msg,
            font=("Arial", 11),
            wraplength=400,
            justify=tk.CENTER
        ).pack(pady=10)
    
    def browse_step_file(self):
        """Browse for STEP file"""
        filename = filedialog.askopenfilename(
            title="Select STEP File",
            filetypes=[
                ("STEP files", "*.step *.stp"),
                ("All files", "*.*")
            ]
        )
        if filename:
            self.step_file_var.set(filename)
            self.status_var.set(f"Selected: {Path(filename).name}")
    
    def browse_output_dir(self):
        """Browse for output directory"""
        directory = filedialog.askdirectory(title="Select Output Directory")
        if directory:
            self.output_dir_var.set(directory)
    
    def start_simple_analysis(self):
        """Start simple analysis"""
        step_file = self.step_file_var.get().strip()
        output_dir = self.output_dir_var.get().strip()
        
        if not step_file:
            messagebox.showerror("Error", "Please select a STEP file!")
            return
        
        if not Path(step_file).exists():
            messagebox.showerror("Error", f"STEP file not found: {step_file}")
            return
        
        if not output_dir:
            messagebox.showerror("Error", "Please specify output directory!")
            return
        
        # Show info message about simple analysis
        messagebox.showinfo(
            "Simple Analysis",
            f"Simple analysis will process:\n"
            f"📁 File: {Path(step_file).name}\n"
            f"📂 Output: {output_dir}\n\n"
            f"✅ Extract BOM: {'Yes' if self.extract_bom_var.get() else 'No'}\n"
            f"🖼️  Generate Images: {'Yes' if self.generate_images_var.get() else 'No'}\n"
            f"📄 Export JSON: {'Yes' if self.export_json_var.get() else 'No'}\n\n"
            f"For advanced features, use the Advanced Workflow tab."
        )
        
        self.status_var.set("Analysis completed (demo mode)")
    
    def open_output_folder(self):
        """Open output folder"""
        output_dir = self.output_dir_var.get().strip()
        if output_dir and Path(output_dir).exists():
            import subprocess
            import sys
            
            if sys.platform == "win32":
                subprocess.Popen(f'explorer "{output_dir}"')
            elif sys.platform == "darwin":
                subprocess.Popen(["open", output_dir])
            else:
                subprocess.Popen(["xdg-open", output_dir])
        else:
            messagebox.showwarning("Warning", "Output directory not found or not specified!")
    
    def show_help(self):
        """Show help information"""
        messagebox.showinfo(
            "Help - Simple Analysis",
            "🔍 Simple Analysis Help:\n\n"
            "1. Select a STEP file (.step or .stp)\n"
            "2. Choose an output directory\n" 
            "3. Select desired analysis options\n"
            "4. Click 'Start Analysis'\n\n"
            "📋 Options:\n"
            "• Extract BOM: Generates bill of materials\n"
            "• Generate Images: Creates 3D thumbnails\n"
            "• Export JSON: Creates JSON report\n\n"
            "💡 For advanced features like custom workflows,\n"
            "use the 'Advanced Workflow' tab."
        )


# Entry point for the application
if __name__ == "__main__":
    root = tk.Tk()
    app = WorkflowGUI(root)
    root.mainloop()