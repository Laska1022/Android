# Artwork, audio, and fonts

## Game artwork

The command scene, original perimeter, unit sheet and four-panel campaign landscape sheet were created for Robots vs Aliens with OpenAI ImageGen from text prompts. The shipped WebP files are the source assets for the game build.

| Asset under `src/assets/` | Game use                                                                                                                                                         | Packaging                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `command.webp`            | The title screen places live menu controls over the dark left side. The ivory walker occupies the right side.                                                    | 1440 × 810, WebP quality 85                                                                                       |
| `perimeter.webp`          | The renderer paints the landscape behind the 9 × 5 defense platform and caches them together. Lane numbers, tiles and targets use game coordinates.              | 1200 × 600, WebP quality 85                                                                                       |
| `units/*.webp`            | Five robot classes and five enemy types share a consistent perspective. Robot cards, field guide portraits and placement previews use the same images as combat. | Ten transparent images, each with a longest edge of 224 px or less, WebP quality 89. The complete set is 311 KiB. |

The master unit sheet measured 1983 × 793 pixels. Its top row contained Pulse, Spark, Frost, Nova and Bastion from left to right. Its bottom row contained Scout, Runner, Brute, Spitter and Overlord in the same order as the game definitions. Each unit was cropped to its silhouette with a small margin, reduced with Lanczos resampling and saved with its alpha channel. Right-facing robots and left-facing aliens communicate the direction of attack.

The Canvas renderer draws lighting, recoil, hit flashes, shadows, projectiles, particle streaks, energy pickups, health bars and selection feedback over the cached platform. Reduced motion suppresses combat flashes, ambient motion and particle streaks. Animated transforms do not change simulation hitboxes.

Vite resolves these local images into the production build. The service worker precaches the emitted files for subsequent offline browser sessions. Capacitor packages the same build inside the Android app, so the first native launch can display art offline. The game never calls an image generator during play.

## Image generation prompts

### Later campaign sectors

The 1.3.0 sheet was generated as four separate matte paintings on one 1774 × 887 canvas. Each panel puts its landmark high on the right so the tactical platform leaves it visible. Each was cropped to 884 × 438 and encoded at WebP quality 85.

| Asset           | Art direction                                                        |  Bytes |
| --------------- | -------------------------------------------------------------------- | -----: |
| `badlands.webp` | Sandstone arch above a desert waystation under a copper sun          | 65,460 |
| `basin.webp`    | Translucent quartz fan above a glacial river and survey station      | 96,864 |
| `relay.webp`    | Ridge-top parabolic dish and amber lights against a break in a storm | 63,312 |
| `nest.webp`     | Eclipse above black chitin spires and a red volcanic caldera         | 45,428 |

The five sector cards share `sectors.webp` (1120 × 112, 26,110 bytes). It combines 224 × 112 thumbnails of the original perimeter and the four new landscapes in campaign order. Scouting loads the chosen panorama at full size. During combat the renderer draws the landscape and platform into a single reusable background canvas.

### Original outpost and units

<details>
<summary>Command screen</summary>

Use case: stylized-concept. Asset type: full-bleed 16:9 landscape key art for the existing original mobile lane defense game Robots vs Aliens: Last Outpost. Wide cinematic environmental illustration, sophisticated hard-surface science fiction, richly painted photoreal detail, deep petrol teal predawn industrial landscape, burning coral sunrise along distant horizon, strong ice-blue practical lights and a violet alien rift. On the RIGHT half only, one striking asymmetrical, heavily armored unmanned defense walker, visible large upper body turned three quarters to camera and gun aimed toward distant incoming chitinous alien silhouettes on extreme right. Make a distinctive peaked, angular, worn ivory armor mantle over dark machined joints, narrow turquoise optical slit, utilitarian hardpoint. No face, humanoid pilot, mouth or cartoon eyes. In the far distance ringed planet and orbital infrastructure in haze add scale. All important highlights and subjects in right 58% and middle height. Left 42% is dark atmospheric muted teal industrial negative space for overlaid live menu, no subject there. Frame like a premium science-fiction paperback cover, material wear and rim light, dramatic readable silhouette on small screens. No text, typography, logotypes, interface, watermarks, borders or badges.

</details>

<details>
<summary>Battlefield environment</summary>

Use case: stylized-concept. Asset type: environment backdrop for a tactical defense game. Panoramic ultra-wide landscape matte painting, cinematic science fiction setting, isolated frontier outpost on distant ringed planet's moon, mature and colorful. Long horizontal composition. First 30% of image height must contain the most important visuals: luminous partial ringed planet upper left, sweeping rings and a distant rust-coral dawn behind flat jagged horizon and slender relay antennas, far right edge an iridescent violet aurora/rift. Teal-black steel structures and worn basalt canyon cliffs frame extreme sides. Foreground center and bottom are quiet, dark open industrial apron, subtly luminous turquoise edge lights, storm mist. Photorealistic PBR environmental concept art, carefully layered painterly atmospheric perspective and realistic scale. No creatures, characters, mechs, turrets, people, lettering, tiles, drawn game grid, UI, logos or watermarks. The game draws all tiles, characters and interface over this separately. Wide 2:1 or wider full bleed frame.

</details>

<details>
<summary>Combat units</summary>

Use case: stylized-concept. Asset type: transparent master sprite sheet for a mature original science-fiction Android lane-defense game. Wide landscape 5:2 aspect ratio, exactly five equal columns by two equal rows, ten isolated full body side-profile units. Every unit entirely inside its own invisible square cell, centered, even scale, generous transparent gutter, no overlap, all feet approximately on same local baseline. This is usable game sprite artwork, not a design sheet: truly transparent background, no background, no panel borders, no grid lines, no page, no writing, no labels, no numerals, no swatches, no branding, no watermark. Art direction: layered gunmetal, worn ceramic alloy, etched armor, bright local practical lights, teal-white rimlight, rich colored accents, natural industrial and alien anatomy. Sharp three-quarter side silhouettes, high-value rim and readable color blocks for very small screen sizes; realistic sophisticated hand-painted science-fiction key art like a premium strategy game. Top row MUST have exactly five industrial robot emplacements all facing RIGHT: column 1 a squat angular biped sentry on articulated legs with a long horizontal lime-accented plasma gun and wedge sensor pod; column 2 three-legged amber fusion generator with raised paired dark-gold photovoltaic fins and luminous central coil; column 3 a cyan cryogenic skimmer with a fork-shaped cryo lance pointed right and white coolant tanks; column 4 heavy purple artillery tracked chassis with a large elevated oblique mortar barrel pointing upper-right; column 5 a broad burnt-orange faceted shield wall robot with forearm barricade, wedge armored plating, and chunky anchor feet. Bottom row MUST have exactly five dangerous non-humanoid alien organisms all facing LEFT: column 1 a lean violet four-legged blade-backed predator with a pointed head and hooked mandibles; column 2 a fast coral-magenta low-slung sprinting mantis beast with sweeping scythe limbs and trailing spines; column 3 stout armored purple rhinoceros arthropod with ivory wedge ram crest, weight-bearing forelegs and layered shell armor; column 4 jade poison-spitting insect-beast with green aerosol sacs and a tubular narrow head pointing left; column 5 taller domineering crimson alien with armored crown horns, sabre foreclaws and rose bioluminescent channels. No cute faces or bulging round eyes, no humanoid faces, no toy proportions. All units complete and unobscured. No separate floating rocks, no smoke, no shadows outside silhouettes, no detached projectiles, no fighting between cells. Exactly ten sprites total.

</details>

## Launcher and interface

The original launcher emblem is an angular ivory helmet around a continuous cyan sensor slit, with two coral service markings. The vector source is [public/icon.svg](../public/icon.svg). Android themed launchers use the matching [monochrome vector](../android/app/src/main/res/drawable/ic_launcher_monochrome.xml).

From this app's directory, run `node scripts/generate-icons.mjs` after installing the Playwright Chromium browser. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using an existing compatible browser. The generator renders the 192 px, 512 px and maskable web PNGs plus the legacy, round and adaptive foreground PNGs at all five Android launcher densities. Update the monochrome vector when changing the silhouette.

Screenshots in `docs/screenshots/` are game captures. See [TESTING.md](../TESTING.md) for the distinction between physical device, browser and historical evidence.

## Audio and type

The game synthesizes sound effects with Web Audio oscillators and gain envelopes in `src/game/audio.ts`. The current release contains no music track or sampled audio.

Local Fontsource packages provide Barlow Condensed, DM Sans and Space Mono under the SIL Open Font License. [Bundled license notices](../public/licenses/) name the font copyright holders and ship with the offline build.

The native host uses Apache-2.0-licensed Capacitor code and the Gradle wrapper. Dependency license notices remain in their respective packages.
