import { describe, it, expect } from 'vitest';
import { findMatchingSTLAsset, type STLReleaseAsset } from '../utils/stlLoader';
import type { Token } from '../types/gameState';

describe('3D Token Canvas STL rendering logic', () => {
  const assets: STLReleaseAsset[] = [
    { name: 'Albatros.stl', baseName: 'albatros', downloadUrl: 'https://example.com/Albatros.stl' },
    { name: 'Elwyriel.stl', baseName: 'elwyriel', downloadUrl: 'https://example.com/Elwyriel.stl' },
    { name: 'Korvo.stl', baseName: 'korvo', downloadUrl: 'https://example.com/Korvo.stl' },
    { name: 'Ravyk.stl', baseName: 'ravyk', downloadUrl: 'https://example.com/Ravyk.stl' },
  ];

  const testTokens: Token[] = [
    {
      id: 't-1',
      name: 'Albatros',
      category: 'ranger',
      x: 10,
      y: 10,
      radiusInches: 0.5,
      status: {},
    },
    {
      id: 't-2',
      name: 'Elwyriel',
      category: 'ranger',
      x: 12,
      y: 12,
      radiusInches: 0.5,
      status: {},
    },
    {
      id: 't-3',
      name: 'Giant Spider',
      category: 'monster',
      x: 15,
      y: 15,
      radiusInches: 0.5,
      status: {},
    },
  ];

  it('identifies tokens with matching release STL models', () => {
    const matchedTokens = testTokens.filter((t) => findMatchingSTLAsset(t.name, assets) !== null);
    expect(matchedTokens.map((t) => t.name)).toEqual(['Albatros', 'Elwyriel']);
  });

  it('falls back to 2D classic token for tokens without STL models', () => {
    const unMatchedTokens = testTokens.filter((t) => findMatchingSTLAsset(t.name, assets) === null);
    expect(unMatchedTokens.map((t) => t.name)).toEqual(['Giant Spider']);
  });
});
