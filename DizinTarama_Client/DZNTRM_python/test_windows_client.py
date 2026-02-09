#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Windows Client Test Script - Version Check and Feature Test
This script tests the client version and features for Windows environment
"""

import sys
import os

def test_imports():
    """Test module imports"""
    print("🔍 Testing module imports...")

    try:
        from version import get_version, get_version_info
        print(f"✅ Version: {get_version()}")
        return True
    except ImportError as e:
        print(f"❌ Version import failed: {e}")
        return False

def test_database_modules():
    """Test database integration modules"""
    print("\n🔍 Testing database modules...")

    try:
        from database_client import DatabaseClient
        print("✅ DatabaseClient")

        from selection_manager import SelectionManager
        print("✅ SelectionManager")

        # Check if PIL is available
        try:
            from PIL import Image, ImageTk
            print("✅ PIL/Pillow (Image processing)")
            return True, True
        except ImportError:
            print("⚠️ PIL/Pillow not available (Images will be URLs)")
            return True, False

    except ImportError as e:
        print(f"❌ Database modules failed: {e}")
        return False, False

def test_tkinter():
    """Test tkinter availability"""
    print("\n🔍 Testing GUI components...")

    try:
        import tkinter as tk
        print("✅ tkinter available")

        # Create a test window
        root = tk.Tk()
        root.title("Test Window")
        root.geometry("300x200")

        # Test basic components
        from tkinter import ttk
        label = ttk.Label(root, text="✅ GUI Test Successful!")
        label.pack(pady=50)

        button = ttk.Button(root, text="Close", command=root.quit)
        button.pack()

        print("✅ GUI components working")
        root.after(2000, root.quit)  # Auto-close after 2 seconds
        root.mainloop()

        return True

    except ImportError as e:
        print(f"❌ tkinter not available: {e}")
        return False

def test_main_client():
    """Test main client initialization"""
    print("\n🔍 Testing main client...")

    try:
        # Add current directory to path
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

        # Test main import
        import main

        # Check if DATABASE_INTEGRATION is enabled
        print(f"DATABASE_INTEGRATION: {main.DATABASE_INTEGRATION}")

        if main.DATABASE_INTEGRATION:
            print("✅ Database integration enabled - checkboxes and buttons should work")
            return True
        else:
            print("❌ Database integration disabled - checkboxes and buttons won't work")
            return False

    except Exception as e:
        print(f"❌ Main client test failed: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("🔍 DIZIN TARAMA CLIENT - WINDOWS TEST")
    print("=" * 60)

    # Test version
    if not test_imports():
        print("\n❌ CRITICAL: Version module failed")
        return False

    # Test database modules
    db_available, pil_available = test_database_modules()

    # Test tkinter
    gui_available = test_tkinter()

    if not gui_available:
        print("\n❌ CRITICAL: tkinter not available - GUI won't work")
        return False

    # Test main client
    client_ok = test_main_client()

    print("\n" + "=" * 60)
    print("📊 TEST RESULTS:")
    print(f"✅ Version: Available")
    print(f"{'✅' if db_available else '❌'} Database modules: {'Available' if db_available else 'Not Available'}")
    print(f"{'✅' if pil_available else '⚠️'} PIL/Pillow: {'Available' if pil_available else 'Not Available (URLs will be shown)'}")
    print(f"{'✅' if gui_available else '❌'} GUI: {'Available' if gui_available else 'Not Available'}")
    print(f"{'✅' if client_ok else '❌'} Client Features: {'Working' if client_ok else 'Not Working'}")

    if client_ok and gui_available:
        print("\n🎉 SUCCESS: All critical features are working!")
        print("\n📋 Features you can use:")
        print("✅ Directory scanning")
        print("✅ Checkbox selection of parts")
        print("✅ Double-click for part details")
        print("✅ Detail buttons and navigation")
        if pil_available:
            print("✅ Image display in detail cards")
        else:
            print("⚠️ Image URLs in detail cards")

        print("\n🚀 To run the client: python main.py")

    else:
        print("\n❌ Some features are not working. Check the results above.")

    print("=" * 60)
    return client_ok and gui_available

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)