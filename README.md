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

| URL | 内容 |
|-----|------|
| `/` | ランディング（AdSense 審査用コンテンツ） |
| `/play.html` | ゲーム本体 |
| `/privacy.html` 等 | 法定ページ |

### GitHub Pages でも可

`main` ブランチのルートに `index.html` がある構成なので、リポジトリ Settings → Pages → Source を `main` / root に設定するだけで公開できます。

## ファイル構成

```
ai-pose-game/
├── index.html        # ランディング
├── play.html         # ゲーム本体
├── site.config.js    # 運営者情報（審査前に更新）
├── privacy.html 等   # 法定ページ
├── ads.config.js     # AdSense 設定
├── manifest.json     # PWA 設定
├── icons/            # アプリアイコン
├── vercel.json       # デプロイ用ヘッダー（カメラ許可）
└── package.json      # ローカル開発用
```

## Google AdSense 審査チェックリスト

審査申請前に以下を完了してください。

1. **`site.config.js`** — `siteUrl`・`contactEmail` を実在の値に更新
2. **`ads.config.js`** — `publisherId` と各 `slots` を設定してデプロイ
3. **`ads.txt`** — AdSense 管理画面の1行をコピーして差し替え
4. **AdSense 申請** — サイト URL にはトップページ（`https://あなたのドメイン/`）を登録
5. **Search Console** — サイト所有権の確認（推奨）
6. **法定ページ** — About / プライバシー / 利用規約 / お問い合わせ / 遊び方ガイドが公開されていること
7. **Cookie 同意** — 初回訪問時にバナーが表示されること

### 広告枠

| 枠 | 配置 |
|----|------|
| スタートバナー | `/play.html` スタート画面 |
| クリアバナー | クリアモーダル内 |
| インタースティシャル | L3, L6, L9… クリア後 NEXT 時 |

`publisherId` が空の間は広告は表示されません。LINE 等のアプリ内ブラウザでは自動的に非表示です。

## 注意事項

- カメラは HTTPS 環境でのみ動作します（localhost を除く）
- 初回起動時に AI モデルのダウンロードが発生します（数 MB）
- スマホでは Safari / Chrome の最新版を推奨
