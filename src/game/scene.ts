import Phaser from 'phaser';
import { Run } from '../core/run.ts';
import { choices, type Upgrade } from '../core/upgrades.ts';
import { ABILITY_IDS, WORLD } from '../data/config.ts';
import { createAssets, createWorld } from './assets.ts';
import { InputController } from './input.ts';
import { Player } from './player.ts';
import { Enemies, type Enemy } from './enemies.ts';
import { Combat } from './combat.ts';
import { Pickups } from './pickups.ts';
import { Effects } from './effects.ts';
import { UI } from '../ui/ui.ts';
export class HollowScene extends Phaser.Scene {
  run!: Run;
  player!: Player;
  enemies!: Enemies;
  combat!: Combat;
  pickups!: Pickups;
  private effects!: Effects;
  private controls!: InputController;
  private ui!: UI;
  private offers: Upgrade[] = [];
  private hudIn = 0;
  constructor() { super('hollow'); }
  create(data: { playing?: boolean }): void {
    this.run = new Run(); this.run.phase = data.playing ? 'playing' : 'menu'; this.offers = []; this.hudIn = 0;
    createAssets(this); createWorld(this);
    (document.querySelector('#ui') as HTMLElement).style.setProperty('--spirit', `url("${this.textures.getBase64('player')}")`);
    this.player = new Player(this); this.enemies = new Enemies(this); this.combat = new Combat(this); this.pickups = new Pickups(this); this.effects = new Effects(this);
    if (!data.playing) { this.player.sprite.setVisible(false); this.player.shadow.setVisible(false); this.player.aura.setVisible(false); }
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD, WORLD).startFollow(this.player.sprite, true, 0.09, 0.09).setRoundPixels(true);
    camera.centerOn(this.player.x, this.player.y);
    const resize = () => { camera.setZoom(this.scale.width < 700 ? 0.85 : 1); };
    resize(); this.scale.on('resize', resize);
    this.ui = new UI(document.querySelector('#ui')!, {
      start: () => this.scene.restart({ playing: true }), menu: () => this.scene.restart({ playing: false }),
      pause: () => this.pause(), resume: () => { if (this.run.phase === 'paused') { this.run.phase = 'playing'; this.controls.reset(); this.refresh(); } },
      ability: id => { this.run.switchAbility(id); this.refresh(); },
      upgrade: id => {
        if (this.run.phase !== 'upgrade') return;
        const chosen = this.offers.find(u => u.id === id); if (!chosen) return;
        chosen.apply(this.run); this.run.phase = 'playing'; this.offers = []; this.controls.reset();
        this.checkLevel(); this.refresh();
      },
    });
    this.controls = new InputController(document.querySelector('#game')!, this.ui.stick, key => {
      if (key === 'escape') { if (this.run.phase === 'paused') { this.run.phase = 'playing'; this.controls.reset(); this.refresh(); } else this.pause(); }
      const id = ABILITY_IDS[Number(key) - 1]; if (id) { this.run.switchAbility(id); this.refresh(); }
    }, () => this.pause());
    // All per-run listeners belong to this scene and are removed before restart.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.controls.destroy(); this.ui.destroy(); this.scale.off('resize', resize); });
    this.refresh();
  }
  private pause(): void {
    if (this.run.phase !== 'playing') return;
    this.run.phase = 'paused'; this.controls.reset(); this.refresh();
  }
  private refresh(): void { this.ui.update(this.run, this.offers); }
  private checkLevel(): void {
    if (this.run.checkLevel()) { this.offers = choices(this.run); this.controls.reset(); }
  }
  private defeated = (enemy: Enemy): void => { this.run.kills++; this.pickups.drop(enemy.x, enemy.y, enemy.xp); this.effects.hit(enemy.x, enemy.y, 0x91d9c0, 22); };
  update(_time: number, delta: number): void {
    if (!this.run || this.run.phase !== 'playing') return;
    const dt = Math.min(delta / 1000, 0.05);
    this.run.tick(dt); this.player.update(dt, this.controls.vector, this.run);
    this.enemies.update(dt, this.run, this.player, amount => { if (this.run.hurt(amount)) this.ui.flash(); });
    if (this.run.health <= 0) { this.controls.reset(); this.refresh(); return; }
    this.combat.update(dt, this.run, this.player, this.enemies, this.effects, this.defeated);
    this.pickups.update(dt, this.player, this.run); this.effects.update(dt); this.checkLevel();
    this.hudIn -= dt;
    if (this.hudIn <= 0 || this.run.phase !== 'playing') { this.refresh(); this.hudIn = 0.08; }
  }
}
