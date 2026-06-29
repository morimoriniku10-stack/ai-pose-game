/**
 * 全レベルの整合性チェック（detector / guide / モデル要件）
 * node scripts/validate-levels.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// levels.js を VM で評価
const levelsSrc = readFileSync(join(root, "levels.js"), "utf8");
const fn = new Function(`${levelsSrc}; return { LEVELS, DETECTORS, levelNeedsFaceModel, levelNeedsPoseModel, levelUsesDualDetection };`);
const { LEVELS, DETECTORS, levelNeedsFaceModel, levelNeedsPoseModel, levelUsesDualDetection } = fn();

const arFx = readFileSync(join(root, "ar-fx.js"), "utf8");
const guideCases = [...arFx.matchAll(/case "([^"]+)":/g)].map(m => m[1]);

const errors = [];

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
}

const ids = LEVELS.map(l => l.id);
if (ids.some((id, i) => id !== i + 1)) {
  errors.push("レベル id が 1..N で連番ではない");
}

if (errors.length) {
  console.error("❌ レベル検証失敗:\n" + errors.map(e => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`✅ 全 ${LEVELS.length} レベル OK`);
console.log("モデル要件サマリ:");
for (const level of LEVELS) {
  const face = levelNeedsFaceModel(level) ? "顔" : "—";
  const pose = levelNeedsPoseModel(level) ? "ポーズ必須" : (levelUsesDualDetection(level) ? "ポーズ任意" : "—");
  console.log(`  L${String(level.id).padStart(2)} ${level.type.padEnd(4)} ${face.padEnd(2)} ${pose.padEnd(8)} ${level.title}`);
}
