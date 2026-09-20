// =============================================================================
// Unit Tests: Tilt Maze Physics & Collision
// Using Node.js built-in test runner (node:test, node:assert/strict)
// =============================================================================

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createVec2,
  gridToWorld,
  worldToGrid,
  resolveWallCollisions,
  checkHolePull
} = require('../docs/games/tilt-maze/physics.js');

describe('Tilt Maze Physics & Collision Resolution Tests', () => {
  // テスト用シンプルな迷路: 外周が壁(1)、中央通路(0)、一部に穴(2)
  // [1, 1, 1, 1, 1]
  // [1, 0, 0, 0, 1]
  // [1, 0, 1, 0, 1]  (中央に壁ブロック)
  // [1, 0, 0, 2, 1]  (右下に穴)
  // [1, 1, 1, 1, 1]
  const testGrid = [
    "11111",
    "10001",
    "10101",
    "10021",
    "11111"
  ];
  const gridSize = 5;
  const cellSize = 1.0;

  it('1. 壁に向かって進んだボールが壁の中にめり込まず、外側に押し戻されること (壁抜け防止)', () => {
    // 中央の壁 (r=2, c=2) の左隣 (r=2, c=1) から右へ進む
    // 壁の中心ワールド座標
    const wallWorld = gridToWorld(2, 2, gridSize, cellSize);
    const wallLeft = wallWorld.x - cellSize / 2; // 壁の左端

    const ballRadius = 0.35;
    // ボールが壁の左端に食い込んだ位置
    const ball = {
      pos: createVec2(wallLeft + 0.1, wallWorld.y), // めり込んでいる
      velocity: createVec2(0.2, 0),
      radius: ballRadius,
      restitution: 0.4
    };

    const collided = resolveWallCollisions(ball, testGrid, gridSize, cellSize);

    assert.equal(collided, true, '壁との衝突が検出されること');
    // ボールの右端 (pos.x + radius) は壁の左端 (wallLeft) 以下でなければならない
    assert.ok(
      ball.pos.x + ball.radius <= wallLeft + 0.001,
      `ボールが壁をすり抜けています！ ballRight: ${ball.pos.x + ball.radius}, wallLeft: ${wallLeft}`
    );
  });

  it('2. 壁に衝突したとき、法線方向の速度が反転（バウンド）すること', () => {
    const wallWorld = gridToWorld(2, 2, gridSize, cellSize);
    const wallLeft = wallWorld.x - cellSize / 2;

    const ball = {
      pos: createVec2(wallLeft + 0.05, wallWorld.y),
      velocity: createVec2(0.2, 0), // 右向きの初速
      radius: 0.35,
      restitution: 0.4
    };

    resolveWallCollisions(ball, testGrid, gridSize, cellSize);

    assert.ok(
      ball.velocity.x < 0,
      `速度が反転していません！ velocity.x: ${ball.velocity.x}`
    );
  });

  it('3. 壁の角（コーナー）に斜めから進入してもすり抜けないこと', () => {
    const wallWorld = gridToWorld(2, 2, gridSize, cellSize);
    const wallTopLeft = createVec2(wallWorld.x - cellSize / 2, wallWorld.y + cellSize / 2);

    // 左上から角に向かって進入
    const ball = {
      pos: createVec2(wallTopLeft.x + 0.05, wallTopLeft.y - 0.05),
      velocity: createVec2(0.15, -0.15),
      radius: 0.35,
      restitution: 0.4
    };

    const collided = resolveWallCollisions(ball, testGrid, gridSize, cellSize);
    assert.equal(collided, true, '角との衝突が検出されること');
    assert.ok(
      ball.pos.x < wallWorld.x || ball.pos.y > wallWorld.y,
      '角の内部にめり込んでいます'
    );
  });

  it('4. 高速移動（トンネリング限界速度）でも外周壁を貫通しないこと', () => {
    // 左端の外周壁に向かって超高速で移動
    const leftWallWorld = gridToWorld(1, 0, gridSize, cellSize);
    const leftWallRight = leftWallWorld.x + cellSize / 2;

    const ball = {
      pos: createVec2(leftWallRight - 0.2, leftWallWorld.y), // 深く突き抜けた状態
      velocity: createVec2(-0.5, 0),
      radius: 0.35,
      restitution: 0.4
    };

    const collided = resolveWallCollisions(ball, testGrid, gridSize, cellSize);
    assert.equal(collided, true, '高速衝突が検出されること');
    assert.ok(
      ball.pos.x - ball.radius >= leftWallRight - 0.001,
      `外周壁を貫通してしまいました！ ballLeft: ${ball.pos.x - ball.radius}, leftWallRight: ${leftWallRight}`
    );
  });

  it('5. 落とし穴への吸い込み引力と落下判定が正しく機能すること', () => {
    const holeWorld = gridToWorld(3, 3, gridSize, cellSize);

    const ball = {
      pos: createVec2(holeWorld.x + 0.5, holeWorld.y),
      velocity: createVec2(0, 0),
      radius: 0.35
    };

    // 引力圏内
    const pullResult = checkHolePull(ball, holeWorld);
    assert.equal(pullResult.pulling, true, '引力が働くこと');
    assert.ok(ball.velocity.x < 0, '穴の中心に向かって速度が発生すること');

    // 穴の中心付近 (落下)
    ball.pos = createVec2(holeWorld.x + 0.1, holeWorld.y);
    const fallResult = checkHolePull(ball, holeWorld);
    assert.equal(fallResult.falling, true, '穴の中心で落下判定になること');
  });
});
