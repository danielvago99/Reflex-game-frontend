import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface ArenaCanvasProps {
  isActive: boolean;
  targetShape: 'circle' | 'square' | 'triangle';
  targetColor: string;
  onTargetAppeared: () => void;
  onTargetDisappeared?: () => void;
}

interface Shape {
  graphics: PIXI.Graphics;
  type: 'circle' | 'square' | 'triangle';
  color: number;
  isTarget: boolean;
}

// Module-level singleton - create app instance immediately
let globalPixiApp: PIXI.Application | undefined;
let initPromise: Promise<PIXI.Application> | undefined;
let isInitialized = false;

// Create or get the global PixiJS application
function getPixiApp(width: number, height: number): Promise<PIXI.Application> {
  // Return existing initialized app
  if (globalPixiApp && isInitialized) {
    return Promise.resolve(globalPixiApp);
  }

  // Wait for pending initialization
  if (initPromise) {
    return initPromise;
  }

  // Only create if it doesn't exist
  if (!globalPixiApp) {
    try {
      globalPixiApp = new PIXI.Application();
    } catch (err) {
      console.error('Failed to create PixiJS Application:', err);
      throw err;
    }
  }

  // Only initialize if not already initialized
  if (!isInitialized) {
    initPromise = globalPixiApp.init({
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgl', // Prefer WebGL but will fallback to canvas
    }).then(() => {
      const app = globalPixiApp!;
      initPromise = undefined;
      isInitialized = true;
      console.log('PixiJS initialized successfully with renderer:', app.renderer.type);
      return app;
    }).catch((err) => {
      console.error('Failed to initialize PixiJS:', err);
      initPromise = undefined;
      globalPixiApp = undefined;
      isInitialized = false;
      throw err;
    });

    return initPromise;
  }

  return Promise.resolve(globalPixiApp);
}

export function ArenaCanvas({ isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared }: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const targetTimerRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<number | null>(null);
  const hasNotifiedTargetRef = useRef(false);
  const currentTargetRef = useRef<Shape | null>(null);
  const appInitializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Calculate responsive dimensions - mobile-first
    const getCanvasDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Mobile: maximize use of space, keep simple aspect ratio
      if (viewportWidth < 640) { // < sm
        const width = Math.min(viewportWidth - 24, 360); // 12px padding each side
        return {
          width,
          height: Math.floor(width * 0.75) // 4:3 aspect ratio
        };
      } else if (viewportWidth < 768) { // sm to md
        return {
          width: Math.min(viewportWidth - 48, 560),
          height: 380
        };
      } else if (viewportWidth < 1024) { // md to lg
        return {
          width: 680,
          height: 450
        };
      } else {
        // Desktop
        return {
          width: 800,
          height: 500
        };
      }
    };

    const { width, height } = getCanvasDimensions();

    let mounted = true;

    const initializePixi = async () => {
      try {
        const app = await getPixiApp(width, height);

        if (!mounted || !containerRef.current) return;

        // Add canvas to container if not already present
        if (app.canvas && !containerRef.current.contains(app.canvas)) {
          containerRef.current.appendChild(app.canvas);
        }
        
        appInitializedRef.current = true;
      } catch (err) {
        console.error('Failed to setup PixiJS:', err);
      }
    };

    initializePixi();

    return () => {
      mounted = false;
      // Don't destroy the global app, just remove canvas from this container
      if (containerRef.current && globalPixiApp?.canvas) {
        if (containerRef.current.contains(globalPixiApp.canvas)) {
          containerRef.current.removeChild(globalPixiApp.canvas);
        }
      }
    };
  }, []);

  // Game logic - spawn shapes when active
  useEffect(() => {
    if (!isActive || !appInitializedRef.current) {
      hasNotifiedTargetRef.current = false;
      return;
    }

    const app = globalPixiApp!;
    hasNotifiedTargetRef.current = false;

    // Clear existing shapes
    shapesRef.current.forEach(shape => {
      app.stage.removeChild(shape.graphics);
    });
    shapesRef.current = [];

    // Spawn initial random shapes
    for (let i = 0; i < 8; i++) {
      setTimeout(() => spawnShape(app, false), i * 150);
    }

    // Spawn target shape after 1-3 seconds
    const targetDelay = 1000 + Math.random() * 1000;
    targetTimerRef.current = window.setTimeout(() => {
      spawnShape(app, true);
    }, targetDelay);

    // Continue spawning random shapes
    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.2) { // 80% chance to spawn
        spawnShape(app, false);
      }
    }, 500);

    return () => {
      if (targetTimerRef.current !== null) {
        clearTimeout(targetTimerRef.current);
        targetTimerRef.current = null;
      }

      if (spawnIntervalRef.current !== null) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared]);

  // Convert hex color to number
  const hexToNumber = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };

  // Available colors for shapes
  const colors = {
    red: 0xFF0000,
    green: 0x00FF00,
    blue: 0x0000FF,
    yellow: 0xFFFF00,
    purple: 0x9333EA,
    cyan: 0x06B6D4,
    orange: 0xFF6B00,
    pink: 0xFF0099,
  };

  const colorArray = Object.values(colors);
  const targetColorNumber = hexToNumber(targetColor);

  // Create shape graphics
  const createShape = (type: 'circle' | 'square' | 'triangle', color: number, x: number, y: number, size: number): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();

    if (type === 'circle') {
      graphics.circle(0, 0, size);
    } else if (type === 'square') {
      graphics.rect(-size, -size, size * 2, size * 2);
    } else if (type === 'triangle') {
      graphics.moveTo(0, -size);
      graphics.lineTo(size, size);
      graphics.lineTo(-size, size);
      graphics.closePath();
    }

    graphics.fill({ color, alpha: 1 });
    graphics.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.3 });

    graphics.x = x;
    graphics.y = y;

    return graphics;
  };

  // Spawn random shapes
  const spawnShape = (app: PIXI.Application, shouldBeTarget: boolean = false) => {
    if (!app.stage) return;

    const width = app.screen.width;
    const height = app.screen.height;

    // Random position with padding
    const padding = 80;
    const x = padding + Math.random() * (width - padding * 2);
    const y = padding + Math.random() * (height - padding * 2);

    // Random size
    const size = 12 + Math.random() * 18;

    let type: 'circle' | 'square' | 'triangle';
    let color: number;

    if (shouldBeTarget) {
      type = targetShape;
      color = targetColorNumber;
    } else {
      // Random shape and color, but not the target combination
      const shapeTypes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
      type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      color = colorArray[Math.floor(Math.random() * colorArray.length)];
      
      // If we accidentally created the target, change it
      if (type === targetShape && color === targetColorNumber) {
        color = colorArray.find(c => c !== targetColorNumber) || colors.red;
      }
    }

    const graphics = createShape(type, color, x, y, size);
    
    // Add fade-in animation
    graphics.alpha = 0;
    app.stage.addChild(graphics);

    const shape: Shape = {
      graphics,
      type,
      color,
      isTarget: shouldBeTarget,
    };

    shapesRef.current.push(shape);

    // Fade in
    const fadeIn = setInterval(() => {
      graphics.alpha += 0.1;
      if (graphics.alpha >= 1) {
        clearInterval(fadeIn);
        
        // If this is the target shape, notify parent
        if (shouldBeTarget && !hasNotifiedTargetRef.current) {
          hasNotifiedTargetRef.current = true;
          onTargetAppeared();
          currentTargetRef.current = shape;
        }
      }
    }, 30);

    // Schedule removal after 2-4 seconds
    setTimeout(() => {
      const fadeOut = setInterval(() => {
        graphics.alpha -= 0.05;
        if (graphics.alpha <= 0) {
          clearInterval(fadeOut);
          app.stage.removeChild(graphics);
          shapesRef.current = shapesRef.current.filter(s => s !== shape);
          
          // If this is the target shape, notify parent
          if (shouldBeTarget && hasNotifiedTargetRef.current && onTargetDisappeared) {
            hasNotifiedTargetRef.current = false;
            onTargetDisappeared();
            currentTargetRef.current = null;
          }
        }
      }, 30);
    }, 2000 + Math.random() * 2000);
  };

  return (
    <div className="relative w-full h-full max-w-4xl mx-auto">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>
      
      {/* Main canvas container */}
      <div 
        ref={containerRef}
        className="relative bg-black/40 backdrop-blur-lg border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px] md:min-h-[500px]"
      >
        {/* Corner accents */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none z-10"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-pink-400/50 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-pink-400/50 pointer-events-none z-10"></div>

        {/* Scan line animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line"></div>
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none z-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>
    </div>
  );
}