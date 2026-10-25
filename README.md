# Optional Reality

**Reality is optional. Change the rules. Choose the moment.**

A browser-based 2D physics puzzle game built for SBUHacks 2026. Rewrite gravity, bounce, friction, and device controls in natural language, then choose when each change takes effect. Explore Motion, Collisions, and Devices, collecting stars on the way to the exit.

[Play on desktop](https://optionalreality.site/) · [Introduction](https://optionalreality.site/intro) · [Gameplay demo](https://optionalreality.site/showcase/) · [Narrated demo](https://optionalreality.site/showcase/narrated.html)

## How to play

- **Enter** prepares and queues a rule; **Send now** applies it when you choose.
- **Shift+Enter** applies only the current input. **Shift+Tab** pauses and opens settings.
- Collect three stars before reaching the exit for full score. **Try again** resets the world and keeps your messages.

Try `stop gravity`, `reverse gravity`, or `Set surface bounce to 0.9`. Explicit commands use a local AST; free-form language goes to Gemini, with DeepSeek as the configured production fallback. Shared validation checks the result, and Matter.js runs the physics. The model never executes generated code.

## Run locally

Use Node.js 26 and npm.

```sh
npm ci
cp -n .env.example .env
npm run dev
```

Set `AI_API_KEY` in `.env` for the default DeepSeek configuration, or follow the [server guide](./server/README.md) to configure Gemini and failover. Keys stay on the backend. Local commands work without a model key.

Open [localhost:5173/demo/](http://127.0.0.1:5173/demo/). To use an existing backend without copying its keys, set `DEV_API_ORIGIN` and run `npm run dev:web`.

```sh
npm test        # Mocked APIs; no paid model calls
npm run build  # Type-check and build
npm start      # Serve the build and API on localhost:3001
```

## Project structure

- `client/` — React interface, levels, and Matter.js / Canvas simulation.
- `server/` — Express API, model requests, and compiler prompts.
- `shared/` — AST parsing, declarative operations, and Zod validation.
- `site/` — Introduction page and demo media.

## Documentation

- [AI usage and credits](./AI_USAGE.md)
- [Rules and command interpretation](./docs/command-language.md)
- [Levels and puzzle design](./docs/phase-puzzles.md)
- [Code structure](./docs/code-structure.md)
- [Testing](./docs/testing.md) · [Verification](./docs/verification.md)
- [Deployment and rollback](./deploy/live-game.md)
