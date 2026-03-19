/**
 * ScreenShake.js — Camera shake effect for impactful game events.
 * Adds decreasing random displacement to camera position.
 * Connected to: Camera.js, Game.js
 */

export default class ScreenShake {
  constructor() {
    this._intensity = 0;
    this._duration = 0;
    this._elapsed = 0;
    this.offsetX = 0;
    this.offsetZ = 0;
  }

  /**
   * trigger — Start a screen shake.
   * @param {number} intensity - Max displacement in units
   * @param {number} duration - Duration in seconds
   */
  trigger(intensity = 0.3, duration = 0.2) {
    this._intensity = Math.max(this._intensity, intensity);
    this._duration = Math.max(this._duration, duration);
    this._elapsed = 0;
  }

  /**
   * update — Calculate current shake offset.
   * @param {number} dt
   */
  update(dt) {
    if (this._duration <= 0) {
      this.offsetX = 0;
      this.offsetZ = 0;
      return;
    }

    this._elapsed += dt;
    const progress = this._elapsed / this._duration;

    if (progress >= 1) {
      this._intensity = 0;
      this._duration = 0;
      this.offsetX = 0;
      this.offsetZ = 0;
      return;
    }

    // Decreasing random displacement
    const decay = 1 - progress;
    this.offsetX = (Math.random() - 0.5) * 2 * this._intensity * decay;
    this.offsetZ = (Math.random() - 0.5) * 2 * this._intensity * decay;
  }

  get isShaking() {
    return this._duration > 0;
  }
}
