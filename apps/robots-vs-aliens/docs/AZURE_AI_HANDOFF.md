# Azure AI continuation guide

## Mission

Continue **Robots vs Aliens: Last Outpost**, an original polished lane-defense game for Android and the web. The initial implementation includes a playable five-sector campaign, survival, five robots, five enemies, original procedural artwork, sound effects, resource economy, abilities, offline caching, local progress, tests, and a native Android host.

Work in `apps/robots-vs-aliens/`. Read the repository-root `AGENTS.md` for shared boundaries, then this app’s `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, and `docs/VALIDATION.md` first. Establish a passing baseline before changing behavior. Keep the app playable throughout development.

## Ready-to-paste prompt

```text
You are continuing development of Robots vs Aliens: Last Outpost in
Laska1022/Android. Use the existing checkout. Read root AGENTS.md, then
work only in apps/robots-vs-aliens/ and follow its AGENTS.md.
Read the app’s docs/AZURE_AI_HANDOFF.md and docs/VALIDATION.md.
Other apps, including DeviceScope, are independent.

First run npm ci, npm run test, npm run build, and the existing Playwright
desktop/mobile checks. Review the actual UI at desktop, phone portrait,
and phone landscape sizes. If native SDKs are available, sync Capacitor
and build/lint the Android app. Report blockers accurately.

Implement the first unfinished P0 item below as one reviewable change.
Preserve the original neon outpost art direction, all five robot roles,
campaign progress, keyboard/touch controls, and offline play. Add meaningful
tests for changed mechanics. Do not replace gameplay with a mockup, copy
third-party game assets, add monetization, or embed cloud credentials.

Finish with test evidence, screenshots for UI changes, an updated validation
record, and a concise commit/PR description. If repository write access is
available and the user has authorized publication, push the work; otherwise
leave a clear local patch and exact next steps.
```

## Prioritized work

### P0 — Validate the Android experience

Test on at least one physical Android phone and one emulator, including API 24 compatibility and a current API 36 device. Verify cold start offline, app background/foreground, system back behavior, orientation changes, audio interruptions, display cutouts, and readable/tappable controls. Record device/OS/WebView versions and FPS. Compilation is not device validation. Fix observed defects and add regression coverage where practical.

Acceptance: one full mission completed on a device without crashes, incorrect tile mapping, clipped controls, or unintended simulation advance while backgrounded. Confirm settings and campaign unlocks survive restart. Do not commit a signing key.

### P0 — Balance with real players

Current economy and difficulty are initial values. Run actual missions with the normal starting budget, not the test's funded stress-test formation. Log completion rates, duration, unused energy, core breaches, and bot usage across all sectors. Make small data-level tuning changes in `engine.ts`, documenting old/new values and the observed reason. Preserve a viable first-time strategy.

Acceptance: the first sector is teachable, every robot has a useful role, later sectors require meaningful combinations, and survival becomes progressively harder. Add deterministic normal-budget strategy tests and playtest notes; do not claim these replace human playtesting.

### P1 — Interactive onboarding and feedback

Add a short, dismissible first-run tutorial with contextual prompts for selecting a robot, placing it, collecting energy, and choosing a threatened lane. Save completion without breaking v1 progress. Improve telegraphing of lane threats, damage, and special enemies. Avoid tutorial steps that leave simulation running while inputs are blocked.

Acceptance: browser tests complete the tutorial using touch and keyboard; returning players can skip it; no tutorial obscures placement or active threats.

### P1 — Broaden authored content and visual polish

Give each sector a distinct palette and environmental theme while preserving the visual identity. Add curated wave schedules, boss attack phases, animation transitions, and original ambient music with separate volume controls. Move content data out of the engine when justified. Keep original/licensed asset provenance in `docs/ASSETS.md`.

Acceptance: new behaviors are deterministic and tested; performance stays usable on a midrange phone; offline cache includes all art/audio; no unlicensed assets.

### P1 — Save and resume a battle

Design a versioned snapshot containing units, projectiles, timers, wave spawn queue, RNG state, abilities, and score. Save at safe checkpoints, validate on restore, and migrate existing campaign saves. Explicitly handle outdated snapshots and storage failure.

Acceptance: reloading at a checkpoint produces the same next simulation state; corrupt snapshots fall back safely; progress remains intact.

### P2 — Accessibility and release

Add larger touch targets/zoom options, color-blind-safe state indicators, independent audio controls, and a nonvisual threat summary. Prepare release signing via secure CI, a privacy statement, store assets, device support policy, and an Android App Bundle. Add cloud services only if the product requirements justify them.

## Commands and environment

```bash
cd apps/robots-vs-aliens
npm ci
npx playwright install chromium
npm run check
npm run android:sync
cd android
./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug
```

Cloud machines with Chromium already installed can run tests with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Use Java 21, SDK 36, and a writable `GRADLE_USER_HOME`/`ANDROID_USER_HOME` in restricted environments. Preserve TLS and checksum validation. Do not work around network denials by disabling verification.

## Azure integration

“Azure AI” needs a coding-agent host with filesystem, shell, browser-testing, and scoped GitHub capabilities to continue this repository. A model deployment or chat endpoint by itself does not provide those tools. Mount/clone the repository in that host, supply this guide as context, and authorize the intended Git operations there.

The repository-root `azure-pipelines.yml` can be selected when creating an Azure DevOps pipeline connected to this GitHub repository. It installs dependencies, runs checks, and publishes `dist` and browser-test artifacts. Hosted-agent capacity and service connections must be configured in your Azure organization.

For Azure Static Web Apps, use application location `/apps/robots-vs-aliens`, build command `npm run build`, and output location `dist`; no API directory is needed. Use the service-generated deployment workflow and store its token in GitHub/Azure secrets. Do not put Azure AI keys into this client-side game. No Azure resources have been provisioned by this repository.

## Definition of done

- The intended change works in the actual app, with relevant tests passing and no unexplained console errors.
- Screenshots are inspected for changed layouts, including phone orientation.
- Offline launch and saved progress still work.
- Android source changes compile and lint; runtime claims include actual device evidence.
- `docs/VALIDATION.md` records exactly what ran, what was skipped, and remaining risks.
- No credentials, SDK/cache directories, or unreviewed dependency churn are committed.
