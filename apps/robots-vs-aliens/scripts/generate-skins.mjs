import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Bake the finishes once so the WebView paints every unit with one sprite draw.
// RGB ramps are indexed by the original luminance. Alpha and sprite bounds are preserved.
const finishes = [
  {
    name: 'cobalt',
    units: ['pulse', 'spark', 'frost', 'nova', 'bastion'],
    ramp: [
      [0, 3, 7, 13],
      [46, 10, 22, 40],
      [90, 21, 51, 91],
      [140, 43, 95, 148],
      [180, 85, 143, 196],
      [213, 153, 199, 222],
      [255, 237, 249, 251],
    ],
  },
  {
    name: 'ember',
    units: ['scout', 'runner', 'brute', 'spitter', 'overlord'],
    ramp: [
      [0, 10, 4, 13],
      [50, 61, 31, 38],
      [92, 132, 57, 49],
      [135, 193, 87, 55],
      [180, 235, 135, 61],
      [215, 255, 187, 95],
      [255, 255, 241, 179],
    ],
  },
];

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  const page = await browser.newPage();
  await mkdir('src/assets/skins', { recursive: true });
  for (const { name, units, ramp } of finishes) {
    for (const kind of units) {
      const original = await readFile(`src/assets/units/${kind}.webp`);
      const result = await page.evaluate(
        async ({ data, ramp, name }) => {
          const image = new Image();
          image.src = 'data:image/webp;base64,' + data;
          await image.decode();
          const surface = document.createElement('canvas');
          surface.width = image.naturalWidth;
          surface.height = image.naturalHeight;
          const c = surface.getContext('2d');
          c.drawImage(image, 0, 0);
          const frame = c.getImageData(0, 0, surface.width, surface.height);
          const pixels = frame.data;
          const palette = Array.from({ length: 256 }, (_, value) => {
            const upper = ramp.findIndex((stop) => stop[0] >= value);
            const a = ramp[Math.max(0, upper - 1)];
            const b = ramp[upper];
            const blend = (value - a[0]) / Math.max(1, b[0] - a[0]);
            return a.slice(1).map((channel, i) => channel + (b[i + 1] - channel) * blend);
          });
          for (let i = 0; i < pixels.length; i += 4) {
            if (!pixels[i + 3]) continue;
            const r = pixels[i],
              g = pixels[i + 1],
              b = pixels[i + 2];
            const light = Math.round(r * 0.213 + g * 0.715 + b * 0.072);
            // Retain bright robot emitters and shoulder insignia over the ceramic plates.
            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
            const retain =
              name === 'cobalt'
                ? Math.min(0.88, Math.max(0, (chroma - 35) / 75)) * Math.min(1, light / 140)
                : 0;
            for (let channel = 0; channel < 3; channel++) {
              pixels[i + channel] =
                pixels[i + channel] * retain + palette[light][channel] * (1 - retain);
            }
          }
          c.putImageData(frame, 0, 0);
          return surface.toDataURL('image/webp', 0.9).split(',')[1];
        },
        { data: original.toString('base64'), name, ramp },
      );
      await writeFile(`src/assets/skins/${name}-${kind}.webp`, Buffer.from(result, 'base64'));
    }
  }
} finally {
  await browser.close();
}
