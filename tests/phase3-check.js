/**
 * phase3-check.js — Automated checklist verification for Phase 3.
 * Run with: node tests/phase3-check.js
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
  return readFileSync(path, 'utf-8').includes(pattern);
}

console.log('\n🔍 Phase 3 Completion Checklist\n');

// ── Step 3.1: AI Snake Spawning ────────────────────────────────────────
console.log('Step 3.1 — AI Snake Spawning:');
check(existsSync('src/ai/AISpawner.js'), 'AISpawner.js exists');
check(fileContains('src/ai/AISpawner.js', 'spawnInitialAI'), 'spawnInitialAI method');
check(fileContains('src/ai/AISpawner.js', 'BOT_NAMES'), 'Bot names list (50+)');
check(fileContains('src/ai/AISpawner.js', 'spawnRange'), 'Spawn ±2 power range');
check(fileContains('src/ai/AISpawner.js', 'minSpawnDistance'), 'Min distance from player');
check(fileContains('src/ai/AISpawner.js', 'scheduleRespawn'), 'Respawn scheduling');
check(fileContains('src/ai/AISpawner.js', 'removeDeadSnakes'), 'Dead snake cleanup');

// ── Step 3.2: AI Movement & Behavior ──────────────────────────────────
console.log('\nStep 3.2 — AI Movement & Behavior:');
check(existsSync('src/ai/SteeringBehavior.js'), 'SteeringBehavior.js exists');
check(fileContains('src/ai/SteeringBehavior.js', 'export function seek'), 'Seek behavior');
check(fileContains('src/ai/SteeringBehavior.js', 'export function flee'), 'Flee behavior');
check(fileContains('src/ai/SteeringBehavior.js', 'export function wander'), 'Wander behavior');
check(fileContains('src/ai/SteeringBehavior.js', 'export function avoidWalls'), 'Wall avoidance');

check(existsSync('src/ai/AIController.js'), 'AIController.js exists');
check(fileContains('src/ai/AIController.js', 'decisionInterval'), 'Decision interval (200ms)');
check(fileContains('src/ai/AIController.js', '_makeDecision'), 'Decision making logic');
check(fileContains('src/ai/AIController.js', 'seek-food'), 'Seek food behavior');
check(fileContains('src/ai/AIController.js', 'chase'), 'Chase prey behavior');
check(fileContains('src/ai/AIController.js', 'avoid'), 'Avoid threats behavior');
check(fileContains('src/ai/AIController.js', 'flee-player'), 'Fear mode fleeing');
check(fileContains('src/ai/AIController.js', '_findNearestFood'), 'Nearest food finding');
check(fileContains('src/ai/AIController.js', '_applySteering'), 'Steering application');

// ── Step 3.3: Collision & Combat System ────────────────────────────────
console.log('\nStep 3.3 — Collision & Combat System:');
check(existsSync('src/systems/CombatSystem.js'), 'CombatSystem.js exists');
check(fileContains('src/systems/CombatSystem.js', 'checkSnakeVsSnake'), 'Snake vs snake check');
check(fileContains('src/systems/CombatSystem.js', 'head-kill'), 'Head kill handling');
check(fileContains('src/systems/CombatSystem.js', 'body-kill'), 'Body kill handling');
check(fileContains('src/systems/CombatSystem.js', 'bounce'), 'Equal head bounce');
check(fileContains('src/systems/CombatSystem.js', 'attacker-dies'), 'Attacker death');
check(fileContains('src/systems/CombatSystem.js', '_dropCubesOnGround'), 'Cube drop on death');
check(fileContains('src/systems/CombatSystem.js', 'cubeDropScatter'), 'Scatter dropped cubes');

// ── Step 3.4: Game Integration ─────────────────────────────────────────
console.log('\nStep 3.4 — Game Integration:');
check(fileContains('src/core/Game.js', 'AISpawner'), 'AISpawner imported');
check(fileContains('src/core/Game.js', 'CombatSystem'), 'CombatSystem imported');
check(fileContains('src/core/Game.js', 'spawnInitialAI'), 'AI spawned at game start');
check(fileContains('src/core/Game.js', '_updateAI'), 'AI update in game loop');
check(fileContains('src/core/Game.js', '_updateAIGroundCubeCollisions'), 'AI eats ground cubes');
check(fileContains('src/core/Game.js', '_checkCombat'), 'Combat checks in game loop');
check(fileContains('src/core/Game.js', '_cleanupDeadAI'), 'Dead AI cleanup');
check(fileContains('src/core/Game.js', '_onPlayerDeath'), 'Player death handling');
check(fileContains('src/core/Game.js', '_respawnPlayer'), 'Player respawn');
check(fileContains('src/core/Game.js', 'GAMEOVER'), 'Game over state');
check(fileContains('src/core/Game.js', 'aiSnakeCount'), 'AI count from settings');
check(fileContains('src/core/Game.js', 'fearMode'), 'Fear mode passed to AI');

// ── Summary ────────────────────────────────────────────────────────────
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
process.exit(failed > 0 ? 1 : 0);
