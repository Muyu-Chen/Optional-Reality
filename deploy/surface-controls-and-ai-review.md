# 表面行为与 AI 二次解释发布 — 2026-10-25

## 当前版本

- 提交：`dcc2bac9a3cd3a39c7d05fbc071f61ed6c95c0be`，正常推送 `main`。
- 应用：`/opt/optional-reality/releases/20261025T064128Z-dcc2bac-surfaces`。
- 静态：`/var/www/muu-tech/releases/20261025T064128Z-dcc2bac-surfaces-optional-reality-game`。
- 根目录为游戏，`/intro` 为介绍，`/demo/` 保持兼容；`optionalreality.site`、`www.optionalreality.site`、`muuyyy.cfd` 同步。

一般弹性／摩擦指令影响所有可修改表面；点名仅改一处，相对修改分别读取每个表面的当前值，固定墙体保持保护。队列直接标识 All surfaces 或具体名称，独立材质的场景标签显示实际值。详见[表面指令行为](../docs/surface-command-scope.md)。

此前已上线的 `7db06ab` 三秒初始状态、真正的加减操作和一次 AI 对话修复继续保留：第二次可执行解释进入 Ready 供玩家发送或删除，不重复语义启发式，不自动执行修复结果。修复和普通调用均保留 Gemini → DeepSeek 接管、整体预算及旧客户端协议兼容。此次基线还包含已合入 main 的物理意图预设、规则结果对照和一次救援加时。

## 验证

- 精确发布源码与测试快照逐文件一致。112 个 Vitest 文件、1053 项测试，加首页 13 项 Node 动画测试，共 **1066 项通过**；类型检查和生产构建通过。保留既有 JS 大于 500kB 的构建提示。
- 真实 Matter 比较 Catch Tutorial 的通用 1.5、发射板 1.5 和发射板 1，确认 1.5 实际反弹更强；原有九关路线、界面、Undo 与重试全部回归通过。公网浏览器直接输入用户原话，发送后实际画面同时显示 Launch pad 1.5 与 Cup base 1.5，剩余两条消息仍可发送；截图保存在本轮忽略目录的 `live-surface-behavior.png`。
- 临时回环 3118 服务调用真实 Gemini：中文通用 10 返回 world 弹性 1.5，点名发射板返回对应对象，杯底设为 0；涂色错误只影响自己的消息。前后端通过同一共享执行器应用通用材质规则。
- 公网逐域检查根目录、关卡与选关深链接、介绍页、旧 demo、HTTP 跳转、API 健康、私有路径 404、旧哈希资源和 26 个当前资源（共 78 次 SHA256 比对）。同一 SAN 证书、持久配置和两份 API key 均保持不变。
- AI 修复的真实供应商验证在上一版使用了受控错误首答／503，后续修复请求实际发往供应商；这是容错验证，不是模型自然出错率统计。

## 备份与回退

服务器备份：`/var/backups/optional-reality/20261025T064128Z-dcc2bac-surfaces`；本地副本：`.localwork/deploy-20261025T064128Z-dcc2bac-surfaces/backup`。静态、排除 `.env`／依赖的应用源码、路由配置分别归档，两端 SHA256 一致。开发机没有下载实际 `.env` 或证书私钥。

上一对版本为：

- `/opt/optional-reality/releases/20261025T061037Z-7db06ab-ai-review`
- `/var/www/muu-tech/releases/20261025T061037Z-7db06ab-ai-review-optional-reality-game`

回退前须确认两个 current 仍指向本页当前版本；如果已有后续发布，先核对最新记录。用临时软链接原子替换应用 current，重启 `optional-reality` 并确认回环 3001 健康，再成对替换静态 current。只回退代码，不改持久 `.env`、路由或证书。正式服务保持普通用户运行、仅监听回环 3001；3118 预检服务验收后停止。

上一 AI 修复版本备份仍在 `/var/backups/optional-reality/20261025T060532Z-cbebfa4-ai-review`；其固定快照为 1017 项测试通过，已完成真实修复、三个域名及浏览器验收。本轮保留其 release 和旧静态资源。
