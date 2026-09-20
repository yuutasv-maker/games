# AGENTS.md - Games Workspace Instructions

## コミット・プッシュ時の必須出力ルール
このフォルダでコードやゲームをコミット・プッシュした際は、**必ず回答の末尾に GitHub Pages の動作確認用アドレスを出力してください**。

* **GitHub Pages ポータル:** `https://yuutasv-maker.github.io/games/`
* **対象ゲームの直接リンク:** `https://yuutasv-maker.github.io/games/<game-path>/`

## テスト駆動開発（TDD）の必須ルール
新機能の実装やバグ修正を行う際は、**必ずテスト（単体・結合・物理テスト等）を先に作成し、RED（失敗）からGREEN（合格）への推移を確認してからコミットしてください**。
* テスト実行コマンド: `npm test`
* コミット前に必ずテスト全件成功を検証すること。

## ゲーム追加時のディレクトリ方針
* 各新規ゲームは `docs/games/<game-name>/` 配下に自己完結したプロジェクトとして作成してください。
* 作成後はルートの `docs/index.html` にゲームカードへのリンクを追加してください。
