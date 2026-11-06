"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* Палитра сцены (hex-зеркала CSS-токенов) */
const C = {
  ground: "#e7e3d8",
  foundation: "#b6ae9f",
  wall: "#f5f2ea",
  wallEdge: "#e4ded2",
  slab: "#d8d2c4",
  roof: "#8a7a6b",
  chimney: "#a09284",
  window: "#bcd7f5",
  door: "#7e6a55",
  water: "#3f7ff0",
  heat: "#f0603a",
  air: "#23b5a3",
  electric: "#f0b429",
} as const;

function smoothstep(x: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

type Mats = {
  shell: THREE.MeshStandardMaterial[];
  systems: THREE.MeshStandardMaterial[];
};

function useMat(color: string, opts?: Partial<THREE.MeshStandardMaterialParameters>) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        metalness: 0.05,
        transparent: true,
        ...opts,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

export function HouseScene({
  progress,
  sideOffset = 0,
}: {
  progress: MotionValue<number>;
  sideOffset?: number;
}) {
  const houseRef = useRef<THREE.Group>(null);
  const roofRef = useRef<THREE.Group>(null);
  const floor2Ref = useRef<THREE.Group>(null);
  const slabRef = useRef<THREE.Group>(null);
  const floor1Ref = useRef<THREE.Group>(null);
  const foundationRef = useRef<THREE.Group>(null);
  const groundRef = useRef<THREE.Group>(null);
  const systemsRef = useRef<THREE.Group>(null);

  const groundMat = useMat(C.ground, { roughness: 0.95 });
  const foundationMat = useMat(C.foundation);
  const wallMat = useMat(C.wall);
  const wall2Mat = useMat(C.wall);
  const slabMat = useMat(C.slab);
  const roofMat = useMat(C.roof, { roughness: 0.7 });
  const chimneyMat = useMat(C.chimney);
  const windowMat = useMat(C.window, {
    roughness: 0.25,
    metalness: 0.15,
    emissive: new THREE.Color("#9dbeff"),
    emissiveIntensity: 0.12,
  });
  const doorMat = useMat(C.door);

  const waterMat = useMat(C.water, { emissive: new THREE.Color(C.water), emissiveIntensity: 0.12 });
  const heatMat = useMat(C.heat, { emissive: new THREE.Color(C.heat), emissiveIntensity: 0.12 });
  const airMat = useMat(C.air, { emissive: new THREE.Color(C.air), emissiveIntensity: 0.12 });
  const electricMat = useMat(C.electric, { emissive: new THREE.Color(C.electric), emissiveIntensity: 0.12 });

  const mats: Mats = useMemo(
    () => ({
      shell: [
        groundMat,
        foundationMat,
        wallMat,
        wall2Mat,
        slabMat,
        roofMat,
        chimneyMat,
        windowMat,
        doorMat,
      ],
      systems: [waterMat, heatMat, airMat, electricMat],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const lookAt = useMemo(() => new THREE.Vector3(0, 1.5, 0), []);

  useFrame((state) => {
    const p = progress.get();
    const t = state.clock.elapsedTime;

    const roofT = smoothstep(p, 0.1, 0.32);
    const floor2T = smoothstep(p, 0.2, 0.44);
    const slabT = smoothstep(p, 0.27, 0.5);
    const floor1T = smoothstep(p, 0.33, 0.56);
    const baseT = smoothstep(p, 0.4, 0.62);
    const ghostT = smoothstep(p, 0.5, 0.74);

    if (roofRef.current) {
      roofRef.current.position.y = roofT * 3.1;
      roofRef.current.rotation.y = roofT * 0.12;
    }
    if (floor2Ref.current) floor2Ref.current.position.y = floor2T * 1.7;
    if (slabRef.current) slabRef.current.position.y = slabT * 1.0;
    if (floor1Ref.current) floor1Ref.current.position.y = floor1T * 0.45;
    if (foundationRef.current) foundationRef.current.position.y = baseT * -0.35;
    if (groundRef.current) groundRef.current.position.y = baseT * -0.55;

    // Шелл уходит в «рентген», системы подсвечиваются
    const shellOpacity = 1 - ghostT * 0.86;
    for (const m of mats.shell) {
      m.opacity = shellOpacity;
      m.depthWrite = shellOpacity > 0.5;
    }
    for (const m of mats.systems) {
      m.emissiveIntensity = 0.12 + ghostT * 0.55;
      m.opacity = 1;
    }

    // Живое парение + лёгкий поворот сцены
    if (houseRef.current) {
      houseRef.current.rotation.y = -0.42 + Math.sin(t * 0.16) * 0.035 + p * 0.35;
      houseRef.current.position.y = Math.sin(t * 0.55) * 0.035;
    }

    // Камера: плавный отъезд и подъём; на старте дом смещён вбок от текста
    const side = sideOffset * (1 - smoothstep(p, 0.02, 0.3));
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.position.x = 9.8 + p * 1.1;
    cam.position.y = 5.1 + p * 2.1;
    cam.position.z = 10.9 + p * 1.4;
    lookAt.set(side, 1.9 + p * 0.6, 0);
    cam.lookAt(lookAt);
  });

  return (
    <group ref={houseRef}>
      {/* Участок */}
      <group ref={groundRef}>
        <mesh material={groundMat} receiveShadow position={[0, -0.11, 0]}>
          <cylinderGeometry args={[4.4, 4.4, 0.22, 48]} />
        </mesh>
      </group>

      {/* Фундамент */}
      <group ref={foundationRef}>
        <mesh material={foundationMat} castShadow receiveShadow position={[0, 0.18, 0]}>
          <boxGeometry args={[4.6, 0.36, 3.8]} />
        </mesh>
      </group>

      {/* Первый этаж */}
      <group ref={floor1Ref}>
        <mesh material={wallMat} castShadow receiveShadow position={[0, 1.11, 0]}>
          <boxGeometry args={[4.4, 1.5, 3.6]} />
        </mesh>
        <mesh material={doorMat} position={[0, 0.92, 1.81]}>
          <boxGeometry args={[0.72, 1.12, 0.06]} />
        </mesh>
        <mesh material={windowMat} position={[-1.25, 1.18, 1.81]}>
          <boxGeometry args={[0.82, 0.7, 0.06]} />
        </mesh>
        <mesh material={windowMat} position={[1.25, 1.18, 1.81]}>
          <boxGeometry args={[0.82, 0.7, 0.06]} />
        </mesh>
        <mesh material={windowMat} position={[-2.21, 1.18, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.4, 0.7, 0.06]} />
        </mesh>
      </group>

      {/* Межэтажная плита */}
      <group ref={slabRef}>
        <mesh material={slabMat} castShadow position={[0, 1.93, 0]}>
          <boxGeometry args={[4.5, 0.14, 3.7]} />
        </mesh>
      </group>

      {/* Второй этаж */}
      <group ref={floor2Ref}>
        <mesh material={wall2Mat} castShadow receiveShadow position={[0, 2.72, 0]}>
          <boxGeometry args={[4.4, 1.4, 3.6]} />
        </mesh>
        <mesh material={windowMat} position={[-1.25, 2.76, 1.81]}>
          <boxGeometry args={[0.72, 0.66, 0.06]} />
        </mesh>
        <mesh material={windowMat} position={[0, 2.76, 1.81]}>
          <boxGeometry args={[0.72, 0.66, 0.06]} />
        </mesh>
        <mesh material={windowMat} position={[1.25, 2.76, 1.81]}>
          <boxGeometry args={[0.72, 0.66, 0.06]} />
        </mesh>
      </group>

      {/* Крыша */}
      <group ref={roofRef}>
        <mesh
          material={roofMat}
          castShadow
          position={[0, 4.27, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[1.28, 1, 1.05]}
        >
          <coneGeometry args={[3.15, 1.75, 4]} />
        </mesh>
        <mesh material={chimneyMat} castShadow position={[1.15, 4.45, -0.65]}>
          <boxGeometry args={[0.36, 0.9, 0.36]} />
        </mesh>
      </group>

      {/* Инженерные системы (скелет дома) */}
      <group ref={systemsRef}>
        {/* Вода */}
        <mesh material={waterMat} position={[-1.55, 1.65, -1.15]}>
          <cylinderGeometry args={[0.07, 0.07, 3.1, 12]} />
        </mesh>
        <mesh material={waterMat} position={[-0.35, 0.58, -1.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 10]} />
        </mesh>
        <mesh material={waterMat} position={[-0.35, 2.15, -1.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 10]} />
        </mesh>
        <mesh material={waterMat} position={[-1.55, 0.5, -1.15]}>
          <boxGeometry args={[0.42, 0.52, 0.38]} />
        </mesh>

        {/* Отопление */}
        <mesh material={heatMat} position={[1.5, 0.88, -1.2]}>
          <boxGeometry args={[0.56, 0.92, 0.5]} />
        </mesh>
        <mesh material={heatMat} position={[-1.15, 0.62, 1.62]}>
          <boxGeometry args={[0.72, 0.4, 0.12]} />
        </mesh>
        <mesh material={heatMat} position={[0.95, 0.62, 1.62]}>
          <boxGeometry args={[0.72, 0.4, 0.12]} />
        </mesh>
        <mesh material={heatMat} position={[-1.15, 2.34, 1.62]}>
          <boxGeometry args={[0.72, 0.4, 0.12]} />
        </mesh>
        <mesh material={heatMat} position={[0.95, 2.34, 1.62]}>
          <boxGeometry args={[0.72, 0.4, 0.12]} />
        </mesh>
        <mesh material={heatMat} position={[0.2, 0.36, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 3.4, 8]} />
        </mesh>

        {/* Вентиляция */}
        <mesh material={airMat} position={[-1.25, 3.38, -0.85]}>
          <boxGeometry args={[0.95, 0.55, 0.72]} />
        </mesh>
        <mesh material={airMat} position={[0.45, 3.52, -0.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 2.9, 12]} />
        </mesh>
        <mesh material={airMat} position={[0.9, 3.52, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 1.7, 12]} />
        </mesh>

        {/* Электрика */}
        <mesh material={electricMat} position={[2.08, 1.28, 0.75]}>
          <boxGeometry args={[0.12, 0.52, 0.38]} />
        </mesh>
        <mesh material={electricMat} position={[2.08, 2.0, 0.3]}>
          <boxGeometry args={[0.05, 2.4, 0.05]} />
        </mesh>
        <mesh material={electricMat} position={[2.08, 0.7, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 2.2]} />
        </mesh>
      </group>
    </group>
  );
}

export default function HouseCanvas({
  progress,
  sideOffset = 0,
}: {
  progress: MotionValue<number>;
  sideOffset?: number;
}) {
  return (
    <Canvas
      // Three r185+: PCFSoftShadowMap deprecated; PCFShadowMap is soft by default
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.75]}
      camera={{ position: [8.6, 4.6, 9.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute !inset-0 pointer-events-none"
      aria-hidden
    >
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-7, 4, -5]} intensity={0.35} color="#bfe8e0" />
      <HouseScene progress={progress} sideOffset={sideOffset} />
      <ContactShadows
        position={[0, -0.25, 0]}
        opacity={0.32}
        scale={16}
        blur={2.6}
        far={6}
        resolution={512}
        frames={1}
      />
    </Canvas>
  );
}
