"use client";

import { ContactShadows, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  LAPTOP_SCREEN,
  LAPTOP_TURN_PIVOT,
  WHITEBOARD,
  getLaptopRigTransform
} from "./sceneConfig";
import { remap, smootherstep } from "@/lib/easing";
import { useScrollStore } from "@/lib/scrollStore";

const wood = "#A66B3D";
const darkWood = "#5F371F";
const brass = "#B89145";
const wall = "#ECE8E0";
const paper = "#FFF9ED";
const metal = "#B7C0C8";
const ivyDark = "#183B20";
const ivyMid = "#2F6234";
const ivyLight = "#5D8F44";

type Vec3 = [number, number, number];

function Box({
  position,
  scale,
  color,
  roughness = 0.72,
  metalness = 0,
  rotation = [0, 0, 0]
}: {
  position: Vec3;
  scale: Vec3;
  color: string;
  roughness?: number;
  metalness?: number;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function useIvyLeafShape() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.09);
    shape.bezierCurveTo(-0.13, -0.02, -0.14, 0.13, -0.02, 0.18);
    shape.bezierCurveTo(0.02, 0.22, 0.08, 0.22, 0.12, 0.16);
    shape.bezierCurveTo(0.18, 0.07, 0.13, -0.05, 0, -0.09);
    return shape;
  }, []);
}

function WoodGrain({
  x,
  y,
  z,
  width,
  height,
  count = 5
}: {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  count?: number;
}) {
  const lines = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const offset = (index / Math.max(1, count - 1) - 0.5) * height * 0.72;
        const wave = index % 2 === 0 ? 0.015 : -0.012;
        return [
          [-width / 2 + 0.02, offset, 0] as Vec3,
          [-width / 5, offset + wave, 0] as Vec3,
          [width / 4, offset - wave * 0.6, 0] as Vec3,
          [width / 2 - 0.02, offset + wave * 0.3, 0] as Vec3
        ];
      }),
    [count, height, width]
  );

  return (
    <group position={[x, y, z]}>
      {lines.map((points, index) => (
        <Line
          key={index}
          points={points}
          color="#D7A875"
          lineWidth={0.65}
          transparent
          opacity={0.64}
        />
      ))}
    </group>
  );
}

function BrickWall() {
  const bricks = useMemo(() => {
    const result: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      depth: number;
    }> = [];
    const palette = ["#7D3F2C", "#8F4B32", "#A55A38", "#6F3328", "#98533A"];
    const wallWidth = 7.8;
    const rowHeight = 0.16;
    const brickWidth = 0.46;
    const gap = 0.025;
    const columnCount = Math.ceil(wallWidth / (brickWidth + gap)) + 3;
    const rowStart = -1.84;
    const rowCount = 22;

    for (let row = 0; row < rowCount; row += 1) {
      const y = rowStart + row * (rowHeight + gap);
      const rowOffset = row % 2 === 0 ? 0 : brickWidth / 2;

      for (let col = 0; col < columnCount; col += 1) {
        const x = -wallWidth / 2 - brickWidth + col * (brickWidth + gap) + rowOffset;
        const centerX = x + brickWidth / 2;
        const centerY = y + rowHeight / 2;
        const outsideWall =
          centerX < -wallWidth / 2 - brickWidth / 2 ||
          centerX > wallWidth / 2 + brickWidth / 2;
        const inRectOpening =
          Math.abs(centerX) < 1.23 && centerY > -0.92 && centerY < 0.74;
        const inArchOpening =
          Math.abs(centerX) < 1.22 &&
          centerY >= 0.58 &&
          Math.pow(centerX / 1.22, 2) + Math.pow((centerY - 0.58) / 0.55, 2) < 1;

        if (outsideWall || inRectOpening || inArchOpening) {
          continue;
        }

        const seed = (row * 37 + col * 17) % palette.length;
        const chip = ((row + col * 3) % 7) * 0.006;

        result.push({
          x: x + brickWidth / 2,
          y: y + rowHeight / 2,
          width: brickWidth - 0.018 - chip,
          height: rowHeight - 0.016,
          color: palette[seed],
          depth: 0.055 + ((row + col) % 3) * 0.008
        });
      }
    }

    return result;
  }, []);

  const speckles = useMemo(
    () =>
      bricks.flatMap((brick, brickIndex) =>
        Array.from({ length: 1 }, (_, index) => {
          const seed = brickIndex * 13 + index * 19;
          return {
            x: brick.x + (((seed % 17) / 17 - 0.5) * brick.width * 0.78),
            y: brick.y + ((((seed * 7) % 13) / 13 - 0.5) * brick.height * 0.58),
            scale: 0.01 + (seed % 3) * 0.004,
            color: seed % 2 === 0 ? "#3D211A" : "#C07A4E"
          };
        })
      ),
    [bricks]
  );

  return (
    <group position={[0, 0, 1.53]}>
      <Box position={[-2.65, -0.04, -0.025]} scale={[2.5, 3.98, 0.05]} color="#76614F" />
      <Box position={[2.65, -0.04, -0.025]} scale={[2.5, 3.98, 0.05]} color="#76614F" />
      <Box position={[0, 1.22, -0.025]} scale={[7.8, 0.62, 0.05]} color="#76614F" />
      <Box position={[0, -1.48, -0.025]} scale={[7.8, 0.94, 0.05]} color="#76614F" />

      {bricks.map((brick, index) => (
        <mesh
          key={`${brick.x}-${brick.y}-${index}`}
          position={[brick.x, brick.y, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[brick.width, brick.height, brick.depth]} />
          <meshStandardMaterial
            color={brick.color}
            roughness={0.96}
            metalness={0}
          />
        </mesh>
      ))}

      {speckles.map((speckle, index) => (
        <mesh key={index} position={[speckle.x, speckle.y, 0.035]}>
          <boxGeometry args={[speckle.scale * 1.8, speckle.scale, 0.01]} />
          <meshStandardMaterial color={speckle.color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

const sashWidth = 1.12;
const sashHeight = 1.56;
const sashOuterRail = 0.08;
const sashInnerRail = 0.045;

function WindowGlass({ x, width }: { x: number; width: number }) {
  const glassHeight = sashHeight - sashOuterRail * 1.4;

  return (
    <group position={[x, -0.08, -0.035]}>
      <mesh receiveShadow>
        <planeGeometry args={[width, glassHeight]} />
        <meshPhysicalMaterial
          color="#DDE9EF"
          ior={1.48}
          metalness={0}
          opacity={0.28}
          roughness={0.025}
          thickness={0.05}
          transmission={0.74}
          transparent
        />
      </mesh>
      <mesh position={[0.17, 0.1, 0.01]} rotation={[0, 0, -0.16]}>
        <planeGeometry args={[0.13, glassHeight + 0.12]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} />
      </mesh>
      <mesh position={[-0.25, 0.08, 0.012]} rotation={[0, 0, -0.16]}>
        <planeGeometry args={[0.08, glassHeight - 0.08]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

function WindowSash({
  side,
  sashRef
}: {
  side: "left" | "right";
  sashRef?: RefObject<THREE.Group>;
}) {
  const pivotX = side === "left" ? -1.12 : 1.12;
  const innerX = side === "left" ? sashWidth / 2 : -sashWidth / 2;
  const outerRailX = sashWidth / 2 - sashOuterRail / 2;
  const innerRailX = sashWidth / 2 - sashInnerRail / 2;
  const glassWidth = sashWidth - sashOuterRail - sashInnerRail;
  const glassX =
    side === "left"
      ? (sashOuterRail - sashInnerRail) / 2
      : (sashInnerRail - sashOuterRail) / 2;

  return (
    <group ref={sashRef} position={[pivotX, -0.08, 1.73]}>
      <group position={[innerX, 0, 0]}>
        <Box position={[0, -0.02, 0]} scale={[sashWidth, 0.075, 0.085]} color={wood} />
        <Box position={[0, 0.68, 0]} scale={[sashWidth, 0.075, 0.085]} color={wood} />
        <Box position={[0, -0.74, 0]} scale={[sashWidth, 0.085, 0.085]} color={wood} />
        {side === "left" ? (
          <>
            <Box position={[-outerRailX, -0.03, 0]} scale={[sashOuterRail, sashHeight, 0.085]} color={wood} />
            <Box position={[innerRailX, -0.03, 0]} scale={[sashInnerRail, sashHeight, 0.075]} color={wood} />
          </>
        ) : (
          <>
            <Box position={[-innerRailX, -0.03, 0]} scale={[sashInnerRail, sashHeight, 0.075]} color={wood} />
            <Box position={[outerRailX, -0.03, 0]} scale={[sashOuterRail, sashHeight, 0.085]} color={wood} />
          </>
        )}
        <Box position={[glassX, -0.03, 0.01]} scale={[0.04, 1.38, 0.05]} color="#B77A4A" />
        <WindowGlass x={glassX} width={glassWidth} />
        <WoodGrain x={0} y={-0.72} z={0.055} width={glassWidth} height={0.06} count={3} />
        <WoodGrain x={0} y={0.68} z={0.055} width={glassWidth} height={0.06} count={3} />
      </group>
    </group>
  );
}

function Window() {
  const leftSashRef = useRef<THREE.Group>(null);
  const rightSashRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const progress = useScrollStore.getState().progress;
    const opened = smootherstep(remap(progress, 0.16, 0.3));
    const openAngle = Math.PI * 0.52;
    const breeze = opened * Math.sin(clock.elapsedTime * 1.25) * 0.014;

    if (leftSashRef.current) {
      leftSashRef.current.rotation.y = -opened * openAngle + breeze;
    }

    if (rightSashRef.current) {
      rightSashRef.current.rotation.y = opened * openAngle - breeze * 0.6;
    }
  });

  return (
    <group>
      <group position={[0, -0.08, 1.72]}>
        <Box position={[-1.24, -0.08, 0]} scale={[0.14, 1.84, 0.16]} color={darkWood} />
        <Box position={[1.24, -0.08, 0]} scale={[0.14, 1.84, 0.16]} color={darkWood} />
        <Box position={[0, -1.02, 0.01]} scale={[2.92, 0.13, 0.22]} color={darkWood} />
        <Box position={[0, -1.15, 0.08]} scale={[3.28, 0.16, 0.36]} color={wood} />
        <Box position={[0, -1.31, -0.02]} scale={[3.04, 0.12, 0.26]} color="#70401F" />
        <Box position={[0, 0.68, 0]} scale={[2.52, 0.12, 0.16]} color={darkWood} />
        <mesh position={[0, 0.65, 0.02]} scale={[1, 0.34, 1]} castShadow receiveShadow>
          <torusGeometry args={[1.25, 0.055, 12, 96, Math.PI]} />
          <meshStandardMaterial color={wood} roughness={0.58} metalness={0.03} />
        </mesh>
        <mesh position={[0, 0.65, -0.035]} scale={[1, 0.34, 1]} castShadow receiveShadow>
          <torusGeometry args={[1.38, 0.07, 12, 96, Math.PI]} />
          <meshStandardMaterial color={darkWood} roughness={0.7} metalness={0.02} />
        </mesh>
        <WoodGrain x={0} y={-1.15} z={0.27} width={2.8} height={0.12} count={6} />
      </group>

      <WindowSash side="left" sashRef={leftSashRef} />
      <WindowSash side="right" sashRef={rightSashRef} />

      {[-1.34, 1.34].map((x) => (
        <group key={x} position={[x, -0.08, 1.84]}>
          {[0.45, -0.55].map((y) => (
            <group key={y} position={[0, y, 0]}>
              <Box position={[0, 0, 0]} scale={[0.08, 0.42, 0.035]} color={brass} metalness={0.5} roughness={0.28} />
              <mesh position={[0, 0.12, 0.026]}>
                <sphereGeometry args={[0.013, 10, 10]} />
                <meshStandardMaterial color="#E3C46A" metalness={0.65} roughness={0.24} />
              </mesh>
              <mesh position={[0, -0.12, 0.026]}>
                <sphereGeometry args={[0.013, 10, 10]} />
                <meshStandardMaterial color="#E3C46A" metalness={0.65} roughness={0.24} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Ivy() {
  const leafShape = useIvyLeafShape();
  const leafRefs = useRef<THREE.Group[]>([]);
  const floatingRefs = useRef<THREE.Group[]>([]);
  const leaves = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        x: -2.52 + ((index * 37) % 48) / 100,
        y: 1.36 - index * 0.066 + Math.sin(index * 1.7) * 0.16,
        scale: 0.36 + ((index * 11) % 12) / 50,
        rotation: ((index * 41) % 120) / 100 - 0.6,
        phase: index * 0.43,
        color: [ivyDark, ivyMid, ivyLight][index % 3]
      })),
    []
  );
  const looseLeaves = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        x: -1.95 + index * 0.58,
        y: 1.18 - (index % 3) * 0.5,
        scale: 0.24 + (index % 3) * 0.06,
        phase: index * 1.2,
        speed: 0.45 + index * 0.04
      })),
    []
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

    leafRefs.current.forEach((leaf, index) => {
      const data = leaves[index];
      if (!leaf || !data) {
        return;
      }
      leaf.rotation.z = data.rotation + Math.sin(time * 1.4 + data.phase) * 0.06;
      leaf.rotation.y = Math.sin(time * 1.1 + data.phase) * 0.12;
    });

    floatingRefs.current.forEach((leaf, index) => {
      const data = looseLeaves[index];
      if (!leaf || !data) {
        return;
      }
      const drift = (time * data.speed + data.phase) % 7;
      leaf.position.x = data.x + Math.sin(time * 0.8 + data.phase) * 0.18 + drift * 0.08;
      leaf.position.y = data.y + Math.sin(time * 1.35 + data.phase) * 0.05;
      leaf.rotation.z = time * 0.55 + data.phase;
      leaf.rotation.y = Math.sin(time * 1.8 + data.phase) * 0.45;
    });
  });

  return (
    <group position={[0, 0, 1.9]}>
      {[
        [
          [-2.56, 1.5, 0] as Vec3,
          [-2.42, 1.05, 0] as Vec3,
          [-2.52, 0.46, 0] as Vec3,
          [-2.34, -0.2, 0] as Vec3,
          [-2.48, -1.18, 0] as Vec3
        ],
        [
          [-2.16, 1.48, 0] as Vec3,
          [-2.3, 0.92, 0] as Vec3,
          [-2.08, 0.38, 0] as Vec3,
          [-2.26, -0.32, 0] as Vec3
        ],
        [
          [-2.68, 1.22, 0] as Vec3,
          [-2.2, 1.04, 0] as Vec3,
          [-1.74, 0.82, 0] as Vec3
        ]
      ].map((points, index) => (
        <Line key={index} points={points} color="#16351B" lineWidth={2.2} />
      ))}

      {leaves.map((leaf, index) => (
        <group
          key={index}
          ref={(node) => {
            if (node) {
              leafRefs.current[index] = node;
            }
          }}
          position={[leaf.x, leaf.y, 0.015]}
          rotation={[0.15, 0, leaf.rotation]}
          scale={[leaf.scale, leaf.scale, leaf.scale]}
        >
          <mesh castShadow>
            <shapeGeometry args={[leafShape]} />
            <meshStandardMaterial
              color={leaf.color}
              roughness={0.78}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Line
            points={[
              [0, -0.07, 0.01],
              [0, 0.13, 0.01]
            ]}
            color="#86A95F"
            lineWidth={0.45}
            transparent
            opacity={0.65}
          />
        </group>
      ))}

      {looseLeaves.map((leaf, index) => (
        <group
          key={`loose-${index}`}
          ref={(node) => {
            if (node) {
              floatingRefs.current[index] = node;
            }
          }}
          position={[leaf.x, leaf.y, 0.28]}
          scale={[leaf.scale, leaf.scale, leaf.scale]}
        >
          <mesh castShadow>
            <shapeGeometry args={[leafShape]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#628F43" : "#2F6234"}
              roughness={0.72}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RoomShell() {
  return (
    <group>
      <Box position={[0, -1.12, -0.2]} scale={[4.2, 0.12, 4.8]} color="#8A5B3A" />
      <Box position={[0, 1.16, -0.2]} scale={[4.2, 0.1, 4.8]} color="#EFE7DC" />
      <Box position={[0, 0.03, -2.08]} scale={[4.2, 2.38, 0.1]} color={wall} />
      <Box position={[-2.05, 0.03, -0.22]} scale={[0.1, 2.38, 3.9]} color="#EEE4D8" />
      <Box position={[2.05, 0.03, -0.22]} scale={[0.1, 2.38, 3.9]} color="#F5EFE7" />

      {Array.from({ length: 9 }, (_, index) => (
        <Box
          key={index}
          position={[-1.8 + index * 0.45, -1.045, 0.18]}
          scale={[0.02, 0.01, 4.28]}
          color="#6E4529"
        />
      ))}

      <mesh position={[-0.65, 0.2, -2.02]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.62, 0.04]} />
        <meshStandardMaterial color="#6B4B36" roughness={0.68} />
      </mesh>
      <mesh position={[-0.65, 0.2, -1.995]} receiveShadow>
        <planeGeometry args={[0.38, 0.52]} />
        <meshStandardMaterial color="#F9F5E7" roughness={0.72} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group>
      <Box position={[-0.32, -0.6, 0.05]} scale={[2.1, 0.1, 0.88]} color="#F3EEE6" roughness={0.52} />
      <Box position={[-0.32, -0.54, 0.5]} scale={[2.04, 0.05, 0.07]} color="#C9A17B" roughness={0.58} />
      <Box position={[-1.2, -1.04, -0.24]} scale={[0.07, 0.88, 0.07]} color="#B9B2A7" metalness={0.1} roughness={0.45} />
      <Box position={[0.55, -1.04, -0.24]} scale={[0.07, 0.88, 0.07]} color="#B9B2A7" metalness={0.1} roughness={0.45} />
      <Box position={[-1.2, -1.04, 0.42]} scale={[0.07, 0.88, 0.07]} color="#B9B2A7" metalness={0.1} roughness={0.45} />
      <Box position={[0.55, -1.04, 0.42]} scale={[0.07, 0.88, 0.07]} color="#B9B2A7" metalness={0.1} roughness={0.45} />
    </group>
  );
}

function Laptop() {
  const laptopRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  const [pivotX, pivotY, pivotZ] = LAPTOP_TURN_PIVOT;

  useFrame(({ clock }) => {
    const progress = useScrollStore.getState().progress;
    const transform = getLaptopRigTransform(progress);

    if (laptopRef.current) {
      laptopRef.current.position.set(pivotX, pivotY + transform.lift, pivotZ);
      laptopRef.current.rotation.y = transform.rotationY;
    }

    if (screenRef.current) {
      const approach = smootherstep(remap(progress, 0.56, 0.64));
      screenRef.current.emissiveIntensity =
        0.82 - approach * 0.68 + Math.sin(clock.elapsedTime * 1.8) * 0.025;
    }
  });

  return (
    <group ref={laptopRef} position={[...LAPTOP_TURN_PIVOT]}>
      <group position={[-pivotX, -pivotY, -pivotZ]}>
      <mesh position={[-0.55, -0.53, 0.04]} castShadow receiveShadow rotation={[0.02, 0, 0]}>
        <boxGeometry args={[1.34, 0.045, 0.76]} />
        <meshStandardMaterial color="#CDD3DA" metalness={0.58} roughness={0.28} />
      </mesh>
      <mesh position={[-0.55, -0.5, -0.19]} castShadow receiveShadow>
        <boxGeometry args={[1.14, 0.012, 0.42]} />
        <meshStandardMaterial color="#AEB7C2" metalness={0.32} roughness={0.38} />
      </mesh>
      <mesh position={[-0.55, -0.475, 0.16]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.01, 0.2]} />
        <meshStandardMaterial color="#B7C0CB" metalness={0.36} roughness={0.4} />
      </mesh>
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[-1.03 + col * 0.105 + (row % 2) * 0.025, -0.47, -0.08 + row * 0.055]}
            castShadow
          >
            <boxGeometry args={[0.072, 0.009, 0.028]} />
            <meshStandardMaterial color="#88929F" metalness={0.14} roughness={0.55} />
          </mesh>
        ))
      )}

      <group
        position={[...LAPTOP_SCREEN.position]}
        rotation={[...LAPTOP_SCREEN.rotation]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[LAPTOP_SCREEN.width + 0.13, LAPTOP_SCREEN.height + 0.13, 0.05]} />
          <meshStandardMaterial color="#182231" metalness={0.22} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0, 0.029]} receiveShadow>
          <planeGeometry args={[LAPTOP_SCREEN.width, LAPTOP_SCREEN.height]} />
          <meshStandardMaterial
            ref={screenRef}
            color="#F8FAFC"
            emissive="#DFFFEF"
            emissiveIntensity={0.95}
            roughness={0.38}
          />
        </mesh>
        <mesh position={[-0.44, 0.25, 0.034]}>
          <planeGeometry args={[0.16, 0.025]} />
          <meshBasicMaterial color="#1F2937" />
        </mesh>
        <mesh position={[0.4, 0.25, 0.034]}>
          <planeGeometry args={[0.17, 0.05]} />
          <meshBasicMaterial color="#4F7DFF" />
        </mesh>
        <mesh position={[-0.16, 0.04, 0.035]}>
          <planeGeometry args={[0.42, 0.08]} />
          <meshBasicMaterial color="#1F2937" transparent opacity={0.88} />
        </mesh>
        <mesh position={[-0.16, -0.07, 0.035]}>
          <planeGeometry args={[0.34, 0.018]} />
          <meshBasicMaterial color="#6B7280" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0.42, -0.06, 0.035]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshBasicMaterial color="#20BF6B" transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, LAPTOP_SCREEN.height / 2 + 0.035, 0.03]}>
          <sphereGeometry args={[0.018, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.6} />
        </mesh>
      </group>
      </group>
    </group>
  );
}

function CoffeeCup() {
  return (
    <group position={[0.32, -0.46, 0.34]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.09, 0.2, 32]} />
        <meshStandardMaterial color="#D7B18B" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.104, 0]} receiveShadow>
        <cylinderGeometry args={[0.083, 0.088, 0.01, 32]} />
        <meshStandardMaterial color="#3B2115" roughness={0.42} />
      </mesh>
      <mesh position={[-0.03, 0.111, 0.025]} rotation={[Math.PI / 2, 0, -0.32]}>
        <planeGeometry args={[0.07, 0.015]} />
        <meshBasicMaterial color="#8A5735" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function DeskDetails() {
  return (
    <group>
      <mesh position={[0.68, -0.53, 0.29]} rotation={[0, -0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.014, 0.42]} />
        <meshStandardMaterial color={paper} roughness={0.92} />
      </mesh>
      <CoffeeCup />
    </group>
  );
}

function StickyNotes() {
  const notes = [
    [-1.15, 0.7, "#FACC15"],
    [-0.9, 0.55, "#FDBA74"],
    [-1.05, 0.3, "#FEF3C7"],
    [1.4, 0.78, "#FACC15"],
    [1.2, 0.55, "#FDBA74"]
  ] as const;

  return (
    <group position={[0, 0, -1.995]}>
      {notes.map(([x, y, color]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0]} castShadow receiveShadow>
          <planeGeometry args={[0.18, 0.18]} />
          <meshStandardMaterial color={color} roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

function WhiteboardModel() {
  return (
    <group position={[...WHITEBOARD.position]} rotation={[...WHITEBOARD.rotation]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[WHITEBOARD.width + 0.09, WHITEBOARD.height + 0.09, 0.035]} />
        <meshStandardMaterial color={metal} metalness={0.35} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.022]} receiveShadow>
        <planeGeometry args={[WHITEBOARD.width, WHITEBOARD.height]} />
        <meshStandardMaterial color="#F9FAFB" roughness={0.45} />
      </mesh>
      <mesh position={[0.05, -0.32, 0.04]} castShadow>
        <boxGeometry args={[0.72, 0.035, 0.035]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.45} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ExteriorFacade() {
  return (
    <group>
      <BrickWall />
      <Window />
      <Ivy />
    </group>
  );
}

export function RoomModel() {
  return (
    <group>
      <RoomShell />
      <Desk />
      <Laptop />
      <DeskDetails />
      <StickyNotes />
      <WhiteboardModel />
      <ExteriorFacade />
      <ContactShadows
        position={[0, -1.045, -0.15]}
        opacity={0.3}
        scale={4.2}
        blur={2.6}
        far={2.8}
        frames={1}
      />
    </group>
  );
}
