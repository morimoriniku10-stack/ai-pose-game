/**
 * POSE 広告設定（AdSense）
 *
 * 【AdSense 審査前チェックリスト】
 * 1. site.config.js の contactEmail / siteUrl を更新
 * 2. ads.txt を AdSense 管理画面の内容に差し替え
 * 3. 下記 publisherId と slots を設定し、コードをデプロイ
 * 4. AdSense 申請時は「サイト URL」にトップページ（/）を登録
 * 5. 審査中は広告コードが head/body に含まれることを確認（ads.js が読み込まれること）
 */
window.POSE_AD_CONFIG = {
  /** ca-pub-xxxxxxxxxxxxxxxx 形式。空のままなら広告は非表示 */
  publisherId: "",

  /** インタースティシャル：N レベルクリアごと（L3, L6, L9…） */
  interstitialEvery: 3,

  /** このレベルクリア数に達するまでインタースティシャルなし */
  minClearsForInterstitial: 3,

  slots: {
    /** スタート画面バナー */
    startBanner: "",
    /** クリアモーダル内バナー */
    clearBanner: "",
    /** レベル間フルスクリーン広告 */
    interstitial: ""
  }
};
