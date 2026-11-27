import type { IncomingThreat } from './engine';
import { BOARD } from './render';
import './lane-warning.css';

export class LaneWarning {
  private marker = document.createElement('span');
  private label = document.createElement('span');
  private current: IncomingThreat | null = null;

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

  update(threat: IncomingThreat | null) {
    if (threat === this.current) return;
    this.current = threat;
    this.marker.hidden = !threat;
    let message = '';
    if (threat) {
      const center = BOARD.y + (threat.row + 0.5) * BOARD.ch;
      this.marker.style.top = `${(center / BOARD.height) * 100}%`;
      message = `Incoming · Lane ${threat.row + 1}`;
      if (threat.kind) message += ` · ${threat.kind[0].toUpperCase()}${threat.kind.slice(1)}`;
    }
    // Consecutive arrivals can share a lane. Announce only a change in visible information.
    if (this.label.textContent !== message) this.label.textContent = message;
  }
}
