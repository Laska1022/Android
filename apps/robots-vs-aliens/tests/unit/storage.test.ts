import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSave, storeSave } from '../../src/game/storage';
afterEach(() => vi.unstubAllGlobals());
describe('save data', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      locks: { request: (_key: string, write: () => boolean) => write() },
    });
  });
  it('handles storage failures without overwriting a save it cannot read', async () => {
    const getItem = vi.fn<() => string>(() => {
      throw Error('blocked');
    });
    const setItem = vi.fn(() => {
      throw Error('quota exceeded');
    });
    vi.stubGlobal('localStorage', { getItem, setItem });
    const save = loadSave();
    expect(save.unlocked).toBe(0);
    expect(await storeSave(save, {})).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    getItem.mockReturnValue(JSON.stringify({ best: 100 }));
    expect(await storeSave(save, { muted: true })).toBe(false);
    expect(setItem).toHaveBeenCalledOnce();
    expect(loadSave().best).toBe(100);
  });
  it('combines results from stale sessions using the best score, unlock and stars in each sector', async () => {
    let value = JSON.stringify({
      best: 4500,
      unlocked: 3,
      stars: [2, 3, 1],
      muted: true,
      robotSkin: 'cobalt',
    });
    vi.stubGlobal('localStorage', {
      getItem: () => value,
      setItem: (_key: string, next: string) => {
        value = next;
      },
    });
    const progress = { best: 4100, unlocked: 1, stars: [3] };
    expect(await storeSave(progress, {})).toBe(true);
    expect(loadSave()).toMatchObject({
      best: 4500,
      unlocked: 3,
      stars: [3, 3, 1, 0, 0],
      muted: true,
      robotSkin: 'cobalt',
    });
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
      difficulty: 'cadet',
      robotSkin: 'standard',
      alienSkin: 'standard',
    });
  });
  it('keeps v1 progress while accepting only supported campaign difficulty values', () => {
    const raw = {
      unlocked: 3,
      best: 3200,
      stars: [3, 2, 1, 0, 0],
      muted: true,
      reducedMotion: true,
    };
    for (const difficulty of [undefined, 'unknown', 'cadet', 'veteran']) {
      vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ ...raw, difficulty }) });
      expect(loadSave()).toEqual({
        ...raw,
        difficulty: difficulty === 'veteran' ? 'veteran' : 'cadet',
        robotSkin: 'standard',
        alienSkin: 'standard',
      });
    }
  });
  it('restores supported cosmetics independently of corrupt or outdated choices', () => {
    for (const [robotSkin, alienSkin, restoredRobot, restoredAlien] of [
      ['cobalt', 'ember', 'cobalt', 'ember'],
      ['foundry', 'riftborn', 'foundry', 'riftborn'],
      ['riftborn', 'riftborn', 'standard', 'riftborn'],
      ['foundry', 'foundry', 'foundry', 'standard'],
      ['unknown', 'ember', 'standard', 'ember'],
      ['cobalt', 'toString', 'cobalt', 'standard'],
    ]) {
      vi.stubGlobal('localStorage', {
        getItem: () => JSON.stringify({ best: 4242, muted: true, robotSkin, alienSkin }),
      });
      expect(loadSave()).toMatchObject({
        best: 4242,
        muted: true,
        robotSkin: restoredRobot,
        alienSkin: restoredAlien,
      });
    }
  });
});
