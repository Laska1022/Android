import { isLanguageChoice, type LanguageChoice } from '../i18n/language';
import type { CampaignDifficulty } from './engine';
import { isRobotSkin, isAlienSkin, type RobotSkin, type AlienSkin } from './skins';
import { isBattleLayout, isFieldSkin, type BattleLayout, type FieldSkin } from './field';

export interface Save {
  language: LanguageChoice;
  unlocked: number;
  best: number;
  stars: number[];
  muted: boolean;
  reducedMotion: boolean | null;
  difficulty: CampaignDifficulty;
  robotSkin: RobotSkin;
  alienSkin: AlienSkin;
  battleLayout: BattleLayout;
  fieldSkin: FieldSkin;
}
type Progress = Pick<Save, 'unlocked' | 'best' | 'stars'>;
export type Preferences = Omit<Save, keyof Progress>;
const SAVE_KEY = 'rva-save-v1';

const defaults = (): Save => ({
  language: 'system',
  unlocked: 0,
  best: 0,
  stars: [0, 0, 0, 0, 0],
  muted: false,
  reducedMotion: null,
  difficulty: 'cadet',
  robotSkin: 'standard',
  alienSkin: 'standard',
  battleLayout: 'expanded',
  fieldSkin: 'turf',
});
function parseSave(value: string | null): Save {
  try {
    const raw = JSON.parse(value ?? 'null');
    if (!raw || typeof raw !== 'object') return defaults();
    return {
      language: isLanguageChoice(raw.language) ? raw.language : 'system',
      unlocked: Number.isInteger(raw.unlocked) ? Math.max(0, Math.min(4, raw.unlocked)) : 0,
      best: Number.isFinite(raw.best) ? Math.max(0, raw.best) : 0,
      stars: Array.from({ length: 5 }, (_, i) =>
        Number.isInteger(raw.stars?.[i]) ? Math.max(0, Math.min(3, raw.stars[i])) : 0,
      ),
      muted: raw.muted === true,
      reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : null,
      difficulty: raw.difficulty === 'veteran' ? 'veteran' : 'cadet',
      robotSkin: isRobotSkin(raw.robotSkin) ? raw.robotSkin : 'standard',
      alienSkin: isAlienSkin(raw.alienSkin) ? raw.alienSkin : 'standard',
      battleLayout: isBattleLayout(raw.battleLayout) ? raw.battleLayout : 'expanded',
      // Campaigns saved before field skins used the original alloy deck.
      fieldSkin: isFieldSkin(raw.fieldSkin) ? raw.fieldSkin : 'standard',
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

interface SaveJournal {
  imported: string | null;
  revision: number;
  save: Save;
}

function journalRevision(raw: string | null): number {
  try {
    const revision = JSON.parse(raw ?? 'null')?.journalRevision;
    return Number.isSafeInteger(revision) && revision > 0 ? revision : 0;
  } catch {
    return 0;
  }
}

function storeWithIndexedDB(merge: (latest: Save) => Save): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('rva-save-lock', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('writers');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('writers', 'readwrite');
      const writers = transaction.objectStore('writers');
      const read = writers.get(0);
      read.onsuccess = () => {
        try {
          const previous: SaveJournal | undefined = read.result;
          const local = localStorage.getItem(SAVE_KEY);
          const revision = journalRevision(local);
          // Another tab can still see the original v1 record or an earlier mirror.
          // A fresh unversioned record from a legacy or Web Locks writer starts a new import.
          const useJournal =
            previous &&
            (local === previous.imported || (revision > 0 && revision <= previous.revision));
          const save = merge(useJournal ? previous.save : parseSave(local));
          const next: SaveJournal = {
            imported: useJournal ? previous.imported : local,
            revision: Math.max(previous?.revision ?? 0, revision) + 1,
            save,
          };
          writers.put(next, 0).onsuccess = () => {
            try {
              localStorage.setItem(
                SAVE_KEY,
                JSON.stringify({ ...save, journalRevision: next.revision }),
              );
            } catch {
              transaction.abort();
            }
          };
        } catch {
          transaction.abort();
        }
      };
      transaction.oncomplete = transaction.onabort = (event) => {
        db.close();
        resolve(event.type === 'complete');
      };
    };
  });
}

export async function storeSave(
  progress: Progress,
  preferences: Partial<Preferences>,
): Promise<boolean> {
  function merge(latest: Save): Save {
    return {
      ...latest,
      ...preferences,
      unlocked: Math.max(latest.unlocked, progress.unlocked),
      best: Math.max(latest.best, progress.best),
      stars: latest.stars.map((stars, sector) => Math.max(stars, progress.stars[sector] ?? 0)),
    };
  }

  try {
    if (navigator.locks) {
      return await navigator.locks.request(SAVE_KEY, () => {
        const latest = parseSave(localStorage.getItem(SAVE_KEY));
        localStorage.setItem(SAVE_KEY, JSON.stringify(merge(latest)));
        return true;
      });
    }
    return await storeWithIndexedDB(merge);
  } catch {
    return false;
  }
}
