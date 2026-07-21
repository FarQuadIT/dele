"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import * as THREE from "three";
import { HouseScene } from "@/components/landing/hero/house-canvas";

export default function MiniHouseCanvas({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.5]}
      camera={{ position: [9.8, 5.4, 10.9], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute !inset-0"
      aria-hidden
    >
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-7, 4, -5]} intensity={0.35} color="#bfe8e0" />
      <HouseScene progress={progress} />
      <ContactShadows
        position={[0, -0.25, 0]}
        opacity={0.3}
        scale={16}
        blur={2.6}
        far={6}
        resolution={512}
        frames={1}
      />
    </Canvas>
  );
}
