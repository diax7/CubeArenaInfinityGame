/**
 * ParticleSystem.js — Object-pooled particle effects.
 * Uses small sphere meshes with velocity, gravity, lifetime, and fade.
 * Connected to: Game.js, AnimationManager.js
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';

export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.pool = [];

    // Pre-create particle pool
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    for (let i = 0; i < GameConfig.performance.particlePoolSize; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.pool.push({ mesh, mat, active: false, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0 });
    }
  }

  /**
   * emit — Burst particles at a position.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} count - Number of particles
   * @param {number} color - Hex color
   * @param {number} speed - Emission speed
   * @param {number} lifetime - Seconds
   */
  emit(x, y, z, count = 8, color = 0xffffff, speed = 3, lifetime = 0.4) {
    for (let i = 0; i < count; i++) {
      const p = this._getFromPool();
      if (!p) break;

      p.mesh.position.set(x, y, z);
      p.mat.color.setHex(color);
      p.mat.opacity = 1;
      p.mesh.visible = true;
      p.active = true;
      p.life = lifetime;
      p.maxLife = lifetime;

      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      p.vx = Math.cos(theta) * Math.cos(phi) * speed * (0.5 + Math.random());
      p.vy = Math.sin(phi) * speed * (0.5 + Math.random()) + 2;
      p.vz = Math.sin(theta) * Math.cos(phi) * speed * (0.5 + Math.random());
    }
  }

  /**
   * update — Move and age all active particles.
   * @param {number} dt
   */
  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;

      // Move
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      // Gravity
      p.vy -= 9.8 * dt;

      // Age and fade
      p.life -= dt;
      p.mat.opacity = Math.max(0, p.life / p.maxLife);

      // Floor bounce
      if (p.mesh.position.y < 0.1) {
        p.mesh.position.y = 0.1;
        p.vy *= -0.3;
      }

      // Deactivate
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  _getFromPool() {
    return this.pool.find(p => !p.active) || null;
  }

  dispose() {
    for (const p of this.pool) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mat.dispose();
    }
  }
}
