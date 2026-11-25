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

### November 26, 2026 · Later-sector campaign balance (RVA-01)

Both squads cleared sectors 2–5 on Cadet and Veteran on seeds `1`, `42` and `123`. All 48 simulated missions finished with five core integrity and zero breaches. The Pulse squad used one automatic sweeper in sector 4 on seed `1` on each difficulty. These results support keeping the current Cadet budgets and wave sizes for the tested sectors.

Each run starts with the normal budget (375 for Cadet sector 2, otherwise 325). Every four simulated seconds the player collects visible pickups and tries to buy the first missing defender in formation order. Each column fills from the center outward. The waves start automatically, and the orbital strike stays in reserve.

- **Pulse squad.** Deploy two columns of Pulse. Every run ended with ten defenders except sector 5 on seed `123`, where nine remained on both difficulties.
- **Mixed squad.** Buy one rear Spark, then fill a column each of Pulse, Frost, Nova and Bastion. Every run ended with all 21 positions occupied.

The ranges below span the three seeds. Sectors 3–5 use the same starting budget and waves on both difficulties and produced identical results for each paired seed and squad. Ending energy includes income accumulated after filling the formation.

| Sector            | Difficulty | Pulse clear time (s) | Mixed clear time (s) | Pulse end energy | Mixed end energy |
| ----------------- | ---------- | -------------------: | -------------------: | ---------------: | ---------------: |
| 2 · Dust & echoes | Cadet      |              300–316 |              285–290 |      2,159–2,277 |      1,519–1,594 |
| 2 · Dust & echoes | Veteran    |              302–329 |              303–316 |      2,190–2,376 |      1,686–1,807 |
| 3 · The hollow    | Both       |              349–386 |              332–350 |      2,586–2,805 |      2,055–2,232 |
| 4 · Iron horizon  | Both       |              473–530 |              416–434 |      3,701–3,729 |      3,179–3,378 |
| 5 · Last light    | Both       |              520–532 |              455–501 |      3,897–4,194 |      3,657–3,992 |

Run the comparison from the game directory to print one JSON record per mission. The runner uses a fixed 60 Hz step and a 12-minute simulated limit. Seeds fix the starting random state, and player actions can affect later enemy draws. Human input timing and physical-device performance require separate playtests.

```sh
RVA_BALANCE_REPORT=1 npm test -- tests/unit/campaign-strategy.test.ts --reporter=verbose
```

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
