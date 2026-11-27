import { expect, test, type Page } from '@playwright/test';
import gaits from '../../src/game/gaits.json' with { type: 'json' };
import layouts from '../../src/assets/motion/poses.json' with { type: 'json' };

test('both factions can be equipped independently on a first offline visit and survive a reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
  });
  await page.context().setOffline(true);
  await page.reload();
  const settings = page.getByRole('button', { name: 'Settings', exact: true });
  await settings.click();
  const robot = page.getByLabel('Robot skin');
  const alien = page.getByLabel('Alien skin');
  await expect(robot).toHaveValue('standard');
  await expect(alien).toHaveValue('standard');
  await alien.selectOption('riftborn');
  await expect(robot).toHaveValue('standard');
  await robot.selectOption('foundry');
  await alien.selectOption('standard');
  await expect(robot).toHaveValue('foundry');
  await alien.selectOption('riftborn');
  await expect(page.locator('#robot-skin-preview')).toHaveAttribute('src', /foundry-pulse/);
  await expect(page.locator('#alien-skin-preview')).toHaveAttribute('src', /riftborn-scout/);
  await page.reload();
  await settings.click();
  await expect(robot).toHaveValue('foundry');
  await expect(alien).toHaveValue('riftborn');
  await page.getByRole('button', { name: 'Back to the outpost' }).click();
  await expect(settings).toBeFocused();
  await page.getByRole('button', { name: 'Field guide' }).click();
  const portraits = await page.locator('.guide-grid img').evaluateAll(async (elements) => {
    return Promise.all(
      elements.map(async (element) => {
        const img = element as HTMLImageElement;
        await img.decode();
        return img.src;
      }),
    );
  });
  const cards = await page
    .locator('.bot-card img')
    .evaluateAll((elements) => elements.map((element) => (element as HTMLImageElement).src));
  expect(portraits).toEqual(cards);
  expect(
    cards.map((url) => new URL(url).pathname.split('/').pop()!.split('-').slice(0, 2).join('-')),
  ).toEqual(['foundry-pulse', 'foundry-spark', 'foundry-frost', 'foundry-nova', 'foundry-bastion']);
  const decoded = await page.evaluate(
    async ({ rig, layouts }) => {
      const cache = await caches.open((await caches.keys()).find((key) => key.startsWith('rva-'))!);
      const art = (await cache.keys()).filter((req) =>
        /\/(foundry-|riftborn-|standard-stride|ember-stride)/.test(new URL(req.url).pathname),
      );
      const silhouettes = [];
      for (const req of art) {
        const response = await fetch(req);
        const bitmap = await createImageBitmap(await response.blob());
        if (!bitmap.width || !bitmap.height) throw Error('Empty ' + req.url);
        if (req.url.includes('-stride-')) {
          const { width, height, frames, species } = rig;
          const family = new URL(req.url).pathname
            .split('/')
            .pop()!
            .split('-')[0] as keyof typeof layouts;
          const layout = layouts[family];
          if (
            bitmap.width !== layout.width ||
            bitmap.height !== layout.height ||
            layout.cells.length !== frames * Object.keys(species).length * 2
          ) {
            throw Error('Incomplete gait atlas ' + req.url);
          }
          const canvas = document.createElement('canvas');
          const c = canvas.getContext('2d', { willReadFrequently: true })!;
          // A 775 × 364 landscape phone displays the battlefield at 583 × 241 CSS pixels.
          const sizes = { scout: 70, runner: 65, brute: 80, spitter: 70, overlord: 99 };
          for (const [kind, { row }] of Object.entries(species)) {
            const scale = sizes[kind as keyof typeof sizes] / rig.referenceSize;
            const w = (canvas.width = Math.round((width * scale * 583) / 1200));
            const h = (canvas.height = Math.round((height * scale * 241) / 700));
            for (const [action, a, b] of [
              [0, frames / 4, (3 * frames) / 4],
              [1, frames - 1, 0],
            ]) {
              const pose = (frame: number) => {
                const [sx, sy, sw, sh, dx, dy] = layout.cells[(row * 2 + action) * frames + frame];
                c.clearRect(0, 0, w, h);
                c.drawImage(
                  bitmap,
                  sx,
                  sy,
                  sw,
                  sh,
                  ((width / 2 + dx) * w) / width,
                  ((height - rig.footPadding + dy) * h) / height,
                  (sw * w) / width,
                  (sh * h) / height,
                );
                return c.getImageData(0, 0, w, h).data;
              };
              const first = pose(a),
                second = pose(b);
              let top = h,
                bottom = 0;
              const changesByRow = new Array<number>(h).fill(0);
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const alpha = (y * w + x) * 4 + 3;
                  const wasSolid = first[alpha] > 100,
                    isSolid = second[alpha] > 100;
                  if (wasSolid || isSolid) {
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                  }
                  if (wasSolid !== isSolid) changesByRow[y]++;
                }
              }
              const middle = Math.floor((top + bottom + 1) / 2);
              const sum = (total: number, next: number) => total + next;
              silhouettes.push({
                label: req.url + ' ' + kind + (action ? ' attack' : ' walk'),
                body: changesByRow.slice(0, middle).reduce(sum, 0),
                legs: changesByRow.slice(middle).reduce(sum, 0),
              });
            }
          }
        }
        bitmap.close();
      }
      return { count: art.length, silhouettes };
    },
    { rig: gaits, layouts },
  );
  expect(decoded.count).toBe(13);
  expect(decoded.silhouettes).toHaveLength(30);
  for (const pose of decoded.silhouettes) {
    expect(pose.body, pose.label).toBeGreaterThan(10);
    expect(pose.legs, pose.label).toBeGreaterThan(30);
  }
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await settings.click();
  await robot.selectOption('standard');
  await expect(alien).toHaveValue('riftborn');
  await alien.selectOption('standard');
  await expect(page.locator('#robot-skin-preview')).toHaveAttribute('src', /\/pulse-/);
  await expect(page.locator('#alien-skin-preview')).toHaveAttribute('src', /\/scout-/);
});

// Observe the real battlefield draws; the production app exposes no test API.
declare global {
  interface Window {
    skinDraws: { poses: Set<number>; scoutAttacks: Map<number, Set<number>>; art: Set<string> };
  }
}
async function observeBattle(page: Page) {
  await page.addInitScript(
    ({ scout, frames, scale }) => {
      localStorage.setItem(
        'rva-save-v1',
        JSON.stringify({ robotSkin: 'foundry', alienSkin: 'riftborn', muted: true }),
      );
      window.skinDraws = { poses: new Set(), scoutAttacks: new Map(), art: new Set() };
      const sources = new Map(scout.map(([sx, sy, , , dx], i) => [sx + ',' + sy, { i, dx }]));
      const drawImage = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args: number[]) {
        if (this.canvas.id === 'battlefield' && image instanceof HTMLImageElement) {
          const name = new URL(image.src).pathname.split('/').pop()!;
          if (name.startsWith('riftborn-stride-')) {
            const pose = sources.get(args[0] + ',' + args[1]);
            if (pose && pose.i < frames) window.skinDraws.poses.add(pose.i);
            if (pose && pose.i >= frames) {
              const x = Math.round((args[4] - pose.dx * scale) * 1000);
              const attacks = window.skinDraws.scoutAttacks;
              if (!attacks.has(x)) attacks.set(x, new Set());
              attacks.get(x)!.add(pose.i);
            }
          }
          if (name.startsWith('foundry-pulse-')) {
            window.skinDraws.art.add(
              this.globalAlpha === 0.5 ? 'ghost' : args.length === 8 ? 'recoil' : 'deployed',
            );
          }
          if (name.startsWith('riftborn-scout-')) window.skinDraws.art.add('static scout');
          if (name.startsWith('pulse-')) window.skinDraws.art.add('factory pulse');
        }
        Reflect.apply(drawImage, this, [image, ...args]);
      };
    },
    {
      scout: layouts.riftborn.cells.slice(0, 2 * gaits.frames),
      frames: gaits.frames,
      scale: 70 / gaits.referenceSize,
    },
  );
}
test('a Scout keeps attacking in place at both speeds and walks again when its blocker is recycled', async ({
  page,
}) => {
  await observeBattle(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: /Bastion.*75/ }).click();
  const tile = page.locator('.cell[data-row="2"][data-col="8"]');
  await tile.click();
  await expect(tile).toHaveAccessibleName(/Bastion, 950 health/);
  const marker = page.locator('.incoming-lane-marker');
  await expect(marker).toBeVisible();
  const boardBounds = (await page.locator('#battlefield').boundingBox())!;
  const rightmostTip = Math.max(
    ...layouts.riftborn.cells.slice(0, gaits.frames).map((cell) => cell[4] + cell[2]),
  );
  const scoutAtEntry = 157 + 9.6 * 100 + (rightmostTip * 70) / gaits.referenceSize;
  expect((await marker.boundingBox())!.x).toBeGreaterThan(
    boardBounds.x + (boardBounds.width * scoutAtEntry) / 1200,
  );
  await page.getByRole('button', { name: 'Send wave', exact: true }).click();
  const walkingFrames = () => page.evaluate(() => window.skinDraws.poses.size);
  const strikeFramesAtOnePosition = () =>
    page.evaluate(() =>
      Math.max(0, ...Array.from(window.skinDraws.scoutAttacks.values(), (set) => set.size)),
    );
  await expect.poll(walkingFrames, { timeout: 10000 }).toBeGreaterThan(3);
  await expect.poll(strikeFramesAtOnePosition, { timeout: 10000 }).toBeGreaterThan(5);
  await expect(tile).not.toHaveAccessibleName(/950 health/);
  await page.getByRole('button', { name: 'Pause game' }).click();
  const frozen = await page.locator('#battlefield').evaluate(async (element) => {
    const canvas = element as HTMLCanvasElement;
    const image = canvas.toDataURL();
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
    return image === canvas.toDataURL();
  });
  expect(frozen).toBe(true);
  await page.getByRole('button', { name: 'Resume mission' }).click();
  await page.locator('#speed-button').click();
  await page.evaluate(() => window.skinDraws.scoutAttacks.clear());
  await expect.poll(strikeFramesAtOnePosition).toBeGreaterThan(5);
  await page.getByRole('button', { name: /Recycle/ }).click();
  await tile.click();
  await expect(tile).toHaveAccessibleName(/empty/);
  await page.evaluate(() => {
    window.skinDraws.scoutAttacks.clear();
    window.skinDraws.poses.clear();
  });
  await expect.poll(walkingFrames).toBeGreaterThan(3);
  expect(await strikeFramesAtOnePosition()).toBe(0);
});
test('combat uses the equipped art for placement, recoil and strides, and respects pause and reduced motion', async ({
  page,
}) => {
  await observeBattle(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  const cell = page.getByRole('button', { name: 'Lane 3, column 2, empty', exact: true });
  await cell.focus();
  const seen = (label: string) => page.evaluate((value) => window.skinDraws.art.has(value), label);
  await expect.poll(() => seen('ghost')).toBe(true);
  await cell.click();
  await expect.poll(() => seen('deployed')).toBe(true);
  await expect(page.locator('#energy')).toHaveText('300');
  await page.getByRole('button', { name: 'Send wave', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.skinDraws.poses.size)).toBeGreaterThan(2);
  await expect.poll(() => seen('recoil')).toBe(true);
  await page.locator('#speed-button').click();
  await expect(page.locator('#speed-button')).toHaveText('2×');
  await page.evaluate(() => window.skinDraws.poses.clear());
  await expect.poll(() => page.evaluate(() => window.skinDraws.poses.size)).toBeGreaterThan(2);

  await page.getByRole('button', { name: 'Pause game' }).click();
  const frozen = await page.locator('#battlefield').evaluate(async (element) => {
    const canvas = element as HTMLCanvasElement;
    const before = canvas.toDataURL();
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
    return before === canvas.toDataURL();
  });
  expect(frozen).toBe(true);
  await page.getByRole('button', { name: 'Resume mission' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Robot skin').selectOption('standard');
  await page.getByRole('checkbox', { name: /Reduced motion/ }).check();
  await page.evaluate(() => {
    window.skinDraws.poses.clear();
    window.skinDraws.art.clear();
  });
  await page.getByRole('button', { name: 'Back to the outpost' }).click();
  await expect.poll(() => seen('static scout')).toBe(true);
  await expect.poll(() => seen('factory pulse')).toBe(true);
  expect(await page.evaluate(() => window.skinDraws.poses.size)).toBe(0);
  await expect(page.getByRole('button', { name: /Lane 3, column 2, Pulse/ })).toBeVisible();
});

test.describe('atlas fallback', () => {
  test.use({ serviceWorkers: 'block' });
  test('a missing gait sheet still draws the equipped Scout and the lane warning', async ({
    page,
  }) => {
    let failed = 0;
    await page.route('**/riftborn-stride-*.webp', (route) => {
      failed++;
      return route.abort();
    });
    await observeBattle(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Deploy squad' }).click();
    await expect(page.locator('.incoming-lane-label')).toHaveText('Incoming · Lane 3 · Scout');
    await page.getByRole('button', { name: 'Send wave', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.skinDraws.art.has('static scout')))
      .toBe(true);
    expect(failed).toBe(1);
    expect(await page.evaluate(() => window.skinDraws.poses.size)).toBe(0);
  });
});
