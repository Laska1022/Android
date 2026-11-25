# Robots vs Aliens development handoff

## Current state

The game lives in `apps/robots-vs-aliens/` of `Laska1022/Android`. It runs offline in a browser or its Capacitor Android host. Run all game commands from this directory. See [AGENTS.md](AGENTS.md) for code ownership, [TESTING.md](TESTING.md) for reproducible checks and physical evidence, and [CHANGELOG.md](CHANGELOG.md) for release history.

| Revision  | Significance                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `3fe9e0f` | Original web and Android game, version 1.0.0.                                                                    |
| `0bd8a70` | Game moved to its current location in the multi-app repository.                                                  |
| `39a3e9f` | Remote baseline used for the November Redmi development cycle.                                                   |
| `d1fff26` | Version 1.1.0. Cadet and Veteran, player-paced setup, early-sector balance and normal-budget Redmi campaign win. |
| `c6faa3a` | Version 1.2.0 on main. Command-screen and perimeter art, ten unit sprites, combat effects and updated controls.  |

## Gameplay decisions

The hosted web and Android builds passed at `c213a6e`, which also finalized the two cloud prompts. Start new work from the latest `main`. [GitHub build and debug APK](https://github.com/Laska1022/Android/actions/runs/45652679628)

The 1.1.0 Redmi run cleared First Contact at the real starting budget with three stars, 32 enemies stopped and 4,060 points. All 21 unit tests and seven applicable browser scenarios passed. The device and methods are recorded in [TESTING.md](TESTING.md).

- Cadet is the default campaign setting. Its first mission lets the player place a squad before sending the first wave. Veteran preserves the original opening for experienced players. Survival uses Veteran combat.
- Keep progression device-local under `rva-save-v1`. Loading a save from the first release must retain unlocks, stars, sound and motion settings.
- Keep simulation deterministic. Balance tests should buy robots from the starting budget, collect available energy and drive ordinary game actions. Build timing, rendering and device input need separate tests.

## Visual and performance decisions

The 1.2.0 Redmi run finished First Contact with 32 enemies stopped, 4,140 points and three stars. Sector 2, best score and mute survived a cold reopen. Landscape touch placement and background/resume worked in sector 2. A ten-defender wave-three sample delivered 56.8 animation callbacks/s at 2× speed. Exact sample methods, limits and screenshots are in [TESTING.md](TESTING.md).

Version 1.2.0 bundles its artwork in the game. The command screen uses a static scene. Combat draws animated unit sprites over a cached perimeter and defense platform. Robots use the same silhouettes on cards, the field guide, placement previews and the battlefield. Recoil, weapon trails and health bars communicate combat state without changing the simulation. Keep reduced motion and the offline cache covered when adding assets. [Art sources and generation prompts](docs/ASSETS.md)

The tactical UI highlights the opening patrol lane and places mission and loadout controls around the grid. For the physical phone layout, see the [Redmi command screen](docs/screenshots/redmi-command.webp) and [Redmi battlefield](docs/screenshots/redmi-battle.webp).

## Assignments for parallel Codex Cloud sessions

Copy the [standalone prompt for Codex A or Codex B](PROMPTS.md) into the corresponding cloud session. Start from the latest `origin/main` and target `main` in each PR. Release `c6faa3a` is the physically tested baseline.

All four assignments are **unclaimed** at this handoff. Each row is one assignment a separate agent can take from this repository. Fetch the latest integrated game branch before starting, check for an existing PR on the suggested branch, and open a PR with the task ID, actual test results and any hardware checks still due. The integrator owns shared release files, version bumps and final screenshots.

| ID and suggested branch                | Owner and scope                                                                                                                                                                                                                                                                    | Acceptance and dependencies                                                                                                                                                                                                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RVA-01 · `codex/rva-campaign-balance`  | Simulation agent. Own `tests/unit/campaign-strategy.test.ts` and evidence-based Cadet adjustments in `src/game/engine.ts`. Use the ordinary engine API to buy defenders, collect drops and play later sectors from the actual budget. Cover at least three fixed seeds per sector. | Compare Cadet and Veteran outcomes, time to clear, core breaches and end energy. Report which sectors need tuning. Tests must reproduce without DOM or a phone. Can start immediately.                                                                                                                 |
| RVA-02 · `codex/rva-mobile-layout`     | Mobile input agent. Own `tests/e2e/viewport.spec.ts` and verified input/layout fixes in `src/main.ts` and `src/style.css`. Add coordinate-based touch placement and recycling at all four board corners, including after a scroll or viewport change.                              | Assert intended tile, adjacent tile and energy state in tall portrait and short landscape. Existing 1.2 coverage already exercises rotation and center placement. Can start alongside RVA-01.                                                                                                          |
| RVA-03 · `codex/rva-sector-art`        | Art and rendering agent. Work in `src/game/render.ts`, new art assets, renderer tests and `docs/ASSETS.md`. Give later sectors distinctive, readable environmental treatment while preserving board geometry and offline play.                                                     | Start from the integrated visual release. Compare equal-size rendered scenes with and without reduced motion. Record asset origin, dimensions and sizes. Compile, run the browser checks and put dense-combat phone performance in the physical queue.                                                 |
| RVA-04 · `codex/rva-device-validation` | Physical QA owner with a local Android phone. Own the next hardware report and its sanitized screenshots.                                                                                                                                                                          | After integration of relevant PRs, run the [phone procedure](TESTING.md#reproduce-a-muted-usb-phone-test). Test later-sector combat, rotation, background/resume, OS Back, cold relaunch and preference persistence. Report device, WebView, sample interval, PSS, frame delivery and any skipped run. |

**Merge order.** RVA-01 and RVA-02 own separate code and tests and may merge in either order. Compare seeded results before and after any Cadet tuning. RVA-03 depends on the visual release. Rebase each PR onto the selected integration branch, run the full checks again, then hand the integrated revision to RVA-04. Cloud agents can complete the first three assignments without a physical device.

## Physical follow-up and longer-term work

1. Watch first-time players complete First Contact with a normal budget. Record setup choices, lane coverage, uncollected energy, time to first placement and outcome. Use the results to decide whether further onboarding is needed.
2. Check later sectors and Survival on physical devices during dense combat. Capture frame timing, PSS, battery/thermal conditions, orientation and the tested build. Include a current Android release and the API 24 support boundary when available.
3. Test system Back, interruptions, display cutouts and restoration on additional WebViews. An in-progress mission currently ends when the process is killed. A future checkpoint design needs wave queues, RNG state, economy, timers and projectiles, plus a versioned recovery path for old saves.
4. Store signing, distribution, full nonvisual play and shared/cloud saves remain open. There is no backend dependency.

## Working notes

- The Windows baseline used a complete Temurin 21 JDK because the machine's default `JAVA_HOME` pointed to an incomplete Java 17 installation. Set a working `JAVA_HOME` per shell. The Gradle wrapper verifies its distribution checksum.
- Always run `npm run android:sync` after building changed web code. A native build alone can install stale bundled assets. Reinstall with `adb install -r` when the signing key matches to retain existing player progress.
- The debug WebView can expose Chrome DevTools over ADB. Device-side UI input and actual device screenshots are valuable even when the same scenarios pass Playwright. Retain the test mute setting on the game for the duration of hardware testing.
- The Redmi's older WebView can omit the battlefield canvas from DevTools screenshots. Use Android's compositor screenshot through ADB to verify the displayed sprites and controls.
