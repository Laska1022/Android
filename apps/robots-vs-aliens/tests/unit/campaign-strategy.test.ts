import { describe, expect, it } from 'vitest';
import { BOTS, Game, type Bot, type BotKind, type CampaignDifficulty } from '../../src/game/engine';

type Deployment = Pick<Bot, 'kind' | 'row' | 'col'>;

function column(kind: BotKind, col: number): Deployment[] {
  return [2, 1, 3, 0, 4].map((row) => ({ kind, row, col }));
}

const squads = {
  pulse: [...column('pulse', 1), ...column('pulse', 2)],
  mixed: [
    { kind: 'spark', row: 2, col: 0 },
    ...column('pulse', 1),
    ...column('frost', 2),
    ...column('nova', 3),
    ...column('bastion', 5),
  ],
} satisfies Record<string, Deployment[]>;

const missions = [2, 3, 4, 5].flatMap((sector) => [1, 42, 123].map((seed) => ({ sector, seed })));
const ticksPerSecond = 60;

function play(sector: number, seed: number, difficulty: CampaignDifficulty, squad: Deployment[]) {
  const game = new Game(sector - 1, false, seed, difficulty);
  let breaches = 0;
  let scheduledEnemies = 0;
  let collected = 0;

  // Let every wave start on its own timer. Use the same 60 Hz steps as the UI.
  for (let tick = 0; tick < 12 * 60 * ticksPerSecond && game.phase === 'playing'; tick++) {
    if (tick % (4 * ticksPerSecond) === 0) {
      for (const pickup of [...game.pickups]) {
        if (game.collect(pickup.id)) collected++;
      }
      // Attempt one purchase. A destroyed defender regains its place in the queue.
      const slot = squad.find(
        ({ row, col }) => !game.bots.some((b) => b.row === row && b.col === col),
      );
      if (slot) game.place(slot.kind, slot.row, slot.col);
    }
    game.update(1 / ticksPerSecond);
    for (const event of game.drainEvents()) {
      if (event.type === 'breach') breaches++;
      if (event.type === 'wave') scheduledEnemies += game.spawnTotal;
    }
  }
  return { game, breaches, scheduledEnemies, collected };
}

describe.each(Object.entries(squads))('%s squad', (squadName, squad) => {
  describe.each(['cadet', 'veteran'] as const)('%s campaign', (difficulty) => {
    it.each(missions)(
      'resolves sector $sector on the normal budget, seed $seed',
      ({ sector, seed }) => {
        const { game, breaches, scheduledEnemies, collected } = play(
          sector,
          seed,
          difficulty,
          squad,
        );
        if (process.env.RVA_BALANCE_REPORT === '1') {
          const defenders = Object.fromEntries(
            Object.keys(BOTS).map((kind) => [
              kind,
              game.bots.filter((bot) => bot.kind === kind).length,
            ]),
          );
          console.info(
            JSON.stringify({
              sector,
              seed,
              difficulty,
              squad: squadName,
              outcome: game.phase,
              seconds: Math.round(game.time),
              breaches,
              core: game.lives,
              energy: game.energy,
              sweepersUsed: game.sweepers.filter((ready) => !ready).length,
              defenders,
            }),
          );
        }

        expect(collected).toBeGreaterThan(0);
        expect(game.energy).toBeGreaterThanOrEqual(0);
        expect(['won', 'lost'], 'mission must resolve within 12 simulated minutes').toContain(
          game.phase,
        );
        if (game.phase === 'won') {
          expect(game.wave).toBe(game.totalWaves);
          expect(game.enemies).toHaveLength(0);
          expect(game.kills + breaches).toBe(scheduledEnemies);
          expect(game.lives).toBeGreaterThan(0);
        } else {
          expect(game.lives).toBe(0);
          expect(breaches).toBeGreaterThan(0);
        }
        // Keep a demonstrated, affordable route through each Cadet sector.
        if (squadName === 'mixed' && difficulty === 'cadet') expect(game.phase).toBe('won');
      },
    );
  });
});
