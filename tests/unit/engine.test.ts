import { describe, expect, it } from 'vitest';
import { BOTS, Game } from '../../src/game/engine';

function advance(game: Game, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) game.update(1 / 60);
}
function sandbox() {
  const g = new Game(0, false, 42);
  g.intermission = 10000;
  return g;
}

describe('deployment and economy', () => {
  it('validates bounds, occupied cells, budget, and paused state without spending energy', () => {
    const g = sandbox();
    expect(g.place('pulse', 0, 0)).toBe(true);
    expect(g.energy).toBe(225);
    expect(g.place('spark', 0, 0)).toBe(false);
    expect(g.place('spark', -1, 1)).toBe(false);
    expect(g.place('spark', 0, 9)).toBe(false);
    expect(g.place('spark', 0.5, 0)).toBe(false);
    expect(g.energy).toBe(225);
    g.energy = 20;
    expect(g.place('pulse', 1, 0)).toBe(false);
    g.energy = 100;
    g.phase = 'paused';
    expect(g.place('pulse', 1, 0)).toBe(false);
  });
  it('generates passive and Spark energy, and collects pickups only once', () => {
    const g = sandbox();
    g.place('spark', 0, 0);
    advance(g, 8.1);
    expect(g.energy).toBe(325 - 60 + 24 + 25);
    expect(g.pickups).toHaveLength(1);
    const id = g.pickups[0].id;
    const before = g.energy;
    expect(g.collect(id)).toBe(true);
    expect(g.energy).toBe(before + 35);
    expect(g.collect(id)).toBe(false);
  });
  it('recycles with a health-scaled refund', () => {
    const g = sandbox();
    g.place('pulse', 1, 1);
    g.bots[0].hp = BOTS.pulse.hp / 2;
    expect(g.recycle(1, 1)).toBe(true);
    expect(g.energy).toBe(250);
    expect(g.bots).toHaveLength(0);
    expect(g.recycle(1, 1)).toBe(false);
  });
});
describe('combat', () => {
  it('Pulse fires only into its lane and kills a target with score and energy rewards', () => {
    const g = sandbox();
    g.place('pulse', 0, 0);
    const e = g.spawn('scout', 0, 4);
    const other = g.spawn('scout', 1, 7);
    advance(g, 6);
    expect(g.enemies.find((x) => x.id === e.id)).toBeUndefined();
    expect(other.hp).toBe(other.maxHp);
    expect(g.score).toBe(50);
    expect(g.kills).toBe(1);
  });
  it('Frost slows enemies and Nova damages adjacent lanes', () => {
    const g = sandbox();
    g.place('frost', 0, 0);
    const enemy = g.spawn('brute', 0, 3);
    advance(g, 1);
    expect(enemy.slow).toBeGreaterThan(0);
    const splash = sandbox();
    splash.place('nova', 2, 0);
    const a = splash.spawn('brute', 2, 3),
      b = splash.spawn('brute', 3, 3);
    advance(splash, 1.2);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
  });
  it('aliens attack blockers and spitters fire ranged acid', () => {
    const g = sandbox();
    g.place('bastion', 1, 2);
    g.spawn('brute', 1, 3);
    advance(g, 2);
    expect(g.bots[0].hp).toBeLessThan(BOTS.bastion.hp);
    const s = sandbox();
    s.place('bastion', 2, 1);
    s.spawn('spitter', 2, 4);
    advance(s, 2);
    expect(s.bots[0].hp).toBeLessThan(BOTS.bastion.hp);
  });
  it('orbital strike affects one lane and observes cooldown', () => {
    const g = sandbox();
    const a = g.spawn('brute', 1, 5),
      b = g.spawn('scout', 2, 5);
    expect(g.beam(1)).toBe(true);
    expect(a.hp).toBe(20);
    expect(b.hp).toBe(105);
    expect(g.beam(1)).toBe(false);
    advance(g, 42.1);
    expect(g.beamCooldown).toBe(0);
  });
  it('uses a lane sweeper once, then breaches and ends at zero core integrity', () => {
    const g = sandbox();
    g.spawn('scout', 2, -0.2);
    advance(g, 0.1);
    expect(g.sweepers[2]).toBe(false);
    expect(g.lives).toBe(5);
    g.sweeps = [];
    g.lives = 1;
    g.spawn('scout', 2, -0.2);
    advance(g, 0.1);
    expect(g.lives).toBe(0);
    expect(g.phase).toBe('lost');
  });
  it('freezes simulation and resources while paused', () => {
    const g = sandbox();
    const e = g.spawn('scout', 0, 4);
    g.phase = 'paused';
    advance(g, 20);
    expect(g.time).toBe(0);
    expect(g.energy).toBe(325);
    expect(e.x).toBe(4);
  });
});
describe('waves and progression', () => {
  it('automatically starts the first wave and prevents duplicate wave starts', () => {
    const g = new Game(0, false, 42);
    advance(g, 18.1);
    expect(g.wave).toBe(1);
    expect(g.waveActive).toBe(true);
    expect(g.startWave()).toBe(false);
    advance(g, 2);
    expect(g.enemies.length).toBeGreaterThan(0);
  });
  it('ends a campaign only after the last wave is cleared and continues survival', () => {
    for (const endless of [false, true]) {
      const g = new Game(0, endless, 42);
      g.wave = 4;
      g.intermission = -1;
      g.spawnTotal = g.spawned = 1;
      advance(g, 0.1);
      expect(g.phase).toBe(endless ? 'playing' : 'won');
      if (endless) expect(g.intermission).toBeGreaterThan(0);
    }
  });
  it('a funded tactical squad can complete the first sector through actual simulated combat', () => {
    const g = new Game(0, false, 123);
    g.energy = 4000;
    for (let row = 0; row < 5; row++) {
      g.place('pulse', row, 0);
      g.place('pulse', row, 1);
      g.place('frost', row, 2);
      g.place('nova', row, 3);
      g.place('bastion', row, 5);
    }
    let sawBoss = false;
    for (let i = 0; i < 60 * 600 && g.phase === 'playing'; i++) {
      if (!g.waveActive) g.startWave();
      g.update(1 / 60);
      sawBoss ||= g.enemies.some((e) => e.kind === 'overlord');
    }
    expect(sawBoss).toBe(true);
    expect(g.phase).toBe('won');
    expect(g.wave).toBe(4);
    expect(g.kills).toBe(40);
  });
});
