/**
 * LeaderboardSystem.js — Live ranking and all-time high scores.
 *
 * Connected to: Snake.js, GameHUD.js, Crown.js, Storage.js
 */

import GameConfig from '../config/GameConfig.js';
import { setHighScore, getHighScore } from '../utils/Storage.js';
import { formatPower } from '../utils/NumberFormatter.js';

export default class LeaderboardSystem {
  constructor() {
    this.rankings = [];
    this.updateTimer = 0;
    this.updateInterval = GameConfig.leaderboard.updateInterval;
    this.highScore = getHighScore();
  }

  /**
   * update — Periodically re-rank all snakes.
   * @param {number} dt - Delta time in seconds
   * @param {object} player - Player snake
   * @param {Array} aiSnakes - AI snake array
   */
  update(dt, player, aiSnakes) {
    this.updateTimer -= dt * 1000;
    if (this.updateTimer > 0) return;
    this.updateTimer = this.updateInterval;

    // Build ranking from all alive snakes
    const all = [];
    if (player.isAlive) {
      all.push({
        id: player.id,
        name: 'You',
        power: player.headPower,
        length: player.length,
        isPlayer: true,
      });
    }
    for (const ai of aiSnakes) {
      if (ai.isAlive) {
        all.push({
          id: ai.id,
          name: ai.name || 'Bot',
          power: ai.headPower,
          length: ai.length,
          isPlayer: false,
        });
      }
    }

    // Sort descending by power, tie-break by length
    all.sort((a, b) => {
      if (b.power !== a.power) return b.power - a.power;
      return b.length - a.length;
    });

    // Assign rank
    for (let i = 0; i < all.length; i++) {
      all[i].rank = i + 1;
      all[i].display = formatPower(all[i].power);
    }

    this.rankings = all;

    // Update high score
    if (player.isAlive) {
      const isNew = setHighScore(player.headPower);
      if (isNew) this.highScore = player.headPower;
    }
  }

  /**
   * getTop — Get the top N entries for the HUD.
   * If player is not in top N, add them at the end.
   */
  getTop(n = 5) {
    const top = this.rankings.slice(0, n);
    const playerInTop = top.some(r => r.isPlayer);
    if (!playerInTop) {
      const playerEntry = this.rankings.find(r => r.isPlayer);
      if (playerEntry) top.push(playerEntry);
    }
    return top;
  }

  /**
   * getPlayerRank — Get the player's current rank.
   */
  getPlayerRank() {
    const entry = this.rankings.find(r => r.isPlayer);
    return entry ? entry.rank : this.rankings.length + 1;
  }

  /**
   * getLeader — Get the snake with the highest head value (for crown).
   * @param {boolean} reverseMode - If true, crown goes to lowest
   */
  getLeader(reverseMode = false) {
    if (this.rankings.length === 0) return null;
    if (reverseMode) {
      return this.rankings[this.rankings.length - 1];
    }
    return this.rankings[0];
  }
}
