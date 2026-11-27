# Open bugs in Robots vs Aliens 1.5.2

Verified November 27, 2026 against `5672626` using the production web build in Chromium 156 and the game engine in Node 24. The existing `npm run check` passed 28 unit tests and 32 browser tests, with four platform-specific skips. The four cases below were reproduced separately. [Reviewed revision](https://github.com/Laska1022/Android/commit/5672626beec5fe0f295e4446dc085fcef398e702)

## 1. An older tab can erase a completed mission

1. Open the game in two tabs in the same browser profile on the same origin. Leave the first tab on the command screen.
2. In the second tab, win Cadet First Contact. The verified run earned three stars, scored 4,120 points and unlocked sector 2. The browser clock accelerated the mission. All purchases and attacks used normal game actions.
3. Toggle sound in the first tab and reload it. Sector 2 is locked again, First Contact has zero stars, and the personal best is zero.

Each tab reads `rva-save-v1` once. Changing sound writes the older tab's entire copy over the newer save. A regression test should open two pages in one browser context and verify that the new sound preference and the earned progress both survive a reload. [Initial save read](../src/main.ts#L45) · [Sound toggle](../src/main.ts#L376) · [Save write](../src/game/storage.ts#L44)

## 2. Pulse can fire through the Scout attacking it

On Cadet First Contact, let the first Scout walk into column 9 in lane 3. Place Pulse on that tile just before the Scout reaches the tile center. Pulse fires, but every shot starts beyond the Scout's hitbox. The Scout stays in contact and keeps damaging Pulse.

The following reproduces both placements from the game directory in Node 24. Both use the first scheduled Scout, the starting budget, and the normal simulation step.

```bash
node --experimental-transform-types --input-type=module <<'JS'
import { Game } from './src/game/engine.ts';

for (const threshold of [8.55, 8.85]) {
  const game = new Game(0, false, 7, 'cadet');
  game.startWave();
  while (!game.enemies[0] || game.enemies[0].x > threshold) game.update(1 / 60);
  const scout = game.enemies[0];
  game.place('pulse', 2, 8);
  for (let frame = 0; frame < 180; frame++) game.update(1 / 60);
  const shots = game.drainEvents().filter(event => event.type === 'shoot').length;
  console.log(threshold, shots, scout.hp, game.bots[0].hp);
}
JS
```

| Scout x at placement | Shots in 3 seconds | Scout HP, initially 105 | Pulse HP, initially 180 |
| -------------------- | -----------------: | ----------------------: | ----------------------: |
| 8.55                 |                  3 |                     105 |                      66 |
| 8.85                 |                  3 |                      27 |                     104 |

Check that an overlapping target in front of the firing robot can take a hit, while a target in another lane stays unharmed. The target check accepts `x > col + 0.2`, the projectile starts at `col + 0.9`, and collision uses that starting point. [Firing](../src/game/engine.ts#L432) · [Projectile collision](../src/game/engine.ts#L514)

## 3. Arrow keys can deploy a robot in the wrong lane at a board edge

Choose **Deploy squad**. Focus starts at lane 1, column 1. Press Right four times to reach column 5, then Up. Focus jumps to column 1. From there, press Right eight times to reach column 9, then Right once more and Enter. Pulse lands in lane 2, column 1 and spends 100 energy.

The handler clamps a single index across all 45 buttons. Check that Up on the top row preserves the column, and Right on the right edge preserves the lane. Enter should deploy on the tile that retained focus. [Battlefield keyboard handler](../src/main.ts#L511)

## 4. The reduced-motion switch turns itself back on after reload

Enable the operating system's reduced-motion preference, or emulate `prefers-reduced-motion: reduce` in Chromium. Open **Settings**, turn **Reduced motion** off, and reload. Reopen Settings. The checkbox is checked and the page has the `reduced-motion` class again, even though `rva-save-v1.reducedMotion` still contains `false`.

Startup combines the saved value and system preference with `||`. This treats an explicit Off choice like a first visit. A regression test should cover both a fresh profile inheriting the system preference and a returning player who explicitly changed the switch. [Startup](../src/main.ts#L100) · [Settings handler](../src/main.ts#L455)
