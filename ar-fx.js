/* POSE — ランドマーク追従 AR ビジュアル FX */

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

const FXSmooth = { faces: [null, null], poses: [null, null] };

function resetFXSmoothing() {
  FXSmooth.faces = [null, null];
  FXSmooth.poses = [null, null];
}

function fxLerp(a, b, t) {
  return a + (b - a) * t;
}

function fxPt(lm, w, h) {
  return { x: (1 - lm.x) * w, y: lm.y * h, z: lm.z ?? 0 };
}

function fxDist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fxMid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 };
}

function smoothFace(idx, raw, alpha = 0.38) {
  const prev = FXSmooth.faces[idx];
  if (!prev) {
    FXSmooth.faces[idx] = { ...raw };
    return FXSmooth.faces[idx];
  }
  const s = FXSmooth.faces[idx];
  for (const k of ["cx", "cy", "angle", "scale", "faceW", "faceH", "depth"]) {
    s[k] = fxLerp(prev[k], raw[k], alpha);
  }
  s.lm = raw.lm;
  s.pts = raw.pts;
  return s;
}

function smoothPose(idx, raw, alpha = 0.32) {
  const prev = FXSmooth.poses[idx];
  if (!prev) {
    FXSmooth.poses[idx] = { ...raw };
    return FXSmooth.poses[idx];
  }
  const s = FXSmooth.poses[idx];
  for (const k of ["cx", "cy", "angle", "scale", "bodyH", "bodyW"]) {
    s[k] = fxLerp(prev[k], raw[k], alpha);
  }
  s.lm = raw.lm;
  s.pts = raw.pts;
  return s;
}

function normalizeAngle(a) {
  while (a > Math.PI / 2) a -= Math.PI;
  while (a < -Math.PI / 2) a += Math.PI;
  return a;
}

function analyzeFace(landmarks, w, h) {
  const aLe = fxPt(landmarks[33], w, h);
  const aRe = fxPt(landmarks[263], w, h);
  const forehead = fxPt(landmarks[10], w, h);
  const chin = fxPt(landmarks[152], w, h);
  const nose = fxPt(landmarks[1], w, h);
  const mouthL = fxPt(landmarks[61], w, h);
  const mouthR = fxPt(landmarks[291], w, h);

  const [screenLe, screenRe] = aLe.x < aRe.x ? [aLe, aRe] : [aRe, aLe];
  const eyeMid = fxMid(screenLe, screenRe);
  const cx = fxLerp(nose.x, eyeMid.x, 0.2);
  const cy = fxLerp(nose.y, fxMid(forehead, chin).y, 0.1);

  const eyeDist = Math.max(fxDist(screenLe, screenRe), 22);
  const faceH = Math.max(fxDist(forehead, chin), eyeDist * 1.08);
  const faceW = eyeDist * 1.38;
  const angle = normalizeAngle(Math.atan2(screenRe.y - screenLe.y, screenRe.x - screenLe.x));
  const depth = nose.z ?? 0;

  return {
    cx, cy, angle, scale: 1, faceW, faceH, depth,
    lm: landmarks,
    pts: {
      le: screenLe, re: screenRe,
      aLe, aRe,
      forehead, chin, nose, mouthL, mouthR, eyeMid
    }
  };
}

function analyzePose(landmarks, w, h) {
  const nose = landmarks[0], lSh = landmarks[11], rSh = landmarks[12];
  if (!nose || !lSh || !rSh) return null;
  const vis = lm => (lm.visibility ?? 1) >= 0.25;
  if (!vis(nose) || !vis(lSh) || !vis(rSh)) return null;

  const pts = {};
  for (const [k, i] of [
    ["nose", 0], ["lSh", 11], ["rSh", 12], ["lEl", 13], ["rEl", 14],
    ["lW", 15], ["rW", 16], ["lHip", 23], ["rHip", 24],
    ["lK", 25], ["rK", 26], ["lAnk", 27], ["rAnk", 28]
  ]) {
    const lm = landmarks[i];
    if (lm && vis(lm)) pts[k] = fxPt(lm, w, h);
  }

  const lShP = pts.lSh, rShP = pts.rSh;
  const cx = (lShP.x + rShP.x) / 2;
  const shoulderY = (lShP.y + rShP.y) / 2;
  let hipY = shoulderY + bodyEstH(w, h);
  if (pts.lHip && pts.rHip) {
    hipY = (pts.lHip.y + pts.rHip.y) / 2;
  }
  const bodyW = Math.max(fxDist(lShP, rShP) * 2.2, 80);
  const bodyH = Math.max(hipY - shoulderY + bodyW * 0.35, bodyW * 0.8);
  const cy = shoulderY + bodyH * 0.28;
  const angle = Math.atan2(rShP.y - lShP.y, rShP.x - lShP.x);
  const scale = bodyW / 220;

  return { cx, cy, angle, scale, bodyW, bodyH, lm: landmarks, pts };
}

function bodyEstH(w, h) {
  return Math.min(w, h) * 0.22;
}

function withFaceTransform(ctx, face, fn) {
  ctx.save();
  ctx.translate(face.cx, face.cy);
  ctx.rotate(face.angle);
  fn(ctx, face);
  ctx.restore();
}

function buildPoseFromFace(face) {
  const { chin, nose, forehead } = face.pts;
  const shoulderY = chin.y + face.faceH * 0.22;
  const half = face.faceW * 0.52;
  const cos = Math.cos(face.angle);
  const sin = Math.sin(face.angle);
  const lSh = { x: face.cx - half * cos, y: shoulderY - half * sin };
  const rSh = { x: face.cx + half * cos, y: shoulderY + half * sin };
  const bodyW = half * 2.1;
  return {
    cx: face.cx,
    cy: shoulderY + face.faceH * 0.28,
    angle: face.angle,
    scale: 1,
    bodyW,
    bodyH: face.faceH * 2.2,
    synthetic: true,
    pts: { nose, lSh, rSh, forehead, chin }
  };
}

function resolvePose(pose, face) {
  if (pose) return pose;
  if (face) return buildPoseFromFace(face);
  return null;
}

function drawNeonPath(ctx, pathFn, color, width = 2.5, blur = 14) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  pathFn(ctx);
  ctx.stroke();
  ctx.restore();
}

function drawScanSweep(ctx, face) {
  const t = (Date.now() % 2200) / 2200;
  const y = fxLerp(face.pts.forehead.y, face.pts.chin.y, t);
  ctx.save();
  ctx.strokeStyle = "rgba(0,245,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(0,245,255,0.6)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(face.cx - face.faceW * 0.55, y);
  ctx.lineTo(face.cx + face.faceW * 0.55, y);
  ctx.stroke();
  ctx.restore();
}

function faceOvalPath(ctx, landmarks, w, h) {
  ctx.beginPath();
  FACE_OVAL.forEach((idx, i) => {
    const p = fxPt(landmarks[idx], w, h);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

function drawFaceLockUI(ctx, face, w, h) {
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 180);
  const hw = face.faceW * 0.56;
  const hh = face.faceH * 0.62;
  const x0 = face.cx - hw;
  const y0 = face.cy - hh * 0.85;
  const x1 = face.cx + hw;
  const y1 = face.cy + hh * 0.95;
  const len = Math.min(hw * 0.22, 28);

  ctx.save();
  ctx.strokeStyle = `rgba(0,245,255,${0.75 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "rgba(0,245,255,0.8)";
  ctx.shadowBlur = 10;

  const corner = (sx, sy, dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + dx * len, sy);
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + dy * len);
    ctx.stroke();
  };
  corner(x0, y0, 1, 1);
  corner(x1, y0, -1, 1);
  corner(x0, y1, 1, -1);
  corner(x1, y1, -1, -1);

  ctx.font = "bold 12px 'Share Tech Mono', monospace";
  ctx.fillStyle = `rgba(184,255,46,${0.95 * pulse})`;
  ctx.textAlign = "center";
  ctx.fillText("◉ FACE LOCK", face.cx, y0 - 12);

  const keyIdx = [33, 263, 1, 61, 291, 10, 152, 159, 386];
  for (const idx of keyIdx) {
    const lm = face.lm[idx];
    if (!lm) continue;
    const p = fxPt(lm, w, h);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(184,255,46,0.98)";
    ctx.shadowColor = "rgba(184,255,46,1)";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,245,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFaceWireMesh(ctx, landmarks, w, h, hue = 180) {
  const mainColor = `hsla(${hue},100%,65%,0.92)`;
  drawNeonPath(ctx, c => faceOvalPath(c, landmarks, w, h), mainColor, 3, 20);

  ctx.save();
  ctx.globalAlpha = 0.12;
  faceOvalPath(ctx, landmarks, w, h);
  ctx.fillStyle = `hsla(${hue},100%,60%,0.35)`;
  ctx.fill();
  ctx.restore();

  const le = fxPt(landmarks[33], w, h);
  const re = fxPt(landmarks[263], w, h);
  const nose = fxPt(landmarks[1], w, h);
  ctx.save();
  ctx.strokeStyle = "rgba(0,245,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(le.x, le.y);
  ctx.lineTo(nose.x, nose.y);
  ctx.lineTo(re.x, re.y);
  ctx.stroke();
  ctx.restore();
}

function drawFaceWireMeshWithScan(ctx, landmarks, w, h, face, hue) {
  drawFaceWireMesh(ctx, landmarks, w, h, hue);
  if (face) {
    drawScanSweep(ctx, face);
    drawFaceLockUI(ctx, face, w, h);
  }
}

function drawStickerText(ctx, x, y, text, size, color, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `800 ${size}px 'M PLUS Rounded 1c', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawEmojiSticker(ctx, x, y, emoji, size, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `${size}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

/* ── レベル別 AR FX ── */

function fxHeian(ctx, face, w, h) {
  drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 280);
  withFaceTransform(ctx, face, (c, f) => {
    const hw = f.faceW * 0.52;
    const hh = f.faceH * 0.28;
    const topY = (f.pts.forehead.y - f.cy) - f.faceH * 0.1;
    c.fillStyle = "rgba(60,20,90,0.6)";
    c.strokeStyle = "rgba(255,220,120,0.92)";
    c.lineWidth = 2.5;
    c.shadowColor = "rgba(255,200,80,0.85)";
    c.shadowBlur = 16;
    c.beginPath();
    c.ellipse(0, topY, hw, hh, 0, Math.PI, 0);
    c.lineTo(hw * 0.82, topY + hh * 0.85);
    c.quadraticCurveTo(0, topY + hh * 1.05, -hw * 0.82, topY + hh * 0.85);
    c.closePath();
    c.fill();
    c.stroke();
  });
}

function fxSalaryman(ctx, face, w, h) {
  drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 0);
  const { aLe, aRe, mouthL, mouthR, chin } = face.pts;
  const mouthMid = fxMid(mouthL, mouthR);
  const eyeR = face.faceW * 0.1;
  for (const eye of [aLe, aRe]) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,80,80,0.9)";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eye.x, eye.y - eyeR * 0.15, eyeR * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15,15,25,0.9)";
    ctx.fill();
    ctx.restore();
  }
  drawStickerText(ctx, mouthMid.x, mouthMid.y + face.faceH * 0.05, "へ", face.faceW * 0.26, "rgba(255,90,90,0.95)", face.angle * 0.5);
  drawStickerText(ctx, chin.x, chin.y + face.faceH * 0.1, "限界", face.faceW * 0.14, "rgba(255,200,46,0.85)", face.angle * 0.5);
}

function fxFaceOval(ctx, face, w, h) {
  drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 160);
  withFaceTransform(ctx, face, (c, f) => {
    c.strokeStyle = "rgba(184,255,46,0.5)";
    c.lineWidth = 2;
    c.setLineDash([6, 5]);
    c.beginPath();
    c.ellipse(0, 0, f.faceW * 0.52, f.faceH * 0.58, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  });
}

function fxUffun(ctx, face, pose, w, h) {
  if (face) {
    drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 320);
    const { chin, forehead } = face.pts;
    const cos = Math.cos(face.angle);
    const sin = Math.sin(face.angle);
    const hx = forehead.x + sin * face.faceW * 0.22;
    const hy = forehead.y - cos * face.faceW * 0.22;
    drawEmojiSticker(ctx, hx, hy, "❤️", face.faceW * 0.3, face.angle);
    const resolved = resolvePose(pose, face);
    if (resolved?.pts?.rW || resolved?.pts?.lW) {
      const wrist = resolved.pts.rW || resolved.pts.lW;
      ctx.save();
      ctx.strokeStyle = "rgba(255,120,180,0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(wrist.x, wrist.y);
      ctx.lineTo(chin.x, chin.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(chin.x, chin.y, face.faceW * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,120,180,0.7)";
      ctx.stroke();
      ctx.restore();
    }
  }
}

function fxCockroach(ctx, face, pose, w, h) {
  const resolved = resolvePose(pose, face);
  if (face) drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 30);
  if (resolved?.pts) {
    const { lW, rW, nose } = resolved.pts;
    const refX = nose?.x ?? resolved.cx;
    const refY = nose?.y ?? resolved.cy;
    const roachX = Math.min(lW?.x ?? refX, rW?.x ?? refX) - resolved.bodyW * 0.12;
    const roachY = lW && rW ? (lW.y + rW.y) / 2 : refY;
    drawEmojiSticker(ctx, roachX, roachY, "🪳", resolved.bodyW * 0.16, 0);
    for (const wpt of [lW, rW].filter(Boolean)) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,200,46,0.7)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(wpt.x, wpt.y);
      if (nose) ctx.lineTo(nose.x, nose.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function fxDespair(ctx, face, pose, w, h) {
  const resolved = resolvePose(pose, face);
  if (resolved?.pts) {
    const { lW, rW, nose } = resolved.pts;
    const head = nose || face?.pts?.nose;
    if (lW && rW && head) {
      ctx.save();
      ctx.strokeStyle = "rgba(100,120,255,0.75)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(100,120,255,0.6)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(lW.x, lW.y);
      ctx.lineTo(head.x - resolved.bodyW * 0.06, head.y);
      ctx.lineTo(rW.x, rW.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (face) drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 240);
}

function fxPressMic(ctx, pose, face, w, h) {
  const resolved = resolvePose(pose, face);
  if (!resolved?.pts) return;
  const nose = resolved.pts.nose || face?.pts?.nose;
  const { lSh, rSh } = resolved.pts;
  if (!nose) return;
  const micX = nose.x;
  const micTop = nose.y + resolved.bodyH * 0.06;
  const micBot = Math.min(h * 0.92, micTop + resolved.bodyH * 0.45);
  ctx.save();
  ctx.strokeStyle = "rgba(180,180,200,0.85)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(255,255,255,0.4)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(micX, micTop);
  ctx.lineTo(micX, micBot);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(micX, micTop, resolved.bodyW * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40,40,50,0.7)";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (lSh && rSh) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,200,46,0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(lSh.x, lSh.y);
    ctx.lineTo(rSh.x, rSh.y);
    ctx.lineTo(micX, micTop + resolved.bodyH * 0.15);
    ctx.stroke();
    ctx.restore();
  }
}

function fxPoseBody(ctx, pose, w, h, hue = 45) {
  if (!pose?.pts) return;
  const conn = [
    ["lSh", "rSh"], ["lSh", "lEl"], ["lEl", "lW"], ["rSh", "rEl"], ["rEl", "rW"],
    ["lSh", "lHip"], ["rSh", "rHip"], ["lHip", "rHip"],
    ["lHip", "lK"], ["lK", "lAnk"], ["rHip", "rK"], ["rK", "rAnk"]
  ];
  ctx.save();
  ctx.lineWidth = 3;
  ctx.shadowBlur = 12;
  for (const [a, b] of conn) {
    const pa = pose.pts[a], pb = pose.pts[b];
    if (!pa || !pb) continue;
    ctx.shadowColor = `hsla(${hue},100%,60%,0.7)`;
    ctx.strokeStyle = `hsla(${hue},100%,65%,0.75)`;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.restore();
}

function fxAbnormalRun(ctx, pose, w, h) {
  fxPoseBody(ctx, pose, w, h, 30);
  if (!pose?.pts) return;
  const { lW, rW, lSh, rSh, lK, rK } = pose.pts;
  for (const wpt of [lW, rW].filter(Boolean)) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,100,100,0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (lSh) { ctx.moveTo(wpt.x, wpt.y); ctx.lineTo(lSh.x, lSh.y); }
    ctx.stroke();
    ctx.restore();
  }
  const knee = lK || rK;
  if (knee) {
    ctx.beginPath();
    ctx.arc(knee.x, knee.y, pose.bodyW * 0.08, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,200,46,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function fxOtakuRomance(ctx, pose, w, h) {
  fxPoseBody(ctx, pose, w, h, 280);
  if (!pose?.pts?.lW || !pose?.pts?.rW) return;
  const { lW, rW, lSh, rSh } = pose.pts;
  ctx.save();
  ctx.strokeStyle = "rgba(255,200,46,0.9)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(255,200,46,0.8)";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(lSh.x, lSh.y);
  ctx.lineTo(lW.x, lW.y);
  ctx.moveTo(rSh.x, rSh.y);
  ctx.lineTo(rW.x, rW.y);
  ctx.stroke();
  drawStickerText(ctx, (lW.x + rW.x) / 2, (lW.y + rW.y) / 2 - 20, "ロマンス", pose.bodyW * 0.12, "rgba(255,200,46,0.95)", pose.angle);
  ctx.restore();
}

function fxHandBra(ctx, pose, w, h) {
  fxPoseBody(ctx, pose, w, h, 320);
  if (!pose?.pts?.lW || !pose?.pts?.rW || !pose?.pts?.lSh) return;
  const { lW, rW, lSh, rSh } = pose.pts;
  const cx = (lW.x + rW.x) / 2;
  const cy = (lSh.y + rSh.y) / 2 + pose.bodyH * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(pose.angle);
  ctx.strokeStyle = "rgba(255,120,180,0.9)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(255,45,120,0.7)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(-pose.bodyW * 0.12, -pose.bodyW * 0.08);
  ctx.lineTo(pose.bodyW * 0.12, pose.bodyW * 0.08);
  ctx.moveTo(pose.bodyW * 0.12, -pose.bodyW * 0.08);
  ctx.lineTo(-pose.bodyW * 0.12, pose.bodyW * 0.08);
  ctx.stroke();
  ctx.restore();
}

function fxTitanic(ctx, face, pose, w, h) {
  if (pose) {
    fxPoseBody(ctx, pose, w, h, 180);
    if (pose.pts?.lW && pose.pts?.rW && pose.pts?.lSh) {
      const { lW, rW, lSh, rSh } = pose.pts;
      ctx.save();
      ctx.strokeStyle = "rgba(184,255,46,0.85)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(184,255,46,0.7)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(lW.x, lW.y);
      ctx.lineTo(lSh.x - pose.bodyW * 0.5, lSh.y);
      ctx.moveTo(rW.x, rW.y);
      ctx.lineTo(rSh.x + pose.bodyW * 0.5, rSh.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (face) drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 180);
}

function fxDuoFaces(ctx, faces, w, h, leftEmoji, rightEmoji) {
  faces.forEach((face, i) => {
    drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, i === 0 ? 120 : 300);
    const emoji = i === 0 ? leftEmoji : rightEmoji;
    drawEmojiSticker(ctx, face.cx, face.cy - face.faceH * 0.65, emoji, face.faceW * 0.45, face.angle);
  });
  if (faces.length === 2) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,45,120,0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(faces[0].cx, faces[0].cy);
    ctx.lineTo(faces[1].cx, faces[1].cy);
    ctx.stroke();
    ctx.restore();
  }
}

function fxDuoPoses(ctx, poses, w, h, drawExtra) {
  poses.forEach((pose, i) => {
    fxPoseBody(ctx, pose, w, h, i === 0 ? 200 : 320);
  });
  if (drawExtra) drawExtra(ctx, poses, w, h);
}

function drawBottomHint(ctx, text, w, h) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 13px 'M PLUS Rounded 1c', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h * 0.945);
  ctx.restore();
}

function drawTrackedLevelFX(ctx, level, faceResult, poseResult, w, h, skipHint = false) {
  const guide = level.guide || "face-oval";
  const faces = (faceResult?.faceLandmarks ?? [])
    .slice(0, 2)
    .map((lm, i) => smoothFace(i, analyzeFace(lm, w, h)));
  const poses = (poseResult?.landmarks ?? [])
    .slice(0, 2)
    .map((lm, i) => {
      const raw = analyzePose(lm, w, h);
      return raw ? smoothPose(i, raw) : null;
    })
    .filter(Boolean);

  const face = faces[0] ?? null;
  const pose = poses[0] ?? null;
  const poseOrSynth = resolvePose(pose, face);
  let tracked = false;

  switch (guide) {
    case "face-oval":
      if (face) { fxFaceOval(ctx, face, w, h); tracked = true; }
      break;
    case "heian":
      if (face) { fxHeian(ctx, face, w, h); tracked = true; }
      break;
    case "salaryman":
      if (face) { fxSalaryman(ctx, face, w, h); tracked = true; }
      break;
    case "uffun":
      if (face || poseOrSynth) { fxUffun(ctx, face, poseOrSynth, w, h); tracked = true; }
      break;
    case "cockroach":
      if (face || poseOrSynth) { fxCockroach(ctx, face, poseOrSynth, w, h); tracked = true; }
      break;
    case "despair":
      if (face || poseOrSynth) { fxDespair(ctx, face, poseOrSynth, w, h); tracked = true; }
      break;
    case "press-mic":
      if (face) drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 45);
      if (face || poseOrSynth) {
        fxPressMic(ctx, pose, face, w, h);
        if (poseOrSynth) fxPoseBody(ctx, poseOrSynth, w, h, 45);
        tracked = true;
      }
      break;
    case "abnormal-run":
      if (poseOrSynth) { fxAbnormalRun(ctx, poseOrSynth, w, h); tracked = true; }
      break;
    case "otaku-romance":
      if (poseOrSynth) { fxOtakuRomance(ctx, poseOrSynth, w, h); tracked = true; }
      break;
    case "hand-bra":
      if (poseOrSynth) { fxHandBra(ctx, poseOrSynth, w, h); tracked = true; }
      break;
    case "titanic":
      if (face || poseOrSynth) { fxTitanic(ctx, face, poseOrSynth, w, h); tracked = true; }
      break;
    case "duo-split":
      if (faces.length) { fxDuoFaces(ctx, faces, w, h, "😂", "😭"); tracked = true; }
      break;
    case "light-dark":
      if (faces.length) { fxDuoFaces(ctx, faces, w, h, "☀️", "🌑"); tracked = true; }
      break;
    case "fusion":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          const a = ps[0].pts, b = ps[1].pts;
          if (a?.lW && b?.lW) {
            c.beginPath();
            c.moveTo(a.lW.x, a.lW.y);
            c.lineTo(b.lW.x, b.lW.y);
            c.strokeStyle = "rgba(255,200,46,0.9)";
            c.lineWidth = 3;
            c.stroke();
          }
          drawEmojiSticker(c, (ps[0].cx + ps[1].cx) / 2, (ps[0].cy + ps[1].cy) / 2, "💥", ps[0].bodyW * 0.2, 0);
        });
        tracked = true;
      }
      break;
    case "ashura":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          drawEmojiSticker(c, ps[1].cx, ps[1].cy - ps[1].bodyH * 0.2, "👹", ps[1].bodyW * 0.25, ps[1].angle);
          for (const p of ps) {
            for (const k of ["lW", "rW"]) {
              if (p.pts[k]) {
                c.beginPath();
                c.arc(p.pts[k].x, p.pts[k].y, p.bodyW * 0.06, 0, Math.PI * 2);
                c.strokeStyle = "rgba(255,100,100,0.8)";
                c.lineWidth = 2;
                c.stroke();
              }
            }
          }
        });
        tracked = true;
      }
      break;
    case "kabedon":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          const a = ps[0].pts, b = ps[1].pts;
          if (a?.lW && b?.nose) {
            c.beginPath();
            c.moveTo(a.lW.x, a.lW.y);
            c.lineTo(b.nose.x, b.nose.y);
            c.strokeStyle = "rgba(255,120,180,0.85)";
            c.lineWidth = 4;
            c.shadowColor = "rgba(255,45,120,0.6)";
            c.shadowBlur = 12;
            c.stroke();
          }
          c.fillStyle = "rgba(80,80,100,0.25)";
          c.fillRect(w * 0.72, 0, w * 0.28, h);
        });
        tracked = true;
      }
      break;
    case "alien":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          drawEmojiSticker(c, (ps[0].cx + ps[1].cx) / 2, ps[0].cy, "👽", ps[0].bodyW * 0.22, 0);
        });
        tracked = true;
      }
      break;
    case "dom-sub":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          const low = ps[0].cy > ps[1].cy ? ps[0] : ps[1];
          const high = low === ps[0] ? ps[1] : ps[0];
          drawEmojiSticker(c, high.cx, high.cy - high.bodyH * 0.45, "👑", high.bodyW * 0.2, 0);
        });
        tracked = true;
      }
      break;
    case "piggyback":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          drawEmojiSticker(c, ps[0].cx, ps[0].cy - ps[0].bodyH * 0.1, "🎒", ps[0].bodyW * 0.2, 0);
        });
        tracked = true;
      }
      break;
    case "sync-swim":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          c.fillStyle = "rgba(0,150,255,0.15)";
          c.fillRect(0, h * 0.75, w, h * 0.25);
        });
        tracked = true;
      }
      break;
    case "movie-poster":
      if (poses.length >= 2) {
        fxDuoPoses(ctx, poses, w, h, (c, ps) => {
          c.save();
          c.strokeStyle = "rgba(255,200,46,0.6)";
          c.lineWidth = 3;
          c.strokeRect(w * 0.06, h * 0.08, w * 0.88, h * 0.78);
          c.restore();
        });
        tracked = true;
      }
      break;
    default:
      if (face) { fxFaceOval(ctx, face, w, h); tracked = true; }
      else if (poseOrSynth) { fxPoseBody(ctx, poseOrSynth, w, h); tracked = true; }
  }

  const hint = level.players >= 2
    ? (tracked ? "👥 2人検知中！" : "👥 2人を画面に入れて！")
    : (tracked
      ? (level.type === "pose" || level.type === "both" ? "✨ AR追従中（上半身を映すと精度UP）" : "✨ AR追従中")
      : (level.type === "pose" || level.type === "both"
        ? "少し離れて上半身〜腰を映して！"
        : "顔を枠に入れて！"));
  if (!skipHint) drawBottomHint(ctx, hint, w, h);

  return tracked;
}

const SHARE_FILTER_TINT = {
  "face-oval": "rgba(0,245,255,0.07)",
  "heian": "rgba(120,60,180,0.14)",
  "salaryman": "rgba(80,100,140,0.12)",
  "press-mic": "rgba(30,30,45,0.16)",
  "uffun": "rgba(255,120,180,0.1)",
  "cockroach": "rgba(60,80,40,0.12)",
  "despair": "rgba(20,30,80,0.18)",
  "abnormal-run": "rgba(180,60,40,0.1)",
  "otaku-romance": "rgba(255,200,80,0.1)",
  "hand-bra": "rgba(255,160,200,0.1)",
  "titanic": "rgba(100,180,255,0.12)"
};

function applyShareFilter(ctx, level, w, h) {
  const tint = SHARE_FILTER_TINT[level.guide] || "rgba(0,245,255,0.06)";
  ctx.save();
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.15, w / 2, h * 0.42, h * 0.92);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawShareStamp(ctx, level, w, h) {
  const barH = Math.max(h * 0.11, 56);
  ctx.save();
  const grad = ctx.createLinearGradient(0, h - barH * 1.3, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - barH * 1.35, w, barH * 1.35);

  const titleSize = Math.round(Math.min(w * 0.048, 42));
  const subSize = Math.round(Math.min(w * 0.03, 26));
  ctx.font = `800 ${titleSize}px 'M PLUS Rounded 1c', sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.fillText(`${level.emoji} ${level.title}`, w * 0.05, h - barH * 0.52);
  ctx.font = `700 ${subSize}px 'Share Tech Mono', monospace`;
  ctx.fillStyle = "rgba(184,255,46,0.95)";
  ctx.fillText(`LEVEL ${level.id} CLEAR — POSE`, w * 0.05, h - barH * 0.18);
  ctx.restore();
}

/** クリア時シェア用 — カメラ映像 + ARエフェクト + フィルター */
function captureStyledShareFrame(video, level, faceResult, poseResult) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const canvas = document.createElement("canvas");
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.translate(vw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, vw, vh);
  ctx.restore();

  resetFXSmoothing();
  drawTrackedLevelFX(ctx, level, faceResult, poseResult, vw, vh, true);
  applyShareFilter(ctx, level, vw, vh);
  drawShareStamp(ctx, level, vw, vh);

  return canvas.toDataURL("image/jpeg", 0.88);
}
