import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing';
import type { Mesh } from 'three';

type ShapeType = 'circle' | 'square' | 'triangle';

type ArenaCanvasProps = {
  isActive: boolean;
  targetShape: ShapeType;
  targetColor: string;
  onTargetAppeared: () => void;
  onTargetDisappeared?: () => void;
};

type ArenaShape = {
  id: number;
  type: ShapeType;
  color: string;
  position: [number, number, number];
  rotationSpeed: [number, number];
  scale: number;
};

type TargetState = ArenaShape & { isVisible: boolean };

const BASE_COLORS = [
  '#06B6D4',
  '#22D3EE',
  '#FF0066',
  '#22C55E',
  '#F97316',
  '#A855F7',
  '#EAB308',
  '#3B82F6',
];

const ARENA_RADIUS = 3.6;

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

function createShapeData(
  id: number,
  targetShape: ShapeType,
  targetColor: string,
  decoyCount: number
): ArenaShape[] {
  const result: ArenaShape[] = [];

  for (let i = 0; i < decoyCount; i += 1) {
    const type: ShapeType = (['circle', 'square', 'triangle'] as const)[
      Math.floor(Math.random() * 3)
    ];
    let color = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];

    if (type === targetShape && color === targetColor) {
      color = BASE_COLORS.find(c => c !== targetColor) || '#22D3EE';
    }

    const angle = (Math.PI * 2 * i) / decoyCount + Math.random() * 0.5;
    const radius = ARENA_RADIUS * 0.45 + Math.random() * ARENA_RADIUS * 0.45;

    result.push({
      id: id + i,
      type,
      color,
      position: [Math.cos(angle) * radius, randomInRange(-0.4, 0.4), Math.sin(angle) * radius],
      rotationSpeed: [randomInRange(0.25, 0.6), randomInRange(0.35, 0.75)],
      scale: randomInRange(0.55, 0.95),
    });
  }

  return result;
}

function createTargetState(targetShape: ShapeType, targetColor: string): TargetState {
  const angle = randomInRange(0, Math.PI * 2);
  const radius = ARENA_RADIUS * randomInRange(0.15, 0.35);

  return {
    id: Date.now(),
    type: targetShape,
    color: targetColor,
    position: [Math.cos(angle) * radius, randomInRange(0.1, 0.5), Math.sin(angle) * radius],
    rotationSpeed: [randomInRange(0.45, 0.8), randomInRange(0.55, 1)],
    scale: randomInRange(0.8, 1.15),
    isVisible: false,
  };
}

function ShapeMesh({ data, isActive }: { data: ArenaShape; isActive: boolean }) {
  const meshRef = useRef<Mesh | null>(null);

  useFrame((_, delta) => {
    if (!isActive || !meshRef.current) return;

    meshRef.current.rotation.x += delta * data.rotationSpeed[0];
    meshRef.current.rotation.y += delta * data.rotationSpeed[1];
  });

  return (
    <mesh ref={meshRef} position={data.position} scale={data.scale}>
      {data.type === 'circle' && <sphereGeometry args={[0.35, 16, 12]} />}
      {data.type === 'square' && <boxGeometry args={[0.7, 0.7, 0.7]} />}
      {data.type === 'triangle' && <coneGeometry args={[0.5, 0.9, 3]} />}
      <meshStandardMaterial
        color={data.color}
        emissive={data.color}
        emissiveIntensity={0.35}
        roughness={0.35}
        metalness={0.05}
      />
    </mesh>
  );
}

function TargetMesh({ data, isActive }: { data: TargetState; isActive: boolean }) {
  const meshRef = useRef<Mesh | null>(null);

  useFrame((_, delta) => {
    if (!isActive || !meshRef.current) return;

    meshRef.current.rotation.x += delta * data.rotationSpeed[0];
    meshRef.current.rotation.y += delta * data.rotationSpeed[1];
  });

  return (
    <mesh ref={meshRef} position={data.position} scale={data.scale * 1.25}>
      {data.type === 'circle' && <sphereGeometry args={[0.5, 20, 14]} />}
      {data.type === 'square' && <boxGeometry args={[0.9, 0.9, 0.9]} />}
      {data.type === 'triangle' && <coneGeometry args={[0.65, 1.1, 3]} />}
      <meshStandardMaterial
        color={data.color}
        emissive={data.color}
        emissiveIntensity={0.7}
        roughness={0.25}
        metalness={0.08}
      />
    </mesh>
  );
}

function ArenaScene({
  isActive,
  targetState,
  decoys,
  lowPerfMode,
}: {
  isActive: boolean;
  targetState: TargetState | null;
  decoys: ArenaShape[];
  lowPerfMode: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#050710"]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 4, 2]} intensity={1.8} distance={12} decay={2} color="#22D3EE" />
      <pointLight position={[-4, 3, -2]} intensity={1.4} distance={10} decay={2} color="#A855F7" />
      <pointLight position={[0, 5, 0]} intensity={0.7} distance={14} decay={2} color="#FF2D55" />

      <mesh rotation-x={-Math.PI / 2} position={[0, -1.1, 0]}>
        <cylinderGeometry args={[ARENA_RADIUS * 0.25, ARENA_RADIUS, 0.35, 24, 1, true]} />
        <meshStandardMaterial
          color="#0B1024"
          emissive="#111827"
          emissiveIntensity={0.4}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, -1.05, 0]}>
        <circleGeometry args={[ARENA_RADIUS * 0.9, 48]} />
        <meshStandardMaterial
          color="#0B1222"
          emissive="#0EA5E9"
          emissiveIntensity={0.15}
          roughness={1}
          metalness={0.02}
        />
      </mesh>

      {decoys.map(shape => (
        <ShapeMesh key={shape.id} data={shape} isActive={isActive} />
      ))}

      {targetState && targetState.isVisible && (
        <TargetMesh data={targetState} isActive={isActive} />
      )}

      <EffectComposer multisampling={0} enabled={!lowPerfMode && isActive}>
        <Bloom luminanceThreshold={0.22} luminanceSmoothing={0.78} intensity={0.32} radius={0.55} />
        {!lowPerfMode && <Noise premultiply opacity={0.06} />}
      </EffectComposer>
    </>
  );
}

export function ArenaCanvas({
  isActive,
  targetShape,
  targetColor,
  onTargetAppeared,
  onTargetDisappeared,
}: ArenaCanvasProps) {
  const isActiveRef = useRef(isActive);
  const [targetState, setTargetState] = useState<TargetState | null>(null);
  const [targetVisible, setTargetVisible] = useState(false);
  const [shapeSeed, setShapeSeed] = useState(() => Math.random());
  const appearTimerRef = useRef<number | null>(null);
  const disappearTimerRef = useRef<number | null>(null);
  const targetSpawnCountRef = useRef(0);
  const hasNotifiedRef = useRef(false);

  const lowPerfMode = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 520, []);
  const decoyCount = lowPerfMode ? 10 : 15;

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const decoys = useMemo(
    () => createShapeData(Math.floor(shapeSeed * 10000), targetShape, targetColor, decoyCount),
    [shapeSeed, targetShape, targetColor, decoyCount]
  );

  useEffect(() => {
    return () => {
      if (appearTimerRef.current !== null) window.clearTimeout(appearTimerRef.current);
      if (disappearTimerRef.current !== null) window.clearTimeout(disappearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (appearTimerRef.current !== null) window.clearTimeout(appearTimerRef.current);
    if (disappearTimerRef.current !== null) window.clearTimeout(disappearTimerRef.current);

    if (hasNotifiedRef.current && onTargetDisappeared) {
      hasNotifiedRef.current = false;
      onTargetDisappeared();
    }

    targetSpawnCountRef.current = 0;
    hasNotifiedRef.current = false;
    setTargetVisible(false);
    setTargetState(null);

    if (!isActive) {
      return;
    }

    const scheduleTarget = () => {
      const delay = 1000 + Math.random() * 1500;
      appearTimerRef.current = window.setTimeout(() => {
        if (!isActiveRef.current) return;

        targetSpawnCountRef.current += 1;
        setTargetState(createTargetState(targetShape, targetColor));
        setTargetVisible(true);

        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          onTargetAppeared();
        }

        const visibleDuration = 2200 + Math.random() * 1300;
        disappearTimerRef.current = window.setTimeout(() => {
          setTargetVisible(false);

          if (hasNotifiedRef.current && onTargetDisappeared) {
            hasNotifiedRef.current = false;
            onTargetDisappeared();
          }

          if (isActiveRef.current && targetSpawnCountRef.current < 2) {
            scheduleTarget();
          }
        }, visibleDuration);
      }, delay);
    };

    scheduleTarget();
    setShapeSeed(Math.random());

    return () => {
      if (appearTimerRef.current !== null) window.clearTimeout(appearTimerRef.current);
      if (disappearTimerRef.current !== null) window.clearTimeout(disappearTimerRef.current);
    };
  }, [isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared]);

  useEffect(() => {
    setTargetState(prev => (prev ? { ...prev, isVisible: targetVisible } : null));
  }, [targetVisible]);

  return (
    <div className="relative w-full h-full max-w-4xl mx-auto">
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>

      <div className="relative bg-black/40 backdrop-blur-lg border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px] md:min-h-[500px]">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none z-10"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-pink-400/50 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-pink-400/50 pointer-events-none z-10"></div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line"></div>
        </div>

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

        <Canvas
          className="w-full h-full"
          dpr={[1, 1.5]}
          camera={{ position: [0, 2.7, 7], fov: 55, near: 0.1, far: 30 }}
          gl={{ antialias: true, toneMappingExposure: 1.2 }}
        >
          <ArenaScene
            isActive={isActive}
            targetState={targetState}
            decoys={decoys}
            lowPerfMode={lowPerfMode}
          />
        </Canvas>
      </div>
    </div>
  );
}
