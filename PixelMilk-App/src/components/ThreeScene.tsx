import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { Direction, PixelData } from '../types';

export interface ThreeSceneRef {
  getSnapshot: (direction: Direction) => string | null;
}

interface Props {
  spriteData: PixelData | null;
  visible: boolean;
  viewType: 'standard' | 'isometric';
}

export const ThreeScene = forwardRef<ThreeSceneRef, Props>(({ spriteData, visible, viewType }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = 256; 
    const height = 256;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Orthographic Camera setup for pixel-perfect logic
    const frustumSize = 2; 
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    // Initial position
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    
    // Ensure canvas scales with container while maintaining internal resolution
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.imageRendering = 'pixelated';
    
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 2, 5);
    scene.add(dirLight);

    return () => {
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update Mesh when data changes
  useEffect(() => {
    if (!sceneRef.current || !spriteData) return;

    // Clear old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      if (meshRef.current.material instanceof THREE.Material) meshRef.current.material.dispose();
      if (meshRef.current.geometry) meshRef.current.geometry.dispose();
    }

    const { width, height, pixels, normalMap } = spriteData;

    // Create Textures from Data
    const diffuseData = new Uint8Array(width * height * 4);
    const normalData = new Uint8Array(width * height * 4);

    const hexToRGB = (hex: string) => {
       const bigint = parseInt(hex.slice(1), 16);
       return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    pixels.forEach((hex, i) => {
       if (hex === 'transparent' || !hex) {
         diffuseData[i * 4] = 0;
         diffuseData[i * 4 + 1] = 0;
         diffuseData[i * 4 + 2] = 0;
         diffuseData[i * 4 + 3] = 0;
       } else {
         const [r, g, b] = hexToRGB(hex);
         diffuseData[i * 4] = r;
         diffuseData[i * 4 + 1] = g;
         diffuseData[i * 4 + 2] = b;
         diffuseData[i * 4 + 3] = 255;
       }
    });

    normalMap.forEach((hex, i) => {
       if (hex === 'transparent' || !hex) {
         // Default normal (pointing z-up typically, or just flat)
         normalData[i * 4] = 128;
         normalData[i * 4 + 1] = 128;
         normalData[i * 4 + 2] = 255;
         normalData[i * 4 + 3] = 0; // Masked out usually, but for normal map texture we want data
       } else {
         const [r, g, b] = hexToRGB(hex);
         normalData[i * 4] = r;
         normalData[i * 4 + 1] = g;
         normalData[i * 4 + 2] = b;
         normalData[i * 4 + 3] = 255;
       }
    });

    const diffuseTexture = new THREE.DataTexture(diffuseData, width, height, THREE.RGBAFormat);
    diffuseTexture.flipY = true; // Canvas standard is top-left, Textures are bottom-left
    diffuseTexture.magFilter = THREE.NearestFilter;
    diffuseTexture.minFilter = THREE.NearestFilter;
    diffuseTexture.needsUpdate = true;
    diffuseTexture.colorSpace = THREE.SRGBColorSpace;

    const normalTexture = new THREE.DataTexture(normalData, width, height, THREE.RGBAFormat);
    normalTexture.flipY = true;
    normalTexture.magFilter = THREE.NearestFilter;
    normalTexture.minFilter = THREE.NearestFilter;
    normalTexture.needsUpdate = true;
    normalTexture.colorSpace = THREE.LinearSRGBColorSpace;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      map: diffuseTexture,
      normalMap: normalTexture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    sceneRef.current?.add(mesh);

    rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
  }, [spriteData]);

  useImperativeHandle(ref, () => ({
    getSnapshot: (direction: Direction) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !meshRef.current) return null;

      const angleMap: Partial<Record<Direction, number>> = {
        S: 0,
        E: Math.PI / 2,
        N: Math.PI,
        W: -Math.PI / 2,
        SE: Math.PI / 4,
        SW: -Math.PI / 4,
        NE: 3 * Math.PI / 4,
        NW: -3 * Math.PI / 4
      };

      const angle = angleMap[direction] || 0;
      const radius = 5;
      const yOffset = viewType === 'isometric' ? 3 : 0;

      // Orbit logic for Y-axis rotation
      cameraRef.current.position.x = Math.sin(angle) * radius;
      cameraRef.current.position.y = yOffset;
      cameraRef.current.position.z = Math.cos(angle) * radius;
      cameraRef.current.lookAt(0, 0, 0);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return rendererRef.current.domElement.toDataURL('image/png');
    }
  }));

  return (
    <div 
      className={`border-2 border-dashed border-purple-500 rounded-lg overflow-hidden bg-gray-900 ${visible ? 'block' : 'hidden'} mx-auto`}
      style={{ width: '100%', maxWidth: '256px', aspectRatio: '1/1' }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

ThreeScene.displayName = 'ThreeScene';