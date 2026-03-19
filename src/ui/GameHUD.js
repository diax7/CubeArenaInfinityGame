/**
 * GameHUD.js — In-game HUD overlay.
 * Shows score, kills, timer, leaderboard, and mode toggle buttons.
 * Connected to: UIManager.js, Game.js, ModeSystem.js, LeaderboardSystem.js
 */

import { formatPower } from '../utils/NumberFormatter.js';

export default class GameHUD {
  constructor(root, callbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:none;';
    this.el.innerHTML = `
      <div style="position:absolute;top:10px;left:10px;pointer-events:auto;">
        <button id="hud-pause" style="background:rgba(0,0,0,0.4);border:none;color:white;font-size:24px;width:44px;height:44px;border-radius:12px;cursor:pointer;backdrop-filter:blur(4px);">⏸</button>
      </div>
      <div style="position:absolute;top:10px;left:64px;color:white;text-shadow:1px 1px 3px rgba(0,0,0,0.5);">
        <div style="font-size:20px;font-weight:700;" id="hud-score">2</div>
        <div style="font-size:13px;opacity:0.8;"><span id="hud-kills">0</span> kills · <span id="hud-timer">00:00</span></div>
      </div>
      <div id="hud-leaderboard" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.35);border-radius:12px;padding:8px 12px;min-width:110px;backdrop-filter:blur(4px);">
      </div>
      <div style="position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;pointer-events:auto;">
        <button id="hud-reverse" style="width:56px;height:56px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.4);color:white;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(4px);font-family:Nunito,sans-serif;line-height:1.2;">🔄<br>REV</button>
        <button id="hud-fear" style="width:56px;height:56px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.4);color:white;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(4px);font-family:Nunito,sans-serif;line-height:1.2;">😨<br>FEAR</button>
      </div>
    `;
    root.appendChild(this.el);

    // Button events — stopPropagation so they don't trigger movement
    const pauseBtn = this.el.querySelector('#hud-pause');
    pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onPause(); });
    pauseBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

    this._reverseBtn = this.el.querySelector('#hud-reverse');
    this._reverseBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onToggleReverse(); });
    this._reverseBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

    this._fearBtn = this.el.querySelector('#hud-fear');
    this._fearBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onToggleFear(); });
    this._fearBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  }

  /**
   * update — Refresh all HUD elements with current game data.
   * @param {object} data - { score, kills, time, leaderboard, reverseMode, fearMode }
   */
  update(data) {
    this.el.querySelector('#hud-score').textContent = data.score || '2';
    this.el.querySelector('#hud-kills').textContent = data.kills || 0;
    this.el.querySelector('#hud-timer').textContent = data.time || '00:00';

    // Update leaderboard
    const lb = this.el.querySelector('#hud-leaderboard');
    if (data.leaderboard && data.leaderboard.length > 0) {
      lb.innerHTML = data.leaderboard.map(e => {
        const color = e.isPlayer ? '#FFD700' : 'rgba(255,255,255,0.8)';
        const marker = e.isPlayer ? '► ' : '';
        return `<div style="font-size:12px;font-weight:${e.isPlayer ? '700' : '600'};color:${color};white-space:nowrap;">${marker}#${e.rank} ${e.name} ${e.display}</div>`;
      }).join('');
    }

    // Toggle button states
    this._reverseBtn.style.background = data.reverseMode
      ? 'rgba(79,172,254,0.6)' : 'rgba(0,0,0,0.4)';
    this._reverseBtn.style.borderColor = data.reverseMode
      ? '#4facfe' : 'rgba(255,255,255,0.3)';

    this._fearBtn.style.background = data.fearMode
      ? 'rgba(255,107,107,0.6)' : 'rgba(0,0,0,0.4)';
    this._fearBtn.style.borderColor = data.fearMode
      ? '#FF6B6B' : 'rgba(255,255,255,0.3)';
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }
}
