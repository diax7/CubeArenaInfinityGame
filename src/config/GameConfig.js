/**
 * GameConfig.js — Central configuration for all tunable game parameters.
 *
 * Every magic number, default value, speed, size, and count lives here.
 * Changing a value here changes it everywhere in the game.
 *
 * Connected to: Every system in the game reads from this config.
 */

const GameConfig = {

  // ── Arena ──────────────────────────────────────────────────────────────
  arena: {
    size: 200,                  // Arena dimensions (200×200 units)
    wallHeight: 2.5,            // Low fence wall height
    wallThickness: 0.5,         // Wall thickness
    gridCellSize: 1,            // Grid cell size (1 cube-width per cell)
    floorColor: 0xF8F8F8,       // Floor background color (white)
    gridColor: 0xE0E0E0,        // Grid line color (light gray)
    wallColor: 0x8B7355,        // Fence wall color (soft brown)
    skyColor: 0xB3D9FF,         // Sky/background color (light blue)
  },

  // ── Camera ─────────────────────────────────────────────────────────────
  camera: {
    angle: Math.PI / 2.8,       // ~65° from horizontal (between 45° and top-down)
    height: 22,                 // Camera height above target
    distance: 10,               // Camera horizontal distance from target (closer = more top-down)
    followSpeed: 0.1,           // Lerp factor for smooth follow (0.08–0.12)
    fov: 50,                    // Field of view in degrees
    near: 0.1,                  // Near clipping plane
    far: 500,                   // Far clipping plane
  },

  // ── Player & Snake ─────────────────────────────────────────────────────
  snake: {
    cubeSize: 1.5,              // Size of each cube in the snake (1.5 units)
    bodySpacing: 1.0,           // Body cubes touch exactly (1.0 = edge-to-edge)
    turnSpeed: 5,               // How fast the snake turns toward target direction
    defaultStartingPower: 1,    // Default starting cube power (2^1 = 2)
    headCollisionRadius: 0.6,   // Head hitbox radius (0.6× cube size, forgiving)
    bodyCollisionRadius: 0.5,   // Body cube hitbox radius (0.5× cube size)
    invulnerabilityDuration: 3, // Seconds of invulnerability after respawn
    positionHistoryInterval: 12, // Frames of history gap per body cube (higher = more spacing)
  },

  // ── Movement Speed ─────────────────────────────────────────────────────
  speed: {
    min: 2,                     // Speed at setting 1
    max: 16,                    // Speed at setting 100
    default: 50,                // Default setting value (maps to 8 units/sec)
    aiMultiplier: 0.909,        // AI speed = player speed × 0.909 (10% slower)
  },

  // ── Ground Cubes ───────────────────────────────────────────────────────
  groundCubes: {
    defaultCount: 500,          // Default number of ground cubes on map
    cubeSize: 0.8,              // Slightly smaller than snake cubes (0.8×)
    rotationSpeed: 0.2,         // Rotation speed (radians/sec, ~1 rotation per 5 sec ≈ 1.26 rad/s)
    collisionRadius: 0.5,       // Collision radius for ground cubes
    respawnDelay: { min: 1, max: 2 }, // Seconds delay before respawning eaten cube
    wallPadding: 5,             // Minimum distance from walls when spawning

    // Weighted spawn distribution (power: weight)
    // power 0 = value 1, power 1 = value 2, etc.
    spawnWeights: [
      { power: 0, weight: 25 },  // value 1 → 25%
      { power: 1, weight: 20 },  // value 2 → 20%
      { power: 2, weight: 15 },  // value 4 → 15%
      { power: 3, weight: 12 },  // value 8 → 12%
      { power: 4, weight: 10 },  // value 16 → 10%
      { power: 5, weight: 7 },   // value 32 → 7%
      { power: 6, weight: 5 },   // value 64 → 5%
      { power: 7, weight: 3 },   // value 128 → 3%
      { power: 8, weight: 2 },   // value 256 → 2%
      { power: 9, weight: 1 },   // value 512+ → 1%
    ],
  },

  // ── AI Snakes ──────────────────────────────────────────────────────────
  ai: {
    defaultCount: 25,           // Default number of AI snakes on map
    spawnRange: 2,              // Spawn ±2 power levels from player's head
    minSpawnDistance: 30,        // Minimum distance from player when spawning
    respawnDelay: { min: 2, max: 5 }, // Seconds delay before respawning dead AI
    decisionInterval: 200,      // Milliseconds between AI decisions
    seekRadius: 30,             // How far AI looks for targets
    fleeRadius: 40,             // How far AI flees from threats
  },

  // ── Combat ─────────────────────────────────────────────────────────────
  combat: {
    bounceForce: 3,             // Push-apart force when equal heads collide
    bounceDuration: 250,        // Bounce animation duration (ms)
    cubeDropScatter: 2,         // How far dropped cubes scatter from death position
  },

  // ── Number System ──────────────────────────────────────────────────────
  numbers: {
    infinityPower: 80,          // Power value that represents ∞
    maxDisplayPower: 79,        // Highest normal display power (512St)
  },

  // ── UI ─────────────────────────────────────────────────────────────────
  ui: {
    backgroundColor: '#F5F5F5',
    primaryButtonColor: '#4CAF50',
    textColor: '#333333',
    secondaryTextColor: '#888888',
    leaderboardHighlight: '#FFF3CD',
    toggleOnColor: '#4CAF50',
    toggleOffColor: '#CCCCCC',
    fontFamily: "'Nunito', sans-serif",
  },

  // ── Animations ─────────────────────────────────────────────────────────
  animations: {
    eatDuration: 150,           // Absorb animation (ms)
    mergeDuration: 200,         // Pop & grow animation (ms)
    chainMergeDuration: 150,    // Each chain merge step (ms)
    numberFlyUpDuration: 300,   // Number fly-up text (ms)
    bounceDuration: 250,        // Equal heads bounce (ms)
    headKillDuration: 400,      // Explosion scatter (ms)
    bodyKillDuration: 350,      // Slice & scatter (ms)
    deathDuration: 500,         // Player death shatter (ms)
    screenShakeDuration: 200,   // Screen shake (ms)
    particleDuration: 300,      // Sparkle particles (ms)
  },

  // ── Performance ────────────────────────────────────────────────────────
  performance: {
    spatialHashCellSize: 10,    // Spatial hashing grid cell size (units)
    particlePoolSize: 200,      // Pre-created particle pool
    cubePoolSize: 1000,         // Pre-created cube mesh pool
    maxSimultaneousSounds: 6,   // Max concurrent audio playback
  },

  // ── Leaderboard ────────────────────────────────────────────────────────
  leaderboard: {
    displayCount: 5,            // Show top 5 in HUD
    updateInterval: 500,        // Update ranking every 500ms
  },

  // ── Crown ──────────────────────────────────────────────────────────────
  crown: {
    color: 0xFFD700,            // Gold color
    floatHeight: 0.5,           // Height above head cube (in cube-heights)
    rotationSpeed: (2 * Math.PI) / 3, // 1 rotation per 3 seconds
    bobAmplitude: 0.1,          // Up/down bob amount
    bobSpeed: 2,                // Bob cycles per second
  },
};

export default GameConfig;
