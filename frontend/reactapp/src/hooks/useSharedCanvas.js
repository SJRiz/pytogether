import { useState, useRef, useEffect, useCallback } from "react";
import * as Y from 'yjs';

export function useSharedCanvas(ydocRef, isConnected, isSynced) {
  const [drawingMode, setDrawingMode] = useState('none');
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [showDrawings, setShowDrawings] = useState(true);
  const [drawings, setDrawings] = useState([]);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const ctxRef = useRef(null);
  const scrollerRef = useRef(null);
  
  const ydrawingsRef = useRef(null);
  const drawingUndoManagerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const lastDrawPointRef = useRef(null);
  const flushIntervalRef = useRef(null);
  const liveStrokeIdRef = useRef(null);

  // Initialize Y.js drawings
  useEffect(() => {
    if (!ydocRef.current || !isConnected) return;
    
    const ydrawings = ydocRef.current.getArray('drawings');
    ydrawingsRef.current = ydrawings;
    
    drawingUndoManagerRef.current = new Y.UndoManager(ydrawings);

    const observer = () => setDrawings(ydrawings.toArray());
    ydrawings.observe(observer);
    observer(); // Initial sync

    return () => {
      ydrawings.unobserve(observer);
      if (drawingUndoManagerRef.current) drawingUndoManagerRef.current.destroy();
    };
  }, [ydocRef, isConnected]);

  // Clean up live stroke interval on unmount
  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
  }, []);

  // Redraw logic
  const redrawAll = useCallback(() => {
    // Defines ctx at the very top level of the function to avoid ReferenceErrors
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

    // Reset composite so the local in-progress indicator draws normally
    ctx.globalCompositeOperation = 'source-over';

    // Draw the local in-progress stroke so it doesn't disappear during Y.js redraws
    if (isDrawingRef.current && currentPathRef.current.length >= 2) {
      // For eraser, only show a short trailing indicator (last 30 points)
      const points = drawingMode === 'erase'
        ? currentPathRef.current.slice(-30)
        : currentPathRef.current;

      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x - scrollLeft, points[0].y - scrollTop);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x - scrollLeft, points[i].y - scrollTop);
        }
        ctx.lineWidth = drawingMode === 'erase' ? 20 : drawingMode === 'highlight' ? 20 : 2;
        if (drawingMode === 'erase') ctx.strokeStyle = '#000000';
        else if (drawingMode === 'highlight') ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)';
        else ctx.strokeStyle = drawColor;
        ctx.globalCompositeOperation = 'source-over';
        ctx.stroke();
        ctx.closePath();
      }
    }
  }, [drawings, showDrawings, drawingMode, drawColor]);

  useEffect(() => {
  if (!isSynced) return;
  const canvas = canvasRef.current;
  const container = containerRef.current;
  if (!canvas || !container) return;

  // Force the ResizeObserver to pick up the real dimensions
  const { width, height } = container.getBoundingClientRect();
  if (width > 0 && height > 0) {
    canvas.width = width;
    canvas.height = height;
    redrawAll();
  }
}, [isSynced]);

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
    
    // Polling for CodeMirror scroller to attach scroll listener
    const findScroller = setInterval(() => {
        const scroller = container.querySelector('.cm-scroller');
        if (scroller) {
            scrollerRef.current = scroller;
            scroller.addEventListener('scroll', redrawAll);
            redrawAll(); // Trigger immediate redraw once scroller is found
            clearInterval(findScroller);
        }
    }, 100);

    // Initial redraw to ensure visibility
    redrawAll();

    return () => {
      resizeObserver.disconnect();
      scrollerRef.current?.removeEventListener('scroll', redrawAll);
      clearInterval(findScroller);
    };
  }, [redrawAll]);

  // Ensure we redraw whenever drawings data changes
  useEffect(() => { 
      redrawAll(); 
  }, [drawings, showDrawings, redrawAll]);

  // Mouse Handlers
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
    liveStrokeIdRef.current = `live_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.lineWidth = drawingMode === 'erase' ? 20 : 2;
    if(drawingMode === 'highlight') { ctx.lineWidth = 20; ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)'; }
    else if(drawingMode === 'erase') { ctx.strokeStyle = '#000000'; }
    else { ctx.strokeStyle = drawColor; }
    ctx.globalCompositeOperation = 'source-over';

    // Flush partial stroke to Y.js every 300ms so other users see it live
    flushIntervalRef.current = setInterval(() => {
      const ydrawings = ydrawingsRef.current;
      if (currentPathRef.current.length < 2 || !ydrawings) return;

      let width = 2;
      let color = drawColor;
      if (drawingMode === 'erase') width = 20;
      if (drawingMode === 'highlight') { width = 20; color = 'rgba(255, 255, 0, 0.15)'; }

      const partialPath = {
        type: drawingMode, color, width,
        points: [...currentPathRef.current],
        _liveId: liveStrokeIdRef.current
      };

      ydrawings.doc.transact(() => {
        for (let i = ydrawings.length - 1; i >= 0; i--) {
          if (ydrawings.get(i)?._liveId === liveStrokeIdRef.current) {
            ydrawings.delete(i, 1);
            break;
          }
        }
        ydrawings.push([partialPath]);
      }, 'live-stroke'); // Custom origin so undo manager ignores live previews
    }, 300);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const { x, y, docX, docY } = getCoords(e);
    currentPathRef.current.push({ x: docX, y: docY });

    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastDrawPointRef.current.x, lastDrawPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastDrawPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    
    let width = 2;
    let color = drawColor;
    if(drawingMode === 'erase') width = 20;
    if(drawingMode === 'highlight') { width = 20; color = 'rgba(255, 255, 0, 0.15)'; }

    const newPath = { type: drawingMode, color, width, points: currentPathRef.current };
    const ydrawings = ydrawingsRef.current;
    if (ydrawings) {
      // Remove live stroke preview (untracked by undo manager)
      ydrawings.doc.transact(() => {
        for (let i = ydrawings.length - 1; i >= 0; i--) {
          if (ydrawings.get(i)?._liveId === liveStrokeIdRef.current) {
            ydrawings.delete(i, 1);
            break;
          }
        }
      }, 'live-stroke');
      // Push final completed path (tracked by undo manager)
      ydrawings.push([newPath]);
    }
    currentPathRef.current = [];
    liveStrokeIdRef.current = null;
  };

  const clearDrawings = () => ydrawingsRef.current?.delete(0, ydrawingsRef.current.length);
  const undo = () => drawingUndoManagerRef.current?.undo();
  const redo = () => drawingUndoManagerRef.current?.redo();

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
    handlers: {
        onMouseDown: startDrawing,
        onMouseMove: draw,
        onMouseUp: stopDrawing,
        onMouseLeave: stopDrawing
    }
  };
}