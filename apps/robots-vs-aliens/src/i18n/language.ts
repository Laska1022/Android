export type Language = 'en' | 'ru';
export type LanguageChoice = Language | 'system';

export function isLanguageChoice(value: unknown): value is LanguageChoice {
  return value === 'system' || value === 'en' || value === 'ru';
}

export function resolveLanguage(choice: LanguageChoice, preferred: readonly string[]): Language {
  if (choice !== 'system') return choice;
  for (const tag of preferred) {
    const language = tag.toLowerCase().split('-')[0];
    if (language === 'en' || language === 'ru') return language;
  }
  return 'en';
}
