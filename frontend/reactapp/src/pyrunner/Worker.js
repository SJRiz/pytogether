/* eslint-disable */
import * as Comlink from 'comlink';
import { loadPyodide } from "pyodide";
import {
  initPyodide,
  makeRunnerCallback,
  pyodideExpose,
  PyodideFatalErrorReloader
} from "pyodide-worker-runner";


const PYTHON_RUNNER_WRAPPER = `
from python_runner import PyodideRunner
import traceback
import types
import warnings
import io
import base64
import sys
import inspect
import os

warnings.filterwarnings(
    "ignore",
    message="FigureCanvasAgg is non-interactive",
    category=UserWarning
)

default_runner = PyodideRunner()

try:
    import matplotlib.pyplot as plt
    import matplotlib.animation as animation
    import colorama

    def fake_init(*args, **kwargs):
        # do absolutely nothing
        return None

    colorama.init = fake_init

    def custom_plt_show(*args, **kwargs):
        fig = plt.gcf()
        
        target_anim = None
        try:
            caller_frame = inspect.currentframe().f_back
            if caller_frame:
                for name, val in caller_frame.f_locals.items():
                    if isinstance(val, animation.Animation) and val._fig == fig:
                        target_anim = val
                        break
        except Exception:
            pass

        buf = io.BytesIO()
        output_format = 'png' # Default fallback

        if target_anim:
            try:
                temp_filename = "/tmp/temp_animation.gif"
                
                writer = animation.PillowWriter(fps=15)
                target_anim.save(temp_filename, writer=writer)
                
                with open(temp_filename, 'rb') as f:
                    buf.write(f.read())
                
                # Clean up the temp file
                if os.path.exists(temp_filename):
                    os.remove(temp_filename)

                output_format = 'gif'
                
            except Exception as e:
                print(f"Animation render failed: {e}")
                # Reset buffer if animation failed
                buf = io.BytesIO() 
                fig.savefig(buf, format='png')
                output_format = 'png'
        else:
            # 3. Standard Static Plot
            fig.savefig(buf, format='png')
            output_format = 'png'

        buf.seek(0)
        image_data = base64.b64encode(buf.read()).decode('utf-8')
        
        default_runner.output(
            "show_image",
            text="",
            data=image_data,
            format=output_format
        )
        
        plt.clf()

    plt.show = custom_plt_show

except ImportError:
    pass

def custom_serialize_traceback(self, exc):
    tb_list = traceback.format_exception(
        type(exc), exc, exc.__traceback__
    )
    user_traceback = [
        line for line in tb_list
        if "python_runner" not in line and "<exec>" not in line
    ]
    return {
        "text": "".join(user_traceback)
    }

default_runner.serialize_traceback = types.MethodType(custom_serialize_traceback, default_runner)

original_output = default_runner.output

def patched_output(self, *args, **kwargs):
    error_types = ("traceback", "syntax_error")
    if args and args[0] in error_types:
        args = ("internal_error",) + args[1:]
    elif 'type' in kwargs and kwargs['type'] in error_types:
        kwargs['type'] = "internal_error"
    original_output(*args, **kwargs)

default_runner.output = types.MethodType(patched_output, default_runner)

def check_entry(entry, callback):
    code_to_run = entry.input
    default_runner.set_filename("/main.py")
    default_runner.set_callback(callback)
    
    try:
        result = default_runner.run(code_to_run)
    finally:
        sys.settrace(None)
    
    return result
`;

// TEST FUNCTION: import matplotlib.pyplot as plt; import numpy as np; x = np.linspace(0, 10, 100); plt.plot(x, np.sin(x)); plt.show()

const reloader = new PyodideFatalErrorReloader(async () => {
  console.log("Loading Pyodide from jsDelivr CDN...");
  const pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/"
  });

  await initPyodide(pyodide);

  console.log("Loading micropip...");
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");

  console.log("Installing python_runner...");
  await micropip.install("python_runner");

  console.log("Installing colorama...");
  await micropip.install("colorama");
  
  console.log("Installing matplotlib...");
  await micropip.install("matplotlib");

  console.log("Installing Pillow for GIF support...");
  await micropip.install("Pillow");

  console.log("Setting Matplotlib backend to 'Agg'...");
  pyodide.runPython(`
    import matplotlib
    matplotlib.use('Agg')
  `);
  console.log("Patching urllib with whitelist...");

  console.log("Installing pandas...");
  await micropip.install("pandas");

  console.log("Installing scipy...");
  await micropip.install("scipy");

  console.log("Installing numpy...");
  await micropip.install("numpy");

  await pyodide.runPythonAsync(`
import urllib.request, urllib.parse, sys, types

ALLOWED_DOMAINS = {"pypi.org", "files.pythonhosted.org", "cdn.jsdelivr.net"}

_real_urlopen = urllib.request.urlopen

def _safe_urlopen(url, *args, **kwargs):
    from urllib.parse import urlparse
    u = url if isinstance(url, str) else getattr(url, "get_full_url", lambda: str(url))()
    host = urlparse(u).netloc.split(":")[0].lower()
    if host not in ALLOWED_DOMAINS:
        raise PermissionError(f"Network access to '{host}' not allowed.")
    return _real_urlopen(url, *args, **kwargs)

urllib.request.urlopen = _safe_urlopen
  `);

  pyodide.runPython(PYTHON_RUNNER_WRAPPER);
  
  console.log("Installation complete.");
  return pyodide;
});

async function init() {
  await reloader.withPyodide(async (pyodide) => {
    console.log("Pyodide worker initialized.");
  });
}


const runCode = pyodideExpose(
  async function (extras, entry, outputCallback, inputCallback) {
    let outputPromise;
    const callback = makeRunnerCallback(extras, {
      input: () => inputCallback(),
      output: (parts) => {
        outputPromise = outputCallback(parts);
      },
    });

    return await reloader.withPyodide(async (pyodide) => {
      const pyodide_worker_runner = pyodide.pyimport("pyodide_worker_runner");
      try {
        await pyodide_worker_runner.install_imports(entry.input);
      } catch (e) {
        console.error("Failed to install imports:", e);
      }

      const check_entry = pyodide.globals.get("check_entry");
      
      const result = check_entry(entry, callback);

      await outputPromise;
      if (result && typeof result.toJs === 'function') {
        return result.toJs({ dict_converter: Object.fromEntries });
      }
      return result;
    });
  },
);

Comlink.expose({ init, runCode });