import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Send, Check, X, Edit2, Pencil, Highlighter, Eraser, Eye, EyeOff, Trash2, Phone, PhoneOff, Mic, MicOff, Wifi, Share2, RotateCcw, RotateCw } from "lucide-react";
import Anser from "anser";

// CodeMirror
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

// Y.js
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { throttle } from "lodash";

// API
import api from "../../axiosConfig";

// Hooks & Components
import CodeLayout from "../components/CodeLayout";
import { ShareModal } from "../components/Modals/ShareModal";
import { usePyRunner } from "../hooks/usePyRunner";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { useSharedCanvas } from "../hooks/useSharedCanvas";

// ERROR LINE DECORATION SETUP
const errorLineDeco = Decoration.line({ class: "cm-error-line" });
const addErrorEffect = StateEffect.define();
const removeErrorEffect = StateEffect.define();
const errorLineField = StateField.define({
  create() { return Decoration.none; },
  update(value, tr) {
    value = value.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addErrorEffect)) value = Decoration.set([errorLineDeco.range(tr.state.doc.line(e.value).from)]);
      else if (e.is(removeErrorEffect)) value = Decoration.none;
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f)
});

export default function PyIDE({ groupId: propGroupId, projectId: propProjectId, projectName: propProjectName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { groupId: urlGroupId, projectId: urlProjectId } = useParams();

  // Params
  const groupId = urlGroupId || propGroupId || location.state?.groupId;
  const projectId = urlProjectId || propProjectId || location.state?.projectId;
  const [projectName, setProjectName] = useState(propProjectName || location.state?.projectName || "Loading...");

  // State
  const [code, setCode] = useState('# Loading code...\n# If this message stays for more than 10 seconds, please refresh the page.');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [latency, setLatency] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editorCrashed, setEditorCrashed] = useState(false);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Refs
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const awarenessRef = useRef(null);
  const codeUndoManagerRef = useRef(null);
  const wsRef = useRef(null);
  
  const editorViewRef = useRef(null);
  const lastPingRef = useRef(null);
  
  // User ID
  const token = sessionStorage.getItem("access_token");
  const myUserId = token ? jwtDecode(token).user_id : "anon";
  
  // Grab the query string from the URL
  const searchParams = new URLSearchParams(location.search);
  
  // Look for the token in the URL first. Fallback to state just in case.
  const shareToken = searchParams.get("shareToken") || location.state?.shareToken;

  // Save session for "Welcome back"
  useEffect(() => {
    if (groupId && projectId) {
      const projectData = {
        groupId,
        projectId,
        projectName,
        shareToken: shareToken || "" 
      };

      localStorage.setItem('previousProjectData', JSON.stringify(projectData));
    }
  }, [groupId, projectId, projectName, shareToken]);

  useEffect(() => {
    if (!location.state?.projectName && groupId && projectId) {
      api.get(`/groups/${groupId}/projects/${projectId}/`)
        .then(response => {
          // Update both the display name and the edit-input name
          setProjectName(response.data.project_name || "Untitled Project");
          setTempName(response.data.project_name || "Untitled Project");
        })
        .catch(err => {
          console.error("Failed to fetch project details", err);
          setProjectName("Unknown Project");
          setTempName("Unknown Project");
        });
    }
  }, [groupId, projectId, location.state]);

  // Update browser title to match project name
  useEffect(() => {
    document.title = `${projectName} - PyTogether`;
    return () => {
      document.title = "PyTogether"; 
    };
  }, [projectName]);

  // CUSTOM HOOKS
  const runner = usePyRunner();
  const voice = useVoiceChat(wsRef, myUserId);
  const canvas = useSharedCanvas(ydocRef, isConnected);

  // Global error boundary for CodeMirror crashes
  useEffect(() => {
    const handleError = (event) => {
      const errorMsg = event.error?.message || event.message || '';
      const errorStack = event.error?.stack || '';
      
      // Check if it's a CodeMirror/Y.js related crash
      if (errorMsg.includes('RangeError') || 
          errorMsg.includes('Invalid position') || 
          errorMsg.includes('yCollab') ||
          errorMsg.includes('awareness') ||
          errorStack.includes('y-codemirror') ||
          errorStack.includes('YRemoteSelectionsPluginValue') ||
          errorStack.includes('PluginInstance') ||
          errorMsg.toLowerCase().includes('codemirror')) {
        console.error("CodeMirror plugin crashed:", event.error || event.message);
        event.preventDefault();
        setEditorCrashed(true);
      }
    };

    const handleRejection = (event) => {
      handleError({ error: event.reason, message: event.reason?.message });
    };

    window.addEventListener('error', handleError, true); // Use capture phase
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Active monitoring - check if yCollab plugin is responding
  useEffect(() => {
    if (!isConnected || !editorViewRef.current || !ytextRef.current || !awarenessRef.current) return;

    let lastYtextLength = ytextRef.current.length;
    let lastCheckFailed = false;
    let emptyCheckCount = 0;

    const healthCheck = setInterval(() => {
      if (!editorViewRef.current || !ytextRef.current || editorCrashed) return;

      try {
        const currentLength = ytextRef.current.length;
        
        const editorText = editorViewRef.current.state.doc.toString();
        const ytextContent = ytextRef.current.toString();
        
        // If editor is stuck showing empty/loading message
        if (editorText.includes('# Loading code...') || editorText === '' || currentLength === 0) {
          emptyCheckCount++;
          if (emptyCheckCount > 5) {
            console.error("Editor stuck in loading state - likely crashed");
            setEditorCrashed(true);
          }
        } else {
          emptyCheckCount = 0; // Reset if we see real content
        }
        
        if (editorText !== ytextContent && currentLength === lastYtextLength && currentLength > 0) {
          if (lastCheckFailed) {
            console.error("CodeMirror yCollab plugin not syncing - detected silent failure");
            setEditorCrashed(true);
          } else {
            lastCheckFailed = true;
          }
        } else {
          lastCheckFailed = false;
        }
        
        lastYtextLength = currentLength;

        // Try a tiny dispatch to test if plugin is responsive
        editorViewRef.current.dispatch({ effects: [] });
      } catch (e) {
        console.error("Health check detected editor crash:", e);
        setEditorCrashed(true);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(healthCheck);
  }, [isConnected, editorCrashed]);

  // WEBSOCKET & YJS SETUP
  useEffect(() => {
    if (!groupId || !projectId) {
      console.error('Missing groupId or projectId');
      alert("Could not connect to the project. Redirecting back to groups.");
      navigate("/home");
      return;
    }

    // Initialize Y.js entities freshly
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codetext');
    
    const codeUndoManager = new Y.UndoManager(ytext, {
      trackedOrigins: new Set([null]), // y-codemirror transactions often have null origin locally
      captureTimeout: 150
    });

    const awareness = new Awareness(ydoc);

    // Assign to refs for other components/hooks
    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    codeUndoManagerRef.current = codeUndoManager;
    awarenessRef.current = awareness;

    const isDev = import.meta.env.DEV;

    const wsProtocol = isDev ? 'ws:' : (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
    const wsHost = isDev ? 'localhost:8000' : window.location.host;
    
    let tokenParam = token ? `?token=${token}` : "?";
    if (shareToken) {
        tokenParam += `&share_token=${shareToken}`;
    }

    const wsUrl = `${wsProtocol}//${wsHost}/ws/groups/${groupId}/projects/${projectId}/code/${tokenParam}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    console.log("ydoc initialized:", ytext.toString());

    // WebSocket Handlers
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      //ws.send(JSON.stringify({ type: 'request_sync' }));
    };

    let isDocInitialized = false;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'update':
            if (!isDocInitialized) break;
            try {
              const update = Uint8Array.from(atob(data.update_b64), c => c.charCodeAt(0));
              Y.applyUpdate(ydoc, update, 'server');
              
              // After each update, verify editor is still synced
              setTimeout(() => {
                if (editorViewRef.current && ytextRef.current) {
                  const ytextContent = ytextRef.current.toString();
                  const editorContent = editorViewRef.current.state.doc.toString();
                  
                  if (ytextContent.length > 0 && editorContent === '') {
                    console.error("Editor crashed: Y.js updated but editor is empty");
                    setEditorCrashed(true);
                  } else if (ytextContent.length > editorContent.length + 50) {
                    console.error("Editor crashed: Y.js has significantly more content");
                    setEditorCrashed(true);
                  }
                }
              }, 1000);
            } catch(e) { console.error("Failed to apply Yjs update", e); }
            break;

          case 'sync':
            const stateBytes = Uint8Array.from(atob(data.ydoc_b64), c => c.charCodeAt(0));
            Y.applyUpdate(ydoc, stateBytes, 'server');
            isDocInitialized = true;
            setIsSynced(true);
            break;
            
          case 'awareness':
            setTimeout(() => {
            if (!isDocInitialized || !ytext.toString()) return;
            try {
              if (ytextRef.current.length > 10) {
                const awarenessUpdate = Uint8Array.from(atob(data.update_b64), c => c.charCodeAt(0));
                applyAwarenessUpdate(awarenessRef.current, awarenessUpdate);
              } else {
                console.warn("Skipping awareness update: document empty");
              }
            } catch (e) {
              console.error("Failed to apply awareness update", e);
            }}, 400);
            break;
          
          case 'remove_awareness':
            const uid = data.user_id;
            const clientsToRemove = [];
            awareness.getStates().forEach((state, clientID) => {
                if (state.user && state.user.id === uid) clientsToRemove.push(clientID);
            });
            if (clientsToRemove.length > 0) {
                awareness.states = new Map([...awareness.getStates()].filter(([id]) => !clientsToRemove.includes(id)));
                awareness.emit('change', [{ added: [], updated: [], removed: clientsToRemove }, 'remote']);
            }
            break;
            
          case 'connection':
            if (data.users) {
                const me = data.users.find(u => u.id === myUserId);
                if(me) awareness.setLocalStateField("user", { 
                    id: me.id, 
                    name: me.email ? me.email.split('@')[0] : 'Guest', 
                    color: me.color, 
                    colorLight: me.colorLight 
                });
                setConnectedUsers(data.users);
            }
            break;
            
          case 'chat_message':
            // Convert to string to ensure safe comparison between ints and strings
            const isMe = String(data.user_id) === String(myUserId);
            setChatMessages(p => [...p, { ...data, timestamp: new Date(data.timestamp * 1000), isMe }]);
            break;
            
          case 'voice_room_update':
            voice.setParticipants(data.participants || []);
            break;
            
          case 'voice_signal':
            voice.handleVoiceSignal(data.from_user, data.signal_data);
            break;
            
          case 'pong':
             if (lastPingRef.current && data.timestamp === lastPingRef.current) {
                const newLatency = Date.now() - lastPingRef.current;
                setLatency(newLatency);
                console.log(`Network latency: ${newLatency}ms`);
             }
             break;
        }
      } catch (e) { console.error("WS Error", e); }
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
            alert("You have been disconnected due to a server update. All your work has been saved. Please check back in 5 minutes.");
        }
        if (!isConnected) navigate("/home");
        setIsConnected(false); 
        voice.leaveCall(); 
    };

    // Outgoing Updates (Client -> Server)
    const updateHandler = (update, origin) => {
      // Don't send updates that came from the server
      if (origin !== 'server' && ws.readyState === WebSocket.OPEN) {
         if (origin !== 'remote') runner.errorLine && runner.setErrorLine(null); // Clear error on typing
         const updateB64 = btoa(String.fromCharCode.apply(null, update));
         ws.send(JSON.stringify({ type: 'update', update_b64: updateB64 }));
      }
    };
    ydoc.on('update', updateHandler);

    // Outgoing Awareness
    const awarenessHandler = ({ added, updated, removed }) => {
      const clients = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(awareness, clients);
      const updateB64 = btoa(String.fromCharCode.apply(null, update));
      if (ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({ type: 'awareness', update_b64: updateB64 }));
      }
    };
    const throttledAwarenessHandler = throttle(awarenessHandler, 100, { leading: true, trailing: true });
    awareness.on('update', throttledAwarenessHandler);

    // Ping
    const pinger = setInterval(() => {
        if(ws.readyState === WebSocket.OPEN) {
            lastPingRef.current = Date.now();
            ws.send(JSON.stringify({type: 'ping', timestamp: lastPingRef.current}));
        }
    }, 5000);

    // Cleanup
    return () => {
      ydoc.off('update', updateHandler);
      awareness.off('update', throttledAwarenessHandler);
      throttledAwarenessHandler.cancel();
      ydoc.destroy();
      ws.close();
      clearInterval(pinger);
      codeUndoManager.destroy();
      awareness.destroy();
    };
  }, [groupId, projectId]);


  // ACTIONS
  // Undo/Redo (Global)
  useEffect(() => {
    const handleKey = (e) => {
        const isCtrlZ = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z';
        const isCtrlY = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y';
        
        if (isCtrlZ || isCtrlY) {
            const isRedo = e.shiftKey || isCtrlY;
            
            // Check drawing mode first
            if (canvas.drawingMode !== 'none') {
                e.preventDefault();
                e.stopPropagation();
                if (isRedo) {
                    canvas.redo();
                } else {
                    canvas.undo();
                }
            } 
            // Else Code Mirror Undo
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
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [canvas.drawingMode]);

  // Error Line Decoration
  useEffect(() => {
    if (runner.errorLine) editorViewRef.current?.dispatch({ effects: addErrorEffect.of(runner.errorLine) });
    else editorViewRef.current?.dispatch({ effects: removeErrorEffect.of() });
  }, [runner.errorLine]);

  const sendChat = () => {
    if (!chatInput.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'chat_message', message: chatInput.trim() }));
    setChatInput("");
  };

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== projectName) {
        try {
            await api.put(`/groups/${groupId}/projects/${projectId}/edit/`, { project_name: tempName });
            setProjectName(tempName);
        } catch(e) { console.error(e); }
    }
    setIsEditingName(false);
  };

  const handleDownload = (ext) => {
     if (!ytextRef.current) return;
     const content = ytextRef.current.toString();
     const filename = (projectName || 'main').replace(/[^a-z0-9]/gi, '_').toLowerCase() + ext;
     
     if (ext === '.py') saveAs(new Blob([content], {type: 'text/python'}), filename);
     else if (ext === '.txt') saveAs(new Blob([content], {type: 'text/plain'}), filename);
     else if (ext === '.pdf') {
         const doc = new jsPDF();
         doc.setFontSize(10);
         doc.text(doc.splitTextToSize(content, 180), 10, 10);
         doc.save(filename);
     } else if (ext === '.docx') {
         const doc = new Document({ sections: [{ children: content.split('\n').map(l => new Paragraph({ children: [new TextRun({ text: l, font: "Courier New" })] })) }] });
         Packer.toBlob(doc).then(b => saveAs(b, filename));
     }
  };

  // large code size warning
  useEffect(() => {
    if (!ytextRef.current) return;
    
    const checkCodeSize = () => {
      const content = ytextRef.current.toString();
      const sizeInBytes = new Blob([content]).size;
      const sizeInKB = sizeInBytes / 1024;

      
      if (sizeInKB >= 190) {
        setShowSizeWarning(true);
      } else {
        setShowSizeWarning(false);
      }
      
    };
    
    // Check size whenever code changes
    const observer = () => checkCodeSize();
    ytextRef.current.observe(observer);
    
    // Initial check
    checkCodeSize();
    
    return () => {
      if (ytextRef.current) {
        ytextRef.current.unobserve(observer);
      }
    };
  }, [isConnected]);

  // RENDER CONTENT SLOTS
  const headerSlot = isEditingName ? (
    <>
        <input value={tempName} onChange={e => setTempName(e.target.value)} className="bg-gray-700 text-white px-2 py-1 rounded text-center w-full" />
        <button onClick={handleSaveName} className="p-1 text-green-400"><Check className="h-4 w-4"/></button>
        <button onClick={() => setIsEditingName(false)} className="p-1 text-red-400"><X className="h-4 w-4"/></button>
    </>
  ) : (
    <>
        <h2 className="text-lg font-medium text-white truncate">{projectName}</h2>
        <button onClick={() => { setTempName(projectName); setIsEditingName(true); }} className="p-1 text-gray-400 hover:text-gray-200"><Edit2 className="h-4 w-4"/></button>
        <button 
            onClick={() => setShowShareModal(true)} 
            className="p-1.5 ml-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-md transition-colors flex items-center gap-1.5"
            title="Share Project"
        >
            <Share2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium hidden sm:inline">Share</span>
        </button>
    </>
  );

  const editorSlot = (
    <div ref={canvas.containerRef} className="h-full relative">
      {editorCrashed ? (
        <div className="flex-1 flex items-center justify-center bg-gray-900 h-full">
          <div className="flex flex-col items-center space-y-4 p-8 bg-gray-800 rounded-lg max-w-md">
            <div className="text-red-500 text-6xl">⚠️</div>
            <div className="text-center">
              <p className="text-red-400 font-bold text-xl mb-2">Editor Crashed</p>
              <p className="text-gray-300 mb-4">
                The code editor encountered a sync error. Please refresh and connect again.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      ) : isConnected && isSynced && ytextRef.current && awarenessRef.current ? (
        <>
          <CodeMirror
            height="100%"
            className="h-full text-sm"
            value={ytextRef.current.toString()}
            theme={oneDark}
            extensions={[
              python(),
              yCollab(ytextRef.current, awarenessRef.current, { undoManager: codeUndoManagerRef.current }),
              errorLineField
            ]}
            onChange={(value) => {
              if (!ytextRef.current && !isConnected) setCode(value);
            }}
            onCreateEditor={(view) => {
              editorViewRef.current = view;
            }}
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
          <canvas 
            ref={canvas.canvasRef}
            className="absolute top-0 left-0 z-10"
            style={{ 
              pointerEvents: canvas.drawingMode !== 'none' ? 'auto' : 'none',
              cursor: canvas.drawingMode !== 'none' ? 'crosshair' : 'default' 
            }}
            onMouseDown={canvas.handlers.onMouseDown}
            onMouseMove={canvas.handlers.onMouseMove}
            onMouseUp={canvas.handlers.onMouseUp}
            onMouseLeave={canvas.handlers.onMouseLeave}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-900 h-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center"><Wifi className="h-6 w-6 text-blue-500 animate-pulse" /></div>
            </div>
            <div className="text-center">
              <p className="text-gray-300 font-medium">Connecting to '{projectName}'...</p>
              <p className="text-gray-500 text-sm mt-1">Establishing secure connection</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const consoleSlot = runner.consoleOutput.length === 0 ? (
      <div className="text-gray-500 italic">Console output will appear here...</div>
  ) : (
      runner.consoleOutput.map(e => (
        <div key={e.id} className="flex items-start space-x-2 py-1">
            <span className="text-gray-500 text-xs mt-0.5 min-w-[60px]">
                {e.timestamp.toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}
            </span>
            <span className="text-xs mt-0.5">
                {e.type==='error'?'❌':e.type==='input'?'▶️':e.type==='system'?'⚙️':''}
            </span>
            
            <div className={`flex-1 whitespace-pre-wrap break-words font-mono text-sm 
                ${e.type === 'error' ? 'text-red-400' :
                  e.type === 'input' ? 'text-blue-400' : 
                  e.type === 'system' ? 'text-yellow-400' : 
                  'text-gray-100'}`}
                 
              dangerouslySetInnerHTML={{
                  __html: Anser.ansiToHtml(e.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")) 
              }}
            />
        </div>
      ))
  );

  const inputSlot = runner.waitingForInput && (
      <div className="border-t border-gray-700 bg-gray-800 p-3">
          <div className="flex items-center space-x-2">
            <input 
              ref={runner.inputRef} 
              onKeyDown={e => e.key === 'Enter' && (runner.submitInput(e.target.value), e.target.value='')} 
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Enter input..." 
            />
            <button onClick={() => { if(runner.inputRef.current) runner.submitInput(runner.inputRef.current.value); }} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"><Send className="h-4 w-4"/></button>
          </div>
          <div className="text-xs text-gray-400 mt-1">Press Enter to send input</div>
      </div>
  );

  const chatSlot = (
      <>
        {chatMessages.length === 0 ? (
            <div className="text-gray-500 italic text-xs">No messages yet.</div>
        ) : (
            chatMessages.map(msg => {
                let displayEmail = msg.user_email || msg.userEmail || msg.email;
                
                if (!displayEmail && connectedUsers.length > 0) {
                    const uid = msg.user_id || msg.userId;
                    const foundUser = connectedUsers.find(u => u.id == uid);
                    if (foundUser) displayEmail = foundUser.email;
                }

                const displayName = msg.isMe ? 'You' : (displayEmail ? displayEmail.split('@')[0] : 'Anon');

                return (
                <div key={`${msg.timestamp.getTime()}-${msg.user_id || msg.userId}`} className="flex flex-col space-y-1">
                    <div className="flex items-baseline space-x-2">
                        <span className="text-xs font-semibold truncate max-w-[120px]" style={{color: msg.color}} title={displayEmail}>
                            {displayName}
                        </span>
                        <span className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-sm text-gray-200 break-words pl-2">{msg.message}</div>
                </div>
            )})
        )}
      </>
  );

  const chatInputSlot = (
        <div className="border-t border-gray-700 bg-gray-800 p-3 mt-auto">
            <div className="flex items-center space-x-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type a message..." maxLength={1000} />
                <button onClick={sendChat} disabled={!chatInput.trim()} className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors duration-200"><Send className="h-4 w-4"/></button>
            </div>
        </div>
  );

  const voiceSlot = (
      <div className="flex items-center space-x-2">
          {!voice.inVoiceCall ? (
              <button onClick={voice.joinCall} className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200">
                <Phone className="h-4 w-4 text-white"/> <span className="text-sm text-white">Voice Chat</span>
              </button>
          ) : (
              <div className="flex items-center space-x-2">
                <button onClick={voice.toggleMute} className={`p-2 rounded-lg transition-colors duration-200 ${voice.isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {voice.isMuted ? <MicOff className="h-4 w-4 text-white"/> : <Mic className="h-4 w-4 text-white"/>}
                </button>
                <button onClick={voice.leaveCall} className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200">
                    <PhoneOff className="h-4 w-4 text-white"/> <span className="text-sm text-white">Leave</span>
                </button>
                {voice.participants.length > 0 && (
                    <div className="flex items-center space-x-1 text-gray-400"><Phone className="h-3 w-3"/><span className="text-xs">{voice.participants.length}</span></div>
                )}
              </div>
          )}
      </div>
  );

  const drawingSlot = (
      <div className="flex items-center space-x-1 p-1 bg-gray-700 rounded-lg">
          <input type="color" value={canvas.drawColor} onChange={e => canvas.setDrawColor(e.target.value)} className="w-9 h-9 p-1 bg-transparent border-none cursor-pointer hover:bg-gray-600 rounded transition-colors" />
          <button onClick={() => canvas.setDrawingMode(m => m === 'draw' ? 'none' : 'draw')} className={`p-2 rounded ${canvas.drawingMode === 'draw' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}><Pencil className="h-4 w-4"/></button>
          <button onClick={() => canvas.setDrawingMode(m => m === 'highlight' ? 'none' : 'highlight')} className={`p-2 rounded ${canvas.drawingMode === 'highlight' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}><Highlighter className="h-4 w-4"/></button>
          <button onClick={() => canvas.setDrawingMode(m => m === 'erase' ? 'none' : 'erase')} className={`p-2 rounded ${canvas.drawingMode === 'erase' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}><Eraser className="h-4 w-4"/></button>
          <button onClick={() => canvas.setShowDrawings(!canvas.showDrawings)} className="p-2 hover:bg-gray-600 rounded">{canvas.showDrawings ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>
          <button onClick={() => window.confirm('Clear all drawings for everyone?') && canvas.clearDrawings()} className="p-2 hover:bg-red-500/50 rounded text-red-400"><Trash2 className="h-4 w-4"/></button>
      </div>
  );

const sizeWarningToast = showSizeWarning && (
  <div className="fixed bottom-20 right-6 z-50 bg-yellow-900/95 border-2 border-yellow-500 rounded-lg px-4 py-3 shadow-2xl max-w-md animate-slide-in">
    <div className="flex items-start space-x-3">
      <svg className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <p className="text-sm text-yellow-200 font-semibold mb-1">Code Size Warning</p>
        <p className="text-xs text-yellow-100">
          Your code is approaching the 500 KB limit. Changes beyond this point may not be saved properly.
        </p>
      </div>
      <button
        onClick={() => setShowSizeWarning(false)}
        className="flex-shrink-0 text-yellow-400 hover:text-yellow-300 transition-colors"
        title="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>
);

  return (
    <>
        {sizeWarningToast}
        <CodeLayout 
            headerContent={headerSlot}
            editorContent={editorSlot}
            consoleContent={consoleSlot}
            onClearConsole={runner.clearConsole}
            chatContent={chatSlot}
            chatMessageCount={chatMessages.length}
            chatInputContent={chatInputSlot}
            plotContent={runner.plotSrc ? <img src={runner.plotSrc} alt="Plot" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'white' }} /> : null}
            inputContent={inputSlot}
            voiceControls={voiceSlot}
            drawingControls={drawingSlot}
            
            onBack={() => {
                if (runner.isRunning) { runner.stopCode(); }
                if (wsRef.current) wsRef.current.close();
                navigate('/home');
            }}
            isConnected={isConnected}
            connectedUsers={connectedUsers}
            
            isLoading={runner.isLoading}
            isRunning={runner.isRunning}
            onRun={() => runner.runCode(ytextRef.current ? ytextRef.current.toString() : code)}
            onStop={runner.stopCode}
            onDownloadOption={handleDownload}
        />

        <ShareModal 
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            project={{ id: projectId }} 
            group={{ id: groupId }} 
        />
    </>
  );
}