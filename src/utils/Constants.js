/**
 * Constants.js — Static constants used throughout the game.
 *
 * Contains the cube color palette and number suffix definitions.
 * These values never change at runtime.
 *
 * Connected to: ColorPalette.js, NumberFormatter.js, Cube.js
 */

/**
 * CUBE_COLORS — Curated palette of 20 medium-toned colors for cube faces.
 * HSL range: Saturation 50-70%, Lightness 45-60%
 * All provide good contrast with white text.
 */
/**
 * CUBE_COLORS — 13-color repeating sequence assigned by power level.
 * Power 1 = Purple, Power 2 = Red, ..., Power 13 = Brown, Power 14 = Purple (repeat).
 */
export const CUBE_COLORS = [
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#38BDF8', // Sky blue
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#1E3A8A', // Dark blue
  '#D946EF', // Fuchsia
  '#2DD4BF', // Turquoise
  '#9CA3AF', // Grey
  '#92400E', // Brown
];

/**
 * NUMBER_SUFFIXES — Maps power ranges to display suffixes.
 *
 * Each entry defines a range of powers and the suffix used to abbreviate them.
 * Values below minPower 10 (i.e. 2–512) display as raw numbers with no suffix.
 */
export const NUMBER_SUFFIXES = [
  { minPower: 10, maxPower: 19, suffix: 'K', divisor: 1000n },
  { minPower: 20, maxPower: 29, suffix: 'M', divisor: 1000000n },
  { minPower: 30, maxPower: 39, suffix: 'B', divisor: 1000000000n },
  { minPower: 40, maxPower: 49, suffix: 'T', divisor: 1000000000000n },
  { minPower: 50, maxPower: 59, suffix: 'Qa', divisor: 1000000000000000n },
  { minPower: 60, maxPower: 69, suffix: 'Qi', divisor: 1000000000000000000n },
  { minPower: 70, maxPower: 79, suffix: 'St', divisor: 1000000000000000000000n },
];

/**
 * INFINITY_POWER — The power value that represents infinity (∞).
 * When a cube reaches this power, it displays as ∞.
 */
export const INFINITY_POWER = 80;

/**
 * GAME_STATES — Possible states the game can be in.
 */
export const GAME_STATES = {
  HOME: 'home',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
};
