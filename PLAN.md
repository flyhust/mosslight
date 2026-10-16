# Mosslight — milestone 1

## Inspection
Empty workspace; no existing application, package.json, scripts or Git repository. Node 24 and npm 11 available. No running project to verify.

## Implementation sequence
1. Bootstrap Phaser 3 + TypeScript + Vite, with strict type checking.
2. Implement an arena and original procedural pixel sprites; camera follow and normalized keyboard/touch movement.
3. Add capped enemy, projectile and experience pools; nearest-target, radial and piercing attacks.
4. Add level progression, three-card upgrades, selectable ability slots, HUD and state menus.
5. Verify deterministic core logic, browser interactions, responsive layout, type checking and production output.

## Decisions
- Original woodland theme: Mosslight, with a lantern spirit exploring The Hollow.
- Active ability fires automatically. Unlocking an ability selects it; 1–3 or touch buttons switch. Key 4 is reserved until a fourth ability exists.
- Three abilities: Ember seed, Thorn ring, Reed lance. Five upgrade ranks each.
- Endless prototype; gradual difficulty with three enemy types. Bosses, evolution, sound, metaprogression and multiplayer are later milestones.
- World is 4800 × 4800; scenery is decorative and the arena edge is bounded.
- Deterministic self-created sprite/terrain art, permitted by the brief, is an intentional deviation from image-generated production assets.
- No backend, external asset URLs, account system or paid services.
- Local Git repository; no GitHub publication without a specified destination.

## Verification targets
Movement normalization, contact invulnerability, swept projectile collision and pierce-once behavior, pause freeze, overflow experience, upgrade effects, repeated restart cleanup, touch cancellation, hidden-tab pause, capped entity counts, responsive menus.
