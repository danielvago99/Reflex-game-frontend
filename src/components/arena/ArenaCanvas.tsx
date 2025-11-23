import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ArenaCanvasProps {
  isActive: boolean;
  targetShape: 'circle' | 'square' | 'triangle';
  targetColor: string;
  onTargetAppeared: () => void;
  onTargetDisappeared?: () => void;
}

type ShapeType = 'circle' | 'square' | 'triangle';

interface ArenaShape {
  id: string;
  type: ShapeType;
  color: string;
  isTarget: boolean;
  position: [number, number, number];
  rotationSpeed: [number, number, number];
  floatSpeed: number;
  floatOffset: number;
  createdAt: number;
  removing: boolean;
  removeStartedAt?: number;
}

const FADE_IN_MS = 320;
const FADE_OUT_MS = 420;

const neonPalette = [
  '#22d3ee',
  '#a855f7',
  '#fb7185',
  '#22c55e',
  '#f97316',
  '#38bdf8',
  '#facc15',
  '#67e8f9',
];

function randomPosition() {
  const x = (Math.random() - 0.5) * 7;
  const y = (Math.random() - 0.5) * 4;
  const z = -4 - Math.random() * 2.5;
  return [x, y, z] as [number, number, number];
}

function randomRotationSpeed() {
  return [
    0.4 + Math.random() * 0.4,
    0.4 + Math.random() * 0.4,
    0.2 + Math.random() * 0.3,
  ] as [number, number, number];
}

function shapeGeometry(type: ShapeType) {
  switch (type) {
    case 'circle':
      return new THREE.SphereGeometry(0.5, 24, 24);
    case 'square':
      return new THREE.BoxGeometry(0.8, 0.8, 0.8);
    case 'triangle':
    default:
      const pyramid = new THREE.ConeGeometry(0.75, 1.1, 4);
      pyramid.rotateY(Math.PI / 4);
      return pyramid;
  }
}

interface HolographicShapeProps {
  shape: ArenaShape;
  geometries: Record<ShapeType, THREE.BufferGeometry>;
}

function HolographicShape({ shape, geometries }: HolographicShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    mesh.rotation.x += shape.rotationSpeed[0] * delta;
    mesh.rotation.y += shape.rotationSpeed[1] * delta;
    mesh.rotation.z += shape.rotationSpeed[2] * delta;

    const floatY = Math.sin(clock.elapsedTime * shape.floatSpeed + shape.floatOffset) * 0.25;
    mesh.position.y = shape.position[1] + floatY;

    const now = performance.now();
    const age = now - shape.createdAt;
    let opacity = 1;

    if (age < FADE_IN_MS) {
      opacity = Math.min(age / FADE_IN_MS, 1);
    }

    if (shape.removing && shape.removeStartedAt) {
      const fadeProgress = Math.min((now - shape.removeStartedAt) / FADE_OUT_MS, 1);
      opacity = Math.max(0, 1 - fadeProgress);
    }

    material.opacity = Math.min(0.95, opacity);
  });

  return (
    <mesh
      ref={meshRef}
      position={shape.position}
      geometry={geometries[shape.type]}
      castShadow={false}
      receiveShadow={false}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={shape.color}
        emissive={new THREE.Color(shape.color).multiplyScalar(0.6)}
        metalness={0.1}
        roughness={0.2}
        transparent
        opacity={0}
        depthWrite={false}
      />
      <lineSegments>
        <edgesGeometry args={[geometries[shape.type]]} />
        <lineBasicMaterial color="#ffffff" opacity={0.18} transparent />
      </lineSegments>
    </mesh>
  );
}

export function ArenaCanvas({ isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared }: ArenaCanvasProps) {
  const [shapes, setShapes] = useState<ArenaShape[]>([]);
  const hasNotifiedTargetRef = useRef(false);
  const targetTimerRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<number | null>(null);
  const removalTimersRef = useRef(new Map<string, number>());
  const fadeTimersRef = useRef(new Map<string, number>());
  const isActiveRef = useRef(isActive);
  const targetSpawnCountRef = useRef(0);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const geometries = useMemo(() => {
    const sphere = shapeGeometry('circle');
    const box = shapeGeometry('square');
    const pyramid = shapeGeometry('triangle');

    return { circle: sphere, square: box, triangle: pyramid };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geom) => geom.dispose());
    };
  }, [geometries]);

  const clearTimers = () => {
    if (targetTimerRef.current) {
      window.clearTimeout(targetTimerRef.current);
      targetTimerRef.current = null;
    }

    if (spawnIntervalRef.current) {
      window.clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    removalTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    removalTimersRef.current.clear();

    fadeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    fadeTimersRef.current.clear();
  };

  const removeShapeImmediately = (id: string, wasTarget: boolean) => {
    setShapes((prev) => {
      const next = prev.filter((shape) => shape.id !== id);
      return next;
    });

    removalTimersRef.current.delete(id);
    fadeTimersRef.current.delete(id);

    if (wasTarget) {
      if (hasNotifiedTargetRef.current && onTargetDisappeared) {
        hasNotifiedTargetRef.current = false;
        onTargetDisappeared();
      }
      if (isActiveRef.current && targetSpawnCountRef.current < 2) {
        targetSpawnCountRef.current += 1;
        const retryDelay = 800 + Math.random() * 700;
        targetTimerRef.current = window.setTimeout(() => spawnShape(true), retryDelay);
      }
    }
  };

  const beginShapeRemoval = (id: string, wasTarget: boolean) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === id ? { ...shape, removing: true, removeStartedAt: performance.now() } : shape))
    );

    const fadeTimer = window.setTimeout(() => removeShapeImmediately(id, wasTarget), FADE_OUT_MS + 16);
    fadeTimersRef.current.set(id, fadeTimer);
  };

  const spawnShape = (shouldBeTarget = false) => {
    if (!isActiveRef.current) return;

    let type: ShapeType;
    let color: string;

    if (shouldBeTarget) {
      type = targetShape;
      color = targetColor;
    } else {
      const options: ShapeType[] = ['circle', 'square', 'triangle'];
      type = options[Math.floor(Math.random() * options.length)];

      const availableColors = neonPalette.filter((c) => c.toLowerCase() !== targetColor.toLowerCase());
      color = availableColors[Math.floor(Math.random() * availableColors.length)] || neonPalette[0];

      if (type === targetShape && color.toLowerCase() === targetColor.toLowerCase()) {
        color = neonPalette.find((c) => c.toLowerCase() !== targetColor.toLowerCase()) || neonPalette[1];
      }
    }

    const shape: ArenaShape = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      color,
      isTarget: shouldBeTarget,
      position: randomPosition(),
      rotationSpeed: randomRotationSpeed(),
      floatSpeed: 0.8 + Math.random() * 0.6,
      floatOffset: Math.random() * Math.PI * 2,
      createdAt: performance.now(),
      removing: false,
    };

    setShapes((prev) => [...prev, shape]);

    const lifetime = 2000 + Math.random() * 1800;
    const removalTimer = window.setTimeout(() => beginShapeRemoval(shape.id, shouldBeTarget), lifetime);
    removalTimersRef.current.set(shape.id, removalTimer);

    if (shouldBeTarget && !hasNotifiedTargetRef.current) {
      hasNotifiedTargetRef.current = true;
      onTargetAppeared();
    }
  };

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      setShapes([]);
      hasNotifiedTargetRef.current = false;
      targetSpawnCountRef.current = 0;
      return;
    }

    hasNotifiedTargetRef.current = false;
    targetSpawnCountRef.current = 0;
    setShapes([]);

    for (let i = 0; i < 15; i += 1) {
      const delay = i * 70;
      window.setTimeout(() => spawnShape(false), delay);
    }

    const targetDelay = 900 + Math.random() * 1200;
    targetTimerRef.current = window.setTimeout(() => {
      targetSpawnCountRef.current += 1;
      spawnShape(true);
    }, targetDelay);

    const spawnInterval = window.setInterval(() => {
      if (Math.random() > 0.3) {
        spawnShape(false);
      }
    }, 520);
    spawnIntervalRef.current = spawnInterval;

    return () => {
      clearTimers();
      setShapes([]);
      hasNotifiedTargetRef.current = false;
      targetSpawnCountRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, targetShape, targetColor]);

  return (
    <div className="relative w-full h-full max-w-4xl mx-auto">
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />

      <div
        className="relative bg-black/40 backdrop-blur-lg border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px] md:min-h-[500px]"
      >
        <Canvas
          className="absolute inset-0"
          dpr={[1, 1.5]}
          flat
          shadows={false}
          camera={{ position: [0, 0, 8], fov: 55 }}
        >
          <color attach="background" args={[new THREE.Color('black')]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[2.5, 3, 2]} intensity={1.2} />

          <group position={[0, 0, 0]}>
            {shapes.map((shape) => (
              <HolographicShape key={shape.id} shape={shape} geometries={geometries} />
            ))}
          </group>

          <EffectComposer multisampling={0}>
            <Bloom intensity={0.35} luminanceThreshold={0} luminanceSmoothing={0.85} mipmapBlur radius={0.35} />
          </EffectComposer>

          <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 4} />
        </Canvas>

        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none z-10" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-pink-400/50 pointer-events-none z-10" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none z-10" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-pink-400/50 pointer-events-none z-10" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line" />
        </div>

        <div
          className="absolute inset-0 opacity-5 pointer-events-none z-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>
    </div>
  );
}
