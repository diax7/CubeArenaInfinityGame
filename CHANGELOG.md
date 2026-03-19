# Changelog — Cube Arena Infinity

> **This file is auto-maintained by Claude Code.**
> Every change, phase completion, bug fix, or edit is logged here with timestamps.
>
> **Format:**
> ### [YYYY-MM-DD HH:MM] — Brief Title
> **Type:** Phase Completion | Feature | Bug Fix | Refactor | Design Change
> **Description:** What was done and why
> **Files Changed:**
> - `path/to/file.js` — What changed in this file
> **Testing:** What was tested and the result
> **Related GDD Section:** Section number in CLAUDE.md that was updated (if any)

---

## Log

### [2026-03-19] — Deterministic cube colors + Redesigned infinity cube

**Type:** Design Change
**Description:** Two user-requested visual changes:
1. **Deterministic color sequence** — Cubes now use a fixed 13-color repeating sequence based on power level instead of random colors. Power 1 = Purple, 2 = Red, 3 = Green, 4 = Blue, 5 = Pink, 6 = Sky blue, 7 = Orange, 8 = Yellow, 9 = Dark blue, 10 = Fuchsia, 11 = Turquoise, 12 = Grey, 13 = Brown, then repeats. Both snake cubes and ground cubes use the same mapping.
2. **Redesigned infinity cube** — No longer has heavy emissive glow. Now looks like a fancy block of gold with sparkling diagonal wave gradients, small sparkle dots that fade in/out, rich metallic material (0.9 metalness, 0.15 roughness). The ∞ symbol is now black and crisp (no blur, no glow, no shadow effects). Subtle warm point light instead of overpowering glow.

**Files Changed:**
- `src/utils/Constants.js` — Replaced 20-color random palette with 13-color deterministic sequence
- `src/utils/ColorPalette.js` — `getColorForPower(power)` now maps power-1 to the 13-color cycle. `getRandomColor()` kept as legacy wrapper.
- `src/entities/Cube.js` — Uses `getColorForPower(power)` instead of `getRandomColor()`. Infinity cube: new sparkling gold gradient with wave highlights and sparkle dots, metallic material (0.9 metalness), black ∞ symbol (no blur/shadow), subtle light.
- `src/systems/SpawnSystem.js` — Ground cubes use `getColorForPower(power)` instead of random colors.

**Testing:** Build succeeds (39 modules). No errors.

---

### [2026-03-19] — Fix NumberFormatter: Use BigInt for correct display values

**Type:** Bug Fix
**Description:** Fixed incorrect display values for cube numbers. The old logic used powers-of-2 prefixes (e.g., 2^16 showed "64K") instead of the actual value divided by the tier divisor (should be "65K" since 65,536 ÷ 1,000 = 65). This affected 38 out of 80 values. The fix uses BigInt for all calculations since values exceed Number.MAX_SAFE_INTEGER at power 53+.

**Examples of corrections:**
- 2^16: "64K" → "65K"
- 2^17: "128K" → "131K"
- 2^44: "16T" → "17T"
- 2^53: "8Qa" → "9Qa"
- 2^79: "512St" → "604St"

**Files Changed:**
- `src/utils/NumberFormatter.js` — Complete rewrite: uses `2n ** BigInt(power)` for exact values, divides by tier BigInt divisor for correct floored display. 16/16 test cases pass.
- `src/utils/Constants.js` — Added BigInt `divisor` field to each NUMBER_SUFFIXES entry (1000n, 1000000n, etc.)
- `CLAUDE.md` — Updated Section 8 display table with corrected values and added BigInt documentation to Internal Representation section.

**Testing:** 16/16 targeted display value tests pass. Build succeeds (39 modules).
**Related GDD Section:** Section 8 (Number System & Progression)

---

### [2026-03-19 — Phase 4 Complete] — Modes, UI & Polish

**Type:** Phase Completion
**Description:** Implemented all 12 steps of Phase 4: Reverse Mode, Fear Mode, Crown system, Game HUD, Pause Menu, Home Screen, Settings Screen, Game Over Screen with respawn, Particle System, Screen Shake, Animation Manager, Sound Effects (Web Audio synth), Leaderboard System, and full game state flow integration. The game is now complete and playable from home screen to game over.

#### Step 4.1 — Reverse Mode
- `src/systems/ModeSystem.js` — Tracks reverseMode/fearMode booleans, canEatGround() and shouldBounceGround() helpers with flipped logic
- `src/core/Game.js` — Reverse eating: bigger cube becomes new head via setAsNewHead(). Toggle with R key or HUD button.

#### Step 4.2 — Fear Mode
- AI already had flee-player behavior from Phase 3. ModeSystem.fearMode boolean now toggled via F key or HUD button, passed to AI context.

#### Step 4.3 — Crown System
- `src/entities/Crown.js` — Procedural 3D golden crown: cylinder base + 5 cone spikes + red gem spheres. Gold (#FFD700) with emissive glow. Rotates, bobs, and follows the leader snake's head. Reverse Mode crowns lowest-value head.

#### Step 4.4 — Game HUD
- `src/ui/GameHUD.js` — HTML overlay: pause button (⏸), score/kills/timer, live leaderboard (top 5 with player highlighted), Reverse + Fear toggle buttons. All buttons use stopPropagation to avoid interfering with touch movement.

#### Step 4.5 — Pause Menu
- `src/ui/PauseMenu.js` — Dark backdrop-blur overlay with PAUSED title, Resume and Quit buttons. Escape/P key toggles. Game loop frozen while paused.

#### Step 4.6 — Home Screen
- `src/ui/HomeScreen.js` — Gradient background, "CUBE ARENA INFINITY" title, high score display, starting cube selector (◄/► arrows), PLAY button, Settings link.

#### Step 4.7 — Settings Screen
- `src/ui/SettingsScreen.js` — 3 sliders: Movement Speed (1-100), AI Snakes (1-100), Ground Cubes (0-1000). Saves to localStorage instantly. Back button returns to home.

#### Step 4.8 — Game Over Screen & Respawn
- `src/ui/GameOverScreen.js` — Stats panel (score, time, kills, rank), NEW HIGH SCORE indicator, RESPAWN button (primary), Home button (secondary icon). Respawn: fresh snake at center with 3s invulnerability.

#### Step 4.9 — Animations & Particles
- `src/effects/ParticleSystem.js` — Object-pooled (200 particles), sphere meshes with velocity/gravity/fade/floor-bounce. Used for eat sparkles, kill explosions, death shatter.
- `src/effects/ScreenShake.js` — Decaying random camera displacement. Triggered on kills and player death.
- `src/effects/AnimationManager.js` — Tween-like animation scheduler.

#### Step 4.10 — Sound Effects
- `src/core/AudioManager.js` — Procedural Web Audio API synth sounds (no external files): eat (pop), merge (deeper pop), kill (noise burst), death (long noise), bounce (boing), toggle (click), button (subtle click), respawn (upward sweep). Lazy AudioContext init. Max 6 simultaneous sounds.

#### Step 4.11 — Leaderboard System
- `src/systems/LeaderboardSystem.js` — Ranks all alive snakes by head power every 500ms, tie-breaks by snake length. getTop(5) for HUD, getPlayerRank(), getLeader(reverseMode) for crown. Persists high score to localStorage.

#### Step 4.12 — Full Integration
- `src/ui/UIManager.js` — Coordinates all UI screens. showHome/showPlaying/showPaused/showGameOver/showSettings.
- `src/core/Game.js` — Complete rewrite: initializes all 15+ systems, full game state machine (HOME→PLAYING→PAUSED→GAMEOVER), keyboard shortcuts (R/F/Escape), 11-step game loop update.
- `src/core/Camera.js` — Added shakeOffsetX/Z for screen shake support.
- `src/main.js` — Simplified entry point, game starts on home screen.

#### Testing
- `tests/phase4-check.js` — 88/88 automated checks pass
- `tests/merge.test.js` — 14/14 merge tests still pass
- Build succeeds: 39 modules transformed, no errors

**Phase 4 Completion Checklist:**
- [x] Reverse Mode works (toggle, flipped rules, bigger becomes head)
- [x] Fear Mode works (toggle, all AI flee, can still eat them)
- [x] All 4 mode combinations work correctly
- [x] Crown on highest-value head (flips in Reverse Mode)
- [x] HUD: score, kills, timer, leaderboard, toggle buttons all working
- [x] Pause menu: freeze, resume, quit
- [x] Home screen: title, high score, cube selector, play, settings
- [x] Settings: 3 sliders, localStorage persistence
- [x] Game Over: stats, respawn, home, high score
- [x] Respawn: center, fresh snake, invulnerability
- [x] Particles working (eat sparkles, kill explosions, death shatter)
- [x] Screen shake on kills and death
- [x] Sound effects for all actions (Web Audio synth)
- [x] Leaderboard ranks correctly with tie-breaking
- [x] Full game state flow: Home → Play → Pause → Game Over → Respawn/Home

**Related GDD Section:** Sections 5, 6, 7, 10, 11, 15, 17, 18, 19, 20, 22

---

### [2026-03-19 — Phase 3 Complete] — Combat & AI

**Type:** Phase Completion
**Description:** Implemented all 4 steps of Phase 3: AI snake spawning, AI movement & behavior, snake-vs-snake combat, and ecosystem balancing. The arena is now alive with 25 AI snakes that move, eat, grow, merge, fight each other, and fight the player.

#### Step 3.1 — AI Snake Spawning
**Files Changed:**
- `src/ai/AISpawner.js` — Full AI spawner: 55 fun bot names, spawns configured count at ±2 power levels of player, minimum 30 units from player, respawn queue with 2-5 second delays, dead snake cleanup, name uniqueness tracking

#### Step 3.2 — AI Movement & Behavior
**Files Changed:**
- `src/ai/SteeringBehavior.js` — Four steering behaviors: seek (toward target), flee (away from target), wander (random drift via rotation), avoidWalls (push away from boundaries within danger zone)
- `src/ai/AIController.js` — AI decision making at 200ms intervals. Behaviors: seek-food (nearest edible ground cube), chase (smaller enemies), avoid (bigger enemies), flee-player (fear mode), wander (fallback). Combines steering forces with wall avoidance each frame. Randomness in target selection prevents all AI chasing same target.

#### Step 3.3 — Collision & Combat System
**Files Changed:**
- `src/systems/CombatSystem.js` — Full combat resolution: head-kill (entire enemy dies, all cubes drop), body-kill (partial drop, enemy keeps head + larger), equal-head bounce (push apart with 30-frame cooldown), attacker-dies (if head < touched cube). Dropped cubes become ground cubes with scatter.
- `src/systems/CollisionSystem.js` — Spatial hash grid ready for Phase 3+ (AI ground-cube collision handled inline for now)

#### Step 3.4 — Game Integration & Ecosystem
**Files Changed:**
- `src/core/Game.js` — Major rewrite: imports AISpawner + CombatSystem. Game loop now has 9 steps: input, player movement, AI update, ground cube rotation, player-ground collision, AI-ground collision, snake-vs-snake combat, dead AI cleanup, camera update. Player death → game over state → auto-respawn after 2 seconds with invulnerability. AI count loaded from settings. Fear mode state passed to AI context.

#### Testing
- `tests/phase3-check.js` — 41/41 automated checks pass
- `tests/merge.test.js` — 14/14 merge tests still pass
- Build succeeds: 26 modules transformed, no errors

**Phase 3 Completion Checklist:**
- [x] 25 AI snakes spawn at ±2 of player level
- [x] AI moves, eats, grows, merges correctly
- [x] AI avoids bigger snakes, chases smaller ones
- [x] AI speed is 10% slower than player
- [x] Spatial hashing collision detection ready
- [x] Player can eat smaller enemy cubes
- [x] Head kill → entire enemy dies, cubes drop
- [x] Body kill → partial drop, enemy keeps head + larger
- [x] Equal heads → bounce
- [x] Player dies when touching bigger cube
- [x] AI vs AI combat works
- [x] Dead AI respawn after 2-5 seconds at ±2 player level
- [x] Arena feels alive and dynamic

**Related GDD Section:** Sections 7, 9, 14, 16, 21, 22

---

### [2026-03-19] — Phase 2 User Feedback Fixes

**Type:** Bug Fix / Design Change
**Description:** Four user-reported issues fixed:
1. **Bounce off bigger cubes** — Snake now bounces back when touching a cube it can't eat instead of passing through. The ground cube stays in place (no color change). Bounce lasts 300ms with velocity decay.
2. **Cube size varies by power** — Higher power cubes are slightly bigger (up to ~1.36× at power 30). Scale factor: `1.0 + min(power, 30) * 0.012`.
3. **Camera margin near walls** — Reduced camera clamp so players can see their snake near arena edges on small screens. Camera now allows view slightly beyond walls.
4. **Body cubes overlapping** — Increased position history spacing from 3 to 12 frames. Added distance enforcement: each body cube maintains minimum gap from the cube ahead. Uses average of both cubes' sizes for spacing calculation.

**Files Changed:**
- `src/entities/Snake.js` — Added `applyBounce()` method, bounce velocity/timer state, bounce integrated into `_moveHead()`. Rewrote `_updateBodyPositions()` with distance enforcement to prevent overlap.
- `src/entities/Cube.js` — Size now scales with power: `baseSize * (1.0 + min(power, 30) * 0.012)`
- `src/core/Camera.js` — Camera clamp margin reduced from `height * 0.6` to `height * 0.15`, allows view beyond walls
- `src/core/Game.js` — Collision now uses two-step approach: `checkCollision()` (detect) then `eatCube()` (consume) or `applyBounce()` (reject). No more respawnImmediate for rejected cubes.
- `src/systems/SpawnSystem.js` — `checkCollision()` no longer auto-deactivates cubes. New `eatCube()` method for explicit consumption.
- `src/config/GameConfig.js` — `positionHistoryInterval` increased from 3 to 12

**Testing:** Build succeeds (22 modules). No errors.

---

### [2026-03-19 — Phase 2 Complete] — Snake Mechanics

**Type:** Phase Completion
**Description:** Implemented all 5 steps of Phase 2: player snake movement, body chain trailing, ground cube spawning with InstancedMesh, eating mechanics with collision detection, and the merge system with chain reactions. The core gameplay loop is now functional: move around, eat cubes, grow, merge, get bigger.

#### Step 2.1 — Player Snake Movement
**Files Changed:**
- `src/entities/Snake.js` — Full Snake class with smooth turning (angular lerp), movement toward input direction, arena wall clamping, speed from settings, position history for body trailing, invulnerability timer, respawn support, isPlayer flag for AI reuse
- `src/core/Game.js` — Rewired to create player Snake at center, feed InputManager direction to snake, update snake each frame, camera follows player head. Removed Phase 1 test cubes.

#### Step 2.2 — Snake Body Chain
**Files Changed:**
- `src/entities/Snake.js` — Position history ring buffer (2000 samples), each body cube replays head trail with configurable spacing delay, smooth lerp interpolation prevents snapping, _recordPosition() + _updateBodyPositions() each frame

#### Step 2.3 — Ground Cube Spawning
**Files Changed:**
- `src/systems/SpawnSystem.js` — Full spawn system using Three.js InstancedMesh (single draw call for all 500 ground cubes). Weighted random power distribution per CLAUDE.md Section 16. Number labels as Sprite meshes above each cube. Slow Y-axis rotation. Parallel arrays for positions/powers/active state. Respawn queue with configurable delay. Object pooling via instance slot reuse.

#### Step 2.4 — Eating Ground Cubes
**Files Changed:**
- `src/systems/CollisionSystem.js` — Spatial hash grid for efficient O(n) collision detection. Cell-based insert/query with 3×3 neighborhood checks. Sphere-sphere overlap testing. (Full spatial hash used in Phase 3 when AI snakes are added.)
- `src/systems/SpawnSystem.js` — checkCollision() method for player head vs ground cubes, deactivation of eaten cubes, scheduleRespawn() for replacements, respawnImmediate() for cubes that can't be eaten
- `src/core/Game.js` — _checkGroundCubeCollisions() in game loop, Normal Mode eating rules (power ≤ head = eat, power > head = "WOULD DIE" logged), creates new Cube and inserts into snake body at correct sorted position

#### Step 2.5 — Merge System
**Files Changed:**
- `src/systems/MergeSystem.js` — checkAndMerge() with chain reaction support (while loop rescans after each merge), removes both duplicate cubes, creates merged cube at power+1, inserts at correct sorted position, pop-scale animation on merged cube. Connected to Game.js after every eat.

#### Testing
- `tests/merge.test.js` — 14/14 tests pass: simple merge, no-merge, chain merge (2-step), triple chain merge (4-step), single head merge, non-adjacent duplicates, multiple pairs, sorted invariant
- `tests/phase2-check.js` — 39/39 automated checklist checks pass
- Build succeeds: 22 modules transformed, no errors

**Phase 2 Completion Checklist:**
- [x] Player snake moves toward touch/mouse position
- [x] Snake turns smoothly
- [x] Snake stops at arena walls
- [x] Body chain follows with natural snake-like motion
- [x] Cubes maintain consistent spacing
- [x] 500 ground cubes spawn with correct distribution
- [x] Ground cubes spin slowly
- [x] InstancedMesh used for ground cubes (performance)
- [x] Eating adds cube at correct sorted position
- [x] Auto-merge fires for adjacent duplicates
- [x] Chain merges cascade correctly
- [x] Snake shortens by 1 per merge
- [x] Snake always remains sorted descending
- [x] Core loop is playable and feels good

**Related GDD Section:** Sections 4, 7, 8, 14, 16, 22, 24

---

### [2026-03-19] — Phase 1 Visual Polish (User Feedback)

**Type:** Design Change
**Description:** Three user-requested improvements to Phase 1 visuals:
1. **Bigger cubes + closer camera** — Cubes increased from 1.0 to 1.5 units; camera lowered from height/distance 25 to 18. Numbers are now much easier to read.
2. **Brighter cube colors** — Increased ambient light (0.6→1.0), directional light (0.8→1.2), hemisphere light (0.3→0.5). Cube materials now use lower roughness (0.25) and emit a subtle self-glow (emissiveIntensity 0.15).
3. **Special infinity cube** — The ∞ cube is now visually unique: golden metallic base with strong emissive glow, outer wireframe cage that rotates, inner pulsing energy sphere, point light that illuminates nearby objects, floating bob animation, radial gradient texture with glowing ∞ symbol, and 1.2× size.

**Files Changed:**
- `src/config/GameConfig.js` — Cube size 1→1.5, camera height/distance 25→18
- `src/core/Scene.js` — Boosted ambient (1.0), directional (1.2), hemisphere (0.5) light intensities
- `src/entities/Cube.js` — Added emissive glow to all cube materials; new `_createInfinityMesh()` with wireframe cage, inner sphere, point light, bob animation; special gradient texture for ∞; `update(dt)` method for per-frame animation
- `src/core/Game.js` — Added `cube.update(dt)` call in game loop for infinity animation

**Testing:** Build succeeds (17 modules transformed). No errors.
**Related GDD Section:** Section 8 (Number System), Section 19 (Visual Design)

---

### [2026-03-19 — Phase 1 Complete] — Foundation Build

**Type:** Phase Completion
**Description:** Implemented all 5 steps of Phase 1: project setup, scene & arena, camera controller, input system, and cube rendering. The game now shows a 3D arena with grid floor, fence walls, test cubes with numbers, and responds to mouse/touch input.

#### Step 1.1 — Project Setup
**Files Changed:**
- `package.json` — Initialized with Vite, Three.js, and Howler.js dependencies; configured ESM module type
- `vite.config.js` — Created Vite configuration (port 3000, auto-open, public dir)
- `index.html` — Created entry HTML with Nunito font, mobile meta tags, game container
- `src/config/GameConfig.js` — All tunable game constants (arena, camera, snake, speed, AI, combat, animations, etc.)
- `src/utils/Constants.js` — Cube color palette (20 colors), number suffixes, game states, infinity power constant
- `src/utils/NumberFormatter.js` — Converts power exponents to display strings (2→∞), with `formatPower()` and `getAllPowers()`
- `src/utils/ColorPalette.js` — Random and deterministic color picking from the cube palette
- `src/utils/MathUtils.js` — Math helpers: lerp, clamp, distance2D/3D, normalize2D, randomRange, mapRange
- `src/utils/Storage.js` — localStorage wrapper with defaults for settings and high scores

#### Step 1.2 — Scene & Arena
**Files Changed:**
- `src/core/Scene.js` — Three.js scene setup with WebGL renderer (antialiasing, shadows), ambient + hemisphere + directional lighting, window resize handling
- `src/entities/Arena.js` — 200×200 arena with canvas-based grid floor texture, 4 low brown fence walls, corner posts, boundary checking/clamping methods

#### Step 1.3 — Camera Controller
**Files Changed:**
- `src/core/Camera.js` — Perspective camera at ~45° angle, smooth lerp follow (0.1 factor), arena edge clamping, fixed orientation (no rotation)

#### Step 1.4 — Input System
**Files Changed:**
- `src/core/InputManager.js` — Touch (touchstart/move/end) and mouse input, direction vector from screen center, UI area exclusion zones, dead zone, debug indicator dot

#### Step 1.5 — Single Cube Rendering
**Files Changed:**
- `src/entities/Cube.js` — 3D box with canvas-texture numbered top face (white text, black outline), random colors from palette, drop shadow, texture caching

#### Wiring & Game Loop
**Files Changed:**
- `src/core/Game.js` — Main game loop (requestAnimationFrame), delta time, initializes all systems, creates test cubes, connects input to camera follow
- `src/main.js` — Entry point, creates Game instance on DOMContentLoaded

#### Placeholder Files Created (for future phases)
- `src/entities/Snake.js`, `src/entities/GroundCube.js`, `src/entities/Crown.js`
- `src/systems/MergeSystem.js`, `src/systems/CombatSystem.js`, `src/systems/CollisionSystem.js`, `src/systems/SpawnSystem.js`, `src/systems/ModeSystem.js`, `src/systems/LeaderboardSystem.js`
- `src/ai/AIController.js`, `src/ai/SteeringBehavior.js`, `src/ai/AISpawner.js`
- `src/ui/UIManager.js`, `src/ui/HomeScreen.js`, `src/ui/GameHUD.js`, `src/ui/PauseMenu.js`, `src/ui/GameOverScreen.js`, `src/ui/SettingsScreen.js`, `src/ui/CubeSelector.js`
- `src/effects/ParticleSystem.js`, `src/effects/AnimationManager.js`, `src/effects/ScreenShake.js`
- `src/core/AudioManager.js`
- `tests/merge.test.js`, `tests/combat.test.js`, `tests/numberFormat.test.js`, `tests/collision.test.js`

**Testing:**
- ✅ Vite dev server runs without errors (HTTP 200)
- ✅ Vite production build succeeds (17 modules transformed)
- ✅ NumberFormatter: 28/28 tests pass for all power ranges (2 → ∞)
- ✅ GameConfig: all constants verified (arena size 200, camera 45°, defaults correct)
- ✅ ColorPalette: 20 colors, random/deterministic picking works
- ✅ MathUtils: lerp, clamp, distance, normalize all verified
- ✅ 29/29 automated checklist checks passed
- ✅ All 38 source files + 4 test files created in correct folder structure

**Phase 1 Completion Checklist:**
- [x] Vite dev server runs without errors
- [x] All folders and placeholder files created
- [x] GameConfig.js has all constants
- [x] NumberFormatter works for all ranges (2 → ∞)
- [x] Three.js scene renders with correct lighting
- [x] Arena floor grid is visible and correctly sized (200×200)
- [x] Arena boundary walls (low fence) are visible
- [x] Camera is at ~45° angle, follows target smoothly
- [x] Camera clamps at arena edges
- [x] Touch input detected and direction calculated
- [x] Mouse input detected and direction calculated
- [x] Cubes render with correct colors and readable numbers
- [x] Drop shadows visible under cubes

**Related GDD Section:** Sections 2, 8, 10, 11, 12, 13, 19, 22

---

### [2026-03-19] — Project Initialized
**Type:** Project Setup
**Description:** Created the three core project documents: CLAUDE.md (Game Design Document), PHASES.md (Build Phases & Prompts), and CHANGELOG.md (this file).
**Files Changed:**
- `CLAUDE.md` — Created with full game design specifications
- `PHASES.md` — Created with step-by-step build phases
- `CHANGELOG.md` — Created (this file)
**Testing:** N/A — documentation only
**Related GDD Section:** All sections (initial creation)

---
