# Russian localization handoff

The Russian-only handoff at `82c585e` was integrated into `codex/rva-wide-arena` for **1.7.0, Android code 10**. Its successor, `codex/rva-alien-field-guide`, also contains the bilingual alien profiles and motion controls for 1.8.0. The current release evidence and remaining Redmi checks are in [HANDOFF.md](HANDOFF.md) and [TESTING.md](TESTING.md#november-28-2026--180-android-code-11). The notes below describe the earlier Russian implementation.

## What the player gets

- By default, the game uses the first supported language in the device’s preference list. It supports Russian regional variants and falls back to English. **Settings → Language → Русский** and **Настройки → Язык → English** apply immediately. Selecting **Язык устройства** resumes following the device.
- The translation includes five sector briefings, all robot and alien types, skins, difficulty and orientation settings, the guide, combat warnings, pickups, pause and results. Russian numbers and plurals apply to combat text. The Russian keyboard uses **Й** for an orbital strike, **К** for recycling and **У** to collect energy.
- Language changes preserve the selected sector, deployed defenders, equipment, speed and open dialog. A saved preference uses the existing cross-tab writer. The branch includes the expanded lanes and energy touch targets from `3218946` and the campaign-save and close-range combat fixes from `329feff`. Those histories meet at `edf1c7b`.
- Both languages and the Cyrillic heading fonts ship offline. The Russian PWA manifest uses the same installation ID as English. The Android launcher has a Russian resource for the device locale. [Command screen](docs/screenshots/russian-command.webp) · [Settings on a phone](docs/screenshots/russian-settings.webp) · [Landscape battle](docs/screenshots/russian-battle.webp)

## Evidence from the Russian checkpoint

- `npm run check` passed 34 unit tests, strict TypeScript, the production build and 50 desktop/mobile Chromium scenarios. Eight browser cases were skipped by their input or platform rules. The offline cache lists 74 files, plus the generated service worker.
- The Russian scenarios exercised an offline reload and language override, an occupied tile, a live energy pickup, the on-screen lane warning, Cyrillic shortcuts, focus restoration, and a three-star First Contact victory followed by entry into the second sector. The full test run passed after the shortcut scenario was updated to send keys to the focused page through Chromium’s input API.
- Browser layout review covered 340 × 568, 393 × 719, 667 × 320, 775 × 364 and 1440 × 960 CSS pixels. Checked controls and settings fit at these sizes. ADB listed no attached device or emulator. Android launcher presentation, TalkBack pronunciation and physical touch/rotation on this revision still need a device.

## Where to edit

The catalogs and language selection are in [src/i18n](src/i18n/). The UI and dialog refresh live in [main.ts](src/main.ts), warning disclosure in [lane-warning.ts](src/game/lane-warning.ts), and language persistence in [storage.ts](src/game/storage.ts). The [browser scenarios](tests/e2e/language.spec.ts) and [language unit tests](tests/unit/language.test.ts) exercise the new behavior. Version 1.8.0 fixes the keyboard-edge and reduced-motion issues in the [original bug list](docs/KNOWN_BUGS.md).
