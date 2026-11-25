# Robots vs Aliens — instructions for coding agents

These rules apply only to `apps/robots-vs-aliens/`. Run commands from that directory. Read the repository-root `AGENTS.md` for multi-app boundaries. DeviceScope is independent and is not governed by the game-specific instructions below.

Start with [HANDOFF.md](HANDOFF.md) for the current version, tested behavior and priorities. Read [README.md](README.md) for player controls, [architecture](docs/ARCHITECTURE.md) for simulation and renderer boundaries, and [TESTING.md](TESTING.md) for validation commands.

## Where changes belong

| Area                                           | Source                                                       | Contract                                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign, economy, difficulty, enemy schedules | `src/game/engine.ts`                                         | Cell-space coordinates, seeded randomness, fixed time steps. Cover balance with a normal-budget strategy in addition to combat stress tests.                     |
| Saves and audio                                | `src/game/storage.ts`, `src/game/audio.ts`                   | Validate individual fields, load existing `rva-save-v1` progress and respect mute before playing any sound.                                                      |
| Screens and controls                           | `src/main.ts`, `src/style.css`                               | Preserve keyboard focus, semantic touch targets, portrait, landscape and pause on visibility change.                                                             |
| Artwork and feedback                           | `src/game/render.ts`, `public/`                              | Keep combat legible on small screens. Cache static scene work, bound effects and keep hitboxes independent of animation. Record art origins in `docs/ASSETS.md`. |
| Offline and Android                            | `scripts/generate-sw.mjs`, `capacitor.config.ts`, `android/` | Bundle runtime assets locally, sync the built web app before Gradle, and retain the package ID `com.laska.robotvsaliens`.                                        |

Design for adults who enjoy colorful science fiction. Use recognizable mechanical silhouettes, readable lane threats and a clear hierarchy for energy, core health and wave state. Give a new player time to choose and place a robot before the first Cadet attack. Keep Veteran and Survival challenging.

## Working agreement

- This is an original sci-fi lane-defense game. Preserve the original robot/alien identity, illustrated neon outpost, responsive UI, and offline play. Do not use Plants vs Zombies art, characters, branding, sounds, or source code.
- Use the existing checkout. Cloud tasks already run in isolated environments; do not create a worktree unless the user asks for one.
- TypeScript strict mode stays enabled. Keep simulation independent of DOM, rendering, and audio. New combat mechanics need deterministic tests.
- Install with `npm ci`; keep `package-lock.json` synchronized when intentionally changing dependencies. Use Node 22+ and Java 21 for Android.
- Run `npm run check` before finishing a gameplay/UI change. It runs unit tests, type checks, the production build, and real Chromium desktop/mobile tests. `npx playwright install chromium` installs the browser; in cloud environments with a system Chromium use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` instead.
- After native/configuration changes: `npm run android:sync`, then `cd android && ./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug`. Report device tests separately from compilation.
- Inspect screenshots at desktop and phone sizes. Do not claim UI or offline readiness from unit tests alone. Preserve actual runner failures; do not remove assertions to make checks pass.
- Do not commit `node_modules`, `dist`, SDKs, build outputs, signing keys, `.env` secrets, or local SDK paths. Debug APKs belong in CI artifacts or releases.
- No backend or API key is required by the game. Azure credentials, if later needed, belong in the deployment service's secret store, never client code.
- Report the concrete change, validation results, and remaining limitations. Distinguish a debug APK from a signed store release.

## Publishing and handoff

Fetch the target branch and check the working tree before a new iteration. Use a development branch for substantial changes. Update the app version in `package.json`, the root package entry in `package-lock.json`, and Android's `versionName` and increasing `versionCode` together. Record each tested release in [CHANGELOG.md](CHANGELOG.md) and leave the next developer a current [handoff](HANDOFF.md). Use descriptive commits and normal pushes when authorized.

Cloud agents can run seeded simulation tests, Playwright and Gradle. If an Android emulator is available, record its API and WebView under emulator results. Only an actual phone run counts as physical verification. Report the tested build, date, device and scenarios. Leave untested phone behavior in the handoff with a concrete next check.

## Start commands

`npm run dev` starts Vite on port 5173. For a production/offline check use `npm run build && npm run preview -- --port 4173`. Start the process again in each fresh cloud task; live processes do not survive a snapshot. Stop only processes you started. See the handoff guide for prioritized next work.
