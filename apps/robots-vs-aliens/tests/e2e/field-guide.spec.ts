import { expect, test, type Page } from '@playwright/test';
import layouts from '../../src/assets/motion/poses.json' with { type: 'json' };
import gaits from '../../src/game/gaits.json' with { type: 'json' };
import { ENEMIES, type EnemyKind } from '../../src/game/engine';

async function openAliens(page: Page) {
  await page.getByRole('button', { name: 'Field guide' }).click();
  await page.getByRole('button', { name: 'Aliens', exact: true }).click();
}

test('the offline alien guide plays the equipped walk and attack frames and resumes the mission', async ({
  page,
  context,
  isMobile,
}) => {
  const skin = isMobile ? 'ember' : 'riftborn';
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Alien skin', { exact: true }).selectOption(skin);
  await page.getByRole('button', { name: 'Back to the outpost' }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Lane 3, column 2, empty', exact: true }).click();
  await openAliens(page);
  const boardPaints = await page.locator('#battlefield').evaluateHandle((el: HTMLCanvasElement) => {
    const count = { draws: 0 };
    const ctx = el.getContext('2d')!;
    const draw = ctx.drawImage;
    ctx.drawImage = function (...args: Parameters<typeof draw>) {
      count.draws++;
      return Reflect.apply(draw, this, args);
    };
    return count;
  });
  const species = page.getByLabel('Species', { exact: true });
  await expect(species.locator('option')).toHaveCount(5);
  for (const kind of Object.keys(ENEMIES) as EnemyKind[]) {
    await species.selectOption(kind);
    await expect(page.locator('.alien-details dd')).toHaveText(
      ENEMIES[kind].hp.toLocaleString('en-US'),
    );
    const art = page.locator('.alien-specimen img');
    await expect(art).toHaveAttribute('src', new RegExp(skin + '-' + kind));
    expect(
      await art.evaluate(async (el: HTMLImageElement) => {
        await el.decode();
        return el.naturalWidth;
      }),
    ).toBeGreaterThan(0);
    await expect(page.locator('.guide-defense p')).not.toBeEmpty();
  }
  await species.selectOption('spitter');
  const canvas = page.locator('.alien-specimen canvas');
  const samples = await canvas.evaluateHandle((el: HTMLCanvasElement) => {
    const seen: string[] = [];
    const ctx = el.getContext('2d')!;
    const draw = ctx.drawImage;
    ctx.drawImage = function (...args: Parameters<typeof draw>) {
      const [image, sx, sy] = args;
      if (image instanceof HTMLImageElement)
        seen.push(image.src.split('/').pop() + '/' + sx + ',' + sy);
      return Reflect.apply(draw, this, args);
    };
    return seen;
  });
  for (const [action, index] of [
    ['walk', 0],
    ['attack', 1],
  ] as const) {
    const button = page.getByRole('button', {
      name: action === 'walk' ? 'Walk' : 'Attack',
      exact: true,
    });
    const start = (gaits.species.spitter.row * 2 + index) * gaits.frames;
    const valid = new Set(
      layouts[skin].cells.slice(start, start + gaits.frames).map(([x, y]) => x + ',' + y),
    );
    await samples.evaluate((arr) => {
      arr.length = 0;
    });
    await button.click();
    await expect.poll(async () => new Set(await samples.jsonValue()).size).toBeGreaterThan(5);
    const captured = await samples.jsonValue();
    expect(
      captured.every((pose) => pose.startsWith(skin + '-stride-') && valid.has(pose.split('/')[1])),
    ).toBe(true);
    if (action === 'walk') {
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await expect(canvas).toBeHidden();
    }
  }
  expect(await boardPaints.evaluate((count) => count.draws)).toBe(0);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const count = await samples.evaluate((arr) => arr.length);
  await page.getByRole('button', { name: 'Send wave', exact: true }).click();
  await expect.poll(() => boardPaints.evaluate((count) => count.draws)).toBeGreaterThan(0);
  await expect(page.locator('#wave-count')).toContainText('1');
  expect(await samples.evaluate((arr) => arr.length)).toBe(count);
  await expect(page.getByRole('button', { name: /Lane 3, column 2, Pulse/ })).toBeVisible();
});

test('device motion follows live changes until the player overrides or resets it', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const settings = page.getByRole('button', { name: 'Settings', exact: true });
  const motion = page.getByRole('checkbox', { name: 'Reduced motion' });
  await settings.click();
  await expect(motion).toBeChecked();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(motion).not.toBeChecked();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(motion).toBeChecked();
  await motion.uncheck();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('rva-save-v1')!)?.reducedMotion),
    )
    .toBe(false);
  await page.reload();
  await settings.click();
  await expect(motion).not.toBeChecked();
  await expect(page.locator('html')).not.toHaveClass(/reduced-motion/);
  expect(await settings.evaluate((el) => getComputedStyle(el).transitionDuration)).toContain(
    '0.18s',
  );
  await page.getByRole('button', { name: 'Use device setting' }).click();
  await expect(motion).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('rva-save-v1')!)?.reducedMotion),
    )
    .toBeNull();
  await page.getByRole('button', { name: 'Back to the outpost' }).click();
  await openAliens(page);
  const walk = page.getByRole('button', { name: 'Walk', exact: true });
  await expect(walk).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Reduced motion is on.' })).toBeVisible();
  await page.getByLabel('Species').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await walk.click();
  await expect(page.locator('.alien-specimen canvas')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.alien-specimen canvas')).toBeHidden();
  await expect(page.locator('.alien-specimen img')).toBeVisible();
});

test('the guide and pause have separate touch targets on a narrow Russian battlefield', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'This checks touch coordinates at two phone orientations.');
  await page.addInitScript(() =>
    localStorage.setItem('rva-save-v1', JSON.stringify({ language: 'ru' })),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.locator('#start-button').tap();
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 568, height: 320 },
  ]) {
    await page.setViewportSize(viewport);
    for (const id of ['#pause-button', '#guide-button', '#sound-button', '#settings-button']) {
      const control = page.locator(id);
      expect(
        await control.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return [r.left + 3, r.left + r.width / 2, r.right - 3].every((x) =>
            el.contains(document.elementFromPoint(x, r.top + r.height / 2)),
          );
        }),
      ).toBe(true);
    }
    await page.locator('#guide-button').tap();
    await page.getByRole('button', { name: 'Пришельцы', exact: true }).tap();
    await page.getByLabel('Вид', { exact: true }).selectOption('overlord');
    await expect(page.getByRole('heading', { name: 'Как обороняться' })).toBeInViewport();
    await expect(page.locator('.guide-defense p')).toBeInViewport();
    expect(
      await page.locator('#modal').evaluate(async (el) => {
        await document.fonts.ready;
        return (
          el.scrollWidth <= el.clientWidth &&
          el.querySelector('.guide-defense p')!.getBoundingClientRect().bottom <=
            el.getBoundingClientRect().bottom
        );
      }),
    ).toBe(true);
    await page.locator('#modal-close').tap();
  }
});

test.describe('a missing animation sheet', () => {
  test.use({ serviceWorkers: 'block' });
  test('keeps the portrait and defense advice readable', async ({ page }) => {
    await page.route('**/*-stride-*.webp', (route) => route.abort());
    await page.goto('/');
    await openAliens(page);
    await page.getByRole('button', { name: 'Attack', exact: true }).click();
    await expect(page.locator('.guide-clip-status')).toContainText('Animation unavailable');
    await expect(page.locator('.alien-specimen canvas')).toBeHidden();
    await expect(page.locator('.alien-specimen img')).toBeVisible();
    await expect(page.locator('.guide-defense p')).toContainText('Pulse');
  });
});
