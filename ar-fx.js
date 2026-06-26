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

function analyzeFace(landmarks, w, h) {
  const le = fxPt(landmarks[33], w, h);
  const re = fxPt(landmarks[263], w, h);
  const forehead = fxPt(landmarks[10], w, h);
  const chin = fxPt(landmarks[152], w, h);
  const nose = fxPt(landmarks[1], w, h);
  const mouthL = fxPt(landmarks[61], w, h);
  const mouthR = fxPt(landmarks[291], w, h);
  const eyeMid = fxMid(le, re);
  const cx = fxLerp(eyeMid.x, nose.x, 0.35);
  const cy = fxLerp(eyeMid.y, (forehead.y + chin.y) / 2, 0.2);
  const eyeDist = Math.max(fxDist(le, re), 24);
  const faceH = Math.max(fxDist(forehead, chin), eyeDist * 1.1);
  const faceW = eyeDist * 1.45;
  const angle = Math.atan2(re.y - le.y, re.x - le.x);
  const depth = nose.z ?? 0;
  const scale = eyeDist / 90;

  return {
    cx, cy, angle, scale, faceW, faceH, depth,
    lm: landmarks,
    pts: { le, re, forehead, chin, nose, mouthL, mouthR, eyeMid }
  };
}

function analyzePose(landmarks, w, h) {
  const nose = landmarks[0], lSh = landmarks[11], rSh = landmarks[12];
  const lHip = landmarks[23], rHip = landmarks[24];
  if (!nose || !lSh || !rSh) return null;
  const vis = lm => (lm.visibility ?? 1) >= 0.4;
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
  const hipY = pts.lHip && pts.rHip ? (pts.lHip.y + pts.rHip.y) / 2 : shoulderY + w * 0.25;
  const cy = shoulderY + (hipY - shoulderY) * 0.35;
  const bodyW = fxDist(lShP, rShP) * 2.2;
  const bodyH = Math.max(hipY - shoulderY + bodyW * 0.5, bodyW);
  const angle = Math.atan2(rShP.y - lShP.y, rShP.x - lShP.x);
  const scale = bodyW / 220;

  return { cx, cy, angle, scale, bodyW, bodyH, lm: landmarks, pts };
}

function withTransform(ctx, t, fn) {
  ctx.save();
  ctx.translate(t.cx, t.cy);
  ctx.rotate(t.angle);
  const depthScale = 1 - (t.depth ?? 0) * 0.35;
  ctx.scale(t.scale * depthScale, t.scale * depthScale);
  fn(ctx, t);
  ctx.restore();
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

function drawFaceWireMesh(ctx, landmarks, w, h, hue = 180) {
  const mainColor = `hsla(${hue},100%,65%,0.88)`;
  drawNeonPath(ctx, c => faceOvalPath(c, landmarks, w, h), mainColor, 2.5, 18);

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.translate(-1.2, 0.6);
  drawNeonPath(ctx, c => faceOvalPath(c, landmarks, w, h), "rgba(255,45,120,0.55)", 1.2, 6);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.translate(1.2, -0.4);
  drawNeonPath(ctx, c => faceOvalPath(c, landmarks, w, h), "rgba(0,245,255,0.55)", 1.2, 6);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.15;
  faceOvalPath(ctx, landmarks, w, h);
  ctx.fillStyle = `hsla(${hue},100%,60%,0.3)`;
  ctx.fill();
  ctx.restore();

  const le = fxPt(landmarks[33], w, h);
  const re = fxPt(landmarks[263], w, h);
  const nose = fxPt(landmarks[1], w, h);
  ctx.save();
  ctx.strokeStyle = "rgba(0,245,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(le.x, le.y);
  ctx.lineTo(nose.x, nose.y);
  ctx.lineTo(re.x, re.y);
  ctx.stroke();
  ctx.restore();
}

function drawFaceWireMeshWithScan(ctx, landmarks, w, h, face, hue) {
  drawFaceWireMesh(ctx, landmarks, w, h, hue);
  if (face) drawScanSweep(ctx, face);
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
  withTransform(ctx, face, (c, f) => {
    const hw = f.faceW * 0.55;
    const hh = f.faceH * 0.32;
    c.fillStyle = "rgba(60,20,90,0.55)";
    c.strokeStyle = "rgba(255,220,120,0.9)";
    c.lineWidth = 2.5;
    c.shadowColor = "rgba(255,200,80,0.8)";
    c.shadowBlur = 18;
    c.beginPath();
    c.ellipse(0, -f.faceH * 0.62, hw, hh, 0, Math.PI, 0);
    c.lineTo(hw * 0.85, -f.faceH * 0.35);
    c.quadraticCurveTo(0, -f.faceH * 0.28, -hw * 0.85, -f.faceH * 0.35);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-hw * 0.15, -f.faceH * 0.35);
    c.lineTo(hw * 0.15, -f.faceH * 0.35);
    c.strokeStyle = "rgba(255,220,120,0.6)";
    c.stroke();
  });
}

function fxSalaryman(ctx, face, w, h) {
  drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 0);
  const { le, re, mouthL, mouthR, chin } = face.pts;
  const mouthMid = fxMid(mouthL, mouthR);
  const eyeR = face.faceW * 0.11;
  for (const eye of [le, re]) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,80,80,0.9)";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,20,30,0.85)";
    ctx.fill();
    ctx.restore();
  }
  drawStickerText(ctx, mouthMid.x, mouthMid.y + face.faceH * 0.06, "へ", face.faceW * 0.28, "rgba(255,90,90,0.95)", face.angle * 0.3);
  drawStickerText(ctx, chin.x, chin.y + face.faceH * 0.12, "限界", face.faceW * 0.16, "rgba(255,200,46,0.8)", face.angle);
}

function fxFaceOval(ctx, face, w, h) {
  drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 160);
  withTransform(ctx, face, (c, f) => {
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
    drawEmojiSticker(ctx, forehead.x + face.faceW * 0.35, forehead.y - face.faceH * 0.15, "❤️", face.faceW * 0.35, face.angle);
    if (pose?.pts?.rW || pose?.pts?.lW) {
      const wrist = pose.pts.rW || pose.pts.lW;
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
  if (face) drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 30);
  if (pose?.pts) {
    const { lW, rW, nose } = pose.pts;
    const roachX = Math.min(lW?.x ?? nose.x, rW?.x ?? nose.x) - pose.bodyW * 0.15;
    const roachY = ((lW?.y ?? 0) + (rW?.y ?? 0)) / 2 || nose.y;
    drawEmojiSticker(ctx, roachX, roachY, "🪳", pose.bodyW * 0.18, 0);
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
  if (pose?.pts) {
    const { lW, rW, nose } = pose.pts;
    if (lW && rW && nose) {
      ctx.save();
      ctx.strokeStyle = "rgba(100,120,255,0.75)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(100,120,255,0.6)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(lW.x, lW.y);
      ctx.lineTo(nose.x - pose.bodyW * 0.08, nose.y);
      ctx.lineTo(rW.x, rW.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (face) drawFaceWireMeshWithScan(ctx, face.lm, w, h, face, 240);
}

function fxPressMic(ctx, pose, w, h) {
  if (!pose?.pts?.nose) return;
  const { nose, lSh, rSh } = pose.pts;
  const micX = nose.x;
  const micTop = nose.y + pose.bodyH * 0.08;
  const micBot = Math.min(h * 0.92, micTop + pose.bodyH * 0.55);
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
  ctx.arc(micX, micTop, pose.bodyW * 0.07, 0, Math.PI * 2);
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
    ctx.lineTo(micX, micTop + pose.bodyH * 0.2);
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

function drawTrackedLevelFX(ctx, level, faceResult, poseResult, w, h) {
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
      if (face || pose) { fxUffun(ctx, face, pose, w, h); tracked = true; }
      break;
    case "cockroach":
      if (face || pose) { fxCockroach(ctx, face, pose, w, h); tracked = true; }
      break;
    case "despair":
      if (face || pose) { fxDespair(ctx, face, pose, w, h); tracked = true; }
      break;
    case "press-mic":
      if (pose) { fxPressMic(ctx, pose, w, h); fxPoseBody(ctx, pose, w, h, 45); tracked = true; }
      break;
    case "abnormal-run":
      if (pose) { fxAbnormalRun(ctx, pose, w, h); tracked = true; }
      break;
    case "otaku-romance":
      if (pose) { fxOtakuRomance(ctx, pose, w, h); tracked = true; }
      break;
    case "hand-bra":
      if (pose) { fxHandBra(ctx, pose, w, h); tracked = true; }
      break;
    case "titanic":
      if (face || pose) { fxTitanic(ctx, face, pose, w, h); tracked = true; }
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
      else if (pose) { fxPoseBody(ctx, pose, w, h); tracked = true; }
  }

  const hint = level.players >= 2
    ? (tracked ? "👥 2人検知中！" : "👥 2人を画面に入れて！")
    : (tracked ? "✨ AR追従中" : "顔・体を枠に入れて！");
  drawBottomHint(ctx, hint, w, h);

  return tracked;
}
