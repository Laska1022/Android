import type { BotKind, EnemyKind } from './engine';

export const ROBOT_SKINS = { standard: 'Factory alloy', cobalt: 'Cobalt ceramic' } as const;
export const ALIEN_SKINS = { standard: 'Native carapace', ember: 'Ember brood' } as const;
export type RobotSkin = keyof typeof ROBOT_SKINS;
export type AlienSkin = keyof typeof ALIEN_SKINS;
export type UnitSkin = RobotSkin | AlienSkin;

const variants = import.meta.glob<string>('../assets/skins/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function isRobotSkin(value: unknown): value is RobotSkin {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ROBOT_SKINS, value);
}

export function isAlienSkin(value: unknown): value is AlienSkin {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ALIEN_SKINS, value);
}

export function unitArtwork(kind: BotKind | EnemyKind, skin: UnitSkin = 'standard') {
  const variant = variants[`../assets/skins/${skin}-${kind}.webp`];
  if (variant) return variant;
  return new URL(`../assets/units/${kind}.webp`, import.meta.url).href;
}
