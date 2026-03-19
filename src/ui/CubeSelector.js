/**
 * CubeSelector.js — Starting cube value picker (used by HomeScreen).
 * This is a simple utility; the actual UI is in HomeScreen.js.
 * Connected to: HomeScreen.js, NumberFormatter.js
 */

import { getAllPowers } from '../utils/NumberFormatter.js';

export default class CubeSelector {
  constructor() {
    this.powers = getAllPowers();
    this.selectedIndex = 0;
  }

  next() {
    this.selectedIndex = Math.min(this.powers.length - 1, this.selectedIndex + 1);
    return this.getCurrent();
  }

  prev() {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    return this.getCurrent();
  }

  getCurrent() {
    return this.powers[this.selectedIndex];
  }

  setByPower(power) {
    const idx = this.powers.findIndex(p => p.power === power);
    if (idx >= 0) this.selectedIndex = idx;
  }
}
