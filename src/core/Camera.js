/**
 * Camera.js — Camera controller with smooth follow and arena clamping.
 *
 * Creates a perspective camera positioned at ~45° angle looking down at the arena.
 * Smoothly follows a target position (player snake head) using linear interpolation.
 * Clamps camera position so it never shows beyond the arena walls.
 *
 * How it works:
 * 1. Camera is offset from target: behind and above at ~45° angle
 * 2. Each frame, camera lerps toward the target position (smooth follow, slight lag)
 * 3. Camera position is clamped to keep the view within arena boundaries
 * 4. Camera does NOT rotate — fixed orientation, north is always up on screen
 *
 * Connected to: Game.js (updates each frame), Scene.js (provides camera to renderer),
 *               Snake.js (target = player head position)
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';
import { lerp, clamp } from '../utils/MathUtils.js';

export default class Camera {
  constructor() {
    const cfg = GameConfig.camera;

    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      cfg.fov,
      window.innerWidth / window.innerHeight,
      cfg.near,
      cfg.far
    );

    // Target position the camera is following (starts at arena center)
    this.targetPosition = new THREE.Vector3(0, 0, 0);

    // Current smoothed position (what the camera is actually looking at)
    this.currentTarget = new THREE.Vector3(0, 0, 0);

    // Screen shake offset (set externally by ScreenShake system)
    this.shakeOffsetX = 0;
    this.shakeOffsetZ = 0;

    // Set initial camera position at ~45° angle
    this._updateCameraPosition(true);

    // Handle window resize to update aspect ratio
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /**
   * _updateCameraPosition — Position the camera relative to the current target.
   *
   * Camera is placed above and behind the target at the configured angle.
   * Looking "behind" means offset in the -Z direction (north is up on screen).
   *
   * @param {boolean} instant - If true, skip lerp and jump to position
   */
  _updateCameraPosition(instant = false) {
    const cfg = GameConfig.camera;
    const halfArena = GameConfig.arena.size / 2;

    // Lerp current target toward actual target (smooth follow)
    if (instant) {
      this.currentTarget.copy(this.targetPosition);
    } else {
      this.currentTarget.x = lerp(this.currentTarget.x, this.targetPosition.x, cfg.followSpeed);
      this.currentTarget.z = lerp(this.currentTarget.z, this.targetPosition.z, cfg.followSpeed);
    }

    // Clamp the camera target loosely — allow the camera to show some space
    // beyond the walls so the player can still see their snake near edges.
    // A small margin keeps the camera from flying too far out.
    const margin = cfg.height * 0.15;
    this.currentTarget.x = clamp(this.currentTarget.x, -halfArena - margin, halfArena + margin);
    this.currentTarget.z = clamp(this.currentTarget.z, -halfArena - margin, halfArena + margin);

    // Position camera above and behind (offset in +Z direction, looking toward -Z)
    // Apply screen shake offset
    this.camera.position.set(
      this.currentTarget.x + this.shakeOffsetX,
      cfg.height,
      this.currentTarget.z + cfg.distance + this.shakeOffsetZ
    );

    // Always look at the current target position on the ground
    this.camera.lookAt(
      this.currentTarget.x + this.shakeOffsetX,
      0,
      this.currentTarget.z + this.shakeOffsetZ
    );
  }

  /**
   * setTarget — Set the position the camera should follow.
   *
   * @param {THREE.Vector3} position - World position to follow (e.g., player head)
   */
  setTarget(position) {
    this.targetPosition.copy(position);
  }

  /**
   * update — Called every frame to smoothly move the camera toward the target.
   */
  update() {
    this._updateCameraPosition(false);
  }

  /**
   * _onResize — Update camera aspect ratio when window size changes.
   */
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  /**
   * getCamera — Get the underlying Three.js camera object.
   *
   * @returns {THREE.PerspectiveCamera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * dispose — Clean up event listeners.
   */
  dispose() {
    window.removeEventListener('resize', this._onResize);
  }
}
