import type { Messages } from '../i18n';
import './field-guide.css';
import { BOTS, ENEMIES, type BotKind, type EnemyKind } from './engine';
import { Renderer, alienIcon, botIcon } from './render';

const robots = Object.keys(BOTS) as BotKind[];
const aliens = Object.keys(ENEMIES) as EnemyKind[];

export class FieldGuide {
  private page: 'robots' | 'aliens' = 'robots';
  private species: EnemyKind = 'scout';
  private cancelClip?: () => void;

  constructor(
    private modal: HTMLElement,
    private renderer: Renderer,
    private renderModal: (title: string, content: string) => void,
  ) {}

  close() {
    this.stopPreview();
    this.modal.classList.remove('field-guide-modal');
    this.page = 'robots';
    this.species = 'scout';
  }

  stopPreview() {
    this.cancelClip?.();
    this.cancelClip = undefined;
  }

  render(t: Messages) {
    this.stopPreview();
    this.modal.classList.add('field-guide-modal');
    const robotPage = this.page === 'robots';
    this.renderModal(
      robotPage ? t.guideTitle : t.alienGuide.title,
      `
      <div class="guide-switch" role="group" aria-label="${t.labels.guide}">
        <button id="guide-robots" type="button" aria-pressed="${robotPage}" aria-controls="guide-content">${t.alienGuide.robots}</button>
        <button id="guide-aliens" type="button" aria-pressed="${!robotPage}" aria-controls="guide-content">${t.alienGuide.aliens}</button>
      </div>
      <div id="guide-content">${robotPage ? this.squad(t) : this.alien(t)}</div>`,
    );
    for (const page of ['robots', 'aliens'] as const) {
      const id = '#guide-' + page;
      this.modal.querySelector<HTMLButtonElement>(id)!.onclick = () => {
        if (this.page === page) return;
        this.page = page;
        this.render(t);
        this.modal.querySelector<HTMLButtonElement>(id)!.focus({ preventScroll: true });
      };
    }
    if (robotPage) return;
    const selector = this.modal.querySelector<HTMLSelectElement>('#guide-species')!;
    selector.onchange = () => {
      this.species = selector.value as EnemyKind;
      this.render(t);
      this.modal.querySelector<HTMLSelectElement>('#guide-species')!.focus({ preventScroll: true });
    };
    for (const button of this.modal.querySelectorAll<HTMLButtonElement>('[data-alien-clip]')) {
      button.onclick = () => void this.play(button, t);
    }
    this.updateMotion(t);
  }

  private squad(t: Messages) {
    return `<p class="guide-intro">${t.guideIntro}</p>
      <div class="guide-grid">${robots.map((kind) => `<div><img src="${botIcon(kind, this.renderer.robotSkin)}" alt=""/><span><strong>${t.bots[kind].name} <small>· ${BOTS[kind].cost} ${t.labels.energy}</small></strong><p>${t.bots[kind].description}</p></span></div>`).join('')}</div>
      <div class="guide-notes">${t.guideNotes.map(([title, note]) => `<p><strong>${title}</strong> ${note}</p>`).join('')}</div>
      <div class="keyboard-guide">${t.shortcuts.map(([key, action]) => `<kbd>${key}</kbd> ${action}`).join(' ')}</div>
      <p class="fine-print">${t.guideControls}</p>`;
  }

  private alien(t: Messages) {
    const kind = this.species;
    const guide = t.alienGuide;
    const entry = guide.entries[kind];
    return `<div class="alien-profile">
      <div class="alien-details">
        <div><label for="guide-species">${guide.species}</label>
          <select id="guide-species">${aliens.map((value) => `<option value="${value}" ${value === kind ? 'selected' : ''}>${t.enemies[value]}</option>`).join('')}</select></div>
        <dl><dt>${guide.baseHealth}</dt><dd>${t.number(ENEMIES[kind].hp)}</dd></dl>
        <p>${entry.behavior}</p>
        <section class="guide-defense"><h3>${guide.defense}</h3><p>${entry.counter}</p></section>
      </div>
      <div class="alien-visual"><figure class="alien-figure"><div class="alien-specimen">
          <canvas width="316" height="192" aria-hidden="true" hidden></canvas>
          <img src="${alienIcon(kind, this.renderer.alienSkin)}" alt=""/>
        </div><figcaption>${t.alienSkins[this.renderer.alienSkin]}</figcaption></figure>
        <div class="guide-playback" role="group" aria-label="${guide.previews}"><button type="button" data-alien-clip="walk" aria-pressed="false">${guide.walk}</button>
          <button type="button" data-alien-clip="attack" aria-pressed="false">${guide.attack}</button></div>
        <p class="guide-clip-status" role="status"></p>
      </div></div>`;
  }

  updateMotion(t: Messages) {
    const controls = this.modal.querySelector<HTMLElement>('.guide-playback');
    if (!controls) return;
    if (this.renderer.reducedMotion) this.stopPreview();
    controls.hidden = this.renderer.reducedMotion;
    this.modal.querySelector<HTMLElement>('.guide-clip-status')!.textContent = this.renderer
      .reducedMotion
      ? t.alienGuide.still
      : '';
  }

  private async play(button: HTMLButtonElement, t: Messages) {
    const replaying = button.getAttribute('aria-pressed') === 'true';
    this.stopPreview();
    if (replaying || this.renderer.reducedMotion) return;
    const canvas = this.modal.querySelector<HTMLCanvasElement>('.alien-specimen canvas')!;
    const status = this.modal.querySelector<HTMLElement>('.guide-clip-status')!;
    status.textContent = '';
    button.setAttribute('aria-pressed', 'true');
    let stopped = false;
    let frame = 0;
    this.cancelClip = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      button.setAttribute('aria-pressed', 'false');
      canvas.hidden = true;
    };
    try {
      const clip = await this.renderer.prepareAlienPreview(
        canvas,
        this.species,
        button.dataset.alienClip === 'attack',
      );
      if (stopped) return;
      const start = performance.now();
      const animate = (now: number) => {
        const cycles = Math.max(0, now - start) / (1000 * clip.seconds);
        if (cycles >= 2) {
          this.stopPreview();
          return;
        }
        clip.draw(cycles % 1);
        frame = requestAnimationFrame(animate);
      };
      canvas.hidden = false;
      animate(start);
    } catch {
      if (stopped) return;
      this.stopPreview();
      status.textContent = t.alienGuide.unavailable;
    }
  }
}
