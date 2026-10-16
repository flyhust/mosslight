import Phaser from 'phaser';
import { random } from '../core/math.ts';
import { WORLD } from '../data/config.ts';

const palette: Record<string, string> = { '.': '', a: '#101f1b', b: '#315c47', c: '#619b69', d: '#a9d99a', e: '#e9e4ab', f: '#f4c66d', g: '#bc763e', h: '#653d2e', i: '#563f62', j: '#926a9e', k: '#c5a1c1', l: '#57716b', m: '#869586', n: '#284338', o: '#91d9c0', p: '#d3f8d4' };
const sprites: Record<string, string[]> = {
  player: ['.......dd.......','......dccd......','......dcccd.....','.....dcccccd....','....dcccccccd...','...dccbbbcccd...','...dcbaaaabccd..','..dccaaaaaabcd..','..dcaaaea eaacd..'.replaceAll(' ', 'a'),'..dcaaafaafacd..','...dbaaaaaabd...','...dcbbbbbbcd...','..bbcccddccbbb..','..d.bcccccb.d...','....bcccccb.....','....bbccbb......','...aa....aa.....'],
  beetle: ['................','...h......h.....','....h....h......','...hggggggh.....','..hggffffggh....','.hggfffgggggh...','..hggfgggggh....','hhggghhgggghhh..','..hggghggggh....','.hhggghgggghh...','...haaaaaah.....','..haaafaafah....','...haaaaah......','..h.h..h.h......'],
  mushroom: ['......iiii......','....iijjjjii....','...ijjkkjjjji...','..ijjkkjjjjjji..','.ijjjjjjjjkkjji.','ijjjkkjjjjkkjjji','ijjjkkjjjjjjjjji','.iiiiiiiiiiiiii.','....ihaaaahi....','.....aeafea.....','.....heeeeh.....','....hheeeehh....','...hh.hhh.hhh...'],
  wisp: ['.......o........','...o..ooo.......','....oonnno......','...onnnbnno.....','..onnbbbbnno....','.onnbabbaanno...','..nnaaafaanno...','...nnaaanno.....','....onbnno......','...onno.........','..oo..o.........'],
  orb: ['...o...','..opo..','.opppo.','opppppo','.opppo.','..opo..','...o...'],
  rock: ['......llllll.......','....llmmmmmlll.....','..llmmmmlmmmmmll...','.lmmmmmlllmmmmmmll.','lmmmcccllllmmmmmmml','lmmcccccllllmmmmml.','llcccccclllllmmmll.','.llccclllllllllll..','..llllllllllllll...'],
  flowers: ['...j..........k...','..jkj........jkj..','...j..........j...','...b....e.....b...','...b...efe....b...','..bb....e.....bb..','........b.........','.......bb.........'],
  fungi: ['...ggg...........','..gffgg..........','.ggffggg.........','..hhhhh....ggg...','...ee.....gffgg..','...eh.....hhhhh..','..hee......ee....','...........eh....'],
  stump: ['....hhhhhh....','..hhgggggghh..','.hggghhhggggh.','.hgggghgggggh.','..hggggggggh..','..hghhhhhhgh..','..hghhhhhggh..','.hhghhhhhhggh.','hhghhhhhhhhghh'],
};
export function createAssets(scene: Phaser.Scene): void {
  for (const [key, rows] of Object.entries(sprites)) {
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, Math.max(...rows.map(r => r.length)), rows.length)!;
    const ctx = texture.context;
    rows.forEach((row, y) => [...row].forEach((p, x) => { if (palette[p]) { ctx.fillStyle = palette[p]; ctx.fillRect(x, y, 1, 1); } }));
    texture.refresh();
  }
  if (!scene.textures.exists('ground')) {
    const texture = scene.textures.createCanvas('ground', 192, 192)!;
    const ctx = texture.context, rng = random(42);
    ctx.fillStyle = '#1b3027'; ctx.fillRect(0, 0, 192, 192);
    for (let i = 0; i < 950; i++) {
      const x = Math.floor(rng() * 96) * 2, y = Math.floor(rng() * 96) * 2;
      ctx.fillStyle = ['#1d342a', '#21372c', '#243d2d', '#193026', '#304531'][Math.floor(rng() * 5)];
      ctx.fillRect(x, y, 2 + Math.floor(rng() * 3) * 2, 2);
      if (i % 8 === 0) ctx.fillRect(x + 2, y - 4, 2, 6);
    }
    texture.refresh();
    const tree = scene.textures.createCanvas('tree', 48, 64)!;
    const t = tree.context;
    t.fillStyle = '#0c211c'; t.fillRect(20, 30, 9, 34); t.fillStyle = '#3b3b2a'; t.fillRect(22, 35, 4, 27);
    for (let y = 0; y < 48; y += 6) {
      const w = Math.min(44, 9 + y * 0.7), x = Math.round(24 - w / 2);
      t.fillStyle = y % 12 ? '#163c2e' : '#204534'; t.fillRect(x, y + 3, w, 8);
      t.fillStyle = '#31553a'; t.fillRect(x + 3, y + 3, w / 3, 3);
      t.fillStyle = '#102e26'; t.fillRect(x + w - 7, y + 7, 9, 4);
    }
    tree.refresh();
  }
}
export function createWorld(scene: Phaser.Scene): void {
  scene.add.tileSprite(0, 0, WORLD, WORLD, 'ground').setOrigin(0).setDepth(-100);
  const rng = random(884), center = WORLD / 2;
  const ground = scene.add.graphics().setDepth(-90);
  // A weathered ritual circle marks the starting clearing without affecting movement.
  ground.lineStyle(3, 0x7c8660, 0.22).strokeCircle(center, center, 116);
  ground.lineStyle(1, 0xb8be8e, 0.15).strokeCircle(center, center, 125);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ground.fillStyle(0x708063, 0.5).fillRect(center + Math.cos(a) * 120 - 3, center + Math.sin(a) * 120 - 3, 6, 6);
  }
  for (let i = 0; i < 1350; i++) {
    const x = 50 + rng() * (WORLD - 100), y = 50 + rng() * (WORLD - 100);
    const nearStart = Math.hypot(x - center, y - center) < 175;
    if (nearStart) continue;
    const roll = rng(), key = roll < 0.15 ? 'tree' : roll < 0.4 ? 'rock' : roll < 0.72 ? 'flowers' : roll < 0.91 ? 'fungi' : 'stump';
    scene.add.image(x, y, key).setScale(key === 'tree' ? 3 : 2 + Math.floor(rng() * 2)).setAlpha(key === 'tree' ? 0.75 : 0.8).setDepth(-50).setFlipX(rng() > 0.5);
  }
  ground.lineStyle(14, 0x79936c, 0.45).strokeRect(12, 12, WORLD - 24, WORLD - 24);
}
