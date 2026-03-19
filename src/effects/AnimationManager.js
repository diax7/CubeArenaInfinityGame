/**
 * AnimationManager.js — Manages and updates all active animations each frame.
 * Provides simple tween-like animation scheduling.
 * Connected to: Game.js, MergeSystem.js, CombatSystem.js
 */

export default class AnimationManager {
  constructor() {
    this._animations = [];
  }

  /**
   * add — Schedule a new animation.
   * @param {object} opts - { duration (ms), onUpdate(progress), onComplete() }
   */
  add(opts) {
    this._animations.push({
      startTime: performance.now(),
      duration: opts.duration || 300,
      onUpdate: opts.onUpdate || (() => {}),
      onComplete: opts.onComplete || (() => {}),
    });
  }

  /**
   * update — Tick all active animations. Call once per frame.
   */
  update() {
    const now = performance.now();
    for (let i = this._animations.length - 1; i >= 0; i--) {
      const anim = this._animations[i];
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);

      anim.onUpdate(progress);

      if (progress >= 1) {
        anim.onComplete();
        this._animations.splice(i, 1);
      }
    }
  }

  dispose() {
    this._animations = [];
  }
}
