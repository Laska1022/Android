# Artwork, audio, and fonts

All robot, alien, landscape, portal, projectile, particle, and icon artwork is original to this project. `src/game/render.ts` draws it with Canvas paths and gradients. `public/icon.svg` is the original app icon; `scripts/generate-icons.mjs` generates PWA and native launcher PNGs. Screenshots in `docs/screenshots/` are captured from this application.

All current sound effects are synthesized by `src/game/audio.ts` using Web Audio oscillators and gain envelopes. There are no sampled or copied game sounds. There is no music track in this version.

Bundled fonts come from the Fontsource packages for Barlow Condensed, DM Sans, and Space Mono. They are distributed under the SIL Open Font License. Copies of their license notices are in `public/licenses/` and included in the offline build. Fontsource provides packaging; font copyrights belong to their respective authors as stated in the licenses.

Capacitor's generated host uses Apache-2.0-licensed Capacitor code and the Gradle wrapper. Dependency license notices remain in their packages. No Plants vs Zombies assets, characters, names, or sounds are included. The game shares the broad lane-defense genre only.
