import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { throttle } from "lodash";
import { jwtDecode } from "jwt-decode";
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ArrowLeft, Play, Terminal, X, GripVertical, Highlighter, Users, Wifi, WifiOff, Edit2, Check, Send, MessageSquare, Phone, PhoneOff, Mic, MicOff, Pencil, Eraser, Trash2, Eye, EyeOff, Download } from "lucide-react";
import api from "../../axiosConfig";

import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

// Y.js imports
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';

// Pyodide imports
import { runCodeTask, taskClient } from "../pyrunner/TaskClient.js";


// Define the appearance of the error line
const errorLineDeco = Decoration.line({ class: "cm-error-line" });

// Define effects to add or remove the error
const addErrorEffect = StateEffect.define();
const removeErrorEffect = StateEffect.define();

// Create a StateField to manage the decorations
const errorLineField = StateField.define({
  create() { return Decoration.none; },
  update(value, tr) {
    value = value.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addErrorEffect)) {
        // Find the line and apply the decoration
        try {
          value = Decoration.set([errorLineDeco.range(tr.state.doc.line(e.value).from)]);
        } catch (err) {
          console.error("Failed to apply error decoration:", err);
        }
      } else if (e.is(removeErrorEffect)) {
        // Remove all decorations
        value = Decoration.none;
      }
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f)
});


export default function PyIDE({ groupId: propGroupId, projectId: propProjectId, projectName: propProjectName }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // hide scrollbars & add error line style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .cm-error-line { background-color: rgba(255, 0, 0, 0.2); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  const groupId = propGroupId || location.state?.groupId;
  const projectId = propProjectId || location.state?.projectId;
  const initialProjectName = propProjectName || location.state?.projectName || "Untitled Project";

  const [code, setCode] = useState('print("Hello, PyTogether!")');
  const [consoleOutput, setConsoleOutput] = useState([]);

  // Pyodide States
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInput, setCurrentInput] = useState("");

  // Plot states
  const [showPlot, setShowPlot] = useState(false);
  const [plotSrc, setPlotSrc] = useState(null);

  const [errorLine, setErrorLine] = useState(null);

  const [consoleWidth, setConsoleWidth] = useState(384);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Project name editing state
  const [projectName, setProjectName] = useState(initialProjectName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(initialProjectName);
  const [isSavingName, setIsSavingName] = useState(false);

  // VC and chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [peers, setPeers] = useState({});

  // drawing tool state
  const [drawingMode, setDrawingMode] = useState('none'); // 'none', 'draw', 'erase'
  const [showDrawings, setShowDrawings] = useState(true);
  const lastDrawPointRef = useRef(null);
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraseWidth, setEraseWidth] = useState(20);

  const [drawings, setDrawings] = useState([]);
  const [latency, setLatency] = useState(null);
  
  const terminalRef = useRef(null);

  // Y.js and WebSocket refs
  const ydocRef = useRef(null);
  const codeUndoManagerRef = useRef(null);
  const wsRef = useRef(null);
  const ytextRef = useRef(null);
  const awarenessRef = useRef(null);
  const editorViewRef = useRef(null);
  const consoleRef = useRef(null);
  const chatRef = useRef(null);
  const nameInputRef = useRef(null);
  const inputRef = useRef(null);
  const chatInputRef = useRef(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const myUserIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioElementsRef = useRef({});
  const lastPingTimeRef = useRef(null);
  const simplePeerLoadedRef = useRef(false);
  const scrollerRef = useRef(null);
  const downloadMenuRef = useRef(null);

  // drawing stuff refs
  const ydrawingsRef = useRef(null);
  const drawingUndoManagerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null); // Ref for the <CodeMirror> parent div
  const ctxRef = useRef(null); // 2D drawing context
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);

  // Helper to get a clean filename
  const getCleanFilename = (extension) => {
    return (projectName || 'main').replace(/[^a-z0-9]/gi, '_').toLowerCase() + extension;
  };

  // .py Handler
  const handleDownloadPY = () => {
    if (!ytextRef.current) return;
    const code = ytextRef.current.toString();
    const blob = new Blob([code], { type: 'text/python;charset=utf-8' });
    saveAs(blob, getCleanFilename('.py'));
    setShowDownloadMenu(false); // Close menu
  };

  // .txt Handler
  const handleDownloadTXT = () => {
    if (!ytextRef.current) return;
    const code = ytextRef.current.toString();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, getCleanFilename('.txt'));
    setShowDownloadMenu(false); // Close menu
  };

  // .docx Handler
  const handleDownloadDOCX = () => {
    if (!ytextRef.current) return;
    const code = ytextRef.current.toString();
    const lines = code.split('\n');
    const paragraphs = lines.map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Courier New",
              size: 20, // 10pt
            }),
          ],
        })
    );
    const doc = new Document({ sections: [{ children: paragraphs }] });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, getCleanFilename('.docx'));
    });
    setShowDownloadMenu(false); // Close menu
  };

  // .pdf Handler
  const handleDownloadPDF = () => {
    if (!ytextRef.current) return;
    const code = ytextRef.current.toString();
    const doc = new jsPDF();
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    
    const margin = 10;
    const lineHeight = 5;
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const allLines = code.split('\n');
    
    let currentY = margin;

    allLines.forEach((line) => {
      const wrappedLines = doc.splitTextToSize(line, maxWidth);

      wrappedLines.forEach((wrappedLine) => {
        if (currentY + lineHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        
        // Add the line of text
        doc.text(wrappedLine, margin, currentY);
        
        currentY += lineHeight;
      });
    });

    // Save the complete document
    doc.save(getCleanFilename('.pdf'));
    setShowDownloadMenu(false);
  };

  // Load SimplePeer from CDN
  useEffect(() => {
    const loadSimplePeer = () => {
      if (window.SimplePeer || simplePeerLoadedRef.current) {
        simplePeerLoadedRef.current = true;
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/simple-peer/9.11.1/simplepeer.min.js';
        script.onload = () => {
          simplePeerLoadedRef.current = true;
          console.log('SimplePeer loaded successfully');
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadSimplePeer().catch(err => {
      console.error('Failed to load SimplePeer:', err);
    });
  }, []);

  const addConsoleEntry = (content, type = 'output', timestamp = new Date()) => {
    setConsoleOutput(prev => [...prev, { id: Date.now() + Math.random(), content, type, timestamp }]);
  };

  // Initialize Y.js document and WebSocket connection
  useEffect(() => {
    if (!groupId || !projectId) {
      console.error('Missing groupId or projectId');
      alert("Could not connect to the project. Redirecting back to groups.");
      navigate("/home");
      return;
    }

    // Connect the Pyodide runner's ref to our console state
    terminalRef.current = {
      pushToStdout: (parts) => {
        parts.forEach(part => {
          if (part.type === 'show_image') {

            // MATPLOTLIB LOGIC
            const src = `data:image/${part.format};base64,${part.data}`;
            setPlotSrc(src);
            setShowPlot(true);
            setShowChat(false); // Toggle off chat
          } else if (part.type === 'input_prompt') {
            // Handle Pyodide input()
            addConsoleEntry(part.text, "system");
            setWaitingForInput(true);
          } else if (part.type === 'internal_error') {
            // Handle Pyodide errors
            addConsoleEntry(part.text, "error");
            // ERROR LINE LOGIC (find last traceback line)
            const matches = [...part.text.matchAll(/File "\/main\.py", line (\d+)/g)];
            if (matches.length > 0) {
              const lastMatch = matches[matches.length - 1];
              setErrorLine(parseInt(lastMatch[1]));
            }
          } else {
            // Handle standard output
            addConsoleEntry(part.text, "output");
          }
        });
      },
      clearStdout: () => {
        setConsoleOutput([]);
        setPlotSrc(null); // Also clear the plot
      },
      focusTerminal: () => {
        inputRef.current?.focus();
      },
    };
    //


    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codetext');
    const ydrawings = ydoc.getArray('drawings');

    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    ydrawingsRef.current = ydrawings;

    const drawingUndoManager = new Y.UndoManager(ydrawings);
    drawingUndoManagerRef.current = drawingUndoManager;

    const codeUndoManager = new Y.UndoManager(ytext, {
      trackedOrigins: new Set([null]), // y-codemirror transactions often have null origin locally
      captureTimeout: 150
    });
    codeUndoManagerRef.current = codeUndoManager;

    // Create WebSocket connection
    // Point to Django backend with JWT token
    // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Get JWT token
    const token = sessionStorage.getItem("access_token");
    const myUserId = jwtDecode(token).user_id;
    myUserIdRef.current = myUserId;
    const tokenParam = token ? `?token=${token}` : "";
    
    const wsBase = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
    const wsUrl = `${wsBase}/ws/groups/${groupId}/projects/${projectId}/code/${tokenParam}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Awareness (tracks selections)
    const awareness = new Awareness(ydoc);
    awarenessRef.current = awareness;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // initial sync
      ws.send(JSON.stringify({ type: 'request_sync' }));
    };


    // Event handler
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'update') {
          // Document update
          const update = Uint8Array.from(atob(data.update_b64), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, update, 'server');

        } else if (data.type === 'awareness') {
          // Awareness update
          const update = Uint8Array.from(atob(data.update_b64), c => c.charCodeAt(0));
          applyAwarenessUpdate(awareness, update);

        } else if (data.type === "remove_awareness") {
          // loop through awareness states and remove disconnected ones
          const uid = data.user_id;
          const clientsToRemove = [];
          awareness.getStates().forEach((state, clientID) => {
            if (state.user && state.user.id === uid) {
              clientsToRemove.push(clientID);
            }
          });
          if (clientsToRemove.length > 0) {
            awareness.states = new Map([...awareness.getStates()].filter(([id]) => !clientsToRemove.includes(id)));
            awareness.emit('change', [{ added: [], updated: [], removed: clientsToRemove }, 'remote']);
          }

        } else if (data.type === 'sync') {
          // Full document sync
          const stateBytes = Uint8Array.from(atob(data.ydoc_b64), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, stateBytes, 'server');

        } else if (data.type === 'initial') {
          // Initial content from db
          ydoc.transact(() => {
              ytext.delete(0, ytext.length);
              ytext.insert(0, data.content || '');
            }, 'server');
          codeUndoManagerRef.current?.clear();
          drawingUndoManagerRef.current?.clear();

        } else if (data.type === "connection") {
          // get all users
          if (data.users) {
            const me = data.users.find(u => u.id === myUserId); 
            if (me) {
              // find urself and initalize awareness
              awareness.setLocalStateField("user", {
                id: me.id,
                name: me.email,
                color: me.color,
                colorLight: me.colorLight
              });
            }
            setConnectedUsers(data.users);
          }

        } else if (data.type === 'pong') {
          if (lastPingTimeRef.current && data.timestamp === lastPingTimeRef.current) {
            const newLatency = Date.now() - lastPingTimeRef.current;
            setLatency(newLatency);
            console.log(`Network latency: ${newLatency}ms`);
          }

        } else if (data.type === 'chat_message') {
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            message: data.message,
            userId: data.user_id,
            userEmail: data.user_email,
            color: data.color,
            timestamp: new Date(data.timestamp * 1000),
            isMe: data.user_id === myUserId.toString()
          }]);
        } else if (data.type === 'voice_room_update') {
          setVoiceParticipants(data.participants || []);
        } else if (data.type === 'voice_signal') {
          handleVoiceSignal(data.from_user, data.signal_data);
        }

      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      alert("Failed to connect to the project. Redirecting back to groups.");
      navigate("/home");
    };

    ws.onclose = (event) => {
      console.log('Disconnected.');
      awareness.setLocalState(null);
      if (event.code === 4000) {
        alert("You have been disconnected due to a server update. All your work has been saved. Please check back in 1-2 minutes.");
      }
      if (!isConnected) {
        navigate("/home");
      }
      setIsConnected(false);
      cleanupVoiceCall();
    };
    
    // Listen for Y.js updates to send to server
    const updateHandler = (update, origin) => {
       // Don't send updates that came from the network
      if (origin === ws || !ws || ws.readyState !== WebSocket.OPEN) return;

      if (origin !== 'remote') {
        setErrorLine(null);
      }

      // Send update to server as base64
      const updateB64 = btoa(String.fromCharCode.apply(null, update));
      ws.send(JSON.stringify({
        type: 'update',
        update_b64: updateB64
      }));
    };

    const awarenessHandler = ({ added, updated, removed }) => {
      // Convert Sets to arrays
      const clients = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(awareness, clients);
      const updateB64 = btoa(String.fromCharCode.apply(null, update));

      ws.send(JSON.stringify({
        type: 'awareness',
        update_b64: updateB64
      }));
    };
    // Throttle it to fire at most once every 100 ms
    const throttledAwarenessHandler = throttle(awarenessHandler, 100, { leading: true, trailing: true });

    ydoc.on('update', updateHandler);
    awareness.on("update", throttledAwarenessHandler);

    // Cleanup function
    return () => {
      ydoc.off('update', updateHandler);
      awareness.off('update', awarenessHandler);
      drawingUndoManager.destroy();
      codeUndoManager.destroy();
      cleanupVoiceCall();
      if (ws.readyState === WebSocket.OPEN) ws.close();
      ydoc.destroy();
      awareness.destroy();
    };
  }, [groupId, projectId]);

  // useEffect hook for latency testing
  useEffect(() => {
    if (!isConnected || !wsRef.current) return;
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        lastPingTimeRef.current = Date.now();
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: lastPingTimeRef.current }));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Sync Y.js text content with local code state for display
  useEffect(() => {
    if (!ytextRef.current) return;
    const ytext = ytextRef.current;
    setCode(ytext.toString());

    // Listen for changes
    const observer = () => setCode(ytext.toString());
    ytext.observe(observer);
    return () => ytext.unobserve(observer);
  }, [ytextRef.current]);

  // Sync Y.js drawings array with local React state
  useEffect(() => {
    if (!ydrawingsRef.current) return;

    const ydrawings = ydrawingsRef.current;

    const observer = () => {
      setDrawings(ydrawings.toArray());
    };

    // Listen for changes
    ydrawings.observe(observer);
    
    // Initial load
    observer();

    return () => ydrawings.unobserve(observer);
  }, [ydrawingsRef.current]);

  // Focus on input when editing project name starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Focus on console input when waiting for input
  useEffect(() => {
    if (waitingForInput && inputRef.current) inputRef.current.focus();
  }, [waitingForInput]);

  // Effect to close download menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    // Add listener
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load Pyodide Worker
  useEffect(() => {
    const initializePyodide = async () => {
      setIsLoading(true);
      addConsoleEntry("Loading Python interpreter...", "system");
      try {
        await taskClient.call(taskClient.workerProxy.init);
        addConsoleEntry("Python interpreter loaded successfully!", "system");
      } catch (err) {
        console.error("Pyodide init failed:", err);
        addConsoleEntry(`Failed to load interpreter: ${err.message || err}`, "error");
        addConsoleEntry("Try refreshing the page if the issue persists.", "system");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePyodide();
  }, []); // Runs once on mount


  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    if (errorLine) {
      view.dispatch({ effects: addErrorEffect.of(errorLine) });
    } else {
      view.dispatch({ effects: removeErrorEffect.of() });
    }
  }, [errorLine]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleOutput]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

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
    const handleMouseUp = () => setIsDragging(false);
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

  // Helper to get coordinates relative to the canvas
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const scroller = scrollerRef.current; // Get the scroller
    if (!canvas || !scroller) return { x: 0, y: 0, docX: 0, docY: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; // Viewport X (relative to canvas)
    const y = e.clientY - rect.top; 	// Viewport Y (relative to canvas)
    
    // Calculate the document-relative (scrolled) coordinates
    const docX = x + scroller.scrollLeft;
    const docY = y + scroller.scrollTop;
    
    return { x, y, docX, docY };
  };

  // Function to redraw all paths from the drawings state
  const redrawAllDrawings = useCallback(() => {
    const ctx = ctxRef.current;
    const scroller = scrollerRef.current;

    if (!ctx || !scroller) {
      if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    const { scrollTop, scrollLeft } = scroller;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!showDrawings) return;

    drawings.forEach(path => {
      if (path.points.length < 2) return;

      // Get the first saved point and transform it
      const firstPoint = path.points[0];
      const viewX = firstPoint.x - scrollLeft;
      const viewY = firstPoint.y - scrollTop;

      ctx.beginPath();
      ctx.moveTo(viewX, viewY);

      // Transform and draw the rest of the points
      for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i];
        ctx.lineTo(point.x - scrollLeft, point.y - scrollTop);
      }
      
      ctx.strokeStyle = path.type === 'erase' ? '#000000' : path.color;
      ctx.lineWidth = path.width;
      ctx.globalCompositeOperation = path.type === 'erase' ? 'destination-out' : 'source-over';
      ctx.stroke();
      ctx.closePath();
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }, [drawings, showDrawings]);

  // This effect attaches the scroll listener
  useEffect(() => {
    const scroller = scrollerRef.current;
    // Wait for both the scroller AND the connection to be ready
    if (!scroller || !isConnected) return;

    scroller.addEventListener('scroll', redrawAllDrawings);

    // Cleanup function
    return () => {
      scroller.removeEventListener('scroll', redrawAllDrawings);
    };
  }, [redrawAllDrawings, isConnected]);
  
  // Effect to handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container || !isConnected) return;

    // Store the 2D context
    ctxRef.current = canvas.getContext('2d');
    ctxRef.current.lineCap = 'round';
    ctxRef.current.lineJoin = 'round';

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      canvas.width = width;
      canvas.height = height;
      redrawAllDrawings(); // Redraw on resize
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [redrawAllDrawings, isConnected]);

  // Effect to redraw when drawings state changes
  useEffect(() => {
    redrawAllDrawings();
  }, [drawings, showDrawings]);


  // Canvas Event Handlers 
  const handleCanvasMouseDown = (e) => {
    if (drawingMode === 'none') return;
    isDrawingRef.current = true;
    
    const ctx = ctxRef.current;
    const { x, y, docX, docY } = getCoords(e);
    
    currentPathRef.current = [{ x: docX, y: docY }];
    
    lastDrawPointRef.current = { x, y };

    if (drawingMode === 'erase') {
      ctx.lineWidth = eraseWidth;
      ctx.globalCompositeOperation = 'destination-out';
    } else if (drawingMode === 'highlight') {
      ctx.lineWidth = 20;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)'; 
    } else {
      ctx.lineWidth = strokeWidth;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawingRef.current || drawingMode === 'none') return;

    const ctx = ctxRef.current;
    const { x, y, docX, docY } = getCoords(e);

    currentPathRef.current.push({ x: docX, y: docY });

    if (lastDrawPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastDrawPointRef.current.x, lastDrawPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
    }

    lastDrawPointRef.current = { x, y };
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current || drawingMode === 'none') return;
    isDrawingRef.current = false;
    ctxRef.current.closePath();

    // Determine width and color based on mode
    let currentWidth = strokeWidth;
    let currentColor = drawColor;

    if (drawingMode === 'erase') {
      currentWidth = eraseWidth;
    } else if (drawingMode === 'highlight') {
      currentWidth = 20;
      currentColor = 'rgba(255, 255, 0, 0.15)';
    }

    const newPath = {
      type: drawingMode,
      color: currentColor, // Saves the transparent yellow
      width: currentWidth,
      points: currentPathRef.current,
    };
    
    if (ydrawingsRef.current) {
      ydrawingsRef.current.push([newPath]);
    }
    
    drawingUndoManagerRef.current?.stopCapturing();
    currentPathRef.current = [];
  };

  // Action for "Delete All" button
  const deleteAllDrawings = () => {
    if (ydrawingsRef.current) {
      ydrawingsRef.current.delete(0, ydrawingsRef.current.length);
    }
  };

  // Undo/Redo Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlZ = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z';
      const isCtrlY = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y';
      
      if (isCtrlZ || isCtrlY) {
        const isRedo = e.shiftKey || isCtrlY;

        // Drawing Tool Selected -> Drawing History
        if (drawingMode !== 'none') {
          e.preventDefault();
          e.stopPropagation();
          
          if (isRedo) {
            drawingUndoManagerRef.current?.redo();
          } else {
            drawingUndoManagerRef.current?.undo();
          }
        }
        
        else {
          e.preventDefault();
          e.stopPropagation();

          if (isRedo) {
            codeUndoManagerRef.current?.redo();
          } else {
            codeUndoManagerRef.current?.undo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [drawingMode]);

  // Handle input submission
  const submitInput = async () => {
    if (!waitingForInput) return;
    addConsoleEntry(currentInput, "input");
    const command = currentInput;
    setCurrentInput("");
    setWaitingForInput(false);
    // Send the input to the waiting worker
    try {
      await taskClient.writeMessage(command);
    } catch (e) {
      console.warn("Write message failed:", e);
      addConsoleEntry("Failed to send input.", "error");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitInput();
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat_message', message: chatInput.trim() }));
    setChatInput("");
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const joinVoiceCall = async () => {
    if (!window.SimplePeer && !simplePeerLoadedRef.current) {
      alert('Voice chat is loading. Please try again in a moment.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setInVoiceCall(true);
      setIsMuted(false);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'join_voice' }));
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const leaveVoiceCall = () => {
    cleanupVoiceCall();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_voice' }));
    }
    setInVoiceCall(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const cleanupVoiceCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    Object.values(audioElementsRef.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.srcObject = null;
      }
    });
    audioElementsRef.current = {};
    Object.values(peersRef.current).forEach(peer => {
      if (peer) peer.destroy();
    });
    peersRef.current = {};
    setPeers({});
  };

  const createPeer = (userId, initiator, stream) => {
    if (!window.SimplePeer) {
      console.error('SimplePeer is not available');
      return null;
    }
    const peer = new window.SimplePeer({ 
      initiator, 
      trickle: false, 
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', signal => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'voice_signal', target_user: userId, signal_data: signal }));
      } else {
        console.error('WebSocket not open, cannot send signal');
      }
    });

    peer.on('stream', remoteStream => {
      
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.volume = 1.0;
      audioElementsRef.current[userId] = audio;
      
      audio.play().then(() => {
        console.log(`Successfully playing audio from user ${userId}`);
      }).catch(err => {
        setTimeout(() => audio.play().catch(e => console.error('Retry failed:', e)), 1000);
      });
    });

    peer.on('error', err => console.error(`❌ Peer error with user ${userId}:`, err));
    
    peer.on('close', () => {
      if (audioElementsRef.current[userId]) {
        audioElementsRef.current[userId].pause();
        audioElementsRef.current[userId].srcObject = null;
        delete audioElementsRef.current[userId];
      }
    });

    peersRef.current[userId] = peer;
    setPeers(prev => ({ ...prev, [userId]: peer }));
    return peer;
  };

  const handleVoiceSignal = (fromUser, signalData) => {
    
    if (!localStreamRef.current) {
      return;
    }

    let peer = peersRef.current[fromUser];
    
    if (!peer) {
      peer = createPeer(fromUser, false, localStreamRef.current);
    }
    
    if (!peer) {
      return;
    }
    
    try {
      peer.signal(signalData);
    } catch (err) {
      console.error(`Error signaling peer ${fromUser}:`, err);
    }
  };

  useEffect(() => {
    if (!localStreamRef.current) return;
    
    const myUserId = myUserIdRef.current.toString();
    
    voiceParticipants.forEach(participant => {
      if (participant.id !== myUserId && !peersRef.current[participant.id]) {
        const shouldInitiate = myUserId > participant.id;
        createPeer(participant.id, shouldInitiate, localStreamRef.current);
      }
    });
    
    Object.keys(peersRef.current).forEach(userId => {
      const stillInCall = voiceParticipants.some(p => p.id === userId);
      if (!stillInCall) {
        const peer = peersRef.current[userId];
        if (peer) peer.destroy();
        delete peersRef.current[userId];
        
        if (audioElementsRef.current[userId]) {
          audioElementsRef.current[userId].pause();
          audioElementsRef.current[userId].srcObject = null;
          delete audioElementsRef.current[userId];
        }
        
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });
      }
    });
  }, [voiceParticipants]);

  // Effect to update the browser tab title
  useEffect(() => {
    if (projectName) {
      document.title = `${projectName} - PyTogether`;
    }
    
    return () => {
      document.title = 'Unnamed - PyTogether';
    };
  }, [projectName]);


  const handleStopCode = () => {
    taskClient.interrupt();
    setWaitingForInput(false);
    setIsRunning(false);
    addConsoleEntry(">>> Execution stopped by user", "system");
  };

  const handleRunEditorCode = async () => {
    if (isLoading || isRunning) return;
    setIsRunning(true);
    setErrorLine(null); // Clear error line
    setPlotSrc(null); // Clear old plot
    addConsoleEntry(`>>> Running code...`, "input");
    const currentCode = ytextRef.current ? ytextRef.current.toString() : code;
    
    const entry = { input: currentCode };

    try {
      // Call the Pyodide runner task
      await runCodeTask(
        entry,
        (parts) => terminalRef.current.pushToStdout(parts),
        () => terminalRef.current.focusTerminal()
      );
      if (!waitingForInput) {
        addConsoleEntry(">>> Code execution completed", "system");
      }
    } catch (err) {
      // This catches JS-side errors from the worker (e.g., InterruptError)
      setWaitingForInput(false);
      if (err.type !== "InterruptError") {
        addConsoleEntry(err.toString(), "error");
        addConsoleEntry(">>> Code execution failed", "system");
      }
    } finally {
      // Only set isRunning to false if we're not waiting for input
      if (!waitingForInput) {
        setIsRunning(false);
      }
    }
  };

  const clearConsole = () => {
    setConsoleOutput([]);
    setPlotSrc(null);
    setWaitingForInput(false);
    setCurrentInput("");
  };

  const formatTimestamp = (timestamp) => timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const getEntryColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'input': return 'text-blue-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-white';
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
    if (e.key === 'Enter') saveProjectName();
    else if (e.key === 'Escape') cancelEditingName();
  };

  return (
    <div className="min-h-screen bg-slate-850 text-gray-100 overflow-x-hidden custom-scrollbar">
      
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-850">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <button 
              onClick={() => {
                if (isRunning) {
                  taskClient.interrupt();
                  setIsRunning(false);
                }
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.close();
                }
                navigate('/home');
              }} 
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors duration-200" 
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
              <div className="flex items-center gap-3">
              <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-10"></div>
                  <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-xl border border-gray-700/50">
                  <img
                      src="/pytog.png"
                      alt="Code Icon"
                      className="h-8 w-8"
                  />
                  </div>
              </div>
              <div>
                  <h1 className="text-2xl font-bold pl-2 bg-clip-text">
                  PyTogether
                  </h1>
              </div>
              </div>
            {/* Connection Status */}
            <div className="flex items-center space-x-2 pl-2">
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

          {/* Project Name */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-2 max-w-md w-full justify-center">
              {isEditingName ? (
                <>
                  <input ref={nameInputRef} type="text" value={tempProjectName} onChange={(e) => setTempProjectName(e.target.value)} onKeyDown={handleNameKeyDown} disabled={isSavingName} className="bg-gray-700 text-white px-2 py-1 rounded text-center w-full" />
                  <button onClick={saveProjectName} disabled={isSavingName} className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={cancelEditingName} disabled={isSavingName} className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-medium text-white truncate">{projectName}</h2>
                  <button onClick={startEditingName} className="p-1 text-gray-400 hover:text-gray-200" title="Edit project name">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Download */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(prev => !prev)}
                  className="p-1 text-gray-400 hover:text-gray-200"
                  title="Download project"
                >
                  <Download className="h-4 w-4" />
                </button>

                {showDownloadMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50">
                    <ul className="py-1">
                      <li
                        onClick={handleDownloadPY}
                        className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer flex items-center space-x-2"
                      >
                        <span>Download as .py</span>
                      </li>
                      <li
                        onClick={handleDownloadTXT}
                        className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer flex items-center space-x-2"
                      >
                        <span>Download as .txt</span>
                      </li>
                      <li
                        onClick={handleDownloadDOCX}
                        className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer flex items-center space-x-2"
                      >
                        <span>Download as .docx</span>
                      </li>
                      <li
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer flex items-center space-x-2"
                      >
                        <span>Download as .pdf</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Drawing Controls */}
            <div className="flex items-center space-x-1 p-1 bg-gray-700 rounded-lg">
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="w-9 h-9 p-1 bg-transparent border-none cursor-pointer hover:bg-gray-600 rounded transition-colors"
                  title="Change Pen Color"
                />
              <button
                onClick={() => setDrawingMode(p => p === 'draw' ? 'none' : 'draw')}
                title="Draw"
                className={`p-2 rounded ${drawingMode === 'draw' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDrawingMode(p => p === 'highlight' ? 'none' : 'highlight')}
                title="Highlighter"
                className={`p-2 rounded ${drawingMode === 'highlight' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}
              >
                <Highlighter className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDrawingMode(p => p === 'erase' ? 'none' : 'erase')}
                title="Erase"
                className={`p-2 rounded ${drawingMode === 'erase' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}
              >
                <Eraser className="h-4 w-4" />
              </button>
                <button
                  onClick={() => setShowDrawings(p => !p)}
                  title={showDrawings ? "Hide Drawings" : "Show Drawings"}
                  className="p-2 hover:bg-gray-600 rounded"
                >
                {showDrawings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear all drawings for everyone?')) {
                    deleteAllDrawings();
                  }
                }}
                title="Delete All Drawings"
                className="p-2 hover:bg-red-500/50 rounded text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Voice Chat */}
            <div className="flex items-center space-x-2">
              {!inVoiceCall ? (
                <button
                  onClick={joinVoiceCall}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                  title="Join Voice Call"
                >
                  <Phone className="h-4 w-4 text-white" />
                  <span className="text-sm text-white">Voice Chat</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-white" />}
                  </button>
                  <button
                    onClick={leaveVoiceCall}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                    title="Leave Call"
                  >
                    <PhoneOff className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">Leave</span>
                  </button>
                </div>
              )}
              {voiceParticipants.length > 0 && (
                <div className="flex items-center space-x-1 text-gray-400">
                  <Phone className="h-3 w-3" />
                  <span className="text-xs">{voiceParticipants.length}</span>
                </div>
              )}
            </div>

            {/* Active Users */}
            {connectedUsers.length > 0 && (
              <div className="flex flex-col text-gray-400">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{connectedUsers.length} online</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {connectedUsers.map((u) => (
                    <span key={u.id} className="px-2 py-0.5 text-xs rounded-md truncate max-w-[100px]" title={u.email} style={{ backgroundColor: u.colorLight || '#888', color: u.color || '#000' }}>
                      {u.email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Run Code */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
            {!isLoading && !isRunning && (
            <button onClick={handleRunEditorCode} disabled={isRunning || isLoading} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors duration-200">
              <Play className="h-4 w-4" />
              <span>Run Code</span>
            </button>
            )}
            {isRunning && (
              <button onClick={handleStopCode} className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200">
                <X className="h-4 w-4" />
                <span>Stop Code</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">

        {/* Code Editor */}
        <div 
          ref={canvasContainerRef} 
          className="flex-1 flex flex-col border-r border-gray-700 min-w-0 relative"
        >
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between z-20">
            <h2 className="text-sm font-medium text-gray-300">main.py</h2>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
              <span className="text-xs text-gray-500">{isConnected ? 'Synced' : 'Modified'}</span>
            </div>
          </div>
          {ytextRef.current && isConnected ? (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <CodeMirror
                value={code}
                height="100%"
                theme={oneDark}
                extensions={[
                  python(), 
                  yCollab(ytextRef.current, awarenessRef.current, { undoManager: codeUndoManagerRef.current }), 
                  errorLineField
                ]}
                onChange={(value) => {
                  if (!ytextRef.current && !isConnected) setCode(value);
                }}
                onCreateEditor={(view) => { editorViewRef.current = view; scrollerRef.current = view.dom.querySelector('.cm-scroller');}}
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
              {/* Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
                style={{
                  // Click-through when not drawing
                  pointerEvents: drawingMode !== 'none' ? 'auto' : 'none',
                  zIndex: 10,
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp} // Stop drawing if mouse leaves
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wifi className="h-6 w-6 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 font-medium">Connecting to '{projectName}'...</p>
                  <p className="text-gray-500 text-sm mt-1">Establishing secure connection</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Console */}
        <div className="flex">
          {/* Resize Handler */}
          <div className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-ew-resize flex items-center justify-center group transition-colors duration-200 ${isDragging ? 'bg-blue-500' : ''}`} onMouseDown={handleMouseDown}>
            <GripVertical className="h-4 w-4 text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Console Panel */}
          <div className="flex flex-col bg-gray-850" style={{ width: `${consoleWidth}px` }}>
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-medium text-gray-300">Console</h2>
                {waitingForInput && <span className="text-xs text-blue-400 animate-pulse">Waiting for input...</span>}
              </div>
              {/* toggles */}
              <div className="flex items-center">
                <button 
                  onClick={() => { setShowChat(!showChat); if (!showChat) setShowPlot(false); }} 
                  className={`p-1 hover:bg-gray-700 rounded ${showChat ? 'text-blue-400' : 'text-gray-400'}`} 
                  title={showChat ? "Hide Chat" : "Show Chat"}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => { setShowPlot(!showPlot); if (!showPlot) setShowChat(false); }} 
                  className={`p-1 hover:bg-gray-700 rounded ${showPlot ? 'text-blue-400' : 'text-gray-400'}`} 
                  title={showPlot ? "Hide Plot" : "Show Plot"}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={clearConsole} className="p-1 hover:bg-gray-700 rounded transition-colors duration-200" title="Clear Console">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
                </button>
              </div>

            </div>
            
            <div ref={consoleRef} className="flex-1 p-4 overflow-y-auto bg-gray-900 font-mono text-sm space-y-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {consoleOutput.length === 0 ? (
                <div className="text-gray-500 italic">Console output will appear here...</div>
              ) : (
                consoleOutput.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-2 py-1">
                    <span className="text-xs text-gray-500 mt-0.5 min-w-[60px]">{formatTimestamp(entry.timestamp)}</span>
                    <span className="text-xs mt-0.5">{getEntryPrefix(entry.type)}</span>
                    <pre className={`flex-1 whitespace-pre-wrap break-words ${getEntryColor(entry.type)}`}>{entry.content}</pre>
                  </div>
                ))
              )}
            </div>
              
            {/* Input Area */}
            {waitingForInput && (
              <div className="border-t border-gray-700 bg-gray-800 p-3">
                <div className="flex items-center space-x-2">
                  <input ref={inputRef} type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Enter input..." className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={submitInput} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200" title="Send Input">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">Press Enter to send input</div>
              </div>
            )}

            {/* plot panel */}
            <div 
              className="border-t border-gray-700 flex-col" 
              style={{ 
                height: showPlot ? '400px' : 'auto', 
                display: showPlot ? 'flex' : 'none' 
              }}
            >
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-300">Plot</h2>
                </div>
                <button 
                  onClick={() => setShowPlot(false)} 
                  className="p-1 hover:bg-gray-700 rounded" 
                  title="Hide Plot"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 p-3 overflow-y-auto bg-gray-900 flex items-center justify-center" style={{ minHeight: '100px' }}>
                {plotSrc ? (
                  <img 
                    src={plotSrc} 
                    alt="Matplotlib plot" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'white' }} 
                  />
                ) : (
                  <div className="text-gray-500 italic text-xs">Plots will appear here...</div>
                )}
              </div>
            </div>
            
            {/* Chat box */}
            <div className="border-t border-gray-700 flex flex-col" style={{ height: showChat ? '400px' : 'auto', display: showChat ? 'flex' : 'none' }}>
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-300">Chat</h2>
                </div>
                <button 
                  onClick={() => { setShowChat(false); }} 
                  className="p-1 hover:bg-gray-700 rounded transition-colors duration-200" 
                  title="Hide Chat"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              {showChat && (
                <>
                  <div ref={chatRef} className="flex-1 p-3 overflow-y-auto bg-gray-900 text-sm space-y-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {chatMessages.length === 0 ? (
                      <div className="text-gray-500 italic text-xs">No messages yet.</div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col space-y-1">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-xs font-semibold truncate max-w-[120px]" style={{ color: msg.color }} title={msg.userEmail}>
                              {msg.isMe ? 'You' : msg.userEmail.split('@')[0]}
                            </span>
                            <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                          </div>
                          <div className="text-sm text-gray-200 break-words pl-2">{msg.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="border-t border-gray-700 bg-gray-800 p-3">
                    <div className="flex items-center space-x-2">
                      <input ref={chatInputRef} type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} placeholder="Type a message..." maxLength={1000} className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={sendChatMessage} disabled={!chatInput.trim()} className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors duration-200" title="Send Message">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}