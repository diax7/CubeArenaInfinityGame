/**
 * Cube.js — Individual numbered cube entity.
 *
 * Creates a 3D box with a number rendered on its top face (visible from ~45° camera).
 * Each cube has a power value, color, and mesh.
 *
 * How it works:
 * 1. Creates a BoxGeometry with the configured cube size
 * 2. Renders the number text onto a canvas, then applies it as a texture to the TOP face
 * 3. Other faces use the solid cube color
 * 4. Adds a soft circular shadow on the ground beneath the cube
 *
 * Connected to: Snake.js (body is made of cubes), GroundCube.js (extends this),
 *               NumberFormatter.js (display text), ColorPalette.js (colors)
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';
import { formatPower } from '../utils/NumberFormatter.js';
import { getColorForPower, getColorHex } from '../utils/ColorPalette.js';
import { INFINITY_POWER } from '../utils/Constants.js';

/**
 * _textureCache — Cache for pre-generated number textures.
 * Key: "power_colorHex", Value: THREE.CanvasTexture
 * Prevents re-rendering the same texture repeatedly.
 */
const _textureCache = new Map();

export default class Cube {
  /**
   * @param {number} power - The exponent value (e.g., 6 for 2^6 = 64)
   * @param {string} [color] - Hex color string (random if not provided)
   * @param {number} [size] - Cube size override (defaults to GameConfig)
   */
  constructor(power, color = null, size = null) {
    // Core data
    this.id = crypto.randomUUID();
    this.power = power;
    this.isInfinity = power >= INFINITY_POWER;
    this.color = this.isInfinity ? '#FFD700' : (color || getColorForPower(power));

    // Size scales with power — higher power cubes are noticeably bigger
    // power 0 (val 1) = 0.7× base, power 9 (val 512) = 1.33× base
    const baseSize = GameConfig.snake.cubeSize;
    const scaleFactor = 0.7 + Math.min(power, 20) * 0.035;
    this.size = size || (baseSize * scaleFactor);

    // Computed values
    this.displayValue = formatPower(power);

    // Build the 3D mesh — infinity cubes get a special build path
    if (this.isInfinity) {
      this.mesh = this._createInfinityMesh();
    } else {
      this.mesh = this._createMesh();
    }

    // Add drop shadow on the ground
    this.shadow = this._createShadow();
    this.mesh.add(this.shadow);

    // Collision radius (used by CollisionSystem)
    this.collisionRadius = this.size * GameConfig.snake.bodyCollisionRadius;
  }

  /**
   * _createMesh — Build the 3D box mesh with numbered top face.
   *
   * Creates 6 materials: 5 solid color faces + 1 top face with number texture.
   * The number is white text with a thin black outline on the cube's color background.
   *
   * @returns {THREE.Mesh}
   */
  _createMesh() {
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);

    // Create the numbered top-face texture
    const topTexture = this._getNumberTexture();

    // Build materials array: [+X, -X, +Y (top), -Y (bottom), +Z, -Z]
    // Low roughness + emissive tint makes cubes look bright and vibrant
    const colorHex = getColorHex(this.color);
    const solidMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.05,
      emissive: colorHex,
      emissiveIntensity: 0.15,
    });

    const topMaterial = new THREE.MeshStandardMaterial({
      map: topTexture,
      roughness: 0.25,
      metalness: 0.05,
      emissive: colorHex,
      emissiveIntensity: 0.15,
    });

    const materials = [
      solidMaterial, // +X (right)
      solidMaterial, // -X (left)
      topMaterial,   // +Y (top) — the numbered face
      solidMaterial, // -Y (bottom)
      solidMaterial, // +Z (front)
      solidMaterial, // -Z (back)
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Position so the bottom of the cube sits on y=0 (floor)
    mesh.position.y = this.size / 2;

    return mesh;
  }

  /**
   * _createInfinityMesh — Build a special glowing, multi-layered infinity cube.
   *
   * The infinity cube is visually distinct:
   * - Slightly larger than normal cubes (1.2× size)
   * - Golden base with strong emissive glow
   * - Outer wireframe cage for a "contained energy" look
   * - Inner glowing core sphere
   * - Animated rotation and pulsing (driven by update())
   *
   * @returns {THREE.Group}
   */
  _createInfinityMesh() {
    const group = new THREE.Group();
    const s = this.size * 1.2;

    // === Core cube — fancy gold block with animated sparkle gradient ===
    const coreGeo = new THREE.BoxGeometry(s, s, s);
    const topTexture = this._getNumberTexture();

    // Canvas for animated sparkling gold gradient on side faces
    this._glowCanvas = document.createElement('canvas');
    this._glowCanvas.width = 256;
    this._glowCanvas.height = 256;
    this._glowTexture = new THREE.CanvasTexture(this._glowCanvas);
    this._glowTexture.minFilter = THREE.LinearFilter;
    this._glowTexture.magFilter = THREE.LinearFilter;

    // Rich gold metallic material — no heavy emissive glow, just metallic shine
    const coreMat = new THREE.MeshStandardMaterial({
      map: this._glowTexture,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xB8860B,
      emissiveIntensity: 0.15,
    });
    const topMat = new THREE.MeshStandardMaterial({
      map: topTexture,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xB8860B,
      emissiveIntensity: 0.15,
    });

    const coreMaterials = [coreMat, coreMat, topMat, coreMat, coreMat, coreMat];
    this._coreMesh = new THREE.Mesh(coreGeo, coreMaterials);
    this._coreMesh.castShadow = true;
    group.add(this._coreMesh);

    // Subtle point light — not overpowering, just a warm glow
    this._pointLight = new THREE.PointLight(0xFFD700, 1, 5);
    this._pointLight.position.set(0, 0, 0);
    group.add(this._pointLight);

    group.position.y = this.size / 2;

    this._animTime = Math.random() * Math.PI * 2;
    this._drawGlowGradient(0);

    return group;
  }

  /**
   * _drawGlowGradient — Draw an animated moving gold gradient onto the glow canvas.
   *
   * Creates a diagonal linear gradient that shifts position over time,
   * giving the cube a "liquid gold" flowing appearance.
   *
   * @param {number} t - Current animation time
   */
  _drawGlowGradient(t) {
    const canvas = this._glowCanvas;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Base gold fill
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(0, 0, size, size);

    // Draw multiple moving diagonal wave highlights to create a sparkling effect
    // Wave 1: slow diagonal sweep
    const wave1 = (t * 0.4) % 2;
    const g1 = ctx.createLinearGradient(
      size * (wave1 - 1), 0, size * wave1, size
    );
    g1.addColorStop(0, 'rgba(184,134,11,0)');
    g1.addColorStop(0.4, 'rgba(255,223,0,0.6)');
    g1.addColorStop(0.5, 'rgba(255,250,220,0.9)');
    g1.addColorStop(0.6, 'rgba(255,223,0,0.6)');
    g1.addColorStop(1, 'rgba(184,134,11,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, size, size);

    // Wave 2: faster counter-diagonal sparkle
    const wave2 = (t * 0.7 + 0.5) % 2;
    const g2 = ctx.createLinearGradient(
      size * wave2, 0, size * (wave2 - 1), size
    );
    g2.addColorStop(0, 'rgba(184,134,11,0)');
    g2.addColorStop(0.45, 'rgba(255,215,0,0.4)');
    g2.addColorStop(0.5, 'rgba(255,255,240,0.7)');
    g2.addColorStop(0.55, 'rgba(255,215,0,0.4)');
    g2.addColorStop(1, 'rgba(184,134,11,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, size, size);

    // Small sparkle dots that appear and fade
    const sparkleCount = 5;
    for (let i = 0; i < sparkleCount; i++) {
      const phase = t * 1.5 + i * 1.3;
      const alpha = Math.max(0, Math.sin(phase) * 0.8);
      if (alpha < 0.1) continue;
      const sx = ((Math.sin(phase * 0.7 + i * 2.1) + 1) / 2) * size;
      const sy = ((Math.cos(phase * 0.5 + i * 1.7) + 1) / 2) * size;
      const sr = 3 + Math.sin(phase) * 2;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, `rgba(255,255,255,${alpha})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
  }

  /**
   * update — Called each frame to animate infinity cubes.
   *
   * Regular cubes don't need per-frame updates, but infinity cubes have:
   * - Flowing golden gradient on side faces
   * - Pulsing emissive glow intensity
   * - Light intensity pulsing
   * - Gentle floating bob
   *
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.isInfinity) return;

    this._animTime += dt;
    const t = this._animTime;

    // Update the sparkling gold gradient texture
    if (this._glowCanvas) {
      this._drawGlowGradient(t);
      this._glowTexture.needsUpdate = true;
    }

    // Subtle warm light pulse (not dramatic)
    if (this._pointLight) {
      this._pointLight.intensity = 1 + Math.sin(t * 1.5) * 0.3;
    }

    // Gentle floating bob
    const baseY = this.size / 2;
    const bob = Math.sin(t * 1.5) * 0.1;
    this.mesh.position.y = baseY + bob;
  }

  /**
   * _getNumberTexture — Get or create a canvas texture with the number on the cube color.
   *
   * Caches textures so identical power+color combos reuse the same texture.
   *
   * @returns {THREE.CanvasTexture}
   */
  _getNumberTexture() {
    const cacheKey = `${this.power}_${this.color}`;
    if (_textureCache.has(cacheKey)) {
      return _textureCache.get(cacheKey);
    }

    const texSize = 128;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d');

    // Infinity cubes get a special radial gradient background
    if (this.isInfinity) {
      const grad = ctx.createRadialGradient(
        texSize / 2, texSize / 2, 0,
        texSize / 2, texSize / 2, texSize / 2
      );
      grad.addColorStop(0, '#FFF8DC');  // Bright gold center
      grad.addColorStop(0.6, '#FFD700'); // Gold
      grad.addColorStop(1, '#B8860B');   // Dark gold edge
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = this.color;
    }
    ctx.fillRect(0, 0, texSize, texSize);

    // Determine font size based on text length
    const text = this.displayValue;
    let fontSize;
    if (this.isInfinity) {
      // Infinity symbol gets extra large
      fontSize = 72;
    } else if (text.length <= 2) {
      fontSize = 56;
    } else if (text.length <= 3) {
      fontSize = 44;
    } else if (text.length <= 4) {
      fontSize = 36;
    } else {
      fontSize = 28;
    }

    ctx.font = `bold ${fontSize}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.isInfinity) {
      // Infinity symbol: crisp black text, no blur, no glow
      ctx.fillStyle = '#000000';
      ctx.fillText(text, texSize / 2, texSize / 2);
    } else {
      // Normal cubes: black outline + white fill for readability
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(text, texSize / 2, texSize / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, texSize / 2, texSize / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    _textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * _createShadow — Create a soft circular shadow beneath the cube.
   *
   * Uses a transparent plane with a radial gradient texture.
   *
   * @returns {THREE.Mesh}
   */
  _createShadow() {
    const shadowSize = this.size * 1.4;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Radial gradient: dark center, transparent edges
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const geometry = new THREE.PlaneGeometry(shadowSize, shadowSize);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const shadow = new THREE.Mesh(geometry, material);
    shadow.rotation.x = -Math.PI / 2; // Lay flat on ground
    shadow.position.y = -this.size / 2 + 0.01; // Just above the floor to avoid z-fighting

    return shadow;
  }

  /**
   * setPosition — Move the cube to a world position.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setPosition(x, y, z) {
    this.mesh.position.set(x, y !== undefined ? y : this.size / 2, z);
  }

  /**
   * getPosition — Get the cube's current world position.
   *
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.mesh.position;
  }

  /**
   * updatePower — Change the cube's power value and update its display.
   *
   * @param {number} newPower - New power exponent
   */
  updatePower(newPower) {
    this.power = newPower;
    this.displayValue = formatPower(newPower);

    // Update the top face texture
    const topTexture = this._getNumberTexture();
    this.mesh.material[2].map = topTexture;
    this.mesh.material[2].needsUpdate = true;
  }

  /**
   * dispose — Clean up Three.js resources.
   */
  dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    if (this.shadow) {
      this.shadow.geometry.dispose();
      this.shadow.material.dispose();
    }
  }
}
