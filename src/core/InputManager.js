/**
 * InputManager.js — Touch and mouse input handling.
 *
 * Tracks finger/mouse position and converts it into a direction vector
 * that the snake will move toward. Supports both mobile (primary) and
 * desktop (secondary) controls.
 *
 * How it works:
 * 1. Listens for touch events (touchstart, touchmove, touchend) on mobile
 * 2. Listens for mouse events (mousemove) on desktop
 * 3. Converts screen position to a direction vector relative to screen center
 * 4. When finger is lifted, stores the last direction (snake continues moving)
 * 5. UI button areas (left side, top) are excluded from movement input
 *
 * Connected to: Game.js (reads direction each frame), Snake.js (applies direction)
 */

import * as THREE from 'three';

export default class InputManager {
  /**
   * @param {HTMLElement} container - The game container element for event listeners
   */
  constructor(container) {
    this.container = container;

    // Current direction vector (normalized, X = left/right, Y = forward/back)
    this.direction = new THREE.Vector2(0, 0);

    // Whether user is currently touching/clicking
    this.active = false;

    // Whether there has been any input yet (snake shouldn't move until first input)
    this.hasInput = false;

    // Debug element for visualizing input direction (temporary, removed later)
    this.debugElement = null;

    // Bind event handlers
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);

    // Register event listeners
    container.addEventListener('touchstart', this._onTouchStart, { passive: false });
    container.addEventListener('touchmove', this._onTouchMove, { passive: false });
    container.addEventListener('touchend', this._onTouchEnd);
    container.addEventListener('mousemove', this._onMouseMove);

    // Create debug direction indicator
    this._createDebugIndicator();
  }

  /**
   * _isUIArea — Check if a screen position is over a UI button area.
   * Returns true if the touch should be ignored for movement.
   *
   * UI areas: left strip (mode toggles), top strip (HUD/pause)
   *
   * @param {number} x - Screen X position
   * @param {number} y - Screen Y position
   * @returns {boolean}
   */
  _isUIArea(x, y) {
    // Left 80px strip (mode toggle buttons)
    if (x < 80 && y > window.innerHeight * 0.3 && y < window.innerHeight * 0.7) {
      return true;
    }
    // Top 60px strip (pause button, score, etc.)
    if (y < 60) {
      return true;
    }
    return false;
  }

  /**
   * _updateDirection — Calculate direction vector from a screen position.
   *
   * Direction is from the center of the screen toward the touch/mouse point.
   * Normalized so the snake moves at the same speed regardless of finger distance.
   *
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   */
  _updateDirection(screenX, screenY) {
    // Calculate offset from screen center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = screenX - centerX;
    const dy = screenY - centerY;

    // Normalize the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 10) { // Dead zone: ignore tiny movements near center
      this.direction.set(dx / length, dy / length);
      this.hasInput = true;
    }

    // Update debug indicator position
    this._updateDebugIndicator(screenX, screenY);
  }

  /**
   * _onTouchStart — Handle finger touching the screen.
   */
  _onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];

    // Skip if touching a UI area
    if (this._isUIArea(touch.clientX, touch.clientY)) return;

    this.active = true;
    this._updateDirection(touch.clientX, touch.clientY);
  }

  /**
   * _onTouchMove — Handle finger moving on screen.
   */
  _onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];

    // Skip if touching a UI area
    if (this._isUIArea(touch.clientX, touch.clientY)) return;

    this.active = true;
    this._updateDirection(touch.clientX, touch.clientY);
  }

  /**
   * _onTouchEnd — Handle finger lifting off screen.
   * Direction is preserved (snake continues in last direction).
   */
  _onTouchEnd() {
    this.active = false;
    // Don't reset direction — snake continues moving in last direction
  }

  /**
   * _onMouseMove — Handle mouse movement on desktop.
   * Mouse always provides direction (no click needed).
   */
  _onMouseMove(event) {
    // Skip if over a UI area
    if (this._isUIArea(event.clientX, event.clientY)) return;

    this.active = true;
    this._updateDirection(event.clientX, event.clientY);
  }

  /**
   * getDirection — Get the current normalized direction vector.
   *
   * X maps to world X axis (left/right)
   * Y maps to world Z axis (forward/back on the arena floor)
   *
   * @returns {THREE.Vector2} - Normalized direction vector
   */
  getDirection() {
    return this.direction;
  }

  /**
   * isActive — Check if the user is currently providing input.
   *
   * @returns {boolean}
   */
  isActive() {
    return this.active && this.hasInput;
  }

  /**
   * _createDebugIndicator — Create a visible dot showing input direction.
   * Temporary debug tool — will be removed in later phases.
   */
  _createDebugIndicator() {
    this.debugElement = document.createElement('div');
    this.debugElement.style.cssText = `
      position: fixed;
      width: 16px;
      height: 16px;
      background: rgba(255, 100, 100, 0.8);
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      display: none;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(this.debugElement);
  }

  /**
   * _updateDebugIndicator — Move the debug dot to the current input position.
   */
  _updateDebugIndicator(x, y) {
    if (this.debugElement) {
      this.debugElement.style.display = 'block';
      this.debugElement.style.left = `${x}px`;
      this.debugElement.style.top = `${y}px`;
    }
  }

  /**
   * removeDebugIndicator — Remove the temporary debug indicator.
   */
  removeDebugIndicator() {
    if (this.debugElement) {
      this.debugElement.remove();
      this.debugElement = null;
    }
  }

  /**
   * dispose — Clean up event listeners and debug elements.
   */
  dispose() {
    this.container.removeEventListener('touchstart', this._onTouchStart);
    this.container.removeEventListener('touchmove', this._onTouchMove);
    this.container.removeEventListener('touchend', this._onTouchEnd);
    this.container.removeEventListener('mousemove', this._onMouseMove);
    this.removeDebugIndicator();
  }
}
