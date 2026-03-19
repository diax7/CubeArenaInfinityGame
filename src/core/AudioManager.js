/**
 * AudioManager.js — Sound effects using Web Audio API (no external files needed).
 * Generates synth sounds procedurally for all game events.
 * Connected to: Game.js, combat/merge events
 */

export default class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this._activeSounds = 0;
    this._maxSounds = 6;

    // Lazy-init AudioContext on first user interaction
    this._initOnInteraction = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      document.removeEventListener('click', this._initOnInteraction);
      document.removeEventListener('touchstart', this._initOnInteraction);
    };
    document.addEventListener('click', this._initOnInteraction);
    document.addEventListener('touchstart', this._initOnInteraction);
  }

  /**
   * play — Play a named synth sound.
   * @param {string} name - Sound name: 'eat', 'merge', 'kill', 'death', 'bounce', 'toggle', 'button', 'respawn'
   */
  play(name) {
    if (!this.enabled || !this.ctx || this._activeSounds >= this._maxSounds) return;
    this._activeSounds++;

    try {
      switch (name) {
        case 'eat': this._playTone(600, 0.08, 'sine', 0.15); break;
        case 'merge': this._playTone(800, 0.15, 'triangle', 0.2); break;
        case 'kill': this._playNoise(0.2, 0.3); break;
        case 'death': this._playNoise(0.4, 0.5); break;
        case 'bounce': this._playTone(300, 0.12, 'sine', 0.2); break;
        case 'toggle': this._playTone(1000, 0.05, 'square', 0.1); break;
        case 'button': this._playTone(800, 0.03, 'sine', 0.08); break;
        case 'respawn': this._playSweep(300, 900, 0.3, 0.2); break;
        default: break;
      }
    } catch {
      // Silently fail if audio context is suspended
    }

    setTimeout(() => { this._activeSounds = Math.max(0, this._activeSounds - 1); }, 300);
  }

  _playTone(freq, duration, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _playNoise(duration, volume) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * volume;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain).connect(this.ctx.destination);
    source.start();
  }

  _playSweep(startFreq, endFreq, duration, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  dispose() {
    if (this.ctx) this.ctx.close();
  }
}
