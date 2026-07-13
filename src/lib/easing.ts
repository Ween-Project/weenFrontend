import * as THREE from "three";

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mix(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function smootherstep(value: number) {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function remap(value: number, inMin: number, inMax: number) {
  if (inMax === inMin) {
    return 0;
  }

  return clamp01((value - inMin) / (inMax - inMin));
}

export function rangeFade(
  value: number,
  start: number,
  fadeInEnd: number,
  fadeOutStart: number,
  end: number,
) {
  const fadeIn = smootherstep(remap(value, start, fadeInEnd));
  const fadeOut = 1 - smootherstep(remap(value, fadeOutStart, end));
  return clamp01(Math.min(fadeIn, fadeOut));
}

export function dampScalar(
  current: number,
  target: number,
  lambda: number,
  delta: number,
) {
  return mix(current, target, 1 - Math.exp(-lambda * delta));
}

export function dampVector3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  lambda: number,
  delta: number,
) {
  current.lerp(target, 1 - Math.exp(-lambda * delta));
  return current;
}

export function catmullRomVector(
  out: THREE.Vector3,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
) {
  const t2 = t * t;
  const t3 = t2 * t;

  out.set(
    0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  );

  return out;
}
