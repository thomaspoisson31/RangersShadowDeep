import { describe, it, expect } from 'vitest';
import { findMatchingSTLAsset, type STLReleaseAsset } from '../utils/stlLoader';

describe('stlLoader matching logic', () => {
  const sampleAssets: STLReleaseAsset[] = [
    { name: 'Albatros.stl', baseName: 'albatros', downloadUrl: 'https://example.com/Albatros.stl' },
    { name: 'Elwyriel.stl', baseName: 'elwyriel', downloadUrl: 'https://example.com/Elwyriel.stl' },
    { name: 'Korvo.stl', baseName: 'korvo', downloadUrl: 'https://example.com/Korvo.stl' },
    { name: 'Ravyk.stl', baseName: 'ravyk', downloadUrl: 'https://example.com/Ravyk.stl' },
  ];

  it('matches exact name case-insensitively', () => {
    const match = findMatchingSTLAsset('Albatros', sampleAssets);
    expect(match).not.toBeNull();
    expect(match?.baseName).toBe('albatros');
  });

  it('matches token names containing the STL baseName', () => {
    const match = findMatchingSTLAsset('Ranger Elwyriel', sampleAssets);
    expect(match).not.toBeNull();
    expect(match?.baseName).toBe('elwyriel');
  });

  it('matches partial name Korvo', () => {
    const match = findMatchingSTLAsset('Korvo the Silent', sampleAssets);
    expect(match).not.toBeNull();
    expect(match?.baseName).toBe('korvo');
  });

  it('returns null when no match exists', () => {
    const match = findMatchingSTLAsset('Giant Spider', sampleAssets);
    expect(match).toBeNull();
  });
});
