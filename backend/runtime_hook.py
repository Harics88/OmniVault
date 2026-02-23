import os
import sys
from pathlib import Path

def setup_pythonnet():
    if not getattr(sys, 'frozen', False):
        return

    # 1. Base paths
    meipass = sys._MEIPASS
    root_dir = os.path.dirname(sys.executable)
    
    # 2. Force .NET Framework (netfx)
    # Industry way: Lock the runtime before clr is ever imported
    os.environ['PYTHONNET_RUNTIME'] = 'netfx'
    
    # 3. Locate Python.Runtime.dll
    # We bundle it to the root in our new spec
    runtime_dll_root = os.path.join(meipass, 'Python.Runtime.dll')
    runtime_dll_internal = os.path.join(meipass, '_internal', 'Python.Runtime.dll')
    
    if os.path.exists(runtime_dll_root):
        dll_dir = meipass
    elif os.path.exists(runtime_dll_internal):
        dll_dir = os.path.dirname(runtime_dll_internal)
    else:
        dll_dir = meipass # Fallback
        
    # Add to PATH and DLL search
    os.environ['PATH'] = dll_dir + os.pathsep + os.environ.get('PATH', '')
    if hasattr(os, 'add_dll_directory'):
        try:
            os.add_dll_directory(dll_dir)
        except:
            pass

    # 4. Locate Python DLL
    import glob
    python_dlls = glob.glob(os.path.join(meipass, 'python3*.dll'))
    if python_dlls:
        os.environ['PYTHONNET_PYDLL'] = python_dlls[0]

# Execute immediately
setup_pythonnet()
