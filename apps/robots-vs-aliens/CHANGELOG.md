# Changelog

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
