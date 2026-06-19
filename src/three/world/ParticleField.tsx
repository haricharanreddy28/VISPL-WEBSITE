"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCygmaWorld } from "@/context/CygmaWorldContext";
import { useTheme } from "@/components/layout/ThemeContext";
import { usePerformance } from "@/context/PerformanceContext";

// Seeded random number generator
function createSeededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * ParticleField: Handles the 3D background floating particles.
 * Velocities scale up during auth success or dashboard view changes to simulate camera movement.
 */
export default function ParticleField({ count = 650 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const { resolvedTheme } = useTheme();
  const { view } = useCygmaWorld();
  const { config } = usePerformance();

  // Generate deterministic coordinates
  const [positions, speeds] = useMemo(() => {
    const rand = createSeededRandom(11111);
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 16;
      pos[i * 3 + 1] = (rand() - 0.5) * 11;
      pos[i * 3 + 2] = (rand() - 0.5) * 10 - 2;

      // Slow drift along the Z-axis
      spd[i * 3] = (rand() - 0.5) * 0.003;
      spd[i * 3 + 1] = (rand() - 0.5) * 0.003;
      spd[i * 3 + 2] = (rand() - 0.5) * 0.003 - 0.002;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();

    // Warp factors: speeds multiply dynamically on success
    const warpMult = view === "success" ? 15.0 : 1.0;

    // Apply constant orbital rotation to the entire particle field (no jitter, matches rings)
    pointsRef.current.rotation.y = time * 0.04 * warpMult * config.orbitSpeedMult;
    pointsRef.current.rotation.x = time * 0.012 * warpMult * config.orbitSpeedMult;
  });

  const isDark = resolvedTheme === "dark";
  const particleColor = isDark ? "#a5b4fc" : "#475569"; // Light lavender vs steel blue

  // Create a high-quality soft circular texture for rounded particles
  const circleTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      // Soft radial gradient for a beautiful glow effect
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.85)");
      gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.35)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color={particleColor}
        transparent
        opacity={isDark ? 0.45 : 0.6}
        sizeAttenuation
        depthWrite={false}
        map={circleTexture || undefined}
        blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}
