/**
 * PauseMenu.js — Pause overlay with Resume and Quit buttons.
 * Connected to: UIManager.js, Game.js
 */

export default class PauseMenu {
  constructor(root, callbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;pointer-events:auto;';
    this.el.innerHTML = `
      <div style="width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
        <div style="font-size:36px;font-weight:900;color:white;margin-bottom:40px;letter-spacing:3px;">PAUSED</div>
        <button id="pause-resume" style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;border:none;border-radius:14px;padding:14px 50px;font-size:20px;font-weight:700;cursor:pointer;margin-bottom:15px;font-family:Nunito,sans-serif;letter-spacing:1px;">RESUME</button>
        <button id="pause-quit" style="background:rgba(255,255,255,0.1);color:white;border:2px solid rgba(255,255,255,0.3);border-radius:14px;padding:14px 50px;font-size:20px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;letter-spacing:1px;">QUIT</button>
      </div>
    `;
    root.appendChild(this.el);

    this.el.querySelector('#pause-resume').addEventListener('click', () => callbacks.onResume());
    this.el.querySelector('#pause-quit').addEventListener('click', () => callbacks.onQuit());
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }
}
