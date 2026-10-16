import type Phaser from 'phaser';
import { ENEMIES, LIMITS, WORLD } from '../data/config.ts';
import { clamp, type Vec } from '../core/math.ts';
import type { Run } from '../core/run.ts';
export interface Enemy { sprite: Phaser.GameObjects.Image; active: boolean; id: number; x: number; y: number; health: number; maxHealth: number; speed: number; damage: number; xp: number; radius: number; flash: number }
export class Enemies {
  pool: Enemy[] = [];
  private scene: Phaser.Scene;
  private spawnIn = 0.3;
  private nextId = 1;
  constructor(scene: Phaser.Scene) { this.scene = scene; }
  spawn(run: Run, target: Vec): void {
    let e = this.pool.find(e => !e.active);
    if (!e) {
      if (this.pool.length >= LIMITS.enemies) return;
      e = { sprite: this.scene.add.image(0, 0, 'beetle').setScale(3).setDepth(5), active: false, id: 0, x: 0, y: 0, health: 0, maxHealth: 0, speed: 0, damage: 0, xp: 0, radius: 0, flash: 0 };
      this.pool.push(e);
    }
    const available = ENEMIES.filter(d => d.after <= run.time);
    const def = available[Math.floor(Math.random() * available.length)];
    const camera = this.scene.cameras.main;
    // Intersect a random ray with the visible rectangle. No corner bias or center spawns.
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const halfW = camera.width / camera.zoom / 2 + 45, halfH = camera.height / camera.zoom / 2 + 45;
    const distance = Math.min(halfW / Math.max(0.001, Math.abs(dx)), halfH / Math.max(0.001, Math.abs(dy)));
    e.x = clamp(target.x + dx * distance, 25, WORLD - 25); e.y = clamp(target.y + dy * distance, 25, WORLD - 25);
    // A bounded-world edge must not put a new creature on top of the player.
    if (Math.hypot(e.x - target.x, e.y - target.y) < 170) { e.sprite.setVisible(false); return; }
    const scale = 1 + Math.min(4, run.time / 180);
    Object.assign(e, { active: true, id: this.nextId++, health: def.hp * scale, maxHealth: def.hp * scale, speed: def.speed * (1 + Math.min(0.55, run.time / 420)), damage: def.damage, xp: def.xp, radius: def.radius, flash: 0 });
    e.sprite.setTexture(def.texture).setPosition(e.x, e.y).setVisible(true).setAlpha(1).clearTint();
  }
  update(dt: number, run: Run, target: Vec, hit: (amount: number) => void): void {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn(run, target);
      if (run.time > 90) this.spawn(run, target);
      this.spawnIn = Math.max(0.26, 1.05 - run.time / 180);
    }
    const maxDistance = Math.max(this.scene.scale.width, this.scene.scale.height) / this.scene.cameras.main.zoom + 400;
    for (const e of this.pool) {
      if (!e.active) continue;
      const dx = target.x - e.x, dy = target.y - e.y, d = Math.hypot(dx, dy);
      if (d > maxDistance) { e.active = false; e.sprite.setVisible(false); continue; }
      if (d > 1) { e.x += dx / d * e.speed * dt; e.y += dy / d * e.speed * dt; }
      e.flash = Math.max(0, e.flash - dt);
      e.sprite.setPosition(e.x, e.y + Math.sin(run.time * 9 + e.id) * 1.2).setFlipX(dx < 0);
      if (e.flash > 0) e.sprite.setTintFill(0xfff2cf); else e.sprite.clearTint();
      if (Math.hypot(target.x - e.x, target.y - e.y) < e.radius + 13) {
        hit(e.damage);
        if (d > 0) { e.x -= dx / d * 8; e.y -= dy / d * 8; }
      }
      if (run.phase === 'gameover') break;
    }
  }
  nearest(target: Vec, range: number): Enemy | undefined {
    let best: Enemy | undefined, distance = range;
    for (const e of this.pool) if (e.active) { const d = Math.hypot(e.x - target.x, e.y - target.y); if (d < distance) { distance = d; best = e; } }
    return best;
  }
  damage(e: Enemy, amount: number, onDeath: (e: Enemy) => void): void {
    if (!e.active) return;
    e.health -= amount; e.flash = 0.1;
    if (e.health <= 0) { e.active = false; e.sprite.setVisible(false); onDeath(e); }
  }
}

