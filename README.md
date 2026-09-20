# Games Workspace

AIエージェント（Antigravity）とのペアプログラミングによるWeb/HTML5ゲーム開発・プロトタイピング環境です。

---

## ディレクトリ構成

```text
.
├── .agents/
│   └── skills/                         # Antigravity が自動認識するエージェントスキル群
│       ├── atlas-shape-art/            # LittleJS テクスチャアトラス・スプライト描画
│       ├── littlejs-api/               # LittleJS 完全APIリファレンス
│       ├── littlejs-conventions/       # LittleJS 設計規約・落とし穴対策
│       ├── new-littlejs-game/          # LittleJS 新規ゲーム雛形作成
│       ├── phaser-game-agent/          # Phaser ゲーム開発エージェントスキル
│       ├── mobile-testing-playwright/  # モバイル実機/エミュレータE2Eテスト
│       ├── zzfxm-audio/                # ZzFXM レトロBGM/SE生成・再生
│       ├── nipplejs-controls/          # NippleJS 仮想ジョイスティックUI
│       └── pixelforge-mcp/             # PixelForge ドット絵アセット生成MCP
├── vendor/                             # 上流追従用 Git サブモジュール群
│   ├── LittleJS-AI/                    # 軽量2D Webゲームエンジン & AIプロンプト
│   ├── phaser-game-agent/              # Phaser用AIエージェントツール
│   ├── workflow-template/              # mobile-testing-playwright 実装元
│   ├── ZzFXM/                          # JavaScript Chiptune音楽生成
│   ├── nipplejs/                       # タッチデバイス向けバーチャルスティック
│   ├── playwright-mcp/                 # Playwright MCPサーバー
│   ├── chrome-devtools-mcp/            # Chrome DevTools MCPサーバー
│   └── pixelforge-mcp/                 # PixelForge MCPサーバー
├── scripts/
│   └── update-submodules.sh            # サブモジュール一括更新スクリプト
├── mcp_config.json                     # MCPサーバー設定定義
└── package.json                        # ワークスペース管理用 npm スクリプト
```

---

## サブモジュールの更新方法

上流の最新コミットを取り込む際は、以下のいずれかをターミナルで実行してください。

```bash
# npm コマンド経由
npm run update:submodules

# または直接スクリプト実行
./scripts/update-submodules.sh
```

このスクリプトは以下を自動実行します：
1. `git submodule update --init --recursive`（未初期化モジュールのチェック）
2. `git submodule update --remote --merge`（`.gitmodules` で指定されたブランチからの最新コミット取得とマージ）
3. 現在のコミットハッシュおよび差分サマリーの表示

---

## 搭載スキルと活用例

* **LittleJS による高速ゲーム制作**:
  `littlejs-api`, `littlejs-conventions`, `new-littlejs-game` スキルを活用し、数KB〜軽量な2Dアクション/シューティング/パズルを即座に構築。
* **Phaser によるリッチゲーム制作**:
  `phaser-game-agent` スキルによるアーキテクチャ設計とコンポーネント組み立て。
* **モバイルUI・操作系**:
  `nipplejs-controls` を組み込み、スマホブラウザでも操作可能なバーチャルジョイスティックUIを実装。
* **サウンド・BGM**:
  `zzfxm-audio` により外部音源ファイル不要でレトロBGM/SEをプロシージャル生成。
* **ドット絵アセット生成**:
  `pixelforge-mcp` を通じて Gemini によるドット絵スプライトやアニメーションシートを自動生成。
* **E2E/モバイル表示検証**:
  `mobile-testing-playwright` および Playwright/DevTools MCP を通じて、各種デバイス解像度での自動テストやスクリーンショット検証を実行。
