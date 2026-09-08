import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const inputPath = path.join(root, "public", "assets", "logo.jpeg");
const outputPath = path.join(root, "public", "assets", "logo.png");

const BLACK_THRESHOLD = 58;
const EDGE_SAMPLE_STEP = 1;

function isBackgroundTone(r, g, b) {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance <= BLACK_THRESHOLD;
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = Uint8ClampedArray.from(data);
const visited = new Uint8Array(width * height);
const queue = [];

const indexOf = (x, y) => (y * width + x) * channels;
const visitKey = (x, y) => y * width + x;

function trySeed(x, y) {
  const key = visitKey(x, y);
  if (visited[key]) {
    return;
  }

  const idx = indexOf(x, y);
  const r = pixels[idx];
  const g = pixels[idx + 1];
  const b = pixels[idx + 2];

  if (!isBackgroundTone(r, g, b)) {
    return;
  }

  visited[key] = 1;
  queue.push([x, y, r, g, b]);
}

for (let x = 0; x < width; x += EDGE_SAMPLE_STEP) {
  trySeed(x, 0);
  trySeed(x, height - 1);
}

for (let y = 0; y < height; y += EDGE_SAMPLE_STEP) {
  trySeed(0, y);
  trySeed(width - 1, y);
}

const MAX_COLOR_DRIFT = 55;

while (queue.length > 0) {
  const [x, y, seedR, seedG, seedB] = queue.pop();
  const idx = indexOf(x, y);

  pixels[idx + 3] = 0;

  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (const [nx, ny] of neighbors) {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
      continue;
    }

    const nKey = visitKey(nx, ny);
    if (visited[nKey]) {
      continue;
    }

    const nIdx = indexOf(nx, ny);
    const r = pixels[nIdx];
    const g = pixels[nIdx + 1];
    const b = pixels[nIdx + 2];

    if (
      isBackgroundTone(r, g, b) &&
      colorDistance(r, g, b, seedR, seedG, seedB) <= MAX_COLOR_DRIFT
    ) {
      visited[nKey] = 1;
      queue.push([nx, ny, seedR, seedG, seedB]);
    }
  }
}

await sharp(Buffer.from(pixels), {
  raw: { width, height, channels },
})
  .png()
  .toFile(outputPath);

console.log(`Saved transparent logo to ${outputPath}`);
