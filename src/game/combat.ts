import type Phaser from 'phaser';
import { LIMITS } from '../data/config.ts';
import { segmentDistance, type Vec } from '../core/math.ts';
import type { Run } from '../core/run.ts';
import type { Enemies, Enemy } from './enemies.ts';
import type { Effects } from './effects.ts';
interface Projectile { active: boolean; x: number; y: number; vx: number; vy: number; life: number; damage: number; piercing: boolean; color: number; hits: Set<number> }
export class Combat {
  pool: Projectile[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(12); }
  update(dt: number, run: Run, player: Vec, enemies: Enemies, effects: Effects, onDeath: (e: Enemy) => void): void {
    const ability = run.stats(run.active);
    if (run.cooldowns[run.active] <= 0) {
      const target = enemies.nearest(player, ability.range);
      if (target) {
        run.cooldowns[run.active] = ability.cooldown;
        if (run.active === 'thorn') {
          effects.hit(player.x, player.y, ability.color, ability.range, true);
          for (const e of enemies.pool) if (e.active && Math.hypot(e.x - player.x, e.y - player.y) <= ability.range + e.radius) {
            enemies.damage(e, ability.damage, onDeath); effects.hit(e.x, e.y, ability.color);
          }
        } else {
          let p = this.pool.find(p => !p.active);
          if (!p && this.pool.length < LIMITS.projectiles) { p = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, damage: 0, piercing: false, color: 0, hits: new Set() }; this.pool.push(p); }
          if (p) {
            const a = Math.atan2(target.y - player.y, target.x - player.x);
            Object.assign(p, { active: true, x: player.x, y: player.y, vx: Math.cos(a) * ability.speed, vy: Math.sin(a) * ability.speed, life: ability.range / ability.speed, damage: ability.damage, piercing: run.active === 'reed', color: ability.color }); p.hits.clear();
          }
        }
      }
    }
    this.graphics.clear();
    for (const p of this.pool) {
      if (!p.active) continue;
      const from = { x: p.x, y: p.y }, step = Math.min(dt, p.life);
      p.x += p.vx * step; p.y += p.vy * step; p.life -= dt;
      const targets = enemies.pool.filter(e => e.active && !p.hits.has(e.id) && segmentDistance(e, from, p) < e.radius + 5);
      targets.sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y));
      for (const e of targets) {
        p.hits.add(e.id); enemies.damage(e, p.damage, onDeath); effects.hit(e.x, e.y, p.color);
        if (!p.piercing) { p.active = false; break; }
      }
      if (p.life <= 0) p.active = false;
      if (!p.active) continue;
      const speed = Math.hypot(p.vx, p.vy), len = p.piercing ? 27 : 13;
      this.graphics.lineStyle(p.piercing ? 3 : 4, p.color, 0.4).lineBetween(p.x, p.y, p.x - p.vx / speed * len, p.y - p.vy / speed * len);
      this.graphics.fillStyle(p.color, 0.12).fillCircle(p.x, p.y, 11);
      this.graphics.fillStyle(0xfff3cd).fillRect(p.x - 2, p.y - 2, 5, 5);
    }
  }
}

