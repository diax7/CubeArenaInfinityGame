/**
 * ColorPalette.js — Cube color management.
 *
 * Colors are deterministic by power level using a 13-color repeating sequence:
 * Purple, Red, Green, Blue, Pink, Sky blue, Orange, Yellow, Dark blue, Fuchsia,
 * Turquoise, Grey, Brown — then repeats.
 *
 * Connected to: Cube.js (assigns color on creation), Constants.js (palette source)
 */

import { CUBE_COLORS } from './Constants.js';

/**
 * getColorForPower — Get the deterministic color for a given power value.
 * Power 1 = Purple (index 0), Power 2 = Red (index 1), ..., repeats every 13.
 *
 * @param {number} power - The cube's power exponent (1-based)
 * @returns {string} - Hex color string
 */
export function getColorForPower(power) {
  // power 1 → index 0 (Purple), power 2 → index 1 (Red), etc.
  const index = ((power - 1) % CUBE_COLORS.length + CUBE_COLORS.length) % CUBE_COLORS.length;
  return CUBE_COLORS[index];
}

/**
 * getRandomColor — Legacy function, now returns a color for power 0.
 * Kept for backward compatibility with SpawnSystem ground cubes.
 *
 * @returns {string} - Hex color string
 */
export function getRandomColor() {
  // This is only called by SpawnSystem which passes power separately
  // Return a default color; actual color comes from getColorForPower
  return CUBE_COLORS[0];
}

/**
 * getColorHex — Convert a hex string to a numeric hex value for Three.js.
 *
 * @param {string} hexString - Hex color string (e.g., '#E07B54')
 * @returns {number} - Numeric hex value (e.g., 0xE07B54)
 */
export function getColorHex(hexString) {
  return parseInt(hexString.replace('#', ''), 16);
}
