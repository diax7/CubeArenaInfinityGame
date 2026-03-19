/**
 * MergeSystem.js — Handles cube merging and chain reactions.
 *
 * When two adjacent cubes in a snake have the same power value,
 * they auto-merge (2048 rules): value doubles, snake shortens by 1.
 * Chain reactions cascade until no more adjacent duplicates remain.
 *
 * How it works:
 * 1. After any cube insertion, scan the body for adjacent duplicates
 * 2. When found: remove the lower-index cube, upgrade the other to power+1
 * 3. Repeat the scan — the merge may have created NEW adjacent duplicates
 * 4. Continue until no more merges are possible (chain reaction complete)
 * 5. Snake stays sorted descending at all times
 *
 * Connected to: Snake.js (modifies body), Game.js (triggered after eating),
 *               Cube.js (creates merged cubes), AnimationManager.js (effects)
 */

import Cube from '../entities/Cube.js';

export default class MergeSystem {
  constructor() {
    // Track merge events for animation/effects (Phase 4)
    this.lastMergeEvents = [];
  }

  /**
   * checkAndMerge — Scan a snake's body for adjacent duplicates and merge them.
   * Supports chain reactions: keeps merging until no duplicates remain.
   *
   * @param {object} snake - Snake instance to check
   * @returns {Array<{fromPower: number, toPower: number, index: number}>} - List of merge events
   */
  checkAndMerge(snake) {
    this.lastMergeEvents = [];
    let merged = true;

    // Keep looping until no more merges happen (chain reaction support)
    while (merged) {
      merged = false;

      // Scan body for adjacent cubes with the same power
      for (let i = 0; i < snake.body.length - 1; i++) {
        const current = snake.body[i];
        const next = snake.body[i + 1];

        if (current.power === next.power) {
          // Found a pair! Merge them.
          const fromPower = current.power;
          const toPower = current.power + 1;

          // Record the merge event
          this.lastMergeEvents.push({
            fromPower,
            toPower,
            index: i,
          });

          // Get position of the merge point (where the merged cube will be)
          const pos = current.getPosition();

          // Remove both cubes from the snake
          const removedCurrent = snake.removeCubeAt(i);
          const removedNext = snake.removeCubeAt(i); // Now at same index since previous was removed

          // Clean up old cube meshes
          removedCurrent.dispose();
          removedNext.dispose();

          // Create the merged cube with power + 1
          const mergedCube = new Cube(toPower);
          mergedCube.setPosition(pos.x, undefined, pos.z);

          // Insert the merged cube back at the correct sorted position
          // Since the body is sorted descending and we removed two cubes,
          // we need to find the right spot for the new higher-value cube
          let insertIdx = snake.body.length; // Default: end
          for (let j = 0; j < snake.body.length; j++) {
            if (mergedCube.power >= snake.body[j].power) {
              insertIdx = j;
              break;
            }
          }
          snake.body.splice(insertIdx, 0, mergedCube);
          snake.group.add(mergedCube.mesh);

          // Simple scale-up animation for visual feedback
          this._playMergeAnimation(mergedCube);

          // A merge happened — start scanning from the beginning again
          // (the new cube may create new adjacent duplicates)
          merged = true;
          break; // Restart the scan
        }
      }
    }

    return this.lastMergeEvents;
  }

  /**
   * _playMergeAnimation — Simple scale-up "pop" effect on the merged cube.
   * A brief overshoot then settle to normal size.
   *
   * @param {object} cube - The newly merged Cube
   */
  _playMergeAnimation(cube) {
    const mesh = cube.mesh;
    const origScale = 1;
    const popScale = 1.5;
    const duration = 500; // ms — slow enough to appreciate the merge
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out overshoot: go big then settle
      let scale;
      if (progress < 0.5) {
        // First half: grow to popScale
        scale = origScale + (popScale - origScale) * (progress * 2);
      } else {
        // Second half: shrink back to origScale
        scale = popScale + (origScale - popScale) * ((progress - 0.5) * 2);
      }

      mesh.scale.set(scale, scale, scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        mesh.scale.set(origScale, origScale, origScale);
      }
    };

    requestAnimationFrame(animate);
  }
}
