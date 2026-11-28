# Architecture

## Stack and boundaries

Vite + strict TypeScript, Canvas 2D, semantic HTML controls, CSS, Web Audio, a generated service worker, and Capacitor 8 for Android. There is no backend. Runtime dependencies are Capacitor and bundled font packages; there is no large game framework.

| File                         | Responsibility                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/game/engine.ts`         | Deterministic fixed-step simulation, content definitions, economy, collisions, wave lifecycle, combat events |
| `src/game/render.ts`         | Composites unit sprites, cached landscape, projectiles and light effects on the tactical canvas              |
| `src/assets/`                | Bundled WebP command scene, five battlefields and ten class sprites. See [asset provenance](ASSETS.md).      |
| `src/game/audio.ts`          | Gesture-unlocked synthesized effects, bounded transient voices, mute                                         |
| `src/game/storage.ts`        | Versioned, validated, failure-tolerant local saves                                                           |
| `src/i18n/`                  | English and Russian interface text, number formatting and device-language selection                          |
| `src/main.ts`                | UI controller, input, focus management, lifecycle, modals, campaign progression, 60 Hz game loop             |
| `src/style.css`              | Desktop, tablet, phone, landscape layouts; reduced-motion styles                                             |
| `scripts/generate-sw.mjs`    | Content-hashed precache for every production asset, offline navigation                                       |
| `scripts/generate-icons.mjs` | Reproducible PWA and Android icons from original SVG using Chromium                                          |
| `android/`                   | Native Capacitor host, Gradle wrapper, SDK pins, application identity                                        |

## Simulation

Coordinates are in cells. There are 5 rows and 9 columns. The logical Canvas is 1200 × 700; the platform begins at (157, 170), with 100 × 82 cells. DOM tile bounds match the renderer using percentages. The battle scene contains the canvas, placement grid, lane arrow and collectible buttons. Classic console shows the entire backing canvas. Expanded lanes frames logical x = 95–1200 and y = 133–599 in landscape. Portrait frames y = 65–635 to show more of the sector above and below the lanes. The same CSS frame positions all 45 tile buttons, the lane marker and the energy layer. The mission grid places the existing robot cards above the arena and moves mission controls to its edges.

The engine has no browser dependencies. `Game.update(dt)` caps input at 0.1 seconds; the controller uses a 1/60-second accumulator and clamps long frames to avoid runaway catch-up. Hiding the document pauses play. 2× speed advances twice as many fixed simulation steps. Seeded randomness supports reproducible tests. Render animation never changes hitboxes.

Combat events are drained by the UI for audio and banners. Dead entities are removed after collision processing. Enemy attacks target blockers; ranged spitters produce acid projectiles. Frost applies a timed movement modifier. Nova damages a radius spanning adjacent lanes. Sweeper and orbital effects operate in simulation space.

Campaign completion requires the last wave's spawn queue and active enemies to be empty. Survival continues beyond the normal final wave. The final wave in each sector includes an Overlord. Save unlocks and star ratings are applied only by the UI after a confirmed victory.

## Persistence

The `rva-save-v1` record stores `unlocked` (0–4), `best`, `stars` (five integers, 0–3), `muted`, `reducedMotion`, `difficulty`, independent robot and alien skins, `battleLayout`, `fieldSkin` and `language`. Older records keep their progress and load the Cadet preference. Each save reads the latest record under a cross-tab lock, takes the highest score, unlock and star count per sector, and applies the preferences changed by that action. Malformed data falls back to valid values. If storage is unavailable, the session remains playable. Progress is local to the device or browser. Closing the process ends a running battle.

The controller passes the chosen difficulty to each new campaign. Cadet holds the simulation clock and income before the player launches First Contact. The HUD and highlighted center lane use the first patrol's lane sequence. The opening budget and enemy-count adjustments taper over sectors one and two. Survival always runs the Veteran rules.

Energy drops are native HTML buttons in an absolute layer inside the placement grid. Their center is the pickup’s fractional column and lane center. A 44 × 44 CSS-pixel button receives native mouse, touch and keyboard activation. Its visible bolt is part of the button. The HUD reconciles buttons with live pickup IDs at spawn, collection and expiry. Gameplay owns the single successful award in `Game.collect(id)`. The Collect action and E use the same engine method for every live drop.

Robots, aliens, placement previews and their health bars use the smaller screen scale on both axes, anchored at the projected cell position. Panoramas use a centered cover crop. A window resize updates the cached terrain when the canvas aspect changes. The backing store caps device scaling at 2× and approximately 2.8 million pixels.

Changing the field finish repaints the currently cached panorama and platform. Only the latest sector request can install a panorama, and only the selected material can repaint after its texture loads. Normal frames reuse the resulting canvas.

## Interface language

Both catalogs are bundled with the game. The saved language can be `system`, `en` or `ru`. A missing or invalid preference follows the device’s list of preferred languages and falls back to English. The interface applies language changes in place. The game controller retains the current mission and updates its visible text, accessible names and open dialog. The incoming marker reuses the engine’s current threat and its difficulty-specific disclosure.

The Russian install manifest shares the English manifest’s app ID, scope and start URL. Android’s launcher label follows the device locale through `res/values-ru`. The in-game language selector controls the interface inside the app.

## Offline and hosting

`npm run build` generates `dist/sw.js` from all emitted files. Fonts and icons are local. Navigation is network-first with cached `index.html` fallback; static assets are cache-first. Same-origin public build assets use `ignoreVary` because preview servers send `Vary: Origin` for invariant asset bytes. Never extend this rule to authenticated API responses. Keep `base: './'` so subdirectory hosting works.

The service worker is registered in production only. Capacitor packages `dist` into the APK; run sync after changing web content. There is no remote server URL in the native configuration.

## Performance and accessibility

The command screen uses a static CSS background. Selecting a campaign sector updates the location and description from `SECTORS` in `src/game/engine.ts`. Deployment passes the same sector index into the simulation.

The renderer uses `game.sector` to choose one of five panoramas, trim colors and rift colors. First Contact uses `src/assets/perimeter.webp`. Sectors 2–5 use the images in `src/assets/sectors/`. Survival starts in First Contact. Each sector change paints a playable platform and gradient sky onto the same 1200 × 700 backing canvas. When the image loads, a request counter allows only the current selection to repaint the canvas. A failed image leaves the sector's fallback board in place. Combat frames reuse the cached surface.

The renderer caches portraits by finish and class and shares light textures. On deployment it prepares one packed animation sheet for the equipped brood when motion is enabled. Walking aliens sample the stride by distance traveled, including Frost slowdown. A renderer-owned weak map compares an alien’s position at successive simulation times. An alien holding position plays its attack using the engine’s existing cooldown, 0.9 seconds for melee or 1.8 seconds for acid. Repeated draws of the same tick preserve the pose. Each unit draws one cropped sprite. Reduced motion uses the resting portrait. If a sheet fails to load, the equipped portrait can still lean or rock during combat. Particles are bounded at 600 and Canvas device pixel ratio is capped at 2. HUD updates are throttled and tile labels change when the occupant or its health changes.

All placement cells and loadout cards are actual buttons. The battlefield uses roving focus and arrow keys. Modals trap keyboard focus and restore it. Touch and pointer inputs use the same command methods. Reduced motion disables ambience and particles. Full nonvisual gameplay, high-contrast options, and customizable input remain future accessibility work.

The alien guide reads base health from `ENEMIES` and gets localized advice from the two message catalogs. A requested Walk or Attack clip uses the renderer’s equipped sheet and the same frame sampler as combat. The guide cancels playback on close, species change, document hiding or reduced motion. The paused battlefield resumes drawing when the guide closes. Saved motion values are `true`, `false` or `null` for the device preference. [Field guide](../src/game/field-guide.ts) · [Regression tests](../tests/e2e/field-guide.spec.ts)

## Player preferences and incoming attacks in 1.4

In 1.5.1, `GameNavigationPlugin` registers a lifecycle-bound AndroidX Back callback. The game claims it during a mission or dialog. A cancelable `rvaBack` event calls the same screen navigation as Escape. A page navigation clears the native claim, and an unhandled event delegates to the Android dispatcher. The bare command screen leaves system Back available.

The game queues the actual next spawn in `Game`. Its `incomingThreat` view exposes the row and optionally the kind, depending on the active mission difficulty. The DOM warning reads that view without consuming RNG. Preparation, pause, speed changes and the subsequent arrival share one queued decision. The warning clears after the last spawn, defeat or victory. Skin code receives no private spawn information.

Robot and alien finish IDs belong to the existing web save. Both the renderer and the interface resolve locally bundled art through `src/game/skins.ts`. The Android orientation preference belongs to the native activity's private preferences because it is needed before the WebView starts. `GameOrientationPlugin` and `src/game/orientation.ts` expose the setting to the Android UI. Browser builds use their responsive layout. [Animation and skins handover](../ART_HANDOFF.md)
