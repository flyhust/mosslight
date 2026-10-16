const paths: Record<string, string> = {
  seed: '<path d="M16 6C10 14 7 18 10 23c3 5 10 4 13-1 2-5-3-10-7-16Z" fill="currentColor" opacity=".9"/><path d="M16 8V3M16 6c-6 0-7-4-7-4 6-1 7 4 7 4Zm0 0c5 0 7-4 7-4-6 0-7 4-7 4Z" stroke="currentColor" fill="none"/><path d="m16 15-2 6 3 2" stroke="#fff4cd" stroke-width="2" fill="none"/>',
  ring: '<path d="m16 5 5 3 6 8-4 9-10 2-8-7 1-9Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m12 9-1-7 7 4m4 8 8-3-3 7m-8 6 3 7-8-4M8 19l-7 3 4-8" fill="currentColor"/>',
  lance: '<path d="m6 27 18-21m-8 10 1-9L28 2l-4 12-8 2Z" stroke="currentColor" stroke-width="2" fill="currentColor"/><path d="m19 12 7-8" stroke="#e8eee0"/>',
  heart: '<path d="M16 27 4 15C-3 3 12-2 16 8 20-2 35 3 28 15Z" fill="currentColor"/>',
  root: '<path d="M16 3v15m0-6-8-6m8 8 8-7m-8 9-8 7-3 5m11-10 7 6 4 4m-11-9v11" fill="none" stroke="currentColor" stroke-width="3"/>',
  spark: '<path d="m16 1 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="currentColor"/>',
  leaf: '<path d="M6 26C-2 9 10 3 28 3c1 20-9 29-22 23Z" fill="currentColor"/><path d="M4 29 22 10" stroke="#12271f" stroke-width="2"/>',
  pause: '<path d="M10 7v18M22 7v18" stroke="currentColor" stroke-width="5"/>',
  arrow: '<path d="M5 16h21m-8-8 8 8-8 8" fill="none" stroke="currentColor" stroke-width="2"/>',
  lock: '<rect x="8" y="14" width="16" height="13" rx="2" fill="currentColor"/><path d="M11 14V9c0-8 10-8 10 0v5" stroke="currentColor" stroke-width="3" fill="none"/>',
};
export function icon(name: string): string { return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">${paths[name] ?? paths.spark}</svg>`; }
