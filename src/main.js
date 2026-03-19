/**
 * main.js — Application entry point.
 *
 * Initializes the game when the DOM is ready.
 * Creates the Game instance and attaches it to the #game-container element.
 *
 * Connected to: Game.js (creates and starts the game)
 */

import Game from './core/Game.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');

  if (!container) {
    console.error('Game container #game-container not found!');
    return;
  }

  // Create and start the game (shows home screen first)
  const game = new Game(container);

  // Expose for debugging
  window.__game = game;
});
