# Robots vs Aliens 1.5.2 bug report

Verified November 27, 2026 against `5672626` using the production web build in Chromium 156 and the game engine in Node 24. The existing `npm run check` passed 28 unit tests and 32 browser tests, with four platform-specific skips. The four cases below were reproduced separately. [Reviewed revision](https://github.com/Laska1022/Android/commit/5672626beec5fe0f295e4446dc085fcef398e702)

## 1. An older tab can erase a completed mission (fixed in 1.5.3)

1. Open the game in two tabs in the same browser profile on the same origin. Leave the first tab on the command screen.
2. In the second tab, win Cadet First Contact. The verified run earned three stars, scored 4,120 points and unlocked sector 2. The browser clock accelerated the mission. All purchases and attacks used normal game actions.
3. Toggle sound in the first tab and reload it. Sector 2 is locked again, First Contact has zero stars, and the personal best is zero.

Version 1.5.2 wrote the older tab's entire copy of `rva-save-v1` over the newer save. In 1.5.3 each writer merges its result with the latest stored progress and changes only the requested preferences. A three-star First Contact win, the sector 2 unlock and a 4,090-point best all survived muting and reloading the older tab. [Save implementation](../src/game/storage.ts) · [Two-tab regression tests](../tests/e2e/game.spec.ts)

## 2. Pulse can fire through the Scout attacking it (fixed in 1.5.3)

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

| Scout x at placement in 1.5.2 | Shots in 3 seconds | Scout HP, initially 105 | Pulse HP, initially 180 |
| ----------------------------- | -----------------: | ----------------------: | ----------------------: |
| 8.55                          |                  3 |                     105 |                      66 |
| 8.85                          |                  3 |                      27 |                     104 |

In 1.5.3 the projectile starts at the edge of the nearest target's hitbox if the muzzle extends past it. Running the same command leaves the Scout at **27 HP in both placements**. The regression also puts Scouts farther ahead and in the adjacent lane and checks that Pulse leaves both unharmed. [Engine](../src/game/engine.ts) · [Combat regression](../tests/unit/engine.test.ts)

## 3. Arrow keys can deploy a robot in the wrong lane at a board edge

Choose **Deploy squad**. Focus starts at lane 1, column 1. Press Right four times to reach column 5, then Up. Focus jumps to column 1. From there, press Right eight times to reach column 9, then Right once more and Enter. Pulse lands in lane 2, column 1 and spends 100 energy.

The handler clamps a single index across all 45 buttons. Check that Up on the top row preserves the column, and Right on the right edge preserves the lane. Enter should deploy on the tile that retained focus. [Battlefield keyboard handler](../src/main.ts#L511)

## 4. The reduced-motion switch turns itself back on after reload

Enable the operating system's reduced-motion preference, or emulate `prefers-reduced-motion: reduce` in Chromium. Open **Settings**, turn **Reduced motion** off, and reload. Reopen Settings. The checkbox is checked and the page has the `reduced-motion` class again, even though `rva-save-v1.reducedMotion` still contains `false`.

Startup combines the saved value and system preference with `||`. This treats an explicit Off choice like a first visit. A regression test should cover both a fresh profile inheriting the system preference and a returning player who explicitly changed the switch. [Startup](../src/main.ts#L100) · [Settings handler](../src/main.ts#L455)
