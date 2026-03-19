# PHASES.md — Cube Arena Infinity Build Phases

> **Purpose:** This file contains the step-by-step build plan for the entire game.
> Claude Code reads this file to know WHAT to build and in WHAT ORDER.
>
> **How it works:**
> - The user tells Claude Code which phase to work on
> - Claude Code reads this file to understand the full scope of that phase
> - Claude Code implements EVERYTHING in the phase, tests it, and logs the work in CHANGELOG.md
> - Claude Code reports back when the phase is complete and ready for the next one
>
> **Rules:**
> - Always read CLAUDE.md first to understand the full game design
> - Complete ALL steps in a phase before reporting done
> - Test everything in the phase before moving on
> - Log all work in CHANGELOG.md with timestamps and file details
> - If a step requires something from a previous phase, verify it's working first
> - If you encounter a problem, fix it before moving on — don't leave broken things behind
> - Update CLAUDE.md if any implementation detail differs from the original design

---

## PHASE 1: Foundation

**Goal:** Set up the project, render the arena, set up the camera and input system, and render cubes with numbers on them. By the end of this phase, you should see a 3D arena with a grid floor, walls, and some test cubes — all from an angled top-down camera.

### Step 1.1 — Project Setup

1. Initialize a Vite project with vanilla JavaScript (no React, no TypeScript)
2. Install dependencies: `three` (Three.js) and `howler` (Howler.js for audio)
3. Create the COMPLETE folder structure as defined in CLAUDE.md Section 22 (Technical Architecture) — create all folders and all files with a comment at the top of each file explaining what it will do
4. Create `src/config/GameConfig.js` with ALL tunable constants from CLAUDE.md (speeds, counts, colors, sizes, default settings, etc.)
5. Create `src/utils/Constants.js` with the cube color palette and number suffix definitions
6. Create `src/utils/NumberFormatter.js` that converts power values to display strings:
   - power 1 → "2", power 2 → "4", ... power 9 → "512"
   - power 10 → "1K", power 11 → "2K", ... power 19 → "512K"
   - power 20 → "1M", ... power 29 → "512M"
   - power 30 → "1B", ... power 39 → "512B"
   - power 40 → "1T", ... power 49 → "512T"
   - power 50 → "1Qa", ... power 59 → "512Qa"
   - power 60 → "1Qi", ... power 69 → "512Qi"
   - power 70 → "1St", ... power 79 → "512St"
   - power 80 (or special constant) → "∞"
7. Verify the dev server runs with `npm run dev`

### Step 1.2 — Scene & Arena

1. Set up Three.js scene in `src/core/Scene.js`:
   - WebGL renderer with antialiasing, sized to full window (portrait-optimized)
   - Bright ambient light + one soft directional light (cheerful, well-lit, no harsh shadows)
   - Light blue or soft gradient background color
   - Handle window resize events
2. Create the Arena in `src/entities/Arena.js`:
   - Flat plane floor with light gray grid pattern (use grid texture or shader)
   - Arena size: 200×200 units
   - Low fence/barrier walls around all 4 edges — visible but you can see over them
   - Grid cell size: approximately 1 cube-width per cell
3. Wire everything in `src/main.js` so the arena renders in the browser
4. Set up the basic render loop (requestAnimationFrame) in `src/core/Game.js`

**Verify:** Open browser → see a clean gray grid floor with low fence walls.

### Step 1.3 — Camera Controller

1. Create `src/core/Camera.js`:
   - Position camera at ~45° angle looking down at the arena (angled top-down)
   - Smooth lerp follow toward a target position (follow speed ~0.1 lerp factor)
   - Camera does NOT rotate — fixed angle, north is always up on screen
   - Clamp camera position so it never shows beyond arena walls
   - For now, target = center of arena (will attach to player later)
   - Camera height should show ~15-20 cube-lengths of area around the target

**Verify:** Good angled view of the arena, grid and walls clearly visible.

### Step 1.4 — Input System

1. Create `src/core/InputManager.js`:
   - **Touch input (mobile — PRIMARY):**
     - Track finger position on screen
     - Convert screen touch position to direction vector from center of screen
     - When finger is lifted, store last direction (snake continues moving)
     - Handle touchstart, touchmove, touchend
     - Touch events on UI button areas (left side, top) should NOT trigger movement
   - **Mouse input (desktop — secondary):**
     - Track mouse position on screen
     - Convert to direction vector from center of screen
     - Same point-where-to-go mechanic as touch
   - Expose: `getDirection()` → normalized Vector2, `isActive()` → boolean
2. Add a temporary visual debug dot/arrow showing current input direction (remove later)

**Verify:** Touch/mouse creates a visible direction indicator on screen.

### Step 1.5 — Single Cube Rendering

1. Create `src/entities/Cube.js`:
   - 3D box geometry with a number displayed on the top face (visible from ~45° camera)
   - Number: white text with thin black stroke/outline for readability
   - Use canvas texture: render number text onto a canvas, apply as cube face texture
   - Cube color: random medium-toned color from CUBE_COLORS palette (CLAUDE.md Section 19)
   - Soft drop shadow on the ground beneath each cube
   - Use NumberFormatter to convert power value to display string
2. Create `src/utils/ColorPalette.js`:
   - Store full color palette from CLAUDE.md
   - `getRandomColor()` function
   - `getColorForPower(power)` function (deterministic or random — tunable)
3. Render several test cubes on the arena with different values (2, 64, 128, 1K, 1M, 1St, ∞)

**Verify:** Multiple cubes visible on the arena with correct numbers, readable text, nice colors, soft shadows. All number formats display correctly.

### Phase 1 Completion Checklist
- [ ] Vite dev server runs without errors
- [ ] All folders and placeholder files created
- [ ] GameConfig.js has all constants
- [ ] NumberFormatter works for all ranges (2 → ∞)
- [ ] Three.js scene renders with correct lighting
- [ ] Arena floor grid is visible and correctly sized (200×200)
- [ ] Arena boundary walls (low fence) are visible
- [ ] Camera is at ~45° angle, follows target smoothly
- [ ] Camera clamps at arena edges
- [ ] Touch input detected and direction calculated
- [ ] Mouse input detected and direction calculated
- [ ] Cubes render with correct colors and readable numbers
- [ ] Drop shadows visible under cubes

---

## PHASE 2: Snake Mechanics

**Goal:** Build the player snake — movement, body chain, eating ground cubes, and the merge system. By the end of this phase, the core gameplay loop works: move around, eat cubes, grow, merge, get bigger.

### Step 2.1 — Player Snake Movement

1. Create `src/entities/Snake.js`:
   - Snake class used for both player and AI (isPlayer flag)
   - Starts as single head cube at configured starting power value
   - Properties: position, direction, speed, body array (sorted descending by power)
   - Movement: head moves toward target direction (from InputManager for player)
   - Smooth turning — snake rotates gradually toward target, not instantly
   - Speed from GameConfig (based on settings, default speed at setting 50)
   - Stops at arena walls — soft collision, no damage, can't move further
2. In `src/core/Game.js`:
   - Create player snake at center of arena
   - Connect InputManager direction to player snake target direction
   - Camera follows player snake head position
3. Remove test cubes from Step 1.5

**Verify:** Single cube moves around arena following touch/mouse. Camera follows smoothly. Stops at walls.

### Step 2.2 — Snake Body Chain

1. Enhance `Snake.js` with body chain logic:
   - Body = array of Cubes: head at index 0 (highest value), tail at end (lowest)
   - Each body cube follows the one ahead with slight delay (snake-like trailing)
   - Use position history: head records positions, each following cube moves to where the cube ahead was N frames ago
   - Consistent spacing between cubes (~1.1× cube size gap)
   - Smooth position interpolation (no teleporting/snapping)
   - Turning looks natural — chain curves around corners
2. For testing: temporarily spawn player with multi-cube snake (128 → 64 → 32 → 16 → 8 → 4 → 2)
3. After testing, revert to single cube at configured starting value

**Verify:** 7-cube snake follows smoothly when turning. Spacing is consistent. Chain curves naturally.

### Step 2.3 — Ground Cube Spawning

1. Create `src/entities/GroundCube.js`:
   - Ground cubes sit on the floor (y = floor level + half cube height)
   - Slowly rotate on Y axis (~1 rotation per 5 seconds)
   - Slightly smaller than snake cubes (~0.8× size) for visual distinction
2. Create `src/systems/SpawnSystem.js`:
   - Spawn configured count of ground cubes (default: 500)
   - Random positions within arena bounds (with wall padding)
   - Weighted random values per CLAUDE.md Section 16 Game Balance Tables:
     - 25% → 1, 20% → 2, 15% → 4, 12% → 8, 10% → 16, 7% → 32, 5% → 64, 3% → 128, 2% → 256, 1% → 512+
   - When eaten, respawn a replacement after 1-2 second delay
   - Object pooling: pre-create cube meshes, reuse instead of create/destroy
3. **CRITICAL for performance:** Use Three.js InstancedMesh for ground cubes (single draw call for all 500)

**Verify:** 500 small spinning cubes scattered across arena. Mostly small values, rare high values.

### Step 2.4 — Eating Ground Cubes

1. Start building `src/systems/CollisionSystem.js`:
   - Detect player head overlapping ground cubes (sphere-sphere collision)
2. Normal Mode eating: player eats ground cubes with value ≤ head value
3. When eaten:
   - Remove ground cube from arena (return to pool)
   - Insert new cube at CORRECT SORTED POSITION in snake body (descending order)
   - Snake grows by 1
   - Quick slide-in animation (~150ms) for the new cube
4. If ground cube value > head value: log "WOULD DIE" to console (death implemented later)
5. Trigger SpawnSystem to create replacement

**Verify:** Starting as "2", eat value 1 and 2 cubes. They appear in sorted position in snake. Snake grows. Cubes respawn.

### Step 2.5 — Merge System

1. Create `src/systems/MergeSystem.js`:
   - After any cube insertion, check for adjacent duplicates (same power value next to each other)
   - If duplicates found: merge into one cube with power + 1 (value doubles), snake shortens by 1
   - CHAIN REACTIONS: after merge, check again for new duplicates, keep merging until none remain
   - Snake stays sorted descending at all times
   - Update head reference if head value changed
2. Add simple merge animation: scale-up effect on merged cube (proper animations come in Phase 4)
3. Test scenarios:
   - Eat "2" when head is "2" → merge → head becomes "4"
   - Build to 8→4→2, eat "4" → chain reaction → 16→2
   - Verify chain reactions cascade correctly

**Verify:** Full core loop works: move → eat → grow → merge → get bigger. This should feel like the game already!

### Phase 2 Completion Checklist
- [ ] Player snake moves toward touch/mouse position
- [ ] Snake turns smoothly
- [ ] Snake stops at arena walls
- [ ] Body chain follows with natural snake-like motion
- [ ] Cubes maintain consistent spacing
- [ ] 500 ground cubes spawn with correct distribution
- [ ] Ground cubes spin slowly
- [ ] InstancedMesh used for ground cubes (performance)
- [ ] Eating adds cube at correct sorted position
- [ ] Auto-merge fires for adjacent duplicates
- [ ] Chain merges cascade correctly
- [ ] Snake shortens by 1 per merge
- [ ] Snake always remains sorted descending
- [ ] Core loop is playable and feels good

---

## PHASE 3: Combat & AI

**Goal:** Add AI enemy snakes that move, eat, grow, fight each other, and fight the player. By the end of this phase, the arena is alive with action.

### Step 3.1 — AI Snake Spawning

1. Create `src/ai/AISpawner.js`:
   - Spawn configured AI count (default: 25) at game start
   - AI snakes use the same Snake class (isPlayer = false)
   - Head value within ±2 power levels of player's current head
   - Random spawn positions, minimum 30 units from player
   - Start as single head cube
   - Each AI gets a random name from a list of 50+ fun bot names
2. Respawn system: when AI dies, 2-5 second delay, then spawn new AI at ±2 of current player head

**Verify:** 25 AI cubes visible on arena at random positions.

### Step 3.2 — AI Movement & Behavior

1. Create `src/ai/SteeringBehavior.js` — basic steering forces:
   - Seek: steer toward target position
   - Flee: steer away from target position
   - Wander: gentle random direction changes
   - Avoid: steer away from arena walls
2. Create `src/ai/AIController.js` — decision making:
   - AI logic runs every 200ms (not every frame)
   - Normal behavior (Fear OFF):
     - Seek nearest edible ground cube (value ≤ head)
     - Chase smaller enemy snakes
     - Avoid larger enemy snakes
     - Wander if nothing nearby
     - Always avoid walls
   - AI eats ground cubes same as player (insert sorted, auto-merge)
   - AI speed: player speed × 0.909 (always 10% slower)
   - AI snakes have same body chain physics as player

**Verify:** 25 AI snakes moving, eating, growing, merging. Arena feels alive. 60 FPS maintained.

### Step 3.3 — Collision & Combat System

1. Enhance `src/systems/CollisionSystem.js`:
   - Implement spatial hashing grid (10×10 unit cells) for efficient detection
   - Check: player head vs enemy cubes, enemy head vs player cubes, enemy head vs enemy cubes, all heads vs ground cubes
2. Create `src/systems/CombatSystem.js`:
   - Normal Mode combat:
     - Head ≥ touched cube → eat it
     - Head < touched cube → attacker dies
     - Equal heads → bounce (push apart)
   - Head kill: entire enemy dies, ALL cubes drop on ground
   - Body kill: eaten cube + smaller cubes drop, enemy keeps head + larger
   - Dropped cubes become ground cubes at snake body positions (slight scatter)
3. Player death:
   - Set isAlive = false
   - Remove snake (proper death animation in Phase 4)
   - Transition to game over state (temporary: log "GAME OVER", reload after 2 seconds)
4. AI vs AI combat: same rules, creates organic ecosystem

**Verify:** Eat smaller enemies (cubes drop). Die to bigger enemies. Equal heads bounce. AI fights AI.

### Step 3.4 — AI Polish & Ecosystem Balance

1. AI improvements:
   - Prioritize safety (avoid bigger) over hunting
   - Add randomness to target selection (don't all chase same target)
   - Eat dropped cubes from battles
   - Smooth turning, no jitter/oscillation
2. Performance: 60 FPS with 25 AI, spatial hashing working, no lag
3. Respawn: dead AI replaced after 2-5 seconds at ±2 player level
4. Play for 2-3 minutes — arena should feel dynamic and fun

**Verify:** Ecosystem is balanced and exciting. Performance is good. Respawns maintain AI count.

### Phase 3 Completion Checklist
- [ ] 25 AI snakes spawn at ±2 of player level
- [ ] AI moves, eats, grows, merges correctly
- [ ] AI avoids bigger snakes, chases smaller ones
- [ ] AI speed is 10% slower than player
- [ ] Spatial hashing collision detection works
- [ ] Player can eat smaller enemy cubes
- [ ] Head kill → entire enemy dies, cubes drop
- [ ] Body kill → partial drop, enemy keeps head + larger
- [ ] Equal heads → bounce
- [ ] Player dies when touching bigger cube
- [ ] AI vs AI combat works
- [ ] Dead AI respawn after 2-5 seconds at ±2 player level
- [ ] 60 FPS maintained with 25 AI + 500 ground cubes
- [ ] Arena feels alive and dynamic

---

## PHASE 4: Modes, UI & Polish

**Goal:** Add all special mechanics (Reverse Mode, Fear Mode, Crown), build all UI screens (Home, HUD, Pause, Game Over, Settings), add animations, particles, sound effects, and polish everything for mobile. By the end of this phase, the game is complete and playable.

### Step 4.1 — Reverse Mode

1. Create `src/systems/ModeSystem.js`: track reverseMode boolean (default: false)
2. Modify eating/combat to check reverseMode:
   - OFF: eat ≤ head, die to > head
   - ON: eat ≥ head, die to < head
3. In Reverse Mode, eating bigger cube → it becomes new head, old head shifts to body, snake re-sorts
4. Combat flips too: head ≤ enemy → eat, head > enemy → die
5. Equal heads still bounce in both modes
6. Visual: subtle glow/tint on player snake when Reverse is active
7. Keyboard shortcut "R" to toggle (temporary, buttons come later)

**Verify:** Toggle with R. Eat bigger cubes in Reverse. Die to small cubes. Combat flips correctly.

### Step 4.2 — Fear Mode

1. Add fearMode to ModeSystem.js (default: false)
2. Modify AIController:
   - Fear ON: ALL AI flee from player, don't attack, still eat ground cubes, still fight other AI
   - Fear OFF: normal aggressive behavior
   - Fleeing: move away from player, slide along walls if cornered
3. Player can chase and eat fleeing enemies
4. Keyboard shortcut "F" to toggle (temporary)

**Verify:** Press F → all AI flee. Chase and eat them. Press F again → AI returns to hunting. Test all 4 mode combos.

### Step 4.3 — Crown System

1. Create `src/entities/Crown.js`:
   - Procedural 3D golden crown (low-poly, cylinder base + triangle points)
   - Color: #FFD700 gold with emissive glow
   - Animation: rotates (1 per 3 seconds), bobs up/down (floating)
   - Floats ~0.5 cube-heights above head
2. Crown logic:
   - Every 500ms, find snake with highest head value → place crown
   - Ties: all tied snakes get crowns
   - Reverse Mode: crown goes to lowest head value
   - Smooth transition between snakes

**Verify:** Biggest snake has crown. Grow bigger → crown moves to you. Reverse Mode → crown flips.

### Step 4.4 — Game HUD

1. Create `src/ui/GameHUD.js` (HTML/CSS overlay, NOT 3D):
   - Import Nunito font from Google Fonts
   - Top-left: Pause button (⏸)
   - Top area: Score (head value formatted), Kills count, Timer (MM:SS)
   - Top-right: Leaderboard (top 5, player highlighted with ► and distinct color)
   - Left-middle: Reverse Mode toggle button (ON=glowing, OFF=gray)
   - Left-middle below: Fear Mode toggle button (same style)
   - Toggle buttons: ~50-60px, stopPropagation (don't trigger movement)
2. Replace keyboard shortcuts R/F with button taps (keep keyboard as backup for desktop)

**Verify:** All HUD elements visible. Score/kills/timer update. Leaderboard ranks correctly. Buttons toggle modes without affecting movement.

### Step 4.5 — Pause Menu

1. Create `src/ui/PauseMenu.js`:
   - Pause: freeze game loop, show dark overlay, PAUSED title, Resume + Quit buttons
   - Resume: close overlay, continue game
   - Quit: go to home screen
   - Escape key on desktop also toggles pause

**Verify:** Pause freezes game. Resume continues. Quit exits.

### Step 4.6 — Home Screen

1. Create `src/ui/HomeScreen.js` (HTML/CSS overlay):
   - "CUBE ARENA INFINITY" title (Nunito Black, text logo placeholder)
   - High Score display (from localStorage)
   - Starting Cube Selector: scrollable picker, all powers of 2 from 2 to ∞, arrows ◄ ► or swipe
   - Big "PLAY" button
   - Settings icon ⚙️ at bottom
2. PLAY → hide home screen, start game with selected starting value
3. Wire Quit button from Pause to show Home Screen

**Verify:** Home screen shows on load. Select starting cube. PLAY starts game. High score displays correctly.

### Step 4.7 — Settings Screen

1. Create `src/ui/SettingsScreen.js`:
   - Accessible from home screen ⚙️ icon
   - Three sliders with value displayed above:
     - Movement Speed: 1-100, default 50
     - AI Snake Count: 1-100, default 25
     - Ground Cubes: 0-1000, default 500
   - Back button → return to home
   - Save to localStorage immediately on change
   - Takes effect next game start
2. Create `src/utils/Storage.js`: localStorage wrapper with defaults and error handling

**Verify:** Sliders work on mobile. Settings persist across browser sessions. Settings affect next game.

### Step 4.8 — Game Over Screen & Respawn

1. Create `src/ui/GameOverScreen.js`:
   - Death sequence: snake shatters (cubes fly outward, physics, bounce, settle as ground cubes), screen shake, ~1 second delay
   - Game Over overlay: "GAME OVER" title, stats (Score, Time, Kills, Rank), NEW HIGH SCORE celebration if applicable
   - RESPAWN button (large, 🔄 + "RESPAWN" text) — primary action
   - Home button (small, 🏠 icon only) — secondary
2. Respawn:
   - Player appears at center of map with exact same snake
   - 2-3 seconds invulnerability (snake blinks/flashes)
   - Game continues (timer, kills, AI all preserved)
   - Unlimited respawns
3. Home: return to home screen, session ends
4. High score saved to localStorage

**Verify:** Death animation plays. Stats correct. Respawn works with invulnerability. High score saves.

### Step 4.9 — Animations & Particles

1. Create `src/effects/ParticleSystem.js`: object-pooled (~200 particles), spheres with velocity/gravity/lifetime/fade
2. Create `src/effects/AnimationManager.js`: updates all active animations each frame
3. Create `src/effects/ScreenShake.js`: camera offset with decreasing random displacement
4. Implement all animations per CLAUDE.md Section 15:
   - Eat: 5-10 sparkle particles burst (300ms)
   - Merge pop & grow: scale to 1.3× then settle (200ms)
   - Merge cube shrink: consumed cube shrinks to 0 (150ms)
   - Number fly-up: new value floats up and fades (300ms)
   - Equal bounce: squash/stretch spring apart (250ms)
   - Head kill: explosion scatter (400ms)
   - Body kill: slice & scatter (350ms)
   - Player death: dramatic shatter + screen shake (500ms)
5. Scale: small merges = fast/subtle, big merges = slow/dramatic/stronger shake

**Verify:** Every action has visual feedback. Game feels "juicy" and satisfying.

### Step 4.10 — Sound Effects

1. Set up `src/core/AudioManager.js` with Howler.js
2. Generate synth sounds using Web Audio API (or placeholder files):
   - Eat: quick "pop"
   - Merge: deeper "pop" with ascending pitch for chains
   - Kill: impactful "boom"
   - Death: dramatic "shatter"
   - Bounce: rubber "boing"
   - Mode toggle: quick "click"
   - Button tap: subtle UI click
   - Respawn: upward "whoosh"
3. Max 5-6 simultaneous sounds. Debounce rapid eating.

**Verify:** Every action has audio. Sounds enhance gameplay without being annoying.

### Step 4.11 — Leaderboard System

1. Enhance `src/systems/LeaderboardSystem.js`:
   - Rank all snakes by head value every 500ms
   - Tie-breaking: more cubes wins, then first-to-reach wins
   - HUD shows top 5 + player position (even if not top 5)
   - All-time high score in localStorage
   - Crown system uses same ranking data

**Verify:** Rankings update correctly. Ties break properly. High score persists.

### Step 4.12 — Final Polish & Performance

1. **Performance:**
   - Test with Chrome DevTools mobile emulation + CPU throttle
   - Target: 60 FPS with 25 AI + 500 ground cubes
   - Verify: InstancedMesh, object pooling, spatial hashing all working
   - Check for memory leaks (5+ minute session)
2. **Visual polish:**
   - Cube numbers readable from camera angle
   - Nunito font loaded everywhere
   - Toggle buttons clear ON/OFF states
   - Respawn blink visible
   - Crown visible, not clipping
   - Cube selector scrolls smoothly on mobile
3. **Gameplay polish:**
   - Player always 10% faster than AI
   - Wall collisions smooth (no jitter)
   - Ground cubes maintain count
   - AI doesn't cluster in one area
   - All 4 mode combinations work
4. **Mobile-specific:**
   - Touch controls smooth
   - Buttons don't interfere with movement
   - HUD readable on small screens
   - No overflow/scroll issues
   - Prevent pull-to-refresh, pinch-to-zoom during gameplay
5. Run the FULL Testing Checklist from CLAUDE.md Section 25

**Verify:** Everything passes. Game is complete and polished.

### Phase 4 Completion Checklist
- [ ] Reverse Mode works (toggle, flipped rules, bigger becomes head)
- [ ] Fear Mode works (toggle, all AI flee, can still eat them)
- [ ] All 4 mode combinations work correctly
- [ ] Crown on highest-value head (flips in Reverse Mode)
- [ ] HUD: score, kills, timer, leaderboard, toggle buttons all working
- [ ] Pause menu: freeze, resume, quit
- [ ] Home screen: logo, high score, cube selector, play, settings
- [ ] Settings: 3 sliders, localStorage persistence
- [ ] Game Over: death animation, stats, respawn, home, high score
- [ ] Respawn: center, same snake, invulnerability blink
- [ ] All animations working (eat, merge, bounce, kill, death)
- [ ] All particles working (sparkles, explosions)
- [ ] Screen shake on big events
- [ ] Sound effects for all actions
- [ ] Leaderboard ranks correctly with tie-breaking
- [ ] 60 FPS on mobile
- [ ] No memory leaks
- [ ] Touch controls don't conflict with UI
- [ ] Mobile-friendly (no overflow, no browser gestures)
- [ ] Full Testing Checklist from CLAUDE.md Section 25 passes

---

## POST-COMPLETION

After all 4 phases are complete, the game should be fully playable on mobile and desktop. Future changes, bug fixes, and new features will be communicated by the user and should follow the rules in CLAUDE.md Section 1.
