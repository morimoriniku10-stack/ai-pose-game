import { cpSync, createWriteStream, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wasmSrc = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const wasmDest = join(root, "wasm");
const modelsDest = join(root, "models");

const MODELS = [
  {
    name: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
  },
  {
    name: "pose_landmarker_lite.task",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker.task"
  }
];

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ダウンロード失敗 (${res.status}): ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

if (!existsSync(wasmSrc)) {
  console.error("[build] @mediapipe/tasks-vision が見つかりません。npm install を実行してください。");
  process.exit(1);
}

mkdirSync(wasmDest, { recursive: true });
cpSync(wasmSrc, wasmDest, { recursive: true });
console.log("[build] MediaPipe WASM を /wasm にコピーしました");

mkdirSync(modelsDest, { recursive: true });

for (const model of MODELS) {
  const dest = join(modelsDest, model.name);
  if (existsSync(dest)) {
    console.log(`[build] モデルスキップ（既存）: ${model.name}`);
    continue;
  }
  try {
    console.log(`[build] モデルダウンロード中: ${model.name}`);
    await downloadFile(model.url, dest);
    console.log(`[build] モデル配置完了: ${model.name}`);
  } catch (err) {
    console.warn(`[build] モデルダウンロード失敗（CDNフォールバック）: ${model.name}`, err.message);
  }
}

console.log("[build] セットアップ完了");
