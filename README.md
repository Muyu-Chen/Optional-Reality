# Optional Reality

**Reality is optional. Change the rules. Choose the moment.**

Optional Reality is a **2D physics puzzle game** where you rewrite the rules in natural language and choose when they take effect.

The core loop: observe the scene → write a message → parse and queue it → **Send now** → watch the physics and feedback captions → retry with a different approach.

AI compiles the player's intent into supported declarative operations, while Matter.js simulates the physical world. You decide when a rule takes effect: turning gravity off preserves momentum, and operations such as reversal and doubling read the current value when executed. The model does not perform per-frame calculations or execute generated JavaScript.

## Gameplay Demo

The [mobile-friendly introduction](https://optionalreality.site/intro) brings together the game, demo, chapters, and sharing in English and Chinese. [Download its QR code](./site/assets/intro-20261025/intro-qr.png) or a [printable share card](./site/assets/intro-20261025/scan-card.png) for a demo table. The QR opens the introduction; playing the levels still requires a computer. See [Introduction and QR Sharing](./docs/mobile-introduction.md).

A 47-second loop shows chapter selection, automatic character-by-character input, and real three-star completions in Motion, Collisions, and Devices. Open the [looping player](https://optionalreality.site/showcase/), or [watch / download the 720p MP4](./site/showcase/gameplay-loop.mp4). [Playback and recording notes](./site/showcase/README.md) include local playback, chapter timestamps, and captions.

[![Looping gameplay demo: level selection, typed rules, and three-star completions](./site/showcase/preview.gif)](./site/showcase/gameplay-loop.mp4)

Read [AI Usage](./AI_USAGE.md) for player instructions, the local-parser / LLM boundary, server configuration, AI-assisted development, generated-art credits, and demo provenance.

## Playable Content

Built for SBUHacks 2026, the game includes three chapters and fifteen progressively structured levels. The six new Motion and Collisions puzzles are described in [Motion and Collision Expansion](./docs/motion-collision-expansion.md) and are live on all three domains; see the [deployment record](./deploy/motion-collision-levels.md).

| Chapter | Level | Main concepts |
| --- | --- | --- |
| 1 · Motion | 01 Let It Roll | Start in zero gravity, roll down a ramp, and turn gravity off when leaving the track |
| 1 · Motion | 01.2 One More Turn | Fall to collect a star, rebound naturally from a passive spring, then change acceleration to reach higher stars |
| 1 · Motion | 01.3 Bring It Back | Start a rightward drift, brake near the far stars, and return to an exit behind the starting point |
| 1 · Motion | 01.4 Over the Wall | Lift over a fixed wall, then reverse vertical acceleration to bend the flight toward the exit |
| 1 · Motion | 01.5 The Side Door | Steer sideways around a shelf while preserving downward momentum |
| 2 · Collisions | 02.1 A Little More Bounce | A simple rebound reaches the exit; low elasticity followed by upward acceleration collects every star |
| 2 · Collisions | 02.2 Not Too High | Full-score route: use high elasticity to reach high stars, then increase downward acceleration to return to the exit |
| 2 · Collisions | 02.3 Brake Before the Edge | Use the cyan friction runway to bring the entire block to rest in the parking area |
| 2 · Collisions | 02.4 Catch Tutorial | A short lesson in setting launch-pad and cup-base properties independently; both can be prepared in advance |
| 2 · Collisions | 02.5 Bank Shot | Use a real angled rebound to turn horizontal motion upward in zero gravity |
| 2 · Collisions | 02.6 Return to Dock | Rebound from the far wall, then use friction to park on the return trip |
| 2 · Collisions | 02.7 One Last Bounce | Use one floor for a strong rebound, then soften it and add grip for the next landing |
| 3 · Devices | 03.1 A Little Stored Energy | Learn the toaster's compression, energy storage, and release |
| 3 · Devices | 03.2 Catch the Breeze | Learn how an upward airflow affects motion |
| 3 · Devices | 03.3 The Last Order | Combine a conveyor, toaster, fan, and sensor-triggered gate |

Chapters organize the teaching sequence. Basic physical properties remain consistent across levels, while layouts and hints introduce new concepts. Preset devices and structures are marked separately. The runtime retains rotor support; more device combinations, natural elements, and a free sandbox are planned for later.

## How to Play

- `/demo/` opens the title screen. The level-selection screen presents fifteen levels across three chapters, and `?level=...` remains available for direct links. Continuing the most recent level starts a fresh attempt while keeping message drafts. Completed levels save the best star count on the current device.
- The main live entry point is [optionalreality.site](https://optionalreality.site/). `www.optionalreality.site` and `muuyyy.cfd` also work: the root opens the game, `/intro` serves the introduction page, and the original `/demo/` route remains available. All three domains share an automatically renewed SAN certificate. Configuration and backups are documented in [Domains and Routing](./deploy/domains-and-routing.md).
- The scene fills the screen, with a translucent input panel at the bottom right. **Enter only queues a message. Shift+Enter immediately applies only the current input**, without executing older queued messages.
- Entering or retrying a level displays a five-second [initial-state briefing](./docs/initial-state-briefing.md) showing initial motion, acceleration, surfaces, and device states, then gently fades out. Hovering or focusing keeps it visible; returning during the fade restores it. It appears after any tutorial closes and does not start the simulation timer.
- Model results rejected by validation receive [one conversational AI repair attempt](./docs/compilation-repair.md). A valid second interpretation becomes Ready and is labeled **AI revised interpretation** for the player to review before choosing **Send now**. Repaired results are never applied automatically, even when requested with Shift+Enter.
- First visits to Let It Roll, One More Turn, A Little More Bounce, and the three bakery levels show a centered, illustrated three-step tutorial while the simulation stays paused. **Let's play** dismisses it without replacing the queue. **How to play** in settings reopens it; refreshing or retrying does not force a repeat.
- Messages are parsed automatically. The desktop sidebar prioritizes three actionable summaries, with 18px body text, colored rule icons, a 28px-high **Send now** button, and a small delete button. Expand a message to see its full text, **Understood as**, and clamping details. Batch sending is available in the management menu.
- Batch compilation returns an independent result for each message: valid messages become Ready, and errors mark only the affected row without blocking other Ready messages. Editing and retrying retain reusable results. See [Per-Message Compilation Results](./docs/compilation-results.md) for the protocol and request-wide error boundaries.
- The local AST supports explicit compound instructions, doubling, halving, reversal, and multiple targets, such as `Set both the launch pad and the cup base bounce to 0.5 and stop gravity`. If the whole sentence cannot be parsed locally, it is sent to the configured model, currently Gemini in production. When Shift+Enter requires AI, the world pauses, then applies the successfully parsed message once; failures keep the message. Ordinary Enter leaves parsed messages waiting for the player to send them.
- **Shift+Tab** pauses the simulation and opens settings. Opening settings while waiting for AI cancels the intent to send immediately; valid results remain queued for later sending.
- Captions on the left show the actual changes and fade after a few seconds. Rule parameters, hints, batch sending, and history are available in the menu.
- General bounce and friction commands affect every editable surface. Naming a launch pad or cup changes only that surface; fixed walls retain their level settings.
- Each level has three stars. Reaching the exit completes the level; collecting all stars before reaching the exit earns full score. Retrying restores every star.
- **Start** beside the clock begins the 30-second simulation with the current rules and leaves queued messages ready. The first successful send also starts the run. Start is unavailable during AI preparation, tutorials and settings. One 30-second rescue overtime then adds translucent collision walls, with extra room above and to the right and the left rim at the screen edge; clearing in overtime costs one earned star (minimum zero). Ordinary pauses, API waits, and tutorial pauses consume neither period.
- While waiting for AI, you can **Cancel** or send another Ready message. A canceled response cannot pause the game again. Unfinished messages can be prepared individually with **Prepare**; the complete network request has a maximum wait of 35 seconds.
- During normal time, all four edges of every level are open. A ball or block that fully leaves the fixed play area triggers **Out of bounds** and can be reset with **Try again**. Objects still partly inside can be recovered; cup walls and tracks retain real collisions.
- **Try again** restores the initial world and command budget, makes messages pending again, and retains parsed operations so you can compare different execution timings.
- A powered toaster charges for approximately 0.6 seconds on contact. All three bakery levels pause on first contact for a teaching moment, even when the toaster is off; rules can be sent while paused, and **Continue** resumes the simulation. Retrying does not repeat the interruption, and the menu can replay the teaching sequence.
- Switch levels from the pause menu, or proceed to the next level after completion. Results use large, separate stars to distinguish collected and missed stars, with different feedback for ordinary completion and full score.
- After the first interaction, quiet original background music and event sound effects can play. **Music on/off** and **Sound effects on/off** in pause settings are independent and remember your choices. Leaving the tab stops existing audio, and changing levels does not stack playback.
- The interface is primarily English and accepts both English and Chinese input, with readable text sizes and contrast for the interface and scene labels.
- An indicator beside the stars shows the actual acceleration direction and magnitude, briefly emphasizing changes. Enlarged birds and an eagle fly independently and respond to direction changes. Impacts create ripples and slight visual deformation based on incoming speed without changing physical trajectories.

Implementation conventions for the interface, continuous springs, backgrounds, and exit animations are collected in [Game Presentation](./docs/presentation.md). Release status is recorded below and in the deployment notes.

See [Play-Area Boundaries and Message Recovery](./docs/play-area-and-recovery.md) for open boundaries, compilation cancellation, and recovery after sending.

Backgrounds use separate everyday-world and cosmic illustrations. Waterfalls, pedestrians, and cars respond to actual acceleration; zero-gravity openings use a space theme. Decorations do not participate in level collisions or scoring. See [World Backgrounds and Game Navigation](./docs/world-and-navigation.md) for the boundaries between the title screen, level selection, and scenery.

On the first visit to A Little More Bounce, `Set surface bounce to 0.9` is prepared and waits for the player to send it. Existing drafts and intentionally emptied queues are preserved. This ordinary route genuinely collects one star; all three stars plus the exit are required for full score.

The tutorial's **Load three-star setup** action replaces the queue with `Set surface bounce to 0.1` and `acceleration upward 1`. First lower elasticity, then send upward acceleration just before or just after the ball contacts the floor. The ball still passes through the low star before rising toward the high stars. Do not wait until the low star has already been collected.

Basic examples include `add gravity`, `stop gravity`, `reverse gravity`, `add acceleration rightward`, `Set surface bounce to 0.9`, `Set toaster power to 2`, and `Set fan power to 0.45`. Devices must exist in the scene and be editable. Task objects cannot be moved directly or have their velocity changed directly.

Physical properties follow a consistent visual language: blue rebound marks, cyan friction textures, orange propulsion arrows, and purple gravity directions. Every level's input panel can **Expand / Collapse** the full list of editable rules, and tutorials use the same permission list. The ball, exit, and layout remain fixed. Device labels **Editable / Preset** are separate from property colors. See [Geometry Levels](./docs/geometry-levels.md) for the three additional levels and their validation, and [Physics Mechanism Proposals](./docs/physics-mechanisms.md) for future devices.

All levels share the same acceleration vector, elasticity, and friction. Gravity is an input alias for the vertical acceleration component; direction and strength are represented by the same vector. Each component accepts −100 to 100 m/s², so downward 20 is preserved as +20. Tutorials recommend solutions without disabling basic physical properties. `add acceleration right word` is corrected to `add acceleration rightward`, while the queue preserves the original text and displays the interpretation. See [Shared Physics Rules and Command Interpretation](./docs/command-language.md).

Basic capabilities, ranges, units, and interface labels are defined centrally in `shared/physics-capabilities.ts`. The model receives the same complete capability description for every level; individual levels add only objects, aliases, and preset permissions. Explicit commands use local parsing, while conversational language and unrecognized typos fall back to the model and are then validated by shared code.

The model interprets everyday physics language by intent. For example, “upward buoyancy” becomes upward environmental acceleration of 1 m/s², preserving the horizontal component and displaying the interpretation under **Understood as**. It does not create water or a new force field, nor does it permit direct changes to the ball's velocity, position, or mass. The first AST version's grammar and fallback boundaries are documented in [Command Interpretation](./docs/command-language.md).

Shared code clamps finite values outside supported ranges; for example, fan power 10 → 2. The queue shows the requested and applied values and waits for **Send now**. Unknown objects, protected targets, and non-finite values are still rejected.

## Running Locally

Use a Node.js version supported by Vite 8. The project has been verified with Node.js 26.

```sh
npm ci
cp -n .env.example .env
# Set AI_API_KEY in .env. If .env already exists, edit it without overwriting it.
npm run dev
```

Open `http://127.0.0.1:5173/demo/`. The Vite frontend and Express API start together.

The default configuration is `AI_BASE_URL=https://api.deepseek.com` and `AI_MODEL=deepseek-flash`, using JSON output with thinking mode disabled. Only the backend reads the key. Do not expose it through a `VITE_` variable. Restart the API after changing configuration.

Alternatively, set `AI_PROVIDER=gemini` and provide a separate `GEMINI_API_KEY`; the default model is `gemini-3.1-flash-lite`. The original `AI_API_KEY` and DeepSeek configuration remain available; switch back with `AI_PROVIDER=compatible`. Explicitly setting `AI_FALLBACK_PROVIDER=deepseek` enables a separate fallback request to DeepSeek if Gemini fails; provider keys are never mixed. This fallback is enabled in production. See the [Server Guide](./server/README.md) for configuration and time budgets, and the [Fallback Deployment Notes](./deploy/api-fallback.md) for release status.

If the key exists only on the production server, set `DEV_API_ORIGIN=https://muuyyy.cfd` in the development machine's `.env`, then run `npm run dev:web`. Vite forwards only `/api` to the existing backend; the browser continues using the local address, and provider keys stay on the server. Leaving this setting empty connects to the local backend on port 3001. It affects only the development server; `npm start` and production builds continue to use the same site's `/api`.

```sh
npm test
npm run build
npm start
```

After a production build, `npm start` serves both the game and API at `http://127.0.0.1:3001/demo/`. Tests use mocked models by default and do not consume real API calls; real DeepSeek calls are verified separately. Build outputs, dependencies, keys, and local backups are not committed.

See [Testing](./docs/testing.md) for test conditions and requirements for new tests. GitHub Actions runs tests and builds on every push and pull request.

To preview only the static frontend, run `python3 -m http.server 8793 --bind 127.0.0.1 --directory site` and visit `/demo/`. Only local commands work in this mode.

## Architecture and Design

React, TypeScript, and Vite manage the interface; Matter.js and Canvas 2D simulate and render the world; Express calls a configurable OpenAI-compatible API; Zod defines shared validation for rules. The project targets the web first, without Electron, a database, or 3D at this stage.

- `client/src/levels/`: independent level definitions, chapters, and editing permissions.
- `client/src/game/`: game sessions, queue interactions, AI preparation, and world lifecycle.
- `client/src/components/` and `styles/`: independent interface components and modular styles.
- `client/src/physics/`: fixed-timestep simulation, devices, mechanism state, and independent rendering.
- `client/src/domain/`: message queues, execution history, and captions for actual changes.
- `shared/`: declarative operations, state, and compilation protocols.
- `server/src/`: model adapters, prompts, scene permissions, and HTTP handling.

See [Game Design](./docs/game-design.md) for design and development requirements, [Code Structure](./docs/code-structure.md) for module responsibilities, [Development Tasks](./dev-todo.md) for progress, [Level Definitions](./client/src/levels/README.md) for adding levels, and the [Server Guide](./server/README.md) for API configuration.

The bakery artwork is adapted from yihanzhao231's `temp/1024-zyh@30d802f`. Physics and commands use the project's shared runtime, and the original level ID `reality-breakdown` is retained.

The static introduction page lives in `site/`. The live game at [muuyyy.cfd/demo/](https://muuyyy.cfd/demo/) includes fifteen levels, three-star scoring, compact per-message controls, and a unified acceleration vector, with synchronized frontend and backend protocols. Versions, backups, and rollback instructions are recorded in [Live Game Deployment](./deploy/live-game.md); early introduction-page backups are described in [deploy/README.md](./deploy/README.md).

The live game calls models only through same-site HTTPS forwarding. The backend listens only on a loopback address, and keys remain on the server. Its health check is `/api/health`. The shared-capability version completed two real-model verification rounds, one local and one live, with 85 commands in each round.

See [Star Gameplay](./docs/star-gameplay.md) for message controls and vector semantics, and [Phase-Based Physics Puzzles](./docs/phase-puzzles.md) for the current fifteen-level routes.

Integrated release `75af06a` deployed scene rendering, continuous passive springs, a live title animation, background ecology, exit absorption, sound effects, message shortcuts, three illustrated lessons, and the expandable rule list. Its independent build passed 616 tests, with public-site three-star routes and real API calls verified. See the [Deployment Notes](./deploy/live-game.md) for the actual live version and [Verification](./docs/verification.md) for the latest checks.

The bird, acceleration-feedback, and impact-feel release `5e73f8a` is live. Its independent build passed 666 tests. Gemini support shipped in the same release; production switched to `gemini-3.1-flash-lite` and passed real compilation checks, while retaining the original DeepSeek key. Backups, asset checks, and paired rollback instructions are in the [Deployment Notes](./deploy/live-game.md).

The entry-screen and scenery release `9f4c2e8` is live: the Steel and Steam title screen, a three-chapter/nine-level gallery, best star counts, nine backgrounds, particle waterfalls, and upbeat music. Its independent build passed 741 tests, with public-site three-star routes, progress persistence, and Gemini verified. The previous release and backups are retained.

Rule-change trajectory comparisons, intuitive language presets, and overtime scoring are specified in [World rewrite feedback](./docs/world-rewrite-feedback.md).
