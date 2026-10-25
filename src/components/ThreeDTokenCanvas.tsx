import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Token, BoardConfig } from '../types/gameState';
import { getReleaseSTLAssets, findMatchingSTLAsset, loadSTLGeometry, type STLReleaseAsset } from '../utils/stlLoader';

interface ThreeDTokenCanvasProps {
  tokens: Token[];
  boardConfig: BoardConfig;
  selectedTokenId: string | null;
  stagePos: { x: number; y: number };
  stageScale: number;
  onSelectToken?: (id: string | null) => void;
  onLoadedStlTokenIdsChange?: (loadedIds: Set<string>) => void;
}

export const ThreeDTokenCanvas: React.FC<ThreeDTokenCanvasProps> = ({
  tokens,
  boardConfig,
  selectedTokenId,
  stagePos,
  stageScale,
  onSelectToken,
  onLoadedStlTokenIdsChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [releaseAssets, setReleaseAssets] = useState<STLReleaseAsset[]>([]);

  // Fetch release assets on mount
  useEffect(() => {
    let isMounted = true;
    getReleaseSTLAssets().then((assets) => {
      if (isMounted) {
        setReleaseAssets(assets);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const ppi = boardConfig.pixelsPerInch;
  const boardWidthPx = boardConfig.widthFeet * 12 * ppi;
  const boardLengthPx = boardConfig.lengthFeet * 12 * ppi;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || releaseAssets.length === 0) return;

    // Filter tokens that have a matching STL asset
    const stlTokens = tokens.filter((t) => findMatchingSTLAsset(t.name, releaseAssets) !== null);
    if (stlTokens.length === 0) {
      if (onLoadedStlTokenIdsChange) onLoadedStlTokenIdsChange(new Set());
      return;
    }

    // Three.js Scene Setup
    const scene = new THREE.Scene();

    // Setup OrthographicCamera matching pixel coordinates of VTT stage
    const camera = new THREE.OrthographicCamera(
      0,
      boardWidthPx,
      0,
      boardLengthPx,
      -1000,
      1000
    );
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(boardWidthPx, boardLengthPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(boardWidthPx / 2, -boardLengthPx / 2, 600);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.8);
    fillLight.position.set(-boardWidthPx / 2, boardLengthPx, 400);
    scene.add(fillLight);

    const meshesMap = new Map<string, THREE.Mesh>();
    const loadedTokenIds = new Set<string>();
    let animationFrameId: number;

    // Load geometries and populate scene
    let isSubscribed = true;

    const loadMeshes = async () => {
      for (const token of stlTokens) {
        const asset = findMatchingSTLAsset(token.name, releaseAssets);
        if (!asset) continue;

        try {
          const geometry = await loadSTLGeometry(asset.downloadUrl);
          if (!isSubscribed) return;

          const targetSizePx = token.radiusInches * 2 * ppi * 1.6; // 3D model target height in px

          // Compute dimensions to scale geometry proportionally to token base size
          geometry.computeBoundingBox();
          const bbox = geometry.boundingBox;
          let scale = 1.0;
          if (bbox) {
            const sizeX = bbox.max.x - bbox.min.x;
            const sizeY = bbox.max.y - bbox.min.y;
            const sizeZ = bbox.max.z - bbox.min.z;
            const maxDim = Math.max(sizeX, sizeY, sizeZ);
            if (maxDim > 0) {
              scale = targetSizePx / maxDim;
            }
          }

          const tokenColor = token.color || '#d97706';
          const isSelected = selectedTokenId === token.id;

          const material = new THREE.MeshStandardMaterial({
            color: isSelected ? new THREE.Color('#fbbf24') : new THREE.Color(tokenColor),
            roughness: 0.35,
            metalness: 0.2,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.set(scale, scale, scale);

          // Rotate mesh to stand upright on board
          mesh.rotation.x = Math.PI / 2;

          // Position mesh at token (x, y) coordinates
          const posX = token.x * ppi;
          const posY = token.y * ppi;
          mesh.position.set(posX, posY, targetSizePx / 2);

          scene.add(mesh);
          meshesMap.set(token.id, mesh);
          loadedTokenIds.add(token.id);

          if (onLoadedStlTokenIdsChange) {
            onLoadedStlTokenIdsChange(new Set(loadedTokenIds));
          }
        } catch (err) {
          console.error(`Failed to load STL geometry for token ${token.name}:`, err);
        }
      }
    };

    loadMeshes();

    // Render loop
    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Click handler for selection
    const handleCanvasClick = (event: MouseEvent) => {
      if (!onSelectToken) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      let closestTokenId: string | null = null;
      let minDistance = Infinity;

      stlTokens.forEach((token) => {
        const tokenPxX = token.x * ppi;
        const tokenPxY = token.y * ppi;
        const dist = Math.hypot(clickX - tokenPxX, clickY - tokenPxY);
        const radiusPx = token.radiusInches * ppi;
        if (dist <= radiusPx * 1.8 && dist < minDistance) {
          minDistance = dist;
          closestTokenId = token.id;
        }
      });

      if (closestTokenId) {
        onSelectToken(closestTokenId);
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Cleanup
    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', handleCanvasClick);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      meshesMap.forEach((mesh) => {
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      scene.clear();
    };
  }, [tokens, boardConfig, selectedTokenId, releaseAssets, ppi, boardWidthPx, boardLengthPx, onSelectToken]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 pointer-events-auto z-10 origin-top-left"
      style={{
        width: `${boardWidthPx}px`,
        height: `${boardLengthPx}px`,
        transform: `translate(${stagePos.x}px, ${stagePos.y}px) scale(${stageScale})`,
        transformOrigin: '0 0',
      }}
    />
  );
};
