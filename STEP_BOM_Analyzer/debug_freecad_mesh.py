#!/usr/bin/env python3
"""
Debug FreeCAD mesh generation issues
"""

import sys
import os
import tempfile
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def debug_freecad_mesh_generation():
    """Debug FreeCAD mesh generation step by step"""
    print("=== FreeCAD Mesh Generation Debug ===")
    
    try:
        # FreeCAD import test
        import FreeCAD
        import Import
        import Mesh
        import MeshPart
        print("[OK] FreeCAD modules imported successfully")
        
        # STEP file path (use your actual file)
        step_file = "C:/Users/irfan/OneDrive/Belgeler/Projeler/URTMtakip/STEP_BOM_Analyzer/22322.stp"
        
        if not os.path.exists(step_file):
            print(f"[FAIL] STEP file not found: {step_file}")
            return False
            
        print(f"[INFO] Using STEP file: {step_file}")
        
        # Create document
        doc_name = "DebugTest"
        doc = FreeCAD.newDocument(doc_name)
        print(f"[OK] Document created: {doc_name}")
        
        try:
            # Import STEP
            print("[INFO] Importing STEP file...")
            Import.insert(step_file, doc_name)
            doc.recompute()
            print(f"[OK] STEP imported, objects in document: {len(doc.Objects)}")
            
            # Analyze objects
            valid_objects = []
            for i, obj in enumerate(doc.Objects):
                print(f"Object {i}: {obj.Label if hasattr(obj, 'Label') else 'Unnamed'}")
                print(f"  - Type: {obj.TypeId if hasattr(obj, 'TypeId') else 'Unknown'}")
                print(f"  - Has Shape: {hasattr(obj, 'Shape')}")
                
                if hasattr(obj, 'Shape'):
                    shape = obj.Shape
                    print(f"  - Shape valid: {shape.isValid()}")
                    print(f"  - Faces count: {len(shape.Faces)}")
                    print(f"  - Vertices count: {len(shape.Vertices)}")
                    
                    if len(shape.Faces) > 0:
                        valid_objects.append(obj)
                        
                        # Try mesh conversion
                        try:
                            print(f"  - Testing mesh conversion...")
                            mesh = MeshPart.meshFromShape(
                                Shape=shape,
                                LinearDeflection=0.1,
                                AngularDeflection=0.1,
                                Relative=False
                            )
                            print(f"  - Mesh facets: {mesh.CountFacets}")
                            print(f"  - Mesh points: {mesh.CountPoints}")
                            
                            if mesh.CountFacets > 0:
                                # Test STL export
                                with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp:
                                    temp_stl = tmp.name
                                
                                mesh.write(temp_stl)
                                stl_size = os.path.getsize(temp_stl)
                                print(f"  - STL exported: {temp_stl} ({stl_size} bytes)")
                                
                                # Test STL content
                                if stl_size > 84:  # Minimum STL size
                                    print(f"  - [OK] Object {i} mesh generation successful")
                                else:
                                    print(f"  - [WARN] Object {i} STL too small")
                                
                                os.unlink(temp_stl)
                            else:
                                print(f"  - [WARN] Object {i} mesh has no facets")
                                
                        except Exception as mesh_error:
                            print(f"  - [ERROR] Object {i} mesh conversion failed: {mesh_error}")
                
                print()  # Empty line for readability
            
            print(f"[SUMMARY] Valid objects for rendering: {len(valid_objects)}")
            
            return len(valid_objects) > 0
            
        finally:
            FreeCAD.closeDocument(doc_name)
            print("[INFO] Document closed")
            
    except Exception as e:
        print(f"[ERROR] Debug failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def debug_matplotlib_rendering():
    """Debug matplotlib rendering with sample data"""
    print("\n=== Matplotlib Rendering Debug ===")
    
    try:
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D
        from mpl_toolkits.mplot3d.art3d import Poly3DCollection
        import numpy as np
        
        print("[OK] Matplotlib modules imported")
        
        # Create simple test data (cube)
        vertices = np.array([
            [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # bottom
            [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # top
        ])
        
        faces = np.array([
            [0, 1, 2], [0, 2, 3],  # bottom
            [4, 6, 5], [4, 7, 6],  # top
            [0, 4, 1], [1, 4, 5],  # side 1
            [1, 5, 2], [2, 5, 6],  # side 2
            [2, 6, 3], [3, 6, 7],  # side 3
            [3, 7, 0], [0, 7, 4],  # side 4
        ])
        
        print(f"Test data: {len(vertices)} vertices, {len(faces)} faces")
        
        # Create triangles
        triangles = []
        for face in faces:
            triangle = vertices[face]
            triangles.append(triangle)
        
        print(f"Created {len(triangles)} triangles")
        
        # Test render
        fig = plt.figure(figsize=(8, 6), facecolor='white')
        ax = fig.add_subplot(111, projection='3d', facecolor='white')
        
        # Add triangles
        collection = Poly3DCollection(
            triangles,
            alpha=0.8,
            facecolors='lightblue',
            edgecolors='black',
            linewidths=0.5
        )
        ax.add_collection3d(collection)
        
        # Set limits
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1]) 
        ax.set_zlim([0, 1])
        
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('Test Cube Render')
        
        # Save test
        test_output = "debug_matplotlib_test.png"
        plt.savefig(test_output, dpi=150, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        plt.close()
        
        if os.path.exists(test_output):
            file_size = os.path.getsize(test_output)
            print(f"[OK] Test render saved: {test_output} ({file_size} bytes)")
            return True
        else:
            print(f"[FAIL] Test render not created")
            return False
            
    except Exception as e:
        print(f"[ERROR] Matplotlib test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("STEP BOM Analyzer - Debug Analysis")
    print("=" * 50)
    
    mesh_ok = debug_freecad_mesh_generation()
    render_ok = debug_matplotlib_rendering()
    
    print(f"\nDebug Results:")
    print(f"- FreeCAD Mesh Generation: {'OK' if mesh_ok else 'FAIL'}")
    print(f"- Matplotlib Rendering: {'OK' if render_ok else 'FAIL'}")
    
    if mesh_ok and render_ok:
        print("\n[CONCLUSION] Both systems work - issue might be in integration")
    elif not mesh_ok:
        print("\n[CONCLUSION] Problem is in FreeCAD mesh generation")
    elif not render_ok:
        print("\n[CONCLUSION] Problem is in matplotlib rendering")
    else:
        print("\n[CONCLUSION] Multiple issues detected")