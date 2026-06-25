import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = join(root, "wasm");

if (!existsSync(src)) {
  console.error("[build] @mediapipe/tasks-vision が見つかりません。npm install を実行してください。");
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[build] MediaPipe WASM を /wasm にコピーしました");
