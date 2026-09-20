const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// game.js から STAGES 定義を抽出（stages.js 導入後はそちらを参照）
function loadStages() {
  const stagesPath = path.resolve(__dirname, '../docs/games/tilt-maze/stages.js');
  if (fs.existsSync(stagesPath)) {
    return require(stagesPath).STAGES;
  }
  const gamePath = path.resolve(__dirname, '../docs/games/tilt-maze/game.js');
  const content = fs.readFileSync(gamePath, 'utf8');
  const match = content.match(/const STAGES = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('STAGES not found');
  return eval(match[1]);
}

/**
 * 幅優先探索（BFS）による迷路到達可能性検証
 * 穴 ('2') を避けながらスタート ('S') からゴール ('G') に到達できるかを検査
 */
function findPath(grid, allowHoles = false) {
  const H = grid.length;
  const W = grid[0].length;
  let start = null;
  let goal = null;

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c] === 'S') start = { r, c };
      if (grid[r][c] === 'G') goal = { r, c };
    }
  }

  if (!start || !goal) {
    return { solvable: false, error: 'Start or Goal missing' };
  }

  const queue = [{ r: start.r, c: start.c, dist: 0 }];
  const visited = new Set([`${start.r},${start.c}`]);
  const dirs = [
    { dr: 0, dc: 1 },
    { dr: 0, dc: -1 },
    { dr: 1, dc: 0 },
    { dr: -1, dc: 0 }
  ];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.r === goal.r && curr.c === goal.c) {
      return { solvable: true, minSteps: curr.dist };
    }

    for (const d of dirs) {
      const nr = curr.r + d.dr;
      const nc = curr.c + d.dc;

      if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;

      const cell = grid[nr][nc];
      // 壁 ('1') は通過不可
      if (cell === '1') continue;
      // 穴 ('2') の通過可否
      if (cell === '2' && !allowHoles) continue;

      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ r: nr, c: nc, dist: curr.dist + 1 });
      }
    }
  }

  return { solvable: false, minSteps: Infinity };
}

describe('Tilt Maze Solvability & Layout Integrity Tests', () => {
  const stages = loadStages();

  it('全ステージに有効なS (スタート) と G (ゴール) が存在し、外周壁で閉塞されていること', () => {
    assert.ok(stages.length >= 3, 'ステージ数が3以上あること');

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const grid = stage.grid;
      const H = grid.length;
      const W = grid[0].length;

      assert.equal(H, 18, `Stage ${i + 1} の行数は18であること`);
      assert.equal(W, 18, `Stage ${i + 1} の列数は18であること`);

      let sCount = 0;
      let gCount = 0;

      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          const char = grid[r][c];
          if (char === 'S') sCount++;
          if (char === 'G') gCount++;

          // 外周境界チェック (r=0, r=H-1, c=0, c=W-1 は必ず '1')
          if (r === 0 || r === H - 1 || c === 0 || c === W - 1) {
            assert.equal(char, '1', `Stage ${i + 1} の外周 (${r},${c}) は壁であること`);
          }
        }
      }

      assert.equal(sCount, 1, `Stage ${i + 1} には S が1つだけ存在すること`);
      assert.equal(gCount, 1, `Stage ${i + 1} には G が1つだけ存在すること`);
    }
  });

  it('Stage 1 (Beginner Path) が落とし穴を回避してゴールまで到達可能であること', () => {
    const stage = stages[0];
    const wallOnlyResult = findPath(stage.grid, true);
    assert.ok(wallOnlyResult.solvable, 'Stage 1 は壁で遮断されておらず、幾何学的にゴールへ繋がっていること');

    const result = findPath(stage.grid, false);
    assert.ok(result.solvable, 'Stage 1 は落とし穴を回避してゴールに到達できること');
    assert.ok(result.minSteps >= 20, 'Stage 1 の最短歩数が迷路として成立する長さであること');
  });

  it('Stage 2 (The Pit Chamber) が落とし穴を回避してゴールまで到達可能であること', () => {
    const stage = stages[1];
    const wallOnlyResult = findPath(stage.grid, true);
    assert.ok(wallOnlyResult.solvable, 'Stage 2 は幾何学的にゴールへ繋がっていること');

    const result = findPath(stage.grid, false);
    assert.ok(result.solvable, 'Stage 2 は落とし穴を回避してゴールに到達できること');
  });

  it('Stage 3 (Master Labyrinth) が落とし穴を回避してゴールまで到達可能であること', () => {
    const stage = stages[2];
    const wallOnlyResult = findPath(stage.grid, true);
    assert.ok(wallOnlyResult.solvable, 'Stage 3 は幾何学的にゴールへ繋がっていること');

    const result = findPath(stage.grid, false);
    assert.ok(result.solvable, 'Stage 3 は落とし穴を回避してゴールに到達できること');
  });
});
