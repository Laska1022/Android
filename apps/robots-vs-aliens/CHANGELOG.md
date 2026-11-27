# Changelog

## 1.5.2 · November 27, 2026

- Android Back now pauses and resumes a mission, dismisses Settings and the field guide, and returns to command after a win or loss. Holding Escape on a keyboard triggers one action per press.
- The same APK includes the second AI’s 24-frame walks and attacks for every alien and all three alien finishes. The warning arrow stays clear of enemies entering the last column. [Animation preview](docs/screenshots/alien-motion.webp)
- The offline asset list uses the same URL paths when built on Windows and Linux.

## 1.5.1 · November 27, 2026

- Scouts snap their jaws, Runners rake with their forelimbs, Brutes ram, Spitters draw back to launch acid, and Overlords sweep their claws. All three alien skins animate while walking and while attacking a defender. Frost slows their stride, 2× speeds up combat and pause holds the current pose. [Watch the animations](docs/screenshots/alien-motion.webp)
- Moved the incoming-lane chevron to the outer edge so it clears a Scout entering the last column.

## 1.5.0 · November 26, 2026

- Equip **Foundry ceramic** robots and **Riftborn obsidian** aliens independently in Settings. All ten classes have new silhouettes. Both families ship offline alongside the Factory alloy, Cobalt ceramic, Native carapace and Ember brood finishes. [Unit lineup](docs/screenshots/foundry-lineup.webp)
- Pulse and Nova recoil against their mounts, Frost hovers, Spark brightens before payout, and Bastion braces on impact. Each alien species has a distance-driven gait and an attack pose. Pause holds the pose and reduced motion uses still portraits. [Combat animation](docs/screenshots/foundry-riftborn.webp)

## 1.4.0 · November 26, 2026

- Android opens horizontally by default in either landscape grip. Settings now offers a saved **Follow phone** option. Switching orientation keeps the current battle and placed robots.
- An amber marker shows the lane of the next alien before it enters. Cadet also identifies the alien type. Veteran and Survival show only its lane. The opening Scout is visible during preparation.
- Independent robot and alien skin selectors update the battlefield and the related interface art. Factory alloy and Native carapace remain the defaults. Cobalt ceramic and Ember brood provide ten alternate unit sprites. Earlier saves keep their progress.
- Added offline selection, saved preference, native bridge and warning tests, plus a [dedicated handover](ART_HANDOFF.md) for the second AI developing animation and new skin families.

## 1.3.0 · November 26, 2026

- Added four campaign landscapes for Dust & Echoes, The Hollow, Iron Horizon and Last Light. Each has its own platform lighting and rift color. First Contact and Survival use the original perimeter.
- Selecting an unlocked sector shows its location and mission briefing before deployment. The battlefield's accessible name identifies the deployed mission.
- Bundled every sector image for Android and offline browser play. The renderer keeps one terrain canvas, shows a playable fallback while loading and ignores image responses from earlier missions.

## 1.2.0 · November 25, 2026

- Replaced the original command and battlefield scenery with an illustrated industrial outpost. Ten transparent WebP sprites give each robot and enemy a distinct silhouette. Cards, the field guide and deployment previews share the battlefield art.
- Added weapon trails, recoil, hit lighting, grounded shadows and clearer health feedback. The renderer caches the terrain and light textures. Reduced motion suppresses combat flashes and ambient effects.
- Updated the menu, loadout, native launcher and web app icons. The battlefield highlights the first patrol's lane, and the tactical controls adapt to the screen width. All visuals ship in the Android bundle and browser offline cache.

## 1.1.0 · November 25, 2026

- Added Cadet and Veteran campaign difficulty. Cadet gives players time to set up a defense in First Contact before sending the opening wave. Veteran and Survival retain the original combat pace.
- Added support for the difficulty preference in local saves while retaining earlier campaign unlocks and star ratings.
- Cadet starts with 400 energy in sector one and 375 in sector two, then returns to the original 325. Waves contain two fewer enemies in sector one and one fewer in sector two. The first patrol has five scouts and begins in lane three. A placement prompt updates when that lane is covered.
- Fixed a scoring error that awarded kill credit and resources for aliens that breached the core. Added normal-budget campaign tests at three seeds and checks for Veteran and Survival pressure.

## 1.0.0 · October 27, 2026

- Introduced the five-sector campaign, Survival, five robot classes, five enemy types, an orbital strike, lane sweepers and collectible energy.
- Shipped an offline-capable web build and a Capacitor Android debug build with local progress, keyboard and touch controls, synthesized effects and reduced motion. Original game commit `3fe9e0f`.
- On October 29 the game moved under `apps/robots-vs-aliens/` at `0bd8a70`. The move kept the game and package identity intact.
