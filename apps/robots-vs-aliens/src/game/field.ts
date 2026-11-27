export const BATTLE_LAYOUTS = { expanded: 'Expanded lanes', classic: 'Classic console' } as const;
export type BattleLayout = keyof typeof BATTLE_LAYOUTS;
export const FIELD_SKINS = {
  standard: 'Sector alloy',
  foundry: 'Copper foundry',
  polar: 'Polar relay',
} as const;
export type FieldSkin = keyof typeof FIELD_SKINS;
export const isFieldSkin = (value: unknown): value is FieldSkin =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(FIELD_SKINS, value);
export const isBattleLayout = (value: unknown): value is BattleLayout =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(BATTLE_LAYOUTS, value);

export const fieldTextures = {
  foundry: new URL('../assets/fields/copper-foundry.webp', import.meta.url).href,
  polar: new URL('../assets/fields/polar-relay.webp', import.meta.url).href,
};
