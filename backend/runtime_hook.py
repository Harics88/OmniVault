import os
import sys
from pathlib import Path

def setup_pythonnet():
    if not getattr(sys, 'frozen', False):
        return

    # 1. Base paths
    meipass = sys._MEIPASS
    root_dir = os.path.dirname(sys.executable)
    
    # 4. EXPLICIT LOAD (v2.6.10+): 
    # Force netfx at the first tick of the PyInstaller process.
    try:
        import pythonnet
        pythonnet.load("netfx")
        print("OmniVault: .NET Framework (netfx) locked successfully.")
    except Exception as e:
        print(f"OmniVault: Failed to lock netfx: {e}")

    # 5. Locate Python DLL for pythonnet
    import glob
    python_dlls = glob.glob(os.path.join(meipass, 'python3*.dll'))
    if python_dlls:
        os.environ['PYTHONNET_PYDLL'] = python_dlls[0]

# Execute immediately
setup_pythonnet()
