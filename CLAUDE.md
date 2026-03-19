# CLAUDE.md — Cube Arena Infinity

> **This file is the single source of truth for the entire project.**
> It serves as the Game Design Document (GDD), Software Requirements Specification (SRS),
> Business Requirements Document (BRD), and Claude Code instructions — all in one place.
>
> **Last Updated:** 2026-03-19
> **Version:** 1.0.0

---

## TABLE OF CONTENTS

1. [Claude Code Rules & Workflow](#1-claude-code-rules--workflow)
2. [Project Overview](#2-project-overview)
3. [Scope Definition](#3-scope-definition)
4. [Core Mechanics](#4-core-mechanics)
5. [Reverse Mode](#5-reverse-mode)
6. [Fear Mode](#6-fear-mode)
7. [Combat System](#7-combat-system)
8. [Number System & Progression](#8-number-system--progression)
9. [AI Behavior Specification](#9-ai-behavior-specification)
10. [UI/UX Design](#10-uiux-design)
11. [Controls & Input](#11-controls--input)
12. [Camera System](#12-camera-system)
13. [Arena & Environment](#13-arena--environment)
14. [Collision Detection](#14-collision-detection)
15. [Animation & VFX](#15-animation--vfx)
16. [Game Balance Tables](#16-game-balance-tables)
17. [Leaderboard System](#17-leaderboard-system)
18. [Settings & Configuration](#18-settings--configuration)
19. [Brand & Visual Design System](#19-brand--visual-design-system)
20. [User Stories](#20-user-stories)
21. [Edge Cases](#21-edge-cases)
22. [Technical Architecture](#22-technical-architecture)
23. [Data Models](#23-data-models)
24. [Performance Optimization](#24-performance-optimization)
25. [Testing Checklist](#25-testing-checklist)
26. [Build Phases (Claude Code Step-by-Step)](#26-build-phases)
27. [Changelog](#27-changelog)

---

## 1. Claude Code Rules & Workflow

### Project File Structure

This project uses 3 core documentation files:
- **CLAUDE.md** (this file) — The complete Game Design Document (GDD), SRS, and BRD. Single source of truth for all game design.
- **PHASES.md** — Step-by-step build phases. Tells Claude Code WHAT to build and in WHAT ORDER.
- **CHANGELOG.md** — Auto-maintained history of every change, phase completion, and bug fix.

### MANDATORY: Read Before Every Task

Before starting ANY task on this project, Claude Code MUST:

1. **Read CLAUDE.md (this file)** before starting any task — every time, no exceptions.
2. **Read PHASES.md** to understand which phase/step is being worked on.
3. **Read the GDD sections relevant to the task** before making any game logic changes.
4. **Never delete or overwrite code without logging it** in CHANGELOG.md.
5. **Ask the user before making major architectural changes** — if a task requires restructuring files, modules, or changing the tech stack, confirm first.
6. **Keep code comments clean and descriptive** — every function must have a comment block above it explaining what it does, what it connects to, and how it works.
7. **Make the code self-explanatory** — use clear variable names, add inline comments throughout functions explaining each logical step.
8. **Update CLAUDE.md after every change** — if the user requests a change to game mechanics, UI, or any feature, update the relevant section in this document to reflect the new state.
9. **Log every change in CHANGELOG.md** — every edit, every phase completion, every bug fix. Include timestamp, what was changed, which files were affected, and why.

### Comment Style Guide

```javascript
/**
 * calculateMergeChain - Handles the cascading merge logic when a new cube
 * is inserted into the snake body.
 *
 * How it works:
 * 1. Inserts the new cube at the correct sorted position in the snake
 * 2. Checks for adjacent duplicates (same value cubes next to each other)
 * 3. If duplicates found, merges them (e.g., 32 + 32 = 64)
 * 4. Repeats the check because the merge might create NEW duplicates (chain reaction)
 * 5. Returns the updated snake array
 *
 * Connected to: Snake.eat(), GroundCube.onCollision(), CombatSystem.absorbCubes()
 *
 * @param {Array<Cube>} snakeBody - Current snake body array, sorted descending
 * @param {Cube} newCube - The cube being added to the snake
 * @returns {Array<Cube>} - Updated snake body after all merges complete
 */
function calculateMergeChain(snakeBody, newCube) {
  // Step 1: Find the correct position to insert (maintain descending sort order)
  const insertIndex = snakeBody.findIndex(cube => cube.value < newCube.value);

  // Step 2: Insert the cube at that position
  // If no smaller cube found, append to the end (it's the smallest)
  // ...
}
```

### File Naming Conventions

- All source files: `camelCase.js` (e.g., `snakeController.js`, `mergeSystem.js`)
- All component/class files: `PascalCase.js` (e.g., `Snake.js`, `GameArena.js`)
- Config files: `camelCase.config.js`
- Test files: `*.test.js`
- Assets: `kebab-case` (e.g., `crown-model.glb`, `merge-sound.mp3`)

---

## 2. Project Overview

### Game Name
**Cube Arena Infinity**

### Concept
A 3D snake game where your snake is made of numbered cubes (powers of 2). You navigate a large arena, eating ground cubes and fighting AI enemy snakes. Cubes auto-merge when duplicates are adjacent (like 2048), making your snake shorter but more powerful. The goal is to survive as long as possible and reach the highest cube value — ultimately reaching ∞ (infinity).

### Unique Selling Points
1. **Reverse Mode** — Toggle to eat BIGGER cubes instead of smaller ones (high risk, high reward)
2. **Fear Mode** — Toggle to make all AI enemies flee from you
3. **Four Strategic States** — Combining Reverse + Fear creates 4 distinct play styles
4. **Starting Cube Selector** — Choose any power of 2 to start from (sandbox freedom)
5. **Infinite Progression** — Number scale goes from 2 all the way to Sextillions, then ∞

### Platform
- **Primary:** Mobile/Tablet (iOS Safari, Android Chrome) — Portrait mode, touch controls
- **Secondary:** Desktop browsers (mouse controls) — for testing and casual play

### Tech Stack
- **Renderer:** Three.js (3D WebGL)
- **Build Tool:** Vite
- **Language:** JavaScript (vanilla, no framework for game logic)
- **Physics/Collision:** Custom lightweight system (no heavy physics library)
- **Audio:** Howler.js
- **Font:** Nunito or Poppins (Google Fonts, rounded & playful)

---

## 3. Scope Definition

### IN SCOPE (v1.0)
- Single-player game with AI enemies
- 3D cube-based snake with merge mechanics
- Reverse Mode toggle
- Fear Mode toggle
- Starting cube selector (2 → ∞)
- 20-30 AI snakes with scaling difficulty
- Large arena with light gray grid floor and low fence boundary
- Portrait mode, touch-to-point controls
- In-game HUD (score, kills, timer, leaderboard)
- Home page, in-game page, game over page
- Settings (speed, snake count, ground cube count)
- Respawn system (unlimited, same snake, center of map)
- Local storage for high scores and all-time leaderboard
- Animations (merge, eat, bounce, death, particles)
- Sound effects
- Mobile-first responsive design

### OUT OF SCOPE (future versions)
- Online multiplayer
- User accounts / cloud saves
- Multiple arena maps
- Obstacles / terrain features inside the arena
- Power-ups / pickups on the map
- Skin/theme customization for snakes
- Ads or monetization
- App store deployment (PWA only for now)
- Timed challenge modes
- Tutorial / onboarding flow (may add later)
- Social sharing
- Achievements / badges system

---

## 4. Core Mechanics

### 4.1 The Snake

The player controls a snake made of numbered cubes. Each cube displays a power of 2.

**Structure Rules:**
- The snake is always sorted in **descending order** — head is the highest value, tail descends
- Example valid snake: `256 → 128 → 64 → 32 → 8 → 4 → 2`
- The head cube is always the largest and leads the movement
- Tail cubes follow the head in a chain with slight delay (snake-like trailing effect)

### 4.2 Eating Ground Cubes

When the snake head collides with a ground cube:
1. The ground cube is **inserted at the correct sorted position** in the snake body (maintaining descending order)
2. If this creates **adjacent duplicates** (two cubes with the same value next to each other), they **auto-merge immediately**
3. Merging follows the 2048 rule: `value + value = value × 2` (e.g., 32 + 32 = 64)
4. After a merge, the snake is **one cube shorter** (two cubes become one)
5. **Chain reactions** are supported — if a merge creates a new duplicate, that merges too, and so on

**Example Scenario:**
```
Starting snake:  128 → 64 → 16 → 8
Player eats a ground cube with value 16

Step 1 - Insert in sorted position:
  128 → 64 → 16 → 16 → 8

Step 2 - Auto-merge duplicates (16 + 16 = 32):
  128 → 64 → 32 → 8

Step 3 - Check for new duplicates: None found. Done.
Final snake:  128 → 64 → 32 → 8
```

**Chain Reaction Example:**
```
Starting snake:  128 → 64 → 32 → 16
Player eats a ground cube with value 32

Step 1 - Insert: 128 → 64 → 32 → 32 → 16
Step 2 - Merge (32+32=64): 128 → 64 → 64 → 16
Step 3 - Chain merge (64+64=128): 128 → 128 → 16
Step 4 - Chain merge (128+128=256): 256 → 16
Final snake:  256 → 16  (went from 5 cubes to 2, head jumped from 128 to 256!)
```

### 4.3 Eating Rules (Normal Mode)

- Player can eat any ground cube with value **≤ head value**
- Player can eat any enemy snake cube with value **≤ head value**
- Touching a cube with value **> head value** = **death (game over)**

### 4.4 Starting the Game

- Player selects a starting cube value from the home screen (default: 2)
- Player starts as a **single head cube** at that value (no tail)
- Player spawns at the **center of the map**

---

## 5. Reverse Mode

### Activation
- **Toggle button** on the left side of the screen during gameplay
- Tap to switch ON, tap again to switch OFF
- **Unlimited uses**, no cooldown, no energy cost
- Can be toggled freely at any time

### How It Works

**Normal Mode (default):**
- Can eat cubes with value **≤ your head value**
- Cubes with value **> your head value** kill you

**Reverse Mode (toggled ON):**
- Can eat cubes with value **≥ your head value**
- Cubes with value **< your head value** kill you
- When you eat a bigger cube, it **becomes your new head** and the old head shifts down into the body
- The snake re-sorts itself after the new head is placed

**Reverse Mode Example:**
```
Snake: 64 → 32 → 16
Reverse Mode: ON
Player eats a 256 ground cube

Step 1 - 256 becomes the new head, 64 shifts to body:
  256 → 64 → 32 → 16

Snake grew by 1 and head jumped from 64 to 256!
```

**The Risk:** In Reverse Mode, even a tiny ground cube with value 2 would kill you if your head is 64 (because 2 < 64). You must navigate carefully to avoid small cubes.

### Visual Indicator
- When Reverse Mode is active, the snake should have a visible change (glow, color tint, or particle effect) so the player remembers they're in Reverse Mode
- The toggle button should clearly show ON/OFF state

---

## 6. Fear Mode

### Activation
- **Toggle button** on the left side of the screen, below the Reverse Mode button
- Tap to switch ON, tap again to switch OFF
- **Unlimited uses**, no cooldown, no energy cost

### How It Works

**Normal (Fear OFF):**
- AI snakes actively hunt and try to eat the player
- AI snakes behave aggressively

**Fear Mode (Fear ON):**
- **ALL AI snakes on the entire map** flee from the player
- AI snakes run away and do not attack
- Player can still **chase and eat fleeing enemies** — they are NOT invulnerable
- AI snakes continue to eat ground cubes while fleeing (they still grow)

### Strategic Combinations

The two toggles create **four distinct play states:**

| Reverse Mode | Fear Mode | Result | Strategy |
|---|---|---|---|
| OFF | OFF | **Standard** — AI attacks, eat smaller | Default gameplay, balanced |
| OFF | ON | **Safe Farm** — AI flees, eat smaller | Low risk, steady growth |
| ON | OFF | **High Risk** — AI attacks, eat bigger | Dangerous but fast progression |
| ON | ON | **Power Hunt** — AI flees, eat bigger | Safe big-cube hunting |

---

## 7. Combat System

### Snake vs Snake Combat

Combat is triggered when **your head cube touches any cube of an enemy snake**.

**Normal Mode Combat:**
- Your head value **≥** enemy cube value → **You eat it**
- Your head value **<** enemy cube value → **You die (game over)**

**Reverse Mode Combat:**
- Your head value **≤** enemy cube value → **You eat it** (flipped!)
- Your head value **>** enemy cube value → **You die** (small cubes are now dangerous!)

### Eating an Enemy Snake Cube

**If you eat the enemy's HEAD cube:**
- The **entire enemy snake dies**
- **All cubes from the dead snake drop on the ground** as individual ground cubes
- These ground cubes can then be eaten by anyone

**If you eat a NON-HEAD cube (body/tail):**
- The eaten cube **+ all cubes smaller than it** (below it in the chain) **drop on the ground**
- The enemy snake **keeps its head and all cubes larger than the eaten cube**
- The enemy snake continues playing but is now shorter/weaker

**Combat Example:**
```
Your snake:     128 → 64 → 32
Enemy snake:    256 → 64 → 32 → 16 → 8

Normal Mode: Your head (128) touches enemy's 32.
128 ≥ 32, so you eat it!

Since 32 is NOT the head:
  - Enemy drops: 32, 16, 8 (the eaten cube + everything smaller)
  - Enemy keeps: 256 → 64

Ground now has: 32, 16, 8 scattered where the enemy was
You can now eat those ground cubes!
```

### Equal Head Collision (Bounce)

When two snake heads of **equal value** collide:
- Neither snake dies
- Both snakes **bounce/bump off each other** with a fun bounce animation
- Both snakes are pushed slightly apart
- No cubes are lost by either side

---

## 8. Number System & Progression

### Power of 2 Scale

All cube values are powers of 2. The display format uses abbreviations to fit on cube faces.

| Power | Raw Value | Display | Suffix |
|---|---|---|---|
| 2¹ | 2 | **2** | — |
| 2² | 4 | **4** | — |
| 2³ | 8 | **8** | — |
| 2⁴ | 16 | **16** | — |
| 2⁵ | 32 | **32** | — |
| 2⁶ | 64 | **64** | — |
| 2⁷ | 128 | **128** | — |
| 2⁸ | 256 | **256** | — |
| 2⁹ | 512 | **512** | — |
| 2¹⁰ | 1,024 | **1K** | K = Thousand (÷1,000) |
| 2¹¹ | 2,048 | **2K** | |
| 2¹² | 4,096 | **4K** | |
| 2¹³ | 8,192 | **8K** | |
| 2¹⁴ | 16,384 | **16K** | |
| 2¹⁵ | 32,768 | **32K** | |
| 2¹⁶ | 65,536 | **65K** | (65,536 ÷ 1,000 = 65) |
| 2¹⁷ | 131,072 | **131K** | |
| 2¹⁸ | 262,144 | **262K** | |
| 2¹⁹ | 524,288 | **524K** | |
| 2²⁰ | 1,048,576 | **1M** | M = Million (÷1,000,000) |
| 2²¹–2²⁹ | ... | **2M–536M** | (values are floor(2^n ÷ divisor)) |
| 2³⁰ | 1,073,741,824 | **1B** | B = Billion (÷1,000,000,000) |
| 2³¹–2³⁹ | ... | **2B–549B** | |
| 2⁴⁰ | ~1.1 Trillion | **1T** | T = Trillion (÷1,000,000,000,000) |
| 2⁴¹–2⁴⁹ | ... | **2T–562T** | |
| 2⁵⁰ | ~1.1 Quadrillion | **1Qa** | Qa = Quadrillion (÷10¹⁵) |
| 2⁵¹–2⁵⁹ | ... | **2Qa–576Qa** | |
| 2⁶⁰ | ~1.1 Quintillion | **1Qi** | Qi = Quintillion (÷10¹⁸) |
| 2⁶¹–2⁶⁹ | ... | **2Qi–590Qi** | |
| 2⁷⁰ | ~1.2 Sextillion | **1St** | St = Sextillion (÷10²¹) |
| 2⁷¹–2⁷⁹ | ... | **2St–604St** | |
| FINAL | ∞ | **∞** | Infinity (win state) |

### Display Format Rules

- Values 2–512: Show the raw number (2^power as-is)
- Values 1,024+: Compute `floor(2^power ÷ tier_divisor)` and append suffix
- Uses BigInt for accuracy since values exceed Number.MAX_SAFE_INTEGER at power 53+
- The number must fit visually on the cube face

### Infinity (∞)

- ∞ is the **ultimate goal** — the final cube value
- Reached by merging two of the highest St-level cubes (512St + 512St = ∞)
- When you reach ∞, you essentially become invincible — nothing can be higher
- The game continues (endless) but you've achieved the ultimate score

### Internal Representation

Cube values are stored as their **power/exponent** internally:
- Cube value 2 → stored as power `1`
- Cube value 1024 → stored as power `10`
- Cube value 1St → stored as power `70`
- ∞ → stored as power `80` (or a special constant like `Infinity`)

Merging is then simply: `power + 1` (since 2^n + 2^n = 2^(n+1))

Display formatting uses **BigInt** for accuracy: `floor(2n ** BigInt(power) / divisor)`. This ensures values like 2^16 = 65,536 correctly display as "65K" (not "64K"), and 2^79 displays as "604St" (not "512St").

---

## 9. AI Behavior Specification

### Spawning
- **20-30 AI snakes** on the map at all times (configurable in settings, default: 25)
- When an AI snake dies, a new one spawns to maintain the count
- New spawns' head value is within **±2 power levels** of the player's current head value
  - Example: Player head is 256 (2⁸) → new AI spawns range from 64 (2⁶) to 1024 (2¹⁰)
- AI snakes spawn at random positions on the map (not too close to the player)
- AI snakes start as solo head cubes (just like the player)

### AI Snake Composition
- AI snakes grow by eating ground cubes, just like the player
- They follow the same merge rules as the player
- Their snake bodies are sorted descending, same as the player

### Behavior States

**When Fear Mode is OFF (normal):**
- AI snakes **actively hunt** the player and other AI snakes
- They seek nearby cubes to eat (ground cubes and weaker snakes)
- They try to eat snakes with lower head values
- They avoid snakes with higher head values
- Larger AI snakes are more aggressive, smaller ones are more cautious

**When Fear Mode is ON:**
- ALL AI snakes flee from the player
- They move in the opposite direction of the player
- They still eat ground cubes they pass while fleeing
- They still interact with each other normally (AI vs AI combat continues)
- If player chases them, they keep running but CAN be caught and eaten

### AI Movement
- AI snakes use the same joystick-style free 360° movement as the player
- AI movement speed is **always 10% slower** than the player's current speed
- AI pathfinding: simple steering behavior — seek targets, avoid threats, flee from player when feared

### AI vs AI Combat
- AI snakes fight each other using the same combat rules as player vs AI
- When an AI kills another AI, cubes drop on the ground
- This creates organic gameplay where the arena is always active

---

## 10. UI/UX Design

### 10.1 Home Page

Clean and minimal design. Portrait orientation.

```
┌─────────────────────────┐
│                         │
│    ┌─────────────────┐  │
│    │                 │  │
│    │   CUBE ARENA    │  │
│    │    INFINITY     │  │
│    │    [LOGO]       │  │
│    │                 │  │
│    └─────────────────┘  │
│                         │
│                         │
│    ── High Score ──     │
│       256K              │
│                         │
│                         │
│   ┌───────────────────┐ │
│   │ Starting Cube:    │ │
│   │                   │ │
│   │  ◄  [  64  ]  ►  │ │
│   │                   │ │
│   │ (scrollable list) │ │
│   └───────────────────┘ │
│                         │
│                         │
│    ┌─────────────────┐  │
│    │                 │  │
│    │      PLAY       │  │
│    │                 │  │
│    └─────────────────┘  │
│                         │
│         ⚙️ Settings     │
│                         │
└─────────────────────────┘
```

**Elements:**
- Game logo/title at the top (placeholder until real PNG is provided)
- High score display (all-time best head value)
- Starting cube selector — scrollable picker showing all powers of 2 from 2 to ∞
- Big centered PLAY button
- Small settings icon/link at the bottom

### 10.2 In-Game HUD

Minimal, non-intrusive overlay on top of the 3D game view.

```
┌─────────────────────────┐
│ ⏸  Score: 256K          │
│     Kills: 12           │
│     Time: 04:32         │
│                         │
│              ┌────────┐ │
│              │ 1. 512K│ │
│              │ 2. 256K│ │ ← Leaderboard
│              │►3. 256K│ │ ← You (highlighted)
│              │ 4. 128K│ │
│              │ 5. 64K │ │
│  ┌────┐      └────────┘ │
│  │ 🔄 │                 │
│  │REV │ ← Reverse Mode  │
│  └────┘                 │
│  ┌────┐                 │
│  │ 😨 │                 │
│  │FEAR│ ← Fear Mode     │
│  └────┘                 │
│                         │
│                         │
│         (game view)     │
│                         │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

**Elements:**
- **Top-left:** Pause button (⏸)
- **Top area:** Score (head value), Kill count, Timer (survival time)
- **Top-right:** Leaderboard (top 5 snakes, your position highlighted with ► marker)
- **Left-middle:** Reverse Mode toggle button (stacked vertically)
- **Left-middle (below):** Fear Mode toggle button
- **Rest of screen:** Touch area for controlling snake direction

**Toggle Button States:**
- OFF: Muted/gray appearance
- ON: Bright, glowing, clearly active

### 10.3 Pause Menu

Overlay that appears when pause button is tapped.

```
┌─────────────────────────┐
│                         │
│    ┌─────────────────┐  │
│    │                 │  │
│    │     PAUSED      │  │
│    │                 │  │
│    │  ┌───────────┐  │  │
│    │  │  RESUME   │  │  │
│    │  └───────────┘  │  │
│    │                 │  │
│    │  ┌───────────┐  │  │
│    │  │   QUIT    │  │  │
│    │  └───────────┘  │  │
│    │                 │  │
│    └─────────────────┘  │
│                         │
└─────────────────────────┘
```

- Game is frozen while paused
- Semi-transparent dark overlay behind the menu
- Two buttons: Resume (continue playing) and Quit (go to home page)

### 10.4 Game Over Page

Appears after the death animation completes.

```
┌─────────────────────────┐
│                         │
│       GAME OVER         │
│                         │
│    ┌─────────────────┐  │
│    │ Final Score      │  │
│    │     256K         │  │
│    │                 │  │
│    │ Time: 07:23     │  │
│    │ Kills: 18       │  │
│    │ Rank: #2        │  │
│    └─────────────────┘  │
│                         │
│                         │
│    ┌─────────────────┐  │
│    │                 │  │
│    │    RESPAWN 🔄   │  │
│    │                 │  │
│    └─────────────────┘  │
│                         │
│          🏠             │
│      (home icon)        │
│                         │
└─────────────────────────┘
```

**Elements:**
- "GAME OVER" title
- Stats panel: Final score (head value), time survived, enemies killed, leaderboard rank
- **RESPAWN** button (large, prominent, with icon and text) — primary action
- **Home** button (small icon only, no text) — secondary action

### 10.5 Settings Page

Accessible from the home page only (not during gameplay).

```
┌─────────────────────────┐
│  ← Back     SETTINGS    │
│                         │
│  Movement Speed         │
│        [50]             │
│  ──────●──────────      │
│  1              100     │
│                         │
│  Number of AI Snakes    │
│        [25]             │
│  ──────●──────────      │
│  1              100     │
│                         │
│  Ground Cubes           │
│        [500]            │
│  ──────────●──────      │
│  0             1000     │
│                         │
└─────────────────────────┘
```

**Elements:**
- Back button (returns to home page)
- Three slider bars, each with the current value displayed above the slider
- Movement Speed: 1–100, default 50
- AI Snake Count: 1–100, default 25
- Ground Cube Count: 0–1000, default 500

---

## 11. Controls & Input

### Mobile (Primary)

**Movement:** The snake head moves toward wherever the player's finger is touching on the screen. Point where you want to go — the snake follows your finger position. Lifting your finger = snake continues in the last direction.

**Buttons:**
- Pause: Tap the ⏸ icon (top-left)
- Reverse Mode: Tap the REV toggle button (left side)
- Fear Mode: Tap the FEAR toggle button (left side)

**Important:** The toggle buttons must NOT interfere with movement controls. They should be positioned so that tapping them doesn't accidentally redirect the snake.

### Desktop (Secondary)

**Movement:** The snake head moves toward the mouse cursor position. Same "point where to go" mechanic as touch.

**Keyboard alternatives (optional):**
- `P` or `Escape` — Pause
- `R` — Toggle Reverse Mode
- `F` — Toggle Fear Mode

---

## 12. Camera System

### Camera Type
- **Angled top-down view** (~45° angle), similar to the original Cube Arena 2048 games
- Camera is positioned above and slightly behind the player's snake head
- The camera always follows the player's head smoothly

### Camera Behavior
- **Smooth follow:** Camera lerps (linear interpolation) toward the player's head position. Not instant — slight lag for a polished feel
- **Rotation:** Camera does NOT rotate with the snake's direction. It maintains a fixed angle orientation (north is always up on screen)
- **Zoom:** Fixed zoom level that shows a good area around the player. No dynamic zoom for v1.0
- **Arena edges:** When the player is near arena boundaries, the camera should NOT show beyond the arena walls. Clamp the camera position so the view stays within the arena

### Camera Settings
- **Follow speed:** 0.08–0.12 lerp factor (tunable)
- **Height:** High enough to see ~15-20 cube lengths around the player
- **Angle:** ~45° from horizontal (looking down at an angle)

---

## 13. Arena & Environment

### Arena Size
- **Large arena** — designed for 5-15 minute games
- Dimensions: approximately 200×200 units (tunable based on testing)
- The arena should feel spacious with 25 AI snakes and 500 ground cubes

### Floor
- **Light gray grid** pattern
- Clean, minimal look
- Grid lines help players sense their movement speed and direction
- Grid cell size: approximately 1 cube-width per cell

### Boundary Walls
- **Low fence/barrier style** — player can see over the walls to the edge of the world
- Walls are decorative, not tall — just enough to clearly mark the boundary
- Soft collision — player stops at the wall, no damage, must rotate to move away
- Slight visual indicator (e.g., subtle red tint on the fence) when player is very close to a wall

### Lighting
- Bright, even lighting — no harsh shadows
- Soft ambient light + one directional light (like sunlight)
- Cheerful, well-lit atmosphere matching the candy/cartoon style

### Background
- Simple sky color or very soft gradient above the arena walls
- Nothing distracting — the focus should be on the gameplay

---

## 14. Collision Detection

### Hitbox Definitions

**Snake Head Hitbox:**
- Sphere collider centered on the head cube
- Radius: approximately 0.6× the cube size (slightly larger than the cube for forgiving gameplay)
- Only the HEAD has an active collision hitbox for eating/combat

**Snake Body/Tail Hitbox:**
- Each body cube has a sphere collider
- These are PASSIVE — they can be eaten by other snakes' heads, but they don't initiate collisions
- Radius: approximately 0.5× the cube size

**Ground Cube Hitbox:**
- Sphere collider centered on the cube
- Radius: approximately 0.5× the cube size

### Collision Priority

When multiple collisions happen in the same frame, resolve in this order:
1. Player head vs enemy head (highest priority — determines life or death)
2. Player head vs enemy body cubes
3. Player head vs ground cubes (lowest priority — just eating)

### Collision Rules Summary

| Your Head Touches | Normal Mode | Reverse Mode |
|---|---|---|
| Ground cube ≤ your value | Eat it (add to snake) | **DIE** |
| Ground cube ≥ your value | **DIE** | Eat it (becomes new head) |
| Enemy cube ≤ your value | Eat it (combat rules apply) | **DIE** |
| Enemy cube ≥ your value | **DIE** | Eat it (combat rules apply) |
| Equal enemy head | Bounce (neither dies) | Bounce (neither dies) |
| Arena wall | Stop (no damage) | Stop (no damage) |

---

## 15. Animation & VFX

### Animation Speed Philosophy
- **Small merges/eats:** Fast & snappy (100-200ms)
- **Big merges/kills:** Dramatic & satisfying (300-500ms)
- Scale the drama based on the value difference

### Animation List

| Trigger | Animation | Duration | Description |
|---|---|---|---|
| Eat ground cube | **Absorb** | 150ms | Cube quickly shrinks and slides into the snake at the correct sorted position |
| Merge (same values) | **Pop & Grow** | 200ms | Two cubes slide together, brief squash/stretch, pop into the merged value with a slight scale-up then settle |
| Chain merge | **Rapid cascade** | 150ms each | Each merge in the chain fires rapidly, one after another, with escalating particle effects |
| New value created | **Number fly-up** | 300ms | The new merged value briefly appears as floating text above the cube, rises up, and fades out |
| Equal heads bounce | **Bounce/bump** | 250ms | Both heads compress slightly on impact, then spring apart. Fun, cartoony feel |
| Eat enemy head (kill) | **Explosion scatter** | 400ms | Enemy snake explodes outward — all cubes fly apart and land as ground cubes with bounce |
| Eat enemy body (partial) | **Slice & scatter** | 350ms | The eaten portion separates and cubes tumble/scatter to the ground |
| Player death | **Shatter** | 500ms | Player snake shatters dramatically — cubes fly outward, screen shake, particles, slight slow-motion |
| Big merge (high value) | **Screen shake** | 200ms | Brief camera shake proportional to the merge value. Subtle for small merges, noticeable for big ones |
| Eating any cube | **Particles/sparkles** | 300ms | Small burst of sparkle particles at the eat location. Color matches the eaten cube |

### Particle Effects
- **Eat sparkles:** 5-10 small bright particles burst outward from the eat point, fade out quickly
- **Merge glow:** Brief glow/flash at the merge point
- **Death explosion:** 20-30 particles burst outward, larger and more dramatic
- **Trail particles (optional):** Very subtle particle trail behind the snake head while moving

---

## 16. Game Balance Tables

### Ground Cube Spawn Distribution

Ground cubes spawn with weighted random values. Mostly small cubes, rarely large ones.

| Cube Value | Spawn Weight | Approximate % |
|---|---|---|
| 1 | 25 | 25% |
| 2 | 20 | 20% |
| 4 | 15 | 15% |
| 8 | 12 | 12% |
| 16 | 10 | 10% |
| 32 | 7 | 7% |
| 64 | 5 | 5% |
| 128 | 3 | 3% |
| 256 | 2 | 2% |
| 512+ | 1 | 1% (very rare) |

### AI Snake Spawn Rules

| Parameter | Value |
|---|---|
| Minimum AI snakes on map | Configurable (default: 25) |
| Maximum AI snakes on map | Configurable (default: 25) |
| Spawn delay after death | 2-5 seconds (random) |
| Spawn head value range | Player head ±2 power levels |
| Spawn location | Random position, minimum 30 units from player |
| Initial snake length | 1 (head only, like player) |

### Speed Settings

| Parameter | Value |
|---|---|
| Base movement speed at setting 50 | 8 units/second (tunable) |
| Speed at setting 1 | 2 units/second |
| Speed at setting 100 | 16 units/second |
| Player speed bonus | Always 10% faster than AI |
| AI speed | Player speed × 0.909 (=1/1.1) |

### Snake Growth

| Event | Snake Length Change |
|---|---|
| Eat a ground cube | +1 (then merge may reduce) |
| Merge two cubes | -1 (two become one) |
| Kill enemy (head kill) | 0 (cubes drop on ground, not absorbed) |
| Partial eat (body kill) | 0 (cubes drop on ground, not absorbed) |

---

## 17. Leaderboard System

### In-Game Live Leaderboard

- Displayed in the top-right corner during gameplay
- Shows the **top 5 snakes** on the map (including player and AI)
- Ranked by **head cube value** (highest first)
- Player's entry is highlighted with a ► marker and distinct color
- Updates in real-time as snakes grow/die
- If player is not in top 5, show top 4 + player's position (e.g., "#12. 64K ◄")

**Tie-breaking rules (when head values are equal):**
1. Snake with more total cubes (longer snake) ranks higher
2. If still tied, snake that reached that value first ranks higher

### All-Time High Score Board

- Stored in **localStorage**
- Accessible from the home page (shown as "High Score: XXX")
- Tracks the **highest head value ever reached** across all game sessions
- Persists between browser sessions

### Crown System

- The snake with the **highest head value** on the map gets a **3D golden crown** floating and slowly rotating above its head cube
- If multiple snakes are tied for highest, ALL of them get crowns
- In **Reverse Mode**, the crown moves to the snake with the **lowest head value** (since low is powerful in reverse)
- The crown is purely cosmetic — no gameplay effect

---

## 18. Settings & Configuration

### Settings Location
- Accessible from the **home page only** (settings icon/button)
- NOT accessible during gameplay (to prevent mid-game tweaking)
- Changes take effect on the next game start

### Setting Details

| Setting | Control | Range | Default | Description |
|---|---|---|---|---|
| Movement Speed | Slider + number | 1–100 | 50 | Base speed of all cubes. Player is always 10% faster than AI |
| AI Snake Count | Slider + number | 1–100 | 25 | Number of AI snakes maintained on the map |
| Ground Cubes | Slider + number | 0–1000 | 500 | Number of ground cubes scattered on the map |

### Slider UI
- Each slider shows the **current value displayed above it**
- Smooth drag interaction on mobile
- Tapping on the slider track jumps to that value
- Values update in real-time as the slider is dragged

### Persistence
- Settings are saved to **localStorage**
- Persist between browser sessions
- Reset to defaults if localStorage is cleared

---

## 19. Brand & Visual Design System

### Game Identity
- **Name:** Cube Arena Infinity
- **Tagline:** (TBD — optional)
- **Logo:** Placeholder until real PNG is provided by the user. Use a text-based logo with the game name styled in the brand font

### Color Palette

**Cube Colors:**
- Each cube gets a **random medium-toned color** from a curated palette
- Colors should NOT be too bright (neon) or too dark (muddy)
- The colors should provide good contrast with white text
- Suggested HSL range: Saturation 50-70%, Lightness 45-60%
- Pre-defined palette of ~20 colors that look good together:

```javascript
const CUBE_COLORS = [
  '#E07B54', // warm orange
  '#D45B7A', // rose
  '#C75CA0', // magenta
  '#9B6DC6', // purple
  '#6B7FD7', // periwinkle
  '#5B9BD5', // blue
  '#4DB6AC', // teal
  '#66BB6A', // green
  '#8BC34A', // lime
  '#D4A843', // gold
  '#E08E5A', // peach
  '#AE6BBD', // orchid
  '#5C9EAD', // ocean
  '#7CB855', // grass
  '#C67B5C', // sienna
  '#6C8EBF', // slate blue
  '#B5684E', // terra cotta
  '#58A683', // sage
  '#CB7EB5', // pink
  '#7E9E4A', // olive
];
```

**UI Colors:**
- Background: White/very light gray (#F5F5F5)
- Primary button: Bright playful color (#4CAF50 green or #FF6B6B coral)
- Text: Dark gray (#333333)
- Secondary text: Medium gray (#888888)
- Leaderboard highlight (player): Soft yellow/gold (#FFF3CD)
- Toggle ON: Bright green or blue glow
- Toggle OFF: Gray (#CCCCCC)

**Arena Colors:**
- Floor grid: Light gray (#E0E0E0) lines on white (#F8F8F8) background
- Fence/barrier: Soft brown or warm gray
- Sky/background: Light blue gradient or solid light color

### Typography

**Primary Font:** Nunito (Google Fonts) — rounded, playful, excellent readability

- **Game title:** Nunito Black, 36-48px
- **Cube numbers:** Nunito Bold, sized to fit cube face
  - Numbers 2-512: Large font
  - Numbers 1K+: Slightly smaller to fit with suffix
- **HUD text:** Nunito SemiBold, 14-18px
- **Button text:** Nunito Bold, 18-24px
- **Body text:** Nunito Regular, 14-16px

**Number on Cube Styling:**
- Color: White (#FFFFFF)
- Stroke: Thin black outline (1-2px) for readability on any cube color
- Centered on the cube face
- Should be visible from the game camera angle

### Crown Design
- 3D model: Simple golden crown (low-poly, ~100-200 triangles)
- Color: Gold (#FFD700) with slight metallic sheen
- Animation: Slowly rotates (1 rotation per 3 seconds) and bobs up/down slightly
- Position: Floating ~0.5 cube-heights above the head cube

---

## 20. User Stories

### Gameplay User Stories

**US-G01: Starting a Game**
As a player, I want to select my starting cube value and tap PLAY so that I can begin the game at my preferred difficulty level.
- Acceptance: Player appears at center of map as a single cube with the selected value. AI snakes spawn at ±2 power levels.

**US-G02: Moving the Snake**
As a player, I want to touch the screen and have my snake move toward my finger so that I can navigate the arena intuitively.
- Acceptance: Snake head smoothly turns and moves toward touch point. Tail follows with snake-like trailing. Lifting finger continues in last direction.

**US-G03: Eating a Ground Cube**
As a player, I want to move my head over a ground cube so that it gets added to my snake in the correct sorted position.
- Acceptance: Cube disappears from ground, appears in snake at correct position, merge triggers if duplicate exists.

**US-G04: Merging Cubes**
As a player, I want duplicate cubes in my snake to automatically merge so that my head value increases.
- Acceptance: Two adjacent same-value cubes merge into one cube with double the value. Snake becomes 1 cube shorter. Chain reactions cascade.

**US-G05: Killing an Enemy (Head Kill)**
As a player, I want to eat an enemy's head cube so that their entire snake dies and drops all cubes on the ground.
- Acceptance: Enemy snake explodes, all cubes scatter on ground as individual ground cubes. Player's snake is unchanged.

**US-G06: Partial Eat (Body Kill)**
As a player, I want to eat a body cube of an enemy snake so that the lower portion breaks off while they keep their head.
- Acceptance: Eaten cube + all smaller cubes drop to ground. Enemy keeps head and larger cubes. Enemy snake continues playing.

**US-G07: Using Reverse Mode**
As a player, I want to toggle Reverse Mode so that I can eat bigger cubes to rapidly increase my head value.
- Acceptance: Toggle button clearly shows ON state. Bigger cubes become edible. Smaller cubes become lethal. Eaten bigger cube becomes new head.

**US-G08: Using Fear Mode**
As a player, I want to toggle Fear Mode so that all AI enemies flee from me.
- Acceptance: All AI snakes on map change behavior to flee from player. Player can still chase and eat them. AI snakes still eat ground cubes while fleeing.

**US-G09: Dying**
As a player, when I touch a cube that kills me, I want to see a dramatic death animation followed by the game over screen.
- Acceptance: Snake shatters with explosion animation. Screen shake. Game over screen appears with stats. Respawn button available.

**US-G10: Respawning**
As a player, I want to tap Respawn after dying so that I continue playing with my same snake.
- Acceptance: Player respawns at center of map with exact same snake (head + tail). Game continues seamlessly. Unlimited respawns.

**US-G11: Crown Display**
As a player, I want to see a golden crown on the highest-ranked snake so that I know who's the king of the arena.
- Acceptance: 3D golden crown floats and rotates above the highest-value head. Ties give crowns to all tied snakes. Reverse Mode flips crown to lowest value.

### UI User Stories

**US-U01: Home Page Navigation**
As a player, I want a clean home page with a PLAY button and cube selector so that I can quickly start a game.
- Acceptance: Logo, high score, cube selector, PLAY button, settings icon all visible. No clutter.

**US-U02: Adjusting Settings**
As a player, I want to adjust game speed, AI count, and ground cubes with sliders so that I can customize my experience.
- Acceptance: Three sliders with values displayed above them. Changes save to localStorage. Take effect on next game.

**US-U03: Viewing the Leaderboard**
As a player, I want to see a live leaderboard during gameplay so that I know my ranking among all snakes.
- Acceptance: Top 5 shown in top-right. Player highlighted. Updates in real-time.

**US-U04: Pausing the Game**
As a player, I want to tap a pause button so that I can take a break or quit.
- Acceptance: Game freezes. Overlay with Resume and Quit buttons. Resume continues, Quit goes to home.

**US-U05: Game Over Stats**
As a player, I want to see my final stats after dying so that I know how well I did.
- Acceptance: Final score, time survived, enemies killed, leaderboard rank all shown.

### Edge Case User Stories

**US-E01: Equal Head Collision**
As a player, when my head collides with an equal-value enemy head, I want both snakes to bounce apart so that neither dies unfairly.
- Acceptance: Bounce animation plays. Both snakes pushed apart. No cubes lost. No damage.

**US-E02: Wall Collision**
As a player, when I move into an arena wall, I want my snake to stop without dying so that walls are not punishing.
- Acceptance: Snake stops at wall. No damage. Player must rotate to move away.

**US-E03: Reverse Mode + Small Ground Cube**
As a player in Reverse Mode, when I accidentally touch a small ground cube, I want the game to correctly kill me since small cubes are dangerous in Reverse Mode.
- Acceptance: Death triggers, death animation plays, game over screen appears.

**US-E04: Multiple Simultaneous Merges**
As a player, when eating a cube causes a chain of merges, I want all merges to resolve correctly and in sequence.
- Acceptance: All merges cascade properly. Snake length decreases by correct amount. Final snake is valid (sorted, no duplicates).

**US-E05: Respawn into Danger**
As a player, when I respawn at the center of the map, I want a brief invulnerability period so that I don't instantly die to a nearby enemy.
- Acceptance: 2-3 second invulnerability after respawn. Snake flashes/blinks to indicate invulnerability. After the grace period, normal rules apply.

---

## 21. Edge Cases

### Merge Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Eating a cube that causes 5+ chain merges | All merges resolve sequentially. Animations cascade rapidly. |
| Snake has only 1 cube (head only) and eats a same-value cube | They merge. Head becomes double value. Snake is still 1 cube. |
| Merge would create ∞ (final merge) | ∞ cube is created. Special celebration animation. Game continues. |
| Two merges would happen at the same position | Process top-to-bottom (head toward tail). First merge resolves, then check again. |

### Combat Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Player and enemy head collide on the exact same frame | Compare head values. Higher wins. Equal = bounce. |
| Player eats enemy body cube while another enemy eats player | Process player action first (player advantage). If player dies from the other enemy, process death. |
| Enemy snake has only 1 cube (head only) and player eats it | Enemy dies. Single cube drops on ground. |
| Player in Reverse Mode eats enemy head that is bigger | Reverse rules apply. The enemy head is eaten. Enemy dies, all cubes drop. The eaten head becomes player's new head. |

### Mode Switching Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Player toggles Reverse Mode while touching a cube | Mode at time of collision applies. No retroactive changes. |
| Player toggles Fear Mode — enemy was mid-attack | Enemy immediately switches to flee behavior. Attack is cancelled. |
| Player toggles Reverse Mode and Fear Mode simultaneously | Both toggles apply independently. State updates to the correct combination. |

### Respawn Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Player respawns at center but enemy is standing there | Player has 2-3 second invulnerability grace period. |
| Player respawns and immediately toggles Reverse Mode | Allowed. All modes available during invulnerability. |
| Player died with very long snake (50+ cubes) | Respawn with full snake. All cubes preserved. |

---

## 22. Technical Architecture

### Project Structure

```
cube-arena-infinity/
├── index.html                  # Entry point
├── vite.config.js              # Vite configuration
├── package.json
├── CLAUDE.md                   # This file (GDD + instructions)
├── CHANGELOG.md                # Auto-maintained change history
│
├── public/
│   ├── fonts/                  # Nunito font files
│   ├── sounds/                 # Sound effect files
│   ├── models/                 # 3D models (crown, etc.)
│   └── textures/               # Textures if needed
│
├── src/
│   ├── main.js                 # App entry point, initializes game
│   │
│   ├── core/
│   │   ├── Game.js             # Main game loop, state management
│   │   ├── Scene.js            # Three.js scene setup, lighting, renderer
│   │   ├── Camera.js           # Camera controller (follow, angle, clamp)
│   │   ├── InputManager.js     # Touch/mouse input handling
│   │   └── AudioManager.js     # Sound effect loading and playback
│   │
│   ├── entities/
│   │   ├── Snake.js            # Snake class (player and AI share this)
│   │   ├── Cube.js             # Individual cube (value, color, mesh)
│   │   ├── GroundCube.js       # Ground cube (extends Cube, spawning logic)
│   │   ├── Crown.js            # Crown model and animation
│   │   └── Arena.js            # Arena floor, walls, boundaries
│   │
│   ├── systems/
│   │   ├── MergeSystem.js      # Merge logic, chain reactions
│   │   ├── CombatSystem.js     # Snake vs snake combat resolution
│   │   ├── CollisionSystem.js  # Collision detection (spatial hashing)
│   │   ├── SpawnSystem.js      # Ground cube and AI snake spawning
│   │   ├── ModeSystem.js       # Reverse Mode and Fear Mode logic
│   │   └── LeaderboardSystem.js # Live ranking and all-time scores
│   │
│   ├── ai/
│   │   ├── AIController.js     # AI decision making and behavior
│   │   ├── SteeringBehavior.js # Seek, flee, avoid movement logic
│   │   └── AISpawner.js        # AI snake creation and scaling
│   │
│   ├── ui/
│   │   ├── UIManager.js        # Overall UI state management
│   │   ├── HomeScreen.js       # Home page UI (HTML overlay)
│   │   ├── GameHUD.js          # In-game HUD (score, kills, timer, leaderboard)
│   │   ├── PauseMenu.js        # Pause overlay
│   │   ├── GameOverScreen.js   # Game over stats and respawn
│   │   ├── SettingsScreen.js   # Settings page with sliders
│   │   └── CubeSelector.js     # Starting cube value picker
│   │
│   ├── effects/
│   │   ├── ParticleSystem.js   # Particle effects (sparkles, explosions)
│   │   ├── AnimationManager.js # Merge, eat, bounce, death animations
│   │   └── ScreenShake.js      # Camera shake effect
│   │
│   ├── utils/
│   │   ├── NumberFormatter.js  # Power-of-2 to display string (64K, 1M, etc.)
│   │   ├── ColorPalette.js     # Cube color definitions and random picker
│   │   ├── MathUtils.js        # Vector math, lerp, distance, etc.
│   │   ├── Constants.js        # Game constants, defaults, tuning values
│   │   └── Storage.js          # localStorage wrapper for settings/scores
│   │
│   └── config/
│       └── GameConfig.js       # All tunable game parameters in one place
│
└── tests/
    ├── merge.test.js           # Merge logic unit tests
    ├── combat.test.js          # Combat resolution tests
    ├── numberFormat.test.js    # Number formatting tests
    └── collision.test.js       # Collision detection tests
```

### Module Dependency Diagram

```
main.js
  └── Game.js (core game loop)
        ├── Scene.js (Three.js setup)
        ├── Camera.js (follows player)
        ├── InputManager.js (touch/mouse)
        ├── AudioManager.js (sounds)
        │
        ├── Snake.js (player + AI entities)
        │     ├── Cube.js (individual cubes)
        │     └── Crown.js (leader indicator)
        │
        ├── Arena.js (floor + walls)
        ├── GroundCube.js (scattered cubes)
        │
        ├── MergeSystem.js ←→ Snake.js
        ├── CombatSystem.js ←→ Snake.js, CollisionSystem.js
        ├── CollisionSystem.js ←→ all entities
        ├── SpawnSystem.js ←→ GroundCube.js, AISpawner.js
        ├── ModeSystem.js ←→ Snake.js, CombatSystem.js
        ├── LeaderboardSystem.js ←→ Snake.js
        │
        ├── AIController.js ←→ Snake.js, SteeringBehavior.js
        │
        ├── UIManager.js
        │     ├── HomeScreen.js
        │     ├── GameHUD.js
        │     ├── PauseMenu.js
        │     ├── GameOverScreen.js
        │     └── SettingsScreen.js
        │
        └── AnimationManager.js ←→ ParticleSystem.js, ScreenShake.js
```

---

## 23. Data Models

### Cube

```javascript
{
  id: string,              // Unique identifier (UUID)
  power: number,           // Exponent (e.g., 6 means value = 2^6 = 64)
  value: number,           // Computed: 2^power (for display/comparison)
  displayValue: string,    // Formatted string ("64", "1K", "2M", etc.)
  color: string,           // Hex color from palette
  mesh: THREE.Mesh,        // Three.js 3D mesh object
  position: THREE.Vector3, // World position
  radius: number,          // Collision radius
  isGroundCube: boolean,   // True if this cube is on the ground (not in a snake)
}
```

### Snake

```javascript
{
  id: string,              // Unique identifier
  isPlayer: boolean,       // True for the player's snake
  head: Cube,              // Reference to the head cube (highest value)
  body: Array<Cube>,       // Ordered array [head, ...tail] sorted descending by power
  length: number,          // Number of cubes in the snake
  speed: number,           // Current movement speed (units/second)
  direction: THREE.Vector2,// Current movement direction (normalized)
  targetDirection: THREE.Vector2, // Where the snake wants to go (toward finger/mouse)
  position: THREE.Vector3, // Head position in world space
  isAlive: boolean,        // False when dead
  isInvulnerable: boolean, // True during respawn grace period
  invulnerabilityTimer: number, // Countdown for grace period (seconds)

  // Mode states (player only)
  reverseMode: boolean,    // True when Reverse Mode is active
  fearMode: boolean,       // True when Fear Mode is active

  // Stats
  killCount: number,       // Enemies defeated this session
  survivalTime: number,    // Seconds survived
}
```

### GameState

```javascript
{
  status: 'home' | 'playing' | 'paused' | 'gameover',
  player: Snake,
  aiSnakes: Array<Snake>,
  groundCubes: Array<Cube>,
  settings: {
    movementSpeed: number,    // 1-100, default 50
    aiSnakeCount: number,     // 1-100, default 25
    groundCubeCount: number,  // 0-1000, default 500
  },
  startingPower: number,      // Selected starting cube power
  highScore: number,          // All-time best (power value)
  leaderboard: Array<{id, name, headPower}>, // Live top snakes
  elapsed: number,            // Game time in seconds
}
```

### Settings (localStorage)

```javascript
{
  movementSpeed: 50,
  aiSnakeCount: 25,
  groundCubeCount: 500,
  highScore: 0,              // Stored as power value
  lastStartingPower: 1,      // Last selected starting cube (power of 2^1 = 2)
}
```

---

## 24. Performance Optimization

### Mobile-First Priorities

1. **Target frame rate:** 60 FPS on modern phones, 30 FPS minimum on older devices
2. **Memory budget:** Keep under 150MB total
3. **Draw calls:** Minimize — aim for under 200 draw calls per frame

### Optimization Strategies

**Spatial Hashing for Collisions:**
- Divide the arena into a grid of cells
- Each cell tracks which cubes/snakes are in it
- Only check collisions between objects in the same or adjacent cells
- Dramatically reduces collision checks from O(n²) to O(n)

**Object Pooling:**
- Pre-create a pool of Cube meshes (e.g., 1000)
- When a cube is "destroyed," return it to the pool instead of garbage collecting
- When a cube is needed, take from the pool instead of creating new
- Same for particles

**Instanced Rendering:**
- Use Three.js InstancedMesh for ground cubes (they're all the same geometry)
- Single draw call for all ground cubes instead of 500 separate calls
- Update instance matrices for position/color changes

**LOD (Level of Detail):**
- Cubes far from the camera: Don't render numbers on their faces
- Very far cubes: Render as simple colored boxes (no text texture)
- Off-screen cubes: Skip rendering entirely (frustum culling — Three.js does this automatically)

**Text Rendering:**
- Pre-generate texture atlas for all possible cube number displays
- Don't create new textures at runtime — look up from the atlas
- Canvas-based text rendering for the atlas at startup

**AI Optimization:**
- AI decision-making runs at reduced frequency (every 200ms, not every frame)
- AI pathfinding uses simple steering, not complex pathfinding algorithms
- AI snakes far from the player can be "simplified" (less frequent updates)

---

## 25. Testing Checklist

### Phase 1: Foundation
- [ ] Three.js scene renders with correct lighting
- [ ] Arena floor grid is visible and correctly sized
- [ ] Arena boundary walls are visible and correctly positioned
- [ ] Camera is at correct angle (~45°)
- [ ] Camera follows a target point smoothly
- [ ] Touch input is detected on mobile
- [ ] Mouse position is tracked on desktop

### Phase 2: Snake Mechanics
- [ ] Single cube renders with correct color and number
- [ ] Snake moves toward touch/mouse position
- [ ] Snake moves smoothly at correct speed
- [ ] Tail cubes follow head with snake-like delay
- [ ] Snake stops at arena walls without damage
- [ ] Ground cubes spawn at correct count and distribution
- [ ] Eating a ground cube adds it to the correct sorted position
- [ ] Eating a duplicate triggers auto-merge
- [ ] Chain merges resolve correctly (test 3+ chain)
- [ ] Snake length decreases by 1 per merge
- [ ] Number formatting is correct for all ranges (2 → ∞)

### Phase 3: Combat & AI
- [ ] AI snakes spawn at correct count
- [ ] AI snakes move and eat ground cubes
- [ ] AI snakes scale to ±2 of player's head value
- [ ] Head vs head (equal) = bounce, no death
- [ ] Head vs smaller enemy cube = eat (normal mode)
- [ ] Head vs bigger enemy cube = death (normal mode)
- [ ] Eating enemy head = enemy dies, all cubes drop
- [ ] Eating enemy body = partial drop, enemy keeps higher cubes
- [ ] Dropped cubes appear as ground cubes at correct positions
- [ ] Dead AI snakes respawn after delay

### Phase 4: Modes & UI
- [ ] Reverse Mode toggle works (ON/OFF)
- [ ] Reverse Mode: can eat bigger cubes, small cubes kill
- [ ] Reverse Mode: bigger cube becomes new head
- [ ] Reverse Mode: combat rules flip correctly
- [ ] Fear Mode toggle works (ON/OFF)
- [ ] Fear Mode: all AI snakes flee from player
- [ ] Fear Mode: player can still eat fleeing enemies
- [ ] Both modes combined work correctly
- [ ] HUD displays: score, kills, timer, leaderboard
- [ ] Leaderboard ranks correctly, updates in real-time
- [ ] Crown appears on highest-value head
- [ ] Crown switches to lowest-value head in Reverse Mode
- [ ] Pause menu: game freezes, Resume works, Quit works
- [ ] Game Over screen: stats display correctly
- [ ] Respawn: player appears at center with same snake
- [ ] Respawn invulnerability: 2-3 seconds, snake blinks
- [ ] Home screen: cube selector, high score, PLAY button
- [ ] Settings: three sliders work, values persist in localStorage

### Phase 5: Polish
- [ ] All animations play correctly (merge, eat, bounce, death, etc.)
- [ ] Particles spawn at correct locations
- [ ] Screen shake triggers on big merges/kills
- [ ] Sound effects play for key events
- [ ] Performance: 60 FPS on modern mobile device
- [ ] No memory leaks over 15-minute play session
- [ ] Touch controls don't conflict with toggle buttons

---

## 26. Build Phases

**The detailed build phases are maintained in a separate file: `PHASES.md`**

See PHASES.md for the complete step-by-step build order with implementation details, testing requirements, and completion checklists for each phase.

**Phase Summary:**
- **Phase 1: Foundation** — Project setup, arena, camera, input, cube rendering
- **Phase 2: Snake Mechanics** — Movement, body chain, eating, merge system
- **Phase 3: Combat & AI** — AI snakes, movement, behavior, combat, ecosystem
- **Phase 4: Modes, UI & Polish** — Reverse/Fear modes, all UI screens, animations, sounds, final polish

---

## 27. Changelog

**The changelog is maintained in a separate file: `CHANGELOG.md`**

See CHANGELOG.md for the complete history of all changes, phase completions, and bug fixes.

---

*End of Document*
