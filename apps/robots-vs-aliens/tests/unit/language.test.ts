import { expect, it } from 'vitest';
import { messages } from '../../src/i18n';
import { isLanguageChoice, resolveLanguage } from '../../src/i18n/language';
import { SECTORS } from '../../src/game/engine';

it('follows language priority across regional variants and honors an explicit override', () => {
  expect(resolveLanguage('system', ['fr', 'RU-kz', 'en'])).toBe('ru');
  expect(resolveLanguage('system', ['en-GB', 'ru-RU'])).toBe('en');
  expect(resolveLanguage('system', ['fr-FR'])).toBe('en');
  expect(resolveLanguage('system', [])).toBe('en');
  expect(resolveLanguage('en', ['ru-BY'])).toBe('en');
  expect(resolveLanguage('ru', ['en-US'])).toBe('ru');
  for (const value of [null, 'ru-RU', {}, 'toString']) expect(isLanguageChoice(value)).toBe(false);
});

it('uses Russian plurals, number grouping and a briefing for every playable sector', () => {
  const { ru } = messages;
  expect([0, 1, 2, 5, 11, 14, 21, 22].map(ru.points)).toEqual([
    '0 очков',
    '1 очко',
    '2 очка',
    '5 очков',
    '11 очков',
    '14 очков',
    '21 очко',
    '22 очка',
  ]);
  expect(ru.hostiles(21)).toBe('На поле 21 противник');
  expect(ru.number(12345)).toBe('12\u00a0345');
  expect(ru.sectors).toHaveLength(SECTORS.length);
  expect(ru.sectors.every((sector) => sector.description && sector.location && sector.name)).toBe(
    true,
  );
});
