/**
 * Snake.js — Snake entity class for both player and AI snakes.
 *
 * The snake is a chain of numbered cubes sorted in descending order.
 * Head (index 0) is always the highest value; tail cubes follow with
 * smooth snake-like trailing motion using a position history ring buffer.
 *
 * How it works:
 * 1. The head cube moves toward a target direction each frame
 * 2. A position history records head positions every few frames
 * 3. Each body cube follows by replaying the position history with a delay
 * 4. Smooth turning uses angular interpolation (not instant snapping)
 * 5. Wall collisions stop movement without damage
 *
 * Connected to: Game.js (player input), InputManager.js (direction),
 *               MergeSystem.js (after eating), CombatSystem.js (combat),
 *               AIController.js (AI steering), Cube.js (body cubes)
 */

import * as THREE from 'three';
import Cube from './Cube.js';
import GameConfig from '../config/GameConfig.js';
import { mapRange } from '../utils/MathUtils.js';
import { loadSettings } from '../utils/Storage.js';

export default class Snake {
  /**
   * @param {boolean} isPlayer - True for the player snake, false for AI
   * @param {number} startingPower - Initial head cube power exponent
   * @param {{x: number, z: number}} [startPos] - Starting position (default: center)
   */
  constructor(isPlayer, startingPower, startPos = { x: 0, z: 0 }) {
    this.id = crypto.randomUUID();
    this.isPlayer = isPlayer;
    this.isAlive = true;

    // Mode states (player only)
    this.reverseMode = false;
    this.fearMode = false;

    // Invulnerability after respawn
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;

    // Stats
    this.killCount = 0;
    this.survivalTime = 0;

    // Movement state
    this.direction = new THREE.Vector2(0, -1); // Initial direction: forward (-Z)
    this.targetDirection = new THREE.Vector2(0, -1);
    this.hasReceivedInput = false; // Don't move until first input

    // Calculate speed from settings
    const settings = loadSettings();
    const speedSetting = settings.movementSpeed || GameConfig.speed.default;
    this.speed = mapRange(speedSetting, 1, 100, GameConfig.speed.min, GameConfig.speed.max);

    // If AI, apply speed multiplier (10% slower than player)
    if (!isPlayer) {
      this.speed *= GameConfig.speed.aiMultiplier;
    }

    // Bounce-back state — when hitting a bigger cube, snake pushes back briefly
    this._bounceVelocity = new THREE.Vector2(0, 0);
    this._bounceTimer = 0;

    // Body array — index 0 = head (highest power), sorted descending
    this.body = [];

    // Position history ring buffer for body trailing
    // Each body cube follows the position the cube-ahead-of-it was at N samples ago
    this._positionHistory = [];
    this._historyMaxLength = 2000; // Plenty of history for long snakes

    // Three.js group containing all cube meshes
    this.group = new THREE.Group();

    // Create the initial head cube
    this._createHead(startingPower, startPos);
  }

  /**
   * _createHead — Create the starting head cube at the given position.
   *
   * @param {number} power - Head cube power exponent
   * @param {{x: number, z: number}} pos - World position
   */
  _createHead(power, pos) {
    const cube = new Cube(power);
    cube.setPosition(pos.x, undefined, pos.z);
    this.body.push(cube);
    this.group.add(cube.mesh);

    // Seed position history with starting position
    for (let i = 0; i < this._historyMaxLength; i++) {
      this._positionHistory.push({ x: pos.x, z: pos.z });
    }
  }

  // ── Getters ────────────────────────────────────────────────────────────

  /** Get the head cube (highest value, index 0) */
  get head() {
    return this.body[0];
  }

  /** Get the head's power value */
  get headPower() {
    return this.body.length > 0 ? this.body[0].power : 0;
  }

  /** Get the number of cubes in the snake */
  get length() {
    return this.body.length;
  }

  /** Get the head's world position */
  getPosition() {
    if (this.body.length === 0) return new THREE.Vector3(0, 0, 0);
    return this.body[0].getPosition();
  }

  // ── Movement ───────────────────────────────────────────────────────────

  /**
   * setTargetDirection — Set where the snake wants to go.
   * Called by InputManager (player) or AIController (AI).
   *
   * @param {number} x - X component of direction
   * @param {number} y - Y component of direction (maps to world Z)
   */
  setTargetDirection(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len > 0.01) {
      this.targetDirection.set(x / len, y / len);
      this.hasReceivedInput = true;
    }
  }

  /**
   * update — Called every frame. Moves the head, records position history,
   * and updates body cubes to follow the trail.
   *
   * @param {number} dt - Delta time in seconds
   * @param {function} clampFn - Arena.clampPosition function for wall collision
   */
  update(dt, clampFn) {
    if (!this.isAlive || this.body.length === 0) return;

    // Update survival time
    this.survivalTime += dt;

    // Update invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= dt;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
      }
    }

    // Don't move until the player has given input
    if (!this.hasReceivedInput) return;

    // Step 1: Smooth turning — lerp current direction toward target direction
    this._smoothTurn(dt);

    // Step 2: Move head position
    this._moveHead(dt, clampFn);

    // Step 3: Record position in history
    this._recordPosition();

    // Step 4: Update body cubes to follow the trail
    this._updateBodyPositions();

    // Step 5: Update infinity cube animations
    for (const cube of this.body) {
      cube.update(dt);
    }

    // Step 6: Invulnerability blink effect
    if (this.isInvulnerable) {
      const blink = Math.sin(this.invulnerabilityTimer * 12) > 0;
      this.group.visible = blink;
    } else {
      this.group.visible = true;
    }
  }

  /**
   * _smoothTurn — Gradually rotate current direction toward target direction.
   * Uses angular interpolation for smooth cornering.
   *
   * @param {number} dt - Delta time
   */
  _smoothTurn(dt) {
    const turnSpeed = GameConfig.snake.turnSpeed;
    const t = Math.min(1, turnSpeed * dt);

    // Lerp each component
    this.direction.x += (this.targetDirection.x - this.direction.x) * t;
    this.direction.y += (this.targetDirection.y - this.direction.y) * t;

    // Re-normalize to prevent drift
    const len = this.direction.length();
    if (len > 0.001) {
      this.direction.divideScalar(len);
    }
  }

  /**
   * _moveHead — Move the head cube in the current direction, clamped to arena.
   * Also applies bounce velocity if the snake recently hit a bigger cube.
   *
   * @param {number} dt - Delta time
   * @param {function} clampFn - Arena clamp function
   */
  _moveHead(dt, clampFn) {
    const head = this.body[0];
    const pos = head.getPosition();

    // Calculate base movement
    let moveX = this.direction.x * this.speed * dt;
    let moveZ = this.direction.y * this.speed * dt;

    // Apply bounce velocity if active (overrides normal movement)
    if (this._bounceTimer > 0) {
      this._bounceTimer -= dt;
      // Bounce decays over time
      const decay = Math.max(0, this._bounceTimer / 0.3);
      moveX = this._bounceVelocity.x * decay * dt;
      moveZ = this._bounceVelocity.y * decay * dt;
    }

    const newX = pos.x + moveX;
    const newZ = pos.z + moveZ;

    // Clamp to arena bounds (soft wall collision — no damage)
    const cubeHalf = GameConfig.snake.cubeSize / 2;
    const clamped = clampFn(newX, newZ, cubeHalf);

    head.setPosition(clamped.x, undefined, clamped.z);
  }

  /**
   * applyBounce — Push the snake back from a collision point.
   * Called when the snake hits a cube it can't eat (bigger in normal mode).
   *
   * @param {number} fromX - X position of the obstacle
   * @param {number} fromZ - Z position of the obstacle
   */
  applyBounce(fromX, fromZ) {
    const headPos = this.body[0].getPosition();
    const dx = headPos.x - fromX;
    const dz = headPos.z - fromZ;
    const len = Math.sqrt(dx * dx + dz * dz) || 0.01;

    // Bounce direction: away from the obstacle
    const bounceStrength = this.speed * 3;
    this._bounceVelocity.set((dx / len) * bounceStrength, (dz / len) * bounceStrength);
    this._bounceTimer = 0.3; // 300ms bounce
  }

  /**
   * _recordPosition — Push the current head position into the history buffer.
   * The history is used by body cubes to create the trailing effect.
   */
  _recordPosition() {
    const pos = this.body[0].getPosition();
    this._positionHistory.unshift({ x: pos.x, z: pos.z });

    // Trim history if it exceeds max length
    if (this._positionHistory.length > this._historyMaxLength) {
      this._positionHistory.length = this._historyMaxLength;
    }
  }

  /**
   * _updateBodyPositions — Move each body cube to follow the trail.
   *
   * Each body cube is placed at exactly the touching distance behind the
   * cube ahead of it, following the direction from the position history.
   * This ensures cubes are always touching but never overlapping.
   */
  _updateBodyPositions() {
    const spacing = GameConfig.snake.positionHistoryInterval;

    for (let i = 1; i < this.body.length; i++) {
      const cube = this.body[i];
      const ahead = this.body[i - 1];
      const aheadPos = ahead.getPosition();

      // Exact touching distance = half of each cube's size (edge-to-edge)
      const touchDist = (cube.size + ahead.size) / 2 * GameConfig.snake.bodySpacing;

      // Use position history to determine the DIRECTION this cube should be from the one ahead
      const historyIndex = i * spacing;
      let dirX, dirZ;

      if (historyIndex < this._positionHistory.length) {
        // Direction from ahead cube toward the trail target
        const target = this._positionHistory[historyIndex];
        dirX = target.x - aheadPos.x;
        dirZ = target.z - aheadPos.z;
      } else {
        // Fallback: direction from ahead cube toward current position
        const pos = cube.getPosition();
        dirX = pos.x - aheadPos.x;
        dirZ = pos.z - aheadPos.z;
      }

      const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
      if (len > 0.001) {
        dirX /= len;
        dirZ /= len;
      } else {
        // If no direction, fall back to behind the ahead cube using its movement direction
        dirX = -this.direction.x;
        dirZ = -this.direction.y;
      }

      // Place this cube exactly touchDist away from the ahead cube
      const targetX = aheadPos.x + dirX * touchDist;
      const targetZ = aheadPos.z + dirZ * touchDist;

      // Smooth interpolation to prevent jitter
      const pos = cube.getPosition();
      const lerpFactor = 0.45;
      const nx = pos.x + (targetX - pos.x) * lerpFactor;
      const nz = pos.z + (targetZ - pos.z) * lerpFactor;

      cube.setPosition(nx, undefined, nz);
    }
  }

  // ── Snake Modification ─────────────────────────────────────────────────

  /**
   * insertCube — Add a new cube at the correct sorted position (descending by power).
   *
   * Finds where the cube belongs in the sorted body array, inserts it,
   * and updates its position to match the insertion point.
   *
   * @param {Cube} newCube - The cube to insert
   * @returns {number} - The index where the cube was inserted
   */
  insertCube(newCube) {
    // Find the correct position (body is sorted descending by power)
    let insertIdx = this.body.length; // Default: append to end (smallest)
    for (let i = 0; i < this.body.length; i++) {
      if (newCube.power >= this.body[i].power) {
        insertIdx = i;
        break;
      }
    }

    // Insert into body array at the correct position
    this.body.splice(insertIdx, 0, newCube);
    this.group.add(newCube.mesh);

    // Position the new cube at its neighbor's position for smooth slide-in
    if (insertIdx > 0) {
      const neighbor = this.body[insertIdx - 1];
      const nPos = neighbor.getPosition();
      newCube.setPosition(nPos.x, undefined, nPos.z);
    } else if (this.body.length > 1) {
      const neighbor = this.body[1];
      const nPos = neighbor.getPosition();
      newCube.setPosition(nPos.x, undefined, nPos.z);
    }

    // Pad position history if needed for the longer snake
    this._ensureHistoryLength();

    return insertIdx;
  }

  /**
   * removeCubeAt — Remove a cube at a specific index and clean it up.
   *
   * @param {number} index - Body array index to remove
   * @returns {Cube} - The removed cube
   */
  removeCubeAt(index) {
    const cube = this.body.splice(index, 1)[0];
    this.group.remove(cube.mesh);
    return cube;
  }

  /**
   * replaceCubeAt — Replace a cube at a specific index with a new one.
   * Used by merge system to swap two cubes for one merged cube.
   *
   * @param {number} index - Body array index to replace
   * @param {Cube} newCube - The replacement cube
   * @returns {Cube} - The old cube that was replaced
   */
  replaceCubeAt(index, newCube) {
    const oldCube = this.body[index];
    const pos = oldCube.getPosition();

    // Position the new cube where the old one was
    newCube.setPosition(pos.x, undefined, pos.z);

    // Swap in the body array
    this.body[index] = newCube;
    this.group.remove(oldCube.mesh);
    this.group.add(newCube.mesh);

    return oldCube;
  }

  /**
   * setAsNewHead — Used in Reverse Mode to make a bigger eaten cube the new head.
   * Inserts the new cube at position 0 (head) and shifts everything down.
   *
   * @param {Cube} newHead - The cube that becomes the new head
   */
  setAsNewHead(newHead) {
    const pos = this.body[0].getPosition();
    newHead.setPosition(pos.x, undefined, pos.z);
    this.body.unshift(newHead);
    this.group.add(newHead.mesh);
    this._ensureHistoryLength();
  }

  /**
   * _ensureHistoryLength — Make sure position history is long enough for the
   * current snake length. Pads with the tail position if needed.
   */
  _ensureHistoryLength() {
    const needed = this.body.length * GameConfig.snake.positionHistoryInterval + 20;
    const lastPos = this._positionHistory[this._positionHistory.length - 1] ||
      { x: 0, z: 0 };
    while (this._positionHistory.length < needed) {
      this._positionHistory.push({ ...lastPos });
    }
  }

  /**
   * dropAllCubes — Remove all cubes from the snake and return them.
   * Used when the snake dies — all cubes become ground cubes.
   *
   * @returns {Array<{power: number, x: number, z: number}>} - Dropped cube data
   */
  dropAllCubes() {
    const dropped = [];
    for (const cube of this.body) {
      const pos = cube.getPosition();
      dropped.push({ power: cube.power, x: pos.x, z: pos.z });
      this.group.remove(cube.mesh);
      cube.dispose();
    }
    this.body = [];
    this.isAlive = false;
    return dropped;
  }

  /**
   * dropCubesFrom — Drop cubes from a specific index onward (partial eat).
   * Used when an enemy eats a body cube — everything below drops.
   *
   * @param {number} fromIndex - Start dropping from this index (inclusive)
   * @returns {Array<{power: number, x: number, z: number}>} - Dropped cube data
   */
  dropCubesFrom(fromIndex) {
    const dropped = [];
    const removed = this.body.splice(fromIndex);
    for (const cube of removed) {
      const pos = cube.getPosition();
      dropped.push({ power: cube.power, x: pos.x, z: pos.z });
      this.group.remove(cube.mesh);
      cube.dispose();
    }
    return dropped;
  }

  /**
   * respawn — Reset the snake to a single head cube at the center of the map.
   * Preserves the current snake body (respawn with same snake per GDD).
   *
   * @param {{x: number, z: number}} pos - Respawn position
   */
  respawn(pos = { x: 0, z: 0 }) {
    this.isAlive = true;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = GameConfig.snake.invulnerabilityDuration;
    this.direction.set(0, -1);
    this.targetDirection.set(0, -1);
    this.hasReceivedInput = false;

    // Move all cubes to the respawn position
    for (const cube of this.body) {
      cube.setPosition(pos.x, undefined, pos.z);
    }

    // Reset position history to respawn point
    this._positionHistory = [];
    for (let i = 0; i < this._historyMaxLength; i++) {
      this._positionHistory.push({ x: pos.x, z: pos.z });
    }
  }

  /**
   * dispose — Clean up all Three.js resources.
   */
  dispose() {
    for (const cube of this.body) {
      this.group.remove(cube.mesh);
      cube.dispose();
    }
    this.body = [];
  }
}
