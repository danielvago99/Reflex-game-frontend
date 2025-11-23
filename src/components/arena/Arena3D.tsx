import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Glitch, Noise } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { Float, Grid, Stars, Text, Trail } from '@react-three/drei';
import * as THREE from 'three';
import type { Vector3 } from '@react-three/fiber';

type TargetShape = 'circle' | 'square' | 'triangle';

interface Arena3DProps {
  isActive: boolean;
  targetShape: TargetShape;
  targetColor: string;
  onTargetAppeared: () => void;
  onTargetDisappeared?: () => void;
  onHit?: () => void;
  onMiss?: () => void;
  round?: number;
  totalRounds?: number;
}

interface TargetInstance {
  id: number;
  position: THREE.Vector3;
  scale: number;
}

const neonPalette = ['#00f5ff', '#7c3aed', '#f97316', '#22d3ee', '#ff00b8'];

const useMobile = () => {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(window.innerWidth < 640);
  }, []);
  return mobile;
};

const useGridMaterial = (color: string) =>
  useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    });
    return material;
  }, [color]);

const FloatingCameraHint = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.z = Math.sin(clock.elapsedTime * 0.35) * 0.2;
    group.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.05;
    invalidate();
  });
  return (
    <group ref={groupRef} position={[0, 1.7, -2.3]}>
      <Trail width={0.08} color={new THREE.Color('#22d3ee')} length={6} decay={0.9} attenuation={(t) => t * t}>
        <mesh>
          <torusGeometry args={[0.14, 0.018, 8, 32]} />
          <meshBasicMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </Trail>
      <Text
        fontSize={0.14}
        position={[0, 0.25, 0]}
        color="#b5e8ff"
        outlineWidth={0.005}
        outlineColor="#0ea5e9"
        anchorX="center"
      >
        Move to target
      </Text>
    </group>
  );
};

const NeonGrid = ({ color }: { color: string }) => {
  const material = useGridMaterial(color);
  const { invalidate } = useThree();
  useFrame(({ clock }) => {
    material.opacity = 0.25 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
    invalidate();
  });
  return (
    <Grid
      args={[30, 30]}
      cellSize={0.6}
      cellThickness={0.35}
      sectionSize={3}
      sectionThickness={0.75}
      sectionColor={color}
      cellColor={color}
      position={[0, -1.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      infinite
      fadeDistance={30}
      fadeStrength={2}
      material={material}
    />
  );
};

const FloatingPlatform = ({ position, color, speed = 1 }: { position: Vector3; color: string; speed?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { invalidate } = useThree();
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime * speed;
    mesh.position.y = position[1] + Math.sin(t) * 0.08;
    mesh.rotation.y = Math.sin(t * 0.6) * 0.1;
    invalidate();
  });
  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3} position={position}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.08, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          metalness={0.2}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
};

const TargetShapeMesh = ({
  shape,
  color,
  onPointerDown,
}: {
  shape: TargetShape;
  color: string;
  onPointerDown: () => void;
}) => {
  const geometry = useMemo(() => {
    switch (shape) {
      case 'square':
        return new THREE.BoxGeometry(0.4, 0.4, 0.4, 16, 16, 16);
      case 'triangle':
        return new THREE.ConeGeometry(0.35, 0.5, 3, 1);
      default:
        return new THREE.SphereGeometry(0.3, 24, 16);
    }
  }, [shape]);

  return (
    <mesh geometry={geometry} onPointerDown={onPointerDown}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.6}
        roughness={0.3}
        metalness={0.15}
        toneMapped={false}
      />
    </mesh>
  );
};

const Target = ({
  target,
  color,
  shape,
  onHit,
}: {
  target: TargetInstance;
  color: string;
  shape: TargetShape;
  onHit: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime;
    group.position.y = target.position.y + Math.sin(t * 2) * 0.08;
    group.rotation.y += 0.8 * (1 / 60);
    group.scale.setScalar(target.scale + Math.sin(t * 3) * 0.05);
    invalidate();
  });

  return (
    <group ref={groupRef} position={target.position.toArray()}>
      <Float speed={2.1} floatIntensity={0.8} rotationIntensity={0.4}>
        <TargetShapeMesh shape={shape} color={color} onPointerDown={onHit} />
      </Float>
      <pointLight color={color} intensity={4} distance={3} decay={2} />
    </group>
  );
};

const ArenaScene = ({
  target,
  color,
  shape,
  onHit,
  round,
  totalRounds,
}: {
  target: TargetInstance | null;
  color: string;
  shape: TargetShape;
  onHit: () => void;
  round?: number;
  totalRounds?: number;
}) => (
  <>
    <color attach="background" args={[0.02, 0.01, 0.08]} />
    <ambientLight intensity={0.7} color="#a2d9ff" />
    <pointLight position={[2, 3.5, 2]} intensity={2} color="#7c3aed" decay={1.5} />
    <pointLight position={[-2.5, 2.8, -2.5]} intensity={1.8} color="#22d3ee" decay={1.4} />

    <Stars radius={24} depth={40} count={4000} factor={2.8} saturation={0.8} fade speed={0.6} />
    <NeonGrid color="#0ea5e9" />

    <FloatingPlatform position={[-1.4, -0.35, -0.6]} color="#7c3aed" speed={0.6} />
    <FloatingPlatform position={[1.6, -0.25, 0.7]} color="#22d3ee" speed={0.8} />

    {target && <Target target={target} color={color} shape={shape} onHit={onHit} />}

    <Float speed={1.4} floatIntensity={0.3} rotationIntensity={0.15} position={[0, 1.9, 0]}>
      <Text fontSize={0.24} color="#cbd5ff" outlineWidth={0.006} outlineColor="#7c3aed" anchorX="center" anchorY="middle">
        Round {round ?? 1}/{totalRounds ?? 7}
      </Text>
    </Float>

    <FloatingCameraHint />
  </>
);

const ArenaEffects = () => (
  <EffectComposer multisampling={0}> 
    <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.55} intensity={0.9} mipmapBlur />
    <Glitch delay={new THREE.Vector2(5, 12)} duration={new THREE.Vector2(0.25, 0.5)} strength={new THREE.Vector2(0.01, 0.03)} mode={GlitchMode.CONSTANT_MILD} activeModes={[GlitchMode.CONSTANT_MILD]} />
    <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.15} />
  </EffectComposer>
);

const Arena3DInner = forwardRef<HTMLCanvasElement, Arena3DProps>(
  ({ isActive, targetShape, targetColor, onTargetAppeared, onTargetDisappeared, onHit, onMiss, round = 1, totalRounds = 7 }, ref) => {
    const isMobile = useMobile();
    const [currentTarget, setCurrentTarget] = useState<TargetInstance | null>(null);
    const spawnTimeoutRef = useRef<number | null>(null);
    const activeRef = useRef(isActive);

    useEffect(() => {
      activeRef.current = isActive;
    }, [isActive]);

    const clearTimers = () => {
      if (spawnTimeoutRef.current) {
        window.clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
      }
    };

    const scheduleSpawn = () => {
      clearTimers();
      const delay = 900 + Math.random() * 1100;
      spawnTimeoutRef.current = window.setTimeout(() => {
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 2.4,
          -0.2 + Math.random() * 1.2,
          (Math.random() - 0.5) * 2.2
        );
        const instance: TargetInstance = {
          id: performance.now(),
          position,
          scale: 1 + Math.random() * 0.2,
        };
        setCurrentTarget(instance);
        onTargetAppeared();

        const disappearDelay = 2000 + Math.random() * 1800;
        spawnTimeoutRef.current = window.setTimeout(() => {
          setCurrentTarget(null);
          onTargetDisappeared?.();
          onMiss?.();
          if (activeRef.current) {
            scheduleSpawn();
          }
        }, disappearDelay);
      }, delay);
    };

    useEffect(() => {
      if (!isActive) {
        clearTimers();
        setCurrentTarget(null);
        return;
      }
      scheduleSpawn();
      return () => {
        clearTimers();
      };
    }, [isActive, targetShape, targetColor]);

    const handleHit = () => {
      if (!currentTarget) return;
      setCurrentTarget(null);
      onTargetDisappeared?.();
      onHit?.();
      if (activeRef.current) {
        scheduleSpawn();
      }
    };

    const accentColors = useMemo(() => neonPalette.sort(() => 0.5 - Math.random()).slice(0, 3), [round]);

    return (
      <div className="relative w-full h-full max-w-4xl mx-auto">
        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
        <div className="relative bg-black/60 backdrop-blur-xl border-2 border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[420px] md:min-h-[520px]">
          <Canvas
            ref={ref}
            dpr={[1, isMobile ? 1.25 : 1.5]}
            gl={{ antialias: !isMobile }}
            frameloop="demand"
            camera={{ fov: 55, position: [0, 0.8, 4.4] }}
            flat
            performance={{ min: 0.7 }}
          >
            <ArenaScene target={currentTarget} color={targetColor} shape={targetShape} onHit={handleHit} round={round} totalRounds={totalRounds} />
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 1.2, 2.6]} intensity={1.1} color={accentColors[0]} decay={1.3} />
            <pointLight position={[1.2, 0.8, -2.4]} intensity={0.9} color={accentColors[1] ?? '#7c3aed'} decay={1.2} />
            <pointLight position={[-1.6, 1.5, 1.2]} intensity={0.8} color={accentColors[2] ?? '#22d3ee'} decay={1.1} />
            <ArenaEffects />
          </Canvas>

          <div className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.12),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(124,58,237,0.12),transparent_30%)]" />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.12 }} />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse" />
        </div>
      </div>
    );
  }
);

Arena3DInner.displayName = 'Arena3D';

const Arena3D = (props: Arena3DProps) => <Arena3DInner {...props} />;

export default Arena3D;
