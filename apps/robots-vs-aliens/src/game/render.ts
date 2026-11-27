import {
  BOTS,
  COLS,
  ENEMIES,
  ROWS,
  type Bot,
  type BotKind,
  type Enemy,
  type EnemyKind,
  type Game,
  type Shot,
} from './engine';
import { unitArtwork, type AlienSkin, type RobotSkin, type UnitSkin } from './skins';

import { fieldTextures, type FieldSkin } from './field';
import gaits from './gaits.json';
import alienFrames from '../assets/motion/poses.json';

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
    image.decoding = 'async';
    image.src = unitArtwork(kind, skin);
    void image.decode().catch(() => {});
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
  image: HTMLImageElement,
  kind: UnitKind,
  x: number,
  feet: number,
  maxWidth: number,
  maxHeight: number,
  kick = 0,
  brace = 0,
) {
  if (!image.complete || !image.naturalWidth) {
    const color = kind in BOTS ? BOTS[kind as BotKind].color : ENEMIES[kind as EnemyKind].color;
    panel(c, x - 11, feet - 29, 22, 20, 5, '#253b47', color);
    return;
  }
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const w = image.naturalWidth * scale * (1 + brace * 0.045);
  const h = image.naturalHeight * scale * (1 - brace * 0.075);
  if (kick > 0.02) {
    // The carriage travels back about its mount while the tracks or feet stay planted.
    const joint = Math.round(image.naturalHeight * 0.64);
    const top = joint * scale;
    const pivot = feet - h + top;
    c.drawImage(
      image,
      0,
      joint,
      image.naturalWidth,
      image.naturalHeight - joint,
      x - w / 2,
      pivot,
      w,
      h - top,
    );
    c.save();
    c.translate(x, pivot);
    c.transform(1, 0, kick / top, 1 - kick * 0.009, 0, 0);
    c.drawImage(image, 0, 0, image.naturalWidth, joint, -w / 2, -top, w, top);
    c.restore();
    return;
  }
  c.drawImage(image, x - w / 2, feet - h, w, h);
}

function drawBot(
  c: Ctx,
  image: HTMLImageElement,
  kind: BotKind,
  x: number,
  y: number,
  size: number,
  clock: number,
  motion: boolean,
  bot?: Bot,
) {
  const color = BOTS[kind].color;
  const feet = y + size * 0.41;
  glow(c, x, feet - 1, size * 0.55, size * 0.12, '#010810ce');
  const lift = kind === 'frost' ? 4 + (motion ? Math.sin(clock * 3.1) * 2.4 : 0) : 0;
  if (kind === 'frost') glow(c, x, feet - 1, size * 0.4, 6, '#66d9ec72');
  const flash = motion && bot ? bot.flash : 0;
  const sinceShot = bot && BOTS[kind].damage ? BOTS[kind].rate - bot.timer : Infinity;
  const recovery = kind === 'nova' ? 0.34 : 0.2;
  const kick = motion ? Math.max(0, 1 - sinceShot / recovery) ** 2 : 0;
  const brace = kind === 'bastion' ? Math.min(1, flash * 5.6) : 0;
  unit(
    c,
    image,
    kind,
    x,
    feet - lift,
    size * 1.09,
    size * 0.97,
    kick * (kind === 'nova' ? 8 : 5),
    brace,
  );
  if (motion && kind === 'spark' && bot) {
    const charge = Math.max(0, 1 - bot.timer / 8);
    if (charge > 0.55) {
      c.globalAlpha = (charge - 0.55) * 1.5;
      glow(c, x, y - size * 0.21, size * 0.34, size * 0.2, '#ffc464a6');
      c.globalAlpha = 1;
    }
  }
  if (flash > 0) {
    const strength = Math.min(1, flash * 5.6);
    const barrel = sinceShot < 0.18;
    const px = barrel ? x + size * (kind === 'nova' ? 0.3 : 0.48) : x;
    const py = y - (kind === 'nova' && barrel ? size * 0.43 : 0);
    glow(c, px, py, (barrel ? 25 : 32) * strength, (barrel ? 11 : 22) * strength, color + 'b0');
    if (barrel) line(c, px - 3, py, px + strength * 11, py, '#f6fff1', 2);
  }
}

function drawAlien(
  c: Ctx,
  image: HTMLImageElement,
  sheet: HTMLImageElement | undefined,
  cells: number[][],
  enemy: Enemy,
  x: number,
  y: number,
  size: number,
  motion: boolean,
  holding: boolean,
) {
  const kind = enemy.kind;
  const feet = y + size * 0.35;
  glow(c, x, feet - 1, size * 0.55, size * 0.13, '#010810ce');
  if (enemy.slow > 0) {
    glow(c, x, feet - 2, size * 0.56, 8, '#89e2ffb2');
    line(c, x - size * 0.38, feet, x + size * 0.38, feet, '#a9ecff', 1.7);
  }
  if (!motion) {
    unit(c, image, kind, x, feet, size * 1.16, size * 0.99);
    return;
  }

  const gait = gaits.species[kind];
  const travel = (9.6 - enemy.x) / gait.strideCells + enemy.id * 0.347;
  const cooldown = kind === 'spitter' ? 1.8 : 0.9;
  // Frame zero of the attack is the bite, ram, slash or acid release.
  const phase = holding
    ? 1 - Math.min(1, Math.max(0, enemy.timer / cooldown))
    : travel - Math.floor(travel);
  if (sheet?.complete && sheet.naturalWidth) {
    const frame = Math.min(gaits.frames - 1, Math.floor(phase * gaits.frames));
    const clip = gait.row * 2 + Number(holding);
    const [sx, sy, w, h, dx, dy] = cells[clip * gaits.frames + frame];
    const scale = size / gaits.referenceSize;
    c.drawImage(sheet, sx, sy, w, h, x + dx * scale, feet + dy * scale, w * scale, h * scale);
  } else {
    // Keep the equipped portrait readable while its sheet decodes or if it fails.
    const beat = Math.sin(phase * Math.PI * 2);
    const reach = holding ? Math.max(0, 1 - phase * 4) * (kind === 'spitter' ? 5 : -8) : 0;
    c.save();
    c.translate(x + reach, feet);
    c.rotate(holding ? -beat * 0.09 : beat * 0.075);
    unit(c, image, kind, 0, 0, size * 1.16, size * 0.99);
    c.restore();
  }
  if (holding && kind === 'spitter' && phase > 0.58) {
    const charge = (phase - 0.58) / 0.42;
    glow(c, x - size * 0.4, y, 3 + 9 * charge, 2 + 5 * charge, '#cbff7aab');
  }
  if (enemy.flash > 0) {
    const strength = Math.min(1, enemy.flash * 8);
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

// Field materials and lane rails are painted only when the cached terrain changes.
function drawFieldTile(
  c: Ctx,
  skin: Exclude<FieldSkin, 'standard'>,
  texture: HTMLImageElement | undefined,
  x: number,
  y: number,
  row: number,
  col: number,
) {
  const foundry = skin === 'foundry';
  const w = BOARD.cw,
    h = BOARD.ch;
  c.fillStyle = foundry ? '#211d1b' : '#142631';
  c.fillRect(x, y, w, h);
  c.fillStyle = foundry ? '#46403a' : '#364f60';
  c.fillRect(x + 2, y + 3, w - 4, h - 6);
  if (texture?.complete && texture.naturalWidth) {
    c.save();
    c.translate(x + w / 2, y + h / 2);
    if ((row + col) % 2) c.rotate(Math.PI);
    c.drawImage(texture, -w / 2 + 2, -h / 2 + 3, w - 4, h - 6);
    c.restore();
  }
  if (foundry) {
    line(c, x + 4, y + h - 4, x + w - 4, y + h - 4, '#ac7752', 2);
    for (let i = 0; i < 3; i++)
      line(c, x + 7 + i * 5, y + h - 7, x + 10 + i * 5, y + h - 12, '#c79361', 2);
  } else {
    line(c, x + 3, y + 4, x + w - 11, y + 4, '#7ca4b2', 1.4);
    line(c, x + w - 11, y + 4, x + w - 4, y + 11, '#9bc5d3', 1.4);
    line(c, x + 5, y + h - 6, x + 19, y + h - 6, '#76bac4', 2);
  }
}

export class Renderer {
  private c: Ctx;
  private background = document.createElement('canvas');
  private sector = -1;
  private field: FieldSkin = 'standard';
  private surface?: HTMLImageElement;
  private landscape?: HTMLImageElement;
  private sceneRequest = 0;
  hover: { row: number; col: number } | null = null;
  selection: BotKind | 'recycle' | 'beam' = 'pulse';
  private robots: RobotSkin = 'standard';
  private aliens: AlienSkin = 'standard';
  private motionReduced = false;
  private battleStarted = false;
  private strideSheet?: HTMLImageElement;
  private steps = new WeakMap<Enemy, { time: number; x: number; holding: boolean }>();
  private portraits = {} as Record<UnitKind, HTMLImageElement>;
  private standard = {} as Record<UnitKind, HTMLImageElement>;

  constructor(public canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d')!;
    this.background.width = BOARD.width;
    this.background.height = BOARD.height;
    for (const kind of [...Object.keys(BOTS), ...Object.keys(ENEMIES)] as UnitKind[]) {
      this.portraits[kind] = this.standard[kind] = sprite(kind);
    }
  }

  get robotSkin() {
    return this.robots;
  }
  set robotSkin(skin: RobotSkin) {
    if (this.robots === skin) return;
    this.robots = skin;
    for (const kind of Object.keys(BOTS) as BotKind[]) this.portraits[kind] = sprite(kind, skin);
  }

  get alienSkin() {
    return this.aliens;
  }
  set alienSkin(skin: AlienSkin) {
    if (this.aliens === skin) return;
    this.aliens = skin;
    for (const kind of Object.keys(ENEMIES) as EnemyKind[])
      this.portraits[kind] = sprite(kind, skin);
    this.strideSheet = undefined;
    this.prepareStride();
  }

  get reducedMotion() {
    return this.motionReduced;
  }
  set reducedMotion(value: boolean) {
    this.motionReduced = value;
    this.prepareStride();
  }

  prepareBattle() {
    this.battleStarted = true;
    this.prepareStride();
  }

  private prepareStride() {
    if (!this.battleStarted || this.motionReduced || this.strideSheet) return;
    const sheet = new Image();
    sheet.decoding = 'async';
    sheet.src = new URL(`../assets/motion/${this.aliens}-stride.webp`, import.meta.url).href;
    this.strideSheet = sheet;
    void sheet.decode().catch(() => {}); // Static portraits remain available while loading or after failure.
  }

  // The simulation advances every mobile alien, including slowed ones. A fixed x
  // across two distinct simulation times means it is engaging a blocker. Repeated
  // paints of a paused frame keep the last pose without duplicating targeting rules.
  private isHolding(enemy: Enemy, time: number) {
    const last = this.steps.get(enemy);
    if (!last) {
      this.steps.set(enemy, { time, x: enemy.x, holding: false });
      return false;
    }
    if (last.time !== time) {
      last.holding = last.x === enemy.x;
      last.x = enemy.x;
      last.time = time;
    }
    return last.holding;
  }

  private portrait(kind: UnitKind) {
    const selected = this.portraits[kind];
    return selected.complete && selected.naturalWidth ? selected : this.standard[kind];
  }

  set fieldSkin(skin: FieldSkin) {
    if (skin === this.field) return;
    this.field = skin;
    this.surface = undefined;
    if (skin !== 'standard') {
      const surface = new Image();
      this.surface = surface;
      surface.onload = () => {
        if (this.surface === surface) this.repaintTerrain();
      };
      surface.src = fieldTextures[skin];
    }
    this.repaintTerrain();
  }

  private repaintTerrain() {
    if (this.sector >= 0)
      this.drawBackground(sectorScenes[this.sector] ?? sectorScenes[0], this.landscape);
  }

  private selectSector(sector: number) {
    this.sector = sector;
    const scene = sectorScenes[sector] ?? sectorScenes[0];
    // This also covers missing or corrupt artwork. Units and controls use the same coordinates.
    this.landscape = undefined;
    this.repaintTerrain();
    const request = ++this.sceneRequest;
    const landscape = new Image();
    landscape.onload = () => {
      if (request !== this.sceneRequest) return;
      this.landscape = landscape;
      this.repaintTerrain();
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
        if (this.field !== 'standard') {
          drawFieldTile(c, this.field, this.surface, x, y, row, col);
          continue;
        }
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
    if (scene.deckTint && this.field === 'standard') {
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
          drawBot(
            c,
            this.portrait(this.selection),
            this.selection,
            x + 50,
            y + 41,
            72,
            t,
            !this.reducedMotion,
          );
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
        drawBot(
          c,
          this.portrait(bot.kind),
          bot.kind,
          x,
          y,
          73,
          t + bot.id,
          !this.reducedMotion,
          bot,
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
          this.portrait(enemy.kind),
          this.strideSheet,
          alienFrames[this.aliens].cells,
          enemy,
          x,
          y,
          size,
          !this.reducedMotion,
          this.isHolding(enemy, game.time),
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
