export const ROWS = 5;
export const COLS = 9;
export type BotKind = 'pulse' | 'spark' | 'frost' | 'nova' | 'bastion';
export type EnemyKind = 'scout' | 'runner' | 'brute' | 'spitter' | 'overlord';
export type Phase = 'playing' | 'paused' | 'won' | 'lost';
export const BOTS: Record<
  BotKind,
  {
    name: string;
    role: string;
    cost: number;
    hp: number;
    damage: number;
    rate: number;
    color: string;
    description: string;
  }
> = {
  pulse: {
    name: 'Pulse',
    role: 'BLASTER',
    cost: 100,
    hp: 180,
    damage: 26,
    rate: 1.1,
    color: '#a8f570',
    description: 'Reliable plasma fire. Your first line of offense.',
  },
  spark: {
    name: 'Spark',
    role: 'GENERATOR',
    cost: 60,
    hp: 130,
    damage: 0,
    rate: 8,
    color: '#ffcc66',
    description: 'Produces 25 energy every 8 seconds. Protect it in the back.',
  },
  frost: {
    name: 'Frost',
    role: 'DISRUPTOR',
    cost: 125,
    hp: 170,
    damage: 13,
    rate: 1.4,
    color: '#72dfff',
    description: 'Slows enemies by 55%. Pair with a damage dealer.',
  },
  nova: {
    name: 'Nova',
    role: 'ARTILLERY',
    cost: 175,
    hp: 160,
    damage: 68,
    rate: 2.8,
    color: '#c6a0ff',
    description: 'Explosive rounds damage enemies in nearby lanes.',
  },
  bastion: {
    name: 'Bastion',
    role: 'DEFENDER',
    cost: 75,
    hp: 950,
    damage: 0,
    rate: 0,
    color: '#ff9378',
    description: 'Heavy armor buys your squad time. Place it out front.',
  },
};
export const ENEMIES: Record<
  EnemyKind,
  { hp: number; speed: number; damage: number; score: number; color: string }
> = {
  scout: { hp: 105, speed: 0.18, damage: 19, score: 50, color: '#be91ec' },
  runner: { hp: 70, speed: 0.34, damage: 14, score: 60, color: '#f794ae' },
  brute: { hp: 340, speed: 0.115, damage: 35, score: 120, color: '#be83d9' },
  spitter: { hp: 150, speed: 0.15, damage: 17, score: 90, color: '#86c6ad' },
  overlord: { hp: 1400, speed: 0.095, damage: 70, score: 600, color: '#ed8cb7' },
};
export const SECTORS = [
  {
    name: 'First contact',
    location: 'KEPLER-186F · GREENLINE',
    waves: 4,
    description: 'A strange signal. A quiet outpost. Hold the line.',
  },
  {
    name: 'Dust & echoes',
    location: 'KEPLER-186F · THE BADLANDS',
    waves: 5,
    description: 'Fast-moving signatures approach through the dust.',
  },
  {
    name: 'The hollow',
    location: 'KEPLER-186F · CRYSTAL BASIN',
    waves: 5,
    description: 'The swarm has learned to strike from a distance.',
  },
  {
    name: 'Iron horizon',
    location: 'KEPLER-186F · RELAY NINE',
    waves: 6,
    description: 'Heavy armor detected. Bring the big guns.',
  },
  {
    name: 'Last light',
    location: 'KEPLER-186F · THE NEST',
    waves: 6,
    description: 'One last stand. The Overlord is coming.',
  },
];
export interface Bot {
  id: number;
  kind: BotKind;
  row: number;
  col: number;
  hp: number;
  timer: number;
  flash: number;
}
export interface Enemy {
  id: number;
  kind: EnemyKind;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  slow: number;
  timer: number;
  flash: number;
}
export interface Shot {
  id: number;
  row: number;
  x: number;
  damage: number;
  kind: BotKind | 'acid';
  speed: number;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}
export interface Pickup {
  id: number;
  row: number;
  x: number;
  life: number;
  value: number;
}
export interface GameEvent {
  type:
    'shoot' | 'hit' | 'explode' | 'place' | 'energy' | 'wave' | 'breach' | 'win' | 'lose' | 'beam';
  kind?: string;
}
export interface Sweep {
  row: number;
  x: number;
}

export class Game {
  phase: Phase = 'playing';
  bots: Bot[] = [];
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  particles: Particle[] = [];
  pickups: Pickup[] = [];
  events: GameEvent[] = [];
  sweeps: Sweep[] = [];
  sweepers = [true, true, true, true, true];
  energy = 325;
  lives = 5;
  score = 0;
  kills = 0;
  wave = 0;
  time = 0;
  intermission = 18;
  spawned = 0;
  spawnTotal = 0;
  spawnTimer = 0;
  beamCooldown = 0;
  private id = 0;
  private energyTimer = 0;
  private pickupTimer = 7;
  private seed: number;
  constructor(
    public sector = 0,
    public endless = false,
    seed = Date.now(),
  ) {
    this.seed = seed >>> 0;
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  get totalWaves() {
    return SECTORS[this.sector].waves;
  }
  get waveActive() {
    return this.intermission < 0;
  }
  private event(type: GameEvent['type'], kind?: string) {
    this.events.push({ type, kind });
  }
  drainEvents() {
    return this.events.splice(0);
  }
  place(kind: BotKind, row: number, col: number): boolean {
    if (
      this.phase !== 'playing' ||
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      row >= ROWS ||
      col < 0 ||
      col >= COLS ||
      this.energy < BOTS[kind].cost ||
      this.bots.some((b) => b.row === row && b.col === col)
    )
      return false;
    this.energy -= BOTS[kind].cost;
    this.bots.push({
      id: ++this.id,
      kind,
      row,
      col,
      hp: BOTS[kind].hp,
      timer: kind === 'spark' ? 8 : 0.25,
      flash: 0.3,
    });
    this.burst(col + 0.5, row + 0.5, BOTS[kind].color, 15);
    this.event('place');
    return true;
  }
  recycle(row: number, col: number) {
    if (this.phase !== 'playing') return false;
    const bot = this.bots.find((b) => b.row === row && b.col === col);
    if (!bot) return false;
    this.energy += Math.floor((BOTS[bot.kind].cost * 0.5 * bot.hp) / BOTS[bot.kind].hp);
    this.bots = this.bots.filter((b) => b !== bot);
    this.burst(col + 0.5, row + 0.5, '#a8f570', 12);
    return true;
  }
  collect(id: number) {
    if (this.phase !== 'playing') return false;
    const p = this.pickups.find((p) => p.id === id);
    if (!p) return false;
    this.energy += p.value;
    this.pickups = this.pickups.filter((x) => x !== p);
    this.event('energy');
    this.burst(p.x, p.row + 0.5, '#ffcc66', 12);
    return true;
  }
  beam(row: number) {
    if (this.phase !== 'playing' || this.beamCooldown > 0 || row < 0 || row >= ROWS) return false;
    this.beamCooldown = 42;
    for (const e of this.enemies.filter((e) => e.row === row)) {
      e.hp -= 320;
      e.flash = 0.4;
    }
    for (let x = 0.2; x < 9.5; x += 0.25) this.burst(x, row + 0.5, '#8feaff', 3);
    this.event('beam');
    this.removeDead();
    return true;
  }
  startWave() {
    if (this.phase !== 'playing' || this.waveActive) return false;
    this.wave++;
    this.intermission = -1;
    this.spawned = 0;
    this.spawnTotal = 5 + this.wave * 2 + this.sector * 2;
    this.spawnTimer = 1.5;
    this.event('wave');
    return true;
  }
  spawn(kind: EnemyKind, row: number, x = 9.6) {
    const hp = ENEMIES[kind].hp * (1 + this.sector * 0.18 + Math.max(0, this.wave - 4) * 0.1);
    const enemy: Enemy = {
      id: ++this.id,
      kind,
      row,
      x,
      hp,
      maxHp: hp,
      slow: 0,
      timer: 0.6,
      flash: 0,
    };
    this.enemies.push(enemy);
    return enemy;
  }
  burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2;
      const speed = 0.3 + this.random() * 1.7;
      const life = 0.25 + this.random() * 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life,
        max: life,
        size: 2 + this.random() * 4,
      });
    }
    if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
  }
  private removeDead() {
    for (const e of this.enemies.filter((e) => e.hp <= 0)) {
      this.score += ENEMIES[e.kind].score;
      this.kills++;
      this.energy += e.kind === 'overlord' ? 100 : 8;
      this.burst(e.x, e.row + 0.5, ENEMIES[e.kind].color, e.kind === 'overlord' ? 45 : 18);
      this.event('explode');
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    for (const b of this.bots.filter((b) => b.hp <= 0))
      this.burst(b.col + 0.5, b.row + 0.5, '#b6ced2', 20);
    this.bots = this.bots.filter((b) => b.hp > 0);
  }
  update(dt: number) {
    if (this.phase !== 'playing') return;
    dt = Math.min(Math.max(dt, 0), 0.1);
    this.time += dt;
    this.beamCooldown = Math.max(0, this.beamCooldown - dt);
    this.energyTimer += dt;
    if (this.energyTimer >= 1) {
      this.energy += 3;
      this.energyTimer -= 1;
    }
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.pickupTimer = 10;
      this.pickups.push({
        id: ++this.id,
        row: Math.floor(this.random() * ROWS),
        x: 1 + this.random() * 6.5,
        life: 15,
        value: 35,
      });
    }
    for (const p of this.pickups) p.life -= dt;
    this.pickups = this.pickups.filter((p) => p.life > 0);
    if (!this.waveActive) {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.intermission = 0;
        this.startWave();
      }
    } else if (this.spawned < this.spawnTotal) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const r = this.random();
        let kind: EnemyKind = 'scout';
        if (this.wave >= 2 && r < 0.3) kind = 'runner';
        if ((this.wave >= 3 || this.sector >= 1) && r > 0.7) kind = 'brute';
        if (this.sector >= 2 && r > 0.45 && r < 0.7) kind = 'spitter';
        if (this.wave >= this.totalWaves && this.spawned === this.spawnTotal - 1) kind = 'overlord';
        this.spawn(kind, Math.floor(this.random() * ROWS));
        this.spawned++;
        this.spawnTimer = Math.max(1.1, 3.7 - this.wave * 0.2 - this.sector * 0.15);
      }
    }
    for (const b of this.bots) {
      b.timer -= dt;
      b.flash = Math.max(0, b.flash - dt);
      if (b.kind === 'spark' && b.timer <= 0) {
        this.energy += 25;
        b.timer = 8;
        b.flash = 0.6;
        this.burst(b.col + 0.5, b.row + 0.3, '#ffcc66', 8);
        this.event('energy');
      }
      if (
        BOTS[b.kind].damage &&
        b.timer <= 0 &&
        this.enemies.some((e) => e.row === b.row && e.x > b.col + 0.2 && e.x < 10.1)
      ) {
        this.shots.push({
          id: ++this.id,
          row: b.row,
          x: b.col + 0.9,
          kind: b.kind,
          damage: BOTS[b.kind].damage,
          speed: b.kind === 'nova' ? 3.7 : 6,
        });
        b.timer = BOTS[b.kind].rate;
        b.flash = 0.18;
        this.event('shoot', b.kind);
      }
    }
    for (const e of this.enemies) {
      e.slow = Math.max(0, e.slow - dt);
      e.flash = Math.max(0, e.flash - dt);
      e.timer -= dt;
      const blocking = this.bots
        .filter(
          (b) =>
            b.row === e.row &&
            b.col + 0.5 <= e.x + 0.4 &&
            e.x - (b.col + 0.5) < (e.kind === 'spitter' ? 3.2 : 0.65),
        )
        .sort((a, b) => b.col - a.col)[0];
      if (blocking) {
        if (e.timer <= 0) {
          e.timer = e.kind === 'spitter' ? 1.8 : 0.9;
          if (e.kind === 'spitter')
            this.shots.push({
              id: ++this.id,
              row: e.row,
              x: e.x - 0.3,
              kind: 'acid',
              damage: ENEMIES[e.kind].damage,
              speed: -3,
            });
          else {
            blocking.hp -= ENEMIES[e.kind].damage;
            blocking.flash = 0.18;
            this.event('hit');
          }
        }
      } else e.x -= ENEMIES[e.kind].speed * (e.slow > 0 ? 0.45 : 1) * dt;
      if (e.x < -0.1) {
        if (this.sweepers[e.row]) {
          this.sweepers[e.row] = false;
          this.sweeps.push({ row: e.row, x: -0.3 });
          this.event('beam');
        } else {
          this.lives = Math.max(0, this.lives - (e.kind === 'overlord' ? 3 : 1));
          this.event('breach');
        }
        e.hp = 0;
      }
    }
    for (const sweep of this.sweeps) {
      sweep.x += dt * 7;
      for (const e of this.enemies)
        if (e.row === sweep.row && Math.abs(e.x - sweep.x) < 0.8) e.hp = 0;
    }
    this.sweeps = this.sweeps.filter((s) => s.x < 11);
    for (const s of this.shots) {
      const oldX = s.x;
      s.x += s.speed * dt;
      if (s.kind === 'acid') {
        const b = this.bots
          .filter((b) => b.row === s.row && b.col + 0.8 >= s.x && b.col + 0.2 <= oldX)
          .sort((a, b) => b.col - a.col)[0];
        if (b) {
          b.hp -= s.damage;
          b.flash = 0.2;
          s.x = -10;
        }
        continue;
      }
      const e = this.enemies
        .filter((e) => e.hp > 0 && e.row === s.row && e.x + 0.3 >= oldX && e.x - 0.3 <= s.x)
        .sort((a, b) => a.x - b.x)[0];
      if (e) {
        if (s.kind === 'nova') {
          for (const target of this.enemies)
            if (Math.hypot(target.x - e.x, target.row - e.row) < 1.35) {
              target.hp -= s.damage;
              target.flash = 0.2;
            }
          this.burst(e.x, e.row + 0.5, BOTS.nova.color, 24);
        } else {
          e.hp -= s.damage;
          e.flash = 0.13;
          if (s.kind === 'frost') e.slow = 3;
          this.burst(e.x, e.row + 0.5, BOTS[s.kind].color, 5);
        }
        s.x = 20;
        this.event('hit');
      }
    }
    this.shots = this.shots.filter((s) => s.x > -1 && s.x < 11);
    this.removeDead();
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.8 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.lives <= 0) {
      this.phase = 'lost';
      this.event('lose');
    } else if (this.waveActive && this.spawned >= this.spawnTotal && !this.enemies.length) {
      if (!this.endless && this.wave >= this.totalWaves) {
        this.phase = 'won';
        this.score += this.lives * 250;
        this.event('win');
      } else {
        this.intermission = 12;
        this.energy += 75;
        this.score += 100;
      }
    }
  }
}
