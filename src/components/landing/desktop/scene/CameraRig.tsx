"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CAMERA_FRAMES } from "./sceneConfig";
import {
  catmullRomVector,
  clamp01,
  dampScalar,
  dampVector3,
  mix,
  smootherstep
} from "@/lib/easing";
import { useScrollStore } from "@/lib/scrollStore";

type VectorFrame = {
  progress: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
};

function sampleFrame(
  progress: number,
  frames: VectorFrame[],
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3
) {
  const clamped = clamp01(progress);
  let index = 0;

  for (let i = 0; i < frames.length - 1; i += 1) {
    if (clamped >= frames[i].progress && clamped <= frames[i + 1].progress) {
      index = i;
      break;
    }
  }

  const current = frames[index];
  const next = frames[Math.min(index + 1, frames.length - 1)];
  const previous = frames[Math.max(index - 1, 0)];
  const future = frames[Math.min(index + 2, frames.length - 1)];
  const span = next.progress - current.progress || 1;
  const local = smootherstep((clamped - current.progress) / span);

  catmullRomVector(
    outPosition,
    previous.position,
    current.position,
    next.position,
    future.position,
    local
  );
  catmullRomVector(
    outTarget,
    previous.target,
    current.target,
    next.target,
    future.target,
    local
  );

  return mix(current.fov, next.fov, local);
}

export function CameraRig() {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0.8));
  const currentFov = useRef<number>(CAMERA_FRAMES[0].fov);
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredLookAt = useRef(new THREE.Vector3());

  const frames = useMemo<VectorFrame[]>(
    () =>
      CAMERA_FRAMES.map((frame) => ({
        progress: frame.progress,
        position: new THREE.Vector3(...frame.position),
        target: new THREE.Vector3(...frame.target),
        fov: frame.fov
      })),
    []
  );

  useFrame((_, delta) => {
    const { progress, reducedMotion } = useScrollStore.getState();
    const effectiveProgress = reducedMotion ? Math.round(progress * 7) / 7 : progress;
    const desiredFov = sampleFrame(
      effectiveProgress,
      frames,
      desiredPosition.current,
      desiredLookAt.current
    );
    const lambda = reducedMotion ? 18 : 6.5;

    dampVector3(camera.position, desiredPosition.current, lambda, delta);
    dampVector3(currentLookAt.current, desiredLookAt.current, lambda, delta);
    currentFov.current = dampScalar(currentFov.current, desiredFov, lambda, delta);

    if ("fov" in camera) {
      camera.fov = currentFov.current;
      camera.updateProjectionMatrix();
    }

    camera.lookAt(currentLookAt.current);
  });

  return null;
}
