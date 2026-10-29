import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/space-mono/latin-400.css';
import './style.css';
import { BOTS, Game, SECTORS, type BotKind } from './game/engine';
import { BOARD, Renderer, botIcon } from './game/render';
import { AudioEngine } from './game/audio';
import { loadSave, storeSave } from './game/storage';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const icons = {
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  target: '<circle cx="12" cy="12" r="7"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/>',
  recycle: '<path d="m8 3-5 7h5M3 10h7m10 4-4 7-4-3m4 3 3-5M9 19H3v-7m0 7 5-5M16 3h5v7m0-7-5 5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  book: '<path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1zm0 0v15"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
const icon = (name: keyof typeof icons) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${icons[name]}</svg>`;
const kinds = Object.keys(BOTS) as BotKind[];
const save = loadSave();
const audio = new AudioEngine();
audio.muted = save.muted;
let game = new Game();
let menu = true;
let sector = 0;
let selected: BotKind | 'beam' | 'recycle' = 'pulse';
let speed = 1;
let last = 0;
let accumulator = 0;
let toastTimer = 0;
let previousPhase = game.phase;
let hudClock = 0;
let returnFocus: HTMLElement | null = null;
let resumeAfterDialog = false;

$('#app').innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="Robots vs Aliens home"><img src="./icon.svg" alt=""/><span>ROBOTS <span class="brand-vs">vs</span> ALIENS<small>LAST OUTPOST</small></span></a>
    <nav aria-label="Game tools"><span class="connection"><i></i> ALL SYSTEMS ONLINE</span><button class="quiet" id="guide-button" aria-label="Field guide">${icon('book')}<span>Field guide</span></button><button class="icon-button" id="sound-button" aria-label="Toggle sound" aria-pressed="${!save.muted}">${icon('sound')}</button><button class="icon-button settings-button" id="settings-button" aria-label="Settings">⚙</button></nav>
  </header>
  <main>
    <section class="heading"><div><div class="eyebrow"><span class="tiny-square"></span> OUTPOST DEFENSE PROGRAM <span class="slash">/</span> VOL. 01</div><h1>The last outpost<span>.</span></h1><p>A little metal. A lot of courage. An entire planet to defend.</p></div><div class="record"><span>PERSONAL BEST</span><strong id="best-score">${save.best.toLocaleString()}</strong><small>COMMANDER RECORD</small></div></section>
    <section class="console" aria-label="Defense console">
      <div class="console-top"><div class="sector-status"><span class="live-dot"></span><span id="sector-label">SECTOR 01</span><span class="separator">/</span><span id="mission-label">FIRST CONTACT</span></div><div class="console-tags"><span>KEPLER-186F</span><span class="weather">◌ &nbsp; 18°C</span></div></div>
      <div class="console-body">
        <div class="battle-column">
          <div class="hud"><div class="energy-stat">${icon('bolt')}<strong id="energy">325</strong><span>ENERGY</span></div><div class="integrity">${icon('shield')}<div><span>CORE INTEGRITY</span><div id="hearts" aria-label="5 core integrity">${'<i></i>'.repeat(5)}</div></div></div><div class="wave-stat"><span id="wave-label">PREPARE YOUR SQUAD</span><strong id="wave-count">00 <small>/ 04</small></strong></div><button class="icon-button" id="pause-button" aria-label="Pause game" disabled>${icon('pause')}</button></div>
          <div class="arena" id="arena">
            <canvas id="battlefield" aria-label="Animated alien landscape and tactical battlefield"></canvas>
            <div id="battle-grid" class="battle-grid" role="group" aria-label="Battlefield: 5 lanes and 9 columns" hidden>${Array.from({ length: 45 }, (_, i) => `<button class="cell" data-row="${Math.floor(i / 9)}" data-col="${i % 9}" aria-label="Lane ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}, empty" tabindex="${i === 0 ? 0 : -1}"></button>`).join('')}</div>
            <div class="menu-cover" id="menu-cover"><div class="mission-chip"><i></i> INCOMING TRANSMISSION</div><h2>HOLD<br>THE <em>LINE.</em></h2><p>The aliens have arrived.<br>Build your squad. Protect our last light.</p><button class="primary" id="start-button">Deploy squad ${icon('arrow')}</button><div class="menu-meta"><span>5 ROBOTS</span><b>·</b><span>5 SECTORS</span><b>·</b><span>ONE LAST STAND</span></div></div>
            <div class="arena-caption"><span><i></i> LIVE FEED <b>07</b></span><span id="arena-instruction">YOUR PLANET. YOUR LAST LINE OF DEFENSE.</span><span class="corners">⌜ ⌝</span></div>
            <div class="toast" id="toast" role="status" aria-live="polite"></div>
            <div class="wave-banner" id="wave-banner" aria-hidden="true"></div>
          </div>
          <div class="battle-toolbar"><div class="tactical-status"><span class="pulse-dot"></span><span id="tactical-status">Awaiting your command</span></div><div class="battle-actions"><button id="collect-button" class="tool-button" disabled>${icon('bolt')} Collect <span id="pickup-count">0</span></button><button id="speed-button" class="tool-button" aria-label="Toggle double speed" aria-pressed="false">1×</button><button id="wave-button" class="tool-button next-wave" disabled>Send wave ${icon('arrow')}</button></div></div>
        </div>
        <aside class="deck"><div class="deck-heading"><div><span class="eyebrow">YOUR LOADOUT</span><h2>Meet the squad</h2></div><span class="count">05</span></div><div class="bot-cards">${kinds.map((kind, i) => `<button class="bot-card ${i === 0 ? 'selected' : ''}" data-bot="${kind}" aria-pressed="${i === 0}" aria-label="Select ${BOTS[kind].name}, ${BOTS[kind].cost} energy. ${BOTS[kind].description}" style="--bot-color:${BOTS[kind].color}"><span class="keycap">${i + 1}</span><img src="${botIcon(kind)}" alt=""/><span class="bot-details"><strong>${BOTS[kind].name}</strong><small>${BOTS[kind].role}</small></span><span class="bot-cost">${icon('bolt')}${BOTS[kind].cost}</span></button>`).join('')}</div><div class="loadout-tip"><span id="selected-name">PULSE / BLASTER</span><p id="selected-description">${BOTS.pulse.description}</p></div><div class="abilities"><button id="beam-button" class="ability" aria-label="Select orbital strike, then select a lane" aria-pressed="false">${icon('target')}<span>Orbital strike<small id="beam-status">READY · Q</small></span></button><button id="recycle-button" class="recycle-button" aria-label="Recycle a robot for up to 50 percent energy" aria-pressed="false">${icon('recycle')}<span>R</span></button></div></aside>
      </div>
      <div class="campaign"><div class="campaign-label"><span class="eyebrow">THE CAMPAIGN</span><strong>One planet. Five fronts.</strong></div><div class="sectors" id="sectors">${SECTORS.map((s, i) => `<button class="sector ${i === 0 ? 'active' : ''}" data-sector="${i}" ${i > save.unlocked ? 'disabled' : ''} aria-label="Sector ${i + 1}: ${s.name}${i > save.unlocked ? ', locked' : ''}"><span>0${i + 1}</span><div><strong>${s.name}</strong><small>${i > save.unlocked ? 'LOCKED' : save.stars[i] ? '★'.repeat(save.stars[i]) : i === 0 ? 'START HERE' : 'AVAILABLE'}</small></div>${i > save.unlocked ? '<b>⌑</b>' : '<b>↗</b>'}</button>`).join('')}</div></div>
    </section>
    <footer><span><span class="footer-mark">✳</span> BUILT FOR THE LAST LINE OF DEFENSE.</span><span>SELECT A ROBOT <b>→</b> TAP A TILE <b>→</b> HOLD THE LINE</span><button class="text-button" id="endless-button">Survival mode ↗</button></footer>
  </main>
  <div id="modal-backdrop" class="modal-backdrop" hidden><section id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"></section></div>
`;
const renderer = new Renderer($('#battlefield'));
renderer.reducedMotion =
  save.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
const demo = new Game(0, false, 7);
demo.place('pulse', 0, 5);
demo.place('frost', 1, 4);
demo.place('nova', 3, 4);
demo.energy = 1000;
demo.place('pulse', 4, 6);
demo.spawn('scout', 0, 8.1);
demo.spawn('runner', 2, 8.5);
demo.spawn('scout', 4, 8.1);
demo.drainEvents();

function toast(message: string) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = 3;
}
function persist() {
  if (!storeSave(save)) toast('Storage is unavailable. Progress will last for this session.');
  $('#best-score').textContent = save.best.toLocaleString();
}
function select(choice: typeof selected) {
  selected = choice;
  renderer.selection = choice;
  document.querySelectorAll<HTMLButtonElement>('[data-bot]').forEach((b) => {
    b.classList.toggle('selected', b.dataset.bot === choice);
    b.setAttribute('aria-pressed', String(b.dataset.bot === choice));
  });
  $('#beam-button').setAttribute('aria-pressed', String(choice === 'beam'));
  $('#recycle-button').setAttribute('aria-pressed', String(choice === 'recycle'));
  $('#selected-name').textContent =
    choice === 'beam'
      ? 'ORBITAL STRIKE / 42s RECHARGE'
      : choice === 'recycle'
        ? 'RECYCLE / SALVAGE'
        : `${BOTS[choice].name.toUpperCase()} / ${BOTS[choice].role}`;
  $('#selected-description').textContent =
    choice === 'beam'
      ? 'Select a lane to deal 320 damage to every alien in it.'
      : choice === 'recycle'
        ? 'Select a robot to recover up to 50% of its cost, based on health.'
        : BOTS[choice].description;
  $('#arena-instruction').textContent =
    choice === 'beam'
      ? 'SELECT A LANE FOR ORBITAL STRIKE'
      : choice === 'recycle'
        ? 'SELECT A ROBOT TO RECYCLE'
        : `SELECT AN EMPTY TILE TO DEPLOY ${BOTS[choice].name.toUpperCase()}`;
}
function setSector(i: number) {
  sector = i;
  $('#sector-label').textContent = `SECTOR 0${i + 1}`;
  $('#mission-label').textContent = SECTORS[i].name.toUpperCase();
  document
    .querySelectorAll<HTMLElement>('[data-sector]')
    .forEach((b) => b.classList.toggle('active', Number(b.dataset.sector) === i));
}
function updateSectors() {
  document.querySelectorAll<HTMLButtonElement>('[data-sector]').forEach((b) => {
    const i = Number(b.dataset.sector);
    b.disabled = i > save.unlocked || !menu;
    b.querySelector('small')!.textContent =
      i > save.unlocked ? 'LOCKED' : save.stars[i] ? '★'.repeat(save.stars[i]) : 'AVAILABLE';
    b.querySelector('b')!.textContent = i > save.unlocked ? '⌑' : '↗';
    b.setAttribute(
      'aria-label',
      `Sector ${i + 1}: ${SECTORS[i].name}${i > save.unlocked ? ', locked' : ''}`,
    );
  });
}
function start(endless = false) {
  audio.unlock();
  closeModal(false);
  game = new Game(sector, endless);
  menu = false;
  previousPhase = 'playing';
  speed = 1;
  accumulator = 0;
  $('#menu-cover').hidden = true;
  $('#battle-grid').hidden = false;
  $('#pause-button').removeAttribute('disabled');
  $('#endless-button').setAttribute('disabled', '');
  $('#speed-button').textContent = '1×';
  $('#speed-button').setAttribute('aria-pressed', 'false');
  select('pulse');
  updateSectors();
  updateHud();
  toast('Deploy Pulse in each lane. Spark generates energy. Collect gold energy cells!');
  $('#arena').classList.add('is-playing');
  $('.cell').focus({ preventScroll: true });
}
function mainMenu() {
  closeModal(false);
  menu = true;
  game.phase = 'paused';
  $('#menu-cover').hidden = false;
  $('#battle-grid').hidden = true;
  $('#pause-button').setAttribute('disabled', '');
  $('#endless-button').removeAttribute('disabled');
  $('#arena').classList.remove('is-playing');
  updateSectors();
  updateHud();
  $('#start-button').focus();
}
function updateHud() {
  $('#energy').textContent = String(menu ? 325 : Math.floor(game.energy));
  $('#wave-label').textContent = menu
    ? 'PREPARE YOUR SQUAD'
    : game.endless
      ? 'SURVIVAL MODE'
      : game.waveActive
        ? 'INCOMING HOSTILES'
        : 'DEPLOYMENT WINDOW';
  $('#wave-count').innerHTML =
    `${String(menu ? 0 : game.wave).padStart(2, '0')} <small>/ ${game.endless && !menu ? '∞' : String(SECTORS[sector].waves).padStart(2, '0')}</small>`;
  const hearts = $('#hearts');
  hearts.setAttribute('aria-label', `${game.lives} core integrity`);
  [...hearts.children].forEach((h, i) => h.classList.toggle('empty', !menu && i >= game.lives));
  const waveButton = $<HTMLButtonElement>('#wave-button');
  waveButton.disabled = menu || game.phase !== 'playing' || game.waveActive;
  waveButton.innerHTML =
    !menu && !game.waveActive
      ? `Send wave · ${Math.ceil(game.intermission)}s ${icon('arrow')}`
      : `Send wave ${icon('arrow')}`;
  $('#tactical-status').textContent = menu
    ? 'Awaiting your command'
    : game.phase === 'paused'
      ? 'Simulation paused'
      : game.waveActive
        ? `${game.enemies.length} hostiles detected · ${game.score.toLocaleString()} points`
        : `Wave ${game.wave + 1} incoming · +75 energy between waves`;
  $('#beam-status').textContent =
    game.beamCooldown > 0 && !menu ? `${Math.ceil(game.beamCooldown)}s RECHARGING` : 'READY · Q';
  $<HTMLButtonElement>('#beam-button').disabled = !menu && game.beamCooldown > 0;
  $('#pickup-count').textContent = String(game.pickups.length);
  $<HTMLButtonElement>('#collect-button').disabled =
    menu || game.phase !== 'playing' || !game.pickups.length;
  document
    .querySelectorAll<HTMLElement>('[data-bot]')
    .forEach((b) =>
      b.classList.toggle(
        'unaffordable',
        !menu && BOTS[b.dataset.bot as BotKind].cost > game.energy,
      ),
    );
  document.querySelectorAll<HTMLButtonElement>('.cell').forEach((b) => {
    const row = Number(b.dataset.row),
      col = Number(b.dataset.col);
    const bot = game.bots.find((b) => b.row === row && b.col === col);
    b.setAttribute(
      'aria-label',
      `Lane ${row + 1}, column ${col + 1}, ${bot ? `${BOTS[bot.kind].name}, ${Math.ceil(bot.hp)} health` : 'empty'}`,
    );
  });
}
function openModal(title: string, contents: string) {
  returnFocus = document.activeElement as HTMLElement;
  resumeAfterDialog = !menu && game.phase === 'playing';
  if (resumeAfterDialog) game.phase = 'paused';
  $('#modal').innerHTML =
    `<button class="modal-close icon-button" aria-label="Close dialog">${icon('close')}</button><div class="eyebrow">OUTPOST COMMAND</div><h2 id="modal-title">${title}</h2>${contents}`;
  $('#modal-backdrop').hidden = false;
  $('#modal').focus();
  $('.modal-close').onclick = () => closeModal();
  updateHud();
}
function closeModal(resume = true) {
  $('#modal-backdrop').hidden = true;
  if (resume && resumeAfterDialog && game.phase === 'paused') game.phase = 'playing';
  resumeAfterDialog = false;
  returnFocus?.focus({ preventScroll: true });
}
function pause() {
  if (menu || game.phase === 'won' || game.phase === 'lost') return;
  if (!$('#modal-backdrop').hidden) {
    closeModal();
    return;
  }
  openModal(
    'Take a breather.',
    `<p>The outpost can wait. Your squad is standing by.</p><div class="modal-actions"><button class="primary" id="resume-button">Resume mission ${icon('arrow')}</button><button class="secondary" id="restart-button">Restart sector</button><button class="text-button" id="quit-button">Return to command</button></div>`,
  );
  $('#resume-button').onclick = () => closeModal();
  $('#restart-button').onclick = () => start(game.endless);
  $('#quit-button').onclick = mainMenu;
}
function finish() {
  const won = game.phase === 'won';
  const stars = game.lives >= 5 ? 3 : game.lives >= 3 ? 2 : 1;
  save.best = Math.max(save.best, game.score);
  if (won && !game.endless) {
    save.stars[sector] = Math.max(save.stars[sector], stars);
    save.unlocked = Math.min(4, Math.max(save.unlocked, sector + 1));
  }
  persist();
  openModal(
    won ? 'The line holds.' : 'A brave last stand.',
    `<div class="result-emblem">${won ? '✦' : '⌁'}</div><p>${won ? 'The outpost is safe. Your squad made the difference.' : 'The core has fallen. Rebuild your strategy and reclaim the outpost.'}</p>${won ? `<div class="stars" aria-label="${stars} out of 3 stars">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>` : ''}<div class="result-stats"><div><strong>${game.score.toLocaleString()}</strong><span>SCORE</span></div><div><strong>${game.kills}</strong><span>ALIENS STOPPED</span></div><div><strong>${Math.floor(game.time / 60)}:${String(Math.floor(game.time % 60)).padStart(2, '0')}</strong><span>TIME HELD</span></div></div><div class="modal-actions">${won && sector < 4 ? '<button class="primary" id="next-sector">Deploy to next sector →</button>' : ''}<button class="${won && sector < 4 ? 'secondary' : 'primary'}" id="retry-button">${won ? 'Play again' : 'Try again'}</button><button class="text-button" id="quit-button">Return to command</button></div>`,
  );
  $('#retry-button').onclick = () => start(game.endless);
  $('#quit-button').onclick = mainMenu;
  const next = document.querySelector<HTMLElement>('#next-sector');
  if (next)
    next.onclick = () => {
      setSector(sector + 1);
      start();
    };
  $('.modal-close').onclick = mainMenu;
}

$('#start-button').onclick = () => start();
$('#endless-button').onclick = () => {
  setSector(0);
  start(true);
};
$('#pause-button').onclick = pause;
$('#wave-button').onclick = () => {
  if (game.startWave()) updateHud();
};
$('#speed-button').onclick = () => {
  speed = speed === 1 ? 2 : 1;
  $('#speed-button').textContent = `${speed}×`;
  $('#speed-button').setAttribute('aria-pressed', String(speed === 2));
};
$('#collect-button').onclick = () => {
  for (const p of [...game.pickups]) game.collect(p.id);
  updateHud();
};
$('#beam-button').onclick = () => {
  audio.unlock();
  select('beam');
};
$('#recycle-button').onclick = () => select('recycle');
document.querySelectorAll<HTMLButtonElement>('[data-bot]').forEach(
  (b) =>
    (b.onclick = () => {
      audio.unlock();
      select(b.dataset.bot as BotKind);
    }),
);
document.querySelectorAll<HTMLButtonElement>('[data-sector]').forEach(
  (b) =>
    (b.onclick = () => {
      if (menu) {
        setSector(Number(b.dataset.sector));
        updateHud();
      }
    }),
);
$('#sound-button').onclick = () => {
  audio.unlock();
  audio.muted = !audio.muted;
  save.muted = audio.muted;
  $('#sound-button').setAttribute('aria-pressed', String(!audio.muted));
  persist();
  if (!audio.muted) audio.play('energy');
};
$('#settings-button').onclick = () => {
  openModal(
    'Make it yours.',
    `<p>Small adjustments for a better mission.</p><label class="setting"><span>Sound effects<small>Original synthesized sci-fi audio</small></span><input id="sound-setting" type="checkbox" ${!audio.muted ? 'checked' : ''}/></label><label class="setting"><span>Reduced motion<small>Disable ambient movement and combat particles</small></span><input id="motion-setting" type="checkbox" ${renderer.reducedMotion ? 'checked' : ''}/></label><p class="fine-print">Campaign progress and preferences save automatically on this device. No account or internet needed after your first visit.</p><button class="primary" id="settings-done">Back to the outpost</button>`,
  );
  $('#sound-setting').onchange = (e) => {
    audio.unlock();
    audio.muted = !(e.target as HTMLInputElement).checked;
    save.muted = audio.muted;
    $('#sound-button').setAttribute('aria-pressed', String(!audio.muted));
    persist();
  };
  $('#motion-setting').onchange = (e) => {
    renderer.reducedMotion = (e.target as HTMLInputElement).checked;
    save.reducedMotion = renderer.reducedMotion;
    persist();
  };
  $('#settings-done').onclick = () => closeModal();
};
$('#guide-button').onclick = () => {
  openModal(
    'Know your squad.',
    `<p>Aliens advance from the right. Place robots on empty tiles to protect the core on the left.</p><div class="guide-grid">${kinds.map((kind) => `<div><img src="${botIcon(kind)}" alt=""/><span><strong>${BOTS[kind].name} <small>· ${BOTS[kind].cost} ENERGY</small></strong><p>${BOTS[kind].description}</p></span></div>`).join('')}</div><div class="guide-notes"><p><strong>Build an economy.</strong> You gain 3 energy each second. Tap golden cells or press E to collect bonus energy. Start with Spark at the back and Pulse in threatened lanes.</p><p><strong>Your last resort.</strong> Each lane has one emergency sweeper. Orbital strike (Q) deals 320 damage to an entire lane and recharges in 42 seconds. Recycle (R) refunds up to half a robot’s cost.</p><p><strong>Stay sharp.</strong> Runners are fast. Brutes are tough. Spitters attack at range. An Overlord leads the final wave. Clear all waves to unlock the next sector.</p></div><div class="keyboard-guide"><kbd>1–5</kbd> Select robot <kbd>Q</kbd> Strike <kbd>R</kbd> Recycle <kbd>E</kbd> Collect <kbd>Space</kbd> Pause</div><p class="fine-print">Keyboard: Tab to the battlefield, use arrow keys to choose a tile, then Enter to deploy. On phones, tap a robot and a tile. Landscape gives you a wider view.</p>`,
  );
};
document.querySelectorAll<HTMLButtonElement>('.cell').forEach((cell) => {
  cell.onclick = (e) => {
    if (menu || game.phase !== 'playing') return;
    audio.unlock();
    const row = Number(cell.dataset.row),
      col = Number(cell.dataset.col);
    if (e.detail > 0) {
      const bounds = $('#battlefield').getBoundingClientRect();
      const x = (((e.clientX - bounds.left) / bounds.width) * 1200 - BOARD.x) / 100;
      const y = (((e.clientY - bounds.top) / bounds.height) * 700 - BOARD.y) / 82;
      const pickup = game.pickups.find((p) => Math.hypot(p.x - x, p.row + 0.5 - y) < 0.38);
      if (pickup) {
        game.collect(pickup.id);
        updateHud();
        return;
      }
    }
    if (selected === 'beam') {
      if (game.beam(row)) {
        toast('Orbital strike deployed.');
        select('pulse');
      } else toast('Orbital strike is recharging.');
    } else if (selected === 'recycle') {
      if (!game.recycle(row, col)) toast('Select a tile with a robot to recycle.');
    } else if (!game.place(selected, row, col))
      toast(
        game.bots.some((b) => b.row === row && b.col === col)
          ? 'That tile is occupied. Choose an empty tile.'
          : `Need ${BOTS[selected].cost} energy. Collect gold cells or deploy Spark.`,
      );
    updateHud();
  };
  cell.onpointerenter = () => {
    renderer.hover = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  };
  cell.onfocus = () => {
    document
      .querySelectorAll<HTMLElement>('.cell')
      .forEach((c) => (c.tabIndex = c === cell ? 0 : -1));
    renderer.hover = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  };
  cell.onkeydown = (e) => {
    const delta: Record<string, number> = {
      ArrowUp: -9,
      ArrowDown: 9,
      ArrowLeft: -1,
      ArrowRight: 1,
    };
    if (e.key in delta) {
      e.preventDefault();
      const cells = [...document.querySelectorAll<HTMLButtonElement>('.cell')];
      const idx = cells.indexOf(cell);
      cells[Math.max(0, Math.min(44, idx + delta[e.key]))].focus();
    }
  };
});
$('#battle-grid').onpointerleave = () => (renderer.hover = null);
document.addEventListener('keydown', (e) => {
  if (!$('#modal-backdrop').hidden) {
    if (e.key === 'Escape') {
      if (game.phase === 'won' || game.phase === 'lost') mainMenu();
      else closeModal();
      e.preventDefault();
    }
    if (e.key === 'Tab') {
      const focusables = [
        ...$('#modal').querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, [tabindex="0"]',
        ),
      ];
      const first = focusables[0],
        final = focusables.at(-1)!;
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === $('#modal'))
      ) {
        final.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === final) {
        first.focus();
        e.preventDefault();
      }
    }
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).matches('input, textarea'))
    return;
  if (e.key >= '1' && e.key <= '5') select(kinds[Number(e.key) - 1]);
  if (e.key.toLowerCase() === 'q') select('beam');
  if (e.key.toLowerCase() === 'r') select('recycle');
  if (!menu && e.key.toLowerCase() === 'e') {
    for (const p of [...game.pickups]) game.collect(p.id);
  }
  if (
    !menu &&
    (e.code === 'Space' || e.key === 'Escape') &&
    !(e.code === 'Space' && (e.target as HTMLElement).tagName === 'BUTTON')
  ) {
    e.preventDefault();
    pause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !menu && game.phase === 'playing') pause();
  last = 0;
  accumulator = 0;
});

function frame(now: number) {
  const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  if (menu) demo.time += elapsed;
  else {
    accumulator += elapsed * speed;
    while (accumulator >= 1 / 60) {
      game.update(1 / 60);
      accumulator -= 1 / 60;
    }
    for (const event of game.drainEvents()) {
      audio.play(event.type, event.kind);
      if (event.type === 'wave') {
        $('#wave-banner').textContent =
          game.wave === game.totalWaves && !game.endless
            ? 'FINAL WAVE · HOLD THE LINE'
            : `WAVE ${String(game.wave).padStart(2, '0')} · INCOMING`;
        $('#wave-banner').classList.remove('show');
        void $('#wave-banner').offsetWidth;
        $('#wave-banner').classList.add('show');
      }
      if (event.type === 'breach') toast('Core breached! Reinforce the open lane.');
    }
    if (game.phase !== previousPhase) {
      previousPhase = game.phase;
      if (game.phase === 'won' || game.phase === 'lost') finish();
    }
  }
  renderer.draw(menu ? demo : game, menu);
  toastTimer -= elapsed;
  if (toastTimer <= 0) $('#toast').classList.remove('visible');
  hudClock += elapsed;
  if (hudClock > 0.15) {
    updateHud();
    hudClock = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(() => toast('Offline cache unavailable. You can keep playing online.'));
  });
}
