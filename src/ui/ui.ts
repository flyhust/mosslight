import { ABILITIES, ABILITY_IDS, type AbilityId } from '../data/config.ts';
import { formatTime } from '../core/math.ts';
import type { Run, Phase } from '../core/run.ts';
import type { Upgrade } from '../core/upgrades.ts';
import { icon } from './icons.ts';
interface Actions { start: () => void; pause: () => void; resume: () => void; menu: () => void; upgrade: (id: string) => void; ability: (id: AbilityId) => void }
export class UI {
  private root: HTMLElement;
  private abort = new AbortController();
  private phase: Phase | null = null;
  private upgradeLevel = 0;
  private modal: HTMLElement;
  private actions: Actions;
  constructor(root: HTMLElement, actions: Actions) {
    this.root = root; this.actions = actions;
    root.innerHTML = `
      <div class="vignette"></div>
      <header class="topbar"><div class="brand"><span class="brand-name">Mosslight<span class="brand-leaf">${icon('leaf')}</span></span><span class="place"><i></i> THE HOLLOW <i></i></span></div>
      <div class="timer hud"><small>SURVIVED</small><strong id="time">00:00</strong></div>
      <div class="top-actions"><span class="run-tag">A SURVIVAL ROGUELITE</span><button class="icon-button hud" data-action="pause" aria-label="Pause game">${icon('pause')}</button></div></header>
      <div class="health hud"><div class="health-label"><span>${icon('heart')} VITALITY</span><span id="health-value">100 / 100</span></div><div class="health-track" role="progressbar" aria-label="Health" aria-valuemin="0"><div id="health-fill"></div></div></div>
      <div class="run-info hud"><span id="kills">0</span> CREATURES DISPELLED<span class="threat" id="threat">THE HOLLOW STIRS</span></div>
      <section class="loadout hud" aria-label="Abilities and experience"><div class="xp-label"><span id="level">LEVEL 01</span><span id="xp-value">0 / 12 XP</span></div><div class="xp-track" role="progressbar" aria-label="Experience" aria-valuemin="0"><div id="xp-fill"></div></div><div class="slots">${ABILITY_IDS.map((id, i) => `<button class="slot" data-ability="${id}" aria-label="${ABILITIES[id].name}"><span class="slot-number">${i + 1}</span><span class="ability-icon">${icon(ABILITIES[id].icon)}</span><span class="rank" id="rank-${id}"></span><span class="ability-name">${ABILITIES[id].name}</span></button>`).join('')}</div><div class="loadout-caption">SELECT A GIFT · IT ATTACKS AUTOMATICALLY</div></section>
      <footer><div class="control-hint"><span class="desktop-hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Move</span><i></i><kbd>1–3</kbd><span>Switch gift</span></span><span class="touch-hint">Drag anywhere to move</span></div><span class="motto">Keep the light alive. <span>✦</span></span></footer>
      <div id="joystick"><span></span></div><div id="modal-layer"></div><div id="damage-flash"></div>`;
    this.modal = root.querySelector('#modal-layer')!;
    root.addEventListener('click', e => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      if (button.dataset.action) { const action = button.dataset.action as keyof Pick<Actions, 'start' | 'pause' | 'resume' | 'menu'>; this.actions[action](); }
      if (button.dataset.upgrade) this.actions.upgrade(button.dataset.upgrade);
      if (button.dataset.ability) this.actions.ability(button.dataset.ability as AbilityId);
      button.blur();
    }, { signal: this.abort.signal });
    root.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !this.modal.childElementCount) return;
      const buttons = [...this.modal.querySelectorAll<HTMLButtonElement>('button')];
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }, { signal: this.abort.signal });
  }
  get stick(): HTMLElement { return this.root.querySelector('#joystick')!; }
  private text(id: string, value: string): void { this.root.querySelector(`#${id}`)!.textContent = value; }
  update(run: Run, upgrades: Upgrade[]): void {
    this.root.dataset.phase = run.phase;
    this.text('time', formatTime(run.time)); this.text('health-value', `${Math.ceil(run.health)} / ${run.maxHealth}`);
    this.text('kills', String(run.kills)); this.text('level', `LEVEL ${String(run.level).padStart(2, '0')}`);
    this.text('xp-value', `${run.xp} / ${run.requiredXp} XP`);
    this.text('threat', run.time > 90 ? 'THE WILD CLOSES IN' : run.time > 35 ? 'SHADOWS GATHER' : 'THE HOLLOW STIRS');
    (this.root.querySelector('#health-fill') as HTMLElement).style.width = `${run.health / run.maxHealth * 100}%`;
    (this.root.querySelector('#xp-fill') as HTMLElement).style.width = `${Math.min(100, run.xp / run.requiredXp * 100)}%`;
    for (const [selector, value, max] of [['.health-track', run.health, run.maxHealth], ['.xp-track', run.xp, run.requiredXp]] as const) {
      const bar = this.root.querySelector(selector)!; bar.setAttribute('aria-valuenow', String(Math.min(value, max))); bar.setAttribute('aria-valuemax', String(max));
    }
    for (const id of ABILITY_IDS) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-ability="${id}"]`)!;
      button.disabled = run.ranks[id] === 0 || run.phase !== 'playing'; button.classList.toggle('selected', run.active === id); button.classList.toggle('locked', !run.ranks[id]); button.setAttribute('aria-pressed', String(run.active === id));
      button.title = run.ranks[id] ? `${ABILITIES[id].description} Rank ${run.ranks[id]}. ${Math.round(run.stats(id).damage)} damage.` : 'Choose this gift when you level up to unlock it.';
      this.text(`rank-${id}`, run.ranks[id] ? `RANK ${run.ranks[id]}` : 'LOCKED');
      button.style.setProperty('--cooldown', `${Math.min(1, run.cooldowns[id] / run.stats(id).cooldown) * 100}%`);
    }
    if (this.phase !== run.phase || (run.phase === 'upgrade' && this.upgradeLevel !== run.level)) {
      this.phase = run.phase; this.upgradeLevel = run.level; this.renderModal(run, upgrades);
    }
  }
  private renderModal(run: Run, upgrades: Upgrade[]): void {
    let content = '';
    const arrow = icon('arrow');
    if (run.phase === 'menu') content = `<div class="intro"><div class="sprout">${icon('leaf')}</div><h1>Mosslight</h1><p class="tagline">A little light. An endless wild.</p><div class="hero-spirit"><div class="spirit-pixel"></div><span></span></div><p class="intro-copy">The hollow is waking.<br>Gather its light. Grow your gifts. Outlast the dark.</p><button class="primary" data-action="start">Enter the hollow ${arrow}</button><div class="intro-instructions"><span>${icon('leaf')} Move to survive</span><span>${icon('seed')} Attack automatically</span><span>${icon('spark')} Collect & grow</span></div><p class="prototype">AN ORIGINAL WOODLAND ADVENTURE · PROTOTYPE 01</p></div>`;
    if (run.phase === 'paused') content = `<div class="panel compact"><div class="modal-symbol">${icon('leaf')}</div><p class="eyebrow">TAKE A BREATH</p><h2>The wild can wait.</h2><p>Your light is safe here. Return when you’re ready.</p><button class="primary" data-action="resume">Return to the hollow ${arrow}</button><button class="secondary" data-action="start">Start a new run</button><button class="text-button" data-action="menu">Back to title</button><small>WASD / ARROWS to move · 1–3 to switch · ESC to resume</small></div>`;
    if (run.phase === 'gameover') content = `<div class="panel compact"><div class="modal-symbol">${icon('spark')}</div><p class="eyebrow">EVERY LIGHT LEAVES A TRACE</p><h2>A quiet ember.</h2><p>The forest remembers. Will you wander again?</p><div class="results"><div><strong>${formatTime(run.time)}</strong><span>SURVIVED</span></div><div><strong>${run.level}</strong><span>LEVEL</span></div><div><strong>${run.kills}</strong><span>DISPELLED</span></div></div><button class="primary" data-action="start">Kindle another light ${arrow}</button><button class="text-button" data-action="menu">Back to title</button></div>`;
    if (run.phase === 'upgrade') content = `<div class="upgrade-panel"><p class="eyebrow">LEVEL ${String(run.level).padStart(2, '0')} · THE FOREST OFFERS A GIFT</p><h2>Let your light grow.</h2><p>Choose one gift for this journey.</p><div class="upgrade-grid">${upgrades.map(u => `<button class="upgrade-card" data-upgrade="${u.id}"><span class="card-kind">${u.kind}</span><span class="card-icon">${icon(u.icon)}</span><strong>${u.title}</strong><span class="card-description">${u.description}</span><span class="card-effect">${u.effect}</span><span class="card-choose">ACCEPT GIFT ${arrow}</span></button>`).join('')}</div><small>THE HOLLOW IS PAUSED WHILE YOU CHOOSE</small></div>`;
    this.modal.innerHTML = content ? `<section class="modal-backdrop" role="dialog" aria-modal="true" aria-label="${run.phase === 'upgrade' ? 'Choose an upgrade' : run.phase === 'menu' ? 'Mosslight main menu' : run.phase === 'paused' ? 'Game paused' : 'Run complete'}">${content}</section>` : '';
    for (const child of this.root.children) if (child !== this.modal && child instanceof HTMLElement) child.inert = Boolean(content);
    if (content) this.modal.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }
  flash(): void { const el = this.root.querySelector('#damage-flash')!; el.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 330 }); }
  destroy(): void { this.abort.abort(); this.root.innerHTML = ''; }
}

