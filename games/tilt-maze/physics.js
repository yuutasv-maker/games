// =============================================================================
// Tilt Maze Physics Engine (Robust Circle-AABB Grid Collision & Dynamics)
// =============================================================================

/**
 * 2Dベクトルのヘルパー
 */
function createVec2(x, y) {
  return { x, y };
}

/**
 * 迷路グリッド上の (row, col) からワールド座標 (中心座標) を取得
 */
function gridToWorld(r, c, gridSize = 18, cellSize = 1.0) {
  const half = gridSize / 2;
  const wx = (c - half + 0.5) * cellSize;
  const wy = (half - r - 0.5) * cellSize;
  return createVec2(wx, wy);
}

/**
 * ワールド座標から最も近いグリッド (row, col) を取得
 */
function worldToGrid(wx, wy, gridSize = 18, cellSize = 1.0) {
  const half = gridSize / 2;
  const c = Math.floor(wx / cellSize + half);
  const r = Math.floor(half - wy / cellSize);
  return { r, c };
}

/**
 * ボールと壁グリッドの精密な円-AABB衝突判定と押し戻し・反発処理
 * 3x3 近傍タイルの幾何学的クランプ距離を計算し、めり込み深さ分を法線方向に即座に押し戻す。
 * 
 * @param {Object} ball - { pos: {x, y}, velocity: {x, y}, radius: number, restitution?: number }
 * @param {Array<string>} grid - 迷路グリッド
 * @param {number} gridSize - 迷路のセル数
 * @param {number} cellSize - 1セルのサイズ
 * @returns {boolean} 衝突が発生したかどうか
 */
function resolveWallCollisions(ball, grid, gridSize = 18, cellSize = 1.0) {
  const radius = ball.radius;
  const restitution = ball.restitution !== undefined ? ball.restitution : 0.4;
  let hasCollided = false;

  // 複数反復解決 (角や交差点での多重衝突を確実に解消)
  const iterations = 2;
  for (let iter = 0; iter < iterations; iter++) {
    const center = worldToGrid(ball.pos.x, ball.pos.y, gridSize, cellSize);

    // ボール周辺の 3x3 セルを検査
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = center.r + dr;
        const c = center.c + dc;

        // グリッド範囲外チェック
        const isWall = (r < 0 || r >= gridSize || c < 0 || c >= gridSize) || (grid[r] && grid[r][c] === '1');
        if (!isWall) continue;

        // 壁セルの AABB 範囲
        const wallWorld = gridToWorld(r, c, gridSize, cellSize);
        const halfSize = cellSize / 2;
        const minX = wallWorld.x - halfSize;
        const maxX = wallWorld.x + halfSize;
        const minY = wallWorld.y - halfSize;
        const maxY = wallWorld.y + halfSize;

        // AABB上でボール中心に最も近い点をクランプして取得
        const closestX = Math.max(minX, Math.min(ball.pos.x, maxX));
        const closestY = Math.max(minY, Math.min(ball.pos.y, maxY));

        // 最近傍点とボール中心の距離
        let diffX = ball.pos.x - closestX;
        let diffY = ball.pos.y - closestY;
        const dist = Math.hypot(diffX, diffY);

        if (dist < radius) {
          hasCollided = true;
          let nx = 0;
          let ny = 0;
          let penetration = radius - dist;

          if (dist > 0.0001) {
            // 通常の接触: 最近傍点から中心へのベクトルを法線とする
            nx = diffX / dist;
            ny = diffY / dist;
          } else {
            // ボール中心が壁内部に深くめり込んだ場合のフェイルセーフ: 最も浅い面へ押し戻す
            const dLeft = Math.abs(ball.pos.x - minX);
            const dRight = Math.abs(maxX - ball.pos.x);
            const dBottom = Math.abs(ball.pos.y - minY);
            const dTop = Math.abs(maxY - ball.pos.y);
            const minDepth = Math.min(dLeft, dRight, dBottom, dTop);

            if (minDepth === dLeft) { nx = -1; ny = 0; penetration = radius + dLeft; }
            else if (minDepth === dRight) { nx = 1; ny = 0; penetration = radius + dRight; }
            else if (minDepth === dBottom) { nx = 0; ny = -1; penetration = radius + dBottom; }
            else { nx = 0; ny = 1; penetration = radius + dTop; }
          }

          // 1. 位置の押し戻し (壁の外側へ微小イプシロンとともに配置)
          const epsilon = 0.001;
          ball.pos.x += nx * (penetration + epsilon);
          ball.pos.y += ny * (penetration + epsilon);

          // 2. 速度の反発 (法線方向に向かう速度成分を反転)
          const dot = ball.velocity.x * nx + ball.velocity.y * ny;
          if (dot < 0) {
            // 壁に向かって進んでいる場合のみ反発を適用
            ball.velocity.x -= (1 + restitution) * dot * nx;
            ball.velocity.y -= (1 + restitution) * dot * ny;

            // わずかな接線摩擦を適用
            const friction = 0.96;
            const tx = -ny;
            const ty = nx;
            const tangentDot = ball.velocity.x * tx + ball.velocity.y * ty;
            ball.velocity.x = (ball.velocity.x - tangentDot * tx) + tangentDot * tx * friction;
            ball.velocity.y = (ball.velocity.y - tangentDot * ty) + tangentDot * ty * friction;
          }
        }
      }
    }
  }

  return hasCollided;
}

/**
 * 穴への吸い込み判定
 */
function checkHolePull(ball, holePos, pullRadius = 0.65, fallRadius = 0.32) {
  const dx = holePos.x - ball.pos.x;
  const dy = holePos.y - ball.pos.y;
  const dist = Math.hypot(dx, dy);

  if (dist < pullRadius) {
    // 穴の中心への引力
    const factor = 0.03;
    ball.velocity.x += dx * factor;
    ball.velocity.y += dy * factor;

    if (dist < fallRadius) {
      return { falling: true };
    }
    return { pulling: true, dist };
  }
  return { pulling: false };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createVec2,
    gridToWorld,
    worldToGrid,
    resolveWallCollisions,
    checkHolePull
  };
}
