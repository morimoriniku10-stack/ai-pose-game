/**
 * POSE 広告設定（AdSense）
 *
 * 1. https://www.google.com/adsense/ でサイトを登録・審査
 * 2. 広告ユニットを3つ作成（スタートバナー / クリアバナー / インタースティシャル）
 * 3. 下記 publisherId と slots に ID を貼り付け
 * 4. サイトルートに ads.txt を配置（AdSense 管理画面から取得）
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
