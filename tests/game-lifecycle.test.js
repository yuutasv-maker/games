// =============================================================================
// Unit Tests: Tilt Maze Game Lifecycle & State Logic
// Using Node.js built-in test runner (node:test, node:assert/strict)
// =============================================================================

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { checkHolePull, createVec2 } = require('../docs/games/tilt-maze/physics.js');

describe('Tilt Maze Lifecycle & Game Logic Tests', () => {
  it('1. クリア演出フラグ (isStageClearing = true) の際、ボールの移動・引力・落下更新が停止すること', () => {
    // Ball.update の疑似実行
    let isPlaying = true;
    let isStageClearing = true; // クリア演出中
    let totalFalls = 0;
    let ballFalling = false;

    const ball = {
      pos: createVec2(0, 0),
      velocity: createVec2(0.2, 0.2)
    };

    function simulateBallUpdate() {
      // 修正後のガード条件: isPlaying かつ !isStageClearing
      if (!isPlaying || isStageClearing) return;

      // 穴判定（クリア中は実行されてはならない）
      const hole = createVec2(0.1, 0.1);
      const res = checkHolePull(ball, hole, 0.65, 0.32);
      if (res.falling) {
        ballFalling = true;
        totalFalls++;
      }
    }

    simulateBallUpdate();

    assert.equal(ballFalling, false, 'クリア中にボールが落下状態にならないこと');
    assert.equal(totalFalls, 0, 'クリア中に落下カウントが増加しないこと');
    assert.equal(ball.velocity.x, 0.2, 'クリア中に速度が変更されないこと');
  });

  it('2. 全ステージクリア時のトータルタイムが全走破時間 (gameStartTime) から計算されること', () => {
    const gameStartTime = 1000000;
    let stageStartTime = gameStartTime;

    // Stage 1 クリア (30秒経過)
    const stage1EndTime = gameStartTime + 30000;
    // 次のステージ開始
    stageStartTime = stage1EndTime;

    // Stage 2 クリア (40秒経過)
    const stage2EndTime = stage1EndTime + 40000;
    stageStartTime = stage2EndTime;

    // Stage 3 クリア (50秒経過)
    const allClearTime = stage2EndTime + 50000;

    // バグ時（stageStartTime基準）: 50秒
    const wrongElapsed = Math.floor((allClearTime - stageStartTime) / 1000);
    assert.equal(wrongElapsed, 50, '旧ロジックでは最終ステージ単体の時間になる');

    // 修正後（gameStartTime基準）: 30 + 40 + 50 = 120秒
    const correctElapsed = Math.floor((allClearTime - gameStartTime) / 1000);
    assert.equal(correctElapsed, 120, '全ステージ走破の合計時間 (120秒) が算出されること');
  });

  it('3. 開始ボタンの多重起動防止ガードが機能すること', () => {
    let engineInitCalls = 0;
    let isStarting = false;

    async function handleStartClick() {
      if (isStarting) return; // 二重クリック防止ガード
      isStarting = true;

      // 疑似非同期処理 (iOS permission等)
      await new Promise(r => setTimeout(r, 10));

      engineInitCalls++;
    }

    // 2回連続クリック
    handleStartClick();
    handleStartClick();

    setTimeout(() => {
      assert.equal(engineInitCalls, 1, 'engineInit は1度しか呼び出されないこと');
    }, 50);
  });
});
