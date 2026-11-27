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
      difficulty: 'cadet',
      robotSkin: 'standard',
      alienSkin: 'standard',
      battleLayout: 'expanded',
      fieldSkin: 'standard',
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
        battleLayout: 'expanded',
        fieldSkin: 'standard',
      });
    }
  });
  it('restores layout and field skin independently while preserving older campaign progress', () => {
    for (const [layout, field, wantLayout, wantField] of [
      ['classic', 'foundry', 'classic', 'foundry'],
      ['expanded', 'polar', 'expanded', 'polar'],
      ['old', 'foundry', 'expanded', 'foundry'],
      ['classic', 'toString', 'classic', 'standard'],
    ]) {
      vi.stubGlobal('localStorage', {
        getItem: () =>
          JSON.stringify({
            unlocked: 4,
            best: 4500,
            robotSkin: 'foundry',
            alienSkin: 'ember',
            battleLayout: layout,
            fieldSkin: field,
          }),
      });
      expect(loadSave()).toMatchObject({
        unlocked: 4,
        best: 4500,
        robotSkin: 'foundry',
        alienSkin: 'ember',
        battleLayout: wantLayout,
        fieldSkin: wantField,
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
