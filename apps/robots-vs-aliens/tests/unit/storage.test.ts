import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSave, storeSave } from '../../src/game/storage';
afterEach(() => vi.unstubAllGlobals());
describe('save data', () => {
  it('survives missing or inaccessible storage', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    });
    const save = loadSave();
    expect(save.unlocked).toBe(0);
    expect(storeSave(save)).toBe(false);
  });
  it('sanitizes corrupt and out-of-range progress', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken' });
    expect(loadSave().stars).toEqual([0, 0, 0, 0, 0]);
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ unlocked: 99, best: -4, stars: [7, -3, 'bad'], muted: 'no' }),
    });
    expect(loadSave()).toEqual({
      unlocked: 4,
      best: 0,
      stars: [3, 0, 0, 0, 0],
      muted: false,
      reducedMotion: false,
    });
  });
});
