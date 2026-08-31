import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import type { LoadState, Placement } from "@/lib/loadguard/types";

type Props = {
  state: LoadState;
  candidate: Placement[] | null;
  highlight?: string | null;
};

const SCALE = 0.01; // cm -> metres

function Trailer({ l, w, h }: { l: number; w: number; h: number }) {
  return (
    <group>
      <mesh position={[l / 2, -0.02, w / 2]} receiveShadow>
        <boxGeometry args={[l, 0.04, w]} />
        <meshStandardMaterial color="#23364d" roughness={0.85} metalness={0.25} />
      </mesh>
      <mesh position={[l / 2, h / 2, w / 2]}>
        <boxGeometry args={[l, h, w]} />
        <meshStandardMaterial
          color="#9aacbf"
          transparent
          opacity={0.06}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <lineSegments position={[l / 2, h / 2, w / 2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(l, h, w)]} />
        <lineBasicMaterial color="#afc4d8" transparent opacity={0.58} />
      </lineSegments>
      {/* Rear door plane at x = 0 */}
      <mesh position={[0.005, h / 2, w / 2]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#f5a524" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Crate({
  size,
  position,
  color,
  opacity,
  wire,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  opacity: number;
  wire?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
          metalness={0.12}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {wire ? (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
          <lineBasicMaterial color={color} />
        </lineSegments>
      ) : null}
    </group>
  );
}

function SceneContent({ state, candidate, highlight }: Props) {
  const t = state.truck;
  const L = t.lengthCm * SCALE;
  const W = t.widthCm * SCALE;
  const H = t.heightCm * SCALE;

  const byId = useMemo(() => new Map(state.packages.map((p) => [p.id, p])), [state.packages]);

  const active = state.packages.filter((p) => p.loaded && p.position);

  const stopColor = (stop: number, fragile: boolean, priority: string) => {
    if (priority === "urgent") return "#ff5a5f";
    if (fragile) return "#f6b84a";
    const palette = ["#4c8bf5", "#2fb6a4", "#8b6cf3", "#c96f4a", "#5f7285"];
    return palette[(stop - 1) % palette.length]!;
  };

  return (
    <>
      <color attach="background" args={["#111c2b"]} />
      <fog attach="fog" args={["#111c2b", 10, 28]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 6, 0]} scale={[12, 12, 1]} />
        <Lightformer
          intensity={0.9}
          color="#7fa6c9"
          position={[-6, 2, -2]}
          rotation-y={Math.PI / 2}
          scale={[16, 2, 1]}
        />
      </Environment>

      <group position={[-L / 2, 0, -W / 2]}>
        <Trailer l={L} w={W} h={H} />

        {active.map((p) => {
          const pos = p.position!;
          const size: [number, number, number] = [
            p.lengthCm * SCALE,
            p.heightCm * SCALE,
            p.widthCm * SCALE,
          ];
          return (
            <Crate
              key={`active-${p.id}`}
              size={size}
              position={[
                pos.x * SCALE + size[0] / 2,
                pos.y * SCALE + size[1] / 2,
                pos.z * SCALE + size[2] / 2,
              ]}
              color={
                highlight === p.code ? "#ffffff" : stopColor(p.deliveryStop, p.fragile, p.priority)
              }
              opacity={1}
            />
          );
        })}

        {(candidate ?? []).map((item) => {
          const pkg = byId.get(item.boxId);
          if (!pkg) return null;
          const size: [number, number, number] = [
            pkg.lengthCm * SCALE,
            pkg.heightCm * SCALE,
            pkg.widthCm * SCALE,
          ];
          return (
            <Crate
              key={`candidate-${item.boxId}`}
              size={size}
              position={[
                item.position.x * SCALE + size[0] / 2,
                item.position.y * SCALE + size[1] / 2,
                item.position.z * SCALE + size[2] / 2,
              ]}
              color="#38d9ff"
              opacity={0.22}
              wire
            />
          );
        })}
      </group>

      <gridHelper args={[24, 24, "#34506b", "#1d3046"]} position={[0, -0.03, 0]} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.4}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, H * 0.32, 0]}
      />
    </>
  );
}

export default function TruckScene(props: Props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [3.6, 2.8, 3.6], fov: 36 }}>
      <SceneContent {...props} />
    </Canvas>
  );
}
