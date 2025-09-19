// this code is a huge big mess i will refactor this later when i have time
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { ArrowLeft, Play, Terminal, X, GripVertical, Users, Wifi, WifiOff, Edit2, Check, X as XIcon, Send } from "lucide-react";
import api from "../../axiosConfig";

// Y.js imports
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';

export default function PyIDE({ groupId: propGroupId, projectId: propProjectId, projectName: propProjectName }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get groupId and projectId from router state or props
  const groupId = propGroupId || location.state?.groupId;
  const projectId = propProjectId || location.state?.projectId;
  const initialProjectName = propProjectName || location.state?.projectName || "Untitled Project";
  
  const [code, setCode] = useState('print("Hello, PyTogether!")');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleWidth, setConsoleWidth] = useState(384);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  
  // Input handling state
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [inputResolve, setInputResolve] = useState(null);
  
  // Project name editing state
  const [projectName, setProjectName] = useState(initialProjectName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(initialProjectName);
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Y.js and WebSocket refs
  const ydocRef = useRef(null);
  const wsRef = useRef(null);
  const ytextRef = useRef(null);
  const editorViewRef = useRef(null);
  const consoleRef = useRef(null);
  const nameInputRef = useRef(null);
  const inputRef = useRef(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // latency tracking stuff
  const [latency, setLatency] = useState(null);
  const lastPingTimeRef = useRef(null);

  // Initialize Y.js document and WebSocket connection
  useEffect(() => {
    if (!groupId || !projectId) {
      console.error('Missing groupId or projectId:', { 
        groupId, 
        projectId,
        locationState: location.state,
        currentPath: window.location.pathname 
      });
      alert("Could not connect to the project. Redirecting back to groups.");
      navigate("/");
      return;
    }

    console.log('Initializing WebSocket with:', { groupId, projectId });

    // Create Y.js document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codetext');
    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    // Create WebSocket connection
    // Point to Django backend with JWT token
    // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Get JWT token
    const token = sessionStorage.getItem("access_token");
    const tokenParam = token ? `?token=${token}` : "";
    
    const wsBase = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
    const wsUrl = `${wsBase}/ws/groups/${groupId}/projects/${projectId}/code/${tokenParam}`;
    
    console.log('Attempting WebSocket connection');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Request initial sync
      ws.send(JSON.stringify({ type: 'request_sync' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'update') {
          // Apply remote update to Y.js document
          const updateBytes = Uint8Array.from(atob(data.update_b64), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, updateBytes);
        } else if (data.type === 'sync') {
          // Full document sync
          const stateBytes = Uint8Array.from(atob(data.ydoc_b64), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, stateBytes);
        } else if (data.type === 'initial') {
          // Initial content from database
          ytext.delete(0, ytext.length);
          ytext.insert(0, data.content || '');
        } else if (data.type === "connection") {
          // Use the full list sent by the backend
          if (data.users) {
            setConnectedUsers(data.users);
          }
        } else if (data.type === 'pong') {
            if (lastPingTimeRef.current && data.timestamp === lastPingTimeRef.current) {
              const newLatency = Date.now() - lastPingTimeRef.current;
              setLatency(newLatency);
              console.log(`Network latency: ${newLatency}ms`);
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      alert("Failed to connect to the project. Redirecting back to groups.");
      navigate("/");
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (!isConnected) { // If it never connected successfully
        navigate("/");
      }
      setIsConnected(false);
    };

    // Listen for Y.js updates to send to server
    const updateHandler = (update, origin) => {
      // Don't send updates that came from the network
      if (origin === ws || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      
      // Send update to server as base64
      const updateB64 = btoa(String.fromCharCode.apply(null, update));
      ws.send(JSON.stringify({
        type: 'update',
        update_b64: updateB64
      }));
    };

    ydoc.on('update', updateHandler);

    // Cleanup function
    return () => {
      ydoc.off('update', updateHandler);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      ydoc.destroy();
    };
  }, [groupId, projectId]);

  // useEffect hook for latency testing
  useEffect(() => {
    if (!isConnected || !wsRef.current) {
      return;
    }
    
    // Set up ping-pong latency test
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        lastPingTimeRef.current = Date.now();
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: lastPingTimeRef.current
        }));
      }
    }, 5000); // Test every 5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected]);

  // Sync Y.js text content with local code state for display
  useEffect(() => {
    if (!ytextRef.current) return;

    const ytext = ytextRef.current;
    
    // Initial sync
    setCode(ytext.toString());

    // Listen for changes
    const observer = () => {
      setCode(ytext.toString());
    };

    ytext.observe(observer);

    return () => {
      ytext.unobserve(observer);
    };
  }, [ytextRef.current]);

  // Focus on input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Focus on console input when waiting for input
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput]);

  // Console entry types
  const addConsoleEntry = (content, type = 'output', timestamp = new Date()) => {
    const entry = {
      id: Date.now() + Math.random(),
      content,
      type,
      timestamp
    };
    setConsoleOutput(prev => [...prev, entry]);
  };

  // Load Skulpt
  useEffect(() => {
    const loadSkulpt = async () => {
      try {
        addConsoleEntry("Loading Python interpreter...", "system");

        // Load Skulpt if not already loaded
        if (!window.Sk) {
          const loadScript = (src) => {
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = src;
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          };

          try {
            // Try the official Skulpt CDN first
            await loadScript('https://skulpt.org/js/skulpt.min.js');
            await loadScript('https://skulpt.org/js/skulpt-stdlib.js');
          } catch (error) {
            // Fallback to unpkg
            addConsoleEntry("Trying fallback CDN...", "system");
            await loadScript('https://unpkg.com/skulpt@0.11.1/dist/skulpt.min.js');
            await loadScript('https://unpkg.com/skulpt@0.11.1/dist/skulpt-stdlib.js');
          }

          addConsoleEntry("Python interpreter loaded successfully!", "system");
          setIsLoading(false);
        } else {
          addConsoleEntry("Python interpreter already loaded!", "system");
          setIsLoading(false);
        }
      } catch (err) {
        addConsoleEntry(`Failed to load interpreter: ${err.message || err}`, "error");
        addConsoleEntry("Try refreshing the page if the issue persists.", "system");
        setIsLoading(false);
      }
    };

    loadSkulpt();
  }, []);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Console resize handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = consoleWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = dragStartX.current - e.clientX;
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

  // Handle input submission
  const submitInput = () => {
    if (!waitingForInput || !inputResolve) return;
    
    addConsoleEntry(currentInput, "input");
    inputResolve(currentInput);
    setCurrentInput("");
    setWaitingForInput(false);
    setInputResolve(null);
    
    // Continue execution, so keep isRunning true
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitInput();
    }
  };

  const runCode = async () => {
    if (!window.Sk || isRunning) return;

    setIsRunning(true);
    addConsoleEntry(`>>> Running code...`, "input");

    const currentCode = ytextRef.current ? ytextRef.current.toString() : code;

    // Skulpt output callback
    const outf = (text) => {
      addConsoleEntry(text, "output");
    };

    // Skulpt input callback
    const inputfun = (promptText) => {
      return new Promise((resolve) => {
        if (promptText) {
          addConsoleEntry(promptText, "system");
        }
        setWaitingForInput(true);
        setInputResolve(() => (input) => {
          setWaitingForInput(false);
          resolve(input);
        });
      });
    };

    try {
      // Configure Skulpt
      Sk.configure({
        output: outf,
        read: (x) => {
          if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined) {
            throw `File not found: '${x}'`;
          }
          return Sk.builtinFiles.files[x];
        },
        inputfun,
        inputfunTakesPrompt: true,
        execLimit: 100000,
        yieldLimit: 100, // yield very frequently
        __future__: Sk.python3
      });

      await Sk.misceval.asyncToPromise(() => 
        Sk.importMainWithBody('<stdin>', false, currentCode, true)
      );
      
      if (!waitingForInput) {
        addConsoleEntry(">>> Code execution completed", "system");
      }
    } catch (err) {
      // Clear any pending input state on error
      setWaitingForInput(false);
      setInputResolve(null);
      
      let errorMessage = err.toString();
      
      addConsoleEntry(errorMessage, "error");
      addConsoleEntry(">>> Code execution failed", "system");
    } finally {
      if (!waitingForInput) {
        setIsRunning(false);
      }
    }
  };

  const clearConsole = () => {
    setConsoleOutput([]);
    // Also clear any pending input state
    setWaitingForInput(false);
    setInputResolve(null);
    setCurrentInput("");
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
      default: return '';
    }
  };

  // Project name editing functions
  const startEditingName = () => {
    setTempProjectName(projectName);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setTempProjectName(projectName);
  };

  const saveProjectName = async () => {
    if (tempProjectName.trim() === projectName || !tempProjectName.trim()) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      console.log(tempProjectName)
      await api.put(`/groups/${groupId}/projects/${projectId}/edit/`, { project_name: tempProjectName });
      setProjectName(tempProjectName);
      setIsEditingName(false);
      } catch (err) {
      console.error(err);
      } finally {
      setIsSavingName(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveProjectName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  };

  // Create CodeMirror extensions including Y.js collaboration
  const getCodeMirrorExtensions = () => {
    const extensions = [python()];
    
    // Add Y.js collaboration if available
    if (ytextRef.current) {
      extensions.push(
        yCollab(ytextRef.current, null, { 
          // The user ID will be handled by the WebSocket consumer
          // which already has authentication context
        })
      );
    }
    
    return extensions;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors duration-200"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img
                src="/pytog.png"
                alt="Code Icon"
                className="h-10 w-11"
            />
            <h1 className="text-xl font-semibold text-gray-100">PyTogether</h1>
            <span className="text-sm text-gray-400">Real-time Python Collaboration</span>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-400">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Disconnected</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Project Name - Centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-2 max-w-md w-full justify-center">
              {isEditingName ? (
                <>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={tempProjectName}
                    onChange={(e) => setTempProjectName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    disabled={isSavingName}
                    className="bg-gray-700 text-white px-2 py-1 rounded text-center w-full"
                  />
                  <button
                    onClick={saveProjectName}
                    disabled={isSavingName}
                    className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={cancelEditingName}
                    disabled={isSavingName}
                    className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-medium text-white truncate">{projectName}</h2>
                  <button
                    onClick={startEditingName}
                    className="p-1 text-gray-400 hover:text-gray-200"
                    title="Edit project name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
          {/* Active Users */}
          {connectedUsers.length > 0 && (
            <div className="flex flex-col text-gray-400">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">{connectedUsers.length} online</span>
              </div>
              {/* List of connected users */}
              <div className="flex flex-wrap gap-2 mt-1">
                {connectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="px-2 py-0.5 bg-gray-700 text-xs rounded-md truncate max-w-[100px]"
                    title={u.email}
                  >
                    {u.email}
                  </span>
                ))}
              </div>
            </div>
          )}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
            
            <button
              onClick={runCode}
              disabled={isRunning || isLoading}
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
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Synced' : 'Modified'}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={getCodeMirrorExtensions()}
              onChange={(value) => {
                // Handle manual changes when Y.js isn't connected
                if (!ytextRef.current && !isConnected) {
                  setCode(value);
                }
              }}
              onCreateEditor={(view) => {
                editorViewRef.current = view;
              }}
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
                {waitingForInput && (
                  <span className="text-xs text-blue-400 animate-pulse">Waiting for input...</span>
                )}
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

            {/* Input Area */}
            {waitingForInput && (
              <div className="border-t border-gray-700 bg-gray-800 p-3">
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Enter input..."
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={submitInput}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
                    title="Send Input"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Press Enter to send input
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}