/**
 * Scene.js — Three.js scene setup, lighting, and renderer.
 *
 * Creates and configures the WebGL renderer, scene, and lighting.
 * Handles window resize events to keep the canvas full-screen.
 *
 * How it works:
 * 1. Creates a WebGL renderer with antialiasing, attached to the game container
 * 2. Sets up the scene with a light blue background (cheerful sky feel)
 * 3. Adds bright ambient light + one soft directional light (no harsh shadows)
 * 4. Listens for window resize and updates renderer/camera accordingly
 *
 * Connected to: Game.js (owns the render loop), Camera.js (provides camera),
 *               Arena.js (added to scene), all entities (added to scene)
 */

import * as THREE from 'three';
import GameConfig from '../config/GameConfig.js';

export default class Scene {
  /**
   * @param {HTMLElement} container - The DOM element to attach the renderer to
   */
  constructor(container) {
    // Store reference to the DOM container
    this.container = container;

    // Create the Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GameConfig.arena.skyColor);

    // Create WebGL renderer with antialiasing for smooth edges
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Attach canvas to the container
    container.appendChild(this.renderer.domElement);

    // Set up lighting
    this._setupLighting();

    // Handle window resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /**
   * _setupLighting — Create bright, cheerful lighting with no harsh shadows.
   *
   * Uses a combination of:
   * - Ambient light: fills the scene with even base illumination
   * - Directional light: provides soft sunlight-like shadows and depth
   * - Hemisphere light: adds sky/ground color blending for natural feel
   */
  _setupLighting() {
    // Ambient light — strong base illumination for bright, vibrant cubes
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);

    // Hemisphere light — sky blue from above, warm from below
    const hemi = new THREE.HemisphereLight(0xB3D9FF, 0xFFE4B5, 0.5);
    this.scene.add(hemi);

    // Directional light — bright sunlight from above-right
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(50, 80, 50);
    directional.castShadow = true;

    // Configure shadow map for soft shadows over a large area
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.left = -100;
    directional.shadow.camera.right = 100;
    directional.shadow.camera.top = 100;
    directional.shadow.camera.bottom = -100;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 200;
    directional.shadow.bias = -0.001;

    this.scene.add(directional);

    // Store reference for potential later use
    this.directionalLight = directional;
  }

  /**
   * _onResize — Update renderer and notify when window size changes.
   */
  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * render — Render one frame.
   *
   * @param {THREE.Camera} camera - The camera to render from
   */
  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  /**
   * add — Add an object to the scene.
   *
   * @param {THREE.Object3D} object
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * remove — Remove an object from the scene.
   *
   * @param {THREE.Object3D} object
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * dispose — Clean up renderer and event listeners.
   */
  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
