import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/roboto-condensed/cyrillic-600.css';
import '@fontsource/roboto-condensed/cyrillic-700.css';
import './style.css';
import './game/battlefield.css';
import {
  BOTS,
  COLS,
  ROWS,
  FIRST_PATROL_LANE,
  Game,
  SECTORS,
  startingEnergy,
  type BotKind,
} from './game/engine';
import { Renderer, botIcon, alienIcon } from './game/render';
import { LaneWarning } from './game/lane-warning';
import { fieldTextures, isBattleLayout, isFieldSkin } from './game/field';
import { GAME_BACK_EVENT, setGameBackHandled } from './game/navigation';
import { isRobotSkin, isAlienSkin } from './game/skins';
import {
  supportsNativeOrientation,
  getOrientationMode,
  setOrientationMode,
} from './game/orientation';
import { AudioEngine } from './game/audio';
import { loadSave, storeSave, type Preferences } from './game/storage';

import { messages, type Messages } from './i18n';
import { resolveLanguage, isLanguageChoice } from './i18n/language';

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
function preferredLanguage() {
  return resolveLanguage(save.language, [...(navigator.languages ?? []), navigator.language]);
}
let t = messages[preferredLanguage()];
let renderDialog: (() => void) | null = null;
let activeToast: ((copy: Messages) => string) | null = null;
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
    <a class="brand" href="./" data-label="home"><img src="./icon.svg" alt=""/><span><span data-caption="robots"></span> <span class="brand-vs" data-caption="versus"></span> <span data-caption="aliens"></span><small data-caption="subtitle"></small></span></a>
    <nav data-label="tools"><span class="connection"><i></i> <span data-caption="command"></span></span><button class="quiet" id="guide-button" data-label="guide">${icon('book')}<span data-caption="guide"></span></button><button class="icon-button" id="sound-button" data-label="soundToggle" aria-pressed="${!save.muted}">${icon('sound')}</button><button class="icon-button settings-button" id="settings-button" data-label="settings">⚙</button></nav>
  </header>
  <main>
    <section class="console" data-label="console">
      <div class="console-top"><div class="sector-status"><span class="live-dot"></span><span id="sector-label"></span><span class="separator">/</span><span id="mission-label"></span></div><div class="console-tags"><span><span data-caption="best"></span> &nbsp;<b id="best-score"></b></span></div></div>
      <div class="console-body">
        <div class="battle-column">
          <div class="hud"><div class="energy-stat">${icon('bolt')}<strong id="energy"></strong><span data-caption="energy"></span></div><div class="mission-vitals"><div class="integrity">${icon('shield')}<div><span data-caption="core"></span><div id="hearts">${'<i></i>'.repeat(5)}</div></div></div><div class="wave-stat"><span id="wave-label"></span><strong id="wave-count"></strong></div><button class="icon-button" id="pause-button" data-label="pause" disabled>${icon('pause')}</button></div></div>
          <div class="arena" id="arena">
            <div class="battle-scene" id="battle-scene"><canvas id="battlefield"></canvas>
            <div id="battle-grid" class="battle-grid" role="group" data-label="grid" hidden>${Array.from({ length: ROWS * COLS }, (_, i) => `<button class="cell" data-row="${Math.floor(i / COLS)}" data-col="${i % COLS}" tabindex="${i === 0 ? 0 : -1}"></button>`).join('')}<div class="energy-layer" id="energy-layer"></div></div></div>
            <div class="menu-cover" id="menu-cover"><div class="mission-chip" id="mission-location"></div><h1><span data-caption="titleStart"></span> <em data-caption="titleEnd"></em></h1><p id="mission-brief"></p><button class="primary" id="start-button"><span data-caption="deploy"></span> ${icon('arrow')}</button></div>
            <div class="arena-caption"><span data-caption="feed"></span><span id="arena-instruction"></span></div>
            <div class="toast" id="toast" role="status" aria-live="polite"></div>
            <div class="wave-banner" id="wave-banner" aria-hidden="true"></div>
          </div>
          <div class="battle-toolbar"><div class="tactical-status"><span class="pulse-dot"></span><span id="tactical-status"></span></div><div class="battle-actions"><button id="collect-button" class="tool-button" disabled>${icon('bolt')} <span data-caption="collect"></span> <span id="pickup-count">0</span></button><button id="speed-button" class="tool-button" data-label="speed" aria-pressed="false">1×</button><button id="wave-button" class="tool-button next-wave" disabled></button></div></div>
        </div>
        <aside class="deck">
          <div class="deck-heading"><div><span class="eyebrow" data-caption="robotSystems"></span><h2 data-caption="loadout"></h2></div><span class="count">05</span></div>
          <div class="bot-cards">${kinds.map((kind, i) => `<button class="bot-card" data-bot="${kind}" style="--bot-color:${BOTS[kind].color}"><span class="keycap">${i + 1}</span><img src="${botIcon(kind, save.robotSkin)}" alt=""/><span class="bot-details"><strong></strong><small></small></span><span class="bot-cost">${icon('bolt')}${BOTS[kind].cost}</span></button>`).join('')}</div>
          <div class="loadout-tip"><span id="selected-name"></span><p id="selected-description"></p></div>
          <div class="abilities"><button id="beam-button" class="ability" data-label="strikeSelect" aria-pressed="false">${icon('target')}<span><span data-caption="strike"></span><small id="beam-status"></small></span></button><button id="recycle-button" class="recycle-button" data-label="recycleSelect" aria-pressed="false">${icon('recycle')}<span data-caption="recycle"></span></button></div>
        </aside>
      </div>
      <div class="campaign"><div class="campaign-label"><span class="eyebrow" data-caption="campaign"></span><strong data-caption="selectSector"></strong></div><div class="sectors" id="sectors">${SECTORS.map((_, i) => `<button class="sector" data-sector="${i}"><span>0${i + 1}</span><div><strong></strong><small></small></div><b></b></button>`).join('')}</div></div>
    </section>
    <footer><button class="text-button" id="endless-button"><span data-caption="survival"></span> ↗</button></footer>
  </main>
  <div id="modal-backdrop" class="modal-backdrop" hidden><section id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"></section></div>
`;
const renderer = new Renderer($('#battlefield'));
const laneWarning = new LaneWarning($('#arena'), $('#battle-scene'));
function updateMissionLayout() {
  document.body.classList.toggle('in-mission', !menu);
  $('#app').classList.toggle('arena-view', !menu && save.battleLayout === 'expanded');
}
renderer.fieldSkin = save.fieldSkin;
const energyLayer = $('#energy-layer');
const energyButtons = new Map<number, HTMLButtonElement>();
function applySkins() {
  renderer.robotSkin = save.robotSkin;
  renderer.alienSkin = save.alienSkin;
  for (const card of document.querySelectorAll<HTMLElement>('[data-bot]')) {
    card.querySelector('img')!.src = botIcon(card.dataset.bot as BotKind, save.robotSkin);
  }
}
applySkins();
renderer.reducedMotion =
  save.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('reduced-motion', renderer.reducedMotion);

function toast(message: (copy: Messages) => string) {
  activeToast = message;
  $('#toast').textContent = message(t);
  $('#toast').classList.add('visible');
  toastTimer = 3;
}
function persist(preferences: Partial<Preferences> = {}) {
  Object.assign(save, preferences);
  void storeSave(save, preferences).then((saved) => {
    if (!saved) toast((copy) => copy.storageError);
  });
  $('#best-score').textContent = t.number(save.best);
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
      ? t.strikeTitle
      : choice === 'recycle'
        ? t.recycleTitle
        : `${t.bots[choice].name.toUpperCase()} / ${t.bots[choice].role}`;
  $('#selected-description').textContent =
    choice === 'beam'
      ? t.strikeDescription
      : choice === 'recycle'
        ? t.recycleDescription
        : t.bots[choice].description;
  $('#arena-instruction').textContent =
    choice === 'beam'
      ? t.strikeHint
      : choice === 'recycle'
        ? t.recycleHint
        : t.deployHint(t.bots[choice].name);
}
function setSector(i: number) {
  sector = i;
  $('#battlefield').setAttribute('aria-label', t.battlefield(t.sectors[i].name));
  $('#mission-location').textContent = t.sectors[i].location;
  $('#mission-brief').textContent = t.sectors[i].description;
  $('#sector-label').textContent = t.sectorNumber(i + 1);
  $('#mission-label').textContent = t.sectors[i].name.toUpperCase();
  document
    .querySelectorAll<HTMLElement>('[data-sector]')
    .forEach((b) => b.classList.toggle('active', Number(b.dataset.sector) === i));
}
function updateSectors() {
  document.querySelectorAll<HTMLButtonElement>('[data-sector]').forEach((b) => {
    const i = Number(b.dataset.sector);
    b.disabled = i > save.unlocked || !menu;
    b.querySelector('strong')!.textContent = t.sectors[i].name;
    b.querySelector('small')!.textContent =
      i > save.unlocked
        ? t.locked
        : save.stars[i]
          ? '★'.repeat(save.stars[i])
          : i === 0
            ? t.startHere
            : t.available;
    b.querySelector('b')!.textContent = i > save.unlocked ? '⌑' : '↗';
    b.setAttribute('aria-label', t.sectorLabel(i + 1, t.sectors[i].name, i > save.unlocked));
  });
}
function start(endless = false) {
  renderer.prepareBattle();
  audio.unlock();
  menu = false;
  closeModal(false);
  energyLayer.replaceChildren();
  energyButtons.clear();
  game = new Game(sector, endless, undefined, save.difficulty);
  updateMissionLayout();
  window.scrollTo(0, 0);
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
  if (!game.awaitingLaunch) toast((copy) => copy.startTip);
  $('#arena').classList.add('is-playing');
  $('.cell').focus({ preventScroll: true });
}
function mainMenu() {
  menu = true;
  closeModal(false);
  updateMissionLayout();
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
// The collectible and its touch target are the same button. Tiles are siblings,
// so collection also takes precedence over recycle and orbital targeting.
function syncEnergyButtons() {
  for (const [id, button] of energyButtons) {
    if (!menu && game.pickups.some((p) => p.id === id)) continue;
    // Preserve the original touch target if a player holds it across expiry.
    if (!menu && button.matches(':active')) continue;
    button.remove();
    energyButtons.delete(id);
  }
  if (menu) return;
  for (const pickup of game.pickups) {
    let button = energyButtons.get(pickup.id);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'energy-target';
      button.style.left = `${(pickup.x / COLS) * 100}%`;
      button.style.top = `${((pickup.row + 0.5) / ROWS) * 100}%`;
      button.innerHTML = `<span class="energy-core">${icon('bolt')}</span>`;
      button.onpointerenter = () => {
        renderer.hover = null;
      };
      button.onclick = (event) => {
        if (menu || game.phase !== 'playing') return;
        audio.unlock();
        const keyboard = event.detail === 0;
        if (game.collect(pickup.id)) toast((copy) => copy.collected(pickup.value));
        if (keyboard) {
          const col = Math.floor(pickup.x);
          $(`.cell[data-row="${pickup.row}"][data-col="${col}"]`).focus({ preventScroll: true });
        }
        updateHud();
      };
      energyLayer.append(button);
      energyButtons.set(pickup.id, button);
    }
    const label = t.pickup(pickup.value, pickup.row + 1);
    if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
    button.classList.toggle('expiring', pickup.life < 3);
  }
}

function updateHud() {
  syncEnergyButtons();
  $('#battle-grid').toggleAttribute('data-first-patrol', !menu && game.awaitingLaunch);
  $('#energy').textContent = String(
    menu ? startingEnergy(sector, save.difficulty) : Math.floor(game.energy),
  );
  $('#wave-label').textContent = menu
    ? t.prepare
    : game.endless
      ? t.survival
      : game.waveActive
        ? t.incomingHostiles
        : t.deployment;
  $('#wave-count').innerHTML =
    `${String(menu ? 0 : game.wave).padStart(2, '0')} <small>/ ${game.endless && !menu ? '∞' : String(SECTORS[sector].waves).padStart(2, '0')}</small>`;
  const hearts = $('#hearts');
  hearts.setAttribute('aria-label', t.integrity(menu ? 5 : game.lives));
  [...hearts.children].forEach((h, i) => h.classList.toggle('empty', !menu && i >= game.lives));
  const waveButton = $<HTMLButtonElement>('#wave-button');
  waveButton.disabled = menu || game.phase !== 'playing' || game.waveActive;
  waveButton.innerHTML =
    !menu && !game.waveActive && !game.awaitingLaunch
      ? `${t.waveTimer(Math.ceil(game.intermission))} ${icon('arrow')}`
      : `${t.sendWave} ${icon('arrow')}`;
  $('#tactical-status').textContent = menu
    ? t.campaignHint(t.difficulty[save.difficulty])
    : game.phase === 'paused'
      ? t.paused
      : game.awaitingLaunch
        ? game.bots.some((bot) => bot.row === FIRST_PATROL_LANE - 1 && BOTS[bot.kind].damage > 0)
          ? t.covered(FIRST_PATROL_LANE)
          : t.firstPatrol(FIRST_PATROL_LANE)
        : game.waveActive
          ? `${t.hostiles(game.enemies.length)} · ${game.pickups.length && game.wave === 1 ? t.goldHint : t.points(game.score)}`
          : t.nextWave(game.wave + 1);
  $('#beam-status').textContent =
    !menu && game.awaitingLaunch
      ? t.standby
      : game.beamCooldown > 0 && !menu
        ? t.recharging(Math.ceil(game.beamCooldown))
        : t.ready;
  $<HTMLButtonElement>('#beam-button').disabled =
    !menu && (game.awaitingLaunch || game.beamCooldown > 0);
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
    const label = t.tile(
      row + 1,
      col + 1,
      bot ? t.botHealth(t.bots[bot.kind].name, Math.ceil(bot.hp)) : t.empty,
    );
    if (b.getAttribute('aria-label') !== label) b.setAttribute('aria-label', label);
  });
}
function syncBackHandling() {
  void setGameBackHandled(!menu || !$('#modal-backdrop').hidden).catch(() => {
    console.warn('Android Back integration is unavailable.');
  });
}
function renderModal(title: string, contents: string) {
  $('#modal').innerHTML =
    `<button id="modal-close" class="modal-close icon-button" aria-label="${t.close}">${icon('close')}</button><div class="eyebrow">${t.labels.command}</div><h2 id="modal-title">${title}</h2>${contents}`;
  $('.modal-close').onclick = () => closeModal();
}
function openModal(render: () => void) {
  if (renderDialog) return;
  returnFocus = document.activeElement as HTMLElement;
  resumeAfterDialog = !menu && game.phase === 'playing';
  if (resumeAfterDialog) game.phase = 'paused';
  renderDialog = render;
  render();
  $('#modal-backdrop').hidden = false;
  syncBackHandling();
  $('#modal').focus();
  updateHud();
}
function closeModal(resume = true) {
  renderDialog = null;
  $('#modal-backdrop').hidden = true;
  syncBackHandling();
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
  openModal(renderPause);
}
function renderPause() {
  renderModal(
    t.pauseTitle,
    `<p>${t.pauseHelp}</p><div class="modal-actions"><button class="primary" id="resume-button">${t.resume} ${icon('arrow')}</button><button class="secondary" id="restart-button">${t.restart}</button><button class="text-button" id="quit-button">${t.quit}</button></div>`,
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
  openModal(() => renderResult(won, stars));
}
function renderResult(won: boolean, stars: number) {
  renderModal(
    won ? t.won : t.lost,
    `<div class="result-emblem">${won ? '✦' : '⌁'}</div><p>${won ? t.winHelp : t.lossHelp}</p>${won ? `<div class="stars" aria-label="${t.stars(stars)}">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>` : ''}<div class="result-stats"><div><strong>${t.number(game.score)}</strong><span>${t.score}</span></div><div><strong>${game.kills}</strong><span>${t.stopped}</span></div><div><strong>${Math.floor(game.time / 60)}:${String(Math.floor(game.time % 60)).padStart(2, '0')}</strong><span>${t.time}</span></div></div><div class="modal-actions">${won && sector < 4 ? `<button class="primary" id="next-sector">${t.nextSector} →</button>` : ''}<button class="${won && sector < 4 ? 'secondary' : 'primary'}" id="retry-button">${won ? t.playAgain : t.retry}</button><button class="text-button" id="quit-button">${t.quit}</button></div>`,
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

function handleGameBack() {
  if (menu && $('#modal-backdrop').hidden) return false;
  if (!menu && (game.phase === 'won' || game.phase === 'lost')) mainMenu();
  else if (!$('#modal-backdrop').hidden) closeModal();
  else pause();
  return true;
}
window.addEventListener(GAME_BACK_EVENT, (event) => {
  if (handleGameBack()) event.preventDefault();
});
syncBackHandling();
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
function collectAllEnergy() {
  for (const pickup of game.pickups) game.collect(pickup.id);
  updateHud();
}
$('#collect-button').onclick = collectAllEnergy;
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
  $('#sound-button').setAttribute('aria-pressed', String(!audio.muted));
  persist({ muted: audio.muted });
  if (!audio.muted) audio.play('energy');
};
function selectOptions(choices: Record<string, string>, selectedSkin: string) {
  return Object.entries(choices)
    .map(
      ([id, name]) =>
        `<option value="${id}" ${id === selectedSkin ? 'selected' : ''}>${name}</option>`,
    )
    .join('');
}
function wireOrientationSetting(select: HTMLSelectElement) {
  const help = $('#orientation-help');
  getOrientationMode()
    .then((mode) => {
      select.value = mode;
      select.disabled = false;
    })
    .catch(() => {
      help.textContent = t.orientationReadError;
    });
  select.onchange = async () => {
    select.disabled = true;
    try {
      await setOrientationMode(select.value === 'follow' ? 'follow' : 'landscape');
    } catch {
      help.textContent = t.orientationWriteError;
      return;
    }
    select.disabled = false;
  };
}
function renderSettings() {
  renderModal(
    t.settingsTitle,
    `<label class="setting select-setting"><span>${t.language}</span><select id="language-setting" aria-label="${t.language}"><option value="system">${t.system}</option><option value="en" lang="en">English</option><option value="ru" lang="ru">Русский</option></select></label>` +
      `<label class="setting select-setting"><span>${t.difficultyLabel}<small>${t.difficultyHelp}</small></span><select id="difficulty-setting" aria-label="${t.difficultyLabel}">${selectOptions(t.difficulty, save.difficulty)}</select></label>` +
      (supportsNativeOrientation()
        ? `<label class="setting select-setting"><span>${t.orientation}<small id="orientation-help">${t.orientationHelp}</small></span><select id="orientation-setting" aria-label="${t.orientation}" disabled><option value="landscape">${t.landscape}</option><option value="follow">${t.follow}</option></select></label>`
        : '') +
      `<label class="setting select-setting"><span>${t.layout}</span><select id="battle-layout" aria-label="${t.layout}">${selectOptions(t.layouts, save.battleLayout)}</select></label>` +
      `<label class="setting select-setting"><span class="skin-label"><i id="field-sample" aria-hidden="true"></i><span>${t.fieldSkin}</span></span><select id="field-skin" aria-label="${t.fieldSkin}">${selectOptions(t.fields, save.fieldSkin)}</select></label>` +
      `<label class="setting select-setting"><span class="skin-label"><img id="robot-skin-preview" src="${botIcon('pulse', save.robotSkin)}" alt=""/><span>${t.robotSkin}</span></span><select id="robot-skin" aria-label="${t.robotSkin}">${selectOptions(t.robotSkins, save.robotSkin)}</select></label>` +
      `<label class="setting select-setting"><span class="skin-label"><img id="alien-skin-preview" src="${alienIcon('scout', save.alienSkin)}" alt=""/><span>${t.alienSkin}</span></span><select id="alien-skin" aria-label="${t.alienSkin}">${selectOptions(t.alienSkins, save.alienSkin)}</select></label>` +
      `<label class="setting"><span>${t.sound}<small>${t.soundHelp}</small></span><input id="sound-setting" type="checkbox" ${!audio.muted ? 'checked' : ''}/></label><label class="setting"><span>${t.motion}<small>${t.motionHelp}</small></span><input id="motion-setting" type="checkbox" ${renderer.reducedMotion ? 'checked' : ''}/></label><p class="fine-print">${t.saveHelp}</p><button class="primary" id="settings-done">${t.done}</button>`,
  );
  const language = $<HTMLSelectElement>('#language-setting');
  language.value = save.language;
  language.onchange = () => {
    if (!isLanguageChoice(language.value)) return;
    persist({ language: language.value });
    applyLanguage();
  };
  const updateFieldSample = () => {
    $('#field-sample').style.backgroundImage =
      save.fieldSkin === 'standard' ? '' : `url("${fieldTextures[save.fieldSkin]}")`;
  };
  updateFieldSample();
  $<HTMLSelectElement>('#battle-layout').onchange = (event) => {
    const layout = (event.target as HTMLSelectElement).value;
    if (!isBattleLayout(layout)) return;
    persist({ battleLayout: layout });
    updateMissionLayout();
  };
  $<HTMLSelectElement>('#field-skin').onchange = (event) => {
    const skin = (event.target as HTMLSelectElement).value;
    if (!isFieldSkin(skin)) return;
    renderer.fieldSkin = skin;
    persist({ fieldSkin: skin });
    updateFieldSample();
  };
  const orientation = document.querySelector<HTMLSelectElement>('#orientation-setting');
  if (orientation) wireOrientationSetting(orientation);
  $<HTMLSelectElement>('#robot-skin').onchange = (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (!isRobotSkin(value)) return;
    persist({ robotSkin: value });
    applySkins();
    $<HTMLImageElement>('#robot-skin-preview').src = botIcon('pulse', value);
  };
  $<HTMLSelectElement>('#alien-skin').onchange = (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (!isAlienSkin(value)) return;
    persist({ alienSkin: value });
    renderer.alienSkin = value;
    $<HTMLImageElement>('#alien-skin-preview').src = alienIcon('scout', value);
  };
  $('#difficulty-setting').onchange = (event) => {
    persist({
      difficulty: (event.target as HTMLSelectElement).value === 'veteran' ? 'veteran' : 'cadet',
    });
    updateHud();
  };
  $('#sound-setting').onchange = (e) => {
    audio.unlock();
    audio.muted = !(e.target as HTMLInputElement).checked;
    $('#sound-button').setAttribute('aria-pressed', String(!audio.muted));
    persist({ muted: audio.muted });
  };
  $('#motion-setting').onchange = (e) => {
    renderer.reducedMotion = (e.target as HTMLInputElement).checked;
    document.documentElement.classList.toggle('reduced-motion', renderer.reducedMotion);
    persist({ reducedMotion: renderer.reducedMotion });
  };
  $('#settings-done').onclick = () => closeModal();
}
$('#settings-button').onclick = () => openModal(renderSettings);
function renderGuide() {
  renderModal(
    t.guideTitle,
    `<p>${t.guideIntro}</p><div class="guide-grid">${kinds.map((kind) => `<div><img src="${botIcon(kind, save.robotSkin)}" alt=""/><span><strong>${t.bots[kind].name} <small>· ${BOTS[kind].cost} ${t.labels.energy}</small></strong><p>${t.bots[kind].description}</p></span></div>`).join('')}</div>
     <div class="guide-notes">${t.guideNotes.map(([title, note]) => `<p><strong>${title}</strong> ${note}</p>`).join('')}</div>
     <div class="keyboard-guide">${t.shortcuts.map(([key, action]) => `<kbd>${key}</kbd> ${action}`).join(' ')}</div>
     <p class="fine-print">${t.guideControls}</p>`,
  );
}
$('#guide-button').onclick = () => openModal(renderGuide);
document.querySelectorAll<HTMLButtonElement>('.cell').forEach((cell) => {
  cell.onclick = () => {
    if (menu || game.phase !== 'playing') return;
    audio.unlock();
    const row = Number(cell.dataset.row),
      col = Number(cell.dataset.col);
    if (selected === 'beam') {
      if (game.beam(row)) {
        toast((copy) => copy.strikeFired);
        select('pulse');
      } else toast((copy) => copy.strikeCooling);
    } else if (selected === 'recycle') {
      if (!game.recycle(row, col)) toast((copy) => copy.recycleEmpty);
    } else if (!game.place(selected, row, col)) {
      const cost = BOTS[selected].cost;
      const occupied = game.bots.some((bot) => bot.row === row && bot.col === col);
      toast((copy) => (occupied ? copy.occupied : copy.insufficient(cost)));
    }
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
  if (e.key === 'Escape') {
    if (!e.repeat && !e.defaultPrevented && handleGameBack()) e.preventDefault();
    return;
  }
  if (!$('#modal-backdrop').hidden) {
    if (e.key === 'Tab') {
      const focusables = [
        ...$('#modal').querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, [tabindex="0"]',
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
  const key = e.key.toLowerCase();
  if ((key === 'q' || key === 'й') && !$<HTMLButtonElement>('#beam-button').disabled)
    select('beam');
  if (key === 'r' || key === 'к') select('recycle');
  if (!menu && (key === 'e' || key === 'у')) collectAllEnergy();
  if (!menu && e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'BUTTON') {
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
  if (!menu) {
    accumulator += elapsed * speed;
    while (accumulator >= 1 / 60) {
      game.update(1 / 60);
      accumulator -= 1 / 60;
    }
    for (const event of game.drainEvents()) {
      audio.play(event.type, event.kind);
      if (event.type === 'wave') {
        $('#wave-banner').textContent = waveMessage();
        $('#wave-banner').classList.remove('show');
        void $('#wave-banner').offsetWidth;
        $('#wave-banner').classList.add('show');
      }
      if (event.type === 'breach') toast((copy) => copy.breach);
    }
    if (game.phase !== previousPhase) {
      previousPhase = game.phase;
      if (game.phase === 'won' || game.phase === 'lost') finish();
    }
  }
  laneWarning.update(menu ? null : game.incomingThreat, t);
  if (!menu) renderer.draw(game);
  if (toastTimer > 0) {
    toastTimer -= elapsed;
    if (toastTimer <= 0) $('#toast').classList.remove('visible');
  }
  hudClock += elapsed;
  if (!menu && game.phase === 'playing' && hudClock > 0.15) {
    updateHud();
    hudClock = 0;
  }
  requestAnimationFrame(frame);
}
function waveMessage() {
  return game.wave === game.totalWaves && !game.endless ? t.finalWave : t.waveBanner(game.wave);
}

function applyLanguage() {
  const language = preferredLanguage();
  t = messages[language];
  document.documentElement.lang = language;
  document.title = t.pageTitle;
  $<HTMLMetaElement>('meta[name="description"]').content = t.description;
  $<HTMLLinkElement>('link[rel="manifest"]').href =
    language === 'ru' ? './manifest.ru.webmanifest' : './manifest.webmanifest';
  type Label = keyof Messages['labels'];
  for (const el of document.querySelectorAll<HTMLElement>('[data-caption]'))
    el.textContent = t.labels[el.dataset.caption as Label];
  for (const el of document.querySelectorAll<HTMLElement>('[data-label]'))
    el.setAttribute('aria-label', t.labels[el.dataset.label as Label]);
  for (const card of document.querySelectorAll<HTMLElement>('[data-bot]')) {
    const kind = card.dataset.bot as BotKind;
    const { name, role, description } = t.bots[kind];
    card.querySelector('strong')!.textContent = name;
    card.querySelector('small')!.textContent = role;
    card.setAttribute('aria-label', t.selectBot(name, BOTS[kind].cost, description));
  }
  $('#best-score').textContent = t.number(save.best);
  setSector(sector);
  updateSectors();
  select(selected);
  updateHud();
  laneWarning.update(menu ? null : game.incomingThreat, t);
  if (activeToast && toastTimer > 0) $('#toast').textContent = activeToast(t);
  if (game.wave > 0) $('#wave-banner').textContent = waveMessage();
  if (renderDialog) {
    const focusId = document.activeElement?.id;
    const scroll = $('#modal').scrollTop;
    renderDialog();
    (document.getElementById(focusId || 'modal') ?? $('#modal')).focus({ preventScroll: true });
    $('#modal').scrollTop = scroll;
  }
}

window.addEventListener('languagechange', () => {
  if (preferredLanguage() !== document.documentElement.lang) applyLanguage();
});
applyLanguage();
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => toast((copy) => copy.offlineError));
  });
}
