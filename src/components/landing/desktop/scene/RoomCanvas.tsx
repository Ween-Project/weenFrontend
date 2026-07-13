"use client";

import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { RoomModel } from "./RoomModel";
import { WHITEBOARD, getLaptopScreenPlane } from "./sceneConfig";
import { rangeFade, remap, smootherstep } from "@/lib/easing";
import { ScreenRect, useScrollStore } from "@/lib/scrollStore";

type PlaneConfig = {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  width: number;
  height: number;
};

function projectPlane(
  config: PlaneConfig,
  camera: THREE.Camera,
  size: { width: number; height: number },
  opacity: number
): ScreenRect {
  const euler = new THREE.Euler(...config.rotation);
  const origin = new THREE.Vector3(...config.position);

  const points = [
    new THREE.Vector3(-config.width / 2, config.height / 2, 0),
    new THREE.Vector3(config.width / 2, config.height / 2, 0),
    new THREE.Vector3(config.width / 2, -config.height / 2, 0),
    new THREE.Vector3(-config.width / 2, -config.height / 2, 0)
  ].map((point) => {
    point.applyEuler(euler).add(origin).project(camera);
    return {
      x: (point.x * 0.5 + 0.5) * size.width,
      y: (-point.y * 0.5 + 0.5) * size.height,
      z: point.z
    };
  });

  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const behindCamera = points.some((point) => point.z > 1);
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);

  return {
    x: minX,
    y: minY,
    width,
    height,
    opacity,
    visible: !behindCamera && opacity > 0.02 && width > 10 && height > 10
  };
}

function ProjectionSync() {
  const { camera, size } = useThree();
  const lastLaptop = useMemo(() => ({ value: 0 }), []);
  const lastWhiteboard = useMemo(() => ({ value: 0 }), []);

  useFrame(() => {
    const state = useScrollStore.getState();
    const laptopOpacity = rangeFade(state.progress, 0.605, 0.645, 0.84, 0.9);
    const whiteboardOpacity = smootherstep(remap(state.progress, 0.9, 0.98));

    if (Math.abs(laptopOpacity - lastLaptop.value) > 0.002 || laptopOpacity > 0) {
      state.setLaptopRect(projectPlane(getLaptopScreenPlane(state.progress), camera, size, laptopOpacity));
      lastLaptop.value = laptopOpacity;
    }

    if (Math.abs(whiteboardOpacity - lastWhiteboard.value) > 0.002 || whiteboardOpacity > 0) {
      state.setWhiteboardRect(projectPlane(WHITEBOARD, camera, size, whiteboardOpacity));
      lastWhiteboard.value = whiteboardOpacity;
    }
  });

  return null;
}

function SceneLights() {
  return (
    <>
      <hemisphereLight intensity={0.72} color="#FFF8E8" groundColor="#7A4E31" />
      <ambientLight intensity={0.82} color="#FFF6E8" />
      <directionalLight
        color="#FFF4E0"
        intensity={3.35}
        position={[-1.2, 2.4, 3.4]}
      >
      </directionalLight>
      <spotLight
        angle={0.62}
        color="#FFE2AE"
        intensity={4.1}
        penumbra={0.82}
        position={[0.55, 1.15, 1.35]}
        target-position={[-0.42, -0.38, -0.38]}
      />
      <pointLight color="#B7F7D6" intensity={1.05} position={[-0.55, -0.16, -0.22]} />
      <pointLight color="#FFD79C" intensity={1.25} position={[1.4, 0.72, 1.2]} distance={5} />
    </>
  );
}

export default function RoomCanvas() {
  const maxDpr =
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

  return (
    <Canvas
      className="fixed inset-0 z-0 h-screen w-screen bg-background"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        background: "#FFF4DF",
        filter: "saturate(1.12) brightness(1.04)"
      }}
      dpr={[1, maxDpr]}
      shadows={false}
      camera={{
        position: [0, 0.02, 5.75],
        fov: 44,
        near: 0.05,
        far: 20
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#F3E7D7");
        gl.shadowMap.enabled = false;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.22;
      }}
    >
      <color attach="background" args={["#FFF1D8"]} />
      <fog attach="fog" args={["#FFF1D8", 6.4, 10.6]} />
      <Suspense fallback={null}>
        <SceneLights />
        <RoomModel />
        <CameraRig />
        <ProjectionSync />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
