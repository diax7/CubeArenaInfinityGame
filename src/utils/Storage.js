/**
 * Storage.js — localStorage wrapper with defaults and error handling.
 *
 * Provides safe read/write to localStorage with fallback defaults.
 * All persistent game data (settings, high scores) goes through here.
 *
 * Connected to: SettingsScreen.js, LeaderboardSystem.js, HomeScreen.js
 */

const STORAGE_KEY = 'cube-arena-infinity';

/**
 * Default values used when no saved data exists.
 */
const DEFAULTS = {
  movementSpeed: 50,
  aiSnakeCount: 25,
  groundCubeCount: 500,
  highScore: 0,
  lastStartingPower: 1,
};

/**
 * loadSettings — Load all settings from localStorage.
 * Returns defaults for any missing keys.
 *
 * @returns {object} - Settings object with all keys guaranteed
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const saved = JSON.parse(raw);
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * saveSettings — Save settings object to localStorage.
 * Merges with existing data so partial updates are safe.
 *
 * @param {object} settings - Partial or full settings to save
 */
export function saveSettings(settings) {
  try {
    const current = loadSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage may be full or disabled — silently fail
  }
}

/**
 * getHighScore — Get the all-time high score (power value).
 *
 * @returns {number}
 */
export function getHighScore() {
  return loadSettings().highScore;
}

/**
 * setHighScore — Update the high score if the new value is higher.
 *
 * @param {number} power - The new score (power value)
 * @returns {boolean} - True if this was a new high score
 */
export function setHighScore(power) {
  const current = getHighScore();
  if (power > current) {
    saveSettings({ highScore: power });
    return true;
  }
  return false;
}
