import { describe, it, expect } from 'vitest';
import {
  calculateTerrainInstances,
  checkLineOfSight,
  checkMovementPath,
} from '../utils/terrainUtils';
import type { TerrainSetupItem } from '../types/gameData';

describe('Terrain Utilities and Positioning Algorithms', () => {
  const boardDimensions = { widthInches: 36, lengthInches: 36 };

  it('calculates fixed_coordinates position correctly', () => {
    const items: TerrainSetupItem[] = [
      {
        id: 'house1',
        name: 'House 1',
        type: 'building',
        shape: 'box',
        dimensions_inches: { width: 6, length: 6, height: 4 },
        position: {
          type: 'fixed_coordinates',
          x_inches: 12.0,
          y_inches: 14.0,
          rotation_degrees: 45.0,
        },
        properties: { blocks_movement: true, blocks_los: true },
      },
    ];

    const result = calculateTerrainInstances(items, boardDimensions);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(12.0);
    expect(result[0].y).toBe(14.0);
    expect(result[0].rotationDegrees).toBe(45.0);
    expect(result[0].properties.blocks_los).toBe(true);
  });

  it('calculates radial_distribution position correctly', () => {
    const items: TerrainSetupItem[] = [
      {
        id: 'tree_radial',
        name: 'Radial Tree',
        type: 'tree',
        shape: 'circle',
        position: {
          type: 'radial_distribution',
          origin: { x_inches: 18.0, y_inches: 18.0 },
          radius_inches: 10.0,
          angle_degrees: 0.0,
        },
      },
    ];

    const result = calculateTerrainInstances(items, boardDimensions);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBeCloseTo(28.0, 1);
    expect(result[0].y).toBeCloseTo(18.0, 1);
  });

  it('calculates edge_offset position for north and south edges', () => {
    const items: TerrainSetupItem[] = [
      {
        id: 'camp_south',
        name: 'South Camp',
        type: 'camp',
        position: {
          type: 'edge_offset',
          edge: 'south',
          distance_from_edge_inches: 2.0,
          offset_along_edge_inches: 12.0,
        },
      },
    ];

    const result = calculateTerrainInstances(items, boardDimensions);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(12.0);
    expect(result[0].y).toBe(34.0); // 36 - 2 = 34
  });

  it('calculates line_segment position for rivers/bridges', () => {
    const items: TerrainSetupItem[] = [
      {
        id: 'river1',
        name: 'Enthel River',
        type: 'river',
        shape: 'line',
        position: {
          type: 'line_segment',
          start_point: { x_inches: 0.0, y_inches: 24.0 },
          end_point: { x_inches: 30.0, y_inches: 24.0 },
          width_inches: 4.0,
        },
      },
    ];

    const result = calculateTerrainInstances(items, boardDimensions);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(15.0);
    expect(result[0].y).toBe(24.0);
    expect(result[0].lengthInches).toBe(30.0);
  });

  it('calculates procedural_scatter elements', () => {
    const items: TerrainSetupItem[] = [
      {
        id: 'scatter_forest',
        name: 'Forest Scatter',
        type: 'scatter_group',
        position: {
          type: 'procedural_scatter',
          count: { min: 4, max: 4 },
          zone_bounds: { x_min_inches: 2, x_max_inches: 34, y_min_inches: 2, y_max_inches: 34 },
          min_separation_inches: 2.0,
        },
        properties: { rough_ground: true },
      },
    ];

    const result = calculateTerrainInstances(items, boardDimensions);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].properties.rough_ground).toBe(true);
  });

  it('correctly calculates Line of Sight blockage and cover', () => {
    const terrains = calculateTerrainInstances(
      [
        {
          id: 'wall',
          name: 'Stone Wall',
          type: 'wall',
          shape: 'box',
          dimensions_inches: { width: 10, length: 2 },
          position: { type: 'fixed_coordinates', x_inches: 15, y_inches: 15, rotation_degrees: 0 },
          properties: { blocks_los: true, blocks_movement: true },
        },
      ],
      boardDimensions
    );

    const losBlocked = checkLineOfSight({ x: 15, y: 5 }, { x: 15, y: 25 }, terrains);
    expect(losBlocked.hasLoS).toBe(false);
    expect(losBlocked.blockingTerrain?.id).toBe('wall');

    const losClear = checkLineOfSight({ x: 5, y: 5 }, { x: 5, y: 25 }, terrains);
    expect(losClear.hasLoS).toBe(true);
  });

  it('checks movement path blocking and rough ground', () => {
    const terrains = calculateTerrainInstances(
      [
        {
          id: 'swamp',
          name: 'Swamp Mud',
          type: 'swamp',
          shape: 'box',
          dimensions_inches: { width: 10, length: 10 },
          position: { type: 'fixed_coordinates', x_inches: 15, y_inches: 15, rotation_degrees: 0 },
          properties: { rough_ground: true, blocks_movement: false },
        },
      ],
      boardDimensions
    );

    const moveResult = checkMovementPath({ x: 10, y: 15 }, { x: 20, y: 15 }, terrains);
    expect(moveResult.isBlocked).toBe(false);
    expect(moveResult.isRoughGround).toBe(true);
  });
});
