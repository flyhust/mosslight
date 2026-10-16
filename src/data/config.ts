export const WORLD = 4800;
export const LIMITS = { enemies: 150, projectiles: 72, orbs: 220, effects: 80 };
export type AbilityId = 'ember' | 'thorn' | 'reed';
export interface AbilityDefinition { id: AbilityId; name: string; icon: string; color: number; damage: number; cooldown: number; range: number; speed: number; description: string }
export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  ember: { id: 'ember', name: 'Ember seed', icon: 'seed', color: 0xf2c66d, damage: 26, cooldown: 0.6, range: 560, speed: 410, description: 'A glowing seed seeks the nearest creature.' },
  thorn: { id: 'thorn', name: 'Thorn ring', icon: 'ring', color: 0x9ed3a5, damage: 34, cooldown: 1.1, range: 125, speed: 0, description: 'A circle of thorns strikes every nearby creature.' },
  reed: { id: 'reed', name: 'Reed lance', icon: 'lance', color: 0xa2cddb, damage: 30, cooldown: 0.85, range: 680, speed: 530, description: 'A sharp reed pierces every creature in its path.' }
};
export const ABILITY_IDS = Object.keys(ABILITIES) as AbilityId[];
export const MAX_RANK = 5;
export const ENEMIES = [
  { name: 'Cinderbug', texture: 'beetle', hp: 24, speed: 56, damage: 12, xp: 3, radius: 13, after: 0 },
  { name: 'Gloomcap', texture: 'mushroom', hp: 52, speed: 42, damage: 17, xp: 5, radius: 16, after: 35 },
  { name: 'Briarling', texture: 'wisp', hp: 30, speed: 89, damage: 10, xp: 4, radius: 12, after: 70 }
] as const;
