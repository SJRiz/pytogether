import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, Terminal, Code, X, GripVertical } from "lucide-react";

export default function PyIDE() {
  const [pyodide, setPyodide] = useState(null);
  const [code, setCode] = useState('print("Hello, PyTogether!")\nprint("Welcome to your Python IDE!")\n\n# Try some calculations\nfor i in range(3):\n    print(f"Count: {i}")\n\n# Test error handling\n# Uncomment the line below to see error output\n# print(undefined_variable)');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleWidth, setConsoleWidth] = useState(384); // Default width (w-96 = 384px)
  const [isDragging, setIsDragging] = useState(false);
  const consoleRef = useRef(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Console entry types
  const addConsoleEntry = (content, type = 'output', timestamp = new Date()) => {
    const entry = {
      id: Date.now() + Math.random(),
      content,
      type, // 'output', 'error', 'input'
      timestamp
    };
    setConsoleOutput(prev => [...prev, entry]);
  };

  // Load Pyodide with stdout/stderr capture
  useEffect(() => {
    async function loadPyodide() {
      try {
        addConsoleEntry("Loading Console...", "system");
        
        const pyodideModule = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          stdout: (text) => {
            if (text.trim()) {
              addConsoleEntry(text.trim(), "output");
            }
          },
          stderr: (text) => {
            if (text.trim()) {
              addConsoleEntry(text.trim(), "error");
            }
          }
        });

        // Set up custom input function
        pyodideModule.runPython(`
import builtins

def custom_input(prompt=""):
    import js
    if prompt:
        print(prompt, end="")
    result = js.prompt(prompt if prompt else "Enter input:")
    if result is None:
        raise KeyboardInterrupt("Input cancelled")
    print(result)  # Echo the input to console
    return result

# Override the built-in input function
builtins.input = custom_input
        `);

        setPyodide(pyodideModule);
        addConsoleEntry("Console loaded successfully!", "system");
        setIsLoading(false);
      } catch (err) {
        addConsoleEntry(`Failed to load console: ${err.message}`, "error");
        setIsLoading(false);
      }
    }
    loadPyodide();
  }, []);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Handle console resize
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = consoleWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = dragStartX.current - e.clientX; // Inverted because we're dragging the left edge
      const newWidth = Math.max(200, Math.min(800, dragStartWidth.current + deltaX));
      setConsoleWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, consoleWidth]);

  const runCode = async () => {
    if (!pyodide || isRunning) return;
    
    setIsRunning(true);
    addConsoleEntry(`>>> Running code...`, "input");
    
    try {
      // Clear any previous output and run the code
      const result = await pyodide.runPythonAsync(code);
      
      // Only show result if it's not None/null and not already captured by stdout
      if (result !== undefined && result !== null && result !== "") {
        addConsoleEntry(`${result}`, "output");
      }
      
      addConsoleEntry(`>>> Code execution completed`, "system");
    } catch (err) {
      // Parse Python error for better display
      const errorMsg = err.toString();
      addConsoleEntry(errorMsg, "error");
      addConsoleEntry(`>>> Code execution failed`, "system");
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEntryColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'input': return 'text-blue-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getEntryPrefix = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'input': return '▶️';
      case 'system': return '⚙️';
      default: return '✅';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Code className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-100">PyTogether</h1>
            <span className="text-sm text-gray-400">Real-time Python in the Browser</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {isLoading && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
            
            <button
              onClick={runCode}
              disabled={!pyodide || isRunning || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
            >
              <Play className="h-4 w-4" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-700">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">main.py</h2>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
              <span className="text-xs text-gray-500">Modified</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={[python()]}
              onChange={(value) => setCode(value)}
              className="h-full text-sm"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: true,
                searchKeymap: true,
              }}
            />
          </div>
        </div>

        {/* Console */}
        <div className="flex">
          {/* Resize Handle */}
          <div
            className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-ew-resize flex items-center justify-center group transition-colors duration-200 ${
              isDragging ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4 text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Console Panel */}
          <div 
            className="flex flex-col bg-gray-850" 
            style={{ width: `${consoleWidth}px` }}
          >
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-300">Console</h2>
            </div>
            
            <button
              onClick={clearConsole}
              className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              title="Clear Console"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
            </button>
          </div>
          
          <div 
            ref={consoleRef}
            className="flex-1 p-4 overflow-y-auto bg-gray-900 font-mono text-sm space-y-1"
          >
            {consoleOutput.length === 0 ? (
              <div className="text-gray-500 italic">Console output will appear here...</div>
            ) : (
              consoleOutput.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2 py-1">
                  <span className="text-xs text-gray-500 mt-0.5 min-w-[60px]">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span className="text-xs mt-0.5">
                    {getEntryPrefix(entry.type)}
                  </span>
                  <pre className={`flex-1 whitespace-pre-wrap break-words ${getEntryColor(entry.type)}`}>
                    {entry.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}