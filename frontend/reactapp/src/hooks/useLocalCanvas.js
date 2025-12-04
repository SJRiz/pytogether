import { useState, useRef, useEffect, useCallback } from "react";

export function useLocalCanvas() {
  const [drawingMode, setDrawingMode] = useState('none'); // 'none', 'pen', 'erase', 'highlight'
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [showDrawings, setShowDrawings] = useState(true);
  
  const [drawings, setDrawings] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const ctxRef = useRef(null);
  const scrollerRef = useRef(null);
  
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const lastDrawPointRef = useRef(null);

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const scroller = scrollerRef.current;
    const scrollTop = scroller ? scroller.scrollTop : 0;
    const scrollLeft = scroller ? scroller.scrollLeft : 0;

    // Clear the entire canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (!showDrawings) return;

    drawings.forEach(path => {
      if (path.points.length < 2) return;
      
      ctx.beginPath();
      
      const first = path.points[0];
      ctx.moveTo(first.x - scrollLeft, first.y - scrollTop);

      for (let i = 1; i < path.points.length; i++) {
        const p = path.points[i];
        ctx.lineTo(p.x - scrollLeft, p.y - scrollTop);
      }
      
      ctx.strokeStyle = path.type === 'erase' ? '#000000' : path.color;
      ctx.lineWidth = path.width;
      ctx.globalCompositeOperation = path.type === 'erase' ? 'destination-out' : 'source-over';
      ctx.stroke();
      ctx.closePath();
    });
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [drawings, showDrawings]);

  // Attach Resize & Scroll Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    ctxRef.current = canvas.getContext('2d');
    ctxRef.current.lineCap = 'round';
    ctxRef.current.lineJoin = 'round';

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      canvas.width = width;
      canvas.height = height;
      redrawAll();
    });
    
    resizeObserver.observe(container);
    
    // Polling for CodeMirror scroller
    const findScroller = setInterval(() => {
        const scroller = container.querySelector('.cm-scroller');
        if (scroller) {
            scrollerRef.current = scroller;
            scroller.addEventListener('scroll', redrawAll);
            redrawAll(); 
            clearInterval(findScroller);
        }
    }, 100);

    redrawAll();

    return () => {
      resizeObserver.disconnect();
      scrollerRef.current?.removeEventListener('scroll', redrawAll);
      clearInterval(findScroller);
    };
  }, [redrawAll]);

  // Redraw on state change
  useEffect(() => { 
      redrawAll(); 
  }, [drawings, showDrawings, redrawAll]);

  // Helper: Get coordinates
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scroller = scrollerRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { 
        x, 
        y, 
        docX: x + (scroller?.scrollLeft || 0), 
        docY: y + (scroller?.scrollTop || 0) 
    };
  };

  const startDrawing = (e) => {
    if (drawingMode === 'none') return;
    isDrawingRef.current = true;
    const { x, y, docX, docY } = getCoords(e);
    currentPathRef.current = [{ x: docX, y: docY }];
    lastDrawPointRef.current = { x, y };

    const ctx = ctxRef.current;
    if (!ctx) return;

    // Visual feedback settings
    ctx.lineWidth = drawingMode === 'erase' ? 20 : 2;
    if(drawingMode === 'highlight') { ctx.lineWidth = 20; ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)'; }
    else if(drawingMode !== 'erase') { ctx.strokeStyle = drawColor; }
    ctx.globalCompositeOperation = drawingMode === 'erase' ? 'destination-out' : 'source-over';
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const { x, y, docX, docY } = getCoords(e);
    currentPathRef.current.push({ x: docX, y: docY });

    const ctx = ctxRef.current;
    if (!ctx) return;

    // Real-time drawing feedback
    ctx.beginPath();
    ctx.moveTo(lastDrawPointRef.current.x, lastDrawPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastDrawPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    let width = 2;
    let color = drawColor;
    if(drawingMode === 'erase') width = 20;
    if(drawingMode === 'highlight') { width = 20; color = 'rgba(255, 255, 0, 0.15)'; }

    const newPath = { type: drawingMode, color, width, points: currentPathRef.current };
    
    // Update Local State & Clear Redo Stack on new action
    setDrawings(prev => [...prev, newPath]);
    setRedoStack([]); 
    
    currentPathRef.current = [];
  };

  const clearDrawings = () => {
      setDrawings([]);
      setRedoStack([]);
      const ctx = ctxRef.current;
      if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Local Undo Implementation
  const undo = () => {
      setDrawings(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          setRedoStack(stack => [...stack, last]);
          return prev.slice(0, -1);
      });
  };

  // Local Redo Implementation
  const redo = () => {
      setRedoStack(prevStack => {
          if (prevStack.length === 0) return prevStack;
          const toRestore = prevStack[prevStack.length - 1];
          setDrawings(draws => [...draws, toRestore]);
          return prevStack.slice(0, -1);
      });
  };

  return {
    canvasRef,
    containerRef,
    drawingMode,
    setDrawingMode,
    drawColor,
    setDrawColor,
    showDrawings,
    setShowDrawings,
    clearDrawings,
    undo,
    redo,
    canUndo: drawings.length > 0,
    canRedo: redoStack.length > 0,
    handlers: {
        onMouseDown: startDrawing,
        onMouseMove: draw,
        onMouseUp: stopDrawing,
        onMouseLeave: stopDrawing
    }
  };
}