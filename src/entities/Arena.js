/**
 * Arena.js — Game arena with grid floor and boundary walls.
 *
 * Creates the playing field: a large flat plane with a grid pattern
 * and low fence walls around all four edges.
 *
 * How it works:
 * 1. Creates a flat plane mesh for the floor with a grid texture
 * 2. Draws grid lines on the floor using a canvas texture
 * 3. Creates four low fence walls as box meshes around the perimeter
 * 4. Floor receives shadows from cubes and snakes
 *
 * Connected to: Scene.js (added to scene), Game.js (collision boundary reference),
 *               Snake.js (wall collision checks), Camera.js (arena size for clamping)
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';

export default class Arena {
  constructor() {
    // Root group containing all arena objects
    this.group = new THREE.Group();

    // Build the arena components
    this._createFloor();
    this._createWalls();
  }

  /**
   * _createFloor — Build the arena floor with a grid pattern.
   *
   * Uses a canvas-based texture to draw grid lines.
   * The floor is a large plane at y=0.
   */
  _createFloor() {
    const size = GameConfig.arena.size;

    // Create grid texture using canvas
    const canvas = document.createElement('canvas');
    const textureSize = 1024;
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');

    // Fill background (floor color)
    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(0, 0, textureSize, textureSize);

    // Draw grid lines
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1.5;

    // Number of grid cells the texture represents (tile this across the arena)
    const cellsPerTexture = 20;
    const cellPixelSize = textureSize / cellsPerTexture;

    for (let i = 0; i <= cellsPerTexture; i++) {
      const pos = i * cellPixelSize;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, textureSize);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(textureSize, pos);
      ctx.stroke();
    }

    // Create Three.js texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat the texture so each grid cell is ~1 unit (arena size / cellsPerTexture)
    const repeatCount = size / cellsPerTexture;
    texture.repeat.set(repeatCount, repeatCount);

    // Create floor plane
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.rotation.x = -Math.PI / 2; // Lay flat (face up)
    this.floor.position.y = 0;
    this.floor.receiveShadow = true;

    this.group.add(this.floor);
  }

  /**
   * _createWalls — Build four low fence walls around the arena perimeter.
   *
   * Walls are decorative low fences — visible boundary markers.
   * They use a warm brown color for a friendly fence look.
   */
  _createWalls() {
    const size = GameConfig.arena.size;
    const halfSize = size / 2;
    const height = GameConfig.arena.wallHeight;
    const thickness = GameConfig.arena.wallThickness;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: GameConfig.arena.wallColor,
      roughness: 0.7,
      metalness: 0.1,
    });

    // Wall definitions: [width, height, depth, x, y, z]
    const wallDefs = [
      // North wall (back, -Z)
      [size + thickness * 2, height, thickness, 0, height / 2, -halfSize - thickness / 2],
      // South wall (front, +Z)
      [size + thickness * 2, height, thickness, 0, height / 2, halfSize + thickness / 2],
      // East wall (right, +X)
      [thickness, height, size + thickness * 2, halfSize + thickness / 2, height / 2, 0],
      // West wall (left, -X)
      [thickness, height, size + thickness * 2, -halfSize - thickness / 2, height / 2, 0],
    ];

    this.walls = [];
    for (const [w, h, d, x, y, z] of wallDefs) {
      const geometry = new THREE.BoxGeometry(w, h, d);
      const wall = new THREE.Mesh(geometry, wallMaterial);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.walls.push(wall);
      this.group.add(wall);
    }

    // Add fence post accents at corners for visual interest
    this._createFencePosts(halfSize, height, wallMaterial);
  }

  /**
   * _createFencePosts — Add vertical posts at the four arena corners.
   *
   * @param {number} halfSize - Half the arena size
   * @param {number} height - Wall height
   * @param {THREE.Material} material - Wall material
   */
  _createFencePosts(halfSize, height, material) {
    const postSize = GameConfig.arena.wallThickness * 2;
    const postHeight = height * 1.3; // Posts are slightly taller than walls
    const postGeometry = new THREE.BoxGeometry(postSize, postHeight, postSize);

    const corners = [
      [-halfSize, 0, -halfSize],
      [halfSize, 0, -halfSize],
      [-halfSize, 0, halfSize],
      [halfSize, 0, halfSize],
    ];

    for (const [x, , z] of corners) {
      const post = new THREE.Mesh(postGeometry, material);
      post.position.set(x, postHeight / 2, z);
      post.castShadow = true;
      this.group.add(post);
    }
  }

  /**
   * getGroup — Get the Three.js group containing all arena objects.
   *
   * @returns {THREE.Group}
   */
  getGroup() {
    return this.group;
  }

  /**
   * isInBounds — Check if a position is within the arena boundaries.
   *
   * @param {number} x - World X position
   * @param {number} z - World Z position
   * @param {number} margin - Extra padding from walls (default: 0.5)
   * @returns {boolean}
   */
  isInBounds(x, z, margin = 0.5) {
    const halfSize = GameConfig.arena.size / 2 - margin;
    return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
  }

  /**
   * clampPosition — Clamp a position to stay within arena bounds.
   *
   * @param {number} x
   * @param {number} z
   * @param {number} margin
   * @returns {{x: number, z: number}}
   */
  clampPosition(x, z, margin = 0.5) {
    const halfSize = GameConfig.arena.size / 2 - margin;
    return {
      x: Math.max(-halfSize, Math.min(halfSize, x)),
      z: Math.max(-halfSize, Math.min(halfSize, z)),
    };
  }
}
