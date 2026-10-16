# Mosslight

An original browser survival roguelite. Guide a little woodland spirit through **The Hollow**, gather light, and grow your gifts. Built with **Phaser 3.90, TypeScript 5.9 and Vite 7**. This is the first playable milestone, not the complete long-term game.

**[Play online](https://flyhust.github.io/mosslight/)** · [GitHub repository](https://github.com/flyhust/mosslight)

The published version is the playable **2D prototype**. The proposed 3D mage RPG migration has not been implemented yet.

## Start playing

Requires **Node.js 24 LTS** and npm. In PowerShell:

```powershell
git clone https://github.com/flyhust/mosslight.git
cd mosslight
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**. Click **Enter the hollow**. There are no API keys or services to configure.

```powershell
npm test            # 15 focused gameplay/input tests
npm run typecheck   # strict TypeScript check
npm run build       # typecheck + production bundle in dist/
npm run preview     # serve that production bundle at http://127.0.0.1:4173/
```

Use `npm ci` instead of `npm install` for an exact install from the lockfile. Serve `dist/` with a static web host; opening its HTML directly with a file:// URL is not supported. The prototype uses no remote fonts, artwork, scripts or APIs at runtime.

To test from your own phone on the same trusted Wi-Fi, run `npm run dev -- --host 0.0.0.0` yourself and open the Network URL Vite prints. This makes the development server reachable on your network. The default command only binds to your computer.

## Controls and loop

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | Drag on the arena; a floating joystick appears |
| Attack | Automatic | Automatic |
| Switch active gift | 1 / 2 / 3 | Tap an unlocked gift |
| Pause or resume | Escape / pause button | Pause / return button |
| Choose upgrade | Click, or Tab then Enter | Tap one card |

Defeat creatures, then move toward the mint crystals they drop. Crystals within your gathering radius fly toward you. At each level, choose one of three gifts. Gameplay freezes until you choose. The selected ability fires automatically; other unlocked abilities are available to switch to, but do not fire simultaneously. Cooldowns are separate and switching does not reset them.

**Ember seed:** aims at the nearest creature. **Thorn ring:** hits every creature around you. **Reed lance:** pierces creatures along a straight path. Every ability has five ranks. A new ability is selected automatically when acquired. Key 4 is reserved and has no effect because this milestone contains three abilities.

There is no victory timer yet: survive as long as you can. Runs reset fully on restart and are not saved. Losing browser focus pauses an active run.

## Implemented

- A 4800 × 4800 bounded arena with seeded ground and scenery, smooth camera follow, and original pixel sprites.
- Normalized movement, health, speed, damage, contact collision and 750 ms damage invulnerability.
- Three configurable creature types, unlocked as time passes; increasing health, speed and spawn frequency.
- Three automatic abilities, per-ability cooldowns, nearest targeting, radial damage and swept projectile collision.
- Experience drops, attraction, level progression, preserved overflow XP and three distinct random upgrade choices.
- A mixture of ability unlocks/ranks and health, movement, gathering or damage upgrades that change actual values.
- Title, active run, upgrade, pause and defeat screens; restart from pause or defeat; return to title.
- Keyboard and pointer/touch controls; landscape and portrait layouts; keyboard-focusable menus.
- Pooled enemies, projectiles and crystals; capped effects. Limits: 150 enemies, 72 projectiles, 220 crystals, 80 effects. At the crystal cap, XP merges into an existing drop rather than disappearing.
- Scene-owned listeners removed on shutdown, with fresh state and pools on every restart.

## Architecture and changed files

This workspace was empty. All project files are new.

| Files | Responsibility |
| --- | --- |
| `package.json`, `package-lock.json`, `tsconfig.json`, `index.html` | Tooling, dependency versions, strict checking and HTML entry |
| `src/main.ts` | Phaser bootstrap and responsive canvas |
| `src/data/config.ts` | Enemy definitions, ability definitions, world size and performance limits |
| `src/core/run.ts` | Run state, health, simulation clock, cooldowns and progression |
| `src/core/upgrades.ts` | Random upgrade offers and gameplay effects |
| `src/core/math.ts` | Movement normalization, collision math, seeded randomness and time formatting |
| `src/game/scene.ts` | Scene lifecycle and coordination of systems |
| `src/game/player.ts`, `input.ts` | Player movement and keyboard/pointer lifecycle |
| `src/game/enemies.ts`, `combat.ts`, `pickups.ts`, `effects.ts` | Spawning, pursuit, combat, experience and feedback |
| `src/game/assets.ts` | Original pixel textures and deterministic scenery |
| `src/ui/ui.ts`, `icons.ts`, `src/style.css` | HUD, menus, accessible controls and responsive styling |
| `tests/core.test.ts`, `tests/input.test.ts` | Gameplay and input regression checks |
| `PLAN.md` | Inspection, implementation plan and design decisions |

The renderer is separate from core progression and balance data. Enemies and abilities can be tuned in `src/data/config.ts`; new attacks can be added through the combat system without rewriting the HUD or progression. This is a foundation for later character selection and local progression. Multiplayer would require a separate architecture decision.

## Verification performed

**15 tests pass**, and strict type checking and the production build pass. Logic tests use the real gameplay modules with only rendering stubbed. Input tests cover cancellation, a second pointer, blur and listener cleanup. These tests do not claim to validate GPU rendering.

Actual browser checks used the **Codex in-app browser**, with desktop, 844 × 390 landscape and 390 × 844 portrait views:

| Check | Result |
| --- | --- |
| Page title, nonblank canvas/menu, framework error overlays | Passed |
| Browser console errors and warnings | None observed during the tested flows |
| WASD movement and camera scrolling | Observed in a live run |
| Automatic attacks, defeated enemies and collectible XP | Observed in a live run |
| Three-card level-up pause | Observed at levels 2 and 3 |
| Unlock Reed lance and switch with 1 / 3 | Passed; HUD active states and rank changed |
| Damage upgrade | Passed; Ember damage changed 26 → 31 and Reed 30 → 35 (rounded in HUD) |
| Escape pause | Timer held at 00:34 while movement input was held |
| Defeat | Observed at 00:49, level 3, 42 creatures defeated |
| Restart after defeat and again from pause | Health 100, level 1, time 00:00, zero kills and only Ember unlocked |
| Responsive menus and upgrade cards | Fit landscape and portrait widths without horizontal overflow |
| Pointer drag | Exercised the shared pointer-input path; crystals collected after moving |

The generated screen concept is a visual direction reference, not a shipped background. The implementation retains the forest palette, parchment typography, mint crystals, centered timer, bottom ability slots and gold active state. Intentionally simpler code-created sprites and terrain follow the brief's prototype allowance. The small inset menu in the concept became a real full-screen menu, and text was added for instructions, rank/cooldown feedback, upgrades and results. No claim of pixel-for-pixel artwork reproduction is made.

### Still requires manual verification

- Physical iOS Safari and Android Chrome, real multi-touch, orientation changes and device safe areas.
- Longer survival sessions and memory/frame-rate profiling on low-end devices.
- Firefox/Safari desktop rendering and keyboard focus behavior across browsers.
- Full balance/playtesting of all five ranks and late-run difficulty. Automated tests validate all three attack mechanics; the browser playthrough specifically exercised Ember seed and Reed lance.

## Scope and known limitations

- Elite enemies, bosses, ability evolution, character selection, achievements, bestiary and multiplayer are later milestones.
- No persistent progression, saved settings, audio or backend. No accounts or analytics.
- Scenery is decorative: creatures and the player can move across it. The outer arena boundary is solid.
- Art is intentionally simple, original, code-created pixel art. No external asset downloads are required.
- The Phaser bundle is approximately 343 KB gzip; Vite emits a non-blocking large-chunk warning. The engine is needed at game startup, so splitting it alone would not reduce initial download size.
- GitHub Actions tests and builds pushes to `main`, then publishes `dist/` to GitHub Pages. The deployment build uses `/mosslight/` as its asset base; local development keeps `/`.

## Asset provenance

All runtime sprites, terrain, icons and interface copy were created for Mosslight. The game contains no Pokémon sprites, protected branding, copied game source, third-party artwork or copyrighted audio. Phaser and build dependencies retain their own licenses (see their packages). The separate concept image was generated with the built-in image generation tool and is not a runtime dependency.
