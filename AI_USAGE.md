# AI Usage

Optional Reality uses AI in two distinct ways: interpreting player-written rules in the game, and assisting development. This document describes both, including generated artwork and the recorded demo.

## Using AI in the game

1. Open [Optional Reality](https://optionalreality.site/) and choose a level.
2. Write a rule in English or Chinese. **Enter** queues it; the game first tries the local parser. Conversational wording that cannot be fully parsed is sent to the configured model.
3. Check the prepared rule, any **Understood as** explanation, and any value adjustment. **Send now** applies that rule when you choose. **Shift + Enter** prepares and applies only the current input; an AI-revised interpretation always waits for review and a manual send.
4. Watch the actual motion, then adjust the rule or use **Try again** to compare timing. Model waits and teaching pauses do not consume simulation time.

Examples:

| Goal | Example | What changes |
| --- | --- | --- |
| Preserve motion without falling | `stop gravity` | Vertical acceleration becomes zero; existing velocity remains |
| Brake a rightward drift | `acceleration leftward 1` | Horizontal acceleration points left; the ball first slows, then turns |
| Redirect a collision | `Set surface bounce to 1` | Editable surfaces become bouncier |
| Launch the bread | `Set toaster power to 2` | The editable toaster charges on contact and launches the loaf |
| Link an existing bell and shutter | `When the bread touches the bell, open the shutter` | Installs the supported sensor-to-gate rule in the final bakery level |

These explicit examples can be parsed locally. An LLM is useful for freer wording, synonyms, and requests beyond the local grammar; a Ready result alone does not imply that a model was called. Available objects and **Editable / Preset** labels still determine what a level permits.

## What the model does

The model translates intent into a small set of declarative operations. It receives the selected messages, the current rule state, and the level's object names, aliases, supported capabilities, and editing permissions. The backend and client validate its output before execution.

Matter.js and the local game runtime calculate all motion, collisions, charging, scoring, and timing. The model does not move the ball directly, change protected objects, execute arbitrary generated code, calculate each animation frame, or invent new physics mechanisms. A request outside the supported capabilities can be rejected. Finite values outside a supported range are clamped and shown to the player.

The compiler supports a Gemini profile and an OpenAI-compatible profile, with DeepSeek as the default compatible provider. An explicitly enabled Gemini-to-DeepSeek fallback uses separate credentials. See [server configuration](./server/README.md), [command interpretation](./docs/command-language.md), and [AI repair behavior](./docs/compilation-repair.md).

For local setup, copy the placeholder-only [`.env.example`](./.env.example) to a new `.env`, or edit an existing `.env` without replacing it. Set `AI_PROVIDER=gemini` with `GEMINI_API_KEY`, or `AI_PROVIDER=compatible` with `AI_API_KEY`. Run `npm run dev`. Keys stay on the backend; do not put them in `VITE_` variables or commit them. With no configured backend key, supported local commands still work; conversational AI requests need a configured service.

## AI-assisted development

Codex was used as a coding assistant for implementation and refactoring, physics-level design, tutorial copy and diagrams, debugging, tests, documentation, and deployment preparation. Human contributors supplied the project direction, gameplay preferences, and feedback that guided these changes.

AI suggestions were checked with TypeScript, automated unit and integration tests, production builds, deterministic Matter.js simulations, and browser playthroughs. The checked-in tests generally mock model responses; passing those tests is not evidence of a real provider's language accuracy. Separate real-model checks and their limits are recorded in [verification](./docs/verification.md) and the [model comparison](./docs/model-benchmark-2026-10-25.md). There is no claim that an LLM independently verified its own work or that every possible phrasing succeeds.

## AI-generated artwork and other sources

- The title gameplay illustration and the layered title sprites were generated with the built-in ImageGen tool. Their prompts and intended uses are retained in the [illustration provenance](./client/src/assets/title-gameplay-v1.md) and [layered-scene provenance](./client/src/assets/title-scene/README.md).
- The playable physics geometry, tutorial SVG diagrams, animation timelines, and rendering logic are implemented in code. Title artwork is decorative and does not determine collisions or scoring.
- Bakery artwork was adapted from yihanzhao231's `temp/1024-zyh@30d802f`, as credited in the main README; it is not presented as newly AI-generated artwork.

## Demo-video disclosure

The [looping demo](./site/showcase/README.md) is a recording of the actual game interface: chapter selection, visible character-by-character input, manual-send controls operated by a recording script, and three real three-star completions. It demonstrates **Bring It Back**, **Bank Shot**, and **A Little Stored Energy**.

Automation types supported commands and clicks the normal controls; it does not alter object positions, velocities, scores, permissions, or the physics timestep. The examples in this recording use local parsing, so the video is not a live-LLM benchmark. Editing adds crossfades and matching opening/closing frames. The footage is not AI-generated video. A muted player loops the HD MP4; the README's GIF preview also repeats continuously.

## 中文速览

游戏中的 AI 负责把中英文自然语言理解成受支持的规则；物理、计时和评分由本地引擎执行。Enter 排队，检查解释后按 Send now 执行；Shift + Enter 只应用当前输入，AI 修正后的解释仍需手动确认。开发中使用了 Codex 辅助编码、关卡、文案、测试和文档，标题插画与分层素材使用 ImageGen，来源与提示词见上方链接。演示视频是真实界面录制和自动输入，三关均实际三星通关，使用本地可解析指令。
