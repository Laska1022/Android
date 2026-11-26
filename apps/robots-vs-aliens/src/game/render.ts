import {
  BOTS,
  COLS,
  ENEMIES,
  ROWS,
  SECTORS,
  type BotKind,
  type EnemyKind,
  type Game,
  type Shot,
} from './engine';
import { unitArtwork, type AlienSkin, type RobotSkin, type UnitSkin } from './skins';

export const BOARD = { x: 157, y: 170, cw: 100, ch: 82, width: 1200, height: 700 };
type Ctx = CanvasRenderingContext2D;
type UnitKind = BotKind | EnemyKind;
const sprites = new Map<string, HTMLImageElement>();
const lightTextures = new Map<string, HTMLCanvasElement>();

// Campaign order follows SECTORS. The deck lights tie each playable grid to its skyline.
const sectorScenes = [
  {
    image: new URL('../assets/perimeter.webp', import.meta.url).href,
    sky: '#0b223c',
    horizon: '#34515a',
    deckTint: '',
    trim: '#779da2',
    rift: '#df92db',
  },
  {
    image: new URL('../assets/sectors/dust-and-echoes.webp', import.meta.url).href,
    sky: '#39263a',
    horizon: '#ac6e49',
    deckTint: '#cd794429',
    trim: '#dda474',
    rift: '#ffab77',
  },
  {
    image: new URL('../assets/sectors/the-hollow.webp', import.meta.url).href,
    sky: '#162444',
    horizon: '#4e6783',
    deckTint: '#767cc026',
    trim: '#94cded',
    rift: '#c9a4ff',
  },
  {
    image: new URL('../assets/sectors/iron-horizon.webp', import.meta.url).href,
    sky: '#202d37',
    horizon: '#657782',
    deckTint: '#70838d26',
    trim: '#e9ad65',
    rift: '#ff975d',
  },
  {
    image: new URL('../assets/sectors/last-light.webp', import.meta.url).href,
    sky: '#221125',
    horizon: '#854355',
    deckTint: '#9a405331',
    trim: '#e399a5',
    rift: '#f77caa',
  },
];
type SectorScene = (typeof sectorScenes)[number];

function sprite(kind: UnitKind, skin: UnitSkin = 'standard') {
  const key = `${skin}/${kind}`;
  let image = sprites.get(key);
  if (!image) {
    image = new Image();
    if (skin !== 'standard') {
      image.addEventListener(
        'error',
        () => {
          image!.src = unitArtwork(kind);
        },
        { once: true },
      );
    }
    image.src = unitArtwork(kind, skin);
    sprites.set(key, image);
  }
  return image;
}

export function botIcon(kind: BotKind, skin: RobotSkin = 'standard') {
  return sprite(kind, skin).src;
}

export function alienIcon(kind: EnemyKind, skin: AlienSkin = 'standard') {
  return sprite(kind, skin).src;
}

function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function panel(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  bevel: number,
  fill: string | CanvasGradient,
  edge?: string,
) {
  c.beginPath();
  c.moveTo(x + bevel, y);
  c.lineTo(x + w - bevel, y);
  c.lineTo(x + w, y + bevel);
  c.lineTo(x + w, y + h - bevel);
  c.lineTo(x + w - bevel, y + h);
  c.lineTo(x + bevel, y + h);
  c.lineTo(x, y + h - bevel);
  c.lineTo(x, y + bevel);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 1.5;
    c.stroke();
  }
}

function line(c: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

// Particle and weapon lighting share small, reusable radial textures.
function glow(c: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  let texture = lightTextures.get(color);
  if (!texture) {
    texture = document.createElement('canvas');
    texture.width = texture.height = 64;
    const light = texture.getContext('2d')!;
    const gradient = light.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    light.fillStyle = gradient;
    light.fillRect(0, 0, 64, 64);
    lightTextures.set(color, texture);
  }
  c.drawImage(texture, x - rx, y - ry, rx * 2, ry * 2);
}

function unit(
  c: Ctx,
  kind: UnitKind,
  x: number,
  feet: number,
  maxWidth: number,
  maxHeight: number,
  skin: UnitSkin,
) {
  let image = sprite(kind, skin);
  if (skin !== 'standard' && (!image.complete || !image.naturalWidth)) image = sprite(kind);
  if (!image.complete || !image.naturalWidth) {
    const color = kind in BOTS ? BOTS[kind as BotKind].color : ENEMIES[kind as EnemyKind].color;
    panel(c, x - 11, feet - 29, 22, 20, 5, '#253b47', color);
    return;
  }
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  c.drawImage(image, x - w / 2, feet - h, w, h);
}

export function drawBot(
  c: Ctx,
  kind: BotKind,
  x: number,
  y: number,
  size: number,
  t = 0,
  flash = 0,
  firing = false,
  skin: RobotSkin = 'standard',
) {
  const color = BOTS[kind].color;
  const feet = y + size * 0.41;
  glow(c, x, feet - 1, size * 0.55, size * 0.12, '#010810ce');
  const lift = kind === 'frost' ? 3 + Math.sin(t * 3) * 1.5 : 0;
  if (kind === 'frost') glow(c, x, feet - 1, size * 0.4, 6, '#66d9ec72');
  const recoil = firing ? Math.min(1, flash * 5.6) * 3 : 0;
  unit(c, kind, x - recoil, feet - lift, size * 1.09, size * 0.97, skin);
  if (flash > 0) {
    const strength = Math.min(1, flash * 5.6);
    const barrel = firing;
    const px = barrel ? x + size * 0.45 : x;
    const py = y - (kind === 'nova' ? size * 0.48 : 0);
    glow(c, px, py, (barrel ? 25 : 32) * strength, (barrel ? 11 : 22) * strength, color + 'b0');
    if (barrel) line(c, px - 3, py, px + strength * 11, py, '#f6fff1', 2);
  }
}

export function drawAlien(
  c: Ctx,
  kind: EnemyKind,
  x: number,
  y: number,
  size: number,
  t = 0,
  flash = 0,
  slow = false,
  skin: AlienSkin = 'standard',
) {
  const feet = y + size * 0.35;
  const stride = Math.sin(t * (kind === 'runner' ? 13 : 6));
  glow(c, x, feet - 1, size * 0.55, size * 0.13, '#010810ce');
  if (slow) {
    glow(c, x, feet - 2, size * 0.56, 8, '#89e2ffb2');
    line(c, x - size * 0.38, feet, x + size * 0.38, feet, '#a9ecff', 1.7);
  }
  unit(c, kind, x + stride * 0.9, feet - Math.abs(stride) * 1.7, size * 1.16, size * 0.99, skin);
  if (flash > 0) {
    const strength = Math.min(1, flash * 8);
    glow(c, x - size * 0.24, y, strength * 29, strength * 22, '#ffe8bba8');
  }
}

function projectile(c: Ctx, shot: Shot) {
  const x = BOARD.x + shot.x * BOARD.cw;
  const y = BOARD.y + (shot.row + 0.5) * BOARD.ch + 3;
  const color = shot.kind === 'acid' ? '#a5f07c' : BOTS[shot.kind].color;
  const dir = Math.sign(shot.speed);
  const length = shot.kind === 'frost' ? 31 : shot.kind === 'nova' ? 22 : 17;
  const thick = shot.kind === 'nova' ? 6 : 3;
  glow(c, x - dir * 4, y, length, thick * 2.7, color + '99');
  line(c, x - dir * length, y, x, y, color, thick);
  line(c, x - dir * length * 0.65, y, x + dir * 2, y, '#f1fff5', thick * 0.48);
  if (shot.kind === 'acid' || shot.kind === 'nova') {
    ellipse(c, x, y, 5, 4, color);
    ellipse(c, x + dir, y - 1, 2.5, 2, '#f9ffe3');
  }
}

export class Renderer {
  private c: Ctx;
  private background = document.createElement('canvas');
  private sector = -1;
  private sceneRequest = 0;
  hover: { row: number; col: number } | null = null;
  selection: BotKind | 'recycle' | 'beam' = 'pulse';
  reducedMotion = false;
  robotSkin: RobotSkin = 'standard';
  alienSkin: AlienSkin = 'standard';

  constructor(public canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d')!;
    this.background.width = BOARD.width;
    this.background.height = BOARD.height;
    for (const kind of [...Object.keys(BOTS), ...Object.keys(ENEMIES)]) sprite(kind as UnitKind);
  }

  private selectSector(sector: number) {
    this.sector = sector;
    const scene = sectorScenes[sector] ?? sectorScenes[0];
    const name = (SECTORS[sector] ?? SECTORS[0]).name;
    this.canvas.setAttribute('aria-label', `${name} battlefield, five defense lanes`);
    // This also covers missing or corrupt artwork. Units and controls use the same coordinates.
    this.drawBackground(scene);
    const request = ++this.sceneRequest;
    const landscape = new Image();
    landscape.onload = () => {
      if (request === this.sceneRequest) this.drawBackground(scene, landscape);
    };
    landscape.src = scene.image;
  }

  private drawBackground(scene: SectorScene, landscape?: HTMLImageElement) {
    const c = this.background.getContext('2d')!;
    const sky = c.createLinearGradient(0, 0, 0, BOARD.height);
    sky.addColorStop(0, scene.sky);
    sky.addColorStop(0.32, scene.horizon);
    sky.addColorStop(1, '#101e2c');
    c.fillStyle = sky;
    c.fillRect(0, 0, BOARD.width, BOARD.height);
    if (landscape) c.drawImage(landscape, 0, 0, BOARD.width, BOARD.height);
    const vignette = c.createLinearGradient(0, 0, 0, BOARD.height);
    vignette.addColorStop(0, '#0b13281a');
    vignette.addColorStop(0.25, '#101b2b30');
    vignette.addColorStop(0.88, '#09162377');
    vignette.addColorStop(1, '#071321ba');
    c.fillStyle = vignette;
    c.fillRect(0, 0, BOARD.width, BOARD.height);

    panel(c, 141, 160, 932, 429, 13, '#101d28', '#83a6ac');
    panel(c, 146, 164, 922, 421, 8, '#182c37', '#3f5860');
    c.fillStyle = scene.trim;
    c.fillRect(156, 162, 276, 2);
    for (let row = 0; row < ROWS; row++) {
      const y = BOARD.y + row * BOARD.ch;
      for (let col = 0; col < COLS; col++) {
        const x = BOARD.x + col * BOARD.cw;
        const floor = c.createLinearGradient(0, y, 0, y + BOARD.ch);
        floor.addColorStop(0, (row + col) % 2 ? '#354c54' : '#3d555a');
        floor.addColorStop(0.5, (row + col) % 2 ? '#293f48' : '#2e454c');
        floor.addColorStop(1, '#253a43');
        panel(c, x + 1.5, y + 1.5, 97, 79, 4, floor, '#567079');
        line(c, x + 6, y + 4, x + 66, y + 4, '#9bbabe48');
        line(c, x + 8, y + 11, x + 15, y + 11, '#95b3b569', 1.5);
        line(c, x + 85, y + 71, x + 92, y + 71, '#95b3b569', 1.5);
        for (let vent = 0; vent < 3; vent++)
          line(c, x + 8 + vent * 4, y + 71, x + 11 + vent * 4, y + 68, '#10293280', 1.5);
        // Fixed tool marks vary by tile and are painted only into this static plate.
        const seed = row * COLS + col;
        for (let mark = 0; mark < 9; mark++) {
          const sx = x + 8 + ((seed * 43 + mark * 37) % 75);
          const sy = y + 9 + ((seed * 17 + mark * 13) % 61);
          line(c, sx, sy, sx + 2 + ((seed + mark) % 7), sy - 1.5, '#c5d4ce13');
        }
      }
      const center = y + BOARD.ch / 2;
      panel(c, 55, center - 22, 45, 44, 7, '#10232edb', '#75909b');
      c.font = 'bold 15px monospace';
      c.fillStyle = '#d0e1dc';
      c.fillText(String(row + 1).padStart(2, '0'), 67, center + 5);
      line(c, 99, center, 140, center, '#a2c4caac', 2);
      line(c, 1076, center, 1102, center, scene.rift + '82', 1.5);
    }
    if (scene.deckTint) {
      c.fillStyle = scene.deckTint;
      c.fillRect(BOARD.x, BOARD.y, COLS * BOARD.cw, ROWS * BOARD.ch);
    }
    for (let col = 0; col < COLS; col++) {
      c.fillStyle = col % 3 ? '#54747b' : scene.trim;
      c.fillRect(172 + col * 100, 588, 49, 2);
    }
    glow(c, 1120, 375, 67, 228, scene.rift + '3c');
    c.strokeStyle = scene.rift + '8a';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(1120, 375, 25, 188, 0, 0, Math.PI * 2);
    c.stroke();
  }

  draw(game: Game, menu = false) {
    if (menu) return;
    const c = this.c;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(this.canvas.clientWidth * dpr);
    const height = Math.round((width * BOARD.height) / BOARD.width);
    if (!width) return;
    if (game.sector !== this.sector) this.selectSector(game.sector);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    c.setTransform(width / BOARD.width, 0, 0, height / BOARD.height, 0, 0);
    c.drawImage(this.background, 0, 0);
    const t = this.reducedMotion ? 0 : game.time;
    for (let row = 0; row < ROWS; row++) {
      if (!game.sweepers[row]) continue;
      const y = BOARD.y + (row + 0.5) * BOARD.ch;
      panel(c, 111, y - 11, 26, 22, 5, '#203638', '#87b6a6');
      line(c, 118, y, 130, y, '#b6ffbd', 3);
    }
    if (this.hover && game.phase === 'playing') {
      const { row, col } = this.hover;
      const x = BOARD.x + col * BOARD.cw;
      const y = BOARD.y + row * BOARD.ch;
      if (this.selection === 'beam') {
        panel(c, BOARD.x, y, BOARD.cw * COLS, BOARD.ch, 4, '#8feaff22', '#8feaff');
      } else {
        const empty = !game.bots.some((bot) => bot.row === row && bot.col === col);
        const color =
          this.selection === 'recycle'
            ? '#ff9378'
            : empty && game.energy >= BOTS[this.selection].cost
              ? '#bcf78a'
              : '#ff8181';
        panel(c, x + 2, y + 2, 96, 78, 4, color + '20', color);
        if (empty && this.selection !== 'recycle') {
          c.globalAlpha = 0.5;
          drawBot(c, this.selection, x + 50, y + 41, 72, t, 0, false, this.robotSkin);
          c.globalAlpha = 1;
        }
      }
    }
    // Draw lane by lane so a boss can overlap the top edge of its own tile.
    for (let row = 0; row < ROWS; row++) {
      const y = BOARD.y + (row + 0.5) * BOARD.ch;
      for (const bot of game.bots) {
        if (bot.row !== row) continue;
        const x = BOARD.x + (bot.col + 0.5) * BOARD.cw;
        const firing = BOTS[bot.kind].damage > 0 && bot.timer > BOTS[bot.kind].rate - 0.18;
        drawBot(
          c,
          bot.kind,
          x,
          y,
          73,
          this.reducedMotion ? 0 : t + bot.id,
          this.reducedMotion ? 0 : bot.flash,
          firing,
          this.robotSkin,
        );
        if (bot.hp < BOTS[bot.kind].hp)
          this.health(x, y + 32, bot.hp / BOTS[bot.kind].hp, '#a8f570');
        if (bot.kind === 'spark') {
          c.fillStyle = '#06151c';
          c.fillRect(x - 19, y + 37, 38, 2.5);
          c.fillStyle = '#ffd47e';
          c.fillRect(x - 19, y + 37, 38 * (1 - Math.max(0, bot.timer) / 8), 2.5);
        }
      }
      for (const enemy of game.enemies) {
        if (enemy.row !== row) continue;
        const x = BOARD.x + enemy.x * BOARD.cw;
        const size =
          enemy.kind === 'overlord'
            ? 99
            : enemy.kind === 'brute'
              ? 80
              : enemy.kind === 'runner'
                ? 65
                : 70;
        drawAlien(
          c,
          enemy.kind,
          x,
          y,
          size,
          this.reducedMotion ? 0 : t + enemy.id,
          this.reducedMotion ? 0 : enemy.flash,
          enemy.slow > 0,
          this.alienSkin,
        );
        if (enemy.hp < enemy.maxHp || enemy.kind === 'overlord')
          this.health(x, y - size * 0.66, enemy.hp / enemy.maxHp, '#f0a3d4');
      }
    }
    for (const shot of game.shots) projectile(c, shot);
    for (const sweep of game.sweeps) {
      const x = BOARD.x + sweep.x * BOARD.cw;
      const y = BOARD.y + (sweep.row + 0.5) * BOARD.ch;
      glow(c, x, y, 51, 44, '#bfff8a8c');
      panel(c, x - 27, y - 18, 50, 36, 7, '#53727b', '#d2f3ec');
      line(c, x + 12, y - 28, x + 12, y + 28, '#d8ffbf', 5);
    }
    for (const pickup of game.pickups) {
      const x = BOARD.x + pickup.x * BOARD.cw;
      const y = BOARD.y + (pickup.row + 0.5) * BOARD.ch + Math.sin(t * 3) * 3;
      c.globalAlpha = pickup.life < 3 && !this.reducedMotion ? 0.73 + Math.sin(t * 10) * 0.18 : 1;
      glow(c, x, y, 30, 30, '#ffc65a75');
      panel(c, x - 15, y - 15, 30, 30, 7, '#44351a', '#ffd77c');
      line(c, x + 3, y - 10, x - 5, y + 1, '#ffedaf', 3);
      line(c, x - 5, y + 1, x + 4, y + 1, '#ffedaf', 3);
      line(c, x + 4, y + 1, x - 3, y + 11, '#ffedaf', 3);
    }
    if (!this.reducedMotion) {
      for (const p of game.particles) {
        const x = BOARD.x + p.x * BOARD.cw;
        const y = BOARD.y + p.y * BOARD.ch;
        c.globalAlpha = Math.max(0, p.life / p.max);
        line(c, x - p.vx * 2.6, y - p.vy * 2.1, x, y, p.color, Math.max(1, p.size * 0.65));
      }
    }
    c.globalAlpha = 1;
  }

  private health(x: number, y: number, fraction: number, color: string) {
    const c = this.c;
    c.fillStyle = '#06121a';
    c.fillRect(x - 24, y - 1, 48, 6);
    c.fillStyle = color;
    c.fillRect(x - 23, y, 46 * Math.max(0, Math.min(1, fraction)), 4);
  }
}
