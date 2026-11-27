# Robots vs Aliens development handoff

## Current state

The game lives in `apps/robots-vs-aliens/` of `Laska1022/Android`. It runs offline in a browser or its Capacitor Android host. Run all game commands from this directory. See [AGENTS.md](AGENTS.md) for code ownership, [TESTING.md](TESTING.md) for reproducible checks and physical evidence, and [CHANGELOG.md](CHANGELOG.md) for release history.

**Next AI: finish the 1.7.0 Android release.** Start with [NEXT_AI_RUSSIAN.md](NEXT_AI_RUSSIAN.md) for the branch, test evidence, remaining build commands and publication steps. The full web check passed. Android verification and the GitHub Release are pending.

**Release candidate 1.7.0, Android code 10.** The entire interface is available in Russian and English, including the field guide, accessibility labels, combat and results. The first launch follows the device language. Players can switch languages in Settings during a mission and play offline. [Russian command screen](docs/screenshots/russian-command.webp) · [Language setting](docs/screenshots/russian-settings.webp) · [Russian battlefield](docs/screenshots/russian-battle.webp)

## Message for the first AI

Continue from `codex/rva-russian`. This branch integrates your `329feff` campaign-save and combat changes with the 1.6.0 battlefield and energy controls at `3218946`. The integration commit is `edf1c7b`. The layout and field-skin selectors now send individual preference updates through the cross-tab save writer. [Branch comparison](https://github.com/Laska1022/Android/compare/main...codex/rva-russian?expand=1)

I added two typed catalogs under `src/i18n/`. Keep both in sync when adding units, sectors, skins or commands. Russian plurals, accessible names and keyboard shortcuts are in the catalogs or controller. The simulation uses the same unit and sector IDs in either language. The Android launcher follows the phone language. The in-game selector saves its override with campaign preferences.

On the Redmi, open a build signed with the same key as your existing installation, switch the phone to Russian and check the launcher name after a cold start. In **Настройки → Язык**, switch to English mid-wave and back to Русский. Tap a gold pickup with a defender selected, rotate the phone and use Android Back. Check that the defender stays in place and that your stars and language choice survive reopening offline. Cloud browser results are in the [validation record](TESTING.md#november-27-2026--170-android-code-10).

## Earlier battlefield handover

**Version 1.6.0, Android code 8.** The default battle view gives more of the screen to the five lanes. Settings offers the Classic console layout and two new battlefield finishes. Gold energy pickups now have their own touch and keyboard targets. [Message for the first AI](#message-for-the-first-ai) · [Field screenshots and tests](TESTING.md#november-27-2026--160-android-code-8)

The verified debug APK is on GitHub Releases. Android rejects an update over the published 1.5.1 APK because the debug certificates differ. Keep an existing campaign installed if you need its local progress. [Download 1.6.0](https://github.com/Laska1022/Android/releases/download/robots-vs-aliens-v1.6.0/robots-vs-aliens-1.6.0-debug.apk)

### Integration details for 1.6.0

I combined your Android Back and Redmi integration on `main` at `51f3811` with the published alien animation handover at `a0e51a9`. That integration is recorded on `codex/rva-field-controls`. The branch contains both parent histories. The release source is `d78296f`. The environment could push the branch and tag, while its GitHub API access returned HTTP 403 when opening a draft PR. [Compare the branch with main](https://github.com/Laska1022/Android/compare/main...codex/rva-field-controls?expand=1)

I changed the mission UI, Settings, saved preferences, battlefield renderer and pickup controls. Expanded lanes is the default for new and existing saves. Classic console restores the original framing. Copper foundry and Polar relay change the surface under the units while preserving the selected sector and both faction skins. The canvas, all 45 deployment buttons, collectibles and lane marker share a single frame. Energy drops are individual 44 CSS-pixel buttons above the grid. A tap goes to one action, including when Recycle or Orbital Strike is armed. The engine still determines energy awards and combat.

For Redmi verification, use a compatible signing key or a separate installation so your existing campaign survives. In landscape, send the first wave, wait for a gold bolt, and tap near its lower edge with a robot selected. Check for +35 energy and an empty tile. Repeat with Recycle selected over a defender. Switch layouts and field skins with the mission paused, rotate the phone, and check Android Back, lane warnings and your saved stars after reopening. [Desktop and mobile browser evidence](TESTING.md#november-27-2026--160-android-code-8)

## Earlier integration

**Version 1.5.1, Android code 7.** All five aliens now have full-body walks and attacks in Native carapace, Ember brood and Riftborn obsidian. A Scout reaching a Bastion keeps biting in place. A Spitter recoils when the engine releases acid. The incoming-lane arrow sits in the outer gutter so players can see enemies in front of the last column. The branch `codex/rva-alien-animation` builds on the published 1.5.0 handover at `c1d37fe`. [Watch all five species](docs/screenshots/alien-motion.webp) · [Art handover](ART_HANDOFF.md) · [Validation](TESTING.md#november-27-2026--151-android-code-7)

**Main integration 1.5.3, Android code 9.** A settings change in an older tab preserves a newer campaign win. Pulse can hit a Scout already crossing its tile. The keyboard edge and reduced-motion reports are still open. [Bug report and reproductions](docs/KNOWN_BUGS.md)

The main-branch APK for this integration was **1.5.2** at `5672626`. Its checksum, v2 signature and all 67 production web files were verified after download. The public 1.5.1 and 1.5.2 debug certificates differ. On the locally signed Redmi build, the Scout’s bite, the Spitter’s ranged attack and system Back passed. [Release and APK](https://github.com/Laska1022/Android/releases/tag/robots-vs-aliens-v1.5.2) · [Verified build and device record](TESTING.md#november-27-2026--152-android-code-8)

**Version 1.5.2, Android code 8.** The public 1.5.1 tag at `5a9da25` shipped the second AI’s full-body walk and attack animations for all five aliens across three skins. The parallel 1.5.1 build on main at `9be2de4` tested Android Back on the Redmi. The two lines meet in 1.5.2. Start future skin and animation work from main. [Animation clip](docs/screenshots/alien-motion.webp) · [Art handover](ART_HANDOFF.md) · [Verification by build](TESTING.md#validation-record)

The game defaults to landscape and remembers Follow phone. Both factions have three independently selectable finishes. Android Back dismisses a dialog, pauses or resumes combat, and returns from mission results to command. Public debug APK certificates have differed between releases. Keep an existing installation with valuable progress when Android reports a signature conflict. [Distribution history](TESTING.md#validation-record)

The 1.3.0 sector art and mission briefings are included in this checkout. The local 1.3.0 APK cleared sectors 2–5 on the muted Redmi. Version 1.4.0 preserved all five three-star ratings across the upgrade. The external sector-art branch contains a parallel implementation. Use the shipped renderer and asset conventions here when merging artwork. [Versioned verification record](TESTING.md)

| Revision  | Significance                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `3fe9e0f` | Original web and Android game, version 1.0.0.                                                                    |
| `0bd8a70` | Game moved to its current location in the multi-app repository.                                                  |
| `39a3e9f` | Remote baseline used for the November Redmi development cycle.                                                   |
| `d1fff26` | Version 1.1.0. Cadet and Veteran, player-paced setup, early-sector balance and normal-budget Redmi campaign win. |
| `c6faa3a` | Version 1.2.0 on main. Command-screen and perimeter art, ten unit sprites, combat effects and updated controls.  |
| `e15908a` | Starting revision for the 1.3.0 sector artwork iteration. Records the preceding hosted Android build.            |
| `d7a7f9e` | 1.4.0 game code tested on Redmi. Landscape preference, truthful lane warnings, sector scenery and skin support. |
| `0176911` | Published art assignment and Redmi evidence. Both hosted web and Android jobs passed, with a downloadable [debug APK](https://github.com/Laska1022/Android/actions/runs/45813582262/artifacts/15114865206). |
| `9be2de4` | Integrated Back and both 1.5.0 skin families. The local APK passed Redmi campaign and system navigation tests. Both hosted jobs passed. [Build and APK](https://github.com/Laska1022/Android/actions/runs/45900000216) |

## Gameplay decisions

The hosted web and Android builds for 1.2.0 passed at `c213a6e`. [Historical 1.2.0 build and debug APK](https://github.com/Laska1022/Android/actions/runs/45652679628)

The 1.1.0 Redmi run cleared First Contact at the real starting budget with three stars, 32 enemies stopped and 4,060 points. All 21 unit tests and seven applicable browser scenarios passed. The device and methods are recorded in [TESTING.md](TESTING.md).

- Cadet is the default campaign setting. Its first mission lets the player place a squad before sending the first wave. Veteran preserves the original opening for experienced players. Survival uses Veteran combat.
- Keep progression device-local under `rva-save-v1`. Loading a save from the first release must retain unlocks, stars, sound and motion settings.
- Keep simulation deterministic. Balance tests should buy robots from the starting budget, collect available energy and drive ordinary game actions. Build timing, rendering and device input need separate tests.

## Visual and performance decisions

The 1.2.0 Redmi run finished First Contact with 32 enemies stopped, 4,140 points and three stars. Sector 2, best score and mute survived a cold reopen. Landscape touch placement and background/resume worked in sector 2. A ten-defender wave-three sample delivered 56.8 animation callbacks/s at 2× speed. Exact sample methods, limits and screenshots are in [TESTING.md](TESTING.md).

Version 1.3.0 pairs the selected sector's location and briefing on the command screen with its own landscape during combat. First Contact and Survival use the Greenline perimeter. Later missions show the Badlands, Crystal Basin, Relay Nine and the Nest. Artwork ships locally. The renderer holds one terrain canvas, paints immediately on sector change and discards late image callbacks. If the landscape fails to decode, the fallback retains every playable tile. [Renderer architecture](docs/ARCHITECTURE.md) · [Art sources and generation prompts](docs/ASSETS.md)

The command screen uses a static scene. Robots use the same silhouettes on cards, the field guide, placement previews and the battlefield. Recoil, weapon trails and health bars communicate combat state without changing the simulation. Keep reduced motion and offline reloads covered when adding assets.

The tactical UI highlights the opening patrol lane and places mission and loadout controls around the grid. For the physical phone layout, see the [Redmi command screen](docs/screenshots/redmi-command.webp) and [Redmi battlefield](docs/screenshots/redmi-battle.webp).

## Assignments for parallel Codex Cloud sessions

The active art assignment is [animation and skins](ART_HANDOFF.md). The separate RVA-01 balance suite at `3397ec1` passed all 48 cases when exercised against the 1.4.0 engine. The suite remains on its owning branch. The parallel sector-art branch had reached `2d35444` when this integration started. Keep those contributors' branches and work intact.

Copy the [standalone prompt for Codex A or Codex B](PROMPTS.md) into the corresponding cloud session. Fetch the latest `origin/main` with 1.3.0 or later, record its SHA and target `main` in each PR.

RVA-01 and RVA-02 can proceed independently in the cloud. RVA-03 is delivered in 1.3.0. The phone owner handles RVA-04 after integration. Check for an existing PR on the suggested branch before starting and include the task ID, actual test results and outstanding hardware checks in the PR. The integrator owns shared release files, version bumps and final screenshots.

| ID and suggested branch                | Owner and scope                                                                                                                                                                                                                                                                    | Acceptance and dependencies                                                                                                                                                                                                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RVA-01 · `codex/rva-campaign-balance`  | Simulation agent. Own `tests/unit/campaign-strategy.test.ts` and evidence-based Cadet adjustments in `src/game/engine.ts`. Use the ordinary engine API to buy defenders, collect drops and play later sectors from the actual budget. Cover at least three fixed seeds per sector. | Compare Cadet and Veteran outcomes, time to clear, core breaches and end energy. Report which sectors need tuning. Tests must reproduce without DOM or a phone. Can start immediately.                                                                                                                 |
| RVA-02 · `codex/rva-mobile-layout`     | Mobile input agent. Own `tests/e2e/viewport.spec.ts` and verified input/layout fixes in `src/main.ts` and `src/style.css`. Add coordinate-based touch placement and recycling at all four board corners, including after a scroll or viewport change.                              | Assert intended tile, adjacent tile and energy state in tall portrait and short landscape. Existing 1.2 coverage already exercises rotation and center placement. Can start alongside RVA-01.                                                                                                          |
| RVA-03 · `codex/rva-sector-art`        | **Delivered in 1.3.0.** Four new bundled panoramas, sector platform lighting, accessible battle names and a command-screen briefing for each sector.                                                                                                                               | The original grid serves all five environments. See [art provenance](docs/ASSETS.md), [architecture](docs/ARCHITECTURE.md) and [validation by release](TESTING.md).                                                                                                                                    |
| RVA-04 · `codex/rva-device-validation` | Physical QA owner with a local Android phone. Own the next hardware report and its sanitized screenshots.                                                                                                                                                                          | After integration of relevant PRs, run the [phone procedure](TESTING.md#reproduce-a-muted-usb-phone-test). Test later-sector combat, rotation, background/resume, OS Back, cold relaunch and preference persistence. Report device, WebView, sample interval, PSS, frame delivery and any skipped run. |

**Merge order.** RVA-01 and RVA-02 own separate code and tests and may merge in either order. Compare seeded results before and after any Cadet tuning. Update each PR with the latest integrated changes, run the full checks again, then hand the integrated revision to RVA-04 for the remaining physical checks.

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
