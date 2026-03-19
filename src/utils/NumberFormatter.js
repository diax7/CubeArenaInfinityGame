/**
 * NumberFormatter.js — Converts power values to human-readable display strings.
 *
 * Uses BigInt for accurate calculation of 2^power values, then divides by
 * the tier divisor (1000 for K, 1000000 for M, etc.) to get the correct
 * display number. BigInt division automatically floors the result.
 *
 * How it works:
 * 1. Powers 0–9 (values 1–512): Show the raw number
 * 2. Powers 10–19: Divide 2^power by 1,000 → suffix K
 * 3. Powers 20–29: Divide by 1,000,000 → suffix M
 * 4. Powers 30–39: Divide by 1,000,000,000 → suffix B
 * 5. Powers 40–49: Divide by 1,000,000,000,000 → suffix T
 * 6. Powers 50–59: Divide by 1,000,000,000,000,000 → suffix Qa
 * 7. Powers 60–69: Divide by 1,000,000,000,000,000,000 → suffix Qi
 * 8. Powers 70–79: Divide by 1,000,000,000,000,000,000,000 → suffix St
 * 9. Power 80+: ∞ (infinity)
 *
 * Connected to: Cube.js (displays on cube face), GameHUD.js (score display),
 *               LeaderboardSystem.js (ranking display), HomeScreen.js (cube selector)
 */

import { NUMBER_SUFFIXES, INFINITY_POWER } from './Constants.js';

/**
 * formatPower — Convert a power exponent to a display string.
 *
 * Uses BigInt to compute 2^power accurately, then divides by the tier
 * divisor to get the correct floored display number.
 *
 * Examples:
 *   power 1  → "2"
 *   power 10 → "1K"   (1024 ÷ 1000 = 1)
 *   power 16 → "65K"  (65536 ÷ 1000 = 65)
 *   power 44 → "17T"  (17,592,186,044,416 ÷ 1,000,000,000,000 = 17)
 *   power 79 → "604St"
 *   power 80 → "∞"
 *
 * @param {number} power - The exponent (e.g., 6 means 2^6 = 64)
 * @returns {string} - The formatted display string
 */
export function formatPower(power) {
  // Special case: infinity
  if (power >= INFINITY_POWER) {
    return '∞';
  }

  // Calculate actual value using BigInt for precision
  const value = 2n ** BigInt(power);

  // Powers 0–9: show raw value (1, 2, 4, 8, 16, 32, 64, 128, 256, 512)
  if (power < 10) {
    return String(value);
  }

  // Powers 10+: find the correct suffix tier and divide
  for (const tier of NUMBER_SUFFIXES) {
    if (power >= tier.minPower && power <= tier.maxPower) {
      const displayNum = value / tier.divisor;
      return `${displayNum}${tier.suffix}`;
    }
  }

  // Fallback (should never reach here)
  return String(value);
}

/**
 * getAllPowers — Returns an array of all valid power values from 1 to INFINITY_POWER.
 * Used by the starting cube selector on the home screen.
 *
 * @returns {Array<{power: number, display: string}>}
 */
export function getAllPowers() {
  const powers = [];
  for (let p = 1; p <= INFINITY_POWER; p++) {
    powers.push({ power: p, display: formatPower(p) });
  }
  return powers;
}
