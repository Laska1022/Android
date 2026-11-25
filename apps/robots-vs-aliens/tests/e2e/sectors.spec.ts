import { expect, test, type Page } from '@playwright/test';
import { reloadOffline } from './offline';

test('a new player can scout a locked sector and return to a playable mission', async ({
  page,
}) => {
  await page.goto('/');
  const nest = page.getByRole('button', { name: /Sector 5: Last light/ });
  await nest.click();
  await expect(nest).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Last light' })).toBeVisible();
  await expect(page.locator('#mission-location')).toContainText('THE NEST');
  await expect(page.getByRole('button', { name: 'Clear sector 04 first' })).toBeDisabled();
  await expect(page.locator('#battle-grid')).toBeHidden();

  await page.getByRole('button', { name: /Sector 1: First contact/ }).click();
  await expect(page.getByRole('heading', { name: 'The last outpost.' })).toBeVisible();
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await expect(page.locator('#energy')).toHaveText('400');
  await expect(page.locator('#battle-location')).toContainText('GREENLINE');
});

// Sample the sky above the lanes. The combat vignette darkens it slightly, but
// a stale sector or the fallback gradient must not pass as the selected image.
async function sampleSky(page: Page, url: string) {
  return page.locator('canvas#battlefield').evaluate(async (canvas: HTMLCanvasElement, src) => {
    const terrain = new Image();
    terrain.src = src;
    await terrain.decode();
    const sample = document.createElement('canvas');
    sample.width = 16;
    sample.height = 4;
    const context = sample.getContext('2d')!;
    function pixels(image: HTMLCanvasElement | HTMLImageElement) {
      context.drawImage(
        image,
        0,
        0,
        image.width,
        image.height * 0.2,
        0,
        0,
        sample.width,
        sample.height,
      );
      return context.getImageData(0, 0, sample.width, sample.height).data;
    }
    const expected = pixels(terrain);
    const actual = pixels(canvas);
    let difference = 0;
    for (let i = 0; i < actual.length; i++) difference += Math.abs(actual[i] - expected[i]);
    return { meanDifference: difference / (sample.width * sample.height * 3), sky: [...actual] };
  }, url);
}

test('each earned sector deploys into its advertised terrain offline', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('rva-save-v1')) {
      localStorage.setItem(
        'rva-save-v1',
        JSON.stringify({ unlocked: 4, stars: [3, 3, 3, 3, 0], muted: true }),
      );
    }
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await reloadOffline(page);
  for (const [index, terrain] of ['badlands', 'basin', 'relay', 'nest'].entries()) {
    await page.getByRole('button', { name: new RegExp(`^Sector ${index + 2}:`) }).click();
    const url = await page
      .locator('#arena')
      .evaluate((arena) => getComputedStyle(arena).backgroundImage.match(/url\("([^"]+)"\)/)?.[1]);
    expect(url).toContain(`/${terrain}-`);
    await page.getByRole('button', { name: 'Deploy squad' }).click();
    await expect.poll(async () => (await sampleSky(page, url!)).meanDifference).toBeLessThan(23);
    await page.getByRole('button', { name: 'Lane 5, column 9, empty', exact: true }).click();
    await expect(page.getByRole('button', { name: /Lane 5, column 9, Pulse/ })).toBeVisible();

    if (terrain === 'nest') {
      const normal = await sampleSky(page, url!);
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.getByRole('checkbox', { name: /Reduced motion/ }).check();
      await page.getByRole('button', { name: 'Back to the outpost' }).click();
      await expect(page.locator('html')).toHaveClass(/reduced-motion/);
      expect((await sampleSky(page, url!)).sky).toEqual(normal.sky);
    }
    await page.getByRole('button', { name: 'Pause game' }).click();
    await page.getByRole('button', { name: 'Return to command' }).click();
  }
});
