import type Phaser from 'phaser';
import { LIMITS } from '../data/config.ts';
interface Effect { x: number; y: number; life: number; max: number; color: number; radius: number; ring: boolean }
export class Effects {
  private effects: Effect[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(20); }
  hit(x: number, y: number, color: number, radius = 14, ring = false): void {
    if (this.effects.length >= LIMITS.effects) this.effects.shift();
    this.effects.push({ x, y, color, radius, ring, life: ring ? 0.32 : 0.23, max: ring ? 0.32 : 0.23 });
  }
  update(dt: number): void {
    this.graphics.clear();
    this.effects = this.effects.filter(e => (e.life -= dt) > 0);
    for (const e of this.effects) {
      const f = e.life / e.max, size = e.radius * (1 - f * 0.6);
      if (e.ring) {
        this.graphics.lineStyle(3, e.color, f).strokeCircle(e.x, e.y, size);
        this.graphics.lineStyle(1, e.color, f * 0.4).strokeCircle(e.x, e.y, size - 8);
      } else {
        this.graphics.fillStyle(e.color, f);
        for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; this.graphics.fillRect(e.x + Math.cos(a) * size, e.y + Math.sin(a) * size, 3, 3); }
      }
    }
  }
}

