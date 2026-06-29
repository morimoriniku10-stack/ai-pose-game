/* POSE — AdSense バナー / レタースティシャル */

const AdState = {
  scriptLoaded: false,
  scriptLoading: false,
  levelsCleared: 0,
  mounted: new Set()
};

function getAdConfig() {
  return window.POSE_AD_CONFIG || {};
}

function isAdsConfigured() {
  const cfg = getAdConfig();
  const pub = cfg.publisherId || "";
  if (!/^ca-pub-\d+$/.test(pub)) return false;
  const slots = cfg.slots || {};
  return Boolean(slots.startBanner || slots.clearBanner || slots.interstitial);
}

function shouldShowAdsNow() {
  if (!isAdsConfigured()) return false;
  if (typeof hasAdConsent === "function" && !hasAdConsent()) return false;
  if (typeof isInAppBrowser === "function" && isInAppBrowser()) return false;
  return true;
}

function loadAdSenseScript() {
  const pub = getAdConfig().publisherId;
  if (!pub || AdState.scriptLoaded || AdState.scriptLoading) {
    return Promise.resolve(AdState.scriptLoaded);
  }

  AdState.scriptLoading = true;
  return new Promise((resolve) => {
    if (document.getElementById("adsense-script")) {
      AdState.scriptLoaded = true;
      AdState.scriptLoading = false;
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "adsense-script";
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pub}`;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      AdState.scriptLoaded = true;
      AdState.scriptLoading = false;
      resolve(true);
    };
    script.onerror = () => {
      AdState.scriptLoading = false;
      console.warn("[Ads] AdSense スクリプト読込失敗");
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

function createAdUnit(slotId, format = "auto") {
  const cfg = getAdConfig();
  const ins = document.createElement("ins");
  ins.className = "adsbygoogle";
  ins.style.display = "block";
  ins.setAttribute("data-ad-client", cfg.publisherId);
  ins.setAttribute("data-ad-slot", slotId);
  ins.setAttribute("data-ad-format", format);
  ins.setAttribute("data-full-width-responsive", "true");
  return ins;
}

function pushAd(container) {
  const ins = container.querySelector(".adsbygoogle");
  if (!ins || ins.dataset.adPushed === "1") return;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    ins.dataset.adPushed = "1";
  } catch (err) {
    console.warn("[Ads] push 失敗:", err);
  }
}

async function mountBanner(containerId, slotId, mountKey) {
  if (!shouldShowAdsNow() || !slotId) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.classList.remove("hidden");
  container.removeAttribute("hidden");
  container.setAttribute("aria-hidden", "false");

  if (AdState.mounted.has(mountKey)) {
    container.classList.add("ad-slot-visible");
    return;
  }

  container.innerHTML = "";
  container.appendChild(createAdUnit(slotId));

  const ok = await loadAdSenseScript();
  if (!ok) {
    container.classList.add("hidden");
    return;
  }

  pushAd(container);
  AdState.mounted.add(mountKey);
  container.classList.add("ad-slot-visible");
}

function initBannerAds() {
  if (!shouldShowAdsNow()) return;

  const slots = getAdConfig().slots || {};
  mountBanner("ad-slot-start", slots.startBanner, "start");
  mountBanner("ad-slot-clear", slots.clearBanner, "clear");
}

function onLevelCleared() {
  AdState.levelsCleared++;
}

function shouldShowInterstitial() {
  if (!shouldShowAdsNow()) return false;

  const cfg = getAdConfig();
  const every = Math.max(1, cfg.interstitialEvery || 3);
  const minClears = cfg.minClearsForAds ?? cfg.minClearsForInterstitial ?? 3;
  const slot = cfg.slots?.interstitial;

  if (!slot) return false;
  if (AdState.levelsCleared < minClears) return false;
  return AdState.levelsCleared % every === 0;
}

function startInterstitialCountdown(btn, seconds, onDone) {
  let left = seconds;
  btn.disabled = true;
  btn.textContent = `続ける（${left}）`;

  const timer = setInterval(() => {
    left--;
    if (left > 0) {
      btn.textContent = `続ける（${left}）`;
      return;
    }
    clearInterval(timer);
    btn.disabled = false;
    btn.textContent = "続ける →";
    onDone?.();
  }, 1000);

  return () => clearInterval(timer);
}

function showInterstitialAd() {
  return new Promise(async (resolve) => {
    if (!shouldShowInterstitial()) {
      resolve(true);
      return;
    }

    const overlay = document.getElementById("ad-interstitial");
    const slotEl = document.getElementById("ad-interstitial-slot");
    const closeBtn = document.getElementById("ad-interstitial-close");
    const slotId = getAdConfig().slots?.interstitial;

    if (!overlay || !slotEl || !closeBtn || !slotId) {
      resolve(true);
      return;
    }

    slotEl.innerHTML = "";
    slotEl.appendChild(createAdUnit(slotId, "rectangle"));

    const ok = await loadAdSenseScript();
    if (!ok) {
      resolve(true);
      return;
    }

    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("ad-interstitial-open");

    pushAd(slotEl);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      overlay.classList.remove("visible");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("ad-interstitial-open");
      resolve(true);
    };

    const cancelCountdown = startInterstitialCountdown(closeBtn, 3, () => {});
    closeBtn.onclick = () => {
      if (closeBtn.disabled) return;
      cancelCountdown();
      finish();
    };
  });
}

async function beforeGoNextLevel() {
  return showInterstitialAd();
}

function refreshClearBanner() {
  const slots = getAdConfig().slots || {};
  if (slots.clearBanner) {
    mountBanner("ad-slot-clear", slots.clearBanner, "clear");
  }
}

function initAds() {
  if (!isAdsConfigured()) {
    console.log("[Ads] 未設定 — ads.config.js に AdSense ID を入力してください");
    return;
  }
  initBannerAds();
}

function resetAdSession() {
  AdState.levelsCleared = 0;
}
