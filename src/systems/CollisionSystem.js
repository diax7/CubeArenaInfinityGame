/**
 * CollisionSystem.js — Collision detection using spatial hashing.
 *
 * Efficiently detects overlapping entities by dividing the arena into
 * a grid of cells. Only checks collisions within same/adjacent cells.
 * This reduces O(n²) collision checks to O(n) for large entity counts.
 *
 * How it works:
 * 1. Arena is divided into a grid of cells (configurable cell size)
 * 2. Each frame, entities register themselves in their current cell
 * 3. Collision queries only check the cell of interest + its 8 neighbors
 * 4. Supports sphere-sphere collision testing
 *
 * Connected to: Game.js (called each frame), CombatSystem.js (snake vs snake),
 *               SpawnSystem.js (ground cube collisions)
 *
 * Note: For Phase 2, ground cube collision is handled directly in SpawnSystem
 * using simple distance checks (fast enough for 500 cubes). This spatial hash
 * will be used in Phase 3 when AI snakes are added and O(n²) becomes a problem.
 */

import GameConfig from '../config/GameConfig.js';

export default class CollisionSystem {
  constructor() {
    this.cellSize = GameConfig.performance.spatialHashCellSize;
    this.grid = new Map();
  }

  /**
   * clear — Reset the spatial hash grid for a new frame.
   */
  clear() {
    this.grid.clear();
  }

  /**
   * _getKey — Convert a world position to a grid cell key.
   *
   * @param {number} x - World X
   * @param {number} z - World Z
   * @returns {string} - Grid cell key like "3,5"
   */
  _getKey(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  /**
   * insert — Register an entity in the spatial hash.
   *
   * @param {object} entity - Entity with {id, x, z, radius, data}
   */
  insert(entity) {
    const key = this._getKey(entity.x, entity.z);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }

  /**
   * query — Find all entities near a point (within the same or adjacent cells).
   *
   * @param {number} x - Query X position
   * @param {number} z - Query Z position
   * @param {number} radius - Query radius
   * @returns {Array<object>} - Nearby entities
   */
  query(x, z, radius) {
    const results = [];
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);

    // Check 3×3 neighborhood
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const entity of cell) {
            // Sphere-sphere overlap check
            const distX = x - entity.x;
            const distZ = z - entity.z;
            const distSq = distX * distX + distZ * distZ;
            const combinedR = radius + entity.radius;
            if (distSq < combinedR * combinedR) {
              results.push(entity);
            }
          }
        }
      }
    }

    return results;
  }
}
