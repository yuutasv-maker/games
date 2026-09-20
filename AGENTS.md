# AGENTS.md - Games Workspace Instructions

## コミット・プッシュ時の必須出力ルール
このフォルダでコードやゲームをコミット・プッシュした際は、**必ず回答の末尾に GitHub Pages の動作確認用アドレスを出力してください**。

* **GitHub Pages ポータル:** `https://yuutasv-maker.github.io/games/`
* **対象ゲームの直接リンク:** `https://yuutasv-maker.github.io/games/<game-path>/`

## ゲーム追加時のディレクトリ方針
* 各新規ゲームは `games/<game-name>/` 配下に自己完結したHTML/JSプロジェクト（またはVite/Canvas/LittleJS/Phaser構成）として作成してください。
* 作成後はルートの `index.html` にゲームカードへのリンクを追加してください。
