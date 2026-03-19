/**
 * merge.test.js — Unit tests for the MergeSystem.
 *
 * Tests merge logic, chain reactions, and sorting invariants.
 * Run with: node tests/merge.test.js
 */

// Minimal test harness (no dependencies)
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${message}`);
  }
}

// ── Mock Cube class (minimal for testing merge logic) ──────────────────

class MockCube {
  constructor(power) {
    this.power = power;
    this.x = 0;
    this.z = 0;
    this.mesh = { scale: { set: () => {} } };
  }
  getPosition() { return { x: this.x, y: 0.75, z: this.z }; }
  setPosition(x, _y, z) { this.x = x; this.z = z; }
  dispose() {}
}

// ── Mock Snake class (minimal for testing) ─────────────────────────────

class MockSnake {
  constructor(powers) {
    this.body = powers.map(p => new MockCube(p));
    this.group = { add: () => {}, remove: () => {} };
  }

  removeCubeAt(index) {
    return this.body.splice(index, 1)[0];
  }

  getPowers() {
    return this.body.map(c => c.power);
  }
}

// ── MergeSystem logic (extracted for testing without Three.js) ─────────

function checkAndMerge(snake) {
  const mergeEvents = [];
  let merged = true;

  while (merged) {
    merged = false;
    for (let i = 0; i < snake.body.length - 1; i++) {
      const current = snake.body[i];
      const next = snake.body[i + 1];

      if (current.power === next.power) {
        const fromPower = current.power;
        const toPower = current.power + 1;
        mergeEvents.push({ fromPower, toPower, index: i });

        // Remove both
        snake.body.splice(i, 1);
        snake.body.splice(i, 1);

        // Create merged cube
        const mergedCube = new MockCube(toPower);

        // Insert at correct sorted position (descending)
        let insertIdx = snake.body.length;
        for (let j = 0; j < snake.body.length; j++) {
          if (mergedCube.power >= snake.body[j].power) {
            insertIdx = j;
            break;
          }
        }
        snake.body.splice(insertIdx, 0, mergedCube);

        merged = true;
        break;
      }
    }
  }
  return mergeEvents;
}

// ── Tests ──────────────────────────────────────────────────────────────

console.log('\n🧪 MergeSystem Tests\n');

// Test 1: Simple merge (two identical adjacent cubes)
console.log('Test 1: Simple merge');
{
  const snake = new MockSnake([4, 2, 2]);  // 16, 4, 4
  const events = checkAndMerge(snake);
  assert(snake.getPowers().join(',') === '4,3', `Expected [4,3], got [${snake.getPowers()}]`);
  assert(events.length === 1, `Expected 1 merge event, got ${events.length}`);
  assert(events[0].fromPower === 2 && events[0].toPower === 3, `Merge: 2→3`);
}

// Test 2: No merge (no adjacent duplicates)
console.log('Test 2: No merge needed');
{
  const snake = new MockSnake([7, 6, 5, 3]);
  const events = checkAndMerge(snake);
  assert(snake.getPowers().join(',') === '7,6,5,3', `Body unchanged`);
  assert(events.length === 0, `No merge events`);
}

// Test 3: Chain merge (merge creates new duplicate)
console.log('Test 3: Chain merge');
{
  // 64→32→32→16 → merge 32+32=64 → 64→64→16 → merge 64+64=128 → 128→16
  const snake = new MockSnake([6, 5, 5, 4]);
  const events = checkAndMerge(snake);
  assert(snake.getPowers().join(',') === '7,4', `Expected [7,4], got [${snake.getPowers()}]`);
  assert(events.length === 2, `Expected 2 merge events (chain), got ${events.length}`);
}

// Test 4: Triple chain merge
console.log('Test 4: Triple chain merge');
{
  // 128→64→32→16→16 → cascading merges → 256
  const snake = new MockSnake([7, 6, 5, 4, 4]);
  const events = checkAndMerge(snake);
  assert(snake.getPowers().join(',') === '8', `Expected [8], got [${snake.getPowers()}]`);
  assert(events.length === 4, `Expected 4 merge events, got ${events.length}`);
}

// Test 5: Single cube + same value = merge to double
console.log('Test 5: Single head + same value merge');
{
  const snake = new MockSnake([1, 1]);  // 2, 2
  const events = checkAndMerge(snake);
  assert(snake.getPowers().join(',') === '2', `Expected [2] (merged to 4), got [${snake.getPowers()}]`);
  assert(events.length === 1, `Expected 1 merge event`);
}

// Test 6: Non-adjacent duplicates don't merge
console.log('Test 6: Non-adjacent duplicates');
{
  const snake = new MockSnake([5, 3, 5]);
  const events = checkAndMerge(snake);
  assert(events.length === 0, `No merges for non-adjacent duplicates`);
}

// Test 7: Long chain with multiple pairs
console.log('Test 7: Multiple pairs');
{
  // 8→4→4→2→2 → cascading merges → 16→4
  const snake = new MockSnake([3, 2, 2, 1, 1]);
  const events = checkAndMerge(snake);
  assert(snake.getPowers().join(',') === '4,2', `Expected [4,2], got [${snake.getPowers()}]`);
}

// Test 8: Body stays sorted descending after merge
console.log('Test 8: Sorted invariant');
{
  const snake = new MockSnake([10, 5, 5, 3, 1]);
  checkAndMerge(snake);
  const powers = snake.getPowers();
  let sorted = true;
  for (let i = 0; i < powers.length - 1; i++) {
    if (powers[i] < powers[i + 1]) {
      sorted = false;
      break;
    }
  }
  assert(sorted, `Body remains sorted descending: [${powers}]`);
}

// ── Summary ────────────────────────────────────────────────────────────
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
process.exit(failed > 0 ? 1 : 0);
