import type Phaser from 'phaser';
import { LIMITS } from '../data/config.ts';
import type { Vec } from '../core/math.ts';
import type { Run } from '../core/run.ts';
interface Orb { sprite: Phaser.GameObjects.Image; active: boolean; x: number; y: number; value: number; attracted: boolean }
export class Pickups {
  pool: Orb[] = [];
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene; }
  drop(x: number, y: number, value: number): void {
    let orb = this.pool.find(o => !o.active);
    if (!orb && this.pool.length < LIMITS.orbs) {
      orb = { sprite: this.scene.add.image(0, 0, 'orb').setScale(2).setDepth(2), active: false, x: 0, y: 0, value: 0, attracted: false }; this.pool.push(orb);
    }
    if (!orb) {
      // Merge value into the nearest existing drop instead of losing XP at the cap.
      const nearest = this.pool.reduce((a, b) => Math.hypot(a.x - x, a.y - y) < Math.hypot(b.x - x, b.y - y) ? a : b);
      nearest.value += value; nearest.sprite.setScale(2.7); return;
    }
    Object.assign(orb, { x, y, value, active: true, attracted: false }); orb.sprite.setPosition(x, y).setVisible(true).setScale(2);
  }
  update(dt: number, player: Vec, run: Run): void {
    for (const orb of this.pool) if (orb.active) {
      const dx = player.x - orb.x, dy = player.y - orb.y, d = Math.hypot(dx, dy);
      if (d < run.magnet) orb.attracted = true;
      if (orb.attracted && d > 0) { const step = Math.min(d, 430 * dt); orb.x += dx / d * step; orb.y += dy / d * step; }
      orb.sprite.setPosition(orb.x, orb.y).setAlpha(0.8 + Math.sin(run.time * 4 + orb.x) * 0.2);
      if (Math.hypot(player.x - orb.x, player.y - orb.y) < 20) { run.xp += orb.value; orb.active = false; orb.sprite.setVisible(false); }
    }
  }
}

