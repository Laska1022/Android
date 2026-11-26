# Handover for the animation and skin developer

You own new robot and alien skins and their combat animations for **Robots vs Aliens**. Players choose a finish independently for each faction in **Settings → Robot skin** and **Settings → Alien skin**. Ship one complete skin family at a time and keep the existing selections and campaign saves usable.

## Start from the working integration

Work in `Laska1022/Android` under `apps/robots-vs-aliens/`. The 1.4.0 integration and its Redmi handover reached `main` at `0176911`. The 1.5.1 alien animation branch is `codex/rva-alien-animation`, based on the finished 1.5.0 handover at `c1d37fe`. The parallel sector-art and campaign-balance branches have other owners. Read the root and app `AGENTS.md`, then [HANDOFF.md](HANDOFF.md) and [TESTING.md](TESTING.md).

1. Fetch `origin` and inspect your working tree. Check whether your base contains `src/game/skins.ts` and this handover. If main contains the integration, start there. Otherwise start your artwork branch from the published integration tip and target that branch until it lands on main.
2. If you already have art commits on another branch, keep them. Integrate the new base with a normal merge on your own branch. Resolve disagreements in the renderer against the contracts below. Record the base and tip in your PR. Use normal pushes.
3. Scope your changes to game art, rendering, art tests and the related docs. The local developer owns Android rotation, physical Redmi verification and integration. Coordinate any engine, shared Settings or input change with that developer first.

## Delivered on November 27, 2026

In the published 1.5.0 APK the upper shell stayed nearly fixed during a walk. Travel also stopped advancing the gait when an enemy reached a blocker. In 1.5.1 every brood has 24 articulated walking poses and 24 attack poses for each of the five species. Attack frame zero coincides with a strike or acid discharge. The warning chevron uses the outside edge of the arena, where it clears an incoming Scout. The resting artwork still supplies the Settings preview and reduced-motion combat. [Gameplay clip](docs/screenshots/alien-motion.webp) · [Asset dimensions and reproduction](docs/ASSETS.md#alien-walks-and-attacks)

To continue this work, adjust the joint landmarks for the illustrated silhouette, regenerate the three sheets and their frame index together, and run the phone-size and live-contact regressions in `tests/e2e/skins.spec.ts`. For physical verification, use a compatible signed build or a separate test device to preserve the current campaign. Place a Bastion in lane 3, column 9 in Cadet First Contact. Watch the first Scout walk, stop, bite through multiple hits, pause, resume at 2×, and walk on when the Bastion is recycled. In a later sector, check the Spitter’s wind-up against its projectile and sample frame timing and memory during a crowded wave. [1.5.1 test record](TESTING.md#november-27-2026--151-android-code-7)

## Delivered on November 26, 2026

Foundry ceramic and Riftborn obsidian each contain five original silhouettes. All three robot finishes use class-specific firing, charging, hovering and impact responses. All three alien finishes have twelve gait poses per species, with a steady silhouette during reduced motion. The complete skin and animation work is on `codex/rva-foundry-riftborn`, based directly on the shipped Settings, lane warnings, sector scenes and orientation implementation at `0176911`. [Settings](docs/screenshots/foundry-settings.webp) · [Lineup](docs/screenshots/foundry-lineup.webp) · [Combat](docs/screenshots/foundry-riftborn.webp)

**Publication.** GitHub Actions built and published the 1.5.0 debug APK from tag `robots-vs-aliens-v1.5.0` at `0a7ee06`. The web, Android and release jobs passed. The downloaded APK matched the release checksum and passed v2 signature verification. Branch review is pending. [GitHub Release and APK](https://github.com/Laska1022/Android/releases/tag/robots-vs-aliens-v1.5.0) · [Hosted run](https://github.com/Laska1022/Android/actions/runs/45862945062) · [Compare with main](https://github.com/Laska1022/Android/compare/main...codex/rva-foundry-riftborn?expand=1)

**1.5.0 hardware checklist.** Install the 1.5.0 build over a compatible signed 1.4.0 install on the muted Redmi. Verify all five earned star ratings, the saved Cobalt/Ember and orientation preferences, and cold reopen after switching to Foundry/Riftborn. Compare Pulse discharge and Runner footfalls at 1× and 2× in the Badlands and the Nest. Capture compositor screenshots, 180 frame intervals and app/WebView PSS in the same dense wave with both loadouts. Record the WebView, thermal conditions, sample duration, unit count, pause/resume and reduced motion. Cloud evidence and the reproducible fixture are in the [1.5.0 test record](TESTING.md#november-26-2026--150-android-code-6).

## What already works

| Faction | Stable unit keys | Existing options |
| --- | --- | --- |
| Robots, facing right | `pulse`, `spark`, `frost`, `nova`, `bastion` | `standard` (Factory alloy), `cobalt` (Cobalt ceramic), `foundry` (Foundry ceramic) |
| Aliens, facing left | `scout`, `runner`, `brute`, `spitter`, `overlord` | `standard` (Native carapace), `ember` (Ember brood), `riftborn` (Riftborn obsidian) |

Cobalt and Ember are baked palette treatments. Foundry and Riftborn use newly illustrated geometry and supply the reference for future original families. A robot family might use field-repaired armor plates with visible fasteners and distinct weapon assemblies. An alien family might use translucent mineral growth with different crest and limb silhouettes. Keep each role identifiable at battlefield size. Pulse and Frost must read differently in silhouette, as must Scout and Runner.

## Add a selectable skin

1. Pick a stable lowercase ID unique to the finish, such as `salvage`. Add its player-facing name to `ROBOT_SKINS` or `ALIEN_SKINS` in [skins.ts](src/game/skins.ts). The type, save validator and Settings options derive from these registries. Keep existing IDs when revising artwork.
2. Put transparent WebPs in `src/assets/skins/<id>-<kind>.webp`. For a robot family, deliver all five robot keys. For an alien family, deliver all five alien keys. Built-in default art lives in `src/assets/units/<kind>.webp`. The resolver uses standard artwork when a variant is missing. Check completeness explicitly before calling a family finished.
3. Match the original facing, feet and transparent bounds. The game centers each image horizontally, scales it to a bounded box and aligns its bottom to the unit’s feet. An uneven margin makes a unit visibly jump. Check every sprite against both the dark and bright sectors, in the loadout, field guide, Settings preview and combat. The current preview representatives are Pulse and Scout.
4. [main.ts](src/main.ts) updates the renderer, card images and Settings previews and reads the current robot finish when opening the field guide. [storage.ts](src/game/storage.ts) stores both IDs in the existing `rva-save-v1` record. Review old saves with missing or invalid fields. Unlocks, stars, best score, mute and the other faction’s skin must survive.
5. Vite discovers local variant URLs at build time. [generate-sw.mjs](scripts/generate-sw.mjs) precaches the production files. No network fetch should be needed during play. The palette examples can be regenerated from the app directory with `node scripts/generate-skins.mjs` after installing Playwright Chromium. Hand-painted skins do not need that generator. Document new sources, prompts, processing and licenses in [ASSETS.md](docs/ASSETS.md).

## Improve animation without changing play

The current standard sprites are 224 px wide, with heights of 136–224 px depending on the silhouette. The local Redmi displayed the board at a 775 × 364 CSS-pixel landscape viewport. Use the [actual Cadet screenshot](docs/screenshots/redmi-incoming-lane.webp) and [Veteran combat screenshot](docs/screenshots/redmi-veteran-warning.webp) to judge scale and contrast before adding fine detail.

The engine advances at 1/60 simulated second per step. [render.ts](src/game/render.ts) reads the engine state when drawing, including position, entity ID, game time, hit flashes and slow effects. `drawBot` and `drawAlien` receive presentation parameters. The 1.5.0 art uses a planted weapon mount, Frost hover, Spark charge, Bastion impact compression and a twelve-pose gait for each alien. Version 1.5.1 replaces that gait with separate full-body walk and attack clips. The renderer reads travel and cooldowns directly. Inspect those functions and their call sites before introducing frames. Presentation must never consume gameplay randomness, move hitboxes, advance timers, change attack rates or influence the next alien.

- Start with **Pulse firing** and **Runner locomotion**. Show a recognizable idle reference, a readable action and recovery. Compare with a static frame at phone size. Once those two work, extend the approach to the remaining roles.
- Choose a sample frame from game time or existing combat state. Pausing should hold the pose. At 2×, motion should remain in step with the simulated attack. Reduced motion needs a stable pose with the battlefield, health and lane cues still readable. Keep placement previews and UI portraits readable at rest.
- Use the same foot anchor for every frame, including a tall Overlord. The board is 1200 × 700 logical units, starts at (157, 170), and uses nine columns of 100 by five rows of 82. The HTML placement buttons, shot paths and enemy positions share that grid. Draw shadows below units and keep health bars, right-edge warnings and touch targets clear.
- Bundle compact assets and reuse decoded images. If you introduce atlases, record frame dimensions, anchor, frame order and playback timing beside the asset. Use a static fallback while an atlas loads or if it fails. Cache by skin and unit. Avoid canvas pixel reads, recoloring, image creation or atlas decoding inside the frame loop. Report the change in compressed bytes and decoded image dimensions.
- The lane warning is a separate DOM overlay in [lane-warning.ts](src/game/lane-warning.ts). Veteran and Survival reveal only the lane. Type-specific colors, silhouettes, accessible names or boss effects on the warning would give away the hidden enemy.

## Definition of done

Run these from the app directory in the cloud checkout.

```sh
npm ci
npx playwright install --with-deps chromium
npm run check
npm run android:sync
cd android
./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug
```

Use Node 22+ and Java 21. The Android build needs SDK 36 and Build Tools 35.0.0. The web suite also supports an installed Chromium through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Use [TESTING.md](TESTING.md) for detailed setup and alternatives.

For each new family, exercise all five art files after an offline reload, switching one faction while keeping the other, reopening Settings, and returning to the default. Check old and unsupported save IDs. For motion, compare 1×, 2×, paused and reduced motion in desktop and phone layouts. Test a crowded late wave and keep a representative before/after screenshot or short capture with viewport, mode, skin and revision. Useful starting tests are `tests/e2e/loadouts.spec.ts`, `presentation.spec.ts`, `sectors.spec.ts`, and `tests/unit/storage.test.ts`. Confirm the same game state with either cosmetic selection.

In your PR, list finished units and states, asset provenance, byte changes, commands with outcomes, screenshots, known limitations and the next physical checks. Browser emulation and Android compilation are separate from testing on a phone. Leave the Redmi checklist for local integration when you lack hardware. The local developer will verify touch, foreground screenshots, frame timing, memory, and persistence with game audio muted. Update the app handoff and changelog with the evidence you have.
