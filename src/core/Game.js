/**
 * Game.js — Main game loop and state management.
 *
 * The central hub that initializes all systems, runs the render loop,
 * and coordinates updates between components.
 *
 * Connected to: Every system in the game — this is the orchestrator.
 */

import Scene from './Scene.js';
import Camera from './Camera.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import Arena from '../entities/Arena.js';
import Snake from '../entities/Snake.js';
import Cube from '../entities/Cube.js';
import Crown from '../entities/Crown.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import MergeSystem from '../systems/MergeSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ModeSystem from '../systems/ModeSystem.js';
import LeaderboardSystem from '../systems/LeaderboardSystem.js';
import AISpawner from '../ai/AISpawner.js';
import UIManager from '../ui/UIManager.js';
import ParticleSystem from '../effects/ParticleSystem.js';
import ScreenShake from '../effects/ScreenShake.js';
import AnimationManager from '../effects/AnimationManager.js';
import GameConfig from '../config/GameConfig.js';
import { GAME_STATES } from '../utils/Constants.js';
import { formatPower } from '../utils/NumberFormatter.js';
import { loadSettings, setHighScore } from '../utils/Storage.js';

export default class Game {
  constructor(container) {
    this.container = container;
    this.state = GAME_STATES.HOME;
    this.lastTime = 0;
    this.deltaTime = 0;

    // Bind the game loop
    this._gameLoop = this._gameLoop.bind(this);

    // Initialize core systems (always needed)
    this._initCore();

    // Show home screen
    this.ui.showHome();

    // Start render loop (always runs for background rendering)
    requestAnimationFrame(this._gameLoop);

    // Keyboard shortcuts
    this._onKeyDown = this._onKeyDown.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
  }

  /**
   * _initCore — Initialize systems that persist across games.
   */
  _initCore() {
    this.scene = new Scene(this.container);
    this.cameraController = new Camera();
    this.input = new InputManager(this.container);
    this.audio = new AudioManager();
    this.screenShake = new ScreenShake();
    this.animationManager = new AnimationManager();

    // Arena (always visible)
    this.arena = new Arena();
    this.scene.add(this.arena.getGroup());

    // Particle system
    this.particles = new ParticleSystem(this.scene.scene);

    // Crown
    this.crown = new Crown();
    this.scene.add(this.crown.group);

    // Mode system
    this.modeSystem = new ModeSystem();

    // Leaderboard
    this.leaderboard = new LeaderboardSystem();

    // UI Manager with callbacks
    this.ui = new UIManager({
      onPlay: (power) => this._startGame(power),
      onPause: () => this._pauseGame(),
      onResume: () => this._resumeGame(),
      onQuit: () => this._quitToHome(),
      onRespawn: () => this._respawnPlayer(),
      onHome: () => this._quitToHome(),
      onToggleReverse: () => this._toggleReverse(),
      onToggleFear: () => this._toggleFear(),
    });

    // These are created when a game starts
    this.player = null;
    this.spawnSystem = null;
    this.collisionSystem = null;
    this.mergeSystem = null;
    this.combatSystem = null;
    this.aiSpawner = null;
  }

  /**
   * _startGame — Create all game entities and begin playing.
   */
  _startGame(startingPower) {
    // Clean up previous game if any
    this._cleanupGame();

    // Reset modes
    this.modeSystem.reverseMode = false;
    this.modeSystem.fearMode = false;

    const settings = loadSettings();
    const aiCount = settings.aiSnakeCount || GameConfig.ai.defaultCount;

    // Player snake
    this.player = new Snake(true, startingPower, { x: 0, z: 0 });
    this.scene.add(this.player.group);

    // Ground cubes
    this.spawnSystem = new SpawnSystem(this.scene, this.arena);
    this.spawnSystem.spawnInitialGroundCubes();

    // Systems
    this.collisionSystem = new CollisionSystem();
    this.mergeSystem = new MergeSystem();
    this.combatSystem = new CombatSystem();

    // AI
    this.aiSpawner = new AISpawner(this.scene, this.arena);
    this.aiSpawner.spawnInitialAI(startingPower, { x: 0, z: 0 }, aiCount);

    // Camera
    const headPos = this.player.getPosition();
    this.cameraController.setTarget(headPos);

    // Transition to playing
    this.state = GAME_STATES.PLAYING;
    this.ui.showPlaying();
    this.audio.play('button');
  }

  /**
   * _cleanupGame — Remove all game entities (between games).
   */
  _cleanupGame() {
    if (this.player) {
      this.scene.remove(this.player.group);
      this.player.dispose();
      this.player = null;
    }
    if (this.spawnSystem) {
      this.spawnSystem.dispose();
      this.spawnSystem = null;
    }
    if (this.aiSpawner) {
      this.aiSpawner.dispose();
      this.aiSpawner = null;
    }
    this.collisionSystem = null;
    this.mergeSystem = null;
    this.combatSystem = null;
  }

  // ── Game Loop ────────────────────────────────────────────────────────

  _gameLoop(timestamp) {
    this.deltaTime = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0;
    this.lastTime = timestamp;
    this.deltaTime = Math.min(this.deltaTime, 0.1);

    this._update(this.deltaTime);

    // Apply screen shake offset to camera
    this.screenShake.update(this.deltaTime);
    this.cameraController.shakeOffsetX = this.screenShake.offsetX;
    this.cameraController.shakeOffsetZ = this.screenShake.offsetZ;

    this.scene.render(this.cameraController.getCamera());
    requestAnimationFrame(this._gameLoop);
  }

  _update(dt) {
    // Always update particles and animations
    this.particles.update(dt);
    this.animationManager.update();

    if (this.state === GAME_STATES.HOME) return;
    if (this.state === GAME_STATES.PAUSED) return;

    if (this.state === GAME_STATES.GAMEOVER) {
      // Keep AI moving during game over
      if (this.aiSpawner) this._updateAI(dt);
      if (this.spawnSystem) this.spawnSystem.update(dt);
      this._updateCamera();
      return;
    }

    if (this.state !== GAME_STATES.PLAYING) return;
    if (!this.player) return;

    // Step 1: Input
    if (this.input.isActive()) {
      const dir = this.input.getDirection();
      this.player.setTargetDirection(dir.x, dir.y);
    }

    // Step 2: Player movement
    const clampFn = (x, z, margin) => this.arena.clampPosition(x, z, margin);
    this.player.update(dt, clampFn);

    // Step 3: AI
    this._updateAI(dt);

    // Step 4: Ground cube rotation
    this.spawnSystem.update(dt);

    // Step 5: Player eats ground cubes
    this._checkGroundCubeCollisions();

    // Step 6: AI eats ground cubes
    this._updateAIGroundCubeCollisions();

    // Step 7: Combat
    this._checkCombat();

    // Step 8: Dead AI cleanup
    this._cleanupDeadAI();

    // Step 9: Leaderboard + Crown
    this.leaderboard.update(dt, this.player, this.aiSpawner.aiSnakes);
    this._updateCrown(dt);

    // Step 10: HUD
    this._updateHUD();

    // Step 11: Camera
    this._updateCamera();
  }

  // ── AI ───────────────────────────────────────────────────────────────

  _updateAI(dt) {
    if (!this.aiSpawner) return;
    this.aiSpawner.update(dt, {
      player: this.player,
      spawnSystem: this.spawnSystem,
      fearMode: this.modeSystem.fearMode,
    });
  }

  // ── Ground Cube Collisions ───────────────────────────────────────────

  _checkGroundCubeCollisions() {
    if (!this.player.isAlive || this.player.body.length === 0) return;
    if (this.player.isInvulnerable) return;

    const head = this.player.head;
    const headPos = head.getPosition();
    const headRadius = GameConfig.snake.cubeSize * GameConfig.snake.headCollisionRadius;
    const headPower = head.power;

    const hit = this.spawnSystem.checkCollision(headPos.x, headPos.z, headRadius);
    if (hit === null) return;

    if (this.modeSystem.canEatGround(headPower, hit.power)) {
      this.spawnSystem.eatCube(hit.index);

      if (this.modeSystem.reverseMode && hit.power > headPower) {
        // Reverse Mode: bigger cube becomes new head
        const newHead = new Cube(hit.power);
        this.player.setAsNewHead(newHead);
      } else {
        const newCube = new Cube(hit.power);
        this.player.insertCube(newCube);
      }

      this.mergeSystem.checkAndMerge(this.player);
      this.spawnSystem.scheduleRespawn();

      // Effects
      this.particles.emit(headPos.x, headPos.y, headPos.z, 6, 0x4facfe, 2, 0.3);
      this.audio.play('eat');
    } else {
      // Can't eat — bounce
      this.player.applyBounce(hit.x, hit.z);
    }
  }

  _updateAIGroundCubeCollisions() {
    if (!this.aiSpawner) return;
    const headRadius = GameConfig.snake.cubeSize * GameConfig.snake.headCollisionRadius;

    for (const snake of this.aiSpawner.aiSnakes) {
      if (!snake.isAlive || snake.body.length === 0) continue;

      const head = snake.head;
      const headPos = head.getPosition();
      const headPower = head.power;

      const hit = this.spawnSystem.checkCollision(headPos.x, headPos.z, headRadius);
      if (hit !== null && hit.power <= headPower) {
        this.spawnSystem.eatCube(hit.index);
        const newCube = new Cube(hit.power);
        snake.insertCube(newCube);
        this.mergeSystem.checkAndMerge(snake);
        this.spawnSystem.scheduleRespawn();
      }
    }
  }

  // ── Combat ───────────────────────────────────────────────────────────

  _checkCombat() {
    const events = this.combatSystem.checkSnakeVsSnake(
      this.player,
      this.aiSpawner.aiSnakes,
      this.spawnSystem,
      this.mergeSystem
    );

    for (const event of events) {
      // Particle and audio effects for combat events
      if (event.type === 'head-kill') {
        const pos = event.defender.getPosition ? event.defender.getPosition() : { x: 0, y: 1, z: 0 };
        this.particles.emit(pos.x, pos.y || 1, pos.z, 20, 0xFF6B6B, 5, 0.5);
        this.screenShake.trigger(0.4, 0.3);
        this.audio.play('kill');
      }
      if (event.type === 'body-kill') {
        this.audio.play('eat');
      }
      if (event.type === 'bounce' || event.type === 'body-bounce') {
        this.audio.play('bounce');
      }

      // Player death
      if ((event.type === 'attacker-dies' && event.attacker === this.player) ||
          (event.type === 'head-kill' && event.defender === this.player)) {
        this._onPlayerDeath();
        break;
      }
    }
  }

  // ── Player Death & Respawn ───────────────────────────────────────────

  _onPlayerDeath() {
    const headPos = this.player.getPosition();
    this.particles.emit(headPos.x, headPos.y || 1, headPos.z, 30, 0xFF4444, 6, 0.6);
    this.screenShake.trigger(0.6, 0.4);
    this.audio.play('death');

    // Check high score
    const isNewHS = setHighScore(this.player.headPower);

    // Format time
    const totalSec = Math.floor(this.player.survivalTime);
    const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const sec = String(totalSec % 60).padStart(2, '0');

    this.state = GAME_STATES.GAMEOVER;

    // Show game over after a short delay
    setTimeout(() => {
      this.ui.showGameOver({
        score: formatPower(this.player.headPower),
        time: `${min}:${sec}`,
        kills: this.player.killCount,
        rank: this.leaderboard.getPlayerRank(),
        isNewHighScore: isNewHS,
      });
    }, 600);
  }

  _respawnPlayer() {
    if (!this.player) return;

    // Remove old player
    this.scene.remove(this.player.group);
    this.player.dispose();

    // Create fresh player
    const settings = loadSettings();
    const power = settings.lastStartingPower || GameConfig.snake.defaultStartingPower;
    this.player = new Snake(true, power, { x: 0, z: 0 });
    this.player.isInvulnerable = true;
    this.player.invulnerabilityTimer = GameConfig.snake.invulnerabilityDuration;
    this.scene.add(this.player.group);

    // Reset modes
    this.modeSystem.reverseMode = false;
    this.modeSystem.fearMode = false;

    this.state = GAME_STATES.PLAYING;
    this.ui.showPlaying();
    this.audio.play('respawn');
  }

  // ── Dead AI Cleanup ──────────────────────────────────────────────────

  _cleanupDeadAI() {
    if (!this.aiSpawner || !this.player) return;
    const pp = this.player.getPosition();
    const removed = this.aiSpawner.removeDeadSnakes();
    for (let i = 0; i < removed; i++) {
      this.aiSpawner.scheduleRespawn(this.player.headPower, { x: pp.x, z: pp.z });
    }
  }

  // ── Crown ────────────────────────────────────────────────────────────

  _updateCrown(dt) {
    const leader = this.leaderboard.getLeader(this.modeSystem.reverseMode);
    if (!leader) {
      this.crown.update(dt, null);
      return;
    }

    // Find the actual snake object for the leader
    let leaderSnake = null;
    if (leader.isPlayer && this.player) {
      leaderSnake = this.player;
    } else if (this.aiSpawner) {
      leaderSnake = this.aiSpawner.aiSnakes.find(s => s.id === leader.id) || null;
    }

    this.crown.update(dt, leaderSnake);
  }

  // ── HUD ──────────────────────────────────────────────────────────────

  _updateHUD() {
    if (!this.player) return;

    const totalSec = Math.floor(this.player.survivalTime);
    const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const sec = String(totalSec % 60).padStart(2, '0');

    this.ui.updateHUD({
      score: formatPower(this.player.headPower),
      kills: this.player.killCount,
      time: `${min}:${sec}`,
      leaderboard: this.leaderboard.getTop(5),
      reverseMode: this.modeSystem.reverseMode,
      fearMode: this.modeSystem.fearMode,
    });
  }

  // ── Camera ───────────────────────────────────────────────────────────

  _updateCamera() {
    if (this.player) {
      const headPos = this.player.getPosition();
      this.cameraController.setTarget(headPos);
    }
    this.cameraController.update();
  }

  // ── Mode Toggles ────────────────────────────────────────────────────

  _toggleReverse() {
    this.modeSystem.toggleReverse();
    this.player.reverseMode = this.modeSystem.reverseMode;
    this.audio.play('toggle');
  }

  _toggleFear() {
    this.modeSystem.toggleFear();
    this.player.fearMode = this.modeSystem.fearMode;
    this.audio.play('toggle');
  }

  // ── Pause / Quit ─────────────────────────────────────────────────────

  _pauseGame() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.PAUSED;
    this.ui.showPaused();
  }

  _resumeGame() {
    if (this.state !== GAME_STATES.PAUSED) return;
    this.state = GAME_STATES.PLAYING;
    this.ui.hidePaused();
  }

  _quitToHome() {
    this._cleanupGame();
    this.state = GAME_STATES.HOME;
    this.ui.showHome();
    this.crown.group.visible = false;
  }

  // ── Keyboard Shortcuts ───────────────────────────────────────────────

  _onKeyDown(e) {
    if (this.state === GAME_STATES.PLAYING) {
      if (e.key === 'r' || e.key === 'R') this._toggleReverse();
      if (e.key === 'f' || e.key === 'F') this._toggleFear();
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') this._pauseGame();
    } else if (this.state === GAME_STATES.PAUSED) {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') this._resumeGame();
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────

  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    this._cleanupGame();
    this.scene.dispose();
    this.cameraController.dispose();
    this.input.dispose();
    this.audio.dispose();
    this.particles.dispose();
    this.crown.dispose();
    this.animationManager.dispose();
    this.ui.dispose();
  }
}
