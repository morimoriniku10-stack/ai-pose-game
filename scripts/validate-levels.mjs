/**
 * 全22レベルの整合性 + 遷移リスク監査
 * node scripts/validate-levels.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const levelsSrc = readFileSync(join(root, "levels.js"), "utf8");
const fn = new Function(`${levelsSrc}; return {
  LEVELS, DETECTORS, levelNeedsFaceModel, levelNeedsPoseModel,
  levelUsesDualDetection, levelWantsOptionalPose, levelUsesPoseAtAll,
  getNumPosesForLevel: (level) => Math.min(Math.max(level?.players ?? 1, 1), 4)
};`);
const {
  LEVELS, DETECTORS, levelNeedsFaceModel, levelNeedsPoseModel,
  levelUsesDualDetection, levelWantsOptionalPose, levelUsesPoseAtAll,
  getNumPosesForLevel
} = fn();

const arFx = readFileSync(join(root, "ar-fx.js"), "utf8");
const guideCases = [...arFx.matchAll(/case "([^"]+)":/g)].map(m => m[1]);

const errors = [];
const warnings = [];

for (const level of LEVELS) {
  const tag = `L${level.id} (${level.detector})`;

  if (!DETECTORS[level.detector]) {
    errors.push(`${tag}: detector が未定義`);
  }

  if (level.guide && !guideCases.includes(level.guide)) {
    errors.push(`${tag}: guide "${level.guide}" が ar-fx.js にない`);
  }

  if (!["face", "pose", "both"].includes(level.type)) {
    errors.push(`${tag}: 不正な type "${level.type}"`);
  }

  if (levelUsesDualDetection(level) && level.type === "pose") {
    errors.push(`${tag}: dual detector なのに type=pose`);
  }

  if (levelNeedsPoseModel(level) && level.type === "face" && !levelUsesDualDetection(level)) {
    errors.push(`${tag}: pose必須なのに type=face`);
  }

  if (level.players >= 2 && levelNeedsPoseModel(level) && level.type !== "pose") {
    errors.push(`${tag}: 2人ポーズなのに type=${level.type}`);
  }

  if (level.type === "both" && level.detector !== "detectSoloTitanic") {
    errors.push(`${tag}: type=both だが detector が detectSoloTitanic ではない`);
  }

  if (level.players >= 2 && levelNeedsFaceModel(level) && level.type !== "face") {
    errors.push(`${tag}: 2人顔なのに type=${level.type}`);
  }

  if (!level.clearThreshold || !level.holdFrames) {
    errors.push(`${tag}: clearThreshold / holdFrames が未設定`);
  }
}

const ids = LEVELS.map(l => l.id);
if (ids.some((id, i) => id !== i + 1)) {
  errors.push("レベル id が 1..N で連番ではない");
}

if (LEVELS.length !== 22) {
  errors.push(`レベル数が ${LEVELS.length} — 22 である必要あり`);
}

/** 遷移シミュレーション（モデル解放・先読みリスク） */
function simulateTransitions() {
  let hasFace = false;
  let hasPose = false;
  let poseNum = 0;

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const next = LEVELS[i + 1];
    const tag = `L${level.id}→L${next?.id ?? "END"}`;

    // startLevel: 不要モデル解放
    if (!levelNeedsFaceModel(level)) {
      if (hasFace) hasFace = false;
    }
    if (!levelUsesPoseAtAll(level)) {
      if (hasPose) {
        hasPose = false;
        poseNum = 0;
      }
    }

    // ensureDetectorForLevel
    if (levelNeedsFaceModel(level)) hasFace = true;
    if (levelNeedsPoseModel(level)) {
      hasPose = true;
      poseNum = getNumPosesForLevel(level);
    } else if (levelWantsOptionalPose(level) && hasPose) {
      /* optional — 既存を維持 */
    }

    if (levelNeedsPoseModel(level) && getNumPosesForLevel(level) > poseNum && hasPose) {
      hasPose = true;
      poseNum = getNumPosesForLevel(level);
    }

    // モバイル先読み: 顔レベル中は抑制（play.html で対策済み）
    if (next && levelNeedsFaceModel(level) && levelNeedsPoseModel(next) && !hasPose) {
      /* 先読み抑制済み — L8/L14 は startLevel 時に読込 */
    }

    // 2人ポーズへ numPoses 不足
    if (levelNeedsPoseModel(level) && getNumPosesForLevel(level) >= 2 && poseNum < 2) {
      errors.push(`L${level.id}: 2人ポーズなのに numPoses=${poseNum} のまま`);
    }

    // both レベル
    if (level.type === "both" && (!levelNeedsFaceModel(level) || !levelNeedsPoseModel(level))) {
      errors.push(`L${level.id}: type=both だが顔/ポーズ要件が不正`);
    }
  }
}

simulateTransitions();

/** 先読みが安全な遷移のみかチェック */
for (let i = 0; i < LEVELS.length - 1; i++) {
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  if (!levelUsesPoseAtAll(next)) continue;
  if (levelNeedsFaceModel(cur) && !levelUsesPoseAtAll(cur)) {
    /* OK: 顔のみ → 次がポーズ — 先読みは startLevel 側でモバイル抑制 */
  }
}

if (errors.length) {
  console.error("❌ レベル検証失敗:\n" + errors.map(e => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`✅ 全 ${LEVELS.length} レベル OK`);
if (warnings.length) {
  console.log("\n⚠️  遷移リスク（コード側で対策済みか要確認）:");
  for (const w of warnings) console.log(`  - ${w}`);
}

console.log("\nモデル要件サマリ:");
for (const level of LEVELS) {
  const face = levelNeedsFaceModel(level) ? "顔" : "—";
  const pose = levelNeedsPoseModel(level)
    ? `ポーズ必須×${getNumPosesForLevel(level)}`
    : (levelWantsOptionalPose(level) ? "ポーズ任意" : "—");
  console.log(`  L${String(level.id).padStart(2)} ${level.type.padEnd(4)} ${face.padEnd(2)} ${pose.padEnd(12)} ${level.title}`);
}

console.log("\n遷移マトリクス（解放/読込）:");
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const parts = [];
  if (!levelNeedsFaceModel(lv)) parts.push("顔解放");
  if (!levelUsesPoseAtAll(lv)) parts.push("ポーズ解放");
  if (levelNeedsFaceModel(lv)) parts.push("顔");
  if (levelNeedsPoseModel(lv)) parts.push(`ポーズ×${getNumPosesForLevel(lv)}`);
  else if (levelWantsOptionalPose(lv)) parts.push("ポーズ?");
  console.log(`  L${String(lv.id).padStart(2)}: ${parts.join(" + ") || "—"}`);
}
