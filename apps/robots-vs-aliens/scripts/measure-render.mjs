import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// An optional source directory lets the same fixture measure an earlier renderer.
const root = resolve(process.argv[2] || '.');
const alternate = process.argv[3] === 'alternate';
const server = await createServer({
  root,
  configFile: false,
  cacheDir: join(tmpdir(), 'rva-render-vite'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false },
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  const page = await browser.newPage({
    viewport: { width: 800, height: 500 },
    deviceScaleFactor: 2,
  });
  await page.route('**/measure.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<canvas style="width:720px;height:420px"></canvas>',
    }),
  );
  await page.goto(server.resolvedUrls.local[0] + 'measure.html');
  await page.evaluate(async (alternate) => {
    const { BOTS, ENEMIES, Game } = await import('/src/game/engine.ts');
    const { Renderer } = await import('/src/game/render.ts');
    const renderer = new Renderer(document.querySelector('canvas'));
    renderer.robotSkin = alternate ? 'foundry' : 'standard';
    renderer.alienSkin = alternate ? 'riftborn' : 'standard';
    renderer.prepareBattle?.(); // The 1.4.0 baseline loads its art on first draw.
    const game = new Game(4, false, 1254);
    game.energy = 10000;
    const robots = Object.keys(BOTS);
    const aliens = Object.keys(ENEMIES);
    for (let i = 0; i < 30; i++) {
      const row = i % 5;
      game.place(robots[(i + Math.floor(i / 5)) % 5], row, Math.floor(i / 5));
      game.spawn(aliens[(row + Math.floor(i / 5)) % 5], row, 5.5 + (i % 6) * 0.56);
    }
    game.particles.length = 0;
    for (let i = 0; i < 15; i++) game.burst(5 + game.random() * 3, (i % 5) + 0.5, '#e7d9ae', 8);
    for (let i = 0; i < 20; i++) {
      game.shots.push({
        id: i,
        kind: ['pulse', 'frost', 'nova', 'acid'][i % 4],
        row: i % 5,
        x: 3 + (i % 7) * 0.68,
        speed: i % 4 === 3 ? -3 : 6,
        damage: 1,
      });
    }
    const starts = game.enemies.map((enemy) => enemy.x);
    window.drawSample = (i) => {
      game.time = i / 60;
      for (let n = 0; n < game.enemies.length; n++) {
        const enemy = game.enemies[n];
        // Half the field walks and half attacks a fixed position.
        if (n % 2 === 0) enemy.x = starts[n] - (i % 120) * 0.003;
        const cooldownSteps = enemy.kind === 'spitter' ? 108 : 54;
        enemy.timer = (cooldownSteps - ((n + i) % cooldownSteps)) / 60;
      }
      for (const bot of game.bots) {
        const rate = BOTS[bot.kind].rate;
        bot.timer = rate - ((i + bot.id * 7) % 60) / 60;
        bot.flash = Math.max(0, 0.18 - (rate - bot.timer));
      }
      renderer.draw(game);
    };
    window.drawSample(0);
    window.checkReplay = () => {
      if (!renderer.prepareBattle) return '1.4.0 baseline';
      // Re-run the same contact for 20 simulated seconds, including queued enemies and shots.
      function replay(robotSkin, alienSkin, speed) {
        renderer.robotSkin = robotSkin;
        renderer.alienSkin = alienSkin;
        const battle = new Game(4, false, 1154, 'veteran');
        battle.place('pulse', 2, 1);
        battle.place('frost', 3, 0);
        battle.place('spark', 0, 0);
        battle.startWave();
        battle.spawn('runner', 2, 4.5);
        battle.spawn('spitter', 3, 5);
        for (let frame = 0; frame < 1200 / speed; frame++) {
          for (let step = 0; step < speed; step++) battle.update(1 / 60);
          if (frame % 6 === 0) renderer.draw(battle);
        }
        return JSON.stringify(battle);
      }
      if (replay('standard', 'standard', 1) !== replay('foundry', 'riftborn', 2))
        throw Error('Cosmetic replay diverged');
      return 'identical after 1200 fixed steps';
    };
  }, alternate);
  await page.waitForLoadState('networkidle');
  const result = await page.evaluate(async () => {
    const intervals = [];
    const costs = [];
    let previous;
    for (let i = 0; i <= 420; i++) {
      const now = await new Promise(requestAnimationFrame);
      const start = performance.now();
      window.drawSample(i);
      if (i > 60) {
        intervals.push(now - previous);
        costs.push(performance.now() - start);
      }
      previous = now;
    }
    const percentile = (series, q) =>
      series.toSorted((a, b) => a - b)[Math.ceil(series.length * q) - 1];
    return {
      samples: intervals.length,
      callbacksPerSecond: (1000 * intervals.length) / intervals.reduce((a, b) => a + b),
      p95IntervalMs: percentile(intervals, 0.95),
      p95DrawSubmissionMs: percentile(costs, 0.95),
    };
  });
  console.log(
    JSON.stringify(
      {
        chromium: browser.version(),
        alternate,
        ...result,
        replay: await page.evaluate(() => window.checkReplay()),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await server.close();
}
