# Classic Tilt Maze - システム・ゲーム仕様書

## 1. システム概要
* **システム名:** Classic Tilt Maze（木製ボール転がし迷路）
* **プラットフォーム:** Webブラウザ（iOS Safari / Android Chrome / PCデスクトップ）
* **稼働URL:** `https://yuutasv-maker.github.io/games/games/tilt-maze/`
* **基盤エンジン:** [LittleJS 2D Engine](file:///Users/yuuta/Antigravity/games/vendor/LittleJS-AI) (Canvas2D) + 自前物理衝突解決 + ZzFX（プロシージャル音源）

---

## 2. アーキテクチャ & モジュール構成

```text
docs/games/tilt-maze/
├── index.html        # View: DOM構造、HUDオーバーレイ、各種スクリプト読み込み
├── style.css         # View: レスポンシブレイアウト、木目調モーダル、チルトインジケーター
├── littlejs.min.js   # Framework: ゲームループ、レンダラー、剛体基盤
├── stages.js         # Model: ステージ迷路データ定義 (18x18 グリッド、Node/Web両対応)
├── physics.js        # Model: 幾何学的円-AABBクランプ衝突判定・押し出し・穴引力演算
└── game.js           # Controller/Presenter: ゲームライフサイクル、センサー入力、演出
```

---

## 3. 操作仕様 & 入力系

| 入力デバイス | 取得API / イベント | 挙動仕様 |
|---|---|---|
| **スマートフォン** | `window.deviceorientation` | 端末初期保持角（前後約40度）を基準ゼロ点として自動キャリブレーション。<br>`gamma`（左右傾き ±30度）→ X軸加速度<br>`beta`（前後傾き ±30度）→ Y軸加速度 |
| **PC (キーボード)** | LittleJS `keyDirection()` | 矢印キー（↑↓←→）および WASD キーによる8方向チルト入力 |
| **PC (マウス/タッチ)** | `mouseIsDown` / `mousePos` | 盤面ドラッグベクトル（開始点からの変位）による直感チルト入力 |

* **チルト平滑化:** `tiltVector = lerp(input, 0.2)` による慣性ダンピング。
* **iOS 13+ 対応:** 開始ボタン押下時に `DeviceOrientationEvent.requestPermission()` を発火。

---

## 4. 物理・衝突判定モデル

| パラメータ | 設定値 | 設計意図 |
|---|---|---|
| **セルサイズ (`CELL_SIZE`)** | `1.0` ユニット | 迷路グリッドの基準単位 |
| **盤面セル数 (`MAZE_GRID_SIZE`)** | `18 x 18` | 外周壁1セル + 内部16x16プレイスペース |
| **ボール直径 / 半径** | 直径 `0.7` / 半径 `0.35` | 幅1セル（1.0）の狭路でも `0.15` マージンで通過可能 |
| **最高速度 (`maxSpeed`)** | `0.35` ユニット/フレーム | 壁の厚み（1.0）に対する離散サンプリングのトンネリング完全防止 |
| **反発係数 (`restitution`)** | `0.35` | 木製ボードと鉄球の鈍い衝突反発 |
| **転がり摩擦 (`damping`)** | `0.985` | チルトニュートラル時の自然な減速・停止 |

* **円-AABBクランプ衝突解決 (`physics.js`):**
  ボール中心から近傍3x3セルの壁AABBへの最短距離を計算。
  めり込み量 `penetration = radius - dist` を法線方向へ即時押し戻し、法線速度反転（`-(1 + restitution) * dot * n`）および接線摩擦（`0.96`）を適用。

---

## 5. ギミック・判定仕様

### 5.1 落とし穴 (Hole)
* **吸い込み引力:** 中心距離 `< 0.65` で穴中心方向への引力ベクトルを加算（`pull = (holePos - ballPos) * 0.03`）。
* **落下判定:** 中心距離 `< 0.32` で落下判定成立。ボール縮小アニメーション後、スタート地点にリスポーン（落下カウント+1）。

### 5.2 ゴール (Goal)
* **ゴール判定:** 中心距離 `< 0.5` でゴール成立。
* **クリア演出:** ゴールドパーティクル放出、クリア効果音再生、900ms後にクリアモーダル（所要時間・ミス回数）表示。

---

## 6. ステージ設計仕様

グリッドデータは 18×18 の文字列配列で定義：
* `0`: 通路
* `1`: 木製の壁（静的剛体）
* `2`: 落とし穴
* `S`: スタート位置（各ステージ1箇所）
* `G`: ゴール位置（各ステージ1箇所）

### ステージ構成
1. **Stage 1: Beginner Path (初級)**
   * 幅2セルのゆったりとしたS字ワインディング。落とし穴を各段の片側に配置し、チルト加減速の基礎を学習。
2. **Stage 2: The Pit Chamber (中級)**
   * 分岐路、中央の連続落とし穴トラップ、幅1セルの直線通過を要求。
3. **Stage 3: Master Labyrinth (上級)**
   * 細いS字回廊、穴の密集ゾーン、微細なチルトバランスを要求する難関ステージ。

---

## 7. テスト仕様 (TDD)

テスト実行コマンド: `npm test`（Node.js 標準テストランナー `node:test` + `node:assert/strict`）

1. **迷路到達性テスト ([tests/maze-solvability.test.js](file:///Users/yuuta/Antigravity/games/tests/maze-solvability.test.js)):**
   * BFS（幅優先探索）アルゴリズムにより、全ステージでスタートからゴールまで落とし穴を踏まない有効経路が存在することを保証。
   * 外周壁の閉塞性、S/Gの唯一性を検証。
2. **物理衝突テスト ([tests/tilt-maze-physics.test.js](file:///Users/yuuta/Antigravity/games/tests/tilt-maze-physics.test.js)):**
   * 壁抜け防止（AABBめり込み復元）
   * 反発係数によるバウンド
   * コーナー斜め突入時のブロック
   * トンネリング限界速度時の貫通防止
   * 落とし穴の引力・落下境界値判定
