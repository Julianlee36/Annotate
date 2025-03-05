import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Annotation, DrawingTool, Point } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AnnotationCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  selectedTool: DrawingTool;
  selectedColor: string;
  lineWidth: number;
  annotations: Annotation[];
  currentTime: number;
  onAnnotationChange: (annotation: Annotation | null) => void;
  visible?: boolean;
  defaultDuration?: number;
  debugMode?: boolean;
}

const AnnotationCanvas = forwardRef<HTMLCanvasElement, AnnotationCanvasProps>(
  ({ videoRef, selectedTool, selectedColor, lineWidth, annotations, currentTime, onAnnotationChange, visible = true, defaultDuration = 5, debugMode = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const observedElementRef = useRef<Element | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastRenderTimeRef = useRef<number>(0);
    const interactionTimestampRef = useRef<number>(performance.now());
    const debugModeRef = useRef<boolean>(debugMode);
    
    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);
    
    useEffect(() => {
      debugModeRef.current = debugMode;
    }, [debugMode]);
    
    useEffect(() => {
      const updateCanvasSize = () => {
        if (videoRef.current) {
          const videoRect = videoRef.current.getBoundingClientRect();
          setCanvasSize({
            width: videoRect.width,
            height: videoRect.height
          });
        }
      };
      
      updateCanvasSize();
      
      window.addEventListener('resize', updateCanvasSize);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      const targetElement = videoRef.current;
      
      if (targetElement && targetElement instanceof Element) {
        try {
          const observer = new ResizeObserver(() => {
            requestAnimationFrame(updateCanvasSize);
          });
          
          observedElementRef.current = targetElement;
          observer.observe(targetElement);
          resizeObserverRef.current = observer;
        } catch (error) {
          console.error('Error creating or attaching ResizeObserver:', error);
        }
      }
      
      const fallbackInterval = setInterval(() => {
        if (!resizeObserverRef.current && videoRef.current) {
          updateCanvasSize();
        }
      }, 1000);
      
      return () => {
        window.removeEventListener('resize', updateCanvasSize);
        
        if (resizeObserverRef.current) {
          try {
            resizeObserverRef.current.disconnect();
          } catch (error) {
            console.error('Error disconnecting ResizeObserver:', error);
          }
          resizeObserverRef.current = null;
        }
        
        clearInterval(fallbackInterval);
      };
    }, [videoRef]);
    
    useEffect(() => {
      if (videoRef.current && 
          videoRef.current instanceof Element && 
          videoRef.current !== observedElementRef.current && 
          resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current.observe(videoRef.current);
          observedElementRef.current = videoRef.current;
        } catch (error) {
          console.error('Error updating ResizeObserver target:', error);
        }
      }
    }, [videoRef.current]);
    
    useEffect(() => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasSize.width;
        canvasRef.current.height = canvasSize.height;
      }
    }, [canvasSize]);
    
    useEffect(() => {
      const animate = (timestamp: number) => {
        const deltaTime = (timestamp - lastRenderTimeRef.current) / 1000;
        lastRenderTimeRef.current = timestamp;
        
        renderFrame(deltaTime);
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      lastRenderTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }, [annotations, currentTime, visible, currentPoints, selectedTool, selectedColor, lineWidth]);
    
    const renderFrame = (deltaTime: number) => {
      if (!canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (!visible) return;
      
      const visibleAnnotations = annotations.filter(annotation => 
        currentTime >= annotation.startTime && currentTime <= annotation.endTime
      );
      
      visibleAnnotations.forEach(annotation => {
        drawAnnotation(ctx, annotation);
      });
      
      if (currentPoints.length > 0) {
        drawAnnotation(ctx, {
          id: 'current-drawing',
          tool: selectedTool,
          color: selectedColor,
          lineWidth,
          points: currentPoints,
          timestamp: currentTime,
          startTime: currentTime,
          endTime: currentTime + defaultDuration
        });
      }
    };
    
    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
      const { tool, color, lineWidth, points } = annotation;
      
      if (points.length === 0) return;
      
      ctx.save();
      
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,0)' : color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      if (tool === 'pencil' || tool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
      } else if (tool === 'line' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (tool === 'rectangle' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        
        const width = end.x - start.x;
        const height = end.y - start.y;
        
        ctx.beginPath();
        ctx.rect(start.x, start.y, width, height);
        ctx.stroke();
      } else if (tool === 'circle' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    };
    
    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      if (!canvasRef.current) return null;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      let clientX, clientY;
      
      if ('touches' in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };
    
    const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!visible || typeof onAnnotationChange !== 'function' || onAnnotationChange.toString() === '() => {}') {
        return;
      }
      
      const point = getCanvasPoint(e);
      if (!point) return;
      
      interactionTimestampRef.current = performance.now();
      
      setIsDrawing(true);
      setCurrentPoints([point]);
      
      const newAnnotation: Annotation = {
        id: uuidv4(),
        tool: selectedTool,
        color: selectedColor,
        lineWidth,
        points: [point],
        timestamp: currentTime,
        startTime: currentTime,
        endTime: currentTime + defaultDuration,
        debugInfo: debugModeRef.current ? {
          created: performance.now() / 1000
        } : undefined
      };
      
      if (debugModeRef.current) {
        console.log(`Starting new annotation ${newAnnotation.id} at ${currentTime.toFixed(2)}s, visible until ${newAnnotation.endTime.toFixed(2)}s`);
      }
      
      onAnnotationChange(newAnnotation);
    };
    
    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !visible || typeof onAnnotationChange !== 'function' || onAnnotationChange.toString() === '() => {}') {
        return;
      }
      
      const point = getCanvasPoint(e);
      if (!point) return;
      
      interactionTimestampRef.current = performance.now();
      
      const newPoints = [...currentPoints, point];
      setCurrentPoints(newPoints);
      
      if (currentAnnotation) {
        onAnnotationChange({
          ...currentAnnotation,
          points: newPoints
        });
      }
    };
    
    const handlePointerUp = () => {
      if (isDrawing && currentAnnotation) {
        onAnnotationChange({
          ...currentAnnotation,
          points: [...currentPoints]
        });
        
        setIsDrawing(false);
        setCurrentPoints([]);
      } else {
        setIsDrawing(false);
      }
    };
    
    const getCursorStyle = () => {
      if (typeof onAnnotationChange !== 'function' || onAnnotationChange.toString() === '() => {}') {
        return 'default';
      }
      return 'crosshair';
    };
    
    const currentAnnotation = currentPoints.length > 0 ? {
      id: 'current-drawing',
      tool: selectedTool,
      color: selectedColor,
      lineWidth,
      points: currentPoints,
      timestamp: currentTime,
      startTime: currentTime,
      endTime: currentTime + defaultDuration
    } : null;
    
    return (
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full z-10 ${
          !visible ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.2s ease-in-out',
          cursor: getCursorStyle()
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    );
  }
);

AnnotationCanvas.displayName = 'AnnotationCanvas';

export default AnnotationCanvas;