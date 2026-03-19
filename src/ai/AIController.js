/**
 * AIController.js — AI decision making and behavior.
 *
 * Controls AI snake movement, target selection, and behavior state.
 * Decisions run every ~200ms for performance. Each frame, the current
 * steering direction is smoothly applied to the snake.
 *
 * How it works:
 * 1. Every decisionInterval ms, scan nearby entities and pick a behavior
 * 2. Behaviors: seek food, chase weaker enemy, avoid stronger enemy, wander, flee player (fear)
 * 3. Combine steering forces: wall avoidance + chosen behavior + wander drift
 * 4. Set the resulting direction on the snake
 *
 * Connected to: Snake.js (sets direction), SteeringBehavior.js (steering math),
 *               SpawnSystem.js (ground cube positions), Game.js (all snakes list)
 */

import GameConfig from '../config/GameConfig.js';
import { seek, flee, wander, avoidWalls } from './SteeringBehavior.js';

export default class AIController {
  /**
   * @param {object} snake - The AI Snake instance this controller drives
   */
  constructor(snake) {
    this.snake = snake;

    // Decision timer — only recalculate target every N ms
    this.decisionTimer = Math.random() * GameConfig.ai.decisionInterval;
    this.decisionInterval = GameConfig.ai.decisionInterval;

    // Current steering target (set by decision logic)
    this.targetX = 0;
    this.targetZ = 0;
    this.behavior = 'wander'; // Current behavior label

    // Start the snake moving immediately with random direction
    const angle = Math.random() * Math.PI * 2;
    snake.setTargetDirection(Math.cos(angle), Math.sin(angle));
    snake.hasReceivedInput = true;
  }

  /**
   * update — Called every frame. Runs decision logic at intervals,
   * applies steering every frame.
   *
   * @param {number} dt - Delta time in seconds
   * @param {object} context - { player, aiSnakes, spawnSystem, fearMode }
   */
  update(dt, context) {
    if (!this.snake.isAlive) return;

    // Tick decision timer
    this.decisionTimer -= dt * 1000;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = this.decisionInterval + Math.random() * 50;
      this._makeDecision(context);
    }

    // Apply steering every frame
    this._applySteering(context);
  }

  /**
   * _makeDecision — Choose what the AI should do right now.
   * Scans nearby entities and picks the highest-priority behavior.
   *
   * Priority (Fear OFF):
   * 1. Avoid bigger enemy snakes within seek radius
   * 2. Chase smaller enemy snakes within seek radius
   * 3. Seek nearest edible ground cube
   * 4. Wander
   *
   * Priority (Fear ON — flee from player):
   * 1. Flee from player
   * 2. Still eat ground cubes opportunistically
   * 3. Still fight other AI normally
   *
   * @param {object} context
   */
  _makeDecision(context) {
    const { player, aiSnakes, spawnSystem, fearMode } = context;
    const pos = this.snake.getPosition();
    const myPower = this.snake.headPower;
    const seekR = GameConfig.ai.seekRadius;
    const fleeR = GameConfig.ai.fleeRadius;

    // If fear mode is on, flee from player
    if (fearMode && player.isAlive) {
      const pp = player.getPosition();
      const distToPlayer = Math.sqrt((pos.x - pp.x) ** 2 + (pos.z - pp.z) ** 2);
      if (distToPlayer < fleeR) {
        this.behavior = 'flee-player';
        this.targetX = pp.x;
        this.targetZ = pp.z;
        return;
      }
    }

    // Check for dangerous enemies (bigger heads) — avoid them
    let closestThreat = null;
    let closestThreatDist = Infinity;

    // Check for prey (smaller heads) — chase them
    let closestPrey = null;
    let closestPreyDist = Infinity;

    // Scan all other snakes (player + other AIs)
    const allSnakes = [player, ...aiSnakes].filter(s => s !== this.snake && s.isAlive);

    for (const other of allSnakes) {
      const op = other.getPosition();
      const dist = Math.sqrt((pos.x - op.x) ** 2 + (pos.z - op.z) ** 2);

      if (dist > seekR) continue;

      if (other.headPower > myPower) {
        // Threat — avoid
        if (dist < closestThreatDist) {
          closestThreatDist = dist;
          closestThreat = other;
        }
      } else if (other.headPower < myPower) {
        // Prey — chase
        if (dist < closestPreyDist) {
          closestPreyDist = dist;
          closestPrey = other;
        }
      }
    }

    // Priority 1: Avoid threats
    if (closestThreat && closestThreatDist < seekR * 0.6) {
      const tp = closestThreat.getPosition();
      this.behavior = 'avoid';
      this.targetX = tp.x;
      this.targetZ = tp.z;
      return;
    }

    // Priority 2: Chase prey (with some randomness — not always chase)
    if (closestPrey && Math.random() > 0.3) {
      const pp = closestPrey.getPosition();
      this.behavior = 'chase';
      this.targetX = pp.x;
      this.targetZ = pp.z;
      return;
    }

    // Priority 3: Seek nearest edible ground cube
    const nearestFood = this._findNearestFood(pos.x, pos.z, myPower, spawnSystem, seekR);
    if (nearestFood) {
      this.behavior = 'seek-food';
      this.targetX = nearestFood.x;
      this.targetZ = nearestFood.z;
      return;
    }

    // Priority 4: Wander
    this.behavior = 'wander';
  }

  /**
   * _findNearestFood — Find the closest edible ground cube.
   *
   * @param {number} x - AI position X
   * @param {number} z - AI position Z
   * @param {number} myPower - AI head power
   * @param {object} spawnSystem - SpawnSystem instance
   * @param {number} radius - Search radius
   * @returns {null|{x: number, z: number}} - Nearest food position or null
   */
  _findNearestFood(x, z, myPower, spawnSystem, radius) {
    let bestDist = radius * radius;
    let bestFood = null;

    for (let i = 0; i < spawnSystem.maxCubes; i++) {
      if (!spawnSystem.active[i]) continue;
      if (spawnSystem.powers[i] > myPower) continue; // Can't eat bigger

      const dx = x - spawnSystem.posX[i];
      const dz = z - spawnSystem.posZ[i];
      const distSq = dx * dx + dz * dz;

      if (distSq < bestDist) {
        bestDist = distSq;
        bestFood = { x: spawnSystem.posX[i], z: spawnSystem.posZ[i] };
      }
    }

    return bestFood;
  }

  /**
   * _applySteering — Compute and apply final movement direction each frame.
   * Combines the chosen behavior direction with wall avoidance and wander.
   *
   * @param {object} context
   */
  _applySteering(context) {
    const pos = this.snake.getPosition();
    let steerX = 0;
    let steerZ = 0;

    // Compute behavior-specific steering
    switch (this.behavior) {
      case 'seek-food':
      case 'chase': {
        const s = seek(pos.x, pos.z, this.targetX, this.targetZ);
        steerX = s.x;
        steerZ = s.y;
        break;
      }
      case 'avoid':
      case 'flee-player': {
        const f = flee(pos.x, pos.z, this.targetX, this.targetZ);
        steerX = f.x;
        steerZ = f.y;
        break;
      }
      case 'wander':
      default: {
        const w = wander(this.snake.direction.x, this.snake.direction.y, 0.4);
        steerX = w.x;
        steerZ = w.y;
        break;
      }
    }

    // Add wall avoidance (high priority — always active)
    const wallForce = avoidWalls(pos.x, pos.z, 15);
    steerX += wallForce.x * 3;
    steerZ += wallForce.y * 3;

    // Add gentle wander noise for organic movement (except when already wandering)
    if (this.behavior !== 'wander') {
      const drift = wander(steerX, steerZ, 0.1);
      steerX = drift.x;
      steerZ = drift.y;
    }

    // Normalize and set direction on the snake
    const len = Math.sqrt(steerX * steerX + steerZ * steerZ);
    if (len > 0.01) {
      this.snake.setTargetDirection(steerX / len, steerZ / len);
    }
  }
}
