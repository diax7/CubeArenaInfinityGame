/**
 * UIManager.js — Coordinates all UI screens.
 * Shows/hides screens based on game state.
 * Connected to: Game.js, all UI screen classes.
 */

import HomeScreen from './HomeScreen.js';
import GameHUD from './GameHUD.js';
import PauseMenu from './PauseMenu.js';
import GameOverScreen from './GameOverScreen.js';
import SettingsScreen from './SettingsScreen.js';

export default class UIManager {
  constructor(callbacks) {
    // callbacks: { onPlay, onPause, onResume, onQuit, onRespawn, onHome, onToggleReverse, onToggleFear }
    this.callbacks = callbacks;

    // Create root UI container
    this.root = document.createElement('div');
    this.root.id = 'ui-root';
    this.root.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;font-family:"Nunito",sans-serif;';
    document.body.appendChild(this.root);

    // Create each screen
    this.home = new HomeScreen(this.root, {
      onPlay: (startingPower) => callbacks.onPlay(startingPower),
      onSettings: () => this.showSettings(),
    });
    this.hud = new GameHUD(this.root, {
      onPause: () => callbacks.onPause(),
      onToggleReverse: () => callbacks.onToggleReverse(),
      onToggleFear: () => callbacks.onToggleFear(),
    });
    this.pause = new PauseMenu(this.root, {
      onResume: () => callbacks.onResume(),
      onQuit: () => callbacks.onQuit(),
    });
    this.gameOver = new GameOverScreen(this.root, {
      onRespawn: () => callbacks.onRespawn(),
      onHome: () => callbacks.onHome(),
    });
    this.settings = new SettingsScreen(this.root, {
      onBack: () => this.showHome(),
    });
  }

  showHome() {
    this.home.show();
    this.hud.hide();
    this.pause.hide();
    this.gameOver.hide();
    this.settings.hide();
  }

  showPlaying() {
    this.home.hide();
    this.hud.show();
    this.pause.hide();
    this.gameOver.hide();
    this.settings.hide();
  }

  showPaused() {
    this.pause.show();
  }

  hidePaused() {
    this.pause.hide();
  }

  showGameOver(stats) {
    this.gameOver.show(stats);
  }

  showSettings() {
    this.home.hide();
    this.settings.show();
  }

  updateHUD(data) {
    this.hud.update(data);
  }

  dispose() {
    this.root.remove();
  }
}
