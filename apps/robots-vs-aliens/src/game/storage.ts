import type { CampaignDifficulty } from './engine';
import { isRobotSkin, isAlienSkin, type RobotSkin, type AlienSkin } from './skins';
import { isBattleLayout, isFieldSkin, type BattleLayout, type FieldSkin } from './field';

export interface Save {
  unlocked: number;
  best: number;
  stars: number[];
  muted: boolean;
  reducedMotion: boolean;
  difficulty: CampaignDifficulty;
  robotSkin: RobotSkin;
  alienSkin: AlienSkin;
  battleLayout: BattleLayout;
  fieldSkin: FieldSkin;
}
const defaults = (): Save => ({
  unlocked: 0,
  best: 0,
  stars: [0, 0, 0, 0, 0],
  muted: false,
  reducedMotion: false,
  difficulty: 'cadet',
  robotSkin: 'standard',
  alienSkin: 'standard',
  battleLayout: 'expanded',
  fieldSkin: 'standard',
});
export function loadSave(): Save {
  try {
    const raw = JSON.parse(localStorage.getItem('rva-save-v1') ?? 'null');
    if (!raw || typeof raw !== 'object') return defaults();
    return {
      unlocked: Number.isInteger(raw.unlocked) ? Math.max(0, Math.min(4, raw.unlocked)) : 0,
      best: Number.isFinite(raw.best) ? Math.max(0, raw.best) : 0,
      stars: Array.from({ length: 5 }, (_, i) =>
        Number.isInteger(raw.stars?.[i]) ? Math.max(0, Math.min(3, raw.stars[i])) : 0,
      ),
      muted: raw.muted === true,
      reducedMotion: raw.reducedMotion === true,
      difficulty: raw.difficulty === 'veteran' ? 'veteran' : 'cadet',
      robotSkin: isRobotSkin(raw.robotSkin) ? raw.robotSkin : 'standard',
      alienSkin: isAlienSkin(raw.alienSkin) ? raw.alienSkin : 'standard',
      battleLayout: isBattleLayout(raw.battleLayout) ? raw.battleLayout : 'expanded',
      fieldSkin: isFieldSkin(raw.fieldSkin) ? raw.fieldSkin : 'standard',
    };
  } catch {
    return defaults();
  }
}
export function storeSave(save: Save) {
  try {
    localStorage.setItem('rva-save-v1', JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
