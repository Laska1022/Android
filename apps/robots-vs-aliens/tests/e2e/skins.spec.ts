import { expect, test, type Page } from '@playwright/test';
import gaits from '../../src/game/gaits.json' with { type: 'json' };

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
  const decoded = await page.evaluate(async (rig) => {
    const cache = await caches.open((await caches.keys()).find((key) => key.startsWith('rva-'))!);
    const art = (await cache.keys()).filter((req) =>
      /\/(foundry-|riftborn-|standard-stride|ember-stride)/.test(new URL(req.url).pathname),
    );
    const movingFeet: number[] = [];
    for (const req of art) {
      const response = await fetch(req);
      const bitmap = await createImageBitmap(await response.blob());
      if (!bitmap.width || !bitmap.height) throw Error('Empty ' + req.url);
      if (req.url.includes('-stride-')) {
        const { width, height, frames, species } = rig;
        if (
          bitmap.width !== width * frames ||
          bitmap.height !== height * Object.keys(species).length
        ) {
          throw Error('Incomplete gait atlas ' + req.url);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const c = canvas.getContext('2d', { willReadFrequently: true })!;
        for (const { row } of Object.values(species)) {
          const pose = (frame: number) => {
            c.clearRect(0, 0, width, height);
            c.drawImage(bitmap, width * frame, height * row, width, height, 0, 0, width, height);
            return c.getImageData(0, height / 2, width, height / 2).data;
          };
          const first = pose(frames / 4);
          const opposite = pose((3 * frames) / 4);
          let changed = 0;
          for (let i = 3; i < first.length; i += 4) {
            if (Math.abs(first[i] - opposite[i]) > 64) changed++;
          }
          movingFeet.push(changed);
        }
      }
      bitmap.close();
    }
    return { count: art.length, movingFeet };
  }, gaits);
  expect(decoded.count).toBe(13);
  expect(decoded.movingFeet).toHaveLength(15);
  for (const changed of decoded.movingFeet) expect(changed).toBeGreaterThan(50);
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
    skinDraws: { poses: Set<number>; art: Set<string> };
  }
}
async function observeBattle(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'rva-save-v1',
      JSON.stringify({ robotSkin: 'foundry', alienSkin: 'riftborn', muted: true }),
    );
    window.skinDraws = { poses: new Set(), art: new Set() };
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args: number[]) {
      if (this.canvas.id === 'battlefield' && image instanceof HTMLImageElement) {
        const name = new URL(image.src).pathname.split('/').pop()!;
        if (name.startsWith('riftborn-stride-')) window.skinDraws.poses.add(args[0]);
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
  });
}
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
