import { expect, test, type Page } from '@playwright/test';

const artwork = [
  'bastion',
  'brute',
  'command',
  'copper-foundry',
  'polar-relay',
  'outpost-turf',
  'foundry-pulse',
  'foundry-spark',
  'foundry-frost',
  'foundry-nova',
  'foundry-bastion',
  'riftborn-scout',
  'riftborn-runner',
  'riftborn-brute',
  'riftborn-spitter',
  'riftborn-overlord',
  'standard-stride',
  'ember-stride',
  'riftborn-stride',
  'cobalt-pulse',
  'cobalt-spark',
  'cobalt-frost',
  'cobalt-nova',
  'cobalt-bastion',
  'ember-scout',
  'ember-runner',
  'ember-brute',
  'ember-spitter',
  'ember-overlord',
  'dust-and-echoes',
  'frost',
  'iron-horizon',
  'last-light',
  'nova',
  'overlord',
  'perimeter',
  'pulse',
  'runner',
  'scout',
  'spark',
  'spitter',
  'the-hollow',
];

test('command, five sector scenes and ten unit illustrations decode after an offline reload', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#arena')).toHaveCSS('background-image', /command-[^/]+\.webp/);
  // The service worker caches every campaign scene. The renderer requests them as needed.
  const decoded = await page.evaluate(async (expectedNames) => {
    const requests = (
      await Promise.all((await caches.keys()).map(async (key) => (await caches.open(key)).keys()))
    ).flat();
    const urls = [...new Set(requests.map((request) => request.url))].filter((url) =>
      new URL(url).pathname.endsWith('.webp'),
    );
    return Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url, { cache: 'reload' });
        if (!response.ok) throw new Error(`Artwork fetch failed: ${response.status} ${url}`);
        const bitmap = await createImageBitmap(await response.blob());
        const size = Math.min(bitmap.width, bitmap.height);
        bitmap.close();
        const filename = new URL(url).pathname.split('/').pop()!;
        return { name: expectedNames.find((name) => filename.startsWith(name + '-')), size };
      }),
    );
  }, artwork);
  expect(decoded.map((image) => image.name)).toEqual(expect.arrayContaining(artwork));
  for (const image of decoded) expect(image.size, image.name).toBeGreaterThan(0);
  for (const cardImage of await page.locator('.bot-card img').all()) {
    expect(
      await cardImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
  }
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await expect(page.locator('#battlefield')).toBeVisible();
});

async function checkMissionControls(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const controls = [
    page.getByRole('button', { name: 'Send wave', exact: true }),
    ...(await page.locator('.bot-card').all()),
  ];
  expect(controls).toHaveLength(6);
  for (const control of controls) {
    await expect(control).toBeInViewport({ ratio: 0.95 });
    const bounds = await control.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(32);
    expect(bounds!.width).toBeGreaterThanOrEqual(32);
  }
}

test('phone touch controls stay reachable through rotation, and landscape supports campaign and Survival', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'This scenario uses touchscreen taps and the Redmi viewport.');
  // Start with an earned sector so a real selection can be exercised without repeating a whole mission.
  await page.addInitScript(() => {
    if (!localStorage.getItem('rva-save-v1')) {
      localStorage.setItem('rva-save-v1', JSON.stringify({ unlocked: 1, stars: [3], muted: true }));
    }
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 393, height: 719 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Field guide' }).tap();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).tap();
  const settings = page.getByRole('button', { name: 'Settings', exact: true });
  const motion = page.getByRole('checkbox', { name: /Reduced motion/ });
  await settings.tap();
  await motion.tap();
  await page.getByRole('button', { name: 'Back to the outpost' }).tap();
  await page.reload();
  await settings.tap();
  await expect(motion).toBeChecked();
  await page.getByRole('button', { name: 'Back to the outpost' }).tap();
  await page.getByRole('button', { name: 'Deploy squad' }).tap();
  await checkMissionControls(page);
  await page.getByRole('button', { name: /Select Pulse,/ }).tap();
  await page.getByRole('button', { name: 'Lane 3, column 2, empty', exact: true }).tap();
  await expect(page.getByRole('button', { name: /Lane 3, column 2, Pulse/ })).toBeVisible();
  expect(
    await page
      .locator('#arena')
      .evaluate(
        (arena) =>
          getComputedStyle(arena).animationName === 'none' ||
          parseFloat(getComputedStyle(arena).animationDuration) < 0.001,
      ),
  ).toBe(true);

  await page.setViewportSize({ width: 775, height: 360 });
  await checkMissionControls(page);
  await page.getByRole('button', { name: 'Send wave', exact: true }).tap();
  await expect(page.locator('#wave-count')).toContainText('01');
  await page.getByRole('button', { name: 'Pause game', exact: true }).tap();
  await page.getByRole('button', { name: 'Return to command' }).tap();
  await page.getByRole('button', { name: /Sector 2: Dust & echoes/ }).tap();
  await expect(page.locator('#sector-label')).toHaveText('SECTOR 02');
  await page.getByRole('button', { name: /Survival mode/ }).tap();
  await expect(page.locator('#wave-label')).toHaveText('SURVIVAL MODE');
});
