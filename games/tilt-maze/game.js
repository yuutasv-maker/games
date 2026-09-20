// =============================================================================
// Classic Tilt Maze (木製ボール転がし迷路)
// Built with LittleJS 2D Game Engine & ZzFX
// =============================================================================

'use strict';

// -----------------------------------------------------------------------------
// ゲーム状態・定数定義
// -----------------------------------------------------------------------------
const MAZE_GRID_SIZE = 18; // 迷路のセル数 (18x18)
const CELL_SIZE = 1.0;     // 1セルのワールド単位サイズ
const BOARD_SIZE = MAZE_GRID_SIZE * CELL_SIZE;

let currentStage = 0;
let totalFalls = 0;
let gameStartTime = 0; // 全ステージ通算の開始時刻
let stageStartTime = 0;
let isPlaying = false;
let isStageClearing = false;

// 傾きベクトル (-1.0 ～ 1.0)
let rawTilt = vec2(0, 0);
let baseBeta = 40; // スマホ通常把持時の基準前後傾斜角度 (約40度)
let hasCalibrated = false;

// ドラッグチルト用 (PCマウス/タッチ操作)
let isDragging = false;
let dragStartPos = vec2(0, 0);

// エンティティ参照
let activeBall = null;
let activeHoles = [];
let activeWalls = [];
let activeGoal = null;
let currentStageGrid = null;

// -----------------------------------------------------------------------------
// ZzFX プロシージャル効果音
// -----------------------------------------------------------------------------
function playSoundWoodHit(intensity = 1.0) {
  // 鉄球が木枠に当たるカチッという音
  const volume = clamp(intensity, 0.2, 1.2);
  zzfx(...[volume, .02, 350, 0, .02, .01, 1, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, .7, .02]);
}

function playSoundFall() {
  // 穴に吸い込まれて落ちる音 (ヒュルルル...ポコッ)
  zzfx(...[1.0, .1, 280, .05, .25, .4, 2, 0, -8, 0, 0, 0, 0, 0, 0, 0, 0, .6, .05]);
}

function playSoundClear() {
  // ステージクリアのファンファーレ
  zzfx(...[1.2, .05, 523, .05, .3, 0, 0, 1.5, 0, 0, 200, .08, 0, 0, 0, 0, 0, .8, .05]);
}

// -----------------------------------------------------------------------------
// ステージ迷路データは stages.js で定義（ブラウザ・テスト両対応）
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// クラス定義: 木製の壁 (Wall)
// -----------------------------------------------------------------------------
class Wall extends EngineObject {
  constructor(pos, size) {
    super(pos, size);
    this.isSolid = true;
    this.mass = 0; // 静的剛体
    this.setCollision(true, true); // LittleJS の剛体衝突リストに明示的に登録
    this.color = new Color(0.42, 0.26, 0.14); // オーク・ウォールナット調
  }

  render() {
    // 木製ブロックの立体陰影描画
    const p = this.pos;
    const s = this.size;
    
    // 基本の木製ボディ
    drawRect(p, s, this.color);
    
    // 上辺・左辺のハイライト (光が当たっている立体エッジ)
    const highlightColor = new Color(0.58, 0.38, 0.22);
    drawRect(vec2(p.x, p.y + s.y * 0.42), vec2(s.x, s.y * 0.16), highlightColor);
    drawRect(vec2(p.x - s.x * 0.42, p.y), vec2(s.x * 0.16, s.y), highlightColor);
    
    // 下辺・右辺のシャドウ (落ち影)
    const shadowColor = new Color(0.24, 0.14, 0.07);
    drawRect(vec2(p.x, p.y - s.y * 0.42), vec2(s.x, s.y * 0.16), shadowColor);
    drawRect(vec2(p.x + s.x * 0.42, p.y), vec2(s.x * 0.16, s.y), shadowColor);
  }
}

// -----------------------------------------------------------------------------
// クラス定義: 落とし穴 (Hole)
// -----------------------------------------------------------------------------
class Hole extends EngineObject {
  constructor(pos) {
    super(pos, vec2(0.95, 0.95));
    this.holeRadius = 0.45;
  }

  render() {
    const p = this.pos;
    // 穴の外周リム (掘り込みの立体枠)
    drawCircle(p, 0.95, new Color(0.25, 0.14, 0.07));
    // 穴の深い黒
    drawCircle(p, 0.82, new Color(0.05, 0.03, 0.02));
    // 内側奥のシャドウ
    drawCircle(vec2(p.x, p.y + 0.05), 0.72, new Color(0.01, 0.01, 0.01));
  }
}

// -----------------------------------------------------------------------------
// クラス定義: ゴール (Goal)
// -----------------------------------------------------------------------------
class Goal extends EngineObject {
  constructor(pos) {
    super(pos, vec2(1.1, 1.1));
    this.pulse = 0;
  }

  update() {
    this.pulse += 0.05;
  }

  render() {
    const p = this.pos;
    // グリーンフェルト調のゴール穴
    drawCircle(p, 1.05, new Color(0.18, 0.42, 0.18));
    drawCircle(p, 0.85, new Color(0.12, 0.58, 0.22));

    // 中央に光るゴールリング
    const glowScale = 0.5 + Math.sin(this.pulse) * 0.08;
    drawCircle(p, glowScale, new Color(1.0, 0.85, 0.2, 0.9));
  }
}

// -----------------------------------------------------------------------------
// クラス定義: 鉄球 (Ball)
// -----------------------------------------------------------------------------
class Ball extends EngineObject {
  constructor(pos) {
    // 直径 0.7 ユニットの球体
    super(pos, vec2(0.7, 0.7));
    this.radius = 0.35; // 半径 (物理衝突解決用)
    this.setCollision(true, true);
    this.restitution = 0.35; // 適度な木製反発
    this.damping = 0.985;    // 転がり摩擦
    this.falling = false;
    this.fallScale = 1.0;
  }

  update() {
    // クリア演出中またはプレイ中以外はボール更新を停止（演出中の穴落下暴走防止: C-3）
    if (!isPlaying || isStageClearing) return;

    if (this.falling) {
      // 穴に落ちるアニメーション (縮小しながら中心へ)
      this.fallScale -= 0.05;
      this.velocity = this.velocity.scale(0.85);
      if (this.fallScale <= 0.1) {
        respawnBall();
      }
      return;
    }

    // 傾きによる加速度 (重力) の適用
    const accel = tiltVector.scale(0.045);
    this.velocity = this.velocity.add(accel);

    // 転がり摩擦 (damping) の適用（チルト静止時の自然な減速・停止: C-2）
    this.velocity = this.velocity.scale(this.damping);

    // 最大速度リミット (壁抜け防止)
    const maxSpeed = 0.35;
    if (this.velocity.length() > maxSpeed) {
      this.velocity = this.velocity.normalize().scale(maxSpeed);
    }

    // 落とし穴との距離判定 (physics.js の checkHolePull を使用して共通化: I-5)
    for (const hole of activeHoles) {
      const res = checkHolePull(this, hole.pos, 0.65, 0.32);
      if (res.falling) {
        this.falling = true;
        playSoundFall();
        totalFalls++;
        updateHeaderUI();
        break;
      }
    }

    // ゴール判定
    if (activeGoal && !isStageClearing) {
      const dist = this.pos.distance(activeGoal.pos);
      if (dist < 0.5) {
        triggerStageClear();
      }
    }
  }

  collideWithObject(other) {
    // LittleJS 組み込みの AABB 衝突解決をバイパス（return false）
    // 物理衝突解決および衝突効果音の再生は gameUpdatePost 内の resolveWallCollisions に一本化（C-1, C-4）
    return false;
  }

  render() {
    const p = this.pos;
    const currentDiameter = 0.7 * this.fallScale;

    // 鉄球の落ち影 (右下にずらす)
    if (!this.falling) {
      drawCircle(vec2(p.x + 0.08, p.y - 0.08), currentDiameter, new Color(0.12, 0.07, 0.03, 0.45));
    }

    // メタリックシルバーのベース
    drawCircle(p, currentDiameter, new Color(0.78, 0.81, 0.85));

    // メタルの光沢ハイライト (左上に光の反射)
    const highlightPos = vec2(p.x - 0.08 * this.fallScale, p.y + 0.08 * this.fallScale);
    drawCircle(highlightPos, currentDiameter * 0.45, new Color(0.95, 0.97, 1.0, 0.9));
  }
}

// -----------------------------------------------------------------------------
// ステージ構築・管理
// -----------------------------------------------------------------------------
let startPosition = vec2(0, 0);

function loadStage(stageIndex) {
  currentStage = stageIndex;
  isStageClearing = false;

  // 既存オブジェクトの破棄
  if (activeBall) activeBall.destroy();
  activeWalls.forEach(w => w.destroy());
  activeHoles.forEach(h => h.destroy());
  if (activeGoal) activeGoal.destroy();

  activeWalls = [];
  activeHoles = [];
  activeBall = null;
  activeGoal = null;

  const stageData = STAGES[stageIndex];
  const grid = stageData.grid;
  currentStageGrid = grid;
  const half = MAZE_GRID_SIZE / 2;

  for (let r = 0; r < MAZE_GRID_SIZE; r++) {
    for (let c = 0; c < MAZE_GRID_SIZE; c++) {
      const char = grid[r][c];
      // ワールド座標 (中心 0,0 / Y軸上向き)
      const wx = (c - half + 0.5) * CELL_SIZE;
      const wy = (half - r - 0.5) * CELL_SIZE;
      const pos = vec2(wx, wy);

      if (char === '1') {
        activeWalls.push(new Wall(pos, vec2(CELL_SIZE, CELL_SIZE)));
      } else if (char === '2') {
        activeHoles.push(new Hole(pos));
      } else if (char === 'S') {
        startPosition = pos;
      } else if (char === 'G') {
        activeGoal = new Goal(pos);
      }
    }
  }

  // 鉄球のスポーン
  activeBall = new Ball(startPosition);

  updateHeaderUI();
}

function respawnBall() {
  if (activeBall) {
    activeBall.destroy();
  }
  activeBall = new Ball(startPosition);
}

function triggerStageClear() {
  isStageClearing = true;
  playSoundClear();

  // 祝福のゴールドパーティクル発生 (emitTime = 0.8秒で自然停止させメモリリークを防止: I-1)
  new ParticleEmitter(
    activeGoal.pos, 0, 0, 0.8, 80, PI, // pos, angle, emitSize, emitTime, emitRate, emitCone
    tile(0), new Color(1, 0.8, 0.2), new Color(1, 0.5, 0.1), // tile, startColor, endColor
    new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), // pad
    1.2, 0.1, 0.2, 0.05, 0.01 // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
  );

  setTimeout(() => {
    showClearDialog();
  }, 900);
}

function showClearDialog() {
  const overlay = document.getElementById('clear-overlay');
  const title = document.getElementById('clear-title');
  const stats = document.getElementById('clear-stats');
  const nextBtn = document.getElementById('next-btn');

  if (currentStage + 1 < STAGES.length) {
    const elapsed = Math.floor((Date.now() - stageStartTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    title.textContent = `Stage ${currentStage + 1} Cleared!`;
    stats.innerHTML = `クリアタイム: ${m}:${s}<br>落下ミス: ${totalFalls}回`;
    nextBtn.textContent = "次のステージへ";
    nextBtn.onclick = () => {
      overlay.style.display = 'none';
      stageStartTime = Date.now();
      loadStage(currentStage + 1);
    };
  } else {
    // 全ステージクリア時は通算開始時刻 (gameStartTime) からの総合タイムを算出 (I-3)
    const totalElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const m = String(Math.floor(totalElapsed / 60)).padStart(2, '0');
    const s = String(totalElapsed % 60).padStart(2, '0');
    title.textContent = `All Stages Completed! 🎉`;
    stats.innerHTML = `全ラビリンス踏破！<br>トータルタイム: ${m}:${s}<br>総落下ミス: ${totalFalls}回`;
    nextBtn.textContent = "最初からリトライ";
    nextBtn.onclick = () => {
      overlay.style.display = 'none';
      totalFalls = 0;
      gameStartTime = Date.now();
      stageStartTime = Date.now();
      loadStage(0);
    };
  }

  overlay.style.display = 'flex';
}

function updateHeaderUI() {
  document.getElementById('stage-display').textContent = `${currentStage + 1}/${STAGES.length}`;
  document.getElementById('falls-display').textContent = totalFalls;
}

// -----------------------------------------------------------------------------
// センサー & 入力制御 (ハイブリッド)
// -----------------------------------------------------------------------------
let tiltVector = vec2(0, 0);

function updateTiltControls() {
  // 1. キーボード入力 (矢印キー / WASD)
  const keys = keyDirection();
  let input = vec2(0, 0);

  if (keys.length() > 0) {
    input = keys.normalize();
  }

  // 2. マウス/タッチドラッグによるチルト (PCシミュレーション)
  if (mouseIsDown(0) && !isDragging) {
    isDragging = true;
    dragStartPos = mousePos;
  } else if (!mouseIsDown(0)) {
    isDragging = false;
  }

  if (isDragging) {
    const delta = mousePos.subtract(dragStartPos);
    input = delta.clampLength(1.0);
  } else if (rawTilt.length() > 0.05) {
    // 3. スマホ傾きセンサー (rawTilt) の合成 (ドラッグ中以外に適用して競合を防止: I-4)
    input = rawTilt;
  }

  // スムージング適用 (滑らかな慣性)
  tiltVector = tiltVector.lerp(input, 0.2);

  // 画面右下のチルトインジケーター更新
  const dot = document.getElementById('tilt-dot');
  if (dot) {
    const px = tiltVector.x * 18;
    const py = -tiltVector.y * 18;
    dot.style.transform = `translate(${px}px, ${py}px)`;
  }
}

// スマホの DeviceOrientation イベント登録
function initOrientationSensor() {
  window.addEventListener('deviceorientation', (e) => {
    if (e.beta === null || e.gamma === null) return;

    if (!hasCalibrated) {
      baseBeta = e.beta; // 初回の持ち手角度をゼロ点としてキャリブレーション
      hasCalibrated = true;
    }

    // gamma: 左右 (-90 ～ 90度) -> X軸
    // beta: 前後 (-180 ～ 180度) -> Y軸 (上が正)
    const normX = clamp((e.gamma) / 30, -1, 1);
    const normY = clamp((baseBeta - e.beta) / 30, -1, 1);

    rawTilt = vec2(normX, normY);
  }, true);
}

// -----------------------------------------------------------------------------
// LittleJS 必須コールバック実装
// -----------------------------------------------------------------------------
function gameInit() {
  // カメラ位置を中心に固定
  cameraPos = vec2(0, 0);
  setGravity(vec2(0, 0)); // 重力は傾きに応じてボールに直接適用するためワールド重力はゼロ
  loadStage(0);
}

function gameUpdate() {
  updateTiltControls();

  // タイマー表示更新
  if (isPlaying && !isStageClearing) {
    const elapsed = Math.floor((Date.now() - stageStartTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('time-display').textContent = `${m}:${s}`;
  }
}

function gameUpdatePost() {
  // ボールの壁抜け防止 (物理更新直後の円-AABB衝突解決・めり込み即時復元)
  if (activeBall && !activeBall.falling && currentStageGrid) {
    const collided = resolveWallCollisions(activeBall, currentStageGrid, MAZE_GRID_SIZE, CELL_SIZE);
    if (collided && activeBall.velocity.length() > 0.04) {
      playSoundWoodHit(activeBall.velocity.length() * 3);
    }
  }

  // 画面サイズに応じて盤面全体が収まるようカメラスケールを自動調整
  const targetViewSize = BOARD_SIZE + 2.0; // 余白マージン
  const scale = Math.min(mainCanvasSize.x / targetViewSize, mainCanvasSize.y / targetViewSize);
  setCameraScale(scale);
}

function gameRender() {
  // 木製盤面の床 (ウォールナット木目調)
  drawRect(vec2(0, 0), vec2(BOARD_SIZE, BOARD_SIZE), new Color(0.83, 0.64, 0.45));

  // 木目の罫線グリッド (落ち着いた木製スリット模様)
  const gridColor = new Color(0.75, 0.56, 0.38, 0.4);
  for (let i = -MAZE_GRID_SIZE / 2; i <= MAZE_GRID_SIZE / 2; i++) {
    drawRect(vec2(i * CELL_SIZE, 0), vec2(0.04, BOARD_SIZE), gridColor);
    drawRect(vec2(0, i * CELL_SIZE), vec2(BOARD_SIZE, 0.04), gridColor);
  }
}

function gameRenderPost() {
  // 必要に応じたHUD描画
}

// -----------------------------------------------------------------------------
// ゲーム起動・iOS パーミッションハンドラ
// -----------------------------------------------------------------------------
let isStartingGame = false;
document.getElementById('start-btn').addEventListener('click', async (e) => {
  // 二重タップによる engineInit の重複起動防止 (I-2)
  if (isStartingGame) return;
  isStartingGame = true;
  const startBtn = e.currentTarget;
  if (startBtn) startBtn.disabled = true;

  // iOS 13+ の DeviceOrientation 許可要求
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        initOrientationSensor();
      }
    } catch (err) {
      console.warn('DeviceOrientation permission rejected:', err);
    }
  } else {
    // Android / 通常ブラウザ
    initOrientationSensor();
  }

  // スタートオーバーレイを閉じてゲーム開始
  document.getElementById('start-overlay').style.display = 'none';
  isPlaying = true;
  gameStartTime = Date.now(); // 全ステージ通算タイマー開始 (I-3)
  stageStartTime = Date.now();

  // LittleJS エンジンの起動
  engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
});
