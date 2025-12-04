import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Send, Edit2, Check, X, Pencil, Eraser, Highlighter, RotateCcw, RotateCw, Trash2, Eye, EyeOff } from "lucide-react";

// CodeMirror
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

// Components & Hooks
import CodeLayout from "../components/CodeLayout";
import { usePyRunner } from "../hooks/usePyRunner";
import { useLocalCanvas } from "../hooks/useLocalCanvas";

// Error line decoration
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

export default function OfflinePlayground() {
  const navigate = useNavigate();
  
  // State
  const [code, setCode] = useState(`# Welcome to the Offline Playground!
# You can write and run Python code right here in your browser.
# You may use the drawing tools on the top-right to annotate your code as needed.

# NOTE: Your work does not save here, and you cannot collaborate.

name = input("Whats your name? ")
print(f"Hello, {name}!")`);
  const [projectName, setProjectName] = useState("Offline Project");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  
  // Refs
  const editorViewRef = useRef(null);
  
  // Hooks
  const runner = usePyRunner();
  const canvas = useLocalCanvas();

  useEffect(() => {
    const handleKeyDown = (e) => {
        const isCtrl = e.ctrlKey || e.metaKey;
        
        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
            if (canvas.drawingMode !== 'none') {
                e.preventDefault();
                e.stopPropagation();
                canvas.undo();
            }
        }

        const isCtrlY = isCtrl && e.key.toLowerCase() === 'y';
        const isCtrlShiftZ = isCtrl && e.shiftKey && e.key.toLowerCase() === 'z';

        if (isCtrlY || isCtrlShiftZ) {
            if (canvas.drawingMode !== 'none') {
                e.preventDefault();
                e.stopPropagation();
                canvas.redo();
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [canvas.drawingMode, canvas.undo, canvas.redo]);

  // Error line decoration
  useEffect(() => {
    if (runner.errorLine) {
      editorViewRef.current?.dispatch({ effects: addErrorEffect.of(runner.errorLine) });
    } else {
      editorViewRef.current?.dispatch({ effects: removeErrorEffect.of() });
    }
  }, [runner.errorLine]);

  // Download handler
  const handleDownload = (ext) => {
    const content = code;
    const filename = (projectName || 'offline').replace(/[^a-z0-9]/gi, '_').toLowerCase() + ext;
    
    if (ext === '.py') {
      saveAs(new Blob([content], {type: 'text/python'}), filename);
    } else if (ext === '.txt') {
      saveAs(new Blob([content], {type: 'text/plain'}), filename);
    } else if (ext === '.pdf') {
      const doc = new jsPDF();
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(content, 180), 10, 10);
      doc.save(filename);
    } else if (ext === '.docx') {
      const doc = new Document({ 
        sections: [{ 
          children: content.split('\n').map(l => 
            new Paragraph({ 
              children: [new TextRun({ text: l, font: "Courier New" })] 
            })
          ) 
        }] 
      });
      Packer.toBlob(doc).then(b => saveAs(b, filename));
    }
  };

  const handleSaveName = () => {
    if (tempName.trim() && tempName !== projectName) {
      setProjectName(tempName);
    }
    setIsEditingName(false);
  };

  // RENDER SLOTS
  const headerSlot = isEditingName ? (
    <>
      <input 
        value={tempName} 
        onChange={e => setTempName(e.target.value)} 
        className="bg-gray-700 text-white px-2 py-1 rounded text-center w-full" 
      />
      <button onClick={handleSaveName} className="p-1 text-green-400"><Check className="h-4 w-4"/></button>
      <button onClick={() => setIsEditingName(false)} className="p-1 text-red-400"><X className="h-4 w-4"/></button>
    </>
  ) : (
    <>
      <h2 className="text-lg font-medium text-white truncate">{projectName}</h2>
      <button onClick={() => { setTempName(projectName); setIsEditingName(true); }} className="p-1 text-gray-400 hover:text-gray-200"><Edit2 className="h-4 w-4"/></button>
    </>
  );

  const drawingSlot = (
      <div className="flex items-center space-x-1 p-1 bg-gray-700 rounded-lg">
          <input 
            type="color" 
            value={canvas.drawColor} 
            onChange={e => canvas.setDrawColor(e.target.value)} 
            className="w-9 h-9 p-1 bg-transparent border-none cursor-pointer hover:bg-gray-600 rounded transition-colors" 
          />
          
          <button 
            onClick={() => canvas.setDrawingMode(canvas.drawingMode === 'pen' ? 'none' : 'pen')} 
            className={`p-2 rounded ${canvas.drawingMode === 'pen' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}
          >
            <Pencil className="h-4 w-4"/>
          </button>
          
          <button 
            onClick={() => canvas.setDrawingMode(canvas.drawingMode === 'highlight' ? 'none' : 'highlight')} 
            className={`p-2 rounded ${canvas.drawingMode === 'highlight' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}
          >
            <Highlighter className="h-4 w-4"/>
          </button>
          
          <button 
            onClick={() => canvas.setDrawingMode(canvas.drawingMode === 'erase' ? 'none' : 'erase')} 
            className={`p-2 rounded ${canvas.drawingMode === 'erase' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600'}`}
          >
            <Eraser className="h-4 w-4"/>
          </button>

          <div className="w-px h-4 bg-gray-600 mx-1"></div>

          <button onClick={canvas.undo} disabled={!canvas.canUndo} className="p-2 hover:bg-gray-600 rounded disabled:opacity-30 text-gray-300">
             <RotateCcw className="h-4 w-4"/>
          </button>
          <button onClick={canvas.redo} disabled={!canvas.canRedo} className="p-2 hover:bg-gray-600 rounded disabled:opacity-30 text-gray-300">
             <RotateCw className="h-4 w-4"/>
          </button>

          <div className="w-px h-4 bg-gray-600 mx-1"></div>

          <button onClick={() => canvas.setShowDrawings(!canvas.showDrawings)} className="p-2 hover:bg-gray-600 rounded text-gray-300">
            {canvas.showDrawings ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
          
          <button onClick={canvas.clearDrawings} className="p-2 hover:bg-red-500/50 rounded text-red-400">
            <Trash2 className="h-4 w-4"/>
          </button>
      </div>
  );

  const editorSlot = (
    <div className="h-full relative flex flex-col" ref={canvas.containerRef}>
      
      {/* CANVAS OVERLAY */}
      <canvas
        ref={canvas.canvasRef}
        {...canvas.handlers}
        className="absolute inset-0 z-10 w-full h-full"
        style={{ 
            pointerEvents: canvas.drawingMode === 'none' ? 'none' : 'auto',
            cursor: canvas.drawingMode === 'none' ? 'default' : 'crosshair'
        }}
      />

      <CodeMirror
        value={code}
        height="100%"
        className="h-full text-sm"
        theme={oneDark}
        extensions={[
          python(),
          errorLineField
        ]}
        onChange={(value) => {
          setCode(value);
          if (runner.errorLine) runner.setErrorLine(null);
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
        <pre className={`flex-1 whitespace-pre-wrap break-words ${
          e.type === 'error' ? 'text-red-400' : 
          e.type === 'input' ? 'text-blue-400' : 
          e.type === 'system' ? 'text-yellow-400' : 
          'text-white'
        }`}>
          {e.content}
        </pre>
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
        <button 
          onClick={() => { 
            if(runner.inputRef.current) runner.submitInput(runner.inputRef.current.value); 
          }} 
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          <Send className="h-4 w-4"/>
        </button>
      </div>
      <div className="text-xs text-gray-400 mt-1">Press Enter to send input</div>
    </div>
  );

  return (
    <CodeLayout 
      // Mode
      isOfflineMode={true}
      
      // Header
      headerContent={headerSlot}
      onBack={() => navigate(-1)}
      isConnected={true}
      connectionText="Local Mode"
      
      // Editor
      editorContent={editorSlot}
      
      // Drawing Controls
      drawingControls={drawingSlot}
      
      // Console
      consoleContent={consoleSlot}
      onClearConsole={runner.clearConsole}
      inputContent={inputSlot}
      
      // Plot
      plotContent={runner.plotSrc ? (
        <img 
          src={runner.plotSrc} 
          alt="Plot" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain', 
            background: 'white' 
          }} 
        />
      ) : null}
      
      // No chat/voice in offline mode
      chatContent={null}
      chatInputContent={null}
      voiceControls={null}
      connectedUsers={[]}
    
      // Execution
      isLoading={runner.isLoading}
      isRunning={runner.isRunning}
      onRun={() => runner.runCode(code)}
      onStop={runner.stopCode}
      onDownloadOption={handleDownload}
    />
  );
}