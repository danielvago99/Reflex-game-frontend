import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

interface ArenaCanvasProps {
  isActive: boolean;
  targetShape: 'circle' | 'square' | 'triangle';
  targetColor: string;
  onTargetAppeared: () => void;
  onTargetDisappeared?: () => void;
  targetShowSignal: number;
}

interface Shape {
  graphics: PIXI.Graphics;
  type: 'circle' | 'square' | 'triangle';
  color: number;
  isTarget: boolean;
  rotationSpeed: number;
  pulseSpeed: number;
  pulseOffset: number;
  baseScale: number;
  fadeMode: 'in' | 'out' | 'steady';
  fadeDuration: number;
  fadeElapsed: number;
  onFadeComplete?: () => void;
  fadeTimeout?: number;
}

// Module-level singleton - create app instance immediately
let globalPixiApp: PIXI.Application | null = null;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const adjustColor = (color: number, factor: number) => {
  const r = clamp(((color >> 16) & 0xff) * factor, 0, 255);
  const g = clamp(((color >> 8) & 0xff) * factor, 0, 255);
  const b = clamp((color & 0xff) * factor, 0, 255);
  return (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b);
};

const lighten = (color: number, percent: number) => adjustColor(color, 1 + percent);
const darken = (color: number, percent: number) => adjustColor(color, 1 - percent);

// Convert hex color to number
const hexToNumber = (hex: string): number => {
  return parseInt(hex.replace('#', ''), 16);
};

const createOrbGraphic = (color: number, radius: number) => {
  const orb = new PIXI.Graphics();
  orb.circle(0, 0, radius * 1.4).fill({ color, alpha: 0.08 });
  orb.circle(0, 0, radius).fill({ color, alpha: 0.2 });
  orb.circle(-radius * 0.2, -radius * 0.2, radius * 0.55).fill({ color: lighten(color, 0.2), alpha: 0.25 });
  return orb;
};

export function ArenaCanvas({
  isActive,
  targetShape,
  targetColor,
  onTargetAppeared,
  onTargetDisappeared,
  targetShowSignal,
}: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const spawnIntervalRef = useRef<number | null>(null);
  const initialSpawnTimersRef = useRef<number[]>([]);
  const hasNotifiedTargetRef = useRef(false);
  const currentTargetRef = useRef<Shape | null>(null);
  const targetPropsRef = useRef({ shape: targetShape, colorNumber: hexToNumber(targetColor) });
  const shapesContainerRef = useRef<PIXI.Container | null>(null);
  const parallaxRef = useRef<{ grid: PIXI.Graphics; orbs: PIXI.Graphics[]; time: number; container: PIXI.Container } | null>(null);
  const animationTimeRef = useRef(0);
  const [isAppReady, setIsAppReady] = useState(false);
  const isActiveRef = useRef(isActive);
  const targetShowSignalRef = useRef(0);

  const isAppUsable = (app?: PIXI.Application | null) => {
    const targetApp = app ?? globalPixiApp;
    return !!(
      targetApp &&
      targetApp.stage &&
      !targetApp.stage.destroyed &&
      targetApp.renderer &&
      !targetApp.renderer.destroyed
    );
  };

  const cleanupShapes = (force = false) => {
    const parent = shapesContainerRef.current || globalPixiApp?.stage;
    shapesRef.current.forEach(shape => {
      if (shape.fadeTimeout) {
        window.clearTimeout(shape.fadeTimeout);
      }

      if (parent && 'destroyed' in parent && (parent as any).destroyed) return;

      if (parent && parent.children.includes(shape.graphics)) {
        parent.removeChild(shape.graphics);
      }
    });

    shapesRef.current = [];
    currentTargetRef.current = null;
    hasNotifiedTargetRef.current = false;
  };

  const clearTimers = () => {
    if (spawnIntervalRef.current !== null) {
      window.clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    if (initialSpawnTimersRef.current.length) {
      initialSpawnTimersRef.current.forEach(timer => window.clearTimeout(timer));
      initialSpawnTimersRef.current = [];
    }
  };


  const createParallaxGraphics = (width: number, height: number) => {
    const parallax = parallaxRef.current;
    if (!parallax) return;

    const { grid, orbs } = parallax;
    const spacing = 90;
    grid.clear();
    for (let x = -width; x < width * 2; x += spacing) {
      grid.moveTo(x, -height).lineTo(x, height * 2);
    }
    for (let y = -height; y < height * 2; y += spacing) {
      grid.moveTo(-width, y).lineTo(width * 2, y);
    }
    grid.stroke({ color: 0x00e5ff, width: 1, alpha: 0.04 });

    const palette = [0x7c3aed, 0x0ea5e9, 0x14b8a6, 0x38bdf8];
    orbs.forEach((orb, idx) => {
      orb.position.set(
        (width * (0.2 + idx * 0.25)) % width + Math.random() * width * 0.2,
        (height * (0.3 + idx * 0.15)) % height + Math.random() * height * 0.2
      );
      const color = palette[idx % palette.length];
      orb.tint = color;
    });
  };

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    targetPropsRef.current = { shape: targetShape, colorNumber: hexToNumber(targetColor) };
  }, [targetShape, targetColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let resizeAttached = false;
    const existingApp = globalPixiApp;
    const app = existingApp ?? new PIXI.Application();
    if (!existingApp) {
      globalPixiApp = app;
    }
    const needsInit = !app.renderer;

    const handleResize = () => {
      if (!isAppUsable(app)) return;

      app.renderer.resize(container.clientWidth, container.clientHeight);
      if (parallaxRef.current) {
        const { grid } = parallaxRef.current;
        grid.clear();
        createParallaxGraphics(app.renderer.width, app.renderer.height);
      }
    };

    const initApp = async () => {
      try {
        if (needsInit) {
          await app.init({
            resizeTo: container,
            backgroundAlpha: 0,
            antialias: true,
          });
        }

        if (destroyed) {
          return;
        }

        container.appendChild(app.canvas);
        console.debug('[ArenaCanvas] Pixi app attached, width=', app.renderer.width, 'height=', app.renderer.height);
        setIsAppReady(true);

        handleResize();
        window.addEventListener('resize', handleResize);
        resizeAttached = true;
      } catch (error) {
        console.error('Failed to initialize PixiJS application:', error);
      }
    };

    initApp();

    return () => {
      destroyed = true;

      clearTimers();
      cleanupShapes(true);

      if (resizeAttached) {
        window.removeEventListener('resize', handleResize);
      }

      if (app.canvas && container.contains(app.canvas)) {
        container.removeChild(app.canvas);
        console.debug('[ArenaCanvas] Pixi app detached from DOM (not destroyed)');
      }

      parallaxRef.current = null;
      shapesContainerRef.current = null;
      setIsAppReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isAppReady || !globalPixiApp) return;

    const app = globalPixiApp;
    const stage = app.stage;

    const parallaxContainer = new PIXI.Container();
    const grid = new PIXI.Graphics();
    const orbA = createOrbGraphic(0x7c3aed, 80);
    const orbB = createOrbGraphic(0x0ea5e9, 110);
    const orbC = createOrbGraphic(0x14b8a6, 70);

    parallaxContainer.addChild(grid, orbA, orbB, orbC);
    parallaxRef.current = { grid, orbs: [orbA, orbB, orbC], time: 0, container: parallaxContainer };

    const shapesContainer = new PIXI.Container();
    shapesContainerRef.current = shapesContainer;

    stage.addChild(parallaxContainer);
    stage.addChild(shapesContainer);

    createParallaxGraphics(app.renderer.width, app.renderer.height);

    return () => {
      if (!stage.destroyed && stage.children.includes(parallaxContainer)) {
        stage.removeChild(parallaxContainer);
      }

      if (!stage.destroyed && stage.children.includes(shapesContainer)) {
        stage.removeChild(shapesContainer);
      }

      parallaxRef.current = null;
      shapesContainerRef.current = null;
    };
  }, [isAppReady]);

  // Game logic - spawn shapes when active
  useEffect(() => {
    if (!isActive || !isAppReady) {
      clearTimers();
      cleanupShapes();
      hasNotifiedTargetRef.current = false;
      targetShowSignalRef.current = 0;
      return;
    }

    const app = globalPixiApp;
    if (!app) return;
    hasNotifiedTargetRef.current = false;

    // Clear existing shapes
    cleanupShapes();

    // Spawn initial random shapes
    for (let i = 0; i < 12; i++) {
      const timer = window.setTimeout(() => {
        if (!isAppUsable(app)) return;
        spawnShape(app, false);
      }, i * 100);
      initialSpawnTimersRef.current.push(timer);
    }

    // Continue spawning random shapes
    const spawnInterval = window.setInterval(() => {
      if (!isAppUsable(app)) return;
      if (shapesRef.current.length < 30) {
        // spawn at high frequency but keep a cap
        if (Math.random() > 0.08) {
          spawnShape(app, false);
        }
      }
    }, 300);
    spawnIntervalRef.current = spawnInterval;
    return () => {
      clearTimers();
      cleanupShapes();
    };
  }, [isActive, isAppReady]);

  useEffect(() => {
    if (!isActive || !isAppReady || !globalPixiApp) return;

    const app = globalPixiApp;
    if (!isAppUsable(app)) return;

    const hasNewSignal = targetShowSignal > targetShowSignalRef.current;
    targetShowSignalRef.current = targetShowSignal;

    if (!hasNewSignal) return;

    spawnShape(app, true);
  }, [isActive, isAppReady, targetShowSignal, targetShape, targetColor]);

  useEffect(() => {
    if (!isAppReady || !globalPixiApp) return;

    const app = globalPixiApp;
    const tickerUpdate = () => {
      if (!globalPixiApp || globalPixiApp.renderer?.destroyed || globalPixiApp.stage?.destroyed) return;
      if (!isAppUsable(app)) return;

      const deltaMs = app.ticker.deltaMS;
      animationTimeRef.current += deltaMs;

      const parallax = parallaxRef.current;
      if (parallax) {
        parallax.time += deltaMs;
        const depthShift = Math.sin(parallax.time * 0.0003) * 8;
        parallax.grid.position.set(depthShift * 0.6, depthShift * 0.4);
        parallax.orbs.forEach((orb, idx) => {
          const t = parallax.time * (0.00015 + idx * 0.00005);
          orb.position.x += Math.cos(t + idx) * 0.08;
          orb.position.y += Math.sin(t * 1.1 + idx) * 0.08;
          orb.alpha = 0.18 + Math.sin(t * 1.5 + idx) * 0.05;
        });
      }

      shapesRef.current.forEach(shape => {
        const graphics = shape.graphics;
        graphics.rotation += shape.rotationSpeed * deltaMs;
        const pulse = 1 + Math.sin(animationTimeRef.current * shape.pulseSpeed + shape.pulseOffset) * 0.08;
        graphics.scale.set(shape.baseScale * pulse);

        if (shape.fadeMode === 'in') {
          shape.fadeElapsed += deltaMs;
          const progress = clamp(shape.fadeElapsed / shape.fadeDuration, 0, 1);
          graphics.alpha = progress;
          if (progress >= 1) {
            shape.fadeMode = 'steady';
            if (shape.isTarget && !hasNotifiedTargetRef.current) {
              hasNotifiedTargetRef.current = true;
              onTargetAppeared();
              currentTargetRef.current = shape;
            }
          }
        } else if (shape.fadeMode === 'out') {
          shape.fadeElapsed += deltaMs;
          const progress = clamp(1 - shape.fadeElapsed / shape.fadeDuration, 0, 1);
          graphics.alpha = progress;
          if (progress <= 0) {
            shape.onFadeComplete?.();
          }
        }
      });
    };

    app.ticker.add(tickerUpdate);

    return () => {
      app.ticker.remove(tickerUpdate);
    };
  }, [isAppReady, onTargetAppeared]);

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

  const drawGlowingSphere = (graphics: PIXI.Graphics, color: number, size: number) => {
    const outerGlow = lighten(color, 0.3);
    const innerGlow = lighten(color, 0.5);
    const rim = lighten(color, 0.7);

    graphics.clear();
    graphics.circle(0, 0, size * 1.35).fill({ color, alpha: 0.16 });
    graphics.circle(0, 0, size * 1.05).fill({ color: outerGlow, alpha: 0.4 });
    graphics.circle(0, 0, size * 0.85).fill({ color: color, alpha: 0.8 });
    graphics.circle(-size * 0.15, -size * 0.2, size * 0.55).fill({ color: innerGlow, alpha: 0.9 });
    graphics.circle(size * 0.25, size * 0.2, size * 0.2).fill({ color: 0xffffff, alpha: 0.35 });
    graphics.circle(size * 0.4, -size * 0.35, size * 0.15).fill({ color: 0xffffff, alpha: 0.25 });
    graphics.circle(0, 0, size).stroke({ color: rim, width: 2, alpha: 0.7 });
  };

  const drawCube = (graphics: PIXI.Graphics, color: number, size: number) => {
    const topColor = lighten(color, 0.15);
    const frontColor = darken(color, 0.1);
    const sideColor = darken(color, 0.2);
    const offset = size * 0.65;

    const frontTopLeft = { x: -size, y: -size + offset };
    const frontTopRight = { x: size, y: -size + offset };
    const frontBottomRight = { x: size, y: size + offset };
    const frontBottomLeft = { x: -size, y: size + offset };

    const depth = { x: offset, y: -offset };

    const topBackLeft = { x: frontTopLeft.x + depth.x, y: frontTopLeft.y + depth.y };
    const topBackRight = { x: frontTopRight.x + depth.x, y: frontTopRight.y + depth.y };
    const backBottomRight = { x: frontBottomRight.x + depth.x, y: frontBottomRight.y + depth.y };
    const backBottomLeft = { x: frontBottomLeft.x + depth.x, y: frontBottomLeft.y + depth.y };

    graphics.clear();

    // Top face
    graphics
      .moveTo(frontTopLeft.x, frontTopLeft.y)
      .lineTo(frontTopRight.x, frontTopRight.y)
      .lineTo(topBackRight.x, topBackRight.y)
      .lineTo(topBackLeft.x, topBackLeft.y)
      .closePath()
      .fill({ color: topColor, alpha: 0.95 });

    // Right face
    graphics
      .moveTo(frontTopRight.x, frontTopRight.y)
      .lineTo(frontBottomRight.x, frontBottomRight.y)
      .lineTo(backBottomRight.x, backBottomRight.y)
      .lineTo(topBackRight.x, topBackRight.y)
      .closePath()
      .fill({ color: sideColor, alpha: 0.9 });

    // Left face (slightly translucent to hint depth)
    graphics
      .moveTo(frontTopLeft.x, frontTopLeft.y)
      .lineTo(frontBottomLeft.x, frontBottomLeft.y)
      .lineTo(backBottomLeft.x, backBottomLeft.y)
      .lineTo(topBackLeft.x, topBackLeft.y)
      .closePath()
      .fill({ color: darken(color, 0.25), alpha: 0.4 });

    // Front face
    graphics
      .moveTo(frontBottomLeft.x, frontBottomLeft.y)
      .lineTo(frontBottomRight.x, frontBottomRight.y)
      .lineTo(frontTopRight.x, frontTopRight.y)
      .lineTo(frontTopLeft.x, frontTopLeft.y)
      .closePath()
      .fill({ color: frontColor, alpha: 0.95 });

    // Underside glow to suggest the hidden base
    graphics
      .moveTo(frontBottomLeft.x, frontBottomLeft.y)
      .lineTo(backBottomLeft.x, backBottomLeft.y)
      .lineTo(backBottomRight.x, backBottomRight.y)
      .lineTo(frontBottomRight.x, frontBottomRight.y)
      .closePath()
      .fill({ color: darken(color, 0.35), alpha: 0.25 });

    graphics
      .stroke({ color: lighten(color, 0.5), width: 1.6, alpha: 0.8 })
      .moveTo(frontTopLeft.x, frontTopLeft.y)
      .lineTo(topBackLeft.x, topBackLeft.y)
      .lineTo(topBackRight.x, topBackRight.y)
      .lineTo(frontTopRight.x, frontTopRight.y)
      .lineTo(frontTopLeft.x, frontTopLeft.y)
      .moveTo(frontBottomLeft.x, frontBottomLeft.y)
      .lineTo(frontTopLeft.x, frontTopLeft.y)
      .moveTo(frontBottomRight.x, frontBottomRight.y)
      .lineTo(frontTopRight.x, frontTopRight.y)
      .moveTo(frontBottomRight.x, frontBottomRight.y)
      .lineTo(backBottomRight.x, backBottomRight.y)
      .lineTo(topBackRight.x, topBackRight.y)
      .moveTo(frontBottomLeft.x, frontBottomLeft.y)
      .lineTo(backBottomLeft.x, backBottomLeft.y)
      .lineTo(topBackLeft.x, topBackLeft.y)
      .moveTo(backBottomLeft.x, backBottomLeft.y)
      .lineTo(backBottomRight.x, backBottomRight.y)
      .stroke();
  };

  const drawPyramid = (graphics: PIXI.Graphics, color: number, size: number) => {
    const topColor = lighten(color, 0.2);
    const midColor = color;
    const darkColor = darken(color, 0.15);
    const height = size * 1.6;
    const half = size * 0.9;

    graphics.clear();
    graphics.moveTo(0, -height).lineTo(-half, half).lineTo(half, half).closePath().fill({ color: midColor, alpha: 0.9 });
    graphics.moveTo(0, -height).lineTo(half, half).lineTo(size * 1.2, half * 0.8).closePath().fill({ color: topColor, alpha: 0.85 });
    graphics.moveTo(0, -height).lineTo(-half, half).lineTo(-size * 1.2, half * 0.8).closePath().fill({ color: darkColor, alpha: 0.85 });
    graphics.moveTo(-size, half * 0.9).lineTo(size, half * 0.9).lineTo(0, height * 0.45).closePath().fill({ color: darken(color, 0.3), alpha: 0.5 });
    graphics.stroke({ color: lighten(color, 0.35), width: 1.5, alpha: 0.7 });
  };

  // Create shape graphics
  const createShape = (type: 'circle' | 'square' | 'triangle', color: number, x: number, y: number, size: number): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();

    if (type === 'circle') {
      drawGlowingSphere(graphics, color, size);
    } else if (type === 'square') {
      drawCube(graphics, color, size);
    } else if (type === 'triangle') {
      drawPyramid(graphics, color, size);
    }

    graphics.x = x;
    graphics.y = y;
    graphics.pivot.set(0, 0);

    return graphics;
  };

  const doesOverlap = (x: number, y: number, size: number) => {
    return shapesRef.current.some(s => {
      const dx = s.graphics.x - x;
      const dy = s.graphics.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (size * 4); // minimum separation
    });
  };

  // Spawn random shapes
  const spawnShape = (app: PIXI.Application, shouldBeTarget: boolean = false) => {
    if (!isAppUsable(app)) return;

    const { shape: currentTargetShape, colorNumber: targetColorNumber } = targetPropsRef.current;

    // Responsive random size – podobné na desktope, menšie na mobile
    const width = app.renderer.width;
    const height = app.renderer.height;
    const minDim = Math.min(width, height);

    // základná škála podľa veľkosti plátna
    let scale = 1;

    // veľmi malé displeje (telefóny)
    if (minDim < 500) {
      scale = 0.6;
    } else if (minDim < 800) {
      // menšie tablety / menšie notebooky
      scale = 0.8;
    } else {
      // desktop a väčšie obrazovky – ponechaj skoro pôvodnú veľkosť
      scale = 1;
    }

    const baseMin = 8 * scale;
    const baseRange = 14 * scale;
    const size = baseMin + Math.random() * baseRange;

    // Random position with padding
    const padding = 80;
    let x = 0, y = 0, attempts = 0;
    do {
      x = padding + Math.random() * (width - padding * 2);
      y = padding + Math.random() * (height - padding * 2);
      attempts++;
      if (attempts > 15) break; // fallback to avoid infinite loop
    } while (doesOverlap(x, y, size));

    let type: 'circle' | 'square' | 'triangle';
    let color: number;

    if (shouldBeTarget) {
      type = currentTargetShape;
      color = targetColorNumber;
    } else {
      // Distractors must not match the target combination
      const shapeTypes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
      const availableColors = colorArray.filter(c => c !== targetColorNumber);

      type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      color = availableColors[Math.floor(Math.random() * availableColors.length)] ?? targetColorNumber;

      // If colors overlap for any reason, ensure the shape differs from the target
      if (color === targetColorNumber && type === currentTargetShape) {
        const alternativeTypes = shapeTypes.filter(shape => shape !== currentTargetShape);
        type = alternativeTypes[Math.floor(Math.random() * alternativeTypes.length)] ?? type;
      }
    }

    const graphics = createShape(type, color, x, y, size);
    const parent = shapesContainerRef.current || app.stage;
    if (!parent || ('destroyed' in parent && (parent as any).destroyed)) return;

    graphics.alpha = 0;
    parent.addChild(graphics);

    const shape: Shape = {
      graphics,
      type,
      color,
      isTarget: shouldBeTarget,
      rotationSpeed: 0.0006 + Math.random() * 0.001,
      pulseSpeed: 0.002 + Math.random() * 0.0015,
      pulseOffset: Math.random() * Math.PI * 2,
      baseScale: 0.95 + Math.random() * 0.15,
      fadeMode: 'in',
      fadeDuration: shouldBeTarget ? 50 : 300,
      fadeElapsed: 0,
    };

    shapesRef.current.push(shape);

    const beginFadeOut = () => {
      if (!isAppUsable(app)) return;
      if (shape.fadeMode === 'out') return;
      if (shape.fadeTimeout) {
        window.clearTimeout(shape.fadeTimeout);
        shape.fadeTimeout = undefined;
      }
      shape.fadeMode = 'out';
      shape.fadeElapsed = 0;
      shape.fadeDuration = 600;
      shape.onFadeComplete = () => {
        if (!isAppUsable(app)) return;
        const resolvedParent = shapesContainerRef.current || app.stage;
        if (resolvedParent && (!('destroyed' in resolvedParent) || !(resolvedParent as any).destroyed)) {
          resolvedParent.removeChild(graphics);
        }
        shapesRef.current = shapesRef.current.filter(s => s !== shape);

        if (shouldBeTarget) {
          if (hasNotifiedTargetRef.current && onTargetDisappeared) {
            hasNotifiedTargetRef.current = false;
            onTargetDisappeared();
            currentTargetRef.current = null;
          }
        }
      };
    };

    const fadeTimeoutDuration = shouldBeTarget ? 7000 : 3200 + Math.random() * 2600;
    shape.fadeTimeout = window.setTimeout(() => {
      if (!isAppUsable(app)) return;
      beginFadeOut();
    }, fadeTimeoutDuration);
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