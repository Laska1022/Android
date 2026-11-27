import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'ru-RU' });

async function deviceLanguages(page: Page, languages: string[]) {
  await page.evaluate((preferred) => {
    Object.defineProperty(navigator, 'languages', { configurable: true, value: preferred });
    window.dispatchEvent(new Event('languagechange'));
  }, languages);
}

test('Russian device language, campaign briefings, guide and language choice work offline', async ({
  page,
  context,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 340, height: 568 });
  await page.addInitScript(() => {
    if (!localStorage.getItem('rva-save-v1'))
      localStorage.setItem(
        'rva-save-v1',
        JSON.stringify({
          unlocked: 3,
          stars: [3, 2],
          best: 12345,
          robotSkin: 'foundry',
          alienSkin: 'riftborn',
        }),
      );
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page).toHaveTitle('Роботы против пришельцев — Последний форпост');
  await expect(page.getByRole('heading', { name: 'Последний форпост.' })).toBeVisible();
  await expect(page.locator('#best-score')).toHaveText('12\u00a0345');
  await page.getByRole('button', { name: 'Сектор 4: Железный горизонт' }).click();
  await expect(page.locator('#mission-brief')).toContainText('Готовьте артиллерию');
  await expect(
    page.getByRole('button', { name: 'Сектор 5: Последний свет, закрыт' }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Справочник' }).click();
  await expect(page.getByRole('dialog', { name: 'Справочник отряда' })).toBeVisible();
  await expect(page.locator('.guide-grid > div')).toHaveCount(5);
  await expect(page.locator('.keyboard-guide')).toContainText('У/E');
  await deviceLanguages(page, ['en-US']);
  await expect(page.getByRole('dialog', { name: 'Know your squad.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('#mission-label')).toHaveText('IRON HORIZON');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Language', { exact: true }).focus();
  await page.getByLabel('Language', { exact: true }).selectOption('ru');
  const russian = page.getByLabel('Язык', { exact: true });
  await expect(russian).toBeFocused();
  await expect(russian).toHaveValue('ru');
  await expect(page.getByLabel('Облик роботов')).toHaveValue('foundry');
  await expect(page.getByLabel('Облик пришельцев')).toHaveValue('riftborn');
  // Long option names and their labels must fit inside a narrow phone dialog.
  expect(
    await page
      .locator('.select-setting')
      .evaluateAll((rows) => rows.every((row) => row.scrollWidth <= row.clientWidth + 1)),
  ).toBe(true);
  await deviceLanguages(page, ['en-GB']);
  await expect(russian).toHaveValue('ru');
  await page.getByRole('button', { name: 'На форпост' }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  expect(
    await page.evaluate(async () => {
      const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!;
      const { name } = await (await fetch(manifest.href)).json();
      await document.fonts.load('700 20px "Roboto Condensed"', 'Форпост');
      return [name, document.fonts.check('700 20px "Roboto Condensed"', 'Форпост')];
    }),
  ).toEqual(['Роботы против пришельцев — Последний форпост', true]);
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await expect(russian).toHaveValue('ru');
  await deviceLanguages(page, ['en-GB']);
  await russian.selectOption('system');
  await expect(page.getByLabel('Language', { exact: true })).toHaveValue('system');
  await expect(page.getByLabel('Alien skin')).toHaveValue('riftborn');
  await page.getByRole('button', { name: 'Back to the outpost' }).click();
  await expect(page.locator('#best-score')).toHaveText('12,345');
});

test('switching during combat keeps the defenders, loadout, warnings and collectible controls', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 775, height: 364 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Вывести отряд' }).click();
  await page.getByRole('button', { name: 'Линия 3, столбец 2, свободно', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /Линия 3, столбец 2, Импульс, прочность 180/ }),
  ).toBeVisible();
  await expect(page.locator('#battlefield')).toHaveAccessibleName(
    'Поле боя «Первый контакт», пять линий обороны',
  );
  await expect(page.locator('.incoming-lane-label')).toHaveText('Угроза · Линия 3 · Разведчик');
  await page.getByRole('button', { name: /Выбрать робота «Искра»/ }).click();
  await page.getByRole('button', { name: 'Переключить двойную скорость' }).click();
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await page.getByLabel('Язык', { exact: true }).selectOption('en');
  await expect(page.locator('.incoming-lane-label')).toHaveText('Incoming · Lane 3 · Scout');
  await page.getByRole('button', { name: 'Back to the outpost' }).click();
  await expect(page.locator('[data-bot="spark"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#speed-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#energy')).toHaveText('300');
  await expect(page.getByRole('button', { name: /Lane 3, column 2, Pulse/ })).toBeVisible();
  await page.getByRole('button', { name: 'Send wave', exact: true }).click();
  const drop = page.locator('.energy-target').first();
  await expect(drop).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Language', { exact: true }).selectOption('ru');
  await expect(drop).toHaveAccessibleName(/^Собрать 35 ед. энергии на линии [1-5]$/);
  await page.getByRole('button', { name: 'На форпост' }).click();
  const keyboard = await page.context().newCDPSession(page);
  for (const [key, code, control] of [
    ['Й', 'KeyQ', '#beam-button'],
    ['К', 'KeyR', '#recycle-button'],
  ]) {
    await keyboard.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code });
    await keyboard.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
    await expect(page.locator(control)).toHaveAttribute('aria-pressed', 'true');
  }
  await keyboard.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'У', code: 'KeyE' });
  await keyboard.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'У', code: 'KeyE' });
  await expect(page.locator('#pickup-count')).toHaveText('0');
  await expect(page.getByRole('button', { name: /Линия 3, столбец 2, Импульс/ })).toBeVisible();
  await page.getByRole('button', { name: 'Приостановить игру' }).click();
  await expect(page.getByRole('dialog', { name: 'Миссия на паузе' })).toBeVisible();
  await page.getByRole('button', { name: 'Вернуться в штаб' }).click();
  await expect(page.getByRole('button', { name: 'Вывести отряд' })).toBeVisible();
});

test('a Russian campaign victory shows its rating and advances to the translated next sector', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop Chromium drives the full campaign simulation.');
  test.slow();
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Вывести отряд' }).click();
  const lanes = [3, 2, 4, 1, 5];
  await page.getByRole('button', { name: 'Линия 3, столбец 2, свободно' }).click();
  await page.locator('#speed-button').click();
  await page.getByRole('button', { name: 'Начать волну', exact: true }).click();
  const victory = page.getByRole('dialog', { name: 'Рубеж удержан.' });
  let placed = 1;
  // Buy the normal-budget Pulse formation through the same tiles a player taps.
  for (let step = 0; step < 55 && !(await victory.isVisible()); step++) {
    if (placed < 10 && Number(await page.locator('#energy').textContent()) >= 100) {
      const lane = lanes[placed % lanes.length];
      const column = 2 + Math.floor(placed / lanes.length);
      await page
        .getByRole('button', { name: `Линия ${lane}, столбец ${column}, свободно`, exact: true })
        .click();
      placed++;
    }
    await page.clock.runFor(placed < 10 ? 4000 : 10000);
  }
  await expect(victory).toBeVisible();
  await expect(victory.getByLabel('Звёзды: 3 из 3')).toBeVisible();
  await expect(victory.getByText('ВРАГОВ ОСТАНОВЛЕНО')).toBeVisible();
  await deviceLanguages(page, ['en-US']);
  await expect(page.getByRole('dialog', { name: 'The line holds.' })).toBeVisible();
  await deviceLanguages(page, ['ru-RU']);
  await page.getByRole('button', { name: /Перейти в следующий сектор/ }).click();
  await expect(page.locator('#battlefield')).toHaveAccessibleName(
    'Поле боя «Пыль и эхо», пять линий обороны',
  );
});
