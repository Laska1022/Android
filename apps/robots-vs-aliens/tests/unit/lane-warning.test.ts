import { expect, it } from 'vitest';
import { Game, type CampaignDifficulty } from '../../src/game/engine';

// Observe each real spawn without combat interference. Separate engine tests exercise full battles.
it.each<[CampaignDifficulty, boolean]>([
  ['cadet', false],
  ['veteran', false],
  ['cadet', true],
])(
  'previews the actual next spawn through the boss and respects disclosure (%s, Survival %s)',
  (difficulty, endless) => {
    const game = new Game(0, endless, 913, difficulty);
    const reveal = !endless && difficulty === 'cadet';
    const waves = game.totalWaves + Number(endless);
    for (let wave = 1; wave <= waves; wave++) {
      const opening = game.incomingThreat;
      expect(opening).not.toBeNull();
      if (reveal && wave === 1) expect(opening).toEqual({ row: 2, kind: 'scout' });
      game.phase = 'paused';
      game.update(0.1);
      expect(game.incomingThreat).toBe(opening);
      game.phase = 'playing';
      expect(game.startWave()).toBe(true);
      expect(game.incomingThreat).toBe(opening);
      for (let index = 0; index < game.spawnTotal; index++) {
        const cue = game.incomingThreat!;
        game.spawnTimer = 0;
        game.update(1 / 60);
        const alien = game.enemies.at(-1)!;
        expect(alien.row).toBe(cue.row);
        expect(cue.kind).toBe(reveal ? alien.kind : null);
        if (wave >= game.totalWaves && index === game.spawnTotal - 1)
          expect(alien.kind).toBe('overlord');
        game.enemies = [];
      }
      expect(game.incomingThreat).toBeNull();
      game.update(1 / 60);
    }
    if (!endless) expect(game.phase).toBe('won');
  },
);
