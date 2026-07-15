/**
 * Validates Frog Function Pond 2 paths are contiguous, in-bounds, avoid rocks.
 * Run: node scripts/validate-function-pond-2.mjs
 */
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';

// Parse levels via dynamic ts? Use regex extraction of path arrays — simpler to use a handmade check after transpile.
// Instead, duplicate minimal validation by importing with ts-node unavailable — inline the key checks by requiring compiled form.

const text = readFileSync(new URL('../src/lib/frogFunctionPond2Levels.ts', import.meta.url), 'utf8');

// Extract each level's gridSize, path, obstacles, robotStart, goal with a simple block split
const levelBlocks = text.split(/\{\s*\n\s*id:\s*\d+/).slice(1);
let errors = 0;

function extractArray(block, name) {
  const re = new RegExp(`${name}:\\s*\\[([\\s\\S]*?)\\],\\s*\\n`);
  const m = block.match(re);
  if (!m) return [];
  const items = [...m[1].matchAll(/\{\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)\s*\}/g)];
  return items.map((i) => ({ x: +i[1], y: +i[2] }));
}

function extractNum(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*(\\d+)`));
  return m ? +m[1] : null;
}

function extractPos(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*\\{\\s*x:\\s*(\\d+)\\s*,\\s*y:\\s*(\\d+)\\s*\\}`));
  return m ? { x: +m[1], y: +m[2] } : null;
}

levelBlocks.forEach((block, i) => {
  const id = i + 1;
  const gridSize = extractNum(block, 'gridSize');
  const path = extractArray(block, 'path');
  const obstacles = extractArray(block, 'obstacles');
  const start = extractPos(block, 'robotStart');
  const goal = extractPos(block, 'goal');
  const rockKey = new Set(obstacles.map((o) => `${o.x},${o.y}`));

  if (!path.length) {
    console.error(`L${id}: empty path`);
    errors++;
    return;
  }
  if (start && (path[0].x !== start.x || path[0].y !== start.y)) {
    console.error(`L${id}: path start !== robotStart`);
    errors++;
  }
  if (goal && (path[path.length - 1].x !== goal.x || path[path.length - 1].y !== goal.y)) {
    console.error(`L${id}: path end !== goal`);
    errors++;
  }
  for (let p = 0; p < path.length; p++) {
    const c = path[p];
    if (c.x < 0 || c.y < 0 || c.x >= gridSize || c.y >= gridSize) {
      console.error(`L${id}: path[${p}] out of bounds`, c);
      errors++;
    }
    if (rockKey.has(`${c.x},${c.y}`)) {
      console.error(`L${id}: path[${p}] hits rock`, c);
      errors++;
    }
    if (p > 0) {
      const prev = path[p - 1];
      const dist = Math.abs(c.x - prev.x) + Math.abs(c.y - prev.y);
      if (dist !== 1) {
        console.error(`L${id}: path[${p - 1}]→[${p}] not contiguous`, prev, c);
        errors++;
      }
    }
  }
  console.log(`L${id}: path ${path.length} pads, grid ${gridSize} — OK`);
});

if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}
console.log('\nAll paths valid.');
