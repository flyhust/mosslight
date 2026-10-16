import { ABILITIES, MAX_RANK, type AbilityId } from '../data/config.ts';
export type Phase = 'menu' | 'playing' | 'upgrade' | 'paused' | 'gameover';
export class Run {
  phase: Phase = 'menu';
  time = 0; kills = 0; level = 1; xp = 0; health = 100; maxHealth = 100;
  speed = 195; damage = 1; magnet = 78; invulnerable = 0;
  active: AbilityId = 'ember';
  ranks: Record<AbilityId, number> = { ember: 1, thorn: 0, reed: 0 };
  cooldowns: Record<AbilityId, number> = { ember: 0, thorn: 0, reed: 0 };
  get requiredXp(): number { return 12 + (this.level - 1) * 7; }
  stats(id: AbilityId) {
    const d = ABILITIES[id], rank = Math.max(1, this.ranks[id]);
    return { ...d, damage: d.damage * (1 + (rank - 1) * 0.28) * this.damage, cooldown: d.cooldown * (1 - (rank - 1) * 0.07), range: d.range * (1 + (rank - 1) * 0.06) };
  }
  tick(dt: number): void {
    if (this.phase !== 'playing') return;
    this.time += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    for (const id of Object.keys(this.cooldowns) as AbilityId[]) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
  }
  hurt(amount: number): boolean {
    if (this.phase !== 'playing' || this.invulnerable > 0) return false;
    this.health = Math.max(0, this.health - amount); this.invulnerable = 0.75;
    if (this.health === 0) this.phase = 'gameover';
    return true;
  }
  checkLevel(): boolean {
    if (this.phase !== 'playing' || this.xp < this.requiredXp) return false;
    this.xp -= this.requiredXp; this.level++; this.phase = 'upgrade'; return true;
  }
  switchAbility(id: AbilityId): void { if (this.phase === 'playing' && this.ranks[id] > 0) this.active = id; }
  improve(id: AbilityId): void { this.ranks[id] = Math.min(MAX_RANK, this.ranks[id] + 1); this.active = id; }
}
