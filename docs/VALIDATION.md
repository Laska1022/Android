# Validation record

Validated in the Codex cloud workspace on October 27, 2026. The repository started empty; all application code and game assets were created for this project.

## Web and game simulation

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check` passed:

- **14 unit tests passed** across simulation and save-data suites.
- **TypeScript strict checking and the production build passed.**
- **5 browser tests passed** across desktop Chromium (1440 × 960) and Pixel 7 mobile emulation.
- **1 test intentionally skipped:** the desktop keyboard/focus scenario on the mobile project. Its desktop counterpart passed.

The unit tests exercise placement validation, budget handling, generators, pickup collection, health-based refunds, lane targeting, kills and scoring, slowing, splash damage, enemy melee/ranged attacks, orbital cooldown, emergency sweepers, defeat, pause, automatic waves, victory/survival, malformed saves, and inaccessible storage. A funded squad completes a whole first-sector battle through real combat, including the final Overlord. This test validates combat completion; it does not establish normal-budget balance.

Browser checks exercise real deployment and recycling, resource updates, pause/resume, starting a wave, guide interaction, preference persistence, keyboard tile navigation, dialog focus trapping, and an offline reload followed by successful deployment. The interaction test reported no page errors. Tests also assert that the phone layout has no horizontal overflow.

Desktop command and battle screenshots and phone command and battle screenshots were inspected. Representative images are in `docs/screenshots/`. Mobile emulation is not physical-device validation.

Two defects found during verification were fixed and retested: a missing accessible label when the guide text was hidden on phones, and a cache mismatch caused by the preview server's `Vary: Origin` header. All fonts and game assets are now locally bundled.

## Android

The native project uses Capacitor 8, Java 21, Gradle 8.14.3 (distribution SHA-256 pinned), compile/target SDK 36, and minimum SDK 24. Android SDK command-line tools were downloaded over verified TLS and checked against Google's published repository checksum. **`assembleDebug` and `lintDebug` both passed.** A development-signed APK was produced (approximately 4.1 MB). The Capacitor library uses its upstream lint baseline; no assertions or project checks were disabled to pass the build. The final app lint report contains 0 errors and 4 warnings (an empty legacy resource qualifier and three generated resources considered unused). The Cordova compatibility module reports an available upstream update. These are warnings, not test failures. The APK signature and inclusion of the current production web build were also checked. A complete JDK was installed after the base image was found to contain only a Java runtime.

No physical Android phone or emulator session has been run. Native runtime behavior, performance, lifecycle transitions, WebView compatibility, and release signing remain separate validation tasks.

## Remaining limitations

- Balance is initial; normal-budget playtesting across all five sectors is still needed.
- Sector names/difficulty differ, but the landscape art is shared between sectors.
- Music, boss phases, interactive onboarding, mid-battle save/resume, and cloud saves are future improvements.
- Campaign progress is local to the browser/device and can be removed by clearing app data.
- Full nonvisual gameplay is not implemented; keyboard controls and labeled placement buttons are available.
- GitHub/Azure workflows are included. Their remote execution and hosting deployment are not implied by local checks.
- A debug APK is for testing. Store publication requires secure release signing, store materials, and device testing.

The prioritized follow-up plan and acceptance criteria are in `docs/AZURE_AI_HANDOFF.md`.
