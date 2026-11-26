import { expect, test, type Page } from '@playwright/test';
import { SECTORS } from '../../src/game/engine';

const scenes = ['perimeter', 'dust-and-echoes', 'the-hollow', 'iron-horizon', 'last-light'];

async function unlockCampaign(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'rva-save-v1',
      JSON.stringify({ unlocked: 4, reducedMotion: true, muted: true }),
    );
  });
  await page.goto('/');
}

async function deploy(page: Page, sector: number) {
  await page.getByRole('button', { name: new RegExp(`^Sector ${sector + 1}:`) }).click();
  await expect(page.locator('#mission-location')).toHaveText(SECTORS[sector].location);
  await expect(page.locator('#mission-brief')).toHaveText(SECTORS[sector].description);
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await expect(page.locator('#battlefield')).toBeVisible();
  const mission = await page.locator('#mission-label').innerText();
  await expect(page.locator('#battlefield')).toHaveAccessibleName(new RegExp(mission, 'i'));
}

async function returnToCommand(page: Page) {
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.getByRole('button', { name: 'Return to command' }).click();
}

function requestedArt(page: Page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'img')
      .map((entry) => entry.name),
  );
}

// Measure horizontal light/dark variation in the top strip, above all tiles and units.
// Subtracting each row's mean tolerates the vignette and viewport interpolation.
async function skyProfile(page: Page, assetUrl?: string) {
  return page.locator('#battlefield').evaluate(async (element, url) => {
    let source: HTMLImageElement | HTMLCanvasElement = element as HTMLCanvasElement;
    if (url) {
      const image = new Image();
      image.src = url;
      await image.decode();
      source = image;
    }
    const probe = document.createElement('canvas');
    probe.width = 32;
    probe.height = 5;
    const c = probe.getContext('2d')!;
    c.imageSmoothingQuality = 'high';
    c.drawImage(source, 0, 0, source.width, source.height * 0.18, 0, 0, probe.width, probe.height);
    const pixels = c.getImageData(0, 0, probe.width, probe.height).data;
    const profile: number[] = [];
    for (let y = 0; y < probe.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < probe.width; x++) {
        const i = (y * probe.width + x) * 4;
        row.push(pixels[i] * 0.21 + pixels[i + 1] * 0.72 + pixels[i + 2] * 0.07);
      }
      const mean = row.reduce((total, value) => total + value, 0) / row.length;
      profile.push(...row.map((value) => value - mean));
    }
    return profile;
  }, assetUrl);
}

async function expectScene(page: Page, scene: string) {
  const request = async () =>
    (await requestedArt(page)).find((url) => new URL(url).pathname.includes('/' + scene + '-'));
  await expect.poll(request).toBeTruthy();
  const reference = await skyProfile(page, await request());
  await expect
    .poll(
      async () => {
        const painted = await skyProfile(page);
        const dot = painted.reduce((total, value, i) => total + value * reference[i], 0);
        return dot / (Math.hypot(...painted) * Math.hypot(...reference));
      },
      { message: `The battlefield sky should match ${scene}` },
    )
    .toBeGreaterThan(0.85);
}

function tilePixels(page: Page) {
  return page.getByRole('button', { name: /^Lane 3, column 4,/ }).evaluate((tile) => {
    const board = document.querySelector<HTMLCanvasElement>('#battlefield')!;
    const arena = board.getBoundingClientRect();
    const cell = tile.getBoundingClientRect();
    const scaleX = board.width / arena.width;
    const scaleY = board.height / arena.height;
    const probe = document.createElement('canvas');
    probe.width = probe.height = 12;
    const c = probe.getContext('2d')!;
    c.drawImage(
      board,
      (cell.x - arena.x + cell.width * 0.2) * scaleX,
      (cell.y - arena.y + cell.height * 0.15) * scaleY,
      cell.width * 0.6 * scaleX,
      cell.height * 0.7 * scaleY,
      0,
      0,
      12,
      12,
    );
    return Array.from(c.getImageData(0, 0, 12, 12).data);
  });
}

test('each unlocked sector lazily paints its own panorama and places Pulse on the tapped tile offline', async ({
  page,
  context,
}, testInfo) => {
  await unlockCampaign(page);
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
  for (const [sector, scene] of scenes.entries()) {
    if (sector > 0)
      expect((await requestedArt(page)).some((url) => url.includes('/' + scene + '-'))).toBe(false);
    await deploy(page, sector);
    await expectScene(page, scene);
    const pulse = page.getByRole('button', { name: /Select Pulse,/ });
    await pulse.click();
    const before = await tilePixels(page);
    await page.getByRole('button', { name: 'Lane 3, column 4, empty', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Lane 3, column 4, Pulse/ })).toBeVisible();
    await pulse.click(); // Remove the placement preview before sampling the deployed robot.
    await expect
      .poll(async () => {
        const after = await tilePixels(page);
        return (
          after.reduce((total, value, i) => total + Math.abs(value - before[i]), 0) / after.length
        );
      })
      .toBeGreaterThan(4);
    await page
      .locator('#arena')
      .screenshot({ path: testInfo.outputPath(`sector-${sector + 1}-${scene}.png`) });
    await returnToCommand(page);
  }
});

test.describe('sector changes during loading', () => {
  test.use({ serviceWorkers: 'block' }); // Allow Playwright to hold a real image request at the network layer.
  test('a late Dust & echoes response cannot replace The hollow', async ({ page }) => {
    await unlockCampaign(page);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/dust-and-echoes-*.webp', async (route) => {
      await gate;
      await route.continue();
    });
    try {
      const slowRequest = page.waitForRequest('**/dust-and-echoes-*.webp');
      await deploy(page, 1);
      const url = (await slowRequest).url();
      await returnToCommand(page);
      await deploy(page, 2);
      await expectScene(page, 'the-hollow');
      release();
      await page.evaluate(async (src) => {
        const lateImage = new Image();
        lateImage.src = src;
        await lateImage.decode();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      }, url);
      await expectScene(page, 'the-hollow');
    } finally {
      release();
    }
  });
});
