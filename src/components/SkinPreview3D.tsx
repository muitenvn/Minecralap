import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  animatePlayerRig,
  buildMinecraftPlayerRig,
  PlayerRig,
  updateRigArmorVisuals,
} from '../game/playerSkin';
import { ItemStack, PlayerSkinConfig } from '../game/types';

interface SkinPreview3DProps {
  skin: PlayerSkinConfig;
  armor?: (ItemStack | null)[];
  walking?: boolean;
  height?: number;
  interactive?: boolean;
  className?: string;
}

export const SkinPreview3D: React.FC<SkinPreview3DProps> = ({
  skin,
  armor,
  walking = true,
  height = 240,
  interactive = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<PlayerRig | null>(null);
  const rotYRef = useRef(0.38);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const walkingRef = useRef(walking);
  walkingRef.current = walking;

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = Math.max(80, el.clientWidth || 160);
    const h = Math.max(100, height);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 30);
    camera.position.set(0, 1.05, 3.35);
    camera.lookAt(0, 0.92, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x3b2f42, 0.9);
    const key = new THREE.DirectionalLight(0xfff5dc, 1.35);
    key.position.set(2.5, 4.2, 3.2);
    const rim = new THREE.DirectionalLight(0x2dd4bf, 0.45);
    rim.position.set(-2.5, 2.0, -2.5);
    scene.add(hemi, key, rim);

    // Subtle pedestal block
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.76, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x262133, roughness: 0.7, metalness: 0.25 }),
    );
    pedestal.position.y = -0.05;
    scene.add(pedestal);

    const rig = buildMinecraftPlayerRig(skin);
    if (armor) updateRigArmorVisuals(rig, armor);
    scene.add(rig.root);
    rigRef.current = rig;

    let rafId = 0;
    let t = 0;
    let prev = performance.now();
    let disposed = false;

    const loop = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      t += dt;

      if (!draggingRef.current) {
        rotYRef.current += dt * 0.42;
      }
      rig.root.rotation.y = rotYRef.current;

      animatePlayerRig(rig, t, {
        walkPhase: walkingRef.current ? t * 4.4 : 0,
        moveSpeed: walkingRef.current ? 3.2 : 0,
        headPitch: Math.sin(t * 1.2) * 0.08,
        sneaking: false,
        handSwing: 0,
        flying: false,
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => {
      if (!el || disposed) return;
      const nw = Math.max(80, el.clientWidth || w);
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      rig.dispose();
      pedestal.geometry.dispose();
      (pedestal.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [skin, height, armor]);

  return (
    <div
      ref={mountRef}
      style={{ height }}
      onPointerDown={
        interactive
          ? (e) => {
              draggingRef.current = true;
              lastXRef.current = e.clientX;
              e.currentTarget.setPointerCapture(e.pointerId);
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              if (!draggingRef.current) return;
              const dx = e.clientX - lastXRef.current;
              lastXRef.current = e.clientX;
              rotYRef.current += dx * 0.014;
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (e) => {
              draggingRef.current = false;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }
          : undefined
      }
      className={`w-full overflow-hidden touch-none ${interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
    />
  );
};
