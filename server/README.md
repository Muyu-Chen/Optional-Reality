# 模型规则编译服务

后端只编译用户准备的消息，不运行物理世界，也不执行模型代码。`npm run dev` 同时启动 Vite 与 API；`npm run build && npm start` 用 Express 同时提供构建前端与 API，默认仅监听 `127.0.0.1:3001`。

复制根目录 `.env.example` 到 `.env`，填入所选服务的 key 后重启。已有 `.env` 时直接编辑，避免覆盖密钥。两个服务使用独立密钥；切换不会删除另一份配置，也不会在当前 key 缺失时发送旧服务的 key。

| 配置 | 默认值与用途 |
| --- | --- |
| `AI_PROVIDER` | `compatible` 使用原有 AI_* 配置；`gemini` 使用独立 GEMINI_* 配置 |
| `AI_BASE_URL` | `https://api.deepseek.com`；自动追加 `/chat/completions` |
| `AI_MODEL` | `deepseek-flash` |
| `AI_API_KEY` | 留空时 API 返回明确配置错误，本地指令仍可用 |
| `AI_RESPONSE_FORMAT` | `json_object`；可选 `json_schema` 或 `text`，始终验证实际输出 |
| `AI_THINKING` | `disabled`；仅 DeepSeek 域名发送此供应商参数，其他兼容服务省略 |
| `GEMINI_API_KEY` | Gemini 服务密钥，不回退到 AI_API_KEY |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite`，可按账户支持的模型修改 |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai`，自动追加 `/chat/completions` |
| `GEMINI_RESPONSE_FORMAT` | `json_object`；与原服务格式独立，实际规则仍经共享 schema 验证 |
| `GEMINI_REASONING_EFFORT` | `minimal`；可选 low / medium / high / omit，omit 不发送该参数 |
| `AI_TIMEOUT_MS` | `30000`，超时不改变消息或规则 |
| `PORT` | `3001` |
| `APP_ORIGIN` | 可选，部署在反向代理后时指定公开站点 origin |

DeepSeek 的请求格式与 JSON 输出参数依据 [Chat Completions 官方文档](https://api-docs.deepseek.com/api/create-chat-completion/)。通用结构化输出的模式与校验原则参考 [OpenAI Docs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat)；不假设所有兼容供应商支持 `json_schema`。

Gemini 通过 [Google 官方 OpenAI 兼容入口](https://ai.google.dev/gemini-api/docs/openai) 复用同一规则编译器、请求取消与错误处理；不向 Google 发送 DeepSeek 的 `thinking` 参数。[Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) 为本轮选用的稳定低延迟默认模型。切换方法：

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your-google-key
# 原 AI_API_KEY 保留，不需要覆盖
```

改回 `AI_PROVIDER=compatible` 即使用保留的 DeepSeek / 兼容服务。示例 key 只是占位，不提交真实 `.env`。线上持久配置与开发机配置分开维护，发布代码不自动上传开发机 key。

- `GET /api/status` 只返回模型名与是否配置密钥。
- `GET /api/health` 返回 `{ "ok": true }`，禁止缓存，不调用供应商或返回模型配置。
- `POST /api/compile` 接收关卡 ID、请求 ID、场景版本、队列版本、消息快照和规则快照。关卡能力由服务端目录决定，不接受客户端自定义权限或模型地址。
- 模型输出只允许声明式操作：重力设置或反转、水平加速度、环境属性设置或缩放、传感器到门的接触触发器。有限数值超范围由代码限幅并返回 adjustments，模型保留原请求数字；未知目标、非有限值、受保护物体、任意代码和不支持条件仍拒绝。
- 整批消息 ID、顺序、内容结构和操作必须全部通过验证才返回 ready；不会执行已准备的规则。客户端检查版本，并在真正发送时再次校验。
- 编译会暂停模拟；用户编辑、排序、删除、Reset 或离开页面时取消请求，迟到响应不覆盖当前队列。API 失败不会悄悄切换为本地解析。
- 所有关卡共享 gravity、acceleration_x、restitution、friction。设备与 preset 结构权限来自服务端注册的场景，不接受客户端自定义权限。模型获得名称、别名和 editableProperties；初始快照严格校验，操作额外检查可编辑性。
- 完整属性目录来自 `shared/physics-capabilities.ts`，由 `compiler-prompt.ts` 放入全关共用的固定系统前缀，包含范围、单位、语义、五类操作和输出 schema。关卡描述在动态状态与玩家消息之前，同关状态变化不改变前面的场景字节。
- 模型兜底理解口语、同义表达和未被本地词表覆盖的错词，不要求命中特定例句；代码负责范围、权限与结构校验。缓存命中不作为编译成功或延迟保证，自动测试不调用真实供应商。
- 模型可返回 understoodAs 说明纠正后的句子，客户端保留原文供 Send now 前检查；已知简单错词无需网络。方向冲突等歧义不能用纠错掩盖，详见 [消息理解](../docs/command-language.md)。
- 主界面提交自由语言后自动准备；Send now 只执行已准备操作。面包机蓄力和首次教学由本地游戏事件负责，模型不生成暂停、压缩或释放代码。
- 服务限制请求大小、每分钟请求数与并发数，拒绝跨源 POST，不返回供应商错误正文或密钥。当前没有用户登录或账户计费体系，默认用于本地开发。

真实请求与自动测试应分别报告。自动测试用模拟供应商验证 JSON、超时、拒绝响应、目标权限、HTTP 错误和身份版本；填好本地密钥后可以手动在界面准备一条消息验证真实模型。

手动执行 `npm run check:live` 会使用后端 `.env` 发出真实付费请求：八关分别验证十条错词、口语、方向和组合/相对指令，再验证设备限幅、命名表面和三类非法指令。使用 `LIVE_COMPILER_URL=https://muuyyy.cfd/api/compile npm run check:live` 则经本站后端转发测试，不向站点发送开发机密钥。结果保存在忽略的 `.localwork/live-api-check/`，不属于自动测试。

线上链路为浏览器同源 `/api/` → Apache HTTPS 反代 → `127.0.0.1:3001` → 所选模型服务。后端端口只监听回环，不单独开放公网模型 API 端口；浏览器无法获得模型密钥。`/api/compile` 是游戏正常使用的公网网站路由，保留输入校验、同源检查和限流；同源检查不等同于用户认证。

部署到现有 Apache 时，将 `/api/` 代理到该本地服务，游戏 CSP 的 `connect-src` 使用 `'self'`，服务配置 `APP_ORIGIN`。实际发布版本与备份见 [线上记录](../deploy/live-game.md)。
