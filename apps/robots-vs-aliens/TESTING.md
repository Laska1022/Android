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

### November 27, 2026 · 1.5.1, Android code 7

- **Web and combat.** All 28 unit tests passed. Desktop Chromium and Pixel 7 emulation passed 26 browser scenarios, with two input-specific skips. In the ordinary Cadet UI, a player bought a Bastion in lane 3, column 9. The first Scout walked to it, dealt damage through repeated attack frames at one fixed position at both speeds, paused on an identical canvas and resumed walking after recycling. The warning remained visible beyond the incoming Scout. Reduced motion, a failed sheet, skin switching and an offline reload are covered. [First Contact at 775 × 364](docs/screenshots/alien-contact-phone.webp)
- **Visible movement.** At a 583 × 241 CSS-pixel battlefield, opposite 1.5.0 walk frames changed zero upper-body silhouette pixels for each of the 15 species and skin combinations. The same alpha-mask comparison in 1.5.1 changed 28–189 upper-body pixels when walking and 55–359 between anticipation and contact. The browser suite checks both halves of all 30 walk and attack silhouettes offline. Baking every atlas twice produced identical bytes. The clip shows five real game simulations per column per finish, sampled at 20 fps. The left side advances and the right actually damages a Bastion. [8-second motion comparison](docs/screenshots/alien-motion.webp)
- **Android.** Capacitor sync, Gradle `assembleDebug` and `lintDebug` passed. Android app lint reported zero errors and four warnings. The local v2-signed debug APK reported `com.laska.robotvsaliens`, version 1.5.1, code 7. All 67 production files, including the 39 WebPs, matched the APK byte for byte.
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

ADB listed zero attached devices. The muted Redmi upgrade, physical frame delivery, memory and cold-reopen checks for this build remain with the device owner. [Hardware task](ART_HANDOFF.md#delivered-on-november-26-2026)

### November 26, 2026 · 1.4.0, Android code 5

- **Automated.** 28 unit tests passed. The desktop Chromium and Pixel 7 browser projects passed 18 scenarios with two platform-specific skips. Tests exercise actual queued spawns including the Overlord, difficulty disclosure, pause, 2×, old saves, independent skin choices, offline reload, all 26 WebPs and late scene loading. Set `RVA_TEST_PORT` to use a different loopback port if another local checkout owns 4173.
- **Native build.** TypeScript and production build, Capacitor sync, Java 21 debug assembly and lint passed. App lint reported zero errors and four warnings. All 54 production files, including the generated worker, matched their APK entries byte for byte. Tested local debug APK SHA-256 `def902e7f4e0749825b9dfa891964cae50b3698d5b7216b1857bb41d6b5669fe`, 5,752,272 bytes. Hosted debug signing can produce a different hash.
- **Physical Redmi Note 7.** Updated the existing 1.3.0 install while keeping saved progress and game mute. First 1.4.0 launch used 775 × 364 CSS pixels in landscape. During Cadet setup the incoming cue named the middle-lane Scout. Selected Cobalt ceramic and Ember brood, placed defenders, then selected Follow phone in Settings. The viewport changed to 393 × 775 in portrait, existing defenders remained and a new edge placement landed in the intended cell. Follow phone opened in portrait after force-stop. Selecting Landscape then force-stopping again reopened horizontally. Five three-star ratings, a best score of 12,510, both finishes and mute persisted.
- **Mode and frame checks.** Veteran and Survival both showed the next lane only. During a 2× Cadet wave-two sample with 11 defenders using the alternate finishes, 180 WebView animation intervals gave 60.0 callbacks/s, 16.674 ms median and 16.676 ms p95. The app-process PSS sample was 125,521 kB. [Cadet lane cue](docs/screenshots/redmi-incoming-lane.webp) · [Veteran combat](docs/screenshots/redmi-veteran-warning.webp) · [Android settings](docs/screenshots/redmi-loadout-settings.webp)
- **Remaining physical coverage.** Both landscape grips are enabled by Android policy. Reverse-grip rotation, prolonged Survival, current Android tablet policies and API 24 remain device follow-ups. Browser emulation alone cannot establish these outcomes.
- **Campaign and stability.** A normal-budget Cadet First Contact run with both alternate finishes beat all four waves, stopped 32 aliens, earned three stars and scored 4,300. The tested game PID returned zero matching AndroidRuntime, uncaught WebView or orientation-plugin error lines. The crash buffer contained zero matches for the package.

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
