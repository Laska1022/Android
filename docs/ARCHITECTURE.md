# Architecture

## Stack and boundaries

Vite + strict TypeScript, Canvas 2D, semantic HTML controls, CSS, Web Audio, a generated service worker, and Capacitor 8 for Android. There is no backend. Runtime dependencies are Capacitor and bundled font packages; there is no large game framework.

| File                         | Responsibility                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/game/engine.ts`         | Deterministic fixed-step simulation, content definitions, economy, collisions, wave lifecycle, combat events          |
| `src/game/render.ts`         | Original Canvas art, cached landscape, robot/alien illustration, animation, particles, hover previews, portrait icons |
| `src/game/audio.ts`          | Gesture-unlocked synthesized effects, bounded transient voices, mute                                                  |
| `src/game/storage.ts`        | Versioned, validated, failure-tolerant local saves                                                                    |
| `src/main.ts`                | UI controller, input, focus management, lifecycle, modals, campaign progression, 60 Hz game loop                      |
| `src/style.css`              | Desktop, tablet, phone, landscape layouts; reduced-motion styles                                                      |
| `scripts/generate-sw.mjs`    | Content-hashed precache for every production asset, offline navigation                                                |
| `scripts/generate-icons.mjs` | Reproducible PWA and Android icons from original SVG using Chromium                                                   |
| `android/`                   | Native Capacitor host, Gradle wrapper, SDK pins, application identity                                                 |

## Simulation

Coordinates are in cells. There are 5 rows and 9 columns. The logical Canvas is 1200 × 700; the platform begins at (157, 170), with 100 × 82 cells. DOM tile bounds match the renderer using percentages. UI device pixels are converted back to logical coordinates when picking up energy.

The engine has no browser dependencies. `Game.update(dt)` caps input at 0.1 seconds; the controller uses a 1/60-second accumulator and clamps long frames to avoid runaway catch-up. Hiding the document pauses play. 2× speed advances twice as many fixed simulation steps. Seeded randomness supports reproducible tests. Render animation never changes hitboxes.

Combat events are drained by the UI for audio and banners. Dead entities are removed after collision processing. Enemy attacks target blockers; ranged spitters produce acid projectiles. Frost applies a timed movement modifier. Nova damages a radius spanning adjacent lanes. Sweeper and orbital effects operate in simulation space.

Campaign completion requires the last wave's spawn queue and active enemies to be empty. Survival continues beyond the normal final wave. The final wave in each sector includes an Overlord. Save unlocks and star ratings are applied only by the UI after a confirmed victory.

## Persistence

Key: `rva-save-v1`. Fields: `unlocked` (0–4), `best`, `stars` (five integers, 0–3), `muted`, `reducedMotion`. Reads sanitize malformed data; unavailable storage does not crash the game. Progress is device/browser-local. Mid-battle resume, cloud sync, and account migration do not exist yet.

## Offline and hosting

`npm run build` generates `dist/sw.js` from all emitted files. Fonts and icons are local. Navigation is network-first with cached `index.html` fallback; static assets are cache-first. Same-origin public build assets use `ignoreVary` because preview servers send `Vary: Origin` for invariant asset bytes. Never extend this rule to authenticated API responses. Keep `base: './'` so subdirectory hosting works.

The service worker is registered in production only. Capacitor packages `dist` into the APK; run sync after changing web content. There is no remote server URL in the native configuration.

## Performance and accessibility

Landscape is pre-rendered once; particles are bounded at 600; Canvas DPR is capped at 2. HUD updates are throttled, and simulation and rendering are distinct. Profile before replacing these with a new framework.

All placement cells and loadout cards are actual buttons. The battlefield uses roving focus and arrow keys. Modals trap keyboard focus and restore it. Touch and pointer inputs use the same command methods. Reduced motion disables ambience and particles. Full nonvisual gameplay, high-contrast options, and customizable input remain future accessibility work.
