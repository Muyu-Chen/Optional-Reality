# Gemini → DeepSeek 兜底发布 — 2026-10-25

本次在现有 `94c7f501c981b4d8663013cb26c31ae6c1796822` 上，仅叠加供应商兜底、脱敏日志和浏览器协议兼容补丁。未包含共享工作区的 AST、物理意图提示词和开场规则提示改动。

- 应用：`/opt/optional-reality/releases/20261025T052554Z-api-fallback-94c7f50`。
- 静态：`/var/www/muu-tech/releases/20261025T052554Z-api-fallback-94c7f50-optional-reality-game`。
- 备份：`/var/backups/optional-reality/20261025T052554Z-api-fallback-94c7f50/`，目录 700，包含旧应用源码（排除 .env 与依赖）、旧静态目录、原链接、服务单元和仅在服务器保留的配置备份（600）。旧 release 与旧哈希资源继续保留。
- 独立本地发布快照：`.localwork/api-fallback-20261025/source/`；归档和测试日志不提交。应用归档 SHA256 `5be6ae8584d0f2379c8c29bea846a75935442428333bca724701609a58ebc2b8`，静态归档 `cff6d110fbcb3777db27ef528745eae39416ead00baca6105d3cd460b97ebe62`，服务器再次校验通过。
- 持久配置保留 Gemini 主服务与原两套独立密钥，仅设置 `AI_FALLBACK_PROVIDER=deepseek`、`AI_PRIMARY_TIMEOUT_MS=8000`、`AI_TIMEOUT_MS=30000`。未上传开发机配置或下载服务器密钥；配置仍为 root:optional-reality、640。

## 行为与日志

Gemini 遇到网络／HTTP 错误、超时、损坏 JSON／顶层响应／消息身份时，再尝试一次官方 DeepSeek 服务。两次共用 30 秒预算，Gemini 最多 8 秒；取消后不重试。合法的模型拒绝、逐条规则错误和受保护目标不触发换模型。下一次请求仍优先 Gemini，不永久切换服务。

新版浏览器携带 `X-Compiler-Protocol: per-message-v1`，继续接收独立成功／错误项；旧页面缺少标记时，含失败项的响应转为 HTTP 422 `{error}`，不再让旧 schema 处理空 operations／error 字段。全成功响应保持原格式。前端资源 `index-Cku7sNRL.js` 仅包含这一协议标记补丁，旧 `index-C1TsuRUb.js` 仍可加载。

```sh
ssh -o User=root muuyyy 'journalctl -u optional-reality --since "15 minutes ago" --no-pager -o cat'
```

事件包括 `compiler_provider_success`、`compiler_provider_failed`、`compiler_message_rejected`，记录请求 ID、服务、耗时、HTTP 状态和备用使用情况；upstreamStatus 为供应商实际 HTTP 状态。不记录密钥、玩家原文、提示词或响应正文。

原历史日志只有启动／停止记录；Apache 在纽约时间 01:15:14 的重启窗口记录过一次回环端口连接失败。这不能解释后来的 Gemini 拒绝原因，用户提供的 Zod 数组则明确反映浏览器 schema 不接受逐条失败结果。

## 验证

- 独立发布源码完整 92 个 Vitest 文件、849 项测试，加 13 项动画测试，共 862 项通过；类型检查和生产构建通过。构建保留既有超过 500 kB 的单块提示。
- 服务器 Node.js 24.22.1 上类型检查与 81 项定向测试通过，复用完全相同 package-lock 的旧 release 依赖。
- 服务器真实 Gemini 正常请求约 932 ms；仅在测试 fetch 适配器中模拟 Gemini 503 后，实际 DeepSeek 接管并返回正确向上加速度，约 1459 ms。没有向公网接口增加强制故障开关，正式配置未被测试改写。报告保存在服务器备份目录 live-check.log。
- 旧／新浏览器失败格式通过真实回环 HTTP 检查；上线后公网有效命令为 HTTP 200，旧页面非法命令为 422，可协商的新页面非法命令为 200 加逐条错误。
- 三个域名健康与新 HTML 通过；公网新 JS 的 SHA256 与发布构建一致，旧哈希资源返回 200；正式服务 active，仍只监听回环端口。新请求已出现在 systemd 结构化日志。

## 回退

先核对 current 仍为本节目录；若已有后续发布，停止并核对后续记录。旧版代码不识别新增兜底开关，因此回切代码后即恢复 Gemini 单服务；无需覆盖持久配置或密钥。不要把含密钥的旧配置整份恢复到已被用户更新过的配置上。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/20261025T052554Z-api-fallback-94c7f50"
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T052554Z-api-fallback-94c7f50-optional-reality-game"
ln -s "$app_root/releases/20261025T051001Z-94c7f50" "$app_root/.rollback-fallback-app-$$"
mv -Tf "$app_root/.rollback-fallback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl --fail http://127.0.0.1:3001/api/health
ln -s "$site_root/releases/20261025T051001Z-94c7f50-optional-reality-game" "$site_root/.rollback-fallback-web-$$"
mv -Tf "$site_root/.rollback-fallback-web-$$" "$site_root/current"
```
