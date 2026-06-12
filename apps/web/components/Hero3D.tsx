'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group, Points } from 'three';

/**
 * Wireframe "vault" — an icosahedron shell with a counter-rotating core and a
 * point lattice, drifting slowly with pointer parallax. Monochrome, low
 * opacity: atmosphere, not spectacle.
 */
function Vault({ dark }: { dark: boolean }) {
  const group = useRef<Group>(null);
  const core = useRef<Group>(null);
  const dots = useRef<Points>(null);
  const color = dark ? '#ffffff' : '#000000';

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x += (state.pointer.y * 0.25 - group.current.rotation.x) * 0.04;
    group.current.position.x += (state.pointer.x * 0.3 - group.current.position.x) * 0.04;
    if (core.current) core.current.rotation.y -= delta * 0.3;
    if (dots.current) dots.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={group}>
      {/* outer shell */}
      <mesh>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.16} />
      </mesh>
      {/* counter-rotating core — the secret */}
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshBasicMaterial wireframe color={color} transparent opacity={0.35} />
        </mesh>
      </group>
      {/* vertex lattice */}
      <points ref={dots}>
        <icosahedronGeometry args={[2.6, 2]} />
        <pointsMaterial color={color} size={0.025} transparent opacity={0.45} sizeAttenuation />
      </points>
    </group>
  );
}

export default function Hero3D({ dark }: { dark: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ pointerEvents: 'none' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
    >
      <Vault dark={dark} />
    </Canvas>
  );
}
