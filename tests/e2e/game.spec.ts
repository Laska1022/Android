import { expect, test } from '@playwright/test';

test('deploy, recycle, pause, resume, and fight without browser errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The last outpost.' })).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-command.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Lane 3, column 2, empty', exact: true }).click();
  await expect(page.getByRole('button', { name: /Lane 3, column 2, Pulse/ })).toBeVisible();
  await page.getByRole('button', { name: 'Recycle a robot for up to 50 percent energy' }).click();
  await page.getByRole('button', { name: /Lane 3, column 2, Pulse/ }).click();
  await expect(
    page.getByRole('button', { name: 'Lane 3, column 2, empty', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Select Spark,/ }).click();
  await page.getByRole('button', { name: 'Lane 3, column 1, empty', exact: true }).click();
  await page.getByRole('button', { name: /Select Pulse,/ }).click();
  await page.getByRole('button', { name: 'Lane 2, column 2, empty', exact: true }).click();
  await page.getByRole('button', { name: 'Lane 4, column 2, empty', exact: true }).click();
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const energy = await page.locator('#energy').textContent();
  await page.waitForTimeout(1200);
  await expect(page.locator('#energy')).toHaveText(energy!);
  await page.getByRole('button', { name: 'Resume mission' }).click();
  await page.getByRole('button', { name: /Send wave/ }).click();
  await expect(page.locator('#wave-count')).toContainText('01');
  await page.waitForTimeout(4000);
  await expect(page.locator('#tactical-status')).toContainText('hostiles detected');
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-battle.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('guide, settings, preferences, and offline launch', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Field guide' }).click();
  await expect(page.getByRole('heading', { name: 'Know your squad.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Toggle sound' }).click();
  await expect(page.getByRole('button', { name: 'Toggle sound' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Toggle sound' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
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
  await expect(page.getByRole('button', { name: 'Deploy squad' })).toBeVisible();
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Lane 1, column 1, empty', exact: true }).click();
  await expect(page.getByRole('button', { name: /Lane 1, column 1, Pulse/ })).toBeVisible();
});

test('keyboard deployment and modal focus containment', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard interaction is covered on desktop.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Lane 1, column 2, Pulse/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Return to command' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
