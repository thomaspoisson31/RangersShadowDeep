import type { TerrainSetupItem } from '../types/gameData';
import type { TerrainObject, TerrainShape } from '../types/gameState';

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Calculates real (X, Y) inch coordinates and geometries for all terrain items in a scenario
 */
export function calculateTerrainInstances(
  setupItems: TerrainSetupItem[] | undefined,
  boardDimensions: { widthInches: number; lengthInches: number }
): TerrainObject[] {
  if (!setupItems || setupItems.length === 0) return [];

  const instances: TerrainObject[] = [];
  const { widthInches, lengthInches } = boardDimensions;

  setupItems.forEach((item, index) => {
    const baseId = item.id || `terrain-${index + 1}`;
    const baseName = item.name || item.type || `Terrain ${index + 1}`;
    const properties = item.properties ? { ...item.properties } : {};
    const pos = item.position;

    const dims = item.dimensions_inches || {};
    const defaultWidth = dims.width || dims.outer_width || 4.0;
    const defaultLength = dims.length || dims.outer_length || 4.0;
    const defaultRadius = dims.radius || 2.0;
    const shape: TerrainShape = (item.shape as TerrainShape) || (dims.radius ? 'circle' : 'box');

    if (!pos) {
      // Default fixed fallback
      instances.push({
        id: baseId,
        name: baseName,
        type: item.type,
        shape,
        x: widthInches / 2,
        y: lengthInches / 2,
        widthInches: defaultWidth,
        lengthInches: defaultLength,
        radiusInches: defaultRadius,
        rotationDegrees: 0,
        properties,
      });
      return;
    }

    switch (pos.type) {
      case 'fixed_coordinates': {
        instances.push({
          id: baseId,
          name: baseName,
          type: item.type,
          shape,
          x: pos.x_inches,
          y: pos.y_inches,
          widthInches: defaultWidth,
          lengthInches: defaultLength,
          radiusInches: defaultRadius,
          rotationDegrees: pos.rotation_degrees || 0,
          properties,
        });
        break;
      }

      case 'radial_distribution': {
        const origin = pos.origin || { x_inches: widthInches / 2, y_inches: lengthInches / 2 };
        const radius = pos.radius_inches || 10.0;
        const angleDeg = pos.angle_degrees ?? 0.0;
        const angleRad = (angleDeg * Math.PI) / 180;

        const x = origin.x_inches + radius * Math.cos(angleRad);
        const y = origin.y_inches + radius * Math.sin(angleRad);

        instances.push({
          id: baseId,
          name: baseName,
          type: item.type,
          shape,
          x: Math.max(1, Math.min(widthInches - 1, x)),
          y: Math.max(1, Math.min(lengthInches - 1, y)),
          widthInches: defaultWidth,
          lengthInches: defaultLength,
          radiusInches: defaultRadius,
          rotationDegrees: angleDeg,
          properties,
        });
        break;
      }

      case 'edge_offset': {
        const edge = pos.edge || 'south';
        const dist = pos.distance_from_edge_inches || 2.0;
        const offset = pos.offset_along_edge_inches ?? (edge === 'north' || edge === 'south' ? widthInches / 2 : lengthInches / 2);

        let x = widthInches / 2;
        let y = lengthInches / 2;

        if (edge === 'north') {
          x = offset;
          y = dist;
        } else if (edge === 'south') {
          x = offset;
          y = lengthInches - dist;
        } else if (edge === 'east') {
          x = widthInches - dist;
          y = offset;
        } else if (edge === 'west') {
          x = dist;
          y = offset;
        }

        instances.push({
          id: baseId,
          name: baseName,
          type: item.type,
          shape,
          x,
          y,
          widthInches: defaultWidth,
          lengthInches: defaultLength,
          radiusInches: defaultRadius,
          rotationDegrees: 0,
          properties,
        });
        break;
      }

      case 'line_segment': {
        const start = pos.start_point || { x_inches: 0, y_inches: lengthInches / 2 };
        const end = pos.end_point || { x_inches: widthInches, y_inches: lengthInches / 2 };
        const lineW = pos.width_inches || dims.width || 4.0;

        const centerX = (start.x_inches + end.x_inches) / 2;
        const centerY = (start.y_inches + end.y_inches) / 2;
        const dx = end.x_inches - start.x_inches;
        const dy = end.y_inches - start.y_inches;
        const lineLen = Math.hypot(dx, dy);
        const rot = (Math.atan2(dy, dx) * 180) / Math.PI;

        instances.push({
          id: baseId,
          name: baseName,
          type: item.type,
          shape: 'line',
          x: centerX,
          y: centerY,
          widthInches: lineW,
          lengthInches: lineLen,
          radiusInches: lineW / 2,
          rotationDegrees: rot,
          endX: end.x_inches,
          endY: end.y_inches,
          properties,
        });
        break;
      }

      case 'procedural_scatter': {
        const minCount = pos.count?.min ?? 6;
        const maxCount = pos.count?.max ?? 10;
        const count = Math.floor((minCount + maxCount) / 2);
        const bounds = pos.zone_bounds || {
          x_min_inches: 2.0,
          x_max_inches: widthInches - 2.0,
          y_min_inches: 2.0,
          y_max_inches: lengthInches - 2.0,
        };
        const minSep = pos.min_separation_inches || 3.0;

        const elements = properties.elements || [
          { type: 'tree', shape: 'circle', radius_inches: 1.5, blocks_movement: true, blocks_los: true },
          { type: 'rock', shape: 'box', width_inches: 2.0, length_inches: 2.0, rough_ground: true, blocks_movement: false },
        ];

        const placedPoints: { x: number; y: number }[] = [];

        for (let i = 0; i < count; i++) {
          let placed = false;
          let attempts = 0;

          while (!placed && attempts < 30) {
            attempts++;
            // Use deterministic grid-like pseudo random
            const rx = bounds.x_min_inches + ((i * 7.3 + attempts * 3.7) % 1) * (bounds.x_max_inches - bounds.x_min_inches);
            const ry = bounds.y_min_inches + ((i * 11.1 + attempts * 5.3) % 1) * (bounds.y_max_inches - bounds.y_min_inches);

            const tooClose = placedPoints.some((p) => Math.hypot(p.x - rx, p.y - ry) < minSep);
            if (!tooClose) {
              placedPoints.push({ x: rx, y: ry });
              placed = true;

              const elem = elements[i % elements.length];
              instances.push({
                id: `${baseId}-scatter-${i + 1}`,
                name: `${baseName} #${i + 1}`,
                type: elem.type || item.type,
                shape: (elem.shape as TerrainShape) || 'circle',
                x: Math.round(rx * 10) / 10,
                y: Math.round(ry * 10) / 10,
                widthInches: elem.width_inches || defaultWidth,
                lengthInches: elem.length_inches || defaultLength,
                radiusInches: elem.radius_inches || defaultRadius,
                rotationDegrees: 0,
                properties: {
                  ...properties,
                  blocks_movement: elem.blocks_movement ?? properties.blocks_movement ?? false,
                  blocks_los: elem.blocks_los ?? properties.blocks_los ?? false,
                  rough_ground: elem.rough_ground ?? properties.rough_ground ?? true,
                },
              });
            }
          }
        }
        break;
      }
    }
  });

  return instances;
}

/**
 * Distance from point C to line segment AB
 */
export function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return Math.hypot(px - ax, py - ay);

  const apx = px - ax;
  const apy = py - ay;
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));

  const projx = ax + t * abx;
  const projy = ay + t * aby;
  return Math.hypot(px - projx, py - projy);
}

/**
 * Checks if line segment AB intersects a circle centered at C with radius R
 */
export function segmentIntersectsCircle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  r: number
): boolean {
  return pointToSegmentDistance(cx, cy, ax, ay, bx, by) <= r;
}

/**
 * Checks if line segment AB intersects an Axis-Aligned Bounding Box
 */
export function segmentIntersectsAABB(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean {
  // Check if either endpoint is inside AABB
  if (ax >= minX && ax <= maxX && ay >= minY && ay <= maxY) return true;
  if (bx >= minX && bx <= maxX && by >= minY && by <= maxY) return true;

  // Check line segment intersection with 4 sides
  const sides: LineSegment[] = [
    { x1: minX, y1: minY, x2: maxX, y2: minY },
    { x1: maxX, y1: minY, x2: maxX, y2: maxY },
    { x1: maxX, y1: maxY, x2: minX, y2: maxY },
    { x1: minX, y1: maxY, x2: minX, y2: minY },
  ];

  for (const s of sides) {
    if (lineSegmentsIntersect(ax, ay, bx, by, s.x1, s.y1, s.x2, s.y2)) return true;
  }
  return false;
}

/**
 * Checks line segment (A1-A2) intersection with line segment (B1-B2)
 */
export function lineSegmentsIntersect(
  a1x: number,
  a1y: number,
  a2x: number,
  a2y: number,
  b1x: number,
  b1y: number,
  b2x: number,
  b2y: number
): boolean {
  function ccw(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number): boolean {
    return (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
  }
  return (
    ccw(a1x, a1y, b1x, b1y, b2x, b2y) !== ccw(a2x, a2y, b1x, b1y, b2x, b2y) &&
    ccw(a1x, a1y, a2x, a2y, b1x, b1y) !== ccw(a1x, a1y, a2x, a2y, b2x, b2y)
  );
}

/**
 * Checks if line segment AB intersects a TerrainObject
 */
export function segmentIntersectsTerrain(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  terrain: TerrainObject
): boolean {
  // If door is open, it does not block
  if (terrain.properties.interactive_door?.isOpen) {
    return false;
  }

  if (terrain.shape === 'circle') {
    return segmentIntersectsCircle(ax, ay, bx, by, terrain.x, terrain.y, terrain.radiusInches);
  } else if (terrain.shape === 'line') {
    return pointToSegmentDistance(terrain.x, terrain.y, ax, ay, bx, by) <= (terrain.widthInches / 2);
  } else {
    // 'box' or 'zone'
    // Transform A and B to local box space
    const cosR = Math.cos((-terrain.rotationDegrees * Math.PI) / 180);
    const sinR = Math.sin((-terrain.rotationDegrees * Math.PI) / 180);

    const dax = ax - terrain.x;
    const day = ay - terrain.y;
    const dbx = bx - terrain.x;
    const dby = by - terrain.y;

    const lax = dax * cosR - day * sinR;
    const lay = dax * sinR + day * cosR;
    const lbx = dbx * cosR - dby * sinR;
    const lby = dbx * sinR + dby * cosR;

    const halfW = terrain.widthInches / 2;
    const halfL = terrain.lengthInches / 2;

    return segmentIntersectsAABB(lax, lay, lbx, lby, -halfW, halfW, -halfL, halfL);
  }
}

/**
 * Line of Sight check between two points
 */
export function checkLineOfSight(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  terrains: TerrainObject[]
): { hasLoS: boolean; blockingTerrain?: TerrainObject; coverBonus: number } {
  let hasLoS = true;
  let blockingTerrain: TerrainObject | undefined = undefined;
  let coverBonus = 0;

  for (const t of terrains) {
    if (segmentIntersectsTerrain(p1.x, p1.y, p2.x, p2.y, t)) {
      if (t.properties.blocks_los) {
        hasLoS = false;
        blockingTerrain = t;
        break;
      } else {
        // Light cover / obstacle
        coverBonus += 2;
      }
    }
  }

  return { hasLoS, blockingTerrain, coverBonus };
}

/**
 * Checks movement path blocking and rough ground penalties
 */
export function checkMovementPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  terrains: TerrainObject[]
): { isBlocked: boolean; isRoughGround: boolean; blockingTerrain?: TerrainObject } {
  let isBlocked = false;
  let isRoughGround = false;
  let blockingTerrain: TerrainObject | undefined = undefined;

  for (const t of terrains) {
    if (segmentIntersectsTerrain(p1.x, p1.y, p2.x, p2.y, t)) {
      if (t.properties.blocks_movement && !t.properties.interactive_door?.isOpen) {
        isBlocked = true;
        blockingTerrain = t;
        break;
      }
      if (t.properties.rough_ground) {
        isRoughGround = true;
      }
    }
  }

  return { isBlocked, isRoughGround, blockingTerrain };
}
