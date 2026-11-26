import { expect, test } from '@playwright/test';

test('skin choices update independently and survive an offline launch', async ({
  page,
  context,
}) => {
  await page.goto('/');
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
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Screen orientation')).toHaveCount(0);
  await page.getByLabel('Robot skin').selectOption('cobalt');
  await expect(page.getByLabel('Alien skin')).toHaveValue('standard');
  await page.getByLabel('Alien skin').selectOption('ember');
  await expect(page.locator('#alien-skin-preview')).toHaveAttribute('src', /ember-scout/);
  await page.reload();
  await expect(page.locator('[data-bot="pulse"] img')).toHaveAttribute('src', /cobalt-pulse/);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Robot skin')).toHaveValue('cobalt');
  await expect(page.getByLabel('Alien skin')).toHaveValue('ember');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Field guide' }).click();
  await expect(page.locator('.guide-grid img').first()).toHaveAttribute('src', /cobalt-pulse/);
});

test('first lane cue survives setup, fast launch and pausing; Survival hides the alien type', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#start-button').click();
  const warning = page.locator('.incoming-lane-label');
  await expect(warning).toHaveText('Incoming · Lane 3 · Scout');
  await page.getByRole('button', { name: 'Lane 3, column 9, empty', exact: true }).click();
  await expect(page.getByRole('button', { name: /Lane 3, column 9, Pulse/ })).toBeVisible();
  await page.locator('#speed-button').click();
  await page.locator('#wave-button').click();
  await page.locator('#pause-button').click();
  await expect(warning).toHaveText('Incoming · Lane 3 · Scout');
  await page.locator('#quit-button').click();
  await expect(warning).toBeEmpty();
  await page.locator('#endless-button').click();
  await expect(warning).toHaveText(/^Incoming · Lane [1-5]$/);
});
