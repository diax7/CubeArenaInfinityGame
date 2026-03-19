/**
 * SteeringBehavior.js — Seek, flee, avoid, and wander movement logic.
 *
 * Provides basic 2D steering forces for AI snake movement.
 * All methods return a {x, y} direction vector (not normalized — caller normalizes).
 *
 * How it works:
 * 1. Seek: returns vector from current position toward target
 * 2. Flee: returns vector from target toward current position (away)
 * 3. Wander: adds gentle random drift to current direction
 * 4. AvoidWalls: steers away from arena boundaries
 *
 * Connected to: AIController.js (combines steering forces into a final direction)
 */

import GameConfig from '../config/GameConfig.js';

/**
 * seek — Steer toward a target position.
 *
 * @param {number} fromX - Current X
 * @param {number} fromZ - Current Z
 * @param {number} toX - Target X
 * @param {number} toZ - Target Z
 * @returns {{x: number, y: number}} - Direction vector (unnormalized)
 */
export function seek(fromX, fromZ, toX, toZ) {
  return { x: toX - fromX, y: toZ - fromZ };
}

/**
 * flee — Steer away from a target position.
 *
 * @param {number} fromX - Current X
 * @param {number} fromZ - Current Z
 * @param {number} fromTargetX - Threat X
 * @param {number} fromTargetZ - Threat Z
 * @returns {{x: number, y: number}} - Direction vector (unnormalized)
 */
export function flee(fromX, fromZ, fromTargetX, fromTargetZ) {
  return { x: fromX - fromTargetX, y: fromZ - fromTargetZ };
}

/**
 * wander — Add a gentle random drift to the current direction.
 * Creates organic movement instead of perfectly straight lines.
 *
 * @param {number} dirX - Current direction X
 * @param {number} dirY - Current direction Y
 * @param {number} strength - How much randomness (0–1)
 * @returns {{x: number, y: number}} - Adjusted direction
 */
export function wander(dirX, dirY, strength = 0.3) {
  const angle = (Math.random() - 0.5) * Math.PI * strength;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: dirX * cos - dirY * sin,
    y: dirX * sin + dirY * cos,
  };
}

/**
 * avoidWalls — Steer away from arena boundaries.
 * Returns a force pushing away from any wall that is within the danger zone.
 *
 * @param {number} x - Current X position
 * @param {number} z - Current Z position
 * @param {number} dangerDist - Distance from wall at which to start avoiding
 * @returns {{x: number, y: number}} - Avoidance force
 */
export function avoidWalls(x, z, dangerDist = 15) {
  const halfSize = GameConfig.arena.size / 2;
  let fx = 0;
  let fy = 0;

  // Push away from each wall if too close
  const distRight = halfSize - x;
  const distLeft = halfSize + x;
  const distBack = halfSize - z;
  const distFront = halfSize + z;

  if (distRight < dangerDist) fx -= (dangerDist - distRight) / dangerDist;
  if (distLeft < dangerDist) fx += (dangerDist - distLeft) / dangerDist;
  if (distBack < dangerDist) fy -= (dangerDist - distBack) / dangerDist;
  if (distFront < dangerDist) fy += (dangerDist - distFront) / dangerDist;

  return { x: fx, y: fy };
}
