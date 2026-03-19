/**
 * ModeSystem.js — Manages Reverse Mode and Fear Mode toggles.
 *
 * Connected to: Game.js, Snake.js, CombatSystem.js, AIController.js, GameHUD.js
 */

export default class ModeSystem {
  constructor() {
    this.reverseMode = false;
    this.fearMode = false;
  }

  toggleReverse() {
    this.reverseMode = !this.reverseMode;
    return this.reverseMode;
  }

  toggleFear() {
    this.fearMode = !this.fearMode;
    return this.fearMode;
  }

  /**
   * canEatGround — Check if snake can eat a ground cube.
   * Normal: eat power ≤ head. Reverse: eat power ≥ head.
   */
  canEatGround(headPower, cubePower) {
    if (this.reverseMode) return cubePower >= headPower;
    return cubePower <= headPower;
  }

  /**
   * shouldBounceGround — Check if touching this ground cube should bounce.
   * Normal: power > head = bounce. Reverse: power < head = bounce.
   */
  shouldBounceGround(headPower, cubePower) {
    if (this.reverseMode) return cubePower < headPower;
    return cubePower > headPower;
  }
}
