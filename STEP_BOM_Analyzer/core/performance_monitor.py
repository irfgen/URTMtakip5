"""
STEP BOM Analyzer - Performance Monitor & Resource Management
Advanced performance monitoring, memory management, and resource cleanup.
"""

import os
import sys
import psutil
import gc
import threading
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime, timedelta
import json
import queue
import contextlib
import traceback
import weakref
from functools import wraps


class PerformanceLevel(Enum):
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"


class ResourceType(Enum):
    MEMORY = "memory"
    CPU = "cpu"
    DISK = "disk"
    FREECAD_INSTANCE = "freecad_instance"
    TEMP_FILE = "temp_file"
    THREAD = "thread"


@dataclass
class ResourceUsage:
    """Current resource usage snapshot"""
    timestamp: datetime
    memory_used_mb: float
    memory_percent: float
    cpu_percent: float
    disk_usage_mb: float
    active_threads: int
    freecad_instances: int
    temp_files_count: int
    temp_files_size_mb: float
    
    @property
    def performance_level(self) -> PerformanceLevel:
        """Determine current performance level"""
        if self.memory_percent > 85 or self.cpu_percent > 90:
            return PerformanceLevel.CRITICAL
        elif self.memory_percent > 70 or self.cpu_percent > 70:
            return PerformanceLevel.HIGH
        elif self.memory_percent > 50 or self.cpu_percent > 50:
            return PerformanceLevel.MEDIUM
        else:
            return PerformanceLevel.LOW


@dataclass
class PerformanceMetrics:
    """Performance metrics over time"""
    start_time: datetime
    end_time: datetime
    duration_seconds: float
    peak_memory_mb: float
    average_memory_mb: float
    peak_cpu_percent: float
    average_cpu_percent: float
    files_processed: int
    errors_count: int
    warnings_count: int


class ResourceTracker:
    """Tracks and manages system resources"""
    
    def __init__(self):
        self.process = psutil.Process()
        self.temp_files: List[Path] = []
        self.managed_threads: List[threading.Thread] = []
        self.freecad_instances: List[Any] = []  # Weak references
        self.cleanup_callbacks: List[Callable[[], None]] = []
        self.lock = threading.RLock()
        
    def register_temp_file(self, file_path: Path):
        """Register temporary file for cleanup"""
        with self.lock:
            self.temp_files.append(file_path)
    
    def register_thread(self, thread: threading.Thread):
        """Register thread for monitoring"""
        with self.lock:
            self.managed_threads.append(thread)
    
    def register_freecad_instance(self, instance):
        """Register FreeCAD instance for cleanup"""
        with self.lock:
            # Use weak reference to avoid circular references
            self.freecad_instances.append(weakref.ref(instance))
    
    def register_cleanup_callback(self, callback: Callable[[], None]):
        """Register cleanup callback"""
        with self.lock:
            self.cleanup_callbacks.append(callback)
    
    def get_current_usage(self) -> ResourceUsage:
        """Get current resource usage"""
        # Memory usage
        memory_info = self.process.memory_info()
        memory_used_mb = memory_info.rss / 1024 / 1024
        memory_percent = self.process.memory_percent()
        
        # CPU usage
        cpu_percent = self.process.cpu_percent()
        
        # Disk usage (temp directory)
        temp_dir = Path.cwd() / "temp"
        disk_usage_mb = 0
        if temp_dir.exists():
            disk_usage_mb = sum(f.stat().st_size for f in temp_dir.rglob('*') if f.is_file()) / 1024 / 1024
        
        # Clean up dead weak references
        with self.lock:
            self.freecad_instances = [ref for ref in self.freecad_instances if ref() is not None]
            self.managed_threads = [t for t in self.managed_threads if t.is_alive()]
        
        # Count temp files that still exist
        existing_temp_files = []
        temp_files_size = 0
        for temp_file in self.temp_files:
            if temp_file.exists():
                existing_temp_files.append(temp_file)
                temp_files_size += temp_file.stat().st_size
        
        self.temp_files = existing_temp_files
        temp_files_size_mb = temp_files_size / 1024 / 1024
        
        return ResourceUsage(
            timestamp=datetime.now(),
            memory_used_mb=memory_used_mb,
            memory_percent=memory_percent,
            cpu_percent=cpu_percent,
            disk_usage_mb=disk_usage_mb,
            active_threads=len(self.managed_threads),
            freecad_instances=len(self.freecad_instances),
            temp_files_count=len(self.temp_files),
            temp_files_size_mb=temp_files_size_mb
        )
    
    def cleanup_resources(self, force: bool = False):
        """Cleanup managed resources"""
        cleaned_count = 0
        
        with self.lock:
            # Cleanup temp files
            for temp_file in self.temp_files[:]:
                try:
                    if temp_file.exists():
                        temp_file.unlink()
                        cleaned_count += 1
                except Exception as e:
                    logging.warning(f"Failed to cleanup temp file {temp_file}: {e}")
            
            self.temp_files.clear()
            
            # Cleanup FreeCAD instances
            for freecad_ref in self.freecad_instances[:]:
                instance = freecad_ref()
                if instance is not None:
                    try:
                        # Close FreeCAD documents
                        if hasattr(instance, 'closeDocument'):
                            docs = instance.listDocuments()
                            for doc_name in docs:
                                instance.closeDocument(doc_name)
                        cleaned_count += 1
                    except Exception as e:
                        logging.warning(f"Failed to cleanup FreeCAD instance: {e}")
            
            self.freecad_instances.clear()
            
            # Run cleanup callbacks
            for callback in self.cleanup_callbacks:
                try:
                    callback()
                    cleaned_count += 1
                except Exception as e:
                    logging.warning(f"Cleanup callback failed: {e}")
            
            if force:
                # Force terminate threads (dangerous!)
                for thread in self.managed_threads:
                    if thread.is_alive():
                        try:
                            # This is a last resort - normally threads should cleanup gracefully
                            import ctypes
                            ctypes.pythonapi.PyThreadState_SetAsyncExc(
                                ctypes.c_long(thread.ident), 
                                ctypes.py_object(SystemExit)
                            )
                            cleaned_count += 1
                        except Exception as e:
                            logging.error(f"Failed to force terminate thread: {e}")
        
        # Force garbage collection
        collected = gc.collect()
        
        logging.info(f"Resource cleanup completed: {cleaned_count} resources cleaned, {collected} objects collected")
        return cleaned_count


class PerformanceMonitor:
    """Advanced performance monitoring system"""
    
    def __init__(self, 
                 monitoring_interval: float = 1.0,
                 memory_limit_mb: float = 2000,
                 cpu_limit_percent: float = 80,
                 temp_files_limit: int = 100):
        
        self.monitoring_interval = monitoring_interval
        self.memory_limit_mb = memory_limit_mb
        self.cpu_limit_percent = cpu_limit_percent
        self.temp_files_limit = temp_files_limit
        
        self.resource_tracker = ResourceTracker()
        
        # Monitoring data
        self.usage_history: List[ResourceUsage] = []
        self.max_history_size = 1000
        
        # Monitoring thread
        self.monitoring_thread: Optional[threading.Thread] = None
        self.stop_monitoring = threading.Event()
        
        # Alert callbacks
        self.alert_callbacks: List[Callable[[ResourceUsage, str], None]] = []
        
        # Performance metrics
        self.current_metrics: Optional[PerformanceMetrics] = None
        
        self.logger = logging.getLogger(__name__)
    
    def register_alert_callback(self, callback: Callable[[ResourceUsage, str], None]):
        """Register callback for performance alerts"""
        self.alert_callbacks.append(callback)
    
    def start_monitoring(self):
        """Start performance monitoring"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            return
        
        self.stop_monitoring.clear()
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        
        self.logger.info("Performance monitoring started")
    
    def stop_monitoring_system(self):
        """Stop performance monitoring"""
        self.stop_monitoring.set()
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5.0)
        
        self.logger.info("Performance monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while not self.stop_monitoring.is_set():
            try:
                usage = self.resource_tracker.get_current_usage()
                self.usage_history.append(usage)
                
                # Limit history size
                if len(self.usage_history) > self.max_history_size:
                    self.usage_history.pop(0)
                
                # Check for alerts
                self._check_alerts(usage)
                
                time.sleep(self.monitoring_interval)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(self.monitoring_interval)
    
    def _check_alerts(self, usage: ResourceUsage):
        """Check for performance alerts"""
        alerts = []
        
        # Memory alerts
        if usage.memory_used_mb > self.memory_limit_mb:
            alerts.append(f"High memory usage: {usage.memory_used_mb:.1f} MB > {self.memory_limit_mb} MB")
        
        # CPU alerts
        if usage.cpu_percent > self.cpu_limit_percent:
            alerts.append(f"High CPU usage: {usage.cpu_percent:.1f}% > {self.cpu_limit_percent}%")
        
        # Temp files alerts
        if usage.temp_files_count > self.temp_files_limit:
            alerts.append(f"Too many temp files: {usage.temp_files_count} > {self.temp_files_limit}")
        
        # Send alerts
        for alert_message in alerts:
            for callback in self.alert_callbacks:
                try:
                    callback(usage, alert_message)
                except Exception as e:
                    self.logger.error(f"Alert callback failed: {e}")
    
    def get_current_usage(self) -> ResourceUsage:
        """Get current resource usage"""
        return self.resource_tracker.get_current_usage()
    
    def get_usage_history(self, minutes: int = 10) -> List[ResourceUsage]:
        """Get usage history for last N minutes"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        return [usage for usage in self.usage_history if usage.timestamp >= cutoff_time]
    
    def start_operation(self, operation_name: str) -> 'PerformanceContext':
        """Start monitoring an operation"""
        return PerformanceContext(self, operation_name)
    
    def optimize_performance(self) -> Dict[str, Any]:
        """Optimize system performance"""
        optimization_results = {
            'actions_taken': [],
            'resources_freed': 0,
            'performance_improvement': 0
        }
        
        current_usage = self.get_current_usage()
        initial_memory = current_usage.memory_used_mb
        
        # Cleanup resources
        cleaned_resources = self.resource_tracker.cleanup_resources()
        optimization_results['actions_taken'].append(f"Cleaned {cleaned_resources} resources")
        optimization_results['resources_freed'] = cleaned_resources
        
        # Force garbage collection
        collected = gc.collect()
        optimization_results['actions_taken'].append(f"Collected {collected} garbage objects")
        
        # Check improvement
        new_usage = self.get_current_usage()
        memory_saved = initial_memory - new_usage.memory_used_mb
        
        if memory_saved > 0:
            optimization_results['actions_taken'].append(f"Freed {memory_saved:.1f} MB memory")
            optimization_results['performance_improvement'] = (memory_saved / initial_memory) * 100
        
        self.logger.info(f"Performance optimization completed: {optimization_results}")
        return optimization_results
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        if not self.usage_history:
            return {"error": "No performance data available"}
        
        recent_usage = self.get_usage_history(30)  # Last 30 minutes
        
        if not recent_usage:
            return {"error": "No recent performance data"}
        
        # Calculate statistics
        memory_values = [u.memory_used_mb for u in recent_usage]
        cpu_values = [u.cpu_percent for u in recent_usage]
        
        report = {
            'report_time': datetime.now().isoformat(),
            'monitoring_duration_minutes': (
                (recent_usage[-1].timestamp - recent_usage[0].timestamp).total_seconds() / 60
            ),
            'data_points': len(recent_usage),
            
            'memory_stats': {
                'current_mb': memory_values[-1],
                'peak_mb': max(memory_values),
                'average_mb': sum(memory_values) / len(memory_values),
                'minimum_mb': min(memory_values)
            },
            
            'cpu_stats': {
                'current_percent': cpu_values[-1],
                'peak_percent': max(cpu_values),
                'average_percent': sum(cpu_values) / len(cpu_values),
                'minimum_percent': min(cpu_values)
            },
            
            'resource_stats': {
                'active_threads': recent_usage[-1].active_threads,
                'freecad_instances': recent_usage[-1].freecad_instances,
                'temp_files': recent_usage[-1].temp_files_count,
                'temp_files_size_mb': recent_usage[-1].temp_files_size_mb
            },
            
            'performance_level': recent_usage[-1].performance_level.value,
            'alerts': []
        }
        
        # Add alerts for current status
        current = recent_usage[-1]
        if current.memory_percent > 80:
            report['alerts'].append(f"High memory usage: {current.memory_percent:.1f}%")
        if current.cpu_percent > 70:
            report['alerts'].append(f"High CPU usage: {current.cpu_percent:.1f}%")
        if current.temp_files_count > 50:
            report['alerts'].append(f"Many temp files: {current.temp_files_count}")
        
        return report
    
    def export_performance_data(self, output_file: Path, format: str = 'json'):
        """Export performance data to file"""
        report = self.get_performance_report()
        
        if format.lower() == 'json':
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2, default=str)
        
        elif format.lower() == 'csv':
            import csv
            with open(output_file, 'w', newline='') as f:
                if self.usage_history:
                    fieldnames = ['timestamp', 'memory_mb', 'memory_percent', 'cpu_percent', 
                                'temp_files', 'threads', 'freecad_instances']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for usage in self.usage_history:
                        writer.writerow({
                            'timestamp': usage.timestamp.isoformat(),
                            'memory_mb': usage.memory_used_mb,
                            'memory_percent': usage.memory_percent,
                            'cpu_percent': usage.cpu_percent,
                            'temp_files': usage.temp_files_count,
                            'threads': usage.active_threads,
                            'freecad_instances': usage.freecad_instances
                        })
        
        self.logger.info(f"Performance data exported to {output_file}")


class PerformanceContext:
    """Context manager for monitoring operations"""
    
    def __init__(self, monitor: PerformanceMonitor, operation_name: str):
        self.monitor = monitor
        self.operation_name = operation_name
        self.start_time: Optional[datetime] = None
        self.start_usage: Optional[ResourceUsage] = None
        
    def __enter__(self):
        self.start_time = datetime.now()
        self.start_usage = self.monitor.get_current_usage()
        
        self.monitor.logger.info(f"Started monitoring operation: {self.operation_name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = datetime.now()
        end_usage = self.monitor.get_current_usage()
        
        duration = (end_time - self.start_time).total_seconds()
        
        # Calculate metrics
        memory_change = end_usage.memory_used_mb - self.start_usage.memory_used_mb
        
        metrics = {
            'operation': self.operation_name,
            'duration_seconds': duration,
            'memory_change_mb': memory_change,
            'peak_cpu_percent': max(self.start_usage.cpu_percent, end_usage.cpu_percent),
            'temp_files_created': end_usage.temp_files_count - self.start_usage.temp_files_count,
            'success': exc_type is None
        }
        
        if exc_type:
            metrics['error'] = str(exc_val)
        
        self.monitor.logger.info(f"Operation completed: {self.operation_name} - {metrics}")


def memory_limit_decorator(limit_mb: int):
    """Decorator to enforce memory limits on functions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024
            
            if initial_memory > limit_mb:
                raise MemoryError(f"Memory usage {initial_memory:.1f} MB exceeds limit {limit_mb} MB")
            
            try:
                result = func(*args, **kwargs)
                
                # Check memory after execution
                final_memory = process.memory_info().rss / 1024 / 1024
                if final_memory > limit_mb:
                    logging.warning(f"Function {func.__name__} exceeded memory limit: {final_memory:.1f} MB")
                    
                return result
                
            except Exception as e:
                # Cleanup on error
                gc.collect()
                raise
                
        return wrapper
    return decorator


def performance_monitor_example():
    """Example usage of performance monitor"""
    
    # Initialize monitor
    monitor = PerformanceMonitor(
        monitoring_interval=0.5,
        memory_limit_mb=1000,
        cpu_limit_percent=75
    )
    
    # Add alert callback
    def alert_callback(usage: ResourceUsage, message: str):
        print(f"ALERT: {message}")
        print(f"Current usage: {usage.memory_used_mb:.1f} MB, {usage.cpu_percent:.1f}% CPU")
    
    monitor.register_alert_callback(alert_callback)
    
    # Start monitoring
    monitor.start_monitoring()
    
    try:
        # Simulate some work with performance monitoring
        with monitor.start_operation("test_operation") as context:
            # Create some temporary files
            temp_dir = Path("temp_test")
            temp_dir.mkdir(exist_ok=True)
            
            for i in range(10):
                temp_file = temp_dir / f"temp_{i}.txt"
                with open(temp_file, 'w') as f:
                    f.write("x" * 1000)  # 1KB file
                
                monitor.resource_tracker.register_temp_file(temp_file)
                time.sleep(0.1)
            
            # Simulate CPU work
            dummy = sum(i**2 for i in range(10000))
        
        # Get performance report
        report = monitor.get_performance_report()
        print("\nPerformance Report:")
        print(json.dumps(report, indent=2, default=str))
        
        # Optimize performance
        optimization = monitor.optimize_performance()
        print(f"\nOptimization results: {optimization}")
        
    finally:
        # Stop monitoring
        monitor.stop_monitoring_system()
        
        # Final cleanup
        monitor.resource_tracker.cleanup_resources()


if __name__ == "__main__":
    performance_monitor_example()