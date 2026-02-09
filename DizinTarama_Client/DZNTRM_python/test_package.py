#!/usr/bin/env python3
"""
Test script for v1.2.0 package to verify all imports work correctly
"""

import sys
import importlib

def test_imports():
    """Test all required imports"""
    tests = []

    # Basic Python modules
    try:
        import os, sys, json, time, threading, logging
        import queue, configparser
        from datetime import datetime
        from pathlib import Path
        tests.append(("✓ Standard library modules", True))
    except ImportError as e:
        tests.append((f"✗ Standard library error: {e}", False))

    # GUI modules
    try:
        import tkinter as tk
        from tkinter import ttk, filedialog, messagebox
        tests.append(("✓ Tkinter GUI modules", True))
    except ImportError as e:
        tests.append((f"✗ Tkinter error: {e}", False))

    # Requests
    try:
        import requests
        tests.append((f"✓ Requests {requests.__version__}", True))
    except ImportError as e:
        tests.append((f"✗ Requests error: {e}", False))

    # Version module
    try:
        from version import get_version, get_version_full, get_version_info
        v = get_version()
        tests.append((f"✓ Version module: {v}", True))
    except ImportError as e:
        tests.append((f"✗ Version module error: {e}", False))

    # v1.2.0 modules (optional)
    try:
        from database_client import DatabaseClient
        from selection_manager import SelectionManager
        from part_detail_window import PartDetailWindow
        tests.append(("✓ v1.2.0 database integration modules", True))
    except ImportError as e:
        tests.append((f"⚠ v1.2.0 modules warning: {e}", None))

    # Windows utils (optional)
    if sys.platform == "win32":
        try:
            from windows_utils import WindowsUtils
            tests.append(("✓ Windows utilities", True))
        except ImportError as e:
            tests.append((f"⚠ Windows utils warning: {e}", None))

    return tests

def test_main_app():
    """Test main application startup (without GUI)"""
    try:
        # Import the main module without running it
        import main
        return ("✓ Main application module loads correctly", True)
    except ImportError as e:
        return (f"✗ Main application error: {e}", False)
    except Exception as e:
        return (f"⚠ Main application warning: {e}", None)

if __name__ == "__main__":
    print("🧪 URTM Dizin Tarama Client v1.2.0 Package Test")
    print("="*50)

    # Test imports
    import_results = test_imports()
    for result, status in import_results:
        print(result)

    print()

    # Test main app
    main_result = test_main_app()
    print(main_result[0])

    # Summary
    print()
    print("📊 Test Summary:")
    passed = sum(1 for _, status in import_results + [main_result] if status is True)
    failed = sum(1 for _, status in import_results + [main_result] if status is False)
    warnings = sum(1 for _, status in import_results + [main_result] if status is None)

    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"⚠ Warnings: {warnings}")

    if failed == 0:
        print()
        print("🎉 All critical tests passed! Package should work correctly.")
        sys.exit(0)
    else:
        print()
        print("❌ Some tests failed. Package may have issues.")
        sys.exit(1)