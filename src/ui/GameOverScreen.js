/**
 * GameOverScreen.js — Game over stats with Respawn and Home buttons.
 * Connected to: UIManager.js, Game.js, Storage.js
 */

import { formatPower } from '../utils/NumberFormatter.js';

export default class GameOverScreen {
  constructor(root, callbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;pointer-events:auto;';
    this.el.innerHTML = `
      <div style="width:100%;height:100%;background:rgba(0,0,0,0.65);display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
        <div style="font-size:36px;font-weight:900;color:#FF6B6B;margin-bottom:10px;letter-spacing:3px;">GAME OVER</div>
        <div id="go-newhs" style="font-size:16px;color:#FFD700;margin-bottom:20px;display:none;">★ NEW HIGH SCORE ★</div>
        <div style="background:rgba(255,255,255,0.08);border-radius:16px;padding:20px 30px;margin-bottom:25px;min-width:200px;">
          <div style="text-align:center;">
            <div style="font-size:14px;color:#888;">Final Score</div>
            <div id="go-score" style="font-size:32px;font-weight:900;color:white;">2</div>
          </div>
          <div style="display:flex;justify-content:space-around;margin-top:12px;gap:20px;">
            <div style="text-align:center;"><div style="font-size:12px;color:#888;">Time</div><div id="go-time" style="font-size:16px;font-weight:700;color:white;">00:00</div></div>
            <div style="text-align:center;"><div style="font-size:12px;color:#888;">Kills</div><div id="go-kills" style="font-size:16px;font-weight:700;color:white;">0</div></div>
            <div style="text-align:center;"><div style="font-size:12px;color:#888;">Rank</div><div id="go-rank" style="font-size:16px;font-weight:700;color:white;">#1</div></div>
          </div>
        </div>
        <button id="go-respawn" style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;border:none;border-radius:16px;padding:16px 50px;font-size:22px;font-weight:900;cursor:pointer;margin-bottom:15px;font-family:Nunito,sans-serif;letter-spacing:1px;">🔄 RESPAWN</button>
        <button id="go-home" style="background:none;border:none;color:#888;font-size:28px;cursor:pointer;">🏠</button>
      </div>
    `;
    root.appendChild(this.el);

    this.el.querySelector('#go-respawn').addEventListener('click', () => callbacks.onRespawn());
    this.el.querySelector('#go-home').addEventListener('click', () => callbacks.onHome());
  }

  /**
   * show — Display game over screen with stats.
   * @param {object} stats - { score, time, kills, rank, isNewHighScore }
   */
  show(stats = {}) {
    this.el.style.display = 'block';
    this.el.querySelector('#go-score').textContent = stats.score || '2';
    this.el.querySelector('#go-time').textContent = stats.time || '00:00';
    this.el.querySelector('#go-kills').textContent = stats.kills || 0;
    this.el.querySelector('#go-rank').textContent = `#${stats.rank || '?'}`;
    this.el.querySelector('#go-newhs').style.display = stats.isNewHighScore ? 'block' : 'none';
  }

  hide() { this.el.style.display = 'none'; }
}
