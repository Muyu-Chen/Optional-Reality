# Integration plan for Optional Reality (GitHub main @ 99d0b32)

**No files have been written to the GitHub repository.** This is an isolated proposal, not a drop-in ready `gravity-lab.ts` replacement.

The repo's existing `LevelDefinition` supports only `ball`, `tracks`, `guideLines`, and `exit`. The runtime has no environment apparatus, so the Level 8 data below is intentionally a new experimental contract (`reality-breakdown.schema.ts`) and cannot currently be passed to `PhysicsWorld` unmodified.

Suggested independent implementation sequence:

1. Extend `client/src/levels/types.ts` with `devices?: readonly DeviceDefinition[]` and optional `triggers` (discriminated unions with IDs). Keep the existing Gravity Lab compatible.
2. Add builders and device state in `client/src/physics/world.ts`: conveyor surface velocity, spring impulses on contact, fan regions, rotor contact response, gate body with open/closed state, sensor events, collision-based scoring. Continue to use Matter.js and the same 120 Hz step.
3. Add renderers in `client/src/physics/canvas-lab.ts` for these device types; do not put physics into the renderer.
4. Extend `shared/commands.ts` Zod schema with `set_environment_property` and `add_collision_trigger`; validate ranges, device IDs, object edit permissions, and trigger target. Explicitly reject edits to the core itself.
5. Implement rule history / Undo and 100-command budget in state management. Define whether quota refunds on Undo (prototype refunds; project may choose otherwise).
6. Register Level 8 in a scene selector in `App.tsx`, which currently hardcodes `const level = gravityLab`. Respect React state and Canvas runtime separation.
7. Add unit tests for each new device, goal check, invalid commands, deterministic replay, reset/rebuild, trigger timing and no duplicate listeners. Run `npm test`, `npm run typecheck`, `npm run build` once integrated.

`reality-breakdown.schema.ts` is a **proposal** for extension; it is not imported by the standalone HTML because that standalone is designed to work offline.
