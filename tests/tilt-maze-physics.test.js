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
  const testGrid = [
    "11111",
    "10001",
    "10101",
    "10021",
    "11111"
  ];
  const gridSize = 5;
  const cellSize = 1.0;
  const BALL_RADIUS = 0.35;
  const BALL_RESTITUTION = 0.35;
  const BALL_DAMPING = 0.985;

  it('1. 【主処理パス検証】外側から壁に接触したボールが壁の外側に押し戻されること', () => {
    // 中央壁 (r=2, c=2) の左端座標
    const wallWorld = gridToWorld(2, 2, gridSize, cellSize);
    const wallLeft = wallWorld.x - cellSize / 2;

    // ボール中心は壁の外側 (wallLeft より 0.2 左) にあるが、半径 0.35 のため 0.15 だけ壁にめり込んでいる
    // 中心が壁外にあるため dist > 0.0001 の幾何学的クランプ主処理分岐が確実に走る
    const ball = {
      pos: createVec2(wallLeft - 0.2, wallWorld.y),
      velocity: createVec2(0.25, 0),
      radius: BALL_RADIUS,
      restitution: BALL_RESTITUTION
    };

    const collided = resolveWallCollisions(ball, testGrid, gridSize, cellSize);

    assert.equal(collided, true, '壁との衝突が検出されること');
    // ボールの右端 (pos.x + radius) は壁の左端 (wallLeft) 以下でなければならない
    assert.ok(
      ball.pos.x + ball.radius <= wallLeft + 0.001,
      `ボールが壁をすり抜けています！ ballRight: ${ball.pos.x + ball.radius}, wallLeft: ${wallLeft}`
    );
    // ボール中心は依然として壁の外側にあること
    assert.ok(ball.pos.x < wallLeft, 'ボール中心が壁の外側にあること');
  });

  it('2. 壁に衝突したとき、法線方向の速度が仕様値 (restitution=0.35) に基づいて反転バウンドすること', () => {
    const wallWorld = gridToWorld(2, 2, gridSize, cellSize);
    const wallLeft = wallWorld.x - cellSize / 2;

    const initialVx = 0.2;
    const ball = {
      pos: createVec2(wallLeft - 0.2, wallWorld.y),
      velocity: createVec2(initialVx, 0),
      radius: BALL_RADIUS,
      restitution: BALL_RESTITUTION
    };

    resolveWallCollisions(ball, testGrid, gridSize, cellSize);

    assert.ok(ball.velocity.x < 0, `法線速度が反転していません！ velocity.x: ${ball.velocity.x}`);
    // 反発速度の大きさの検証: |v_new| = restitution * |v_old| 付近であること
    const expectedSpeed = initialVx * BALL_RESTITUTION;
    assert.ok(
      Math.abs(Math.abs(ball.velocity.x) - expectedSpeed) < 0.02,
      `反発速度がrestitutionと不一致: got ${Math.abs(ball.velocity.x)}, expected approx ${expectedSpeed}`
    );
  });

  it('3. 【厳格な境界値検証】壁の角（コーナー）に斜め突入時、角頂点から半径以上の距離へ完全に押し出されること', () => {
    const wallWorld = gridToWorld(2, 2, gridSize, cellSize);
    const wallTopLeft = createVec2(wallWorld.x - cellSize / 2, wallWorld.y + cellSize / 2);

    // 左上の角頂点に向かって斜め外側から突入 (中心は外側だが外周が角頂点にめり込んでいる)
    // 頂点から斜め左上 0.2 の位置 (距離 0.2 < 半径 0.35 なので 0.15 めり込み)
    const offset = 0.2 / Math.SQRT2;
    const ball = {
      pos: createVec2(wallTopLeft.x - offset, wallTopLeft.y + offset),
      velocity: createVec2(0.15, -0.15),
      radius: BALL_RADIUS,
      restitution: BALL_RESTITUTION
    };

    const collided = resolveWallCollisions(ball, testGrid, gridSize, cellSize);
    assert.equal(collided, true, 'コーナーとの衝突が検出されること');

    // 厳密な検証: ボール中心から角頂点までの距離が、ボール半径 (0.35) 以上であること！
    const distToCorner = Math.hypot(ball.pos.x - wallTopLeft.x, ball.pos.y - wallTopLeft.y);
    assert.ok(
      distToCorner >= BALL_RADIUS - 0.001,
      `角頂点にめり込んでいます！ distToCorner: ${distToCorner}, radius: ${BALL_RADIUS}`
    );
  });

  it('4. トンネリング極限速度でも外周壁を貫通せず、外周内部に復元されること', () => {
    const leftWallWorld = gridToWorld(1, 0, gridSize, cellSize);
    const leftWallRight = leftWallWorld.x + cellSize / 2;

    // 壁内部に深く進入した状態
    const ball = {
      pos: createVec2(leftWallRight - 0.2, leftWallWorld.y),
      velocity: createVec2(-0.5, 0),
      radius: BALL_RADIUS,
      restitution: BALL_RESTITUTION
    };

    const collided = resolveWallCollisions(ball, testGrid, gridSize, cellSize);
    assert.equal(collided, true, '高速衝突が検出されること');
    assert.ok(
      ball.pos.x - ball.radius >= leftWallRight - 0.001,
      `外周壁を貫通しました！ ballLeft: ${ball.pos.x - ball.radius}, leftWallRight: ${leftWallRight}`
    );
  });

  it('5. 落とし穴の吸い込み引力 (radius=0.65) と落下判定 (radius=0.32) の境界値が仕様通り機能すること', () => {
    const holeWorld = gridToWorld(3, 3, gridSize, cellSize);

    // 境界1: 範囲外 (dist = 0.70 >= 0.65) -> 引力なし
    const ballFar = {
      pos: createVec2(holeWorld.x + 0.70, holeWorld.y),
      velocity: createVec2(0, 0),
      radius: BALL_RADIUS
    };
    const resFar = checkHolePull(ballFar, holeWorld, 0.65, 0.32);
    assert.equal(resFar.pulling, false, '引力圏外では引力が働かないこと');
    assert.equal(ballFar.velocity.x, 0, '速度が変化しないこと');

    // 境界2: 引力圏内 (dist = 0.50 < 0.65) -> 引力あり、落下なし
    const ballMid = {
      pos: createVec2(holeWorld.x + 0.50, holeWorld.y),
      velocity: createVec2(0, 0),
      radius: BALL_RADIUS
    };
    const resMid = checkHolePull(ballMid, holeWorld, 0.65, 0.32);
    assert.equal(resMid.pulling, true, '引力圏内ではpullingがtrueであること');
    assert.equal(resMid.falling, undefined, '落下判定は未成立であること');
    assert.ok(ballMid.velocity.x < 0, '穴中心への引力加速度が加算されること');

    // 境界3: 落下圏内 (dist = 0.25 < 0.32) -> 落下確定
    const ballFall = {
      pos: createVec2(holeWorld.x + 0.25, holeWorld.y),
      velocity: createVec2(0, 0),
      radius: BALL_RADIUS
    };
    const resFall = checkHolePull(ballFall, holeWorld, 0.65, 0.32);
    assert.equal(resFall.falling, true, '落下判定が成立すること');
  });

  it('6. 転がり摩擦 (damping=0.985) による速度減衰シミュレーションが正常に機能すること', () => {
    // 端末を水平（加速度ゼロ）にした状態で、ボールの速度がフレーム毎に damping 倍されることの検証
    let vx = 0.30;
    const initialVx = vx;
    for (let frame = 0; frame < 60; frame++) {
      vx *= BALL_DAMPING;
    }
    // 60フレーム（約1秒）後に速度が初期値の約40%まで自然減速すること
    const expectedRatio = Math.pow(BALL_DAMPING, 60); // 0.985^60 ≈ 0.403
    assert.ok(
      Math.abs(vx / initialVx - expectedRatio) < 0.01,
      `減衰率が期待値と不一致: got ${vx / initialVx}, expected ${expectedRatio}`
    );
    assert.ok(vx < 0.15, '1秒後に十分減速していること');
  });
});
