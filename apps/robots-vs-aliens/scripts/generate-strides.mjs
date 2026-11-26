import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import rig from '../src/game/gaits.json' with { type: 'json' };

// Export the gait once. Combat samples one rectangle from the selected brood's sheet.
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  const page = await browser.newPage();
  await mkdir('src/assets/motion', { recursive: true });
  for (const skin of ['standard', 'ember', 'riftborn']) {
    const sources = {};
    for (const kind of Object.keys(rig.species)) {
      const path = skin === 'standard' ? `units/${kind}` : `skins/${skin}-${kind}`;
      const bytes = await readFile(`src/assets/${path}.webp`);
      sources[kind] = 'data:image/webp;base64,' + bytes.toString('base64');
    }
    const encoded = await page.evaluate(
      async ({ rig, sources }) => {
        const { frames, width, height, referenceSize, footPadding } = rig;
        const cell = document.createElement('canvas');
        cell.width = width;
        cell.height = height;
        const c = cell.getContext('2d', { willReadFrequently: true });
        const atlas = document.createElement('canvas');
        atlas.width = frames * width;
        atlas.height = Object.keys(sources).length * height;
        const out = atlas.getContext('2d');
        for (const [kind, src] of Object.entries(sources)) {
          const gait = rig.species[kind];
          const image = new Image();
          image.src = src;
          await image.decode();
          const scale = Math.min(
            (referenceSize * 1.16) / image.width,
            (referenceSize * 0.99) / image.height,
          );
          const w = image.width * scale;
          const h = image.height * scale;
          const feet = height - footPadding;
          const left = (width - w) / 2;
          c.clearRect(0, 0, width, height);
          c.drawImage(image, left, feet - h, w, h);
          const rest = c.getImageData(0, 0, width, height);
          const pixels = rest.data;
          for (let frame = 0; frame < frames; frame++) {
            const phase = (frame * Math.PI * 2) / frames;
            const pose = new ImageData(new Uint8ClampedArray(pixels), width, height);
            // Keep the carapace rigid. Opposing foot groups swing and lift below the hips.
            const hips = feet - h * 0.47;
            for (let y = Math.ceil(hips); y < height; y++) {
              const t = Math.min(1, (y - hips) / (feet - hips));
              const weight = t * t * (3 - 2 * t);
              for (let x = 0; x < width; x++) {
                const group = Math.sin(((x - left) / w) * Math.PI * 2);
                const sx = x - Math.sin(phase) * group * weight * w * gait.swing;
                const sy = y + Math.max(0, Math.cos(phase) * group) * weight * h * gait.footLift;
                const dest = (y * width + x) * 4;
                const px = Math.floor(sx);
                const py = Math.floor(sy);
                if (px < 0 || px + 1 >= width || py + 1 >= height) {
                  pose.data.fill(0, dest, dest + 4);
                  continue;
                }
                // Bilinear sampling in premultiplied alpha keeps thin quills free of dark seams.
                let alpha = 0,
                  red = 0,
                  green = 0,
                  blue = 0;
                for (let dy = 0; dy < 2; dy++) {
                  for (let dx = 0; dx < 2; dx++) {
                    const index = ((py + dy) * width + px + dx) * 4;
                    const coverage =
                      pixels[index + 3] *
                      (1 - Math.abs(sx - px - dx)) *
                      (1 - Math.abs(sy - py - dy));
                    alpha += coverage;
                    red += pixels[index] * coverage;
                    green += pixels[index + 1] * coverage;
                    blue += pixels[index + 2] * coverage;
                  }
                }
                pose.data[dest] = alpha ? red / alpha : 0;
                pose.data[dest + 1] = alpha ? green / alpha : 0;
                pose.data[dest + 2] = alpha ? blue / alpha : 0;
                pose.data[dest + 3] = alpha;
              }
            }
            out.putImageData(pose, frame * width, gait.row * height);
          }
        }
        return atlas.toDataURL('image/webp', 0.84).split(',')[1];
      },
      { rig, sources },
    );
    const path = `src/assets/motion/${skin}-stride.webp`;
    const data = Buffer.from(encoded, 'base64');
    await writeFile(path, data);
    console.log(`${path} · ${data.length} bytes`);
  }
} finally {
  await browser.close();
}
