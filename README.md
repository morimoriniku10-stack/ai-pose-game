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

## 広告（AdSense）

1. [Google AdSense](https://www.google.com/adsense/) でサイトを登録
2. `ads.config.js` に `publisherId` と各 `slots` の広告ユニット ID を設定
3. `ads.txt` を AdSense 管理画面の内容に更新してデプロイ

| 枠 | 配置 |
|----|------|
| スタートバナー | トップ画面「はじめる」の下 |
| クリアバナー | クリアモーダル内 SNS の下 |
| インタースティシャル | L3, L6, L9… クリア後 NEXT 時（3秒後にスキップ可） |

`publisherId` が空の間は広告は表示されません。LINE 等のアプリ内ブラウザでは自動的に非表示です。

## 注意事項

- カメラは HTTPS 環境でのみ動作します（localhost を除く）
- 初回起動時に AI モデルのダウンロードが発生します（数 MB）
- スマホでは Safari / Chrome の最新版を推奨
