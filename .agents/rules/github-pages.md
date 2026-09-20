---
trigger: always_on
description: コミットおよびプッシュ完了時に必ず GitHub Pages の確認用URLを出力するルール
---

# GitHub Pages URL Output Rule

## 必須事項
本プロジェクト（`games`）でコードの追加・修正・ゲームの作成を行い、Git コミットおよび GitHub へのプッシュ（またはコミット作成）を行った際は、**必ず回答の末尾に GitHub Pages の動作確認用アドレスを出力してください**。

### 出力フォーマット
```markdown
---
### 動作確認用 URL (GitHub Pages)
* **ポータル（全体一覧）:** https://yuutasv-maker.github.io/games/
* **今回のゲーム / プロジェクト:** https://yuutasv-maker.github.io/games/<game-relative-path>/
*(プッシュ後、GitHub Actions によるデプロイ完了まで数十秒〜1分程度かかります)*
---
```
