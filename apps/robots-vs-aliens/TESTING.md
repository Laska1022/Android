# Testing Robots vs Aliens

Run commands from `apps/robots-vs-aliens/`. The web tests need Node 22 or newer. The native build needs a full Java 21 JDK, Android SDK platform 36, Build Tools 35.0.0 and accepted SDK licenses. Set `JAVA_HOME` and `ANDROID_HOME` to those installations. Keep local paths out of version control.

## Reproduce the automated checks

```sh
npm ci
npx playwright install --with-deps chromium
npm run check
npm run android:sync
cd android
./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug
```

On Windows use `gradlew.bat`. For an installed Chromium browser set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable and skip the browser download. In a fresh checkout the game CI uses Node 22, Chromium and Temurin 21. A game PR runs both web and Android jobs. See the [game workflow](../../.github/workflows/ci.yml).

The Android job requests `platform-tools`, `platforms;android-36` and `build-tools;35.0.0` explicitly. The setup action's default also requested the retired `tools` package and failed before Gradle started on the hosted runner. [Original CI log](https://github.com/Laska1022/Android/actions/runs/45652395673)

| Check                                | What to inspect                                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                           | Seeded simulation, control-independent balance and save parsing. Keep any funded combat stress test separate from a real starting-budget campaign.                                                           |
| `npm run build`                      | Strict TypeScript, Vite production output and the generated offline precache.                                                                                                                                |
| `npm run test:e2e` after a build     | Desktop and Pixel 7 viewport projects start a local preview on port 4173. Inspect screenshots and failure traces in `test-results/`. The mobile project explicitly skips the desktop keyboard-only scenario. |
| `assembleDebug lintDebug` after sync | APK at `android/app/build/outputs/apk/debug/app-debug.apk`. App lint results in `android/app/build/reports/`.                                                                                                |

For cloud-only work, exercise setup, deployment, pickups, pause/resume, preferences and an offline reload in Playwright. An Android emulator can additionally test native startup, rotation and Activity lifecycle. Create an AVD with an installed SDK system image, start it, and select its emulator serial in the commands below. Record the API and WebView separately. Run the build and browser checks even when the environment lacks emulator acceleration.

## Reproduce a muted USB phone test

Use an authorized USB device. These examples use a POSIX shell. In PowerShell use `$device = '...'` and pass `$device` to the same ADB commands. First list devices, then replace `SERIAL_FROM_ADB` with the intended phone's serial.

```sh
adb devices -l
device=SERIAL_FROM_ADB
adb -s "$device" shell getprop ro.product.model
adb -s "$device" shell getprop ro.board.platform
adb -s "$device" shell getprop ro.build.version.release
adb -s "$device" shell getprop ro.build.version.sdk
adb -s "$device" shell cat /proc/meminfo
adb -s "$device" shell wm size
adb -s "$device" shell wm density
adb -s "$device" shell dumpsys webviewupdate
adb -s "$device" install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s "$device" shell am start -W -n com.laska.robotvsaliens/.MainActivity
```

1. Start at the command screen. The app plays no sound on launch. If sound is on, tap the speaker once to mute **before deploying**. On an instrumented WebView, `#sound-button[aria-pressed="false"]` confirms mute. Keep the phone's media-volume setting intact.
2. Inspect the command screen and battlefield at the actual device viewport. Try a first Cadet deployment, send a wave, collect energy, recycle, pause/resume, change speed and use the orbital strike when available. Check lane alignment, affordability text, screen edges and visible feedback. Exercise a Veteran start separately.
3. Background and return to an active mission. Check that the game paused. Complete a mission at the normal starting budget and relaunch to check unlocks and preferences. Record any scenario that was skipped. Avoid clearing app data or uninstalling from a phone with existing progress.
4. Capture only the app display. The following commands use a temporary phone file to preserve PNG bytes across shell versions. Collect process memory and frame stats during combat; record the scene and sampling duration alongside the values.

```sh
adb -s "$device" shell screencap -p /data/local/tmp/rva-screen.png
adb -s "$device" pull /data/local/tmp/rva-screen.png rva-screen.png
adb -s "$device" shell rm /data/local/tmp/rva-screen.png
adb -s "$device" shell dumpsys meminfo com.laska.robotvsaliens
adb -s "$device" shell dumpsys gfxinfo com.laska.robotvsaliens reset
# Play the measured combat interval, then capture the frame statistics.
adb -s "$device" shell dumpsys gfxinfo com.laska.robotvsaliens framestats
adb -s "$device" shell pidof com.laska.robotvsaliens
# Substitute the app PID just obtained.
adb -s "$device" logcat -d --pid=APP_PID
```

Android UI frame statistics, WebView animation callbacks and simulated game time measure different things. Label the source, interval and workload. PSS from `dumpsys meminfo` measures the processes listed in that report; report the WebView renderer separately if measured. Inspect app and Chromium console errors and Android crash logs around the test interval. Preserve only relevant, sanitized evidence.

## Validation record

### November 27, 2026 · 1.7.0, Android code 10

- The release candidate passed 34 unit tests, strict TypeScript, the production build and 50 Chromium desktop/mobile scenarios. Eight platform-specific scenarios were skipped. The service worker precaches 74 files.
- Tested the Russian default, a saved override, device-language changes, Cyrillic shortcuts, translated live announcements and pickup controls, an offline reload, and a three-star victory followed by the second sector. Reviewed the command screen, Settings and battlefield from 340 × 568 portrait through 1440 × 960 desktop, including 775 × 364 landscape. [Russian settings](docs/screenshots/russian-settings.webp) · [Russian battlefield](docs/screenshots/russian-battle.webp)
- Android assembly, lint and release verification are pending. ADB listed no connected device. [Continuation instructions](NEXT_AI_RUSSIAN.md)

### November 27, 2026 · 1.6.0, Android code 8

**Pickup reproduction.** The web bundle extracted from the published 1.5.1 APK ran at 775 × 364 in Chromium with touch emulation. A real touchscreen tap 18 CSS pixels below the gold bolt’s center deployed the selected Bastion. Energy fell from 194 to 119 and the pickup count stayed at one. In the new build the same offset activates the pickup’s 44 × 44 button, awards 35 energy and leaves the underlying tile alone. Browser tests repeat this with a build selected, with Recycle over an occupied tile, and with Orbital Strike armed. They also exercise Enter on an individual drop, the Collect button for two simultaneous drops and the E shortcut.

**Usable lane area.** These measurements come from the actual 9 × 5 button grid during a mission. Screen and grid dimensions are in CSS pixels, rounded to the nearest pixel. Classic matched the published 1.5.1 grid in the landscape phone comparison.

| Viewport | Classic console | Expanded lanes |
| --- | ---: | ---: |
| 775 × 364 landscape phone | 437 × 141 | 514 × 202 |
| 393 × 719 portrait phone | 284 × 139 | 297 × 199 |
| 1440 × 960 desktop | 827 × 377 | 967 × 567 |

**Art and settings.** Exercised the three field finishes after an offline reload and switched layouts during the same mission with a deployed defender. Pixel comparisons sampled the actual rendered tiles. The late-response check confirms a previous material cannot overwrite the selected finish. A blocked material request still leaves the lane markings and deployment targets usable. [Copper foundry, landscape](docs/screenshots/field-copper-foundry.webp) · [Polar relay, landscape](docs/screenshots/field-polar-relay.webp)

**Automated and native checks.** All 29 unit tests passed. The desktop and mobile browser projects passed 41 scenarios with seven input- or platform-specific skips. The expanded-layout viewport check includes 340 × 568 portrait, 667 × 320 landscape and 915 × 600 tablet. Capacitor sync, Gradle `assembleDebug` and `lintDebug` passed. Android app lint reported zero errors and four warnings. The local v2-signed APK identifies as `com.laska.robotvsaliens`, 1.6.0, code 8. All 69 bundled production files, including 41 WebPs, matched the tested build.

**Browser timing.** In Chromium 156.0.8078.79 at the landscape phone viewport, the released 1.5.1 Classic view and both new Expanded lanes materials each delivered 60.0 animation callbacks per second. The p95 intervals were 16.7 ms for Classic, 16.7 ms for Copper foundry and 16.8 ms for Polar relay. Each sample used 360 callbacks after 60 warm-up frames in First Contact at 2× with a Pulse and a Bastion.

**Published APK.** All three hosted jobs passed for tag `robots-vs-aliens-v1.6.0` at `d78296f`. The public download is 10,279,124 bytes. Its SHA-256 `13fafab7d0df5e13d89575aa3fb68c85a9ddae308ca9e0b85a8c9046023e41de` matches the release notes. The downloaded artifact passed v2 signature verification and all 69 web files matched the tested build. Its signing certificate begins with `89ee1aa3bfef`. The published 1.5.1 certificate begins with `885b90ad080d`. Android blocks an in-place update between them. [GitHub Release](https://github.com/Laska1022/Android/releases/tag/robots-vs-aliens-v1.6.0) · [Hosted checks](https://github.com/Laska1022/Android/actions/runs/45949537473)

**Device follow-up.** ADB listed no connected phone or emulator. The first AI has the Redmi touch, orientation and save-persistence scenario. [Message for the first AI](HANDOFF.md#message-for-the-first-ai)

### November 27, 2026 · 1.5.3, Android code 9

- **Browser and simulation.** All 30 unit tests and 36 Chromium desktop/mobile tests passed, with four platform-specific skips. A separate two-tab run won Cadet First Contact with three stars and 4,090 points using the normal budget. Sound was toggled in the older tab. After reload, mute, all three stars, the best score and the sector 2 unlock persisted. The seeded close-contact reproduction recorded three Pulse hits against the Scout at both tested positions. [Reproduction details](docs/KNOWN_BUGS.md)
- **Android package.** Capacitor sync, `assembleDebug` and `lintDebug` passed. App lint reported four warnings and zero errors. The debug APK reported version 1.5.3, code 9, passed v2 signature verification and contained all 67 production files byte for byte. No physical Android device was attached for this run.

### November 27, 2026 · 1.5.2, Android code 8

- **Published APK.** GitHub built tag `robots-vs-aliens-v1.5.2` at `5672626`. The downloaded APK is 10,244,945 bytes and its SHA-256 is `dbb962eeedf25f2aed865561fdf3f44e1841e7afbb848302baed11a3a1b4f735`. It passed v2 signature verification. Its package is `com.laska.robotvsaliens`, version 1.5.2, code 8. All 67 production web files matched the independent hosted web job byte for byte. Compared with the local Redmi build, the game JavaScript, CSS and art were identical. HTML whitespace, text-file line endings and the resulting cache identifier differed. [GitHub release](https://github.com/Laska1022/Android/releases/tag/robots-vs-aliens-v1.5.2) · [Web, Android and publication jobs](https://github.com/Laska1022/Android/actions/runs/45950300989)
- **Upgrade compatibility.** The public APK’s signer certificate SHA-256 begins `82fd5afabbcf`. Published 1.5.1 used `885b90ad080d`. Android will reject an in-place upgrade from that public build. Preserve the existing installation when it holds valued progress. The in-place Redmi test below used the local signing identity for both builds.
- **Automated.** The complete release run passed 28 unit tests and 32 desktop/mobile Chromium scenarios. Four input-specific cases were skipped. An earlier run timed out waiting for the service worker in the mobile offline-launch case. That case passed five consecutive repeats and the full rerun. Capacitor sync, `assembleDebug` and `lintDebug` passed. App lint reported four warnings and zero errors.
- **Local Android package.** The tested debug APK was 10,246,604 bytes with SHA-256 `1ca2e70dd6853f31067f5f71fba1509e7081bb8af5a1265a2c6931043b1cd85d`. All 67 production web files matched their APK entries. Precache URLs use forward slashes on Windows and Linux.
- **Physical Redmi Note 7.** The muted local build upgraded in place from the Android Back build of 1.5.1. Android 9 / WebView 101 displayed 775 × 364 CSS pixels in landscape. All five three-star ratings, the 12,710 best score, Cadet, mute, Foundry and Riftborn survived. Android Back dismissed Settings, paused on an identical battlefield image and resumed the mission.
- **Combat.** In First Contact a lane-three Scout walked through all 24 frames, struck a Bastion in column nine (950 to 931 health) and showed all 24 attack frames at 2×. It resumed walking after recycling. A short sample after recycling measured 59.98 WebView animation callbacks/s over 180 intervals and 16.67 ms at p95. The command screen remained muted on exit. [Physical contact screenshot](docs/screenshots/redmi-scout-contact-1.5.2.jpg)
- **Ranged attack on Redmi.** In the Nest, five Bastions in column six gave Riftborn Spitters targets at range. At 2× the canvas displayed all 24 walk and 24 attack frames. The first attack pose coincided with acid leaving the Spitter in its lane. A 180-interval sample in wave one measured 59.64 callbacks/s and 16.68 ms at p95. The game returned to command with its campaign and mute intact. Sustained Survival and current Android releases remain device follow-ups. [Physical Nest screenshot](docs/screenshots/redmi-spitter-1.5.2.jpg)

### November 27, 2026 · 1.5.1, Android code 7

#### Main build with Android Back at `9be2de4`

- **Hosted.** The web and Android jobs passed for `9be2de4` on main. [GitHub Actions run](https://github.com/Laska1022/Android/actions/runs/45900000216) · [Downloadable debug APK artifact](https://github.com/Laska1022/Android/actions/runs/45900000216/artifacts/15155930507)

- **Build and cloud-compatible tests.** All 28 unit tests and 30 browser cases passed. Four platform-specific browser cases were skipped as designed. The browser suite invokes the cancelable Back event and exercises an actual loss result, a held Escape key, pause/resume, offline equipment changes and missing-atlas fallback. Capacitor sync, debug assembly and Android lint passed with zero app errors and four warnings.
- **Tested APK.** The local debug APK was 7,680,477 bytes, SHA-256 `02a64104a85cbcc296960bf630d38a7c087f442f6044ca8246d9ebb450b6155c`. All 67 production files, including the 39 WebP images and generated service worker, matched the APK entries byte for byte.
- **Redmi upgrade and Back.** Installed over 1.4.0 on the Redmi Note 7 without clearing data. The first screen opened at 775 × 364 CSS pixels. Five three-star ratings, best score of 12,510, Cobalt ceramic, Ember brood and in-game mute persisted. Real Android Back events dismissed Settings and the field guide in command, paused and resumed live combat, and retained the squad. With a native selector open, the first Back dismissed the picker and the next dismissed Settings. From bare command, Android handled Back normally. Newer Android predictive gestures require another device. The app-filtered error log and package crash buffer had zero matching runtime or crash entries. The game was left muted at command.

**Physical art and campaign check.** On the same Redmi, select Foundry and Riftborn in Settings, close the app process, reopen and check both selectors. Both new selections and all campaign progress survived. At the normal Cadet budget the Badlands cleared five waves with 60 aliens stopped and 6,640 points. The Nest cleared six waves with 120 stopped and 12,710 points. System Back returned directly from both victory dialogs to command. A separate short canvas observation at 2× during wave four of the Nest recorded all twelve Runner gait frames and 228 Pulse upper-carriage recoil draws. [Badlands screenshot](docs/screenshots/redmi-foundry-badlands.webp) · [Nest screenshot](docs/screenshots/redmi-riftborn-nest.webp)

**Installed-game performance.** Wave-two samples covered each combination of 1×/2× and full/reduced motion in both sectors with the alternate finishes. Each sample tracked 180 WebView animation intervals. The eight samples measured 59.6–60.0 callbacks/s and approximately 16.68 ms at p95. Separate memory snapshots measured 137,697–139,603 KiB PSS for the app and 70,697–82,670 KiB PSS for the game-bound WebView renderer. The battery sensor read 27–28 °C. Combat continued between samples, so the live scenes differed. [Individual measurements](docs/benchmarks/redmi-1.5.1.json)

**Controlled physical Chrome comparison.** A USB-loopback QA page on the same device replayed the published Last Light renderer fixture with 30 robots, 30 aliens, 20 shots and 120 particles. The canvas backing was 1440 × 840, scaled to fit a 393 × 719 CSS-pixel Chrome 101 viewport. Each pass warmed up for 60 callbacks and recorded the next 360. The order was 1.4.0 standard, 1.5.1 standard, 1.5.1 alternate, then the reverse. All six samples delivered 59.97–59.98 callbacks/s. The p95 CPU draw submission times were 7.0/7.5 ms for the baseline, 7.4/7.5 ms for integrated standard art, and 7.8/7.5 ms for Foundry/Riftborn. These short runs do not measure sustained thermal throttling. The Android APK measurements above used actual combat. [Six controlled samples](docs/benchmarks/redmi-1.5.1.json)

#### Published alien-animation build at `5a9da25`

- **Web and combat.** All 28 unit tests passed. Desktop Chromium and Pixel 7 emulation passed 26 browser scenarios, with two input-specific skips. In the ordinary Cadet UI, a player bought a Bastion in lane 3, column 9. The first Scout walked to it, dealt damage through repeated attack frames at one fixed position at both speeds, paused on an identical canvas and resumed walking after recycling. The warning remained visible beyond the incoming Scout. Reduced motion, a failed sheet, skin switching and an offline reload are covered. [First Contact at 775 × 364](docs/screenshots/alien-contact-phone.webp)
- **Visible movement.** At a 583 × 241 CSS-pixel battlefield, opposite 1.5.0 walk frames changed zero upper-body silhouette pixels for each of the 15 species and skin combinations. The same alpha-mask comparison in 1.5.1 changed 28–189 upper-body pixels when walking and 55–359 between anticipation and contact. The browser suite checks both halves of all 30 walk and attack silhouettes offline. Baking every atlas twice produced identical bytes. The clip shows five real game simulations per column per finish, sampled at 20 fps. The left side advances and the right actually damages a Bastion. [8-second motion comparison](docs/screenshots/alien-motion.webp)
- **Android.** Capacitor sync, Gradle `assembleDebug` and `lintDebug` passed. Android app lint reported zero errors and four warnings. The local v2-signed debug APK reported `com.laska.robotvsaliens`, version 1.5.1, code 7. All 67 production files, including the 39 WebPs, matched the APK byte for byte.
- **Published APK.** GitHub Actions passed its web, Android and release jobs at tag `robots-vs-aliens-v1.5.1`, commit `5a9da25`. The public download is 10,242,713 bytes. Its SHA-256 is `e84bc49a12330524ad052be297fcbf6ed0cd73689e57cca69dcc06fcba868b78`, matching the release notes. It passed v2 signature verification and all 67 packaged web files matched the tested build. [GitHub Release](https://github.com/Laska1022/Android/releases/tag/robots-vs-aliens-v1.5.1) · [Hosted checks](https://github.com/Laska1022/Android/actions/runs/45901475391)
- **Upgrade compatibility.** The published 1.5.0 signing certificate starts with `51094d51e2dd` (SHA-256). The 1.5.1 certificate starts with `885b90ad080d`. Android rejects an in-place update between these builds. Uninstalling erases device-local progress. Use a separate test device to keep a 1.5.0 campaign intact. A persistent signing key held by the release owner is needed for reliable updates in a future release series.
- **Physical device.** ADB listed zero attached devices. Phone frame delivery, process memory, thermal behavior and upgrade persistence on the Redmi remain open. [Hardware scenario](ART_HANDOFF.md#delivered-on-november-27-2026)

The renderer comparison uses 30 aliens (15 walking, 15 attacking), 30 robots, 20 projectiles and 120 particles at DPR 2. Each trial discards 60 warm-up frames and measures 360 callbacks. The table gives the median of three interleaved trials on Linux Chromium 156.0.8078.79. Replaying 1,200 fixed steps with standard skins at 1× and alternate skins at 2× produced identical serialized game states.

| Version and brood | Animation callbacks/s | p95 frame interval | p95 draw submission |
| --- | ---: | ---: | ---: |
| 1.5.0 Native | 60.0 | 16.7 ms | 0.7 ms |
| 1.5.1 Native | 60.0 | 16.7 ms | 0.7 ms |
| 1.5.0 Riftborn | 59.8 | 16.7 ms | 0.6 ms |
| 1.5.1 Riftborn | 60.0 | 16.7 ms | 0.7 ms |

Run the same fixture against the released source from the app directory.

```sh
baseline_src=$(mktemp -d)
repo_root=$(git rev-parse --show-toplevel)
git -C "$repo_root" archive robots-vs-aliens-v1.5.0 apps/robots-vs-aliens/src |
  tar -x -C "$baseline_src" --strip-components=2
node scripts/measure-render.mjs "$baseline_src"
node scripts/measure-render.mjs .
node scripts/measure-render.mjs "$baseline_src" alternate
node scripts/measure-render.mjs . alternate
```

### November 26, 2026 · 1.5.0, Android code 6

Tested game commit `a3b1e24` on `codex/rva-foundry-riftborn` against `0176911`, the 1.4.0 release handover. Node 24.22.3, Chromium 156.0.8078.79 and Java 21 were used in the cloud checkout.

- `npm ci` and `npm run check` passed. All 28 unit tests and 24 desktop/Pixel 7 browser scenarios passed. Two tests are specific to the opposite input mode and were skipped. Strict TypeScript, the production build and its 66-file service worker precache passed.
- Offline checks decoded all ten new portraits and all three stride atlases. Each sheet contains twelve poses for each of five species. Pixel checks found different front and rear leg silhouettes in opposing poses for every row. Tests exercised independent selectors, original and unsupported save IDs, previews, cards, the guide, placement ghosts, firing, 1×, 2×, pause and reduced motion. Blocking the atlas request drew the selected static Scout and kept the Cadet lane warning.
- The same Veteran replay in Last Light produced identical serialized simulation state at 1,200 fixed steps with standard skins at 1× and Foundry/Riftborn at 2×. This compares queued threats, RNG, units, projectiles, health, timers and economy. Seed 1154 starts with Pulse, Frost, Spark, a Runner and a Spitter. The replay is included in the render measurement script.
- Captures compare the same five defenders and five threats in the Badlands and the Nest on both revisions. The canvas occupied 583 × 241 CSS pixels in a 775 × 364 emulated landscape viewport. The two-second motion sample shows staged firing, recovery and footfalls at 18 captured frames/s. Settings was also inspected at 1440 × 960 and 393 × 719. [Before and after](docs/screenshots/unit-motion.webp) · [Motion sample](docs/screenshots/foundry-riftborn.webp) · [Settings](docs/screenshots/foundry-settings.webp)

**Crowded battle benchmark.** A headless Chromium window drew a 720 × 420 CSS-pixel canvas at DPR 2. The fixture keeps 30 robots, 30 aliens, 20 shots and 120 particles visible on the Last Light platform. It warms up for 60 frames and measures the next 360 callback intervals. Three runs per configuration were interleaved on the same machine. The table reports the median of the three per-run results. Draw submission measures time spent inside `renderer.draw` on the main thread. GPU completion and physical display timing require device measurements.

| Renderer and loadout | Callbacks/s | p95 callback interval | p95 draw submission |
| --- | ---: | ---: | ---: |
| 1.4.0 Factory alloy / Native carapace | 60.0 | 16.7 ms | 0.6 ms |
| 1.5.0 Factory alloy / Native carapace | 60.0 | 16.7 ms | 0.7 ms |
| 1.5.0 Foundry ceramic / Riftborn obsidian | 60.0 | 16.7 ms | 0.6 ms |

To repeat on the same browser, run from the app directory. The temporary baseline contains only the original source and assets. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if using system Chromium.

```sh
baseline_src=$(mktemp -d)
git archive 0176911:apps/robots-vs-aliens src | tar -x -C "$baseline_src"
node scripts/measure-render.mjs "$baseline_src"
node scripts/measure-render.mjs .
node scripts/measure-render.mjs . alternate
```

**Android.** Capacitor sync, `assembleDebug` and `lintDebug` passed. App lint reported zero errors and four warnings. The 7,678,121-byte APK passed v2 signature verification and identified itself as `com.laska.robotvsaliens`, code 6. All 67 production files, including all 39 WebPs and the service worker, matched their APK entries byte for byte. SHA-256 `1c46d9607993273ea959c87edea6ddc5fa6e3f8577e808715d41347734dc1bf7`.

**Published APK.** The hosted runner built `robots-vs-aliens-1.5.0-debug.apk` from tag `robots-vs-aliens-v1.5.0` at `0a7ee06`. The public download measured 7,678,121 bytes. Its SHA-256 matched the release notes (`410abf6c4a837678473dd3e289cbc4fedcc67bf352a1519ea69d7cee97ea3aee`). The downloaded package passed v2 signature verification, reported version code 6 and contained all 67 verified web build files. [GitHub Release](https://github.com/Laska1022/Android/releases/tag/robots-vs-aliens-v1.5.0) · [Hosted checks](https://github.com/Laska1022/Android/actions/runs/45862945062)

The cloud run had no attached Android device. The integrated 1.5.1 release was subsequently tested on the Redmi with both new skin families, as recorded in the November 27 section above.

### November 26, 2026 · 1.4.0, Android code 5

- **Hosted verification.** Both GitHub Actions jobs passed for `0176911`. The run published the production web build, browser evidence and Android debug package. [Hosted run](https://github.com/Laska1022/Android/actions/runs/45813582262) · [Debug APK artifact](https://github.com/Laska1022/Android/actions/runs/45813582262/artifacts/15114865206)
- **Cross-branch balance verification.** Separately ran the RVA-01 suite from `3397ec1` against the 1.4.0 engine. All 48 cases passed across four sectors, three seeds, two difficulties and two squad strategies. Each mixed-squad Cadet case won on its normal budget. The suite remains owned by its source branch and is additional to the integrated unit count.

- **Automated.** 28 unit tests passed. The desktop Chromium and Pixel 7 browser projects passed 18 scenarios with two platform-specific skips. Tests exercise actual queued spawns including the Overlord, difficulty disclosure, pause, 2×, old saves, independent skin choices, offline reload, all 26 WebPs and late scene loading. Set `RVA_TEST_PORT` to use a different loopback port if another local checkout owns 4173.
- **Native build.** TypeScript and production build, Capacitor sync, Java 21 debug assembly and lint passed. App lint reported zero errors and four warnings. All 54 production files, including the generated worker, matched their APK entries byte for byte. Tested local debug APK SHA-256 `def902e7f4e0749825b9dfa891964cae50b3698d5b7216b1857bb41d6b5669fe`, 5,752,272 bytes. Hosted debug signing can produce a different hash.
- **Physical Redmi Note 7.** Updated the existing 1.3.0 install while keeping saved progress and game mute. First 1.4.0 launch used 775 × 364 CSS pixels in landscape. During Cadet setup the incoming cue named the middle-lane Scout. Selected Cobalt ceramic and Ember brood, placed defenders, then selected Follow phone in Settings. The viewport changed to 393 × 775 in portrait, existing defenders remained and a new edge placement landed in the intended cell. Follow phone opened in portrait after force-stop. Selecting Landscape then force-stopping again reopened horizontally. Five three-star ratings, a best score of 12,510, both finishes and mute persisted.
- **Mode and frame checks.** Veteran and Survival both showed the next lane only. During a 2× Cadet wave-two sample with 11 defenders using the alternate finishes, 180 WebView animation intervals gave 60.0 callbacks/s, 16.674 ms median and 16.676 ms p95. The app-process PSS sample was 125,521 kB. [Cadet lane cue](docs/screenshots/redmi-incoming-lane.webp) · [Veteran combat](docs/screenshots/redmi-veteran-warning.webp) · [Android settings](docs/screenshots/redmi-loadout-settings.webp)
- **Remaining physical coverage.** Both landscape grips are enabled by Android policy. Reverse-grip rotation, prolonged Survival, current Android tablet policies and API 24 remain device follow-ups. Browser emulation alone cannot establish these outcomes.
- **Campaign and stability.** A normal-budget Cadet First Contact run with both alternate finishes beat all four waves, stopped 32 aliens, earned three stars and scored 4,300. The tested game PID returned zero matching AndroidRuntime, uncaught WebView or orientation-plugin error lines. The crash buffer contained zero matches for the package.
- **Capture observation.** During one automated landscape playthrough, input continued into another first wave before the harness recorded the prior result. A dedicated observer captured the subsequent victory dialog. The cause of the first transition was not isolated. Recheck the finish dialog during rapid tapping.

### November 26, 2026 · 1.3.0, Android code 4

On the same Redmi in portrait, the muted, normal-budget Cadet exercise cleared all four later sectors with three stars. The test purchased a mixed squad, collected pickups and used 2×. Sector scores were 6,290 / 8,370 / 10,990 / 12,510. Separate wave-two samples of 180 WebView frame intervals measured 58.7 / 58.7 / 59.3 / 59.0 callbacks/s. These runs exercised the earlier spawn scheduler. Version 1.4.0 has separate warning tests and its own device samples above.

### Physical test device

| Item               | November 25, 2026 measurement                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| Model and platform | Xiaomi Redmi Note 7, `lavender`, Snapdragon 660, ARM64                                              |
| OS and WebView     | Android 9, API 28. Android WebView provider Chrome 101.0.4951.61.                                   |
| Display            | 1080 × 2340, Android density 440 dpi. The tested portrait Chrome viewport was 393 × 719 CSS pixels. |
| RAM                | `MemTotal` 3,824,404 kB as reported by the kernel                                                   |

### November 25, 2026 · 1.0.0 baseline

Local checkout `39a3e9f`, Node 24.13.1, npm 11.8.0, installed Edge 158 headless, Temurin 21.0.13.1 and Gradle 8.14.3.

- Automated checks passed. Fourteen unit tests passed. Five browser tests passed with one intentional mobile keyboard skip. TypeScript, the production build, the offline precache (27 files), Capacitor sync, Android assembly and lint passed.
- The debug APK measured 4,281,792 bytes and passed APK Signature Scheme v2 verification. App lint reported zero errors and four warnings.
- **Physical APK baseline.** The APK installed on the USB Redmi. ADB reported an Activity launch time of 1,767 ms. The portrait WebView measured 393 × 775 CSS pixels. With three deployed Pulse defenders during the opening wave, 180 `requestAnimationFrame` intervals gave 58.0 callbacks/s, median 16.672 ms and p95 16.754 ms. A separate sample during that mission reported main-app total PSS of 135,489 kB. The Activity time measures native launch and excludes a timed interaction with the loaded board.
- **Physical browser baseline.** The production web game ran in Chrome on the same phone with the in-game speaker muted. With three Pulse defenders during wave one, 180 `requestAnimationFrame` intervals yielded 55.9 callbacks/s, median 16.68 ms and p95 33.32 ms. This sample describes Chrome's callback cadence. A separate native run measures the APK.

See [historical validation](docs/VALIDATION.md) for the October 2026 cloud runs.

### November 25, 2026 · 1.1.0

- **Automated.** All 21 unit tests passed, including three normal-budget seeds that cleared First Contact with full core integrity and 32 kills. The original funded Veteran combat test cleared 40 enemies including its Overlord. Seven browser scenarios passed on desktop Chromium and Pixel 7 emulation, with the desktop keyboard case skipped on mobile. Strict TypeScript, the production bundle, the 27-file precache, Capacitor sync, Android assembly and lint passed.
- **Physical.** Installed using `adb install -r` on the same Redmi. Completed all four Cadet First Contact waves through touch input with the normal budget, sound muted and 2× speed. The mission showed 32 enemies stopped, 4,060 points, full core integrity, three stars and 3:04 of simulated time. The local save contained the sector 2 unlock, best score, difficulty and mute preference.

### November 25, 2026 · 1.2.0

- **GitHub Actions.** Commit `c213a6e` passed both the hosted web and Android jobs, including the corrected SDK setup, APK assembly and lint. The run includes browser evidence and a downloadable debug APK. The Redmi results below refer to the locally signed build of the same game. [Successful run and artifacts](https://github.com/Laska1022/Android/actions/runs/45652679628)
- **Automated.** All 21 unit tests and 10 applicable browser scenarios passed. Two project-specific scenarios were intentionally skipped (desktop keyboard on mobile and phone touch on desktop). New browser checks load all ten unit images and the command and perimeter artwork offline, and exercise campaign and Survival controls after a viewport rotation. Android assembly passed. App lint reported zero errors and four warnings.
- **Build artifact.** Version code 3. The 4,938,785-byte debug APK passed APK Signature Scheme v2 verification and contained all 12 WebP images (550,722 bytes in total). Tested APK SHA-256 `ada1b418777a73548952cc4795ed8a43b7b1c0cdfb0ee88ffed0f5602820e8b4`.
- **Physical campaign and storage.** The debug APK installed on the Redmi Note 7. ADB initially reported a 2,319 ms Activity launch. A normal-budget Cadet First Contact run stopped all 32 enemies, scored 4,140 points and awarded three stars in 3:07 simulated time. A cold reopen measured 813 ms with `am start -W`; sector 2, best score and mute persisted.
- **Physical controls and lifecycle.** In a 775 × 364 CSS pixel landscape viewport, the tester selected sector 2, tapped Spark, Nova and Frost into three lanes, paused and resumed. An energy pickup was visible, and using orbital strike triggered a 42-second cooldown. Returning from the Android Home screen reopened a paused mission with its robots intact. Sound stayed muted and the phone's orientation setting was restored.
- **Physical combat sample.** During wave three at 2× speed with ten Pulse defenders, 180 WebView animation callback intervals yielded 56.8 callbacks/s, median 16.674 ms and p95 33.333 ms. A separate app-process PSS sample near the wave 2/3 transition was 138,014 kB. The 1.0.0 baseline sampled an earlier wave with three defenders, so the workloads differ.
- **Evidence.** Inspect the [Redmi command screen](docs/screenshots/redmi-command.webp) and [sector 2 landscape battlefield](docs/screenshots/redmi-battle.webp). On this WebView, a DevTools protocol screenshot sometimes omitted the GPU-backed canvas. Capture the composited device display with the ADB screenshot procedure above.
- **Stability.** The app-process filtered error log and Android crash buffer returned zero game error or crash matches for the tested run. Long-duration Survival and other Android/WebView versions remain hardware follow-ups.
