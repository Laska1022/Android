import { BOTS, COLS, ENEMIES, Game, ROWS, type BotKind, type EnemyKind } from './engine';
export const BOARD = { x: 157, y: 170, cw: 100, ch: 82, width: 1200, height: 700 };
type Ctx = CanvasRenderingContext2D;
function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.2;
    c.stroke();
  }
}
function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
function line(c: Ctx, points: number[][], color: string, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}
function glow(c: Ctx, x: number, y: number, radius: number, color: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  c.fillStyle = g;
  c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function drawBot(
  c: Ctx,
  kind: BotKind,
  x: number,
  y: number,
  size: number,
  t = 0,
  flash = 0,
) {
  c.save();
  c.translate(x, y);
  c.scale(size / 80, size / 80);
  const color = BOTS[kind].color;
  const bob = Math.sin(t * 2.5) * 1.4;
  ellipse(c, 0, 30, kind === 'bastion' ? 32 : 27, 9, '#02070a75');
  glow(c, 0, 24, 33, color + '18');
  c.translate(0, bob);
  const metal = c.createLinearGradient(-25, -25, 22, 20);
  metal.addColorStop(0, '#d3e5e6');
  metal.addColorStop(0.5, '#7f9da9');
  metal.addColorStop(1, '#3d586b');
  rect(c, -22, 17, 16, 17, 5, '#263d4f', '#78919c');
  rect(c, 7, 17, 16, 17, 5, '#263d4f', '#78919c');
  rect(c, -24, 29, 21, 6, 3, '#607f89');
  rect(c, 5, 29, 21, 6, 3, '#607f89');
  rect(c, -25, -6, 50, 33, 10, '#38596b', '#7a97a3');
  c.fillStyle = metal;
  c.beginPath();
  c.roundRect(-25, -29, 50, 38, 12);
  c.fill();
  rect(c, -20, -21, 40, 19, 7, '#091e2b', '#526f7e');
  c.shadowBlur = 9;
  c.shadowColor = color;
  rect(c, -14, -16, 10, 7, 2, color);
  rect(c, 4, -16, 10, 7, 2, color);
  c.shadowBlur = 0;
  rect(c, -10, 12, 20, 5, 2, '#142c3b');
  rect(c, -6, 12, 12, 3, 1, color);
  line(
    c,
    [
      [-4, -29],
      [-4, -39],
    ],
    '#9ebdc7',
    3,
  );
  ellipse(c, -4, -40, 3, 3, color);
  if (kind === 'pulse') {
    rect(c, -31, 3, 10, 19, 4, '#5b7d8a', '#a0c2c8');
    rect(c, 17, -1, 30, 14, 5, '#203f50', '#7996a0');
    rect(c, 40, -4, 8, 20, 3, '#70919e');
    rect(c, 44, 1, 7, 10, 2, color);
    line(
      c,
      [
        [23, 2],
        [35, 2],
      ],
      '#b1c8cb',
      2,
    );
  } else if (kind === 'spark') {
    for (const side of [-1, 1]) {
      c.save();
      c.translate(side * 28, 1);
      c.rotate(side * -0.22);
      rect(c, -14, -20, 27, 40, 3, '#20384c', '#e8b55f');
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < 2; k++) rect(c, -10 + k * 11, -15 + j * 11, 8, 8, 1, '#e8b55f70');
      c.restore();
    }
    ellipse(c, 0, 12, 9, 9, '#ffc760');
    glow(c, 0, 12, 24, '#ffca6070');
  } else if (kind === 'frost') {
    rect(c, 18, -2, 29, 15, 4, '#325e70', '#97ddeb');
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      c.moveTo(24 + j * 8, -12);
      c.lineTo(20 + j * 8, 18);
      c.lineTo(30 + j * 8, 18);
      c.closePath();
      c.fillStyle = j % 2 ? '#64a8bc' : '#9beaff';
      c.fill();
    }
    ellipse(c, 46, 5, 5, 8, '#cbfaff');
  } else if (kind === 'nova') {
    c.save();
    c.translate(15, -20);
    c.rotate(-0.45);
    rect(c, -8, -15, 40, 23, 5, '#4d547b', '#a9a7cd');
    rect(c, 27, -18, 10, 29, 4, '#c1a1f5');
    ellipse(c, 35, -3, 5, 10, '#594878');
    c.restore();
    rect(c, -30, -1, 11, 22, 4, '#78679b');
  } else {
    c.beginPath();
    c.moveTo(6, -20);
    c.lineTo(41, -12);
    c.lineTo(39, 24);
    c.lineTo(22, 37);
    c.lineTo(5, 24);
    c.closePath();
    c.fillStyle = '#4c6170';
    c.fill();
    c.strokeStyle = color;
    c.lineWidth = 2.5;
    c.stroke();
    line(
      c,
      [
        [22, -7],
        [22, 23],
      ],
      color,
      4,
    );
    line(
      c,
      [
        [13, 7],
        [31, 7],
      ],
      color,
      4,
    );
    rect(c, -32, -6, 13, 27, 5, '#657d86', '#abbcc1');
  }
  if (flash > 0) {
    glow(c, 43, 6, 20 + flash * 10, color + 'b0');
  }
  c.restore();
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
) {
  c.save();
  c.translate(x, y);
  c.scale(size / 80, size / 80);
  const color = slow ? '#8cdaff' : ENEMIES[kind].color;
  const stride = Math.sin(t * (kind === 'runner' ? 13 : 6));
  ellipse(c, 0, 30, 29, 9, '#03081188');
  for (const side of [-1, 1]) {
    line(
      c,
      [
        [side * 13, 10],
        [side * 28, 22 + stride * side * 3],
        [side * 31, 33],
      ],
      '#4f3c60',
      7,
    );
    line(
      c,
      [
        [side * 16, 5],
        [side * 36, 14 - stride * side * 4],
        [side * 39, 25],
      ],
      color,
      4,
    );
  }
  c.translate(0, Math.sin(t * 4) * 2);
  const g = c.createLinearGradient(-25, -35, 25, 24);
  g.addColorStop(0, '#e0bbe9');
  g.addColorStop(0.32, color);
  g.addColorStop(1, '#433053');
  ellipse(c, 0, 0, kind === 'runner' ? 19 : 26, 28, g as unknown as string);
  c.beginPath();
  c.moveTo(-22, -12);
  c.quadraticCurveTo(-38, -41, -19, -36);
  c.lineTo(-10, -21);
  c.moveTo(11, -22);
  c.quadraticCurveTo(28, -49, 28, -27);
  c.lineTo(22, -8);
  c.fillStyle = color;
  c.fill();
  ellipse(c, -5, -9, 19, 11, '#261e38');
  c.shadowColor = '#e5ff9e';
  c.shadowBlur = 9;
  ellipse(c, -13, -10, 5, 5, '#ddfa9b');
  ellipse(c, 3, -10, 5, 5, '#ddfa9b');
  c.shadowBlur = 0;
  ellipse(c, -14, -10, 1.5, 4, '#172634');
  ellipse(c, 2, -10, 1.5, 4, '#172634');
  line(
    c,
    [
      [-11, 9],
      [-3, 13],
      [5, 8],
    ],
    '#30203e',
    3,
  );
  for (let i = 0; i < 3; i++) ellipse(c, 12 + (i % 2) * 5, i * 8 - 2, 2, 2, '#e9c5ec66');
  if (kind === 'brute' || kind === 'overlord') {
    c.beginPath();
    c.moveTo(-25, -16);
    c.lineTo(-16, -38);
    c.lineTo(12, -40);
    c.lineTo(28, -21);
    c.lineTo(21, -14);
    c.lineTo(2, -25);
    c.closePath();
    c.fillStyle = '#5e5278';
    c.fill();
    c.strokeStyle = '#b8a6c7';
    c.lineWidth = 2;
    c.stroke();
    for (const side of [-1, 1]) rect(c, side * 25 - 7, 0, 15, 20, 5, '#655775', '#a99ab8');
  }
  if (kind === 'spitter') {
    ellipse(c, -15, 9, 14, 10, '#325b4e');
    ellipse(c, -24, 8, 7, 7, '#a9efd0');
    glow(c, -23, 8, 14, '#a9efd080');
  }
  if (kind === 'overlord') {
    for (const dx of [-15, 0, 15]) {
      c.beginPath();
      c.moveTo(dx - 7, -33);
      c.lineTo(dx, -54 + Math.abs(dx) * 0.4);
      c.lineTo(dx + 7, -33);
      c.fillStyle = '#f5a0c4';
      c.fill();
    }
    glow(c, 0, 0, 45, '#fc629a20');
  }
  if (slow) {
    c.strokeStyle = '#a9efff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 34, 0, Math.PI * 2);
    c.stroke();
  }
  if (flash > 0) {
    c.globalCompositeOperation = 'screen';
    glow(c, 0, 0, 37, '#ffffff80');
  }
  c.restore();
}

export function botIcon(kind: BotKind) {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 150;
  drawBot(canvas.getContext('2d')!, kind, 86, 85, 128);
  return canvas.toDataURL();
}

export class Renderer {
  private c: Ctx;
  private background: HTMLCanvasElement;
  hover: { row: number; col: number } | null = null;
  selection: BotKind | 'recycle' | 'beam' = 'pulse';
  reducedMotion = false;
  constructor(public canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d')!;
    this.background = document.createElement('canvas');
    this.background.width = BOARD.width;
    this.background.height = BOARD.height;
    this.drawBackground(this.background.getContext('2d')!);
  }
  private drawBackground(c: Ctx) {
    const sky = c.createLinearGradient(0, 0, 0, 700);
    sky.addColorStop(0, '#0b1923');
    sky.addColorStop(0.45, '#183a3b');
    sky.addColorStop(1, '#0e1f26');
    c.fillStyle = sky;
    c.fillRect(0, 0, 1200, 700);
    glow(c, 900, 80, 450, '#779b9130');
    for (let i = 0; i < 100; i++) {
      const x = (i * 197.7) % 1200;
      const y = (i * 73.3) % 210;
      ellipse(c, x, y, i % 5 ? 0.7 : 1.4, i % 5 ? 0.7 : 1.4, '#b7d8cf70');
    }
    ellipse(c, 941, 77, 42, 42, '#adc2ac');
    ellipse(c, 929, 67, 7, 9, '#99ae9c');
    ellipse(c, 951, 88, 12, 10, '#99ae9c');
    ellipse(c, 947, 52, 5, 4, '#c9d3bd');
    c.beginPath();
    c.moveTo(0, 170);
    for (let i = 0; i <= 12; i++) c.lineTo(i * 100, 110 + Math.sin(i * 4.2) * 30);
    c.lineTo(1200, 260);
    c.lineTo(0, 260);
    c.fillStyle = '#1c333b';
    c.fill();
    c.beginPath();
    c.moveTo(0, 212);
    for (let i = 0; i <= 20; i++) c.lineTo(i * 60, 160 + Math.sin(i * 1.6) * 25);
    c.lineTo(1200, 310);
    c.lineTo(0, 310);
    c.fillStyle = '#152d32';
    c.fill();
    // A sunken, carefully illuminated defense platform.
    rect(c, 141, 164, 932, 433, 12, '#060f19', '#415952');
    rect(c, 144, 160, 926, 427, 9, '#243c3c', '#527067');
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++) {
        const x = BOARD.x + col * BOARD.cw;
        const y = BOARD.y + row * BOARD.ch;
        const tile = c.createLinearGradient(x, y, x, y + 80);
        tile.addColorStop(0, (row + col) % 2 ? '#2c4643' : '#304b46');
        tile.addColorStop(1, '#243a39');
        rect(c, x + 2, y + 2, 96, 78, 4, tile as unknown as string, '#45605370');
        line(
          c,
          [
            [x + 10, y + 13],
            [x + 10, y + 8],
            [x + 15, y + 8],
          ],
          '#6d8a6550',
          1,
        );
        line(
          c,
          [
            [x + 90, y + 67],
            [x + 90, y + 73],
            [x + 85, y + 73],
          ],
          '#6d8a6550',
          1,
        );
        ellipse(c, x + 50, y + 41, 2, 2, '#88a17b22');
      }
    for (let i = 0; i < 9; i++) {
      rect(c, 175 + i * 100, 590, 58, 3, 1, i % 3 ? '#547062' : '#b3d38b');
    }
    // Outpost architecture and lane guides.
    rect(c, 31, 180, 66, 390, 8, '#142631', '#45616b');
    rect(c, 39, 194, 49, 365, 5, '#1e3541');
    for (let row = 0; row < 5; row++) {
      rect(c, 42, 199 + row * 74, 42, 50, 5, '#0b1a25', '#405662');
      rect(c, 50, 207 + row * 74, 5, 34, 2, '#97d8bd');
      line(
        c,
        [
          [95, 211 + row * 82],
          [132, 211 + row * 82],
        ],
        '#5e7c6980',
        2,
      );
    }
    c.save();
    c.translate(60, 151);
    c.rotate(-Math.PI / 2);
    c.fillStyle = '#7faaa3';
    c.font = '10px monospace';
    c.fillText('OUTPOST 07', -8, 0);
    c.restore();
    // Alien growth around the landing zone.
    for (let i = 0; i < 46; i++) {
      const x = (i * 193.3 + 43) % 1200;
      const y = i % 3 === 0 ? 140 - (i % 30) : 620 + ((i * 17) % 70);
      const h = 8 + (i % 18);
      line(
        c,
        [
          [x, y],
          [x - 4, y - h],
          [x - 12, y - h - 4],
        ],
        '#426356',
        3,
      );
      line(
        c,
        [
          [x, y],
          [x + 5, y - h * 0.8],
          [x + 11, y - h],
        ],
        '#5f7b5d',
        2,
      );
      if (i % 4 === 0) {
        ellipse(c, x - 11, y - h - 5, 5, 3, '#97b680');
        glow(c, x - 11, y - h - 5, 13, '#b8e69c22');
      }
    }
    for (const [x, y, s] of [
      [1120, 610, 22],
      [108, 638, 16],
      [1030, 100, 12],
      [260, 650, 11],
      [1120, 160, 16],
    ]) {
      c.beginPath();
      c.moveTo(x - s, y);
      c.lineTo(x - s / 2, y - s);
      c.lineTo(x + s / 2, y - s * 1.2);
      c.lineTo(x + s, y - s / 3);
      c.lineTo(x + s * 0.7, y + 3);
      c.closePath();
      c.fillStyle = '#3e5452';
      c.fill();
      line(
        c,
        [
          [x - s / 2, y - s],
          [x, y - s / 2],
          [x + s, y - s / 3],
        ],
        '#60746a',
        1,
      );
    }
    c.fillStyle = '#a9bfa27a';
    c.font = '10px monospace';
    c.fillText('SEC. 07 / PERIMETER DEFENSE', 156, 638);
    c.fillText('EAST →', 1013, 638);
  }
  draw(game: Game, menu = false) {
    const c = this.c;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(this.canvas.clientWidth * dpr);
    const height = Math.round((width * 700) / 1200);
    if (width > 0 && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    c.setTransform(this.canvas.width / 1200, 0, 0, this.canvas.height / 700, 0, 0);
    c.clearRect(0, 0, 1200, 700);
    c.drawImage(this.background, 0, 0);
    const t = this.reducedMotion ? 0 : game.time;
    const portalY = 375;
    glow(c, 1130, portalY, 110, '#d57fea28');
    c.save();
    c.translate(1130, portalY);
    c.strokeStyle = '#ce96f65a';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, 0, 32 + Math.sin(t * 2) * 2, 155, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#e8b4ff70';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, 0, 21, 138 + Math.sin(t) * 6, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    for (let row = 0; row < ROWS; row++)
      if (game.sweepers[row]) {
        rect(c, 114, BOARD.y + row * 82 + 31, 23, 24, 5, '#344f58', '#6c8b84');
        rect(c, 119, BOARD.y + row * 82 + 37, 13, 5, 2, '#b2ef9b');
      }
    if (this.hover && !menu && game.phase === 'playing') {
      const { row, col } = this.hover;
      const x = BOARD.x + col * 100;
      const y = BOARD.y + row * 82;
      if (this.selection === 'beam') {
        rect(c, BOARD.x, y, 900, 82, 4, '#8feaff22', '#8feaff');
      } else {
        const valid = !game.bots.some((b) => b.row === row && b.col === col);
        const color =
          this.selection === 'recycle'
            ? '#ff9378'
            : valid && game.energy >= BOTS[this.selection].cost
              ? '#bcf78a'
              : '#ff8181';
        rect(c, x + 2, y + 2, 96, 78, 4, color + '20', color);
        if (valid && this.selection !== 'recycle') {
          c.globalAlpha = 0.5;
          drawBot(c, this.selection, x + 50, y + 42, 65, t);
          c.globalAlpha = 1;
        }
      }
    }
    for (let row = 0; row < ROWS; row++) {
      for (const b of game.bots.filter((b) => b.row === row)) {
        const x = BOARD.x + (b.col + 0.5) * 100;
        const y = BOARD.y + (row + 0.5) * 82;
        drawBot(c, b.kind, x, y, 71, t + b.id, b.flash);
        if (b.hp < BOTS[b.kind].hp) this.health(x, y + 35, b.hp / BOTS[b.kind].hp, '#a8f570');
        if (b.kind === 'spark') {
          c.fillStyle = '#ffcc6660';
          c.fillRect(x - 19, y + 37, 38 * (1 - b.timer / 8), 2);
        }
      }
      for (const e of game.enemies.filter((e) => e.row === row)) {
        const x = BOARD.x + e.x * 100;
        const y = BOARD.y + (row + 0.5) * 82;
        drawAlien(
          c,
          e.kind,
          x,
          y,
          e.kind === 'overlord' ? 95 : e.kind === 'brute' ? 78 : e.kind === 'runner' ? 58 : 65,
          t + e.id,
          e.flash,
          e.slow > 0,
        );
        if (e.hp < e.maxHp || e.kind === 'overlord')
          this.health(x, y - (e.kind === 'overlord' ? 64 : 39), e.hp / e.maxHp, '#dc9cea');
      }
    }
    for (const shot of game.shots) {
      const x = BOARD.x + shot.x * 100;
      const y = BOARD.y + (shot.row + 0.5) * 82 + 3;
      const color = shot.kind === 'acid' ? '#9ae8aa' : BOTS[shot.kind].color;
      glow(c, x, y, 17, color + '70');
      line(
        c,
        [
          [x - Math.sign(shot.speed) * 18, y],
          [x, y],
        ],
        color,
        shot.kind === 'nova' ? 9 : 4,
      );
      ellipse(c, x, y, 4, 4, '#f3fff3');
    }
    for (const s of game.sweeps) {
      const x = BOARD.x + s.x * 100;
      const y = BOARD.y + (s.row + 0.5) * 82;
      glow(c, x, y, 70, '#bfff8a70');
      rect(c, x - 28, y - 20, 54, 40, 8, '#719283', '#dcffb8');
      line(
        c,
        [
          [x, y - 27],
          [x, y + 27],
        ],
        '#e2ffb5',
        5,
      );
    }
    for (const p of game.pickups) {
      const x = BOARD.x + p.x * 100;
      const y = BOARD.y + (p.row + 0.5) * 82 + Math.sin(t * 3) * 4;
      c.globalAlpha = p.life < 3 ? 0.6 + Math.sin(t * 12) * 0.3 : 1;
      glow(c, x, y, 36, '#ffcf6540');
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI / 4);
      rect(c, -13, -13, 26, 26, 5, '#4c4230', '#ffd47e');
      c.restore();
      line(
        c,
        [
          [x + 2, y - 10],
          [x - 5, y + 1],
          [x + 4, y + 1],
          [x - 2, y + 11],
        ],
        '#ffe4a1',
        3,
      );
      c.globalAlpha = 1;
    }
    if (!this.reducedMotion)
      for (const p of game.particles) {
        c.globalAlpha = Math.max(0, p.life / p.max);
        ellipse(c, BOARD.x + p.x * 100, BOARD.y + p.y * 82, p.size, p.size, p.color);
      }
    c.globalAlpha = 1;
    if (menu) {
      const shade = c.createLinearGradient(0, 0, 900, 0);
      shade.addColorStop(0, '#071019f8');
      shade.addColorStop(0.48, '#071019e0');
      shade.addColorStop(1, '#07101900');
      c.fillStyle = shade;
      c.fillRect(0, 0, 1200, 700);
      glow(c, 810, 408, 220, '#d6ff9a20');
      drawAlien(c, 'brute', 1016, 329, 124, t);
      drawAlien(c, 'scout', 1083, 479, 100, t + 2);
      drawBot(c, 'bastion', 891, 483, 160, t + 1);
      drawBot(c, 'spark', 660, 479, 133, t + 3);
      drawBot(c, 'pulse', 767, 408, 185, t);
      c.fillStyle = '#c5e7bd';
      c.font = '11px monospace';
      c.fillText('SQUAD 07 / SYSTEMS ONLINE', 670, 600);
      line(
        c,
        [
          [670, 612],
          [969, 612],
        ],
        '#b6e59a40',
        1,
      );
    }
    if (!this.reducedMotion)
      for (let i = 0; i < 16; i++) {
        const x = (i * 179 + t * (2 + (i % 3))) % 1200;
        const y = 130 + ((i * 83) % 530) + Math.sin(t + i) * 10;
        ellipse(c, x, y, 1.5, 1.5, i % 2 ? '#d6b9ff60' : '#caffb660');
      }
  }
  private health(x: number, y: number, value: number, color: string) {
    rect(this.c, x - 23, y, 46, 4, 2, '#061019');
    rect(this.c, x - 23, y, 46 * Math.max(0, value), 4, 2, color);
  }
}
