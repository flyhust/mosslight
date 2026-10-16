import type Phaser from 'phaser';
import { clamp, type Vec } from '../core/math.ts';
import type { Run } from '../core/run.ts';
import { WORLD } from '../data/config.ts';
export class Player {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  aura: Phaser.GameObjects.Ellipse;
  x = WORLD / 2; y = WORLD / 2;
  constructor(scene: Phaser.Scene) {
    this.aura = scene.add.ellipse(this.x, this.y, 110, 110, 0xa9d99a, 0.035).setDepth(-5);
    this.shadow = scene.add.ellipse(this.x, this.y + 22, 40, 15, 0x071512, 0.5).setDepth(0);
    this.sprite = scene.add.image(this.x, this.y, 'player').setScale(3).setDepth(10);
  }
  update(dt: number, input: Vec, run: Run): void {
    this.x = clamp(this.x + input.x * run.speed * dt, 28, WORLD - 28);
    this.y = clamp(this.y + input.y * run.speed * dt, 28, WORLD - 28);
    const moving = Math.abs(input.x) + Math.abs(input.y) > 0.01;
    this.sprite.setPosition(this.x, this.y + Math.sin(run.time * (moving ? 15 : 3)) * (moving ? 2 : 1));
    if (input.x) this.sprite.setFlipX(input.x < 0);
    this.sprite.setAlpha(run.invulnerable > 0 && Math.floor(run.time * 18) % 2 ? 0.4 : 1);
    this.shadow.setPosition(this.x, this.y + 22); this.aura.setPosition(this.x, this.y);
  }
}

