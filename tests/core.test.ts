import { test } from 'node:test';
import assert from 'node:assert/strict';
import { direction, segmentDistance, random, formatTime } from '../src/core/math.ts';
import { Run } from '../src/core/run.ts';
import { choices } from '../src/core/upgrades.ts';
import { Combat } from '../src/game/combat.ts';
import { Enemies } from '../src/game/enemies.ts';
import { Pickups } from '../src/game/pickups.ts';
import { Effects } from '../src/game/effects.ts';
import { LIMITS } from '../src/data/config.ts';

// Only the renderer is stubbed. Combat, enemy, pickup and progression logic run unchanged.
function display() {
  const result = new Proxy({}, { get: () => () => result }); return result;
}
const scene = { add: { image: display, graphics: display }, cameras: { main: { width: 1280, height: 720, zoom: 1 } }, scale: { width: 1280, height: 720 } };
function running() { const r = new Run(); r.phase = 'playing'; return r; }
function arena() {
  const run = running(), enemies = new Enemies(scene as never), combat = new Combat(scene as never), effects = new Effects(scene as never);
  function enemy(x: number, y: number, health = 100) { enemies.spawn(run, { x: 2400, y: 2400 }); const e = enemies.pool.at(-1)!; Object.assign(e, { x, y, health, maxHealth: health }); return e; }
  return { run, enemies, combat, effects, enemy };
}
test('diagonal keyboard and combined input never exceed normal speed', () => {
  assert.equal(Math.hypot(...Object.values(direction(1, 0))), 1);
  assert.ok(Math.abs(Math.hypot(...Object.values(direction(1, 1))) - 1) < 1e-12);
  assert.ok(Math.abs(Math.hypot(...Object.values(direction(2, -1))) - 1) < 1e-12);
  assert.deepEqual(direction(0, 0), { x: 0, y: 0 });
});
test('pause and upgrades freeze time, invulnerability and cooldowns', () => {
  const r = running(); r.cooldowns.ember = 0.6; r.invulnerable = 0.5;
  r.tick(0.1); assert.equal(r.time, 0.1);
  for (const phase of ['paused', 'upgrade', 'gameover', 'menu'] as const) {
    r.phase = phase; const before = JSON.stringify(r); r.tick(10); assert.equal(JSON.stringify(r), before); assert.equal(r.hurt(50), false);
  }
});
test('damage grants a grace period, expires in gameplay, and ends a run at zero', () => {
  const r = running(); assert.equal(r.hurt(12), true); assert.equal(r.hurt(12), false); assert.equal(r.health, 88);
  r.tick(0.8); assert.equal(r.hurt(200), true); assert.equal(r.health, 0); assert.equal(r.phase, 'gameover');
});
test('level-up retains overflow and offers one choice at a time', () => {
  const r = running(); r.xp = 50;
  assert.equal(r.checkLevel(), true); assert.equal(r.xp, 38); assert.equal(r.level, 2);
  assert.equal(r.checkLevel(), false); r.phase = 'playing';
  assert.equal(r.checkLevel(), true); assert.equal(r.xp, 19); assert.equal(r.level, 3);
  r.phase = 'playing'; assert.equal(r.checkLevel(), false);
});
test('upgrade choices are distinct, mix abilities and stats, and never offer maxed ranks', () => {
  const rng = random(17), r = running();
  for (let i = 0; i < 50; i++) {
    const offer = choices(r, rng); assert.equal(new Set(offer.map(x => x.id)).size, 3);
    assert.ok(offer.some(x => ['ember', 'thorn', 'reed'].includes(x.id)));
    assert.ok(offer.some(x => !['ember', 'thorn', 'reed'].includes(x.id)));
  }
  r.ranks = { ember: 5, thorn: 5, reed: 5 }; r.speed = 315;
  assert.equal(choices(r, rng).length, 3); assert.ok(choices(r, rng).every(x => !['ember', 'thorn', 'reed', 'speed'].includes(x.id)));
});
test('every upgrade changes its actual run statistic or ability rank', () => {
  const r = running(), rng = random(11), seen = new Set<string>();
  for (let i = 0; i < 100; i++) for (const offer of choices(r, rng)) {
    const target = running(); target.health = 40; const before = JSON.stringify(target); offer.apply(target);
    assert.notEqual(JSON.stringify(target), before); seen.add(offer.id);
  }
  assert.equal(seen.size, 7);
  r.improve('ember'); assert.ok(r.stats('ember').damage > 26); assert.ok(r.stats('ember').cooldown < 0.6);
});
test('switching cannot unlock a gift or reset its cooldown', () => {
  const r = running(); r.switchAbility('reed'); assert.equal(r.active, 'ember');
  r.improve('reed'); r.cooldowns.reed = 0.7; r.switchAbility('ember'); r.switchAbility('reed');
  assert.equal(r.active, 'reed'); assert.equal(r.cooldowns.reed, 0.7);
});
test('swept hit test catches fast crossings and rejects misses', () => {
  assert.equal(segmentDistance({ x: 50, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }), 0);
  assert.equal(segmentDistance({ x: 50, y: 25 }, { x: 0, y: 0 }, { x: 100, y: 0 }), 25);
});
test('Ember seed fires at the nearest target and cannot damage twice', () => {
  const a = arena(); const near = a.enemy(40, 0); a.enemy(100, 0);
  a.combat.update(0.1, a.run, { x: 0, y: 0 }, a.enemies, a.effects, () => {});
  assert.equal(near.health, 74); assert.equal(a.combat.pool.filter(p => p.active).length, 0);
  a.combat.update(0.1, a.run, { x: 0, y: 0 }, a.enemies, a.effects, () => {}); assert.equal(near.health, 74);
});
test('Reed lance pierces multiple targets but hits each spawn only once', () => {
  const a = arena(); a.run.improve('reed'); const first = a.enemy(20, 0); const second = a.enemy(45, 0);
  a.combat.update(0.1, a.run, { x: 0, y: 0 }, a.enemies, a.effects, () => {});
  assert.equal(first.health, 70); assert.equal(second.health, 70);
  a.combat.update(0.01, a.run, { x: 0, y: 0 }, a.enemies, a.effects, () => {});
  assert.equal(second.health, 70); assert.equal(a.combat.pool[0].hits.size, 2);
});
test('Thorn ring damages nearby targets and leaves distant targets intact', () => {
  const a = arena(); a.run.improve('thorn'); const near = a.enemy(30, 0), far = a.enemy(250, 0);
  a.combat.update(0.016, a.run, { x: 0, y: 0 }, a.enemies, a.effects, () => {});
  assert.equal(near.health, 66); assert.equal(far.health, 100); assert.equal(a.combat.pool.length, 0);
});
test('enemy pool is capped, recycles dead enemies, and uses a fresh spawn id', () => {
  const a = arena(); for (let i = 0; i < 200; i++) a.enemies.spawn(a.run, { x: 2400, y: 2400 });
  assert.equal(a.enemies.pool.length, LIMITS.enemies); const e = a.enemies.pool[0], id = e.id;
  a.enemies.damage(e, 1000, () => {}); a.enemies.spawn(a.run, { x: 2400, y: 2400 });
  assert.equal(a.enemies.pool.length, LIMITS.enemies); assert.ok(e.id > id); assert.equal(e.active, true);
});
test('orb cap merges value without losing experience, then collects once', () => {
  const p = new Pickups(scene as never), r = running();
  for (let i = 0; i < 300; i++) p.drop(0, 0, 3);
  assert.equal(p.pool.length, LIMITS.orbs); assert.equal(p.pool.reduce((n, o) => n + o.value, 0), 900);
  p.update(0.016, { x: 0, y: 0 }, r); assert.equal(r.xp, 900);
  p.update(0.016, { x: 0, y: 0 }, r); assert.equal(r.xp, 900);
});
test('new runs reset all mutable progression and cooldown state', () => {
  const a = running(); a.ranks.ember = 5; a.cooldowns.ember = 10; a.health = 1; a.xp = 100;
  const b = new Run(); assert.equal(b.ranks.ember, 1); assert.equal(b.cooldowns.ember, 0); assert.equal(b.health, 100); assert.equal(b.xp, 0);
  assert.equal(formatTime(367), '06:07');
});
