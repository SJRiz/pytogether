import { useState, useEffect, useRef } from "react";
import { ArrowLeft, GripVertical, Terminal, X, MessageSquare, Eye, Wifi, WifiOff, Play, Download, Trash2 } from "lucide-react";

export default function CodeLayout({
  // UI Slots
  headerContent,
  editorContent,
  consoleContent,
  chatContent,
  chatInputContent,
  plotContent,
  inputContent,
  voiceControls,
  drawingControls,
  
  // Logic Props
  onBack,
  isConnected,
  connectionText = "Connected",
  isLoading,
  isRunning,
  onRun,
  onStop,
  onClearConsole,
  connectedUsers = [],
  chatMessageCount = 0,
  
  // Download/Menu
  onDownloadOption
}) {
  const [consoleWidth, setConsoleWidth] = useState(384);
  const [isDragging, setIsDragging] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPlot, setShowPlot] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const downloadMenuRef = useRef(null);
  const consoleScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const inputContainerRef = useRef(null);

  const prevMessageCount = useRef(chatMessageCount);

  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      .cm-error-line { background-color: rgba(255, 0, 0, 0.2); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (consoleScrollRef.current) {
        consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
    }
  }, [consoleContent]);

  useEffect(() => {
    if (showChat) {
        setHasUnread(false);
        setTimeout(() => {
            if (chatScrollRef.current) {
                chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
            }
        }, 0);
    }
  }, [chatContent, showChat]);

  useEffect(() => {
    if (chatMessageCount > prevMessageCount.current) {
        if (!showChat) {
            setHasUnread(true);
        }
    }
    // Update the ref to the current count for the next render
    prevMessageCount.current = chatMessageCount;
  }, [chatMessageCount, showChat]); 

  useEffect(() => {
    if (inputContent && inputContainerRef.current) {
        const inputElement = inputContainerRef.current.querySelector('input');
        if (inputElement) {
            setTimeout(() => inputElement.focus(), 50);
        }
    }
  }, [inputContent]);

  // Resize Logic
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
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Click outside download menu
  useEffect(() => {
    const handleClick = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="h-screen bg-slate-850 text-gray-100 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="border-b border-gray-700 bg-gray-850 flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          
          {/* LEFT */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button onClick={onBack} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
               <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-xl border border-gray-700/50">
                  <img src="/pytog.png" alt="Icon" className="h-8 w-8" />
               </div>
               <h1 className="text-2xl font-bold pl-2 bg-clip-text hidden md:block">PyTogether</h1>
            </div>
            <div className="flex items-center space-x-2 pl-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-400"><Wifi className="h-4 w-4" /><span className="text-xs hidden sm:inline">{connectionText}</span></div>
              ) : (
                <div className="flex items-center space-x-1 text-red-400"><WifiOff className="h-4 w-4" /><span className="text-xs hidden sm:inline">Disconnected</span></div>
              )}
            </div>
          </div>

          {/* CENTER */}
          <div className="flex-1 flex justify-center items-center gap-2 min-w-0 px-4">
            {headerContent}
            <div className="relative flex-shrink-0" ref={downloadMenuRef}>
              <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="p-1 text-gray-400 hover:text-gray-200">
                <Download className="h-4 w-4" />
              </button>
              {showDownloadMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50">
                  <ul className="py-1">
                    {['.py', '.txt', '.docx', '.pdf'].map(ext => (
                      <li key={ext} onClick={() => { onDownloadOption(ext); setShowDownloadMenu(false); }} 
                          className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer">
                        Download as {ext}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {drawingControls} 
            {voiceControls}
            
            {connectedUsers.length > 0 && (
              <div className="flex items-center gap-3 border-r border-gray-600 pr-4 mr-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {connectedUsers.map((u) => (
                    <div 
                      key={u.id} 
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-gray-800 text-xs font-bold text-gray-900" 
                      style={{backgroundColor: u.color || '#888'}} 
                      title={u.email}
                    >
                      {u.email ? u.email[0].toUpperCase() : '?'}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-400 hidden lg:block">{connectedUsers.length} online</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center space-x-2 text-yellow-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span className="text-sm hidden sm:inline">Loading...</span>
              </div>
            ) : isRunning ? (
               <button onClick={onStop} className="flex items-center space-x-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"><X className="h-4 w-4" /><span className="hidden sm:inline">Stop</span></button>
            ) : (
               <button onClick={onRun} className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"><Play className="h-4 w-4" /><span className="hidden sm:inline">Run</span></button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 min-h-0">
        
        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col border-r border-gray-700 min-w-0 relative">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between z-20 flex-shrink-0">
            <h2 className="text-sm font-medium text-gray-300">main.py</h2>
            <div className="flex items-center space-x-2">
               <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
               <span className="text-xs text-gray-500">{isConnected ? 'Synced' : 'Modified'}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar relative">
             {editorContent}
          </div>
        </div>

        {/* CONSOLE AREA */}
        <div className="flex flex-shrink-0">
          <div className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-ew-resize flex items-center justify-center group transition-colors duration-200 ${isDragging ? 'bg-blue-500' : ''}`} onMouseDown={handleMouseDown}>
            <GripVertical className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          <div className="flex flex-col bg-gray-850" style={{ width: `${consoleWidth}px` }}>
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                 <Terminal className="h-4 w-4 text-gray-400" />
                 <h2 className="text-sm font-medium text-gray-300">Console</h2>
                 {inputContent && <span className="text-xs text-blue-400 animate-pulse">Waiting for input...</span>}
              </div>
              <div className="flex items-center">
                <button onClick={() => { setShowChat(!showChat); if(!showChat) setShowPlot(false); }} className={`p-1 hover:bg-gray-700 rounded relative ${showChat ? 'text-blue-400' : 'text-gray-400'}`}>
                  <MessageSquare className="h-4 w-4" />
                  {hasUnread && !showChat && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-gray-800 transform translate-x-1/4 -translate-y-1/4"></span>
                  )}
                </button>
                <button onClick={() => { setShowPlot(!showPlot); if(!showPlot) setShowChat(false); }} className={`p-1 hover:bg-gray-700 rounded ${showPlot ? 'text-blue-400' : 'text-gray-400'}`}>
                   <Eye className="h-4 w-4" />
                </button>
                <button onClick={onClearConsole} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400" title="Clear Console">
                    <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={consoleScrollRef} className="flex-1 p-4 overflow-y-auto bg-gray-900 font-mono text-sm space-y-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
               {consoleContent}
            </div>

            <div className="flex-shrink-0" ref={inputContainerRef}>
                {inputContent}
            </div>

            {(showPlot || (!showChat && plotContent)) && (
              <div className="border-t border-gray-700 flex-col flex-shrink-0" style={{ height: '400px', display: 'flex' }}>
                 <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2"><Eye className="h-4 w-4 text-gray-400"/><h2 className="text-sm font-medium text-gray-300">Plot</h2></div>
                    <button onClick={() => setShowPlot(false)} className="p-1 hover:bg-gray-700 rounded"><X className="h-4 w-4 text-gray-400"/></button>
                 </div>
                 <div className="flex-1 p-3 overflow-y-auto bg-gray-900 flex items-center justify-center">
                    {plotContent || <div className="text-gray-500 italic text-xs">Plots will appear here...</div>}
                 </div>
              </div>
            )}

            {showChat && (
              <div className="border-t border-gray-700 flex flex-col flex-shrink-0" style={{ height: '400px', display: 'flex' }}>
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-2"><MessageSquare className="h-4 w-4 text-gray-400"/><h2 className="text-sm font-medium text-gray-300">Chat</h2></div>
                    <button onClick={() => setShowChat(false)} className="p-1 hover:bg-gray-700 rounded"><X className="h-4 w-4 text-gray-400"/></button>
                 </div>
                 <div ref={chatScrollRef} className="flex-1 p-3 overflow-y-auto bg-gray-900 text-sm space-y-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    {chatContent}
                 </div>
                 <div className="flex-shrink-0">
                    {chatInputContent}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}