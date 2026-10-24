# 模型规则编译服务

后端只编译用户准备的消息，不运行物理世界，也不执行模型代码。`npm run dev` 同时启动 Vite 与 API；`npm run build && npm start` 用 Express 同时提供构建前端与 API，默认仅监听 `127.0.0.1:3001`。

复制根目录 `.env.example` 到 `.env`，填入 `AI_API_KEY` 后重启服务。已有 `.env` 时直接编辑，避免覆盖密钥。

| 配置 | 默认值与用途 |
| --- | --- |
| `AI_BASE_URL` | `https://api.deepseek.com`；自动追加 `/chat/completions` |
| `AI_MODEL` | `deepseek-flash` |
| `AI_API_KEY` | 留空时 API 返回明确配置错误，本地指令仍可用 |
| `AI_RESPONSE_FORMAT` | `json_object`；可选 `json_schema` 或 `text`，始终验证实际输出 |
| `AI_THINKING` | `disabled`；仅 DeepSeek 域名发送此供应商参数，其他兼容服务省略 |
| `AI_TIMEOUT_MS` | `30000`，超时不改变消息或规则 |
| `PORT` | `3001` |
| `APP_ORIGIN` | 可选，部署在反向代理后时指定公开站点 origin |

DeepSeek 的请求格式与 JSON 输出参数依据 [Chat Completions 官方文档](https://api-docs.deepseek.com/api/create-chat-completion/)。通用结构化输出的模式与校验原则参考 [OpenAI Docs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat)；不假设所有兼容供应商支持 `json_schema`。

- `GET /api/status` 只返回模型名与是否配置密钥。
- `POST /api/compile` 接收关卡 ID、请求 ID、场景版本、队列版本、消息快照和规则快照。关卡能力由服务端目录决定，不接受客户端自定义权限或模型地址。
- 模型输出只允许有限的声明式操作：重力设置或反转、环境属性设置或缩放、传感器到门的接触触发器。一条消息可返回多条操作，未知目标、范围外数值、直接修改球、任意代码和不支持的条件一律拒绝。
- 整批消息 ID、顺序、内容结构和操作必须全部通过验证才返回 ready；不会执行已准备的规则。客户端检查版本，并在真正发送时再次校验。
- 编译会暂停模拟；用户编辑、排序、删除、Reset 或离开页面时取消请求，迟到响应不覆盖当前队列。API 失败不会悄悄切换为本地解析。
- 等级能力与关卡编辑权限来自服务端注册的关卡配置，不接受客户端提供的权限。模型获得场景别名和 editableProperties；合法初始状态仍可包含只读值，操作另外检查可编辑性。
- 主界面提交自由语言后自动准备；Send now 只执行已准备操作。面包机蓄力和首次教学由本地游戏事件负责，模型不生成暂停、压缩或释放代码。
- 服务限制请求大小、每分钟请求数与并发数，拒绝跨源 POST，不返回供应商错误正文或密钥。当前没有用户登录或账户计费体系，默认用于本地开发。

真实请求与自动测试应分别报告。自动测试用模拟供应商验证 JSON、超时、拒绝响应、目标权限、HTTP 错误和身份版本；填好本地密钥后可以手动在界面准备一条消息验证真实模型。

部署到现有 Apache 时，需要将 `/api/` 代理到该本地服务，并把页面 CSP 的 `connect-src` 从 `none` 调整为 `'self'`，服务配置 `APP_ORIGIN`。本次没有修改服务器或发布这些 API 路由。
