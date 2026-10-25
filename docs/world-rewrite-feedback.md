# World rewrite feedback and rescue overtime

## See the consequence of a rule

The first acceleration direction reversal in each attempt briefly shows two paths:

- Grey dashed: 1.2 seconds with the old rules and no further player messages.
- Green: the real positions observed after the executed message, never an invented prediction.

The live engine records fixed-step inputs and rule states in a simulation journal. A separate PhysicsWorld replays those inputs to the moment before the change, including device contacts, charging, gate state, collected stars and teaching pauses. Before predicting, it checks the reconstructed tick and every body position, velocity, angle and angular velocity against the live world (tolerance 1e-7). If an external/unrecorded mutation prevents this check from passing, no reference is shown.

The branch uses the same 120 Hz engine step, collisions, devices, goals and boundaries. It is destroyed immediately after sampling; it cannot consume live stars, emit live sounds, change queue state or use the command budget. The cue lasts two simulation seconds, fading over the last 0.6 seconds. Pause freezes it; a subsequent rule edit clears it. Retry resets the introduction. Reduced-motion mode suppresses the comparison.

Tests cover all nine levels, a real rebound, spring teaching/charging and the overtime wall transition. Adding nondeterministic devices later requires extending the journal and parity checks before showing their predictions.

Undo still restores rules only. Full time rewind is **not implemented**. A later rewind feature must also restore device/goal/star state, sent-message state, teaching state, sound/visual event cursors and overtime status. The journal is a foundation for that work, not a claim that rule Undo rewinds motion.

## Use intuitive language

A shared preset catalog feeds local preparation and the model prompt. The queue displays the concrete interpreted operation before Send now. Numeric commands remain supported.

| Wording | Interpretation |
| --- | --- |
| almost perfectly bouncy | restitution 0.95 |
| perfectly bouncy | restitution 1 |
| soft / barely bouncy | restitution 0.15 |
| bouncy | restitution 0.8 |
| gentle directional acceleration | 0.5 m/s² in that direction |
| strong / very strong acceleration | 2 / 5 m/s² |
| slippery / grippy | friction 0.03 / 0.6 |
| slower / much slower / faster device | current signed control × 0.5 / 0.25 / 2 at execution |

These are visible game presets, not universal definitions. A stopped conveyor stays stopped when scaled. A reversed conveyor retains its direction when slowed. “This surface” requires a unique scene surface; otherwise the player must name it. Explicit quantities, incompatible units, permissions, unknown targets and conflicting directions retain their validation. No extra commands are added to solve the puzzle.

Four Gemini checks passed with the same values, including a named cup base and relative conveyor speed, each with an explicit interpretation. The local parser is intentionally conservative about whole sentences; broader paraphrases still use AI.

## One rescue overtime

After the normal 30 simulated seconds, an unfinished actor still in the play area receives exactly one additional 30-second period. The physical world continues from its current state. Four fixed collision walls appear at the existing play-area edges; their translucent rim fades in over 0.5 simulation seconds. The rim is preset and read-only. It is not an invisible wall during normal time.

- Pauses, API waits and teaching stops do not consume either period.
- A full escape before overtime remains a failure. Overtime does not resurrect a failed run.
- A goal reached on the last normal tick wins before overtime is activated.
- No second extension occurs. At the end of overtime, the run times out unless the final tick reaches the goal.
- Overtime completion awards `max(0, collectedStars - 1)`. The HUD retains actual pickups; settlement shows the earned stars and the one-star deduction. Local best scores store the earned count.
- Try again removes the walls, resets the timer and clears the penalty. Messages remain ready under the existing retry rules.

For custom/test levels, their configured normal duration is respected; the one extension remains 30 seconds.

## Verification

Implementation snapshot `9f74388`, tested independently from other work-in-progress changes: 107 Vitest files / 1,036 tests, 13 diagram-animation checks, TypeScript and production build passed. A parallel run under heavy local load hit interaction timeouts; the affected 37 checks and the full frozen snapshot subsequently passed with one worker. No timeout assertion was weakened.

Browser checks confirmed qualitative preparation displaying upward 0.5 m/s², rule execution and pause, and the single overtime ending at 60 simulated seconds with the translucent rim still visible. Four isolated Gemini requests confirmed the shared preset values and concrete interpretations without changing production provider settings. This feature set has not been deployed yet.
