import { useCallback, useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

interface ArenaCanvasProps {
  isActive: boolean;
  targetShape: 'circle' | 'square' | 'triangle';
  targetColor: string;
  onTargetAppeared: () => void;
  onTargetDisappeared?: () => void;
}

interface ShapeInstance {
  graphics: PIXI.Graphics;
  type: 'circle' | 'square' | 'triangle';
  color: number;
  isTarget: boolean;
  state: 'fade-in' | 'visible' | 'fade-out';
  ageMs: number;
  lifespanMs: number;
  hasAnnounced?: boolean;
}

const MIN_LIFESPAN = 2000;
const MAX_LIFESPAN = 4000;
const TARGET_RESPAWN_DELAY = { min: 800, max: 1500 };
const RANDOM_SPAWN_INTERVAL = 400;
const INITIAL_RANDOM_SHAPES = 8;
const SHAPE_POOL_LIMIT = 36;

const hexToNumber = (hex: string): number => parseInt(hex.replace('#', ''), 16);

export function ArenaCanvas({ isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared }: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const tickerRef = useRef<PIXI.Ticker | null>(null);
  const shapesRef = useRef<ShapeInstance[]>([]);
  const shapePoolRef = useRef<PIXI.Graphics[]>([]);
  const currentTargetRef = useRef<ShapeInstance | null>(null);
  const spawnTimerRef = useRef<number>(0);
  const targetSpawnTimerRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(isActive);
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const clearShapes = useCallback((app: PIXI.Application | null) => {
    shapesRef.current.forEach((shape) => {
      app?.stage.removeChild(shape.graphics);
      if (shapePoolRef.current.length < SHAPE_POOL_LIMIT) {
        shape.graphics.alpha = 1;
        shape.graphics.clear();
        shapePoolRef.current.push(shape.graphics);
      } else {
        shape.graphics.destroy();
      }
    });
    shapesRef.current = [];
    currentTargetRef.current = null;
  }, []);

  const getGraphic = useCallback(() => {
    const pooled = shapePoolRef.current.pop();
    if (pooled) {
      pooled.clear();
      return pooled;
    }
    return new PIXI.Graphics();
  }, []);

  const spawnShape = useCallback(
    (app: PIXI.Application | null, shouldBeTarget = false) => {
      if (!app) return;

      const graphics = getGraphic();
      const width = app.renderer.width;
      const height = app.renderer.height;

      const padding = 80;
      const x = padding + Math.random() * Math.max(10, width - padding * 2);
      const y = padding + Math.random() * Math.max(10, height - padding * 2);
      const size = 8 + Math.random() * 14;

      const colorArray = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x9333ea, 0x06b6d4, 0xff6b00, 0xff0099];
      const targetColorNumber = hexToNumber(targetColor);

      let type: 'circle' | 'square' | 'triangle';
      let color: number;

      if (shouldBeTarget) {
        type = targetShape;
        color = targetColorNumber;
      } else {
        const shapeTypes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
        type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        color = colorArray[Math.floor(Math.random() * colorArray.length)];

        if (type === targetShape && color === targetColorNumber) {
          color = colorArray.find((c) => c !== targetColorNumber) ?? colorArray[0];
        }
      }

      graphics.clear();
      if (type === 'circle') {
        graphics.circle(0, 0, size);
      } else if (type === 'square') {
        graphics.rect(-size, -size, size * 2, size * 2);
      } else {
        graphics.moveTo(0, -size);
        graphics.lineTo(size, size);
        graphics.lineTo(-size, size);
        graphics.closePath();
      }

      graphics.fill({ color, alpha: 1 });
      graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });
      graphics.x = x;
      graphics.y = y;
      graphics.alpha = 0;

      app.stage.addChild(graphics);

      const lifespanMs = MIN_LIFESPAN + Math.random() * (MAX_LIFESPAN - MIN_LIFESPAN);
      const shape: ShapeInstance = {
        graphics,
        type,
        color,
        isTarget: shouldBeTarget,
        state: 'fade-in',
        ageMs: 0,
        lifespanMs,
      };

      shapesRef.current.push(shape);
    },
    [getGraphic, targetColor, targetShape]
  );

  const removeShape = useCallback(
    (app: PIXI.Application | null, shape: ShapeInstance) => {
      app?.stage.removeChild(shape.graphics);
      shapesRef.current = shapesRef.current.filter((s) => s !== shape);

      if (shape.isTarget) {
        currentTargetRef.current = null;
        shape.hasAnnounced = false;
        if (isActiveRef.current && onTargetDisappeared) {
          onTargetDisappeared();
        }
        targetSpawnTimerRef.current = TARGET_RESPAWN_DELAY.min + Math.random() * (TARGET_RESPAWN_DELAY.max - TARGET_RESPAWN_DELAY.min);
      }

      if (shapePoolRef.current.length < SHAPE_POOL_LIMIT) {
        shape.graphics.alpha = 1;
        shape.graphics.clear();
        shapePoolRef.current.push(shape.graphics);
      } else {
        shape.graphics.destroy();
      }
    },
    [onTargetDisappeared]
  );

  const updateShapes = useCallback(
    (app: PIXI.Application) => {
      const fadeInMs = 250;
      const fadeOutMs = 400;

      for (const shape of [...shapesRef.current]) {
        shape.ageMs += tickerRef.current?.deltaMS ?? 0;

        if (shape.state === 'fade-in') {
          shape.graphics.alpha = Math.min(1, shape.ageMs / fadeInMs);
          if (shape.graphics.alpha >= 1) {
            shape.state = 'visible';
            shape.ageMs = 0;
            if (shape.isTarget && !shape.hasAnnounced) {
              shape.hasAnnounced = true;
              currentTargetRef.current = shape;
              onTargetAppeared();
            }
          }
        } else if (shape.state === 'visible') {
          if (shape.ageMs >= shape.lifespanMs) {
            shape.state = 'fade-out';
            shape.ageMs = 0;
          }
        } else if (shape.state === 'fade-out') {
          const remaining = Math.max(0, 1 - shape.ageMs / fadeOutMs);
          shape.graphics.alpha = remaining;
          if (remaining <= 0) {
            removeShape(app, shape);
          }
        }
      }
    },
    [onTargetAppeared, removeShape]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new PIXI.Application();
    let destroyed = false;

    const initApp = async () => {
      try {
        await app.init({ resizeTo: container, backgroundAlpha: 0, antialias: true });
        if (destroyed) {
          app.destroy(true, { children: true });
          return;
        }

        appRef.current = app;
        container.appendChild(app.canvas);
        setIsAppReady(true);
      } catch (error) {
        console.error('Failed to initialize PixiJS application:', error);
        setInitError('Unable to start the arena renderer.');
        app.destroy(true, { children: true });
      }
    };

    initApp();

    return () => {
      destroyed = true;
      clearShapes(app);
      tickerRef.current?.stop();
      tickerRef.current?.destroy();
      tickerRef.current = null;

      if (app.canvas && container.contains(app.canvas)) {
        container.removeChild(app.canvas);
      }
      app.destroy(true, { children: true });
      appRef.current = null;
      setIsAppReady(false);
    };
  }, [clearShapes]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    clearShapes(app);
    spawnTimerRef.current = 0;
    targetSpawnTimerRef.current = 0;

    if (!isActive) {
      return;
    }

    // Seed the scene with a few shapes to avoid empty renders
    for (let i = 0; i < INITIAL_RANDOM_SHAPES; i++) {
      spawnShape(app, false);
    }
  }, [clearShapes, isActive, isAppReady, spawnShape, targetColor, targetShape]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    if (!isActive) {
      clearShapes(app);
      tickerRef.current?.stop();
      return;
    }

    const ticker = tickerRef.current ?? new PIXI.Ticker();
    tickerRef.current = ticker;

    const update = () => {
      spawnTimerRef.current += ticker.deltaMS;
      targetSpawnTimerRef.current -= ticker.deltaMS;

      if (spawnTimerRef.current >= RANDOM_SPAWN_INTERVAL) {
        if (Math.random() > 0.2) {
          spawnShape(app, false);
        }
        spawnTimerRef.current = 0;
      }

      if (!currentTargetRef.current && targetSpawnTimerRef.current <= 0) {
        spawnShape(app, true);
        targetSpawnTimerRef.current = MIN_LIFESPAN; // avoid immediate respawn
      }

      updateShapes(app);
    };

    ticker.add(update);
    ticker.start();

    return () => {
      ticker.remove(update);
    };
  }, [clearShapes, isActive, isAppReady, spawnShape, updateShapes]);

  if (initError) {
    return (
      <div className="relative w-full h-full max-w-4xl mx-auto">
        <div className="relative bg-black/40 backdrop-blur-lg border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px] md:min-h-[500px] flex items-center justify-center text-gray-200">
          <p className="text-center px-6">{initError} Please reload the page to try again.</p>
        </div>
      </div>
    );
  }

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
