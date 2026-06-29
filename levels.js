/* POSE — レベル定義・AI判定・ガイドオーバーレイ */

const LEVELS = [
  {
    id: 1, type: "face", players: 1,
    title: "大爆笑", emoji: "😂",
    hint: "口角を上げて笑顔に！",
    detector: "detectSmile",
    guide: "face-oval",
    shareText: "大爆笑クリア！AIに笑顔がバレた。",
    clearThreshold: 0.78, holdFrames: 15
  },
  {
    id: 2, type: "face", players: 1,
    title: "ウインク", emoji: "😉",
    hint: "片目だけしっかり閉じてウインク！",
    detector: "detectWink",
    guide: "face-oval",
    shareText: "ウインク成功！ #AIシルエットマッチ",
    clearThreshold: 0.72, holdFrames: 12
  },
  {
    id: 3, type: "face", players: 1,
    title: "平安貴族の「麻麻」顔", emoji: "👘",
    hint: "眉を上げて、口をすぼめて！",
    detector: "detectHeianMaro",
    guide: "heian",
    shareText: "麻麻（まろ）の顔パス成功でおじゃる。 #AIシルエットマッチ",
    clearThreshold: 0.62, holdFrames: 14
  },
  {
    id: 4, type: "face", players: 1,
    title: "週休3日を要求する限界社畜", emoji: "💼",
    hint: "白目を剥くか、口を「へ」の字に！",
    detector: "detectSalarymanDespair",
    guide: "salaryman",
    shareText: "上司に週休3日を直訴する時の顔がこれ。 #限界社畜 #AIシルエットマッチ",
    clearThreshold: 0.58, holdFrames: 14
  },
  {
    id: 5, type: "face", players: 1,
    title: "1ミリも反省していない謝罪会見", emoji: "🎤",
    hint: "深くお辞儀！顔を下に向けてキープ",
    detector: "detectApologyBowFace",
    guide: "press-mic",
    shareText: "絶対に反省していない謝罪会見に成功しました。 #AIシルエットマッチ",
    clearThreshold: 0.40, holdFrames: 14
  },
  {
    id: 6, type: "face", players: 1,
    title: "昭和アイドル風「うっふん❤️」", emoji: "💋",
    hint: "首を傾け、人差し指を顎に近づけて！",
    detector: "detectUffun",
    guide: "uffun",
    shareText: "令和に蘇るあざとさ1000%の『うっふん』を見て。 #AIシルエットマッチ",
    clearThreshold: 0.45, holdFrames: 14
  },
  {
    id: 7, type: "face", players: 1,
    title: "G（ゴキブリ）遭遇パニック", emoji: "🪳",
    hint: "口を大きく開け、両手を顔の横に！",
    detector: "detectCockroachPanic",
    guide: "cockroach",
    shareText: "部屋にGが出た時の臨場感あふれるポーズです。 #AIシルエットマッチ",
    clearThreshold: 0.42, holdFrames: 14
  },
  {
    id: 8, type: "pose", players: 1,
    title: "進撃の巨人・奇行種走り", emoji: "🏃",
    hint: "スマホを離して上半身〜腰を映し、変な走りポーズ！",
    detector: "detectAbnormalRun",
    guide: "abnormal-run",
    shareText: "奇行種として検知されました。 #AIシルエットマッチ",
    clearThreshold: 0.42, holdFrames: 14
  },
  {
    id: 9, type: "face", players: 1,
    title: "カイジ風・全財産失った絶望", emoji: "🎰",
    hint: "両手で顔を覆うか、頭を抱えて！",
    detector: "detectKaijiDespair",
    guide: "despair",
    shareText: "キンキンに冷えてやがる……！圧倒的絶望！ #AIシルエットマッチ",
    clearThreshold: 0.42, holdFrames: 14
  },
  {
    id: 10, type: "pose", players: 1,
    title: "オタ芸「ロマンス」", emoji: "✨",
    hint: "体を斜めに、両腕を斜め上45°に突き出し！",
    detector: "detectOtakuRomance",
    guide: "otaku-romance",
    shareText: "私の魂のロマンス（オタ芸）がAIに認められました。 #AIシルエットマッチ",
    clearThreshold: 0.50, holdFrames: 16
  },
  {
    id: 11, type: "pose", players: 1,
    title: "照れ隠しポーズ", emoji: "🙈",
    hint: "両手のひらを胸の前で重ねて、恥ずかしがって！",
    detector: "detectHandBra",
    guide: "hand-bra",
    shareText: "照れ隠しポーズ大成功！ #AIシルエットマッチ",
    clearThreshold: 0.50, holdFrames: 16
  },
  {
    id: 12, type: "both", players: 1,
    title: "1人タイタニック", emoji: "🚢",
    hint: "両腕を水平に広げ、目を閉じて！",
    detector: "detectSoloTitanic",
    guide: "titanic",
    shareText: "1人でタイタニックごっこしてたらクリアした。誰か一緒にやろ？ #ぼっち #AIシルエットマッチ",
    clearThreshold: 0.52, holdFrames: 18
  },
  {
    id: 13, type: "face", players: 2,
    title: "【2人】格差社会", emoji: "⚖️",
    hint: "2人で！1人は大爆笑、もう1人は絶望顔！",
    detector: "detectWealthGap",
    guide: "duo-split",
    shareText: "友達との格差がAIによって証明されました。 #AIシルエットマッチ",
    clearThreshold: 0.55, holdFrames: 18
  },
  {
    id: 14, type: "pose", players: 2,
    title: "【2人】失敗フュージョン", emoji: "🐉",
    hint: "向き合い人差し指を合わせ、足は不格好に！",
    detector: "detectFailedFusion",
    guide: "fusion",
    shareText: "絶対に戦闘力下がってるフュージョンに成功。 #フュージョン #AIシルエットマッチ",
    clearThreshold: 0.48, holdFrames: 18
  },
  {
    id: 15, type: "pose", players: 2,
    title: "【2人】阿修羅コンビ", emoji: "👹",
    hint: "前後に重なり、後ろの人だけ4本腕！",
    detector: "detectAshura",
    guide: "ashura",
    shareText: "友達と合体して阿修羅像になりました。 #AIシルエットマッチ",
    clearThreshold: 0.45, holdFrames: 20
  },
  {
    id: 16, type: "pose", players: 2,
    title: "【2人】全力の壁ドン", emoji: "🧱",
    hint: "片腕を相手の横顔の横に！相手はのけぞって！",
    detector: "detectKabedon",
    guide: "kabedon",
    shareText: "ガチの壁ドン（物理）が決まりました。 #壁ドン #AIシルエットマッチ",
    clearThreshold: 0.48, holdFrames: 18
  },
  {
    id: 17, type: "pose", players: 2,
    title: "【2人】宇宙人捕獲", emoji: "👽",
    hint: "腕を引っ張り合い、1人は縮こまって！",
    detector: "detectAlienCapture",
    guide: "alien",
    shareText: "未知の生物を捕獲することに成功しました。 #宇宙人捕獲 #AIシルエットマッチ",
    clearThreshold: 0.45, holdFrames: 18
  },
  {
    id: 18, type: "pose", players: 2,
    title: "【2人】主従関係", emoji: "👑",
    hint: "1人しゃがみ、もう1人は足を頭の高さまで！",
    detector: "detectDomSub",
    guide: "dom-sub",
    shareText: "我が家の上下関係がこちらです。 #AIシルエットマッチ",
    clearThreshold: 0.45, holdFrames: 18
  },
  {
    id: 19, type: "pose", players: 2,
    title: "【2人】限界おんぶ", emoji: "🎒",
    hint: "背中におんぶ！足が地面から浮いて！",
    detector: "detectPiggyback",
    guide: "piggyback",
    shareText: "友達をおんぶさせられて腰が逝きました。 #AIシルエットマッチ",
    clearThreshold: 0.45, holdFrames: 20
  },
  {
    id: 20, type: "pose", players: 2,
    title: "【2人】ダサシンクロスイミング", emoji: "🏊",
    hint: "同じ角度で片足上げ、手を頭上で合わせ！",
    detector: "detectSyncSwim",
    guide: "sync-swim",
    shareText: "息ぴったり（に見える）奇跡のシンクロ。 #AIシルエットマッチ",
    clearThreshold: 0.48, holdFrames: 18
  },
  {
    id: 21, type: "pose", players: 2,
    title: "【2人】映画ポスター風", emoji: "🎬",
    hint: "背中合わせ、腕組みか銃構え風に！",
    detector: "detectBackToBack",
    guide: "movie-poster",
    shareText: "ハリウッド映画のポスターみたいになった。 #AIシルエットマッチ",
    clearThreshold: 0.45, holdFrames: 18
  },
  {
    id: 22, type: "face", players: 2,
    title: "【2人】光と闇の最終試練", emoji: "☯️",
    hint: "1人は大爆笑、1人は激しいにらみ！3秒キープ",
    detector: "detectLightAndDark",
    guide: "light-dark",
    shareText: "最終試練クリア！感情のジェットコースター画面。 #AIシルエットマッチ",
    clearThreshold: 0.55, holdFrames: 90
  }
];

/* ── 判定ヘルパー ── */

function blendGet(result, faceIdx, name) {
  if (!result?.faceBlendshapes?.[faceIdx]) return 0;
  const cat = result.faceBlendshapes[faceIdx].categories.find(s => s.categoryName === name);
  return cat?.score ?? 0;
}

function faceLm(result, faceIdx, idx) {
  return result?.faceLandmarks?.[faceIdx]?.[idx] ?? null;
}

function poseLm(result, poseIdx, idx, minVis = 0.25) {
  const lm = result?.landmarks?.[poseIdx]?.[idx];
  if (!lm || (lm.visibility ?? 1) < minVis) return null;
  return lm;
}

function blendScore(...vals) {
  const ok = vals.filter(v => v > 0);
  if (!ok.length) return 0;
  return ok.reduce((a, b) => a + b, 0) / ok.length;
}

function lmDist(a, b) {
  if (!a || !b) return 1;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp01(v) {
  return Math.min(Math.max(v, 0), 1);
}

function minScore(...vals) {
  const ok = vals.filter(v => v > 0);
  if (!ok.length) return 0;
  return Math.min(...ok);
}

function avgScore(...vals) {
  const ok = vals.filter(v => v >= 0);
  if (!ok.length) return 0;
  return ok.reduce((a, b) => a + b, 0) / ok.length;
}

function angleAt(a, b, c) {
  if (!a || !b || !c) return 180;
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (mag < 1e-6) return 180;
  return Math.acos(Math.min(Math.max(dot / mag, -1), 1)) * (180 / Math.PI);
}

function smileScore(result, faceIdx = 0) {
  const sl = blendGet(result, faceIdx, "mouthSmileLeft");
  const sr = blendGet(result, faceIdx, "mouthSmileRight");
  const sqL = blendGet(result, faceIdx, "eyeSquintLeft");
  const sqR = blendGet(result, faceIdx, "eyeSquintRight");
  return clamp01((sl + sr) / 2 * 0.7 + (sqL + sqR) / 2 * 0.3);
}

function despairFaceScore(result, faceIdx = 0) {
  const eyeWide = (blendGet(result, faceIdx, "eyeWideLeft") + blendGet(result, faceIdx, "eyeWideRight")) / 2;
  const frown = (blendGet(result, faceIdx, "mouthFrownLeft") + blendGet(result, faceIdx, "mouthFrownRight")) / 2;
  const lookUp = (blendGet(result, faceIdx, "eyeLookUpLeft") + blendGet(result, faceIdx, "eyeLookUpRight")) / 2;
  return Math.max(clamp01(eyeWide * 1.2), clamp01(frown * 1.3), clamp01(lookUp * 1.1));
}

function glareScore(result, faceIdx = 0) {
  const browDown = (blendGet(result, faceIdx, "browDownLeft") + blendGet(result, faceIdx, "browDownRight")) / 2;
  const squint = (blendGet(result, faceIdx, "eyeSquintLeft") + blendGet(result, faceIdx, "eyeSquintRight")) / 2;
  const jaw = blendGet(result, faceIdx, "jawForward");
  return clamp01(browDown * 0.5 + squint * 0.35 + jaw * 0.15);
}

function sortPosesByX(result) {
  if (!result?.landmarks?.length) return [];
  return result.landmarks
    .map((lm, i) => ({ i, x: lm[0]?.x ?? 0.5 }))
    .sort((a, b) => a.x - b.x);
}

function sortFacesByX(result) {
  if (!result?.faceLandmarks?.length) return [];
  return result.faceLandmarks
    .map((lm, i) => ({ i, x: lm[1]?.x ?? 0.5 }))
    .sort((a, b) => a.x - b.x);
}

/* ── AI判定ロジック ── */

const DETECTORS = {
  detectSmile(result) {
    if (!result?.faceBlendshapes?.length) return 0;
    return smileScore(result, 0);
  },

  detectWink(result) {
    if (!result?.faceBlendshapes?.length) return 0;
    const blinkL = blendGet(result, 0, "eyeBlinkLeft");
    const blinkR = blendGet(result, 0, "eyeBlinkRight");
    if (blinkL > 0.65 && blinkR < 0.2) return blinkL;
    if (blinkR > 0.65 && blinkL < 0.2) return blinkR;
    return 0;
  },

  detectHeianMaro(result) {
    if (!result?.faceBlendshapes?.length) return 0;
    const browUp = avgScore(
      blendGet(result, 0, "browInnerUp"),
      blendGet(result, 0, "browOuterUpLeft"),
      blendGet(result, 0, "browOuterUpRight")
    );
    const pucker = Math.max(
      blendGet(result, 0, "mouthPucker"),
      blendGet(result, 0, "mouthFunnel"),
      blendGet(result, 0, "mouthClose") * 0.8
    );
    const smile = (blendGet(result, 0, "mouthSmileLeft") + blendGet(result, 0, "mouthSmileRight")) / 2;
    const maroMouth = clamp01(pucker * (1 - smile * 0.4));
    return minScore(clamp01(browUp * 1.4), maroMouth);
  },

  detectSalarymanDespair(result) {
    if (!result?.faceBlendshapes?.length) return 0;
    return despairFaceScore(result, 0);
  },

  detectApologyBowFace(result) {
    if (!result?.faceLandmarks?.length) return 0;
    const lm = result.faceLandmarks[0];
    const forehead = lm[10], chin = lm[152], nose = lm[1];
    if (!forehead || !chin || !nose) return 0;
    const span = Math.max(chin.y - forehead.y, 0.04);
    const noseRatio = (nose.y - forehead.y) / span;
    const headDown = clamp01((noseRatio - 0.42) * 3.0);
    const chinUp = clamp01((chin.y - nose.y) / span * 2);
    return blendScore(headDown, chinUp * 0.6);
  },

  detectApologyBow({ face, pose }) {
    let score = 0;
    if (face?.faceLandmarks?.length) {
      score = DETECTORS.detectApologyBowFace(face);
    }
    if (pose?.landmarks?.length) {
      const nose = poseLm(pose, 0, 0);
      const lSh = poseLm(pose, 0, 11);
      const rSh = poseLm(pose, 0, 12);
      if (nose && lSh && rSh) {
        const shoulderY = (lSh.y + rSh.y) / 2;
        score = Math.max(score, clamp01((nose.y - shoulderY + 0.02) * 4));
      }
    }
    return score;
  },

  detectUffun({ face, pose }) {
    if (!face?.faceLandmarks?.length) return 0;
    const le = faceLm(face, 0, 33), re = faceLm(face, 0, 263);
    const chin = faceLm(face, 0, 152);
    if (!le || !re || !chin) return 0;
    const tilt = clamp01(Math.abs(le.y - re.y) * 10);
    let fingerNear = 0;
    if (pose?.landmarks?.length) {
      const lW = poseLm(pose, 0, 15), rW = poseLm(pose, 0, 16);
      for (const w of [lW, rW]) {
        if (!w) continue;
        fingerNear = Math.max(fingerNear, clamp01(1 - lmDist(w, chin) * 6));
      }
    }
    if (fingerNear > 0) return blendScore(tilt, fingerNear);
    return tilt * 0.75;
  },

  detectCockroachPanic({ face, pose }) {
    let mouth = 0;
    if (face?.faceBlendshapes?.length) {
      mouth = Math.max(
        blendGet(face, 0, "jawOpen"),
        blendGet(face, 0, "mouthOpen")
      );
    }
    let handScore = 0;
    if (pose?.landmarks?.length) {
      const lm = pose.landmarks[0];
      const nose = lm[0], lW = lm[15], rW = lm[16];
      if (nose && lW && rW && (lW.visibility ?? 1) > 0.25 && (rW.visibility ?? 1) > 0.25) {
        const spread = clamp01(Math.abs(lW.x - rW.x) * 2.2);
        const earY = nose.y - 0.04;
        handScore = blendScore(
          clamp01(1 - Math.abs(lW.y - earY) * 8),
          clamp01(1 - Math.abs(rW.y - earY) * 8),
          spread
        );
      }
    }
    if (mouth > 0 && handScore > 0) return blendScore(clamp01(mouth * 1.1), handScore);
    if (mouth > 0.5) return mouth * 0.65;
    return handScore * 0.7;
  },

  detectAbnormalRun(result) {
    if (!result?.landmarks?.length) return 0;
    const lm = result.landmarks[0];
    const lSh = poseLm(result, 0, 11), rSh = poseLm(result, 0, 12);
    const lW = poseLm(result, 0, 15), rW = poseLm(result, 0, 16);
    const lK = poseLm(result, 0, 25), rK = poseLm(result, 0, 26);
    const nose = poseLm(result, 0, 0);
    if (!lSh || !nose) return 0;
    const armsBack = blendScore(
      lW ? clamp01((lW.y - lSh.y) * 1.8) : 0,
      rW ? clamp01((rW.y - rSh.y) * 1.8) : 0
    );
    const lean = clamp01((lSh.y - nose.y) * 2.5 + 0.15);
    const kneeLift = Math.max(
      lK ? clamp01((lK.y - nose.y) * -2 + 0.2) : 0,
      rK ? clamp01((rK.y - nose.y) * -2 + 0.2) : 0
    );
    return blendScore(armsBack, lean, kneeLift);
  },

  detectKaijiDespair({ face, pose }) {
    if (!pose?.landmarks?.length && !face?.faceLandmarks?.length) return 0;
    let score = 0;
    if (pose?.landmarks?.length) {
      const nose = poseLm(pose, 0, 0);
      const lW = poseLm(pose, 0, 15), rW = poseLm(pose, 0, 16);
      const lEye = poseLm(pose, 0, 2), rEye = poseLm(pose, 0, 5);
      if (lW && rW) {
        const head = nose || lEye || rEye;
        const cover = head
          ? blendScore(
            clamp01(1 - lmDist(lW, head) * 5),
            clamp01(1 - lmDist(rW, head) * 5)
          )
          : 0;
        score = Math.max(score, cover);
      }
    }
    if (face?.faceBlendshapes?.length) {
      const frown = (blendGet(face, 0, "mouthFrownLeft") + blendGet(face, 0, "mouthFrownRight")) / 2;
      const brow = (blendGet(face, 0, "browDownLeft") + blendGet(face, 0, "browDownRight")) / 2;
      score = Math.max(score, blendScore(frown * 1.2, brow));
    }
    return score;
  },

  detectOtakuRomance(result) {
    if (!result?.landmarks?.length) return 0;
    const lm = result.landmarks[0];
    const lSh = lm[11], rSh = lm[12], lW = lm[15], rW = lm[16], lHip = lm[23];
    if (!lSh || !lW || !rW || !lHip) return 0;
    const tilt = clamp01(Math.abs(lSh.y - rSh.y) * 8);
    const lAngle = angleAt(lW, lSh, lHip);
    const rAngle = angleAt(rW, rSh, lHip);
    const armExtend = minScore(
      clamp01((160 - lAngle) / 40),
      clamp01((160 - rAngle) / 40)
    );
    const raised = minScore(
      clamp01((lSh.y - lW.y) * 3),
      clamp01((rSh.y - rW.y) * 3)
    );
    return minScore(tilt, armExtend, raised);
  },

  detectHandBra(result) {
    if (!result?.landmarks?.length) return 0;
    const lm = result.landmarks[0];
    const lSh = lm[11], rSh = lm[12], lW = lm[15], rW = lm[16], nose = lm[0];
    if (!lSh || !lW || !rW || !nose) return 0;
    const chestY = (lSh.y + rSh.y) / 2 + 0.06;
    const cross = clamp01(1 - lmDist(lW, rW) * 4);
    const height = minScore(
      clamp01(1 - Math.abs(lW.y - chestY) * 8),
      clamp01(1 - Math.abs(rW.y - chestY) * 8)
    );
    const forward = clamp01(1 - Math.abs(nose.x - 0.5) * 2);
    return minScore(cross, height, forward);
  },

  detectSoloTitanic({ face, pose }) {
    if (!pose?.landmarks?.length) return 0;
    const lm = pose.landmarks[0];
    const lSh = lm[11], rSh = lm[12], lW = lm[15], rW = lm[16];
    if (!lSh || !lW || !rW) return 0;
    const armLevel = minScore(
      clamp01(1 - Math.abs(lW.y - lSh.y) * 8),
      clamp01(1 - Math.abs(rW.y - rSh.y) * 8)
    );
    const spread = clamp01(Math.abs(lW.x - rW.x) * 2);
    let eyesClosed = 0.5;
    if (face?.faceBlendshapes?.length) {
      const blink = (blendGet(face, 0, "eyeBlinkLeft") + blendGet(face, 0, "eyeBlinkRight")) / 2;
      eyesClosed = clamp01(blink * 1.2);
    }
    return minScore(armLevel, spread, eyesClosed);
  },

  detectWealthGap(result) {
    if ((result?.faceLandmarks?.length ?? 0) < 2) return 0;
    const sorted = sortFacesByX(result);
    const s0 = smileScore(result, sorted[0].i);
    const s1 = despairFaceScore(result, sorted[1].i);
    return minScore(s0 >= 0.55 ? s0 : 0, s1 >= 0.45 ? s1 : 0);
  },

  detectFailedFusion(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const a = sorted[0].i, b = sorted[1].i;
    const lW_a = poseLm(result, a, 15), rW_a = poseLm(result, a, 16);
    const lW_b = poseLm(result, b, 15), rW_b = poseLm(result, b, 16);
    const lAnk_a = poseLm(result, a, 27), rAnk_a = poseLm(result, a, 28);
    const lAnk_b = poseLm(result, b, 27), rAnk_b = poseLm(result, b, 28);
    if (!lW_a || !lW_b) return 0;
    const fingerTouch = clamp01(1 - Math.min(
      lmDist(lW_a, lW_b), lmDist(rW_a, rW_b),
      lmDist(lW_a, rW_b), lmDist(rW_a, lW_b)
    ) * 10);
    const ankleMess = 1 - minScore(
      clamp01(Math.abs((lAnk_a?.y ?? 0) - (lAnk_b?.y ?? 0)) * 6),
      clamp01(Math.abs((rAnk_a?.y ?? 0) - (rAnk_b?.y ?? 0)) * 6)
    );
    return minScore(fingerTouch, clamp01(ankleMess + 0.3));
  },

  detectAshura(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const front = sorted[0].i, back = sorted[1].i;
    const nF = poseLm(result, front, 0), nB = poseLm(result, back, 0);
    if (!nF || !nB) return 0;
    const aligned = clamp01(1 - Math.abs(nF.x - nB.x) * 8);
    const backHigher = nB.y < nF.y ? clamp01((nF.y - nB.y) * 5) : 0;
    const lW = poseLm(result, back, 15), rW = poseLm(result, back, 16);
    const lWf = poseLm(result, front, 15), rWf = poseLm(result, front, 16);
    const armsWide = minScore(
      clamp01(Math.abs((lW?.x ?? 0) - (rW?.x ?? 0)) * 2),
      clamp01((lWf?.y ?? 1) - (lWf?.y ?? 0) + 0.3)
    );
    return minScore(aligned, backHigher * 0.6 + armsWide * 0.4);
  },

  detectKabedon(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const a = sorted[0].i, b = sorted[1].i;
    const nA = poseLm(result, a, 0), nB = poseLm(result, b, 0);
    const lW_a = poseLm(result, a, 15), rW_a = poseLm(result, a, 16);
    const lSh_b = poseLm(result, b, 11);
    if (!nA || !nB || !lSh_b) return 0;
    let wallArm = 0;
    for (const w of [lW_a, rW_a]) {
      if (!w) continue;
      const nearFace = clamp01(1 - lmDist(w, nB) * 5);
      const shoulderH = clamp01(1 - Math.abs(w.y - lSh_b.y) * 6);
      wallArm = Math.max(wallArm, minScore(nearFace, shoulderH));
    }
    const leanBack = clamp01((nB.y - nA.y) * 2 + 0.1);
    return minScore(wallArm, leanBack);
  },

  detectAlienCapture(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const a = sorted[0].i, b = sorted[1].i;
    const lW_a = poseLm(result, a, 15), rW_a = poseLm(result, a, 16);
    const lW_b = poseLm(result, b, 15), rW_b = poseLm(result, b, 16);
    const nB = poseLm(result, b, 0);
    if (!lW_a || !lW_b || !nB) return 0;
    const linked = clamp01(1 - Math.min(lmDist(lW_a, lW_b), lmDist(rW_a, rW_b)) * 8);
    const shrink = clamp01((nB.y - (poseLm(result, b, 11)?.y ?? nB.y)) * 3 + 0.2);
    return minScore(linked, shrink);
  },

  detectDomSub(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const low = sorted[0].i, high = sorted[1].i;
    const nLow = poseLm(result, low, 0), nHigh = poseLm(result, high, 0);
    const lK_h = poseLm(result, high, 25), rK_h = poseLm(result, high, 26);
    if (!nLow || !nHigh) return 0;
    const squat = clamp01((nHigh.y - nLow.y) * 2);
    const footUp = Math.max(
      clamp01((nLow.y - (lK_h?.y ?? 1)) * 2 + 0.1),
      clamp01((nLow.y - (rK_h?.y ?? 1)) * 2 + 0.1)
    );
    return minScore(squat, footUp);
  },

  detectPiggyback(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const carrier = sorted[0].i, rider = sorted[1].i;
    const nC = poseLm(result, carrier, 0), nR = poseLm(result, rider, 0);
    const lShC = poseLm(result, carrier, 11), lK_r = poseLm(result, rider, 25), rK_r = poseLm(result, rider, 26);
    const lAnk_r = poseLm(result, rider, 27), rAnk_r = poseLm(result, rider, 28);
    if (!nC || !nR || !lShC) return 0;
    const overlap = clamp01(1 - Math.abs(nR.x - nC.x) * 4) * clamp01(1 - Math.abs(nR.y - lShC.y) * 4);
    const feetUp = minScore(
      clamp01(((lAnk_r?.y ?? 1) - (lK_r?.y ?? 0.5)) * -3 + 0.3),
      clamp01(((rAnk_r?.y ?? 1) - (rK_r?.y ?? 0.5)) * -3 + 0.3)
    );
    return minScore(overlap, feetUp);
  },

  detectSyncSwim(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const a = sorted[0].i, b = sorted[1].i;
    const lK_a = poseLm(result, a, 25), rK_a = poseLm(result, a, 26);
    const lK_b = poseLm(result, b, 25), rK_b = poseLm(result, b, 26);
    const lW_a = poseLm(result, a, 15), lW_b = poseLm(result, b, 15);
    if (!lK_a || !lK_b) return 0;
    const liftA = clamp01((lK_a.y - (rK_a?.y ?? lK_a.y)) * -4 + 0.2);
    const liftB = clamp01((lK_b.y - (rK_b?.y ?? lK_b.y)) * -4 + 0.2);
    const syncLeg = clamp01(1 - Math.abs(liftA - liftB) * 4);
    const handsUp = minScore(
      clamp01((poseLm(result, a, 11)?.y ?? 1) - (lW_a?.y ?? 1) + 0.1),
      clamp01((poseLm(result, b, 11)?.y ?? 1) - (lW_b?.y ?? 1) + 0.1)
    );
    return minScore(liftA, liftB, syncLeg, handsUp);
  },

  detectBackToBack(result) {
    if ((result?.landmarks?.length ?? 0) < 2) return 0;
    const sorted = sortPosesByX(result);
    const a = sorted[0].i, b = sorted[1].i;
    const lSh_a = poseLm(result, a, 11), rSh_a = poseLm(result, a, 12);
    const lSh_b = poseLm(result, b, 11), rSh_b = poseLm(result, b, 12);
    const lW_a = poseLm(result, a, 15), lW_b = poseLm(result, b, 15);
    if (!lSh_a || !lSh_b) return 0;
    const backClose = clamp01(1 - Math.abs((lSh_a.x + rSh_a.x) / 2 - (lSh_b.x + rSh_b.x) / 2) * 3);
    const chestPose = minScore(
      clamp01(1 - Math.abs((lW_a?.x ?? 0.5) - (lSh_a.x + rSh_a.x) / 2) * 3),
      clamp01(1 - Math.abs((lW_b?.x ?? 0.5) - (lSh_b.x + rSh_b.x) / 2) * 3)
    );
    return minScore(backClose, chestPose);
  },

  detectLightAndDark(result) {
    if ((result?.faceLandmarks?.length ?? 0) < 2) return 0;
    const sorted = sortFacesByX(result);
    const laugh = smileScore(result, sorted[0].i);
    const glare = glareScore(result, sorted[1].i);
    return minScore(laugh >= 0.65 ? laugh : 0, glare >= 0.45 ? glare : 0);
  }
};

function evaluateDetection(level, faceResult, poseResult) {
  const fn = DETECTORS[level.detector];
  if (!fn) return 0;
  if (levelUsesDualDetection(level)) {
    return fn({ face: faceResult, pose: poseResult });
  }
  if (levelNeedsFaceModel(level)) return fn(faceResult);
  return fn(poseResult);
}

/** 顔+ポーズ複合入力の detector */
const DUAL_INPUT_DETECTORS = new Set([
  "detectUffun",
  "detectCockroachPanic",
  "detectKaijiDespair",
  "detectSoloTitanic",
  "detectApologyBow"
]);

function levelUsesDualDetection(level) {
  return DUAL_INPUT_DETECTORS.has(level.detector);
}

function levelNeedsFaceModel(level) {
  return level.type === "face" || level.type === "both";
}

/** レベル開始前にポーズモデルが必須か（false なら顔AIだけで開始可能） */
function levelNeedsPoseModel(level) {
  if (level.type === "pose") return true;
  if (level.type === "face") return false;
  return level.detector === "detectSoloTitanic";
}

function levelWantsOptionalPose(level) {
  return levelUsesDualDetection(level) && !levelNeedsPoseModel(level);
}

/** ポーズモデルが必要（必須 or 任意）か */
function levelUsesPoseAtAll(level) {
  return levelNeedsPoseModel(level) || levelWantsOptionalPose(level);
}

function updateGuideOverlay(level) {
  const el = document.getElementById("guide-overlay");
  if (!el) return;
  el.className = "guide-overlay";
  el.innerHTML = "";
  if (level?.players >= 2) {
    el.classList.add("guide-active");
    el.innerHTML = `<div class="guide-duo-badge">👥 2人必要</div>`;
  }
}

function drawLevelGuide(ctx, level, w, h) {
  const cx = w / 2;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;

  if (level.type === "face" || level.type === "both") {
    const cy = h * 0.36;
    ctx.strokeStyle = "rgba(184,255,46,0.6)";
    ctx.fillStyle = "rgba(184,255,46,0.05)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.26, h * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (level.type === "pose" || level.type === "both") {
    ctx.strokeStyle = "rgba(255,200,46,0.55)";
    ctx.fillStyle = "rgba(255,200,46,0.05)";
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.12);
    ctx.lineTo(cx - w * 0.22, h * 0.55);
    ctx.lineTo(cx - w * 0.14, h * 0.92);
    ctx.lineTo(cx + w * 0.14, h * 0.92);
    ctx.lineTo(cx + w * 0.22, h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
