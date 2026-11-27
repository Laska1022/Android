import { expect, test, type Page } from '@playwright/test';

const settings = (page: Page) => page.getByRole('button', { name: 'Settings', exact: true });
const done = (page: Page) => page.getByRole('button', { name: 'Back to the outpost' });

async function tileSample(page: Page) {
  return page.locator('#battlefield').evaluate((element) => {
    const field = element as HTMLCanvasElement;
    const patch = document.createElement('canvas');
    patch.width = 16;
    patch.height = 12;
    const c = patch.getContext('2d')!;
    c.drawImage(
      field,
      ((157 + 4 * 100) * field.width) / 1200,
      ((170 + 82) * field.height) / 700,
      (100 * field.width) / 1200,
      (82 * field.height) / 700,
      0,
      0,
      16,
      12,
    );
    return Array.from(c.getImageData(0, 0, 16, 12).data);
  });
}
const difference = (a: number[], b: number[]) =>
  a.reduce((sum, pixel, i) => sum + Math.abs(pixel - b[i]), 0) / a.length;

test('expanded lanes are the default and both the classic layout and independent field skins work offline', async ({
  page,
  context,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 775, height: 364 });
  await page.addInitScript(() => {
    if (!localStorage.getItem('rva-save-v1'))
      localStorage.setItem(
        'rva-save-v1',
        JSON.stringify({
          unlocked: 3,
          best: 4710,
          robotSkin: 'foundry',
          alienSkin: 'riftborn',
          muted: true,
        }),
      );
  });
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  const grid = page.locator('#battle-grid');
  const initial = (await grid.boundingBox())!;
  const lastCell = page.getByRole('button', { name: 'Lane 5, column 9, empty', exact: true });
  await lastCell.click();
  const standard = await tileSample(page);
  await settings(page).click();
  const layout = page.getByLabel('Battle layout'),
    fieldSkin = page.getByLabel('Battlefield skin');
  await expect(layout).toHaveValue('expanded');
  await expect(fieldSkin).toHaveValue('standard');
  await layout.selectOption('classic');
  await fieldSkin.selectOption('foundry');
  await done(page).click();
  const classic = (await grid.boundingBox())!;
  expect(initial.width * initial.height).toBeGreaterThan(classic.width * classic.height * 1.25);
  await expect(page.getByRole('button', { name: /Lane 5, column 9, Pulse/ })).toBeVisible();
  await expect.poll(async () => difference(await tileSample(page), standard)).toBeGreaterThan(10);
  const foundry = await tileSample(page);
  await settings(page).click();
  await fieldSkin.selectOption('polar');
  await expect(page.getByLabel('Alien skin')).toHaveValue('riftborn');
  await expect(page.getByLabel('Robot skin')).toHaveValue('foundry');
  await done(page).click();
  await expect.poll(async () => difference(await tileSample(page), foundry)).toBeGreaterThan(11);
  await page.reload();
  await settings(page).click();
  await expect(layout).toHaveValue('classic');
  await expect(fieldSkin).toHaveValue('polar');
  await expect(page.getByLabel('Robot skin')).toHaveValue('foundry');
  await expect(page.locator('#best-score')).toHaveText('4,710');
  await layout.selectOption('expanded');
  await fieldSkin.selectOption('standard');
  await done(page).click();
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await expect.poll(async () => difference(await tileSample(page), standard)).toBeLessThan(1);
});

test('tapping an energy drop collects once with placement, recycling or strike selected', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(45000);
  if (isMobile) await page.setViewportSize({ width: 775, height: 364 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Send wave', exact: true }).click();
  await page.locator('#speed-button').click();
  const drop = page.locator('.energy-target').first();
  for (const action of ['placement', 'recycle', 'strike']) {
    await expect(drop).toBeVisible({ timeout: 9000 });
    const bounds = (await drop.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    const grid = (await page.locator('#battle-grid').boundingBox())!;
    const x = bounds.x + bounds.width / 2,
      y = bounds.y + bounds.height / 2;
    const row = Math.floor(((y - grid.y) * 5) / grid.height),
      col = Math.floor(((x - grid.x) * 9) / grid.width);
    const tile = page.locator(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (action === 'recycle') {
      await page.getByRole('button', { name: /Select Bastion,/ }).click();
      await tile.press('Enter');
      await expect(tile).toHaveAccessibleName(/Bastion/);
      await page.locator('#recycle-button').click();
    }
    if (action === 'strike') await page.locator('#beam-button').click();
    const before = Number(await page.locator('#energy').innerText());
    // Land near the lower edge of the finger target, across a tile boundary on small screens.
    if (isMobile) await page.touchscreen.tap(x, y + 18);
    else await page.mouse.click(x, y + 18);
    await expect(page.locator('#pickup-count')).toHaveText('0');
    await expect(page.locator('.energy-target')).toHaveCount(0);
    const gained = Number(await page.locator('#energy').innerText()) - before;
    expect(gained).toBeGreaterThanOrEqual(35);
    expect(gained).toBeLessThan(42);
    if (action === 'placement')
      await expect(page.locator('.cell[aria-label$="empty"]')).toHaveCount(45);
    if (action === 'recycle') await expect(tile).toHaveAccessibleName(/Bastion/);
    if (action === 'strike') {
      await expect(page.locator('#beam-button')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#beam-status')).toContainText('READY');
    }
  }
});

test('classic phone controls collect a drop above a tile and the next ordinary tap still deploys', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'This covers real touchscreen coordinates after a mobile rotation.');
  await page.goto('/');
  await settings(page).click();
  await page.getByLabel('Battle layout').selectOption('classic');
  await done(page).click();
  await page.getByRole('button', { name: 'Deploy squad' }).tap();
  await page.getByRole('button', { name: 'Send wave', exact: true }).tap();
  await page.locator('#speed-button').tap();
  await expect(page.locator('.energy-target')).toBeVisible({ timeout: 9000 });
  await page.setViewportSize({ width: 775, height: 364 });
  const drop = page.locator('.energy-target');
  const r = (await drop.boundingBox())!;
  await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2 + 18);
  await expect(drop).toHaveCount(0);
  await expect(page.locator('.cell[aria-label$="empty"]')).toHaveCount(45);
  const tile = page.getByRole('button', { name: 'Lane 1, column 1, empty', exact: true });
  await tile.tap();
  await expect(page.getByRole('button', { name: /Lane 1, column 1, Pulse/ })).toBeVisible();
});

test('individual keyboard pickup, Collect and E preserve tile placement and award each drop once', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The keyboard scenario runs on desktop.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Send wave', exact: true }).click();
  await page.locator('#speed-button').click();
  const drops = page.locator('.energy-target');
  await expect(drops).toHaveCount(2, { timeout: 13000 });
  await page.locator('#collect-button').click();
  await expect(drops).toHaveCount(0);
  await expect(drops).toHaveCount(1, { timeout: 8500 });
  await drops.first().press('Enter');
  await expect(page.locator('.cell:focus')).toHaveCount(1);
  await expect(drops).toHaveCount(0);
  await expect(drops).toHaveCount(1, { timeout: 8500 });
  const before = Number(await page.locator('#energy').innerText());
  await page.keyboard.press('e');
  await page.keyboard.press('e');
  await expect(page.locator('#pickup-count')).toHaveText('0');
  const after = Number(await page.locator('#energy').innerText());
  expect(after - before).toBeGreaterThanOrEqual(35);
  expect(after - before).toBeLessThan(42);
  await expect(page.locator('.cell[aria-label$="empty"]')).toHaveCount(45);
});

test.describe('field material loading', () => {
  test.use({ serviceWorkers: 'block' });
  test('a late texture cannot repaint the selected field and a failed texture leaves the tiles playable', async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/copper-foundry-*.webp', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Deploy squad' }).click();
    try {
      const pending = page.waitForRequest('**/copper-foundry-*.webp');
      await settings(page).click();
      await page.getByLabel('Battlefield skin').selectOption('foundry');
      const delayed = (await pending).url();
      const polarRequest = page.waitForResponse('**/polar-relay-*.webp');
      await page.getByLabel('Battlefield skin').selectOption('polar');
      await polarRequest;
      await done(page).click();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const polar = await tileSample(page);
      release();
      await page.evaluate(async (url) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        await new Promise(requestAnimationFrame);
      }, delayed);
      expect(difference(await tileSample(page), polar)).toBeLessThan(1);
    } finally {
      release();
    }
    let failed = 0;
    await page.route('**/polar-relay-*.webp', (route) => {
      failed++;
      return route.abort();
    });
    await page.reload();
    await page.getByRole('button', { name: 'Deploy squad' }).click();
    await expect.poll(() => failed).toBeGreaterThan(0);
    const tile = page.getByRole('button', { name: 'Lane 1, column 9, empty', exact: true });
    await tile.click();
    await expect(page.getByRole('button', { name: /Lane 1, column 9, Pulse/ })).toBeVisible();
    await expect(page.locator('.cell')).toHaveCount(45);
  });
});

test('expanded lanes keep the loadout and battle actions on screen on short phones and tablets', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'This exercises mobile viewport changes during a battle.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).tap();
  for (const [width, height] of [
    [340, 568],
    [667, 320],
    [820, 600],
    [915, 600],
    [768, 1024],
  ]) {
    await page.setViewportSize({ width, height });
    for (const button of await page
      .locator('.bot-card,#wave-button,#beam-button,#recycle-button,#collect-button')
      .all()) {
      await expect(button).toBeInViewport({ ratio: 0.95 });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await expect(page.locator('.cell[data-row="4"][data-col="8"]')).toBeInViewport({ ratio: 1 });
  }
});
