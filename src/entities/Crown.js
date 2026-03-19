/**
 * Crown.js — Golden crown indicator for the arena leader.
 *
 * Connected to: LeaderboardSystem.js, Snake.js, Game.js
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';

export default class Crown {
  constructor() {
    this.group = new THREE.Group();
    this._buildCrown();
    this._time = 0;
    this._currentTarget = null;
    this.group.visible = false;
  }

  /**
   * _buildCrown — Procedural low-poly crown mesh.
   */
  _buildCrown() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Base ring (flattened cylinder)
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.55, 0.2, 8),
      mat
    );
    this.group.add(base);

    // Crown points (5 triangular spikes)
    const pointCount = 5;
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.4, 4),
        mat
      );
      spike.position.set(
        Math.cos(angle) * 0.4,
        0.3,
        Math.sin(angle) * 0.4
      );
      this.group.add(spike);
    }

    // Tiny gem on top of each spike
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xFF4444,
      emissive: 0xFF4444,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.5,
    });
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const gem = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        gemMat
      );
      gem.position.set(
        Math.cos(angle) * 0.4,
        0.52,
        Math.sin(angle) * 0.4
      );
      this.group.add(gem);
    }

    // Scale down to fit cube heads
    this.group.scale.set(0.8, 0.8, 0.8);
  }

  /**
   * update — Animate rotation/bob and follow the leader snake.
   * @param {number} dt
   * @param {object|null} leaderSnake - The snake to crown (or null)
   */
  update(dt, leaderSnake) {
    this._time += dt;

    if (!leaderSnake || !leaderSnake.isAlive || leaderSnake.body.length === 0) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;
    const cfg = GameConfig.crown;

    // Position above the leader's head
    const headPos = leaderSnake.head.getPosition();
    const cubeSize = leaderSnake.head.size;
    const floatY = cubeSize + cfg.floatHeight + Math.sin(this._time * cfg.bobSpeed) * cfg.bobAmplitude;

    // Smooth follow
    this.group.position.lerp(
      new THREE.Vector3(headPos.x, floatY, headPos.z),
      0.15
    );

    // Rotate
    this.group.rotation.y += cfg.rotationSpeed * dt;
  }

  dispose() {
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
