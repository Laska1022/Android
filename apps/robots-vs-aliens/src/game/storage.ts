import type { CampaignDifficulty } from './engine';
import { isRobotSkin, isAlienSkin, type RobotSkin, type AlienSkin } from './skins';

export interface Save {
  unlocked: number;
  best: number;
  stars: number[];
  muted: boolean;
  reducedMotion: boolean;
  difficulty: CampaignDifficulty;
  robotSkin: RobotSkin;
  alienSkin: AlienSkin;
}
type Progress = Pick<Save, 'unlocked' | 'best' | 'stars'>;
export type Preferences = Omit<Save, keyof Progress>;
const SAVE_KEY = 'rva-save-v1';

const defaults = (): Save => ({
  unlocked: 0,
  best: 0,
  stars: [0, 0, 0, 0, 0],
  muted: false,
  reducedMotion: false,
  difficulty: 'cadet',
  robotSkin: 'standard',
  alienSkin: 'standard',
});
function parseSave(value: string | null): Save {
  try {
    const raw = JSON.parse(value ?? 'null');
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
    };
  } catch {
    return defaults();
  }
}

export function loadSave(): Save {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return defaults();
  }
}

// On origins without Web Locks, IndexedDB serializes readwrite transactions on the same store.
// The save itself stays in localStorage so installed v1 games can keep reading it.
function withIndexedDBLock(write: () => boolean): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('rva-save-lock', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('writers');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('writers', 'readwrite');
      let saved = false;
      // The request callback runs only after this transaction has exclusive access.
      transaction.objectStore('writers').get(0).onsuccess = () => {
        saved = write();
      };
      transaction.oncomplete = transaction.onabort = () => {
        db.close();
        resolve(saved);
      };
    };
  });
}

export async function storeSave(
  progress: Progress,
  preferences: Partial<Preferences>,
): Promise<boolean> {
  function write() {
    try {
      const latest = parseSave(localStorage.getItem(SAVE_KEY));
      const merged: Save = {
        ...latest,
        ...preferences,
        unlocked: Math.max(latest.unlocked, progress.unlocked),
        best: Math.max(latest.best, progress.best),
        stars: latest.stars.map((stars, sector) => Math.max(stars, progress.stars[sector] ?? 0)),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
      return true;
    } catch {
      return false;
    }
  }

  try {
    if (navigator.locks) return await navigator.locks.request(SAVE_KEY, write);
    return await withIndexedDBLock(write);
  } catch {
    return false;
  }
}
