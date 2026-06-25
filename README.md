# AI Pose Game

カメラでポーズを真似してクリアするAIゲーム。MediaPipe を使い、ブラウザ上でリアルタイムに顔・ポーズを判定します。

## ローカルで試す

カメラ API は **HTTPS または localhost** が必要です。

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開き、カメラの許可を与えてください。

## 公開方法（Vercel 推奨）

1. GitHub にリポジトリを作成して push
2. [Vercel](https://vercel.com) にログイン
3. 「Import Project」→ リポジトリを選択
4. 設定はそのまま（Framework: Other、Root: `./`）
5. Deploy

デプロイ後、HTTPS の URL でスマホからも遊べます。

### GitHub Pages でも可

`main` ブランチのルートに `index.html` がある構成なので、リポジトリ Settings → Pages → Source を `main` / root に設定するだけで公開できます。

## ファイル構成

```
ai-pose-game/
├── index.html      # メインアプリ
├── manifest.json   # PWA 設定
├── icons/          # アプリアイコン
├── vercel.json     # デプロイ用ヘッダー（カメラ許可）
└── package.json    # ローカル開発用
```

## 注意事項

- カメラは HTTPS 環境でのみ動作します（localhost を除く）
- 初回起動時に AI モデルのダウンロードが発生します（数 MB）
- スマホでは Safari / Chrome の最新版を推奨
