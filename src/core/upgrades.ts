import { ABILITIES, ABILITY_IDS, MAX_RANK, type AbilityId } from '../data/config.ts';
import type { Run } from './run.ts';
export interface Upgrade { id: string; title: string; kind: string; icon: string; description: string; effect: string; apply: (run: Run) => void }
function abilityUpgrade(run: Run, id: AbilityId): Upgrade {
  const ability = ABILITIES[id], rank = run.ranks[id];
  return { id, title: ability.name, kind: rank ? `ABILITY · RANK ${rank + 1}` : 'NEW ABILITY', icon: ability.icon,
    description: rank ? 'Nurture this gift. Let its light reach further.' : ability.description,
    effect: rank ? '+28% base damage · faster casts · more reach' : `Unlock & equip · ${ability.damage} damage`, apply: r => r.improve(id) };
}
export function choices(run: Run, rng: () => number = Math.random): Upgrade[] {
  const abilities = ABILITY_IDS.filter(id => run.ranks[id] < MAX_RANK).map(id => abilityUpgrade(run, id));
  const stats: Upgrade[] = [
    { id: 'power', title: 'Wildfire heart', kind: 'SPIRIT', icon: 'heart', description: 'A brighter flame burns within you.', effect: '+18% damage to every ability', apply: r => { r.damage *= 1.18; } },
    { id: 'vitality', title: 'Deep roots', kind: 'VITALITY', icon: 'root', description: 'Borrow a little resilience from the old forest.', effect: '+20 max health · restore 35 health', apply: r => { r.maxHealth += 20; r.health = Math.min(r.maxHealth, r.health + 35); } },
    { id: 'magnet', title: 'Firefly kin', kind: 'GATHERING', icon: 'spark', description: 'The scattered light finds its way back to you.', effect: '+35 crystal collection radius', apply: r => { r.magnet += 35; } },
  ];
  if (run.speed < 315) stats.push({ id: 'speed', title: 'Lightfoot', kind: 'MOVEMENT', icon: 'leaf', description: 'Drift through the hollow on lighter feet.', effect: '+20 movement speed (up to 315)', apply: r => { r.speed = Math.min(315, r.speed + 20); } });
  const shuffle = <T>(items: T[]) => { for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items; };
  // Always offer an ability and a stat while both are available; the third is random.
  shuffle(abilities); shuffle(stats);
  const selected: Upgrade[] = abilities.length ? [abilities.shift()!, stats.shift()!] : [stats.shift()!];
  return shuffle([...selected, ...shuffle([...abilities, ...stats]).slice(0, 3 - selected.length)]);
}
