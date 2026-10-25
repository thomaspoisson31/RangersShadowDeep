import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export interface STLReleaseAsset {
  name: string;
  baseName: string; // e.g. "albatros"
  downloadUrl: string;
}

const RELEASE_API_URL = 'https://api.github.com/repos/thomaspoisson31/RangersShadowDeep/releases/tags/V1.0';

// Fallback release assets if GitHub API is offline or rate-limited
const FALLBACK_ASSETS: STLReleaseAsset[] = [
  { name: 'Albatros.stl', baseName: 'albatros', downloadUrl: 'https://github.com/thomaspoisson31/RangersShadowDeep/releases/download/V1.0/Albatros.stl' },
  { name: 'Elwyriel.stl', baseName: 'elwyriel', downloadUrl: 'https://github.com/thomaspoisson31/RangersShadowDeep/releases/download/V1.0/Elwyriel.stl' },
  { name: 'Korvo.stl', baseName: 'korvo', downloadUrl: 'https://github.com/thomaspoisson31/RangersShadowDeep/releases/download/V1.0/Korvo.stl' },
  { name: 'Ravyk.stl', baseName: 'ravyk', downloadUrl: 'https://github.com/thomaspoisson31/RangersShadowDeep/releases/download/V1.0/Ravyk.stl' },
];

let cachedReleaseAssets: STLReleaseAsset[] | null = null;
const geometryCache = new Map<string, THREE.BufferGeometry>();
const loadingPromises = new Map<string, Promise<THREE.BufferGeometry>>();

/**
 * Dynamically fetches the list of STL files associated with the V1.0 GitHub release.
 */
export async function getReleaseSTLAssets(): Promise<STLReleaseAsset[]> {
  if (cachedReleaseAssets) {
    return cachedReleaseAssets;
  }

  try {
    const res = await fetch(RELEASE_API_URL);
    if (!res.ok) {
      console.warn('Could not fetch release assets from GitHub API, using fallback list.');
      cachedReleaseAssets = FALLBACK_ASSETS;
      return cachedReleaseAssets;
    }

    const data = await res.json();
    const assets: STLReleaseAsset[] = (data.assets || [])
      .filter((asset: any) => asset.name && asset.name.toLowerCase().endsWith('.stl'))
      .map((asset: any) => {
        const name = asset.name as string;
        const baseName = name.replace(/\.stl$/i, '').toLowerCase();
        return {
          name,
          baseName,
          downloadUrl: asset.browser_download_url as string,
        };
      });

    if (assets.length > 0) {
      cachedReleaseAssets = assets;
    } else {
      cachedReleaseAssets = FALLBACK_ASSETS;
    }
  } catch (e) {
    console.error('Error fetching release STL assets:', e);
    cachedReleaseAssets = FALLBACK_ASSETS;
  }

  return cachedReleaseAssets || FALLBACK_ASSETS;
}

/**
 * Dynamically finds a matching STL asset for a given token name.
 * Matches if the token name is equal to or contains the STL asset baseName (case-insensitive).
 */
export function findMatchingSTLAsset(tokenName: string, availableAssets: STLReleaseAsset[]): STLReleaseAsset | null {
  if (!tokenName) return null;
  const cleanTokenName = tokenName.trim().toLowerCase();

  for (const asset of availableAssets) {
    if (
      cleanTokenName === asset.baseName ||
      cleanTokenName.includes(asset.baseName)
    ) {
      return asset;
    }
  }
  return null;
}

/**
 * Loads an STL file from URL and returns a Three.js BufferGeometry (cached).
 */
export async function loadSTLGeometry(url: string): Promise<THREE.BufferGeometry> {
  if (geometryCache.has(url)) {
    return geometryCache.get(url)!;
  }

  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }

  const loader = new STLLoader();
  const promise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();
        geometry.center(); // Center geometry bounding box
        geometryCache.set(url, geometry);
        loadingPromises.delete(url);
        resolve(geometry);
      },
      undefined,
      (err) => {
        loadingPromises.delete(url);
        reject(err);
      }
    );
  });

  loadingPromises.set(url, promise);
  return promise;
}
