/* POSE — Cookie 同意（AdSense / GDPR） */

const CONSENT_KEY = "pose_ad_consent";

function hasAdConsent() {
  return localStorage.getItem(CONSENT_KEY) === "1";
}

function setAdConsent(value) {
  localStorage.setItem(CONSENT_KEY, value ? "1" : "0");
  if (value && typeof initAds === "function") {
    initAds();
  }
}

function mountConsentBanner() {
  if (hasAdConsent() || document.getElementById("cookie-consent")) return;

  const bar = document.createElement("div");
  bar.id = "cookie-consent";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", "Cookie の使用について");
  bar.innerHTML = `
    <div class="cookie-consent-inner">
      <p>当サイトでは、広告配信（Google AdSense）およびサービス改善のために Cookie を使用します。
        カメラ映像は端末内で処理され、サーバーには送信されません。
        詳細は <a href="/privacy.html">プライバシーポリシー</a> をご覧ください。</p>
      <div class="cookie-consent-actions">
        <button type="button" class="cookie-btn cookie-accept" id="cookie-accept">同意する</button>
        <button type="button" class="cookie-btn cookie-decline" id="cookie-decline">拒否する</button>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #cookie-consent {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 3000;
      padding: 14px 16px;
      background: rgba(12, 12, 22, 0.97);
      border-top: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
    }
    .cookie-consent-inner { max-width: 720px; margin: 0 auto; }
    #cookie-consent p { font-size: 12px; line-height: 1.65; color: #bbb; margin-bottom: 12px; }
    #cookie-consent a { color: #00f5ff; }
    .cookie-consent-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .cookie-btn {
      padding: 10px 18px; border-radius: 8px; border: none;
      font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .cookie-accept { background: linear-gradient(135deg, #ff6b9d, #ffc371); color: #1a1a2e; }
    .cookie-decline { background: rgba(255,255,255,0.08); color: #ccc; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(bar);

  document.getElementById("cookie-accept").onclick = () => {
    setAdConsent(true);
    bar.remove();
  };
  document.getElementById("cookie-decline").onclick = () => {
    setAdConsent(false);
    bar.remove();
  };
}

document.addEventListener("DOMContentLoaded", mountConsentBanner);
