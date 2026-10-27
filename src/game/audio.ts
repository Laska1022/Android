export class AudioEngine {
  private ctx?: AudioContext;
  private master?: GainNode;
  muted = false;
  private lastShot = 0;
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
  }
  play(type: string, kind?: string) {
    if (this.muted || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if ((type === 'shoot' || type === 'hit') && now - this.lastShot < 0.055) return;
    if (type === 'shoot' || type === 'hit') this.lastShot = now;
    const notes: Record<string, [number, number, number, OscillatorType]> = {
      shoot: [kind === 'frost' ? 780 : kind === 'nova' ? 180 : 460, 95, 0.12, 'triangle'],
      hit: [95, 40, 0.06, 'triangle'],
      explode: [100, 25, 0.22, 'sawtooth'],
      place: [280, 680, 0.17, 'sine'],
      energy: [660, 1100, 0.16, 'sine'],
      wave: [140, 280, 0.6, 'triangle'],
      breach: [260, 55, 0.7, 'sawtooth'],
      beam: [900, 40, 0.8, 'sawtooth'],
      win: [440, 1320, 1.2, 'sine'],
      lose: [220, 55, 1.1, 'triangle'],
    };
    const [start, end, duration, wave] = notes[type] ?? notes.place;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}
