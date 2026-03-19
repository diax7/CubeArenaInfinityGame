/**
 * phase2-check.js — Automated checklist verification for Phase 2.
 *
 * Checks file existence, imports, and key code patterns to verify
 * that all Phase 2 features are implemented correctly.
 *
 * Run with: node tests/phase2-check.js
 */

import { readFileSync, existsSync } from 'fs';

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${message}`);
  }
}

function fileContains(path, pattern) {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, 'utf-8');
  return content.includes(pattern);
}

console.log('\n🔍 Phase 2 Completion Checklist\n');

// ── Step 2.1: Player Snake Movement ────────────────────────────────────
console.log('Step 2.1 — Player Snake Movement:');
check(existsSync('src/entities/Snake.js'), 'Snake.js exists');
check(fileContains('src/entities/Snake.js', 'class Snake'), 'Snake class defined');
check(fileContains('src/entities/Snake.js', 'setTargetDirection'), 'setTargetDirection method');
check(fileContains('src/entities/Snake.js', '_smoothTurn'), 'Smooth turning implemented');
check(fileContains('src/entities/Snake.js', '_moveHead'), 'Head movement with clamp');
check(fileContains('src/entities/Snake.js', 'isPlayer'), 'isPlayer flag for player/AI');
check(fileContains('src/entities/Snake.js', 'speed'), 'Speed property');
check(fileContains('src/entities/Snake.js', 'clampFn'), 'Wall collision (clamp function)');

// ── Step 2.2: Snake Body Chain ─────────────────────────────────────────
console.log('\nStep 2.2 — Snake Body Chain:');
check(fileContains('src/entities/Snake.js', '_positionHistory'), 'Position history buffer');
check(fileContains('src/entities/Snake.js', '_recordPosition'), 'Position recording');
check(fileContains('src/entities/Snake.js', '_updateBodyPositions'), 'Body following logic');
check(fileContains('src/entities/Snake.js', 'positionHistoryInterval'), 'History spacing config');
check(fileContains('src/entities/Snake.js', 'lerpFactor'), 'Smooth interpolation');

// ── Step 2.3: Ground Cube Spawning ─────────────────────────────────────
console.log('\nStep 2.3 — Ground Cube Spawning:');
check(existsSync('src/systems/SpawnSystem.js'), 'SpawnSystem.js exists');
check(fileContains('src/systems/SpawnSystem.js', 'InstancedMesh'), 'InstancedMesh for performance');
check(fileContains('src/systems/SpawnSystem.js', 'spawnInitialGroundCubes'), 'Initial spawn method');
check(fileContains('src/systems/SpawnSystem.js', '_getRandomPower'), 'Weighted random power');
check(fileContains('src/systems/SpawnSystem.js', 'spawnWeights'), 'Uses GameConfig spawn weights');
check(fileContains('src/systems/SpawnSystem.js', 'rotationSpeed'), 'Ground cubes rotate');
check(fileContains('src/systems/SpawnSystem.js', 'scheduleRespawn'), 'Respawn after eating');

// ── Step 2.4: Eating Ground Cubes ──────────────────────────────────────
console.log('\nStep 2.4 — Eating Ground Cubes:');
check(existsSync('src/systems/CollisionSystem.js'), 'CollisionSystem.js exists');
check(fileContains('src/systems/CollisionSystem.js', 'spatialHashCellSize'), 'Spatial hash config');
check(fileContains('src/systems/SpawnSystem.js', 'checkCollision'), 'Collision check method');
check(fileContains('src/core/Game.js', '_checkGroundCubeCollisions'), 'Collision check in game loop');
check(fileContains('src/core/Game.js', 'insertCube'), 'Cube insertion into snake');
check(fileContains('src/core/Game.js', 'WOULD DIE'), 'Death detection (logged for now)');
check(fileContains('src/entities/Snake.js', 'insertCube'), 'Snake insertCube method');

// ── Step 2.5: Merge System ─────────────────────────────────────────────
console.log('\nStep 2.5 — Merge System:');
check(existsSync('src/systems/MergeSystem.js'), 'MergeSystem.js exists');
check(fileContains('src/systems/MergeSystem.js', 'checkAndMerge'), 'checkAndMerge method');
check(fileContains('src/systems/MergeSystem.js', 'while (merged)'), 'Chain reaction loop');
check(fileContains('src/systems/MergeSystem.js', 'power + 1'), 'Power doubles on merge');
check(fileContains('src/systems/MergeSystem.js', '_playMergeAnimation'), 'Merge animation');
check(fileContains('src/core/Game.js', 'mergeSystem.checkAndMerge'), 'Merge triggered after eating');

// ── Game Loop Integration ──────────────────────────────────────────────
console.log('\nGame Loop Integration:');
check(fileContains('src/core/Game.js', 'new Snake('), 'Player snake created');
check(fileContains('src/core/Game.js', 'player.update'), 'Player updated each frame');
check(fileContains('src/core/Game.js', 'spawnSystem.update'), 'Ground cubes updated');
check(fileContains('src/core/Game.js', 'cameraController.setTarget'), 'Camera follows player');
check(fileContains('src/core/Game.js', 'input.getDirection'), 'Input feeds into snake');
check(!fileContains('src/core/Game.js', '_createTestCubes'), 'Test cubes removed');

// ── Summary ────────────────────────────────────────────────────────────
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
process.exit(failed > 0 ? 1 : 0);
