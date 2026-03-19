/**
 * SpawnSystem.js — Ground cube spawning and management using InstancedMesh.
 *
 * Manages all ground cubes on the arena floor. Uses Three.js InstancedMesh
 * for high performance (single draw call for all ground cubes).
 *
 * How it works:
 * 1. Pre-allocates an InstancedMesh with max capacity for all ground cubes
 * 2. Each ground cube is an "instance" with its own position, color, and rotation
 * 3. Cube data (power, position, active/inactive) is tracked in parallel arrays
 * 4. When a cube is eaten, it's marked inactive and respawned after a delay
 * 5. Number textures are rendered on small sprite planes above each cube
 *
 * Connected to: Game.js (update loop), CollisionSystem.js (collision checks),
 *               GameConfig.js (spawn weights, counts)
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';
import { formatPower } from '../utils/NumberFormatter.js';
import { getColorForPower, getColorHex } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';
import { loadSettings } from '../utils/Storage.js';
import { INFINITY_POWER } from '../utils/Constants.js';

export default class SpawnSystem {
  /**
   * @param {object} scene - Scene instance (has add/remove methods)
   * @param {object} arena - Arena instance (has clampPosition, isInBounds)
   */
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;

    // Load ground cube count from settings
    const settings = loadSettings();
    this.maxCubes = settings.groundCubeCount || GameConfig.groundCubes.defaultCount;

    // Ground cube size (slightly smaller than snake cubes)
    this.cubeSize = GameConfig.snake.cubeSize * GameConfig.groundCubes.cubeSize;

    // Parallel arrays for tracking each ground cube's state
    this.powers = new Array(this.maxCubes).fill(0);    // Power value of each cube
    this.active = new Array(this.maxCubes).fill(false); // Whether this slot is alive
    this.posX = new Float32Array(this.maxCubes);        // X positions
    this.posZ = new Float32Array(this.maxCubes);        // Z positions
    this.colors = new Array(this.maxCubes).fill('#FFFFFF');

    // Respawn queue — cubes waiting to respawn after being eaten
    this._respawnQueue = [];

    // Cumulative weights for weighted random power selection
    this._cumulativeWeights = this._buildCumulativeWeights();

    // Build the InstancedMesh for cube bodies
    this._createInstancedMesh();

    // Build number label sprites (one per cube)
    this._numberSprites = [];
    this._createNumberSprites();

    // Root group containing everything
    this.group = new THREE.Group();
    this.group.add(this.instancedMesh);
    for (const sprite of this._numberSprites) {
      this.group.add(sprite);
    }
    this.scene.add(this.group);

    // Track active count
    this.activeCount = 0;
  }

  /**
   * _getSizeForPower — Compute ground cube size based on power value.
   * Mirrors the same scale formula used in Cube.js so ground cubes
   * also show noticeable size differences.
   *
   * @param {number} power - Power exponent
   * @returns {number} - Scale factor relative to base cubeSize
   */
  _getSizeForPower(power) {
    return 0.7 + Math.min(power, 20) * 0.035;
  }

  /**
   * _buildCumulativeWeights — Pre-compute cumulative weight array for
   * weighted random cube value selection.
   *
   * @returns {Array<{power: number, cumWeight: number}>}
   */
  _buildCumulativeWeights() {
    const weights = GameConfig.groundCubes.spawnWeights;
    let cumulative = 0;
    return weights.map(w => {
      cumulative += w.weight;
      return { power: w.power, cumWeight: cumulative };
    });
  }

  /**
   * _getRandomPower — Pick a random power using weighted distribution.
   * Follows CLAUDE.md Section 16 Game Balance Tables.
   *
   * @returns {number} - Power exponent for the ground cube
   */
  _getRandomPower() {
    const total = this._cumulativeWeights[this._cumulativeWeights.length - 1].cumWeight;
    const roll = Math.random() * total;
    for (const entry of this._cumulativeWeights) {
      if (roll <= entry.cumWeight) {
        return entry.power;
      }
    }
    return 0; // Fallback: power 0 = value 1
  }

  /**
   * _createInstancedMesh — Build the shared InstancedMesh for all ground cubes.
   * Single draw call for up to maxCubes cubes.
   */
  _createInstancedMesh() {
    const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.05,
      vertexColors: false,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxCubes);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Enable per-instance color
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.maxCubes * 3), 3
    );
    this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    // Initialize all instances as invisible (scale 0)
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.maxCubes; i++) {
      this.instancedMesh.setMatrixAt(i, zeroMatrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.count = this.maxCubes;
  }

  /**
   * _createNumberSprites — Create small plane meshes for number labels
   * that float above each ground cube.
   */
  _createNumberSprites() {
    for (let i = 0; i < this.maxCubes; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(this.cubeSize * 1.2, this.cubeSize * 1.2, 1);
      sprite.visible = false;
      sprite.renderOrder = 1;

      // Store canvas ref on the sprite for later updates
      sprite.userData.canvas = canvas;
      sprite.userData.texture = texture;

      this._numberSprites.push(sprite);
    }
  }

  /**
   * _updateNumberSprite — Redraw the number label for a specific cube slot.
   *
   * @param {number} index - Slot index
   * @param {number} power - Power value to display
   * @param {string} color - Background hex color
   */
  _updateNumberSprite(index, power, color) {
    const sprite = this._numberSprites[index];
    const canvas = sprite.userData.canvas;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw circular colored background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw number text
    const text = formatPower(power);
    let fontSize;
    if (text.length <= 2) fontSize = 28;
    else if (text.length <= 3) fontSize = 22;
    else fontSize = 18;

    ctx.font = `bold ${fontSize}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black outline for readability
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(text, size / 2, size / 2);

    // White fill
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, size / 2, size / 2);

    sprite.userData.texture.needsUpdate = true;
  }

  /**
   * spawnInitialGroundCubes — Spawn all ground cubes at random positions.
   * Called once when the game starts.
   */
  spawnInitialGroundCubes() {
    const halfSize = GameConfig.arena.size / 2;
    const padding = GameConfig.groundCubes.wallPadding;
    const minPos = -halfSize + padding;
    const maxPos = halfSize - padding;

    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();

    for (let i = 0; i < this.maxCubes; i++) {
      // Random position within arena
      const x = randomRange(minPos, maxPos);
      const z = randomRange(minPos, maxPos);

      // Random power from weighted distribution
      const power = this._getRandomPower();
      const color = getColorForPower(power);

      // Store data
      this.powers[i] = power;
      this.active[i] = true;
      this.posX[i] = x;
      this.posZ[i] = z;
      this.colors[i] = color;

      // Compute per-instance scale based on power
      const scaleFactor = this._getSizeForPower(power);
      const actualSize = this.cubeSize * scaleFactor;
      const y = actualSize / 2;

      // Build transform: translate + scale
      tempMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor);
      tempMatrix.setPosition(x, y, z);
      this.instancedMesh.setMatrixAt(i, tempMatrix);

      // Set per-instance color
      tempColor.set(color);
      this.instancedMesh.setColorAt(i, tempColor);

      // Update number sprite — position and scale match the cube
      this._updateNumberSprite(i, power, color);
      const sprite = this._numberSprites[i];
      sprite.position.set(x, actualSize + 0.3, z);
      sprite.scale.set(actualSize * 1.2, actualSize * 1.2, 1);
      sprite.visible = true;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.instanceColor.needsUpdate = true;
    this.activeCount = this.maxCubes;
  }

  /**
   * update — Called every frame. Rotates ground cubes and processes respawn queue.
   *
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Process respawn queue
    for (let i = this._respawnQueue.length - 1; i >= 0; i--) {
      this._respawnQueue[i].timer -= dt;
      if (this._respawnQueue[i].timer <= 0) {
        this._respawnCube(this._respawnQueue[i].index);
        this._respawnQueue.splice(i, 1);
      }
    }

    // Rotate all active ground cubes (apply rotation around Y axis)
    const rotSpeed = GameConfig.groundCubes.rotationSpeed * dt;
    const tempMatrix = new THREE.Matrix4();
    const rotMatrix = new THREE.Matrix4().makeRotationY(rotSpeed);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < this.maxCubes; i++) {
      if (!this.active[i]) continue;

      this.instancedMesh.getMatrixAt(i, tempMatrix);
      tempMatrix.decompose(pos, quat, scale);

      // Apply rotation
      const newQuat = quat.clone().multiply(new THREE.Quaternion().setFromRotationMatrix(rotMatrix));

      tempMatrix.compose(pos, newQuat, scale);
      this.instancedMesh.setMatrixAt(i, tempMatrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * checkCollision — Check if a point (snake head) collides with any active ground cube.
   * Returns the first colliding cube's data WITHOUT removing it.
   * Call eatCube() separately to actually consume the cube.
   *
   * @param {number} hx - Head X position
   * @param {number} hz - Head Z position
   * @param {number} headRadius - Head collision radius
   * @returns {null|{power: number, x: number, z: number, index: number}} - Colliding cube data or null
   */
  checkCollision(hx, hz, headRadius) {
    const groundRadius = this.cubeSize * GameConfig.groundCubes.collisionRadius;
    const combinedRadius = headRadius + groundRadius;
    const combinedRadiusSq = combinedRadius * combinedRadius;

    for (let i = 0; i < this.maxCubes; i++) {
      if (!this.active[i]) continue;

      const dx = hx - this.posX[i];
      const dz = hz - this.posZ[i];
      const distSq = dx * dx + dz * dz;

      if (distSq < combinedRadiusSq) {
        return {
          power: this.powers[i],
          x: this.posX[i],
          z: this.posZ[i],
          index: i,
        };
      }
    }

    return null;
  }

  /**
   * eatCube — Consume a ground cube by index (deactivate it from the arena).
   * Called after checkCollision confirms the snake can eat this cube.
   *
   * @param {number} index - Slot index of the cube to eat
   */
  eatCube(index) {
    this._deactivateCube(index);
  }

  /**
   * _deactivateCube — Hide a ground cube (eaten or removed).
   *
   * @param {number} index - Slot index
   */
  _deactivateCube(index) {
    this.active[index] = false;
    this.activeCount--;

    // Scale to zero to hide it
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    this.instancedMesh.setMatrixAt(index, zeroMatrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Hide number sprite
    this._numberSprites[index].visible = false;
  }

  /**
   * scheduleRespawn — Queue a respawn for the most recently eaten cube slot.
   * Finds the first inactive slot and schedules it to reappear after a random delay.
   */
  scheduleRespawn() {
    // Find an inactive slot
    for (let i = 0; i < this.maxCubes; i++) {
      if (!this.active[i] && !this._respawnQueue.some(r => r.index === i)) {
        const delay = randomRange(
          GameConfig.groundCubes.respawnDelay.min,
          GameConfig.groundCubes.respawnDelay.max
        );
        this._respawnQueue.push({ index: i, timer: delay });
        return;
      }
    }
  }

  /**
   * _respawnCube — Respawn a ground cube at a random position with a new random value.
   *
   * @param {number} index - Slot index to respawn
   */
  _respawnCube(index) {
    const halfSize = GameConfig.arena.size / 2;
    const padding = GameConfig.groundCubes.wallPadding;
    const minPos = -halfSize + padding;
    const maxPos = halfSize - padding;

    const x = randomRange(minPos, maxPos);
    const z = randomRange(minPos, maxPos);
    const power = this._getRandomPower();
    const color = getColorForPower(power);

    this.powers[index] = power;
    this.active[index] = true;
    this.posX[index] = x;
    this.posZ[index] = z;
    this.colors[index] = color;

    // Update instanced mesh with per-power scale
    const scaleFactor = this._getSizeForPower(power);
    const actualSize = this.cubeSize * scaleFactor;
    const y = actualSize / 2;

    const tempMatrix = new THREE.Matrix4();
    tempMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor);
    tempMatrix.setPosition(x, y, z);
    this.instancedMesh.setMatrixAt(index, tempMatrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    const tempColor = new THREE.Color(color);
    this.instancedMesh.setColorAt(index, tempColor);
    this.instancedMesh.instanceColor.needsUpdate = true;

    // Update number sprite with matching size
    this._updateNumberSprite(index, power, color);
    const sprite = this._numberSprites[index];
    sprite.position.set(x, actualSize + 0.3, z);
    sprite.scale.set(actualSize * 1.2, actualSize * 1.2, 1);
    sprite.visible = true;

    this.activeCount++;
  }

  /**
   * respawnImmediate — Immediately respawn a specific cube at a specific location.
   * Used when a cube can't be eaten (wrong mode) and needs to be put back.
   *
   * @param {number} power - Cube power
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  respawnImmediate(power, x, z) {
    // Find an inactive slot
    for (let i = 0; i < this.maxCubes; i++) {
      if (!this.active[i] && !this._respawnQueue.some(r => r.index === i)) {
        const color = getColorForPower(power);
        this.powers[i] = power;
        this.active[i] = true;
        this.posX[i] = x;
        this.posZ[i] = z;
        this.colors[i] = color;

        const scaleFactor = this._getSizeForPower(power);
        const actualSize = this.cubeSize * scaleFactor;
        const y = actualSize / 2;

        const tempMatrix = new THREE.Matrix4();
        tempMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor);
        tempMatrix.setPosition(x, y, z);
        this.instancedMesh.setMatrixAt(i, tempMatrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;

        const tempColor = new THREE.Color(color);
        this.instancedMesh.setColorAt(i, tempColor);
        this.instancedMesh.instanceColor.needsUpdate = true;

        this._updateNumberSprite(i, power, color);
        const sprite = this._numberSprites[i];
        sprite.position.set(x, actualSize + 0.3, z);
        sprite.scale.set(actualSize * 1.2, actualSize * 1.2, 1);
        sprite.visible = true;

        this.activeCount++;
        return;
      }
    }
  }

  /**
   * dispose — Clean up all Three.js resources.
   */
  dispose() {
    this.instancedMesh.geometry.dispose();
    this.instancedMesh.material.dispose();
    for (const sprite of this._numberSprites) {
      sprite.material.map.dispose();
      sprite.material.dispose();
    }
    this.scene.remove(this.group);
  }
}
