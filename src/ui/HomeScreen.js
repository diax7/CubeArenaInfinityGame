/**
 * HomeScreen.js — Home page UI with title, high score, cube selector, and PLAY button.
 * Connected to: UIManager.js, Storage.js
 */

import { formatPower, getAllPowers } from '../utils/NumberFormatter.js';
import { loadSettings, saveSettings, getHighScore } from '../utils/Storage.js';

export default class HomeScreen {
  constructor(root, callbacks) {
    this.callbacks = callbacks;
    this.powers = getAllPowers();

    const settings = loadSettings();
    this.selectedIndex = this.powers.findIndex(p => p.power === settings.lastStartingPower);
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);pointer-events:auto;color:white;';
    this.el.innerHTML = `
      <div style="text-align:center;margin-bottom:30px;">
        <img src="/logo.png" alt="Cube Arena Infinity" style="max-width:clamp(200px,60vw,360px);height:auto;" />
      </div>
      <div style="margin-bottom:25px;text-align:center;">
        <div style="font-size:14px;color:#888;margin-bottom:4px;">HIGH SCORE</div>
        <div id="home-highscore" style="font-size:28px;font-weight:700;color:#FFD700;">${formatPower(getHighScore())}</div>
      </div>
      <div style="background:rgba(255,255,255,0.08);border-radius:16px;padding:20px 30px;margin-bottom:25px;text-align:center;">
        <div style="font-size:14px;color:#aaa;margin-bottom:10px;">STARTING CUBE</div>
        <div style="display:flex;align-items:center;gap:15px;">
          <button id="home-prev" style="background:none;border:2px solid rgba(255,255,255,0.3);color:white;font-size:24px;width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">◄</button>
          <div id="home-cube-value" style="font-size:36px;font-weight:900;min-width:80px;color:#4facfe;">${this.powers[this.selectedIndex].display}</div>
          <button id="home-next" style="background:none;border:2px solid rgba(255,255,255,0.3);color:white;font-size:24px;width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">►</button>
        </div>
      </div>
      <button id="home-play" style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;border:none;border-radius:16px;padding:16px 60px;font-size:24px;font-weight:900;font-family:Nunito,sans-serif;cursor:pointer;letter-spacing:2px;box-shadow:0 4px 20px rgba(79,172,254,0.4);margin-bottom:20px;">PLAY</button>
      <button id="home-settings" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer;font-family:Nunito,sans-serif;">⚙ Settings</button>
    `;
    root.appendChild(this.el);

    // Event listeners
    this.el.querySelector('#home-prev').addEventListener('click', () => this._changeSelection(-1));
    this.el.querySelector('#home-next').addEventListener('click', () => this._changeSelection(1));
    this.el.querySelector('#home-play').addEventListener('click', () => {
      const power = this.powers[this.selectedIndex].power;
      saveSettings({ lastStartingPower: power });
      this.callbacks.onPlay(power);
    });
    this.el.querySelector('#home-settings').addEventListener('click', () => this.callbacks.onSettings());
  }

  _changeSelection(dir) {
    this.selectedIndex = Math.max(0, Math.min(this.powers.length - 1, this.selectedIndex + dir));
    this.el.querySelector('#home-cube-value').textContent = this.powers[this.selectedIndex].display;
  }

  show() {
    this.el.style.display = 'flex';
    this.el.querySelector('#home-highscore').textContent = formatPower(getHighScore());
  }
  hide() { this.el.style.display = 'none'; }
}
