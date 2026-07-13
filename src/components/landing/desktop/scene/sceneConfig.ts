import * as THREE from "three";

export const LAPTOP_SCREEN = {
  position: [-0.55, -0.08, -0.42] as const,
  rotation: [-0.18, 0.02, 0] as const,
  width: 1.18,
  height: 0.68
};

export const LAPTOP_TURN_PIVOT = [-0.55, -0.5, 0.08] as const;

export function getLaptopRigTransform(_progress: number) {
  return {
    rotationY: 0,
    lift: 0
  };
}

export function getLaptopScreenPlane(progress: number) {
  const transform = getLaptopRigTransform(progress);
  const pivot = new THREE.Vector3(...LAPTOP_TURN_PIVOT);
  const position = new THREE.Vector3(...LAPTOP_SCREEN.position)
    .sub(pivot)
    .applyEuler(new THREE.Euler(0, transform.rotationY, 0))
    .add(pivot);

  position.y += transform.lift;

  return {
    position: [position.x, position.y, position.z] as const,
    rotation: [
      LAPTOP_SCREEN.rotation[0],
      LAPTOP_SCREEN.rotation[1] + transform.rotationY,
      LAPTOP_SCREEN.rotation[2]
    ] as const,
    width: LAPTOP_SCREEN.width,
    height: LAPTOP_SCREEN.height
  };
}

export const WHITEBOARD = {
  position: [0.62, 0.27, -1.98] as const,
  rotation: [0, 0, 0] as const,
  width: 2.12,
  height: 1.2
};

export const CAMERA_FRAMES = [
  {
    progress: 0,
    position: [0, 0.02, 5.75],
    target: [0, -0.03, 1.54],
    fov: 44
  },
  {
    progress: 0.2,
    position: [0.04, 0.05, 3.62],
    target: [0, 0.01, 1.18],
    fov: 42
  },
  {
    progress: 0.35,
    position: [0.1, 0.02, 1.52],
    target: [-0.14, -0.08, 0.32],
    fov: 43
  },
  {
    progress: 0.55,
    position: [-0.44, 0.15, 1.22],
    target: [-0.54, -0.1, -0.42],
    fov: 41
  },
  {
    progress: 0.7,
    position: [-0.52, 0.19, 1.05],
    target: [-0.55, -0.08, -0.48],
    fov: 39
  },
  {
    progress: 0.85,
    position: [-0.52, 0.19, 1.03],
    target: [-0.54, -0.07, -0.48],
    fov: 39
  },
  {
    progress: 0.92,
    position: [0.1, 0.04, 0.68],
    target: [0.42, 0.24, -1.72],
    fov: 42
  },
  {
    progress: 1,
    position: [0.62, 0.28, 0.35],
    target: [0.62, 0.27, -1.98],
    fov: 38
  }
] as const;
