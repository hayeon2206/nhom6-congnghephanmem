import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

/**
 * Real WebGL sea (Three.js, via the vanta.js WAVES effect) for the auth
 * panel's brand moment — a shaded, lit 3D mesh reacts to the cursor on its
 * own (mouseControls), which reads as actual water instead of the hand-
 * tuned 2D line approximations tried earlier. Kept to this one panel: two
 * WebGL contexts running at once (one per auth side) would cost more GPU
 * than a login screen should spend, and a solid animated mesh sitting
 * directly behind form inputs would hurt readability rather than help it.
 */
export default function VantaWaves({ className, color = 0x1c3f61, backgroundColor = 0x0b1e33, shininess = 22, waveHeight = 28, waveSpeed = 0.85, zoom = 1 }) {
  const containerRef = useRef(null);
  const effectRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return undefined;

    effectRef.current = WAVES({
      el: containerRef.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      color,
      backgroundColor,
      shininess,
      waveHeight,
      waveSpeed,
      zoom,
    });

    return () => {
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, [reducedMotion, color, backgroundColor, shininess, waveHeight, waveSpeed, zoom]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
