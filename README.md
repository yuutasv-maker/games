# Games Workspace

AIエージェント（Antigravity）とのペアプログラミングによるWeb/HTML5ゲーム開発・プロトタイピング環境です。

* **GitHub Repository:** [https://github.com/yuutasv-maker/games](https://github.com/yuutasv-maker/games)
* **GitHub Pages (動作確認用):** [https://yuutasv-maker.github.io/games/](https://yuutasv-maker.github.io/games/)

---

## デプロイ & 動作確認フロー

`docs/` 配下に配置されたWebアセットが GitHub Pages の公開対象となります。
コードをコミット後、以下のコマンドで `main` と `gh-pages` の両方に自動プッシュ・即時デプロイされます。

```bash
# npm コマンド経由（推奨）
npm run deploy

# または直接スクリプト実行
./scripts/deploy-pages.sh
```

---

## ディレクトリ構成

```text
.
├── .agents/
│   ├── rules/                          # エージェント用プロジェクトルール（URL出力規約等）
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
├── docs/                               # GitHub Pages 公開用ルートディレクトリ
│   ├── index.html                      # ゲームポータル・ランチャー画面
│   └── games/                          # 今後作成される各ゲーム（予定）
├── vendor/                             # 上流追従用 Git サブモジュール群 (8リポジトリ)
├── scripts/
│   ├── deploy-pages.sh                 # GitHub Pages へのデプロイスクリプト
│   └── update-submodules.sh            # サブモジュール一括更新スクリプト
├── mcp_config.json                     # MCPサーバー設定定義
└── package.json                        # ワークスペース管理用 npm スクリプト
```

---

## サブモジュールの更新方法

上流の最新コミットを取り込む際は、以下を実行してください。

```bash
npm run update:submodules
```
