import { direction, type Vec } from '../core/math.ts';
export class InputController {
  keys = new Set<string>();
  touch: Vec = { x: 0, y: 0 };
  private pointer: number | null = null;
  private origin: Vec = { x: 0, y: 0 };
  private abort = new AbortController();
  private stick: HTMLElement;
  constructor(surface: HTMLElement, stick: HTMLElement, onKey: (key: string) => void, onBlur: () => void) {
    this.stick = stick;
    const signal = this.abort.signal;
    window.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','escape','1','2','3','4'].includes(key)) {
        e.preventDefault(); this.keys.add(key); if (!e.repeat) onKey(key);
      }
    }, { signal });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()), { signal });
    window.addEventListener('blur', () => { this.reset(); onBlur(); }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.reset(); onBlur(); } }, { signal });
    surface.addEventListener('pointerdown', e => {
      if (this.pointer !== null || e.button !== 0) return;
      this.pointer = e.pointerId; this.origin = { x: e.clientX, y: e.clientY };
      surface.setPointerCapture(e.pointerId);
      this.stick.style.left = `${e.clientX}px`; this.stick.style.top = `${e.clientY}px`; this.stick.classList.add('visible');
    }, { signal });
    surface.addEventListener('pointermove', e => {
      if (e.pointerId !== this.pointer) return;
      this.touch = direction((e.clientX - this.origin.x) / 46, (e.clientY - this.origin.y) / 46);
      this.stick.style.setProperty('--dx', `${this.touch.x * 33}px`); this.stick.style.setProperty('--dy', `${this.touch.y * 33}px`);
    }, { signal });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) surface.addEventListener(name, e => { if ((e as PointerEvent).pointerId === this.pointer) this.resetTouch(); }, { signal });
  }
  get vector(): Vec {
    const x = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
    const y = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
    return direction(x + this.touch.x, y + this.touch.y);
  }
  resetTouch(): void { this.pointer = null; this.touch = { x: 0, y: 0 }; this.stick.classList.remove('visible'); this.stick.style.setProperty('--dx', '0px'); this.stick.style.setProperty('--dy', '0px'); }
  reset(): void { this.keys.clear(); this.resetTouch(); }
  destroy(): void { this.abort.abort(); this.reset(); }
}
