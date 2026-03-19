/**
 * SettingsScreen.js — Settings page with 3 sliders.
 * Connected to: UIManager.js, Storage.js
 */

import { loadSettings, saveSettings } from '../utils/Storage.js';

export default class SettingsScreen {
  constructor(root, callbacks) {
    this.callbacks = callbacks;
    const settings = loadSettings();

    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;pointer-events:auto;background:linear-gradient(180deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);overflow-y:auto;';
    this.el.innerHTML = `
      <div style="max-width:400px;margin:0 auto;padding:30px 20px;">
        <div style="display:flex;align-items:center;margin-bottom:30px;">
          <button id="settings-back" style="background:none;border:none;color:white;font-size:24px;cursor:pointer;margin-right:15px;">←</button>
          <div style="font-size:24px;font-weight:900;color:white;letter-spacing:2px;">SETTINGS</div>
        </div>
        ${this._createSlider('Movement Speed', 'speed', settings.movementSpeed, 1, 100)}
        ${this._createSlider('AI Snakes', 'ai', settings.aiSnakeCount, 1, 100)}
        ${this._createSlider('Ground Cubes', 'ground', settings.groundCubeCount, 0, 1000)}
        <div style="text-align:center;margin-top:20px;color:#666;font-size:12px;">Changes take effect on next game</div>
      </div>
    `;
    root.appendChild(this.el);

    this.el.querySelector('#settings-back').addEventListener('click', () => callbacks.onBack());

    // Wire sliders
    this._wireSlider('speed', 'movementSpeed');
    this._wireSlider('ai', 'aiSnakeCount');
    this._wireSlider('ground', 'groundCubeCount');
  }

  _createSlider(label, id, value, min, max) {
    return `
      <div style="margin-bottom:25px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#aaa;font-size:14px;font-weight:600;">${label}</span>
          <span id="val-${id}" style="color:white;font-size:14px;font-weight:700;">${value}</span>
        </div>
        <input type="range" id="slider-${id}" min="${min}" max="${max}" value="${value}" style="width:100%;accent-color:#4facfe;height:6px;">
      </div>
    `;
  }

  _wireSlider(id, settingKey) {
    const slider = this.el.querySelector(`#slider-${id}`);
    const valEl = this.el.querySelector(`#val-${id}`);
    slider.addEventListener('input', () => {
      valEl.textContent = slider.value;
      saveSettings({ [settingKey]: parseInt(slider.value) });
    });
  }

  show() {
    this.el.style.display = 'block';
    // Refresh values from storage
    const s = loadSettings();
    this.el.querySelector('#slider-speed').value = s.movementSpeed;
    this.el.querySelector('#val-speed').textContent = s.movementSpeed;
    this.el.querySelector('#slider-ai').value = s.aiSnakeCount;
    this.el.querySelector('#val-ai').textContent = s.aiSnakeCount;
    this.el.querySelector('#slider-ground').value = s.groundCubeCount;
    this.el.querySelector('#val-ground').textContent = s.groundCubeCount;
  }
  hide() { this.el.style.display = 'none'; }
}
