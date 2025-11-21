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

// Spawn and pacing constants tuned to mirror the original gameplay feel
const DECOY_LIFESPAN_MS = { min: 1800, max: 2800 };
const TARGET_LIFESPAN_MS = { min: 2200, max: 3800 };
const TARGET_APPEAR_DELAY_MS = { min: 1000, max: 2800 };
const TARGET_RESPAWN_DELAY_MS = { min: 1200, max: 2600 };
const DECOY_SPAWN_INTERVAL_MS = { min: 450, max: 750 };
const INITIAL_DECOYS = 6;
const MAX_SHAPES_ON_SCREEN = 14;
const SHAPE_POOL_LIMIT = 36;
const ARENA_PADDING = 72;
const SHAPE_SIZE = { min: 14, max: 26 };
const FADE_IN_MS = 250;
const FADE_OUT_MS = 400;
const COLOR_CHOICES = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x9333ea, 0x06b6d4, 0xff6b00, 0xff0099];

const randomInRange = (range: { min: number; max: number }) => range.min + Math.random() * (range.max - range.min);
const hexToNumber = (hex: string): number => parseInt(hex.replace('#', ''), 16);

export function ArenaCanvas({ isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared }: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const tickerRef = useRef<PIXI.Ticker | null>(null);
  const shapesRef = useRef<ShapeInstance[]>([]);
  const shapePoolRef = useRef<PIXI.Graphics[]>([]);
  const currentTargetRef = useRef<ShapeInstance | null>(null);
  const decoyTimerRef = useRef<number>(0);
  const nextDecoyIntervalRef = useRef<number>(randomInRange(DECOY_SPAWN_INTERVAL_MS));
  const targetSpawnTimerRef = useRef<number>(randomInRange(TARGET_APPEAR_DELAY_MS));
  const isActiveRef = useRef<boolean>(isActive);
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const clearShapes = useCallback(
    (app: PIXI.Application | null, { notifyTarget = false }: { notifyTarget?: boolean } = {}) => {
      shapesRef.current.forEach((shape) => {
        if (shape.isTarget && notifyTarget && currentTargetRef.current === shape && onTargetDisappeared) {
          onTargetDisappeared();
        }

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
    },
    [onTargetDisappeared]
  );

  const getGraphic = useCallback(() => {
    const pooled = shapePoolRef.current.pop();
    if (pooled) {
      pooled.clear();
      return pooled;
    }
    return new PIXI.Graphics();
  }, []);

  const spawnShape = useCallback(
    (app: PIXI.Application | null, { isTarget = false }: { isTarget?: boolean } = {}) => {
      if (!app) return;

      const graphics = getGraphic();
      const width = app.renderer.width;
      const height = app.renderer.height;

      const x = ARENA_PADDING + Math.random() * Math.max(10, width - ARENA_PADDING * 2);
      const y = ARENA_PADDING + Math.random() * Math.max(10, height - ARENA_PADDING * 2);
      const size = SHAPE_SIZE.min + Math.random() * (SHAPE_SIZE.max - SHAPE_SIZE.min);

      const targetColorNumber = hexToNumber(targetColor);

      let type: 'circle' | 'square' | 'triangle';
      let color: number;

      if (isTarget) {
        type = targetShape;
        color = targetColorNumber;
      } else {
        const shapeTypes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
        type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        color = COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)];

        // Never allow a decoy to match the active target combination
        if (type === targetShape && color === targetColorNumber) {
          // Adjust the color while keeping the random type
          color = COLOR_CHOICES.find((c) => c !== targetColorNumber) ?? COLOR_CHOICES[0];
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

      const lifespanMs = isTarget ? randomInRange(TARGET_LIFESPAN_MS) : randomInRange(DECOY_LIFESPAN_MS);
      const shape: ShapeInstance = {
        graphics,
        type,
        color,
        isTarget,
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
        if (onTargetDisappeared) {
          onTargetDisappeared();
        }
        targetSpawnTimerRef.current = randomInRange(TARGET_RESPAWN_DELAY_MS);
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
    (app: PIXI.Application, deltaMs: number) => {
      for (const shape of [...shapesRef.current]) {
        shape.ageMs += deltaMs;

        if (shape.state === 'fade-in') {
          shape.graphics.alpha = Math.min(1, shape.ageMs / FADE_IN_MS);
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
          const remaining = Math.max(0, 1 - shape.ageMs / FADE_OUT_MS);
          shape.graphics.alpha = remaining;
          if (remaining <= 0) {
            removeShape(app, shape);
          }
        }
      }
    },
    [onTargetAppeared, removeShape]
  );

  const startRound = useCallback(
    (app: PIXI.Application) => {
      clearShapes(app, { notifyTarget: true });
      decoyTimerRef.current = 0;
      nextDecoyIntervalRef.current = randomInRange(DECOY_SPAWN_INTERVAL_MS);
      targetSpawnTimerRef.current = randomInRange(TARGET_APPEAR_DELAY_MS);

      for (let i = 0; i < INITIAL_DECOYS && shapesRef.current.length < MAX_SHAPES_ON_SCREEN; i++) {
        spawnShape(app, { isTarget: false });
      }
    },
    [clearShapes, spawnShape]
  );

  const update = useCallback(() => {
    const app = appRef.current;
    const ticker = tickerRef.current;
    if (!app || !ticker || !isActiveRef.current) return;

    const deltaMs = ticker.deltaMS;

    if (shapesRef.current.length < MAX_SHAPES_ON_SCREEN) {
      decoyTimerRef.current += deltaMs;
      if (decoyTimerRef.current >= nextDecoyIntervalRef.current) {
        spawnShape(app, { isTarget: false });
        decoyTimerRef.current = 0;
        nextDecoyIntervalRef.current = randomInRange(DECOY_SPAWN_INTERVAL_MS);
      }
    }

    if (!currentTargetRef.current) {
      targetSpawnTimerRef.current -= deltaMs;
      if (targetSpawnTimerRef.current <= 0) {
        spawnShape(app, { isTarget: true });
        // Prevent another target from spawning until the current one expires
        targetSpawnTimerRef.current = Number.POSITIVE_INFINITY;
      }
    }

    updateShapes(app, deltaMs);
  }, [spawnShape, updateShapes]);

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
      clearShapes(app, { notifyTarget: true });
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

    const ticker = tickerRef.current ?? new PIXI.Ticker();
    tickerRef.current = ticker;

    ticker.add(update);
    if (isActive) {
      ticker.start();
    } else {
      ticker.stop();
    }

    return () => {
      ticker.remove(update);
    };
  }, [isActive, isAppReady, update]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    if (isActive) {
      startRound(app);
      tickerRef.current?.start();
    } else {
      tickerRef.current?.stop();
    }
  }, [isActive, isAppReady, startRound]);

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
