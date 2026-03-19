/**
 * phase4-check.js — Automated checklist for Phase 4.
 * Run with: node tests/phase4-check.js
 */

import { readFileSync, existsSync } from 'fs';

let passed = 0;
let failed = 0;

function check(condition, msg) {
  if (condition) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.log(`  ❌ FAIL: ${msg}`); }
}

function fc(path, pat) {
  if (!existsSync(path)) return false;
  return readFileSync(path, 'utf-8').includes(pat);
}

console.log('\n🔍 Phase 4 Completion Checklist\n');

// 4.1 Reverse Mode
console.log('4.1 — Reverse Mode:');
check(fc('src/systems/ModeSystem.js', 'toggleReverse'), 'ModeSystem.toggleReverse');
check(fc('src/systems/ModeSystem.js', 'canEatGround'), 'canEatGround helper');
check(fc('src/systems/ModeSystem.js', 'reverseMode'), 'reverseMode flag');
check(fc('src/core/Game.js', '_toggleReverse'), 'Toggle reverse in Game.js');
check(fc('src/core/Game.js', 'reverseMode'), 'Reverse mode used in Game.js');
check(fc('src/core/Game.js', 'setAsNewHead'), 'Reverse: bigger cube becomes head');

// 4.2 Fear Mode
console.log('\n4.2 — Fear Mode:');
check(fc('src/systems/ModeSystem.js', 'toggleFear'), 'ModeSystem.toggleFear');
check(fc('src/systems/ModeSystem.js', 'fearMode'), 'fearMode flag');
check(fc('src/core/Game.js', '_toggleFear'), 'Toggle fear in Game.js');
check(fc('src/ai/AIController.js', 'flee-player'), 'AI flees from player');
check(fc('src/ai/AIController.js', 'fearMode'), 'Fear mode in AI');

// 4.3 Crown
console.log('\n4.3 — Crown System:');
check(existsSync('src/entities/Crown.js'), 'Crown.js exists');
check(fc('src/entities/Crown.js', 'ConeGeometry'), 'Crown spikes');
check(fc('src/entities/Crown.js', 'FFD700'), 'Gold color');
check(fc('src/entities/Crown.js', 'rotationSpeed'), 'Crown rotation');
check(fc('src/core/Game.js', '_updateCrown'), 'Crown updated in game loop');
check(fc('src/core/Game.js', 'getLeader'), 'Leader for crown');

// 4.4 HUD
console.log('\n4.4 — Game HUD:');
check(existsSync('src/ui/GameHUD.js'), 'GameHUD.js exists');
check(fc('src/ui/GameHUD.js', 'hud-score'), 'Score display');
check(fc('src/ui/GameHUD.js', 'hud-kills'), 'Kills display');
check(fc('src/ui/GameHUD.js', 'hud-timer'), 'Timer display');
check(fc('src/ui/GameHUD.js', 'hud-leaderboard'), 'Leaderboard');
check(fc('src/ui/GameHUD.js', 'hud-reverse'), 'Reverse toggle button');
check(fc('src/ui/GameHUD.js', 'hud-fear'), 'Fear toggle button');
check(fc('src/ui/GameHUD.js', 'hud-pause'), 'Pause button');
check(fc('src/ui/GameHUD.js', 'stopPropagation'), 'Buttons don\'t affect movement');

// 4.5 Pause
console.log('\n4.5 — Pause Menu:');
check(existsSync('src/ui/PauseMenu.js'), 'PauseMenu.js exists');
check(fc('src/ui/PauseMenu.js', 'PAUSED'), 'PAUSED title');
check(fc('src/ui/PauseMenu.js', 'RESUME'), 'Resume button');
check(fc('src/ui/PauseMenu.js', 'QUIT'), 'Quit button');
check(fc('src/core/Game.js', '_pauseGame'), 'Pause in Game.js');
check(fc('src/core/Game.js', '_resumeGame'), 'Resume in Game.js');
check(fc('src/core/Game.js', 'Escape'), 'Escape key pauses');

// 4.6 Home Screen
console.log('\n4.6 — Home Screen:');
check(existsSync('src/ui/HomeScreen.js'), 'HomeScreen.js exists');
check(fc('src/ui/HomeScreen.js', 'CUBE ARENA'), 'Game title');
check(fc('src/ui/HomeScreen.js', 'INFINITY'), 'Subtitle');
check(fc('src/ui/HomeScreen.js', 'HIGH SCORE'), 'High score display');
check(fc('src/ui/HomeScreen.js', 'STARTING CUBE'), 'Cube selector');
check(fc('src/ui/HomeScreen.js', 'PLAY'), 'Play button');
check(fc('src/ui/HomeScreen.js', 'Settings'), 'Settings link');

// 4.7 Settings
console.log('\n4.7 — Settings Screen:');
check(existsSync('src/ui/SettingsScreen.js'), 'SettingsScreen.js exists');
check(fc('src/ui/SettingsScreen.js', 'Movement Speed'), 'Speed slider');
check(fc('src/ui/SettingsScreen.js', 'AI Snakes'), 'AI count slider');
check(fc('src/ui/SettingsScreen.js', 'Ground Cubes'), 'Ground cubes slider');
check(fc('src/ui/SettingsScreen.js', 'saveSettings'), 'Saves to localStorage');

// 4.8 Game Over
console.log('\n4.8 — Game Over Screen:');
check(existsSync('src/ui/GameOverScreen.js'), 'GameOverScreen.js exists');
check(fc('src/ui/GameOverScreen.js', 'GAME OVER'), 'Game over title');
check(fc('src/ui/GameOverScreen.js', 'RESPAWN'), 'Respawn button');
check(fc('src/ui/GameOverScreen.js', 'go-score'), 'Score display');
check(fc('src/ui/GameOverScreen.js', 'go-time'), 'Time display');
check(fc('src/ui/GameOverScreen.js', 'go-kills'), 'Kills display');
check(fc('src/ui/GameOverScreen.js', 'go-rank'), 'Rank display');
check(fc('src/ui/GameOverScreen.js', 'NEW HIGH SCORE'), 'High score indicator');
check(fc('src/core/Game.js', '_respawnPlayer'), 'Respawn in Game.js');
check(fc('src/core/Game.js', 'invulnerabilityDuration'), 'Invulnerability on respawn');

// 4.9 Particles & Animations
console.log('\n4.9 — Animations & Particles:');
check(existsSync('src/effects/ParticleSystem.js'), 'ParticleSystem.js exists');
check(fc('src/effects/ParticleSystem.js', 'emit'), 'Particle emit method');
check(fc('src/effects/ParticleSystem.js', 'pool'), 'Object pooling');
check(existsSync('src/effects/ScreenShake.js'), 'ScreenShake.js exists');
check(fc('src/effects/ScreenShake.js', 'trigger'), 'Shake trigger');
check(existsSync('src/effects/AnimationManager.js'), 'AnimationManager.js exists');
check(fc('src/core/Game.js', 'particles.emit'), 'Particles used in game');
check(fc('src/core/Game.js', 'screenShake.trigger'), 'Screen shake used in game');

// 4.10 Sound
console.log('\n4.10 — Sound Effects:');
check(existsSync('src/core/AudioManager.js'), 'AudioManager.js exists');
check(fc('src/core/AudioManager.js', 'AudioContext'), 'Web Audio API');
check(fc('src/core/AudioManager.js', 'eat'), 'Eat sound');
check(fc('src/core/AudioManager.js', 'merge'), 'Merge sound');
check(fc('src/core/AudioManager.js', 'kill'), 'Kill sound');
check(fc('src/core/AudioManager.js', 'death'), 'Death sound');
check(fc('src/core/AudioManager.js', 'bounce'), 'Bounce sound');
check(fc('src/core/AudioManager.js', 'toggle'), 'Toggle sound');
check(fc('src/core/AudioManager.js', 'respawn'), 'Respawn sound');

// 4.11 Leaderboard
console.log('\n4.11 — Leaderboard System:');
check(existsSync('src/systems/LeaderboardSystem.js'), 'LeaderboardSystem.js exists');
check(fc('src/systems/LeaderboardSystem.js', 'getTop'), 'getTop method');
check(fc('src/systems/LeaderboardSystem.js', 'getPlayerRank'), 'getPlayerRank method');
check(fc('src/systems/LeaderboardSystem.js', 'getLeader'), 'getLeader method');
check(fc('src/systems/LeaderboardSystem.js', 'setHighScore'), 'High score persistence');

// 4.12 Integration
console.log('\n4.12 — Full Integration:');
check(existsSync('src/ui/UIManager.js'), 'UIManager.js exists');
check(fc('src/ui/UIManager.js', 'showHome'), 'showHome');
check(fc('src/ui/UIManager.js', 'showPlaying'), 'showPlaying');
check(fc('src/ui/UIManager.js', 'showPaused'), 'showPaused');
check(fc('src/ui/UIManager.js', 'showGameOver'), 'showGameOver');
check(fc('src/core/Game.js', 'GAME_STATES.HOME'), 'Home state');
check(fc('src/core/Game.js', 'GAME_STATES.PLAYING'), 'Playing state');
check(fc('src/core/Game.js', 'GAME_STATES.PAUSED'), 'Paused state');
check(fc('src/core/Game.js', 'GAME_STATES.GAMEOVER'), 'Game over state');
check(fc('src/core/Game.js', '_quitToHome'), 'Quit to home');
check(fc('src/core/Game.js', '_startGame'), 'Start game method');

console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
process.exit(failed > 0 ? 1 : 0);
