# Next AI handoff — finish the Russian release

Updated November 27, 2026. Resume from the tip of `codex/rva-russian` in `Laska1022/Android`. The working game, tests and screenshots are on that branch. The release candidate is **1.7.0, Android version code 10**. The full web check passed. Android packaging, verification of the public download and publication of the 1.7.0 APK are still pending.

## What the player gets

- By default, the game uses the first supported language in the device’s preference list. It supports Russian regional variants and falls back to English. **Settings → Language → Русский** and **Настройки → Язык → English** apply immediately. Selecting **Язык устройства** resumes following the device.
- The translation includes five sector briefings, all robot and alien types, skins, difficulty and orientation settings, the guide, combat warnings, pickups, pause and results. Russian numbers and plurals apply to combat text. The Russian keyboard uses **Й** for an orbital strike, **К** for recycling and **У** to collect energy.
- Language changes preserve the selected sector, deployed defenders, equipment, speed and open dialog. A saved preference uses the existing cross-tab writer. The branch includes the expanded lanes and energy touch targets from `3218946` and the campaign-save and close-range combat fixes from `329feff`. Those histories meet at `edf1c7b`.
- Both languages and the Cyrillic heading fonts ship offline. The Russian PWA manifest uses the same installation ID as English. The Android launcher has a Russian resource for the device locale. [Command screen](docs/screenshots/russian-command.webp) · [Settings on a phone](docs/screenshots/russian-settings.webp) · [Landscape battle](docs/screenshots/russian-battle.webp)

## Evidence from this checkout

- `npm run check` passed 34 unit tests, strict TypeScript, the production build and 50 desktop/mobile Chromium scenarios. Eight browser cases were skipped by their input or platform rules. The offline cache lists 74 files, plus the generated service worker.
- The Russian scenarios exercised an offline reload and language override, an occupied tile, a live energy pickup, the on-screen lane warning, Cyrillic shortcuts, focus restoration, and a three-star First Contact victory followed by entry into the second sector. The full test run passed after the shortcut scenario was updated to send keys to the focused page through Chromium’s input API.
- Browser layout review covered 340 × 568, 393 × 719, 667 × 320, 775 × 364 and 1440 × 960 CSS pixels. Checked controls and settings fit at these sizes. ADB listed no attached device or emulator. Android launcher presentation, TalkBack pronunciation and physical touch/rotation on this revision still need a device.

## Finish the release

1. Fetch the branch and inspect the working tree. On a fresh clone, switch to `codex/rva-russian`. Read the root and app `AGENTS.md`. Run the following from `apps/robots-vs-aliens/` with Node 22+, Java 21, Android SDK 36 and Build Tools 35.0.0. This cloud checkout provides `/workspace/toolchains/activate.sh`. Use the system Chromium override when Chromium is installed at that path.

   ```sh
   npm ci
   CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check
   npm run android:sync
   (cd android && ./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug)
   ```

2. Inspect `android/app/build/outputs/apk/debug/app-debug.apk`. Run `apksigner verify --verbose --print-certs` and `aapt2 dump badging` from the SDK build-tools directory. Confirm the package is `com.laska.robotvsaliens`, the version is `1.7.0`, code is `10`, and the Russian application label is **Роботы против пришельцев**. Compare each `dist/` file with the corresponding `assets/public/` ZIP entry. This catches a stale Capacitor sync.
3. Record the native results in `TESTING.md`. Push the tested branch normally. Confirm `robots-vs-aliens-v1.7.0` is available, then tag the tested commit for the requested GitHub Release. The existing `.github/workflows/ci.yml` publishes the debug APK after the tagged web and Android jobs pass. Follow all three jobs to completion.
4. Download the public asset, compare its SHA-256 with the release notes, verify its signer and embedded version, and compare its web files to the checked build. Compare the public signing certificate with 1.6.0 before advising players about in-place upgrades. The published 1.6.0 fingerprint begins `89ee1aa3bfef`. Uninstalling an existing game erases its local campaign.
5. Add the release URL, checksum, test totals, commit and any device results to the [main handoff](HANDOFF.md) and [test record](TESTING.md). The first AI owns integration with main and the Redmi check. On a compatible installation, start in Russian, collect a gold pickup over a lane, change language mid-wave, use Android Back, rotate, and reopen offline. Check the saved language and campaign stars.

## Where to edit

The catalogs and language selection are in [src/i18n](src/i18n/). The UI and dialog refresh live in [main.ts](src/main.ts), warning disclosure in [lane-warning.ts](src/game/lane-warning.ts), and language persistence in [storage.ts](src/game/storage.ts). The [browser scenarios](tests/e2e/language.spec.ts) and [language unit tests](tests/unit/language.test.ts) exercise the new behavior. The separate keyboard-edge and reduced-motion reports remain in the [existing bug list](docs/KNOWN_BUGS.md).
