# Robots vs Aliens — instructions for coding agents

Read `README.md`, `docs/ARCHITECTURE.md`, and `docs/AZURE_AI_HANDOFF.md` before changing the game.

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

## Start commands

`npm run dev` starts Vite on port 5173. For a production/offline check use `npm run build && npm run preview -- --port 4173`. Start the process again in each fresh cloud task; live processes do not survive a snapshot. Stop only processes you started. See the handoff guide for prioritized next work.
