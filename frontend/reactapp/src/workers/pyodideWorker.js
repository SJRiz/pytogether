let pyodide;
let interruptBuffer;
let executionTimeout;
let inputResolver = null;
let inputQueue = [];
let isWaitingForInput = false;

self.onmessage = async (event) => {
  const { type, code, timeout = 10000, input } = event.data;

  switch (type) {
    case 'LOAD_PYODIDE':
      await loadPyodide();
      break;
    case 'EXECUTE_CODE':
      await executePythonCode(code, timeout);
      break;
    case 'INTERRUPT':
      interruptExecution();
      break;
    case 'PROVIDE_INPUT':
      provideInput(input);
      break;
  }
};

async function loadPyodide() {
  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
    
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      stdout: (text) => {
        if (text.trim()) {
          self.postMessage({
            type: 'CONSOLE_OUTPUT',
            data: { text: text.trim(), type: 'output' }
          });
        }
      },
      stderr: (text) => {
        if (text.trim()) {
          self.postMessage({
            type: 'CONSOLE_OUTPUT',
            data: { text: text.trim(), type: 'error' }
          });
        }
      }
    });

    // Set up safe environment with async input
    await pyodide.runPython(`
import builtins
import asyncio
from js import Object, console

# Modules to block
BLOCKED_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", "threading", 
    "multiprocessing", "asyncio", "ctypes", "inspect", "pickle", 
    "ssl", "http", "xml", "sqlite3", "email", "site", "importlib"
}

# Backup the original __import__
_original_import = builtins.__import__

def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    if name in BLOCKED_MODULES:
        raise ImportError(f"Import of '{name}' is blocked for safety")
    return _original_import(name, globals, locals, fromlist, level)

builtins.__import__ = safe_import

# Global input queue and state
input_queue = []
waiting_for_input = False

async def async_input(prompt=""):
    global waiting_for_input
    
    if prompt:
        print(prompt, end="")
    
    # Signal that we're waiting for input
    waiting_for_input = True
    js_post_message({
        'type': 'INPUT_REQUEST',
        'data': {'prompt': prompt}
    })
    
    # Wait for input to be provided
    while not input_queue:
        await asyncio.sleep(0.1)
    
    waiting_for_input = False
    return input_queue.pop(0)

def provide_input(value):
    input_queue.append(value)

def js_post_message(message):
    # This will be handled by the proxy in the main execution
    pass

# Replace builtin input
builtins.input = async_input
builtins.raw_input = async_input  # Python 2 compatibility
    `);

    // Create a proxy for the js_post_message function
    pyodide.runPython(`
import js
def js_post_message_proxy(message):
    js.postMessage(message)
`);
    
    pyodide.globals.set('js', { postMessage: (msg) => self.postMessage(msg) });
    
    interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
    self.postMessage({ type: 'LOADED' });
  } catch (error) {
    self.postMessage({
      type: 'EXECUTION_ERROR',
      data: { error: `Failed to load Pyodide: ${error.message}` }
    });
  }
}

async function executePythonCode(code, timeout) {
  if (!pyodide) {
    self.postMessage({
      type: 'EXECUTION_ERROR',
      data: { error: 'Pyodide not loaded' }
    });
    return;
  }

  try {
    executionTimeout = setTimeout(() => {
      self.postMessage({ type: 'TIMEOUT_ERROR' });
    }, timeout);

    pyodide.setInterruptBuffer(interruptBuffer);

    // Wrap code in async function to handle async input
    const asyncCode = `
import asyncio
async def main():
${code.split('\n').map(line => '    ' + line).join('\n')}

await main()
    `;

    const result = await pyodide.runPythonAsync(asyncCode);
    
    clearTimeout(executionTimeout);
    
    self.postMessage({
      type: 'EXECUTION_COMPLETE',
      data: { result: result ? String(result) : 'Execution completed' }
    });
  } catch (error) {
    clearTimeout(executionTimeout);
    
    if (error.message.includes('interrupted')) {
      self.postMessage({
        type: 'EXECUTION_ERROR',
        data: { error: 'Execution interrupted by user' }
      });
    } else {
      self.postMessage({
        type: 'EXECUTION_ERROR',
        data: { error: error.message }
      });
    }
  }
}

function provideInput(input) {
  if (isWaitingForInput) {
    pyodide.runPython(`provide_input("${input}")`);
    isWaitingForInput = false;
  } else {
    inputQueue.push(input);
  }
}

function interruptExecution() {
  if (interruptBuffer) {
    interruptBuffer[0] = 2;
  }
  clearTimeout(executionTimeout);
  isWaitingForInput = false;
}