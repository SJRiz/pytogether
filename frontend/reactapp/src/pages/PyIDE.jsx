// this code is a huge big mess i will refactor this later when i have time
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { throttle } from "lodash";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, Play, Terminal, X, GripVertical, Users, Wifi, WifiOff, Edit2, Check, X as XIcon, Send, MessageSquare, Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import api from "../../axiosConfig";

// Y.js imports
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';

export default function PyIDE({ groupId: propGroupId, projectId: propProjectId, projectName: propProjectName }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // hide scrollbars
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `.scrollbar-hide::-webkit-scrollbar { display: none; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
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

  // VC and chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [peers, setPeers] = useState({});
  
  // Y.js and WebSocket refs
  const ydocRef = useRef(null);
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
  const [latency, setLatency] = useState(null);
  const lastPingTimeRef = useRef(null);
  const simplePeerLoadedRef = useRef(false);

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

  // Initialize Y.js document and WebSocket connection
  useEffect(() => {
    if (!groupId || !projectId) {
      console.error('Missing groupId or projectId');
      alert("Could not connect to the project. Redirecting back to groups.");
      navigate("/home");
      return;
    }

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codetext');
    ydocRef.current = ydoc;
    ytextRef.current = ytext;


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
          Y.applyUpdate(ydoc, update);

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
          Y.applyUpdate(ydoc, stateBytes);

        } else if (data.type === 'initial') {
          // Initial content from db
          ytext.delete(0, ytext.length);
          ytext.insert(0, data.content || '');

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

  // Console entry types
  const addConsoleEntry = (content, type = 'output', timestamp = new Date()) => {
    setConsoleOutput(prev => [...prev, { id: Date.now() + Math.random(), content, type, timestamp }]);
  };

  // Load Skulpt
  useEffect(() => {
    const loadSkulpt = async () => {
      try {
        addConsoleEntry("Loading Python interpreter...", "system");
        if (!window.Sk) {
          const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
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

  // Handle input submission
  const submitInput = () => {
    if (!waitingForInput || !inputResolve) return;
    addConsoleEntry(currentInput, "input");
    inputResolve(currentInput);
    setCurrentInput("");
    setWaitingForInput(false);
    setInputResolve(null);
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

  const runCode = async () => {
    if (!window.Sk || isRunning) return;
    setIsRunning(true);
    addConsoleEntry(`>>> Running code...`, "input");
    const currentCode = ytextRef.current ? ytextRef.current.toString() : code;

     // Skulpt output callback
    const outf = (text) => addConsoleEntry(text, "output");

    // Skulpt input callback
    const inputfun = (promptText) => new Promise((resolve) => {
      if (promptText) addConsoleEntry(promptText, "system");
      setWaitingForInput(true);
      setInputResolve(() => (input) => {
        setWaitingForInput(false);
        resolve(input);
      });
    });

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
        yieldLimit: 100,
        __future__: Sk.python3
      });
      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, currentCode, true));
      if (!waitingForInput) addConsoleEntry(">>> Code execution completed", "system");
    } catch (err) {
      setWaitingForInput(false);
      setInputResolve(null);
      addConsoleEntry(err.toString(), "error");
      addConsoleEntry(">>> Code execution failed", "system");
    } finally {
      if (!waitingForInput) setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setConsoleOutput([]);
    setWaitingForInput(false);
    setInputResolve(null);
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
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-x-hidden custom-scrollbar">
      
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <button onClick={() => navigate('/home')} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors duration-200" title="Go Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src="/pytog.png" alt="Code Icon" className="h-10 w-11" />
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
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Voice Chat */}
            <div className="flex items-center space-x-2">
              {!inVoiceCall ? (
                <button onClick={joinVoiceCall} className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200" title="Join Voice Call">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Voice Chat</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className={`p-2 rounded-lg transition-colors duration-200 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button onClick={leaveVoiceCall} className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200" title="Leave Call">
                    <PhoneOff className="h-4 w-4" />
                    <span className="text-sm">Leave</span>
                  </button>
                </div>
              )}
              {voiceParticipants.length > 0 && (
                <div className="flex items-center space-x-1 text-purple-400">
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
            <button onClick={runCode} disabled={isRunning || isLoading} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors duration-200">
              <Play className="h-4 w-4" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">

        {/* Code Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-700 min-w-0">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">main.py</h2>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
              <span className="text-xs text-gray-500">{isConnected ? 'Synced' : 'Modified'}</span>
            </div>
          </div>
          {ytextRef.current ? (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <CodeMirror
                value={code}
                height="100%"
                theme={oneDark}
                extensions={[python(), yCollab(ytextRef.current, awarenessRef.current)]}
                onChange={(value) => {
                  if (!ytextRef.current && !isConnected) setCode(value);
                }}
                onCreateEditor={(view) => { editorViewRef.current = view; }}
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
          ) : (
            <div>Loading editor...</div>
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
              <button onClick={clearConsole} className="p-1 hover:bg-gray-700 rounded transition-colors duration-200" title="Clear Console">
                <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
              </button>
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
            
            {/* Chat box */}
            <div className="border-t border-gray-700 flex flex-col" style={{ height: showChat ? '400px' : 'auto' }}>
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-300">Chat</h2>
                </div>
                <button onClick={() => setShowChat(!showChat)} className="p-1 hover:bg-gray-700 rounded transition-colors duration-200" title={showChat ? "Hide Chat" : "Show Chat"}>
                  {showChat ? <X className="h-4 w-4 text-gray-400" /> : <MessageSquare className="h-4 w-4 text-gray-400" />}
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