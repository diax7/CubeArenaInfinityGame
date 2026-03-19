/**
 * CombatSystem.js — Snake vs snake combat resolution.
 *
 * Determines outcomes when snake heads collide with other snakes.
 * Handles head kills, body kills, equal bounces, and cube drops.
 *
 * How it works:
 * 1. Each frame, check all snake head positions against all other snake cubes
 * 2. If head touches enemy cube: compare powers
 * 3. Head ≥ enemy cube → eat (head kill if head, body kill if body)
 * 4. Head < enemy cube → attacker dies
 * 5. Equal heads → bounce apart
 * 6. Dropped cubes become ground cubes via SpawnSystem
 *
 * Connected to: Game.js (called each frame), Snake.js (reads body data),
 *               SpawnSystem.js (dropped cubes), CollisionSystem.js (spatial hash)
 */

import GameConfig from '../config/GameConfig.js';

export default class CombatSystem {
  constructor() {
    // Track recent bounces to prevent double-triggering on same pair
    this._bounceCooldowns = new Map();
  }

  /**
   * checkSnakeVsSnake — Check all snake-to-snake collisions.
   *
   * @param {object} player - Player Snake instance
   * @param {Array<object>} aiSnakes - All AI Snake instances
   * @param {object} spawnSystem - SpawnSystem for dropping cubes
   * @param {object} mergeSystem - MergeSystem for merging eaten cubes
   * @returns {Array<object>} - List of combat events that occurred
   */
  checkSnakeVsSnake(player, aiSnakes, spawnSystem, mergeSystem) {
    const events = [];
    const allSnakes = [player, ...aiSnakes].filter(s => s.isAlive && s.body.length > 0);
    const headRadius = GameConfig.snake.cubeSize * GameConfig.snake.headCollisionRadius;

    // Decay bounce cooldowns
    for (const [key, timer] of this._bounceCooldowns) {
      if (timer <= 0) this._bounceCooldowns.delete(key);
      else this._bounceCooldowns.set(key, timer - 1);
    }

    // Check each snake's head against every other snake's body
    for (let a = 0; a < allSnakes.length; a++) {
      const attacker = allSnakes[a];
      if (!attacker.isAlive || attacker.isInvulnerable) continue;

      const aHead = attacker.head;
      const aPos = aHead.getPosition();
      const aPower = aHead.power;

      for (let b = 0; b < allSnakes.length; b++) {
        if (a === b) continue;
        const defender = allSnakes[b];
        if (!defender.isAlive || defender.isInvulnerable) continue;

        // Check attacker head vs each cube in defender's body
        for (let ci = 0; ci < defender.body.length; ci++) {
          const defCube = defender.body[ci];
          const dPos = defCube.getPosition();
          const dPower = defCube.power;

          // Distance check
          const dx = aPos.x - dPos.x;
          const dz = aPos.z - dPos.z;
          const distSq = dx * dx + dz * dz;
          const combinedR = headRadius + defCube.size * 0.5;

          if (distSq >= combinedR * combinedR) continue;

          // Collision detected! Determine outcome.
          // Key rule: only the enemy HEAD can kill you.
          // Body cubes either get eaten (≤ your head) or bounce you back (> your head).

          const isDefenderHead = (ci === 0);

          // Equal heads → bounce
          if (isDefenderHead && aPower === dPower) {
            const bounceKey = [attacker.id, defender.id].sort().join('_');
            if (!this._bounceCooldowns.has(bounceKey)) {
              this._bounceCooldowns.set(bounceKey, 30);
              attacker.applyBounce(dPos.x, dPos.z);
              defender.applyBounce(aPos.x, aPos.z);
              events.push({ type: 'bounce', a: attacker, b: defender });
            }
            break;
          }

          // Attacker can eat this cube (head power ≥ cube power)
          if (aPower >= dPower) {
            if (isDefenderHead) {
              // HEAD KILL — entire defender dies, all cubes drop
              const dropped = defender.dropAllCubes();
              defender.isAlive = false;
              this._dropCubesOnGround(dropped, spawnSystem);
              attacker.killCount++;
              events.push({
                type: 'head-kill',
                attacker,
                defender,
                droppedCount: dropped.length,
              });
            } else {
              // BODY KILL — eaten cube + everything smaller drops
              const dropped = defender.dropCubesFrom(ci);
              this._dropCubesOnGround(dropped, spawnSystem);
              events.push({
                type: 'body-kill',
                attacker,
                defender,
                droppedCount: dropped.length,
              });
            }
            break;
          }

          // Attacker head < defender cube
          if (aPower < dPower) {
            if (isDefenderHead) {
              // Hit the HEAD which is bigger → attacker DIES
              const dropped = attacker.dropAllCubes();
              attacker.isAlive = false;
              this._dropCubesOnGround(dropped, spawnSystem);
              events.push({
                type: 'attacker-dies',
                attacker,
                defender,
                droppedCount: dropped.length,
              });
            } else {
              // Hit a BODY cube which is bigger → BOUNCE back (no death)
              const bounceKey = attacker.id + '_' + defender.id + '_body';
              if (!this._bounceCooldowns.has(bounceKey)) {
                this._bounceCooldowns.set(bounceKey, 20);
                attacker.applyBounce(dPos.x, dPos.z);
                events.push({ type: 'body-bounce', a: attacker, b: defender });
              }
            }
            break; // Attacker is dead, stop checking
          }
        }

        // If attacker died, stop checking more defenders
        if (!attacker.isAlive) break;
      }
    }

    return events;
  }

  /**
   * _dropCubesOnGround — Convert dropped snake cubes into ground cubes.
   * Adds slight scatter so they don't all land on the exact same spot.
   *
   * @param {Array<{power: number, x: number, z: number}>} dropped - Cube data
   * @param {object} spawnSystem - SpawnSystem instance
   */
  _dropCubesOnGround(dropped, spawnSystem) {
    const scatter = GameConfig.combat.cubeDropScatter;
    for (const cube of dropped) {
      const sx = cube.x + (Math.random() - 0.5) * scatter * 2;
      const sz = cube.z + (Math.random() - 0.5) * scatter * 2;
      spawnSystem.respawnImmediate(cube.power, sx, sz);
    }
  }
}
