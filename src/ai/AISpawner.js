/**
 * AISpawner.js — AI snake creation, naming, and respawn management.
 *
 * Handles spawning new AI snakes at appropriate levels and positions.
 * Maintains the configured AI count by respawning dead snakes after a delay.
 *
 * How it works:
 * 1. At game start, spawns configured count of AI snakes
 * 2. Each AI gets a random name, random position (min 30 units from player),
 *    and a head value within ±2 power levels of the player
 * 3. When an AI dies, it's queued for respawn after 2-5 seconds
 * 4. Respawned AI scales to the player's current level
 *
 * Connected to: Game.js (owns AI list), Snake.js (creates snake instances),
 *               AIController.js (each AI gets a controller), GameConfig.js
 */

import Snake from '../entities/Snake.js';
import AIController from './AIController.js';
import GameConfig from '../config/GameConfig.js';
import { randomRange, randomInt } from '../utils/MathUtils.js';

/**
 * BOT_NAMES — Fun names for AI snakes, shown on the leaderboard.
 */
const BOT_NAMES = [
  'Cubey', 'BlockBot', 'SnakeAI', 'Mergatron', 'CubeKing',
  'Blocky', 'PixelWorm', 'BoxHead', 'Squarion', 'CubeMaster',
  'Voxelus', 'GridSnake', 'MergeBot', 'CubeSlayer', 'BlockWorm',
  'TinyBox', 'MegaCube', 'BitSnake', 'NomNom', 'CubeHunter',
  'Boxy', 'SquareUp', 'PowerCube', 'ChainBot', 'MergeKing',
  'CubeNinja', 'BlockChain', 'PixelBoss', 'GigaCube', 'NanoBot',
  'CubeWorm', 'GridKing', 'VoxelBot', 'MergeSnake', 'BlockHero',
  'CubeRush', 'TurboBox', 'SquareBot', 'CubeFury', 'BlockStar',
  'MiniCube', 'MaxBlock', 'AlphaCube', 'BetaBot', 'GammaSnake',
  'DeltaCube', 'OmegaBox', 'SigmaBot', 'ZetaCube', 'ThetaWorm',
  'CubeZilla', 'BoxBoss', 'SnakeKing', 'MergeLord', 'CubeAce',
];

export default class AISpawner {
  /**
   * @param {object} scene - Scene instance
   * @param {object} arena - Arena instance
   */
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;

    // Active AI snakes and their controllers
    this.aiSnakes = [];
    this.aiControllers = [];

    // Respawn queue: { timer, playerPower }
    this._respawnQueue = [];

    // Names tracking to avoid duplicates
    this._usedNames = new Set();
  }

  /**
   * _getRandomName — Pick a unique bot name.
   *
   * @returns {string}
   */
  _getRandomName() {
    const available = BOT_NAMES.filter(n => !this._usedNames.has(n));
    if (available.length === 0) {
      this._usedNames.clear(); // Reset if all names used
      return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    }
    const name = available[Math.floor(Math.random() * available.length)];
    this._usedNames.add(name);
    return name;
  }

  /**
   * spawnInitialAI — Spawn all AI snakes at game start.
   *
   * @param {number} playerPower - Player's current head power
   * @param {{x: number, z: number}} playerPos - Player position (to enforce min distance)
   * @param {number} count - Number of AI to spawn
   */
  spawnInitialAI(playerPower, playerPos, count) {
    for (let i = 0; i < count; i++) {
      this._spawnOne(playerPower, playerPos);
    }
  }

  /**
   * _spawnOne — Create a single AI snake at a valid random position.
   *
   * @param {number} playerPower - Player's head power (for scaling)
   * @param {{x: number, z: number}} playerPos - Player position (for min distance)
   * @returns {object} - The created Snake instance
   */
  _spawnOne(playerPower, playerPos) {
    const halfSize = GameConfig.arena.size / 2;
    const padding = 10;
    const minDist = GameConfig.ai.minSpawnDistance;

    // Pick a random position at least minDist from player
    let x, z, attempts = 0;
    do {
      x = randomRange(-halfSize + padding, halfSize - padding);
      z = randomRange(-halfSize + padding, halfSize - padding);
      attempts++;
    } while (
      attempts < 50 &&
      Math.sqrt((x - playerPos.x) ** 2 + (z - playerPos.z) ** 2) < minDist
    );

    // Pick power within ±2 of player
    const range = GameConfig.ai.spawnRange;
    const minPower = Math.max(0, playerPower - range);
    const maxPower = playerPower + range;
    const power = randomInt(minPower, maxPower);

    // Create the snake
    const snake = new Snake(false, power, { x, z });
    snake.name = this._getRandomName();

    // Create its AI controller
    const controller = new AIController(snake);

    // Add to scene and tracking
    this.scene.add(snake.group);
    this.aiSnakes.push(snake);
    this.aiControllers.push(controller);

    return snake;
  }

  /**
   * update — Called every frame. Updates all AI controllers and processes respawns.
   *
   * @param {number} dt - Delta time
   * @param {object} context - { player, spawnSystem, fearMode }
   */
  update(dt, context) {
    const clampFn = (x, z, margin) => this.arena.clampPosition(x, z, margin);

    // Update each AI snake and its controller
    for (let i = 0; i < this.aiSnakes.length; i++) {
      const snake = this.aiSnakes[i];
      if (!snake.isAlive) continue;

      // AI controller decides direction
      this.aiControllers[i].update(dt, {
        ...context,
        aiSnakes: this.aiSnakes,
      });

      // Snake physics update
      snake.update(dt, clampFn);
    }

    // Process respawn queue
    for (let i = this._respawnQueue.length - 1; i >= 0; i--) {
      this._respawnQueue[i].timer -= dt;
      if (this._respawnQueue[i].timer <= 0) {
        const { playerPower, playerPos } = this._respawnQueue[i];
        this._spawnOne(playerPower, playerPos);
        this._respawnQueue.splice(i, 1);
      }
    }
  }

  /**
   * scheduleRespawn — Queue a dead AI for respawn after a random delay.
   *
   * @param {number} playerPower - Player's current head power
   * @param {{x: number, z: number}} playerPos - Player's current position
   */
  scheduleRespawn(playerPower, playerPos) {
    const delay = randomRange(
      GameConfig.ai.respawnDelay.min,
      GameConfig.ai.respawnDelay.max
    );
    this._respawnQueue.push({ timer: delay, playerPower, playerPos });
  }

  /**
   * removeDeadSnakes — Clean up dead AI snakes from the arrays and scene.
   * Returns data about the dead snakes for respawning.
   *
   * @returns {number} - Number of snakes removed
   */
  removeDeadSnakes() {
    let removed = 0;
    for (let i = this.aiSnakes.length - 1; i >= 0; i--) {
      if (!this.aiSnakes[i].isAlive) {
        const snake = this.aiSnakes[i];
        this.scene.remove(snake.group);
        this._usedNames.delete(snake.name);
        snake.dispose();
        this.aiSnakes.splice(i, 1);
        this.aiControllers.splice(i, 1);
        removed++;
      }
    }
    return removed;
  }

  /**
   * getAliveCount — Number of currently alive AI snakes.
   *
   * @returns {number}
   */
  getAliveCount() {
    return this.aiSnakes.filter(s => s.isAlive).length;
  }

  /**
   * dispose — Clean up all AI snakes.
   */
  dispose() {
    for (const snake of this.aiSnakes) {
      this.scene.remove(snake.group);
      snake.dispose();
    }
    this.aiSnakes = [];
    this.aiControllers = [];
  }
}
