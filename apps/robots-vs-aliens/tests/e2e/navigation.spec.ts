import { expect, test, type Page } from '@playwright/test';

// Android delegates to the game only when its cancelable Back event is handled.
function sendBack(page: Page) {
  return page.evaluate(() => !window.dispatchEvent(new Event('rvaBack', { cancelable: true })));
}

test('Back closes command tools and lets the platform handle the bare command screen', async ({
  page,
}) => {
  await page.goto('/');
  const deploy = page.getByRole('button', { name: 'Deploy squad' });
  await expect(deploy).toBeVisible();
  expect(await sendBack(page)).toBe(false);
  for (const name of ['Settings', 'Field guide']) {
    const tool = page.getByRole('button', { name, exact: true });
    await tool.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await sendBack(page)).toBe(true);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(deploy).toBeVisible();
    expect(await sendBack(page)).toBe(false);
  }
});

test('Back pauses and resumes Cadet preparation and returns from mission Settings', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Lane 3, column 2, empty' }).click();
  const firstRobot = page.getByRole('button', { name: /Lane 3, column 2, Pulse/ });
  await expect(firstRobot).toBeVisible();
  await expect(page.locator('#energy')).toHaveText('300');

  expect(await sendBack(page)).toBe(true);
  await expect(page.getByRole('dialog', { name: 'Mission paused' })).toBeVisible();
  expect(await sendBack(page)).toBe(true);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(firstRobot).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send wave', exact: true })).toBeEnabled();

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Command settings' })).toBeVisible();
  expect(await sendBack(page)).toBe(true);
  await expect(page.getByRole('dialog')).toBeHidden();
  // A hidden dialog alone does not establish that the underlying mission resumed.
  await page.getByRole('button', { name: 'Lane 1, column 1, empty' }).click();
  await expect(page.getByRole('button', { name: /Lane 1, column 1, Pulse/ })).toBeVisible();
  await expect(firstRobot).toBeVisible();
  await expect(page.locator('#energy')).toHaveText('200');
});

test('holding Escape performs a single navigation action until key release', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Physical keyboard repeat is exercised in desktop Chromium.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  const pause = page.getByRole('dialog', { name: 'Mission paused' });
  await page.keyboard.down('Escape');
  await expect(pause).toBeVisible();
  await page.keyboard.down('Escape');
  await expect(pause).toBeVisible();
  await page.keyboard.up('Escape');
  await page.keyboard.down('Escape');
  await expect(pause).toBeHidden();
  await page.keyboard.down('Escape');
  await expect(pause).toBeHidden();
  await page.keyboard.up('Escape');
});

test('Back returns from a finished mission to command', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop run exercises the shared terminal mission state.');
  test.slow();
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.addInitScript(() => {
    localStorage.setItem(
      'rva-save-v1',
      JSON.stringify({ unlocked: 4, muted: true, reducedMotion: true, difficulty: 'veteran' }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Sector 5: Last light/ }).click();
  await page.getByRole('button', { name: 'Deploy squad' }).click();
  await page.getByRole('button', { name: 'Toggle double speed' }).click();
  await page.getByRole('button', { name: /Send wave/ }).click();

  // Leave the core undefended and advance the real simulation through its loss path.
  const loss = page.getByRole('dialog', { name: 'Core lost.' });
  for (let i = 0; i < 18 && !(await loss.isVisible()); i++) await page.clock.runFor(10_000);
  await expect(loss).toBeVisible();
  expect(await sendBack(page)).toBe(true);
  await expect(loss).toBeHidden();
  await expect(page.getByRole('button', { name: 'Deploy squad' })).toBeVisible();
  expect(await sendBack(page)).toBe(false);
});
