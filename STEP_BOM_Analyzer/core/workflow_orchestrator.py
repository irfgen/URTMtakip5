"""
Workflow Orchestrator Module
STEP BOM Analyzer v3.0 - FreeCAD Native Edition

Bu modül tüm FreeCAD macro workflow'unu koordine eder.
Advanced workflow management ve progress tracking sağlar.
"""

import os
import sys
import time
import json
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime

from .freecad_macro_manager import FreeCADMacroManager, MacroResult
from .freecad_processor import FreeCADProcessor, ProcessingResult
from .report_generator import ReportGenerator, ReportConfig

class WorkflowState(Enum):
    """Workflow durumları"""
    IDLE = "idle"
    PREPARING = "preparing"
    STEP_IMPORT = "step_import"
    BOM_EXTRACTION = "bom_extraction"
    PART_RENDERING = "part_rendering"
    REPORT_GENERATION = "report_generation"
    FINALIZING = "finalizing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class WorkflowStep:
    """Workflow adımı"""
    name: str
    description: str
    macro_name: Optional[str] = None
    function_name: Optional[str] = None
    parameters: Dict = None
    required: bool = True
    timeout: int = 300  # 5 minutes default
    retry_count: int = 2
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}

@dataclass
class WorkflowProgress:
    """Workflow ilerlemesi"""
    current_step: int = 0
    total_steps: int = 0
    current_state: WorkflowState = WorkflowState.IDLE
    step_name: str = ""
    step_description: str = ""
    progress_percentage: float = 0.0
    execution_time: float = 0.0
    error_message: str = ""
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []

@dataclass
class WorkflowResult:
    """Workflow sonucu"""
    success: bool
    workflow_name: str
    execution_time: float = 0.0
    completed_steps: int = 0
    total_steps: int = 0
    final_state: WorkflowState = WorkflowState.IDLE
    step_results: Dict[str, Any] = None
    output_files: List[str] = None
    error: str = ""
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.step_results is None:
            self.step_results = {}
        if self.output_files is None:
            self.output_files = []
        if self.warnings is None:
            self.warnings = []

class WorkflowOrchestrator:
    """Advanced Workflow Orchestration Engine"""
    
    def __init__(self, freecad_path: Optional[str] = None):
        self.freecad_path = freecad_path
        self.logger = self._setup_logger()
        
        # Core components
        self.macro_manager = FreeCADMacroManager(freecad_path)
        self.processor = FreeCADProcessor(freecad_path)
        
        # Workflow state
        self.current_workflow = None
        self.progress = WorkflowProgress()
        self.is_running = False
        self.is_cancelled = False
        
        # Progress callbacks
        self.progress_callbacks: List[Callable[[WorkflowProgress], None]] = []
        
        # Predefined workflows
        self.workflows = self._define_workflows()
        
        self.logger.info("✅ Workflow Orchestrator başlatıldı")
    
    def _setup_logger(self) -> logging.Logger:
        """Logger ayarla"""
        logger = logging.getLogger("WorkflowOrchestrator")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _define_workflows(self) -> Dict[str, List[WorkflowStep]]:
        """Önceden tanımlanmış workflow'ları oluştur"""
        workflows = {}
        
        # Standard STEP Analysis Workflow
        workflows["standard_analysis"] = [
            WorkflowStep(
                name="preparation",
                description="Preparing analysis environment",
                function_name="prepare_analysis",
                timeout=30
            ),
            WorkflowStep(
                name="step_import",
                description="Importing STEP file and analyzing structure",
                macro_name="step_processor",
                timeout=300
            ),
            WorkflowStep(
                name="bom_extraction", 
                description="Extracting hierarchical BOM data",
                macro_name="bom_extractor",
                timeout=240
            ),
            WorkflowStep(
                name="part_rendering",
                description="Generating 3D part screenshots",
                macro_name="part_renderer",
                required=False,  # Optional step
                timeout=600
            ),
            WorkflowStep(
                name="report_generation",
                description="Creating comprehensive analysis reports",
                macro_name="export_manager",
                timeout=180
            ),
            WorkflowStep(
                name="finalization",
                description="Finalizing analysis and cleanup",
                function_name="finalize_analysis",
                timeout=30
            )
        ]
        
        # Quick Analysis Workflow
        workflows["quick_analysis"] = [
            WorkflowStep(
                name="preparation",
                description="Quick analysis preparation",
                function_name="prepare_quick_analysis",
                timeout=15
            ),
            WorkflowStep(
                name="step_import",
                description="Quick STEP import and basic analysis",
                macro_name="step_processor",
                parameters={"quick_mode": True},
                timeout=120
            ),
            WorkflowStep(
                name="basic_bom",
                description="Basic BOM extraction",
                macro_name="bom_extractor",
                parameters={"export_formats": ["json"]},
                timeout=60
            ),
            WorkflowStep(
                name="simple_report",
                description="Generating simple JSON report",
                function_name="generate_quick_report",
                timeout=30
            )
        ]
        
        # Batch Processing Workflow  
        workflows["batch_processing"] = [
            WorkflowStep(
                name="batch_preparation",
                description="Preparing batch processing environment",
                function_name="prepare_batch_processing",
                timeout=60
            ),
            WorkflowStep(
                name="batch_step_import",
                description="Processing multiple STEP files",
                function_name="process_batch_files",
                timeout=1800  # 30 minutes for batch
            ),
            WorkflowStep(
                name="batch_consolidation",
                description="Consolidating batch results",
                function_name="consolidate_batch_results",
                timeout=300
            )
        ]
        
        return workflows
    
    def add_progress_callback(self, callback: Callable[[WorkflowProgress], None]):
        """Progress callback ekle"""
        self.progress_callbacks.append(callback)
    
    def remove_progress_callback(self, callback: Callable[[WorkflowProgress], None]):
        """Progress callback kaldır"""
        if callback in self.progress_callbacks:
            self.progress_callbacks.remove(callback)
    
    def _notify_progress(self):
        """Progress callback'leri bilgilendir"""
        for callback in self.progress_callbacks:
            try:
                callback(self.progress)
            except Exception as e:
                self.logger.warning(f"Progress callback hatası: {e}")
    
    def execute_workflow(self, workflow_name: str, parameters: Dict[str, Any]) -> WorkflowResult:
        """Workflow'u çalıştır"""
        if self.is_running:
            raise RuntimeError("Başka bir workflow zaten çalışıyor")
        
        if workflow_name not in self.workflows:
            raise ValueError(f"Bilinmeyen workflow: {workflow_name}")
        
        workflow_steps = self.workflows[workflow_name]
        
        self.logger.info(f"🚀 Workflow başlatılıyor: {workflow_name}")
        self.logger.info(f"📋 Toplam {len(workflow_steps)} adım")
        
        # Initialize workflow state
        self.current_workflow = workflow_name
        self.is_running = True
        self.is_cancelled = False
        
        self.progress = WorkflowProgress(
            total_steps=len(workflow_steps),
            current_state=WorkflowState.PREPARING
        )
        
        start_time = time.time()
        completed_steps = 0
        step_results = {}
        warnings = []
        
        try:
            for i, step in enumerate(workflow_steps):
                if self.is_cancelled:
                    self.logger.info("❌ Workflow cancelled by user")
                    return WorkflowResult(
                        success=False,
                        workflow_name=workflow_name,
                        execution_time=time.time() - start_time,
                        completed_steps=completed_steps,
                        total_steps=len(workflow_steps),
                        final_state=WorkflowState.CANCELLED,
                        step_results=step_results,
                        warnings=warnings
                    )
                
                # Update progress
                self.progress.current_step = i + 1
                self.progress.step_name = step.name
                self.progress.step_description = step.description
                self.progress.progress_percentage = (i / len(workflow_steps)) * 100
                self.progress.current_state = self._get_step_state(step.name)
                self._notify_progress()
                
                self.logger.info(f"🔄 Step {i+1}/{len(workflow_steps)}: {step.description}")
                
                # Execute step
                step_result = self._execute_workflow_step(step, parameters)
                
                if step_result["success"]:
                    step_results[step.name] = step_result
                    completed_steps += 1
                    self.logger.info(f"✅ Step completed: {step.name}")
                    
                    if step_result.get("warnings"):
                        warnings.extend(step_result["warnings"])
                
                else:
                    if step.required:
                        self.logger.error(f"❌ Required step failed: {step.name}")
                        return WorkflowResult(
                            success=False,
                            workflow_name=workflow_name,
                            execution_time=time.time() - start_time,
                            completed_steps=completed_steps,
                            total_steps=len(workflow_steps),
                            final_state=WorkflowState.FAILED,
                            step_results=step_results,
                            error=step_result.get("error", "Step execution failed"),
                            warnings=warnings
                        )
                    else:
                        self.logger.warning(f"⚠️ Optional step failed: {step.name}")
                        warnings.append(f"Optional step '{step.name}' failed: {step_result.get('error', 'Unknown error')}")
                        step_results[step.name] = step_result
            
            # Workflow completed successfully
            execution_time = time.time() - start_time
            
            self.progress.current_state = WorkflowState.COMPLETED
            self.progress.progress_percentage = 100.0
            self.progress.execution_time = execution_time
            self._notify_progress()
            
            self.logger.info("=" * 80)
            self.logger.info("✅ WORKFLOW COMPLETED SUCCESSFULLY!")
            self.logger.info(f"🔧 Workflow: {workflow_name}")
            self.logger.info(f"⏱️ Total Time: {execution_time:.2f}s")
            self.logger.info(f"📊 Completed Steps: {completed_steps}/{len(workflow_steps)}")
            self.logger.info("=" * 80)
            
            # Collect output files
            output_files = self._collect_output_files(step_results)
            
            return WorkflowResult(
                success=True,
                workflow_name=workflow_name,
                execution_time=execution_time,
                completed_steps=completed_steps,
                total_steps=len(workflow_steps),
                final_state=WorkflowState.COMPLETED,
                step_results=step_results,
                output_files=output_files,
                warnings=warnings
            )
            
        except Exception as e:
            self.logger.error(f"❌ Workflow exception: {e}")
            return WorkflowResult(
                success=False,
                workflow_name=workflow_name,
                execution_time=time.time() - start_time,
                completed_steps=completed_steps,
                total_steps=len(workflow_steps),
                final_state=WorkflowState.FAILED,
                step_results=step_results,
                error=str(e),
                warnings=warnings
            )
        
        finally:
            self.is_running = False
            self.current_workflow = None
    
    def _get_step_state(self, step_name: str) -> WorkflowState:
        """Step ismine göre state belirle"""
        state_mapping = {
            "preparation": WorkflowState.PREPARING,
            "step_import": WorkflowState.STEP_IMPORT,
            "bom_extraction": WorkflowState.BOM_EXTRACTION,
            "part_rendering": WorkflowState.PART_RENDERING,
            "report_generation": WorkflowState.REPORT_GENERATION,
            "finalization": WorkflowState.FINALIZING
        }
        
        return state_mapping.get(step_name, WorkflowState.IDLE)
    
    def _execute_workflow_step(self, step: WorkflowStep, global_params: Dict[str, Any]) -> Dict[str, Any]:
        """Tek workflow step'ini çalıştır"""
        step_start_time = time.time()
        
        try:
            # Parametreleri birleştir
            params = {**global_params, **step.parameters}
            
            if step.macro_name:
                # FreeCAD macro çalıştır
                result = self.macro_manager.execute_macro(step.macro_name, params, step.timeout)
                
                return {
                    "success": result.success,
                    "execution_time": result.execution_time,
                    "data": result.data,
                    "output": result.output,
                    "error": result.error if not result.success else None
                }
            
            elif step.function_name:
                # Python function çalıştır
                return self._execute_step_function(step.function_name, params)
            
            else:
                return {
                    "success": False,
                    "error": "Step has no macro_name or function_name defined"
                }
        
        except Exception as e:
            self.logger.error(f"Step execution error ({step.name}): {e}")
            return {
                "success": False,
                "execution_time": time.time() - step_start_time,
                "error": str(e)
            }
    
    def _execute_step_function(self, function_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Built-in step function'ları çalıştır"""
        start_time = time.time()
        
        try:
            if function_name == "prepare_analysis":
                return self._prepare_analysis(parameters)
            
            elif function_name == "prepare_quick_analysis":
                return self._prepare_quick_analysis(parameters)
            
            elif function_name == "finalize_analysis":
                return self._finalize_analysis(parameters)
            
            elif function_name == "generate_quick_report":
                return self._generate_quick_report(parameters)
            
            elif function_name == "prepare_batch_processing":
                return self._prepare_batch_processing(parameters)
            
            elif function_name == "process_batch_files":
                return self._process_batch_files(parameters)
            
            elif function_name == "consolidate_batch_results":
                return self._consolidate_batch_results(parameters)
            
            else:
                return {
                    "success": False,
                    "error": f"Unknown function: {function_name}"
                }
        
        except Exception as e:
            return {
                "success": False,
                "execution_time": time.time() - start_time,
                "error": str(e)
            }
    
    def _prepare_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Standard analiz hazırlığı"""
        try:
            output_dir = Path(params.get("output_directory", "output"))
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Alt dizinleri oluştur
            (output_dir / "renders").mkdir(exist_ok=True)
            (output_dir / "reports").mkdir(exist_ok=True)
            (output_dir / "temp").mkdir(exist_ok=True)
            
            return {
                "success": True,
                "data": {
                    "output_directory": str(output_dir),
                    "prepared_directories": ["renders", "reports", "temp"]
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Analysis preparation failed: {e}"
            }
    
    def _prepare_quick_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Hızlı analiz hazırlığı"""
        try:
            output_dir = Path(params.get("output_directory", "quick_output"))
            output_dir.mkdir(parents=True, exist_ok=True)
            
            return {
                "success": True,
                "data": {
                    "output_directory": str(output_dir),
                    "mode": "quick"
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Quick analysis preparation failed: {e}"
            }
    
    def _finalize_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analiz sonlandırma"""
        try:
            output_dir = Path(params.get("output_directory", "output"))
            
            # Temp dosyaları temizle
            temp_dir = output_dir / "temp"
            if temp_dir.exists():
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
            
            # Summary dosyası oluştur
            summary = {
                "analysis_completed": datetime.now().isoformat(),
                "output_directory": str(output_dir),
                "workflow": self.current_workflow
            }
            
            summary_file = output_dir / "analysis_summary.json"
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "data": {
                    "summary_file": str(summary_file),
                    "cleanup_completed": True
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Analysis finalization failed: {e}"
            }
    
    def _generate_quick_report(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Hızlı rapor oluşturma"""
        try:
            output_dir = Path(params.get("output_directory", "quick_output"))
            
            # Basit JSON rapor
            report_data = {
                "report_type": "quick_analysis",
                "generated_at": datetime.now().isoformat(),
                "workflow": "quick_analysis",
                "status": "completed"
            }
            
            report_file = output_dir / "quick_report.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "data": {
                    "report_file": str(report_file),
                    "report_type": "quick"
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Quick report generation failed: {e}"
            }
    
    def _prepare_batch_processing(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Batch processing hazırlığı"""
        try:
            batch_files = params.get("batch_files", [])
            if not batch_files:
                return {
                    "success": False,
                    "error": "No batch files provided"
                }
            
            output_dir = Path(params.get("output_directory", "batch_output"))
            output_dir.mkdir(parents=True, exist_ok=True)
            
            return {
                "success": True,
                "data": {
                    "batch_count": len(batch_files),
                    "output_directory": str(output_dir)
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Batch preparation failed: {e}"
            }
    
    def _process_batch_files(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Batch dosyaları işle"""
        try:
            # Bu fonksiyon gerçek batch processing implementasyonu gerektirir
            # Şimdilik placeholder
            return {
                "success": True,
                "data": {
                    "processed_files": 0,
                    "placeholder": True
                },
                "warnings": ["Batch processing not fully implemented"]
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Batch processing failed: {e}"
            }
    
    def _consolidate_batch_results(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Batch sonuçları birleştir"""
        try:
            return {
                "success": True,
                "data": {
                    "consolidation_completed": True,
                    "placeholder": True
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Batch consolidation failed: {e}"
            }
    
    def _collect_output_files(self, step_results: Dict[str, Any]) -> List[str]:
        """Workflow'un ürettiği dosyaları topla"""
        output_files = []
        
        for step_name, result in step_results.items():
            if result.get("success") and result.get("data"):
                data = result["data"]
                
                # Dosya path'lerini bul
                for key, value in data.items():
                    if key.endswith("_file") or key.endswith("_files"):
                        if isinstance(value, str) and os.path.exists(value):
                            output_files.append(value)
                        elif isinstance(value, list):
                            output_files.extend([f for f in value if os.path.exists(f)])
        
        return output_files
    
    def cancel_workflow(self):
        """Çalışan workflow'u iptal et"""
        if self.is_running:
            self.logger.info("🛑 Workflow cancellation requested")
            self.is_cancelled = True
            
            self.progress.current_state = WorkflowState.CANCELLED
            self.progress.error_message = "Workflow cancelled by user"
            self._notify_progress()
    
    def get_workflow_info(self, workflow_name: str) -> Optional[Dict[str, Any]]:
        """Workflow bilgilerini al"""
        if workflow_name not in self.workflows:
            return None
        
        steps = self.workflows[workflow_name]
        
        return {
            "name": workflow_name,
            "total_steps": len(steps),
            "steps": [
                {
                    "name": step.name,
                    "description": step.description,
                    "required": step.required,
                    "timeout": step.timeout,
                    "macro_name": step.macro_name,
                    "function_name": step.function_name
                }
                for step in steps
            ]
        }
    
    def list_workflows(self) -> List[str]:
        """Mevcut workflow'ları listele"""
        return list(self.workflows.keys())
    
    def get_current_progress(self) -> WorkflowProgress:
        """Mevcut progress'i al"""
        return self.progress

def test_orchestrator():
    """Workflow Orchestrator'ı test et"""
    try:
        print("🎭 Workflow Orchestrator Test")
        print("=" * 60)
        
        orchestrator = WorkflowOrchestrator()
        
        # Available workflows
        workflows = orchestrator.list_workflows()
        print(f"📋 Available workflows: {len(workflows)}")
        for workflow in workflows:
            print(f"  • {workflow}")
        
        # Workflow info
        print(f"\n📖 Workflow info:")
        for workflow in workflows:
            info = orchestrator.get_workflow_info(workflow)
            print(f"  {workflow}: {info['total_steps']} steps")
        
        # Progress callback test
        def progress_callback(progress: WorkflowProgress):
            print(f"📊 Progress: {progress.progress_percentage:.1f}% - {progress.step_description}")
        
        orchestrator.add_progress_callback(progress_callback)
        
        # Test quick workflow (placeholder test)
        print(f"\n🧪 Testing quick_analysis workflow...")
        
        test_params = {
            "step_file_path": "test.step",
            "output_directory": "test_output"
        }
        
        try:
            result = orchestrator.execute_workflow("quick_analysis", test_params)
            
            if result.success:
                print("✅ Test workflow completed!")
                print(f"📊 Steps: {result.completed_steps}/{result.total_steps}")
                print(f"⏱️ Time: {result.execution_time:.2f}s")
            else:
                print(f"❌ Test workflow failed: {result.error}")
        
        except Exception as e:
            print(f"⚠️ Test exception: {e}")
        
        return orchestrator
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        return None

if __name__ == "__main__":
    test_orchestrator()