import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import rig from '../src/game/gaits.json' with { type: 'json' };
import { buildPoses } from './alien-rigs.mjs';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  const page = await browser.newPage();
  await page.exposeFunction('buildAlienPoses', buildPoses);
  await mkdir('src/assets/motion', { recursive: true });
  const layouts = {};
  for (const skin of ['standard', 'ember', 'riftborn']) {
    const sources = {};
    for (const kind of Object.keys(rig.species)) {
      const path = skin === 'standard' ? `units/${kind}` : `skins/${skin}-${kind}`;
      const bytes = await readFile(`src/assets/${path}.webp`);
      sources[kind] = 'data:image/webp;base64,' + bytes.toString('base64');
    }
    const { encoded, layout } = await page.evaluate(
      async ({ rig, sources, skin }) => {
        const { width, height, frames, referenceSize, footPadding } = rig;
        const cell = document.createElement('canvas');
        cell.width = width;
        cell.height = height;
        const c = cell.getContext('2d', { willReadFrequently: true });
        const sprites = [];

        // Inverse rigid moving least squares. Near each joint its rotation carries the
        // painted limb with it; neighbouring joints blend continuously across the shell.
        function warp(rest, pins, left, top) {
          const pose = c.createImageData(width, height);
          const src = rest.data,
            dst = pose.data;
          const landmarks = pins.map(([sx, sy, dx, dy]) => ({
            sx,
            sy,
            dx,
            dy,
            dot: dx * sx + dy * sy,
            cross: dx * sy - dy * sx,
          }));
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const qx = x + 0.5 - left,
                qy = y + 0.5 - top;
              let sum = 0,
                sx = 0,
                sy = 0,
                dx = 0,
                dy = 0,
                dot = 0,
                cross = 0;
              for (const p of landmarks) {
                const distance = (qx - p.dx) ** 2 + (qy - p.dy) ** 2 + 0.1;
                const weight = 1 / (distance * distance);
                sum += weight;
                sx += weight * p.sx;
                sy += weight * p.sy;
                dx += weight * p.dx;
                dy += weight * p.dy;
                dot += weight * p.dot;
                cross += weight * p.cross;
              }
              sx /= sum;
              sy /= sum;
              dx /= sum;
              dy /= sum;
              dot = dot / sum - dx * sx - dy * sy;
              cross = cross / sum - dx * sy + dy * sx;
              const norm = Math.hypot(dot, cross);
              const cos = norm > 1e-8 ? dot / norm : 1,
                sin = norm > 1e-8 ? cross / norm : 0;
              const u = left - 0.5 + sx + cos * (qx - dx) - sin * (qy - dy);
              const v = top - 0.5 + sy + sin * (qx - dx) + cos * (qy - dy);
              const px = Math.floor(u),
                py = Math.floor(v);
              if (px < 0 || py < 0 || px + 1 >= width || py + 1 >= height) continue;
              // Bilinear sampling in premultiplied alpha preserves thin quills on a dark deck.
              let a = 0,
                red = 0,
                green = 0,
                blue = 0;
              for (let j = 0; j < 2; j++) {
                for (let i = 0; i < 2; i++) {
                  const at = ((py + j) * width + px + i) * 4;
                  const coverage =
                    src[at + 3] * (1 - Math.abs(u - px - i)) * (1 - Math.abs(v - py - j));
                  a += coverage;
                  red += src[at] * coverage;
                  green += src[at + 1] * coverage;
                  blue += src[at + 2] * coverage;
                }
              }
              if (a < 3) continue;
              const at = (y * width + x) * 4;
              dst[at] = red / a;
              dst[at + 1] = green / a;
              dst[at + 2] = blue / a;
              dst[at + 3] = a;
            }
          }
          return pose;
        }
        // Keep a transparent pixel around the illustrated silhouette. The offsets
        // preserve the common ground line when tightly cropped frames are packed.
        function trim(pose) {
          let left = width,
            right = 0,
            top = height,
            bottom = 0;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (pose.data[(y * width + x) * 4 + 3] < 8) continue;
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
          if (left < 1 || top < 1 || right >= width - 1 || bottom >= height - 1)
            throw Error('A pose touches the baking canvas edge');
          return { left: left - 1, top: top - 1, w: right - left + 3, h: bottom - top + 3 };
        }
        for (const [kind, src] of Object.entries(sources)) {
          const image = new Image();
          image.src = src;
          await image.decode();
          const scale = Math.min(
            (referenceSize * 1.16) / image.width,
            (referenceSize * 0.99) / image.height,
          );
          const w = image.width * scale,
            h = image.height * scale;
          const left = (width - w) / 2,
            top = height - footPadding - h;
          c.clearRect(0, 0, width, height);
          c.drawImage(image, left, top, w, h);
          const rest = c.getImageData(0, 0, width, height);
          const poses = await window.buildAlienPoses(kind, skin, w, h, frames);
          for (const [index, pins] of poses.entries()) {
            const pose = warp(rest, pins, left, top);
            sprites.push({
              pose,
              index: rig.species[kind].row * frames * 2 + index,
              ...trim(pose),
            });
          }
        }
        const atlas = document.createElement('canvas');
        atlas.width = 1536;
        let x = 0,
          y = 0,
          shelfHeight = 0;
        const cells = new Array(sprites.length);
        for (const sprite of sprites.sort((a, b) => b.h - a.h)) {
          const { w, h, left, top } = sprite;
          if (x + w > atlas.width) {
            x = 0;
            y += shelfHeight;
            shelfHeight = 0;
          }
          cells[sprite.index] = [x, y, w, h, left - width / 2, top - (height - footPadding)];
          x += w + 1;
          shelfHeight = Math.max(shelfHeight, h + 1);
        }
        atlas.height = y + shelfHeight;
        const out = atlas.getContext('2d');
        for (const { pose, index, left, top, w, h } of sprites) {
          const [x, y] = cells[index];
          out.putImageData(pose, x - left, y - top, left, top, w, h);
        }
        return {
          encoded: atlas.toDataURL('image/webp', 0.84).split(',')[1],
          layout: { width: atlas.width, height: atlas.height, cells },
        };
      },
      { rig, sources, skin },
    );
    const path = `src/assets/motion/${skin}-stride.webp`;
    const data = Buffer.from(encoded, 'base64');
    await writeFile(path, data);
    layouts[skin] = layout;
    console.log(`${path} · ${data.length} bytes`);
  }
  const manifest = await format(JSON.stringify(layouts), { parser: 'json', printWidth: 100 });
  await writeFile('src/assets/motion/poses.json', manifest);
} finally {
  await browser.close();
}
