import type { Messages } from '../i18n/en';
import type { IncomingThreat } from './engine';
import { BOARD } from './render';
import './lane-warning.css';

export class LaneWarning {
  private marker = document.createElement('span');
  private label = document.createElement('span');
  private current: IncomingThreat | null = null;

  private copy?: Messages;

  constructor(arena: HTMLElement, scene: HTMLElement) {
    this.marker.className = 'incoming-lane-marker';
    this.marker.setAttribute('aria-hidden', 'true');
    this.marker.hidden = true;
    this.label.className = 'incoming-lane-label';
    this.label.setAttribute('role', 'status');
    this.label.setAttribute('aria-live', 'polite');
    this.label.setAttribute('aria-atomic', 'true');
    scene.append(this.marker);
    arena.append(this.label);
  }

  update(threat: IncomingThreat | null, copy: Messages) {
    if (threat === this.current && copy === this.copy) return;
    this.copy = copy;
    this.current = threat;
    this.marker.hidden = !threat;
    let message = '';
    if (threat) {
      const center = BOARD.y + (threat.row + 0.5) * BOARD.ch;
      this.marker.style.top = `${(center / BOARD.height) * 100}%`;
      message = copy.incoming(threat.row + 1);
      if (threat.kind) message += ` · ${copy.enemies[threat.kind]}`;
    }
    // Consecutive arrivals can share a lane. Announce only a change in visible information.
    if (this.label.textContent !== message) this.label.textContent = message;
  }
}
