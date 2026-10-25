# AST 与物理意图提示词发布 — 2026-10-25

本次在当前线上 `277ecc5`（开场提示与加法指令）上叠加第一版 AST、本地队列集成和物理意图提示词，保留 Gemini → DeepSeek 兜底及新旧浏览器协议兼容。发布前发现线上已从原兜底版本更新，版本保护阻止了旧基线覆盖；最终以最新线上源码重新构建和验证。

- 应用 current：`/opt/optional-reality/releases/20261025T054254Z-ast-meaning`。
- 静态 current：`/var/www/muu-tech/releases/20261025T054254Z-ast-meaning-optional-reality-game`。
- 上一版：应用 `20261025T053645Z-277ecc5-briefing-arithmetic`，静态为同名加 `-optional-reality-game`，原目录完整保留。
- 服务器备份：`/var/backups/optional-reality/20261025T054254Z-ast-meaning/`，目录 700；包含旧源码（排除 .env 与依赖）、旧静态目录、原链接、服务单元、仅在服务器保留的配置备份（600）及验收日志。
- 独立发布快照与截图：`.localwork/ast-latest-release-20261025/`，不提交构建产物、日志或私有配置。
- 应用归档 SHA256：`a65fd39d1ffae09537a8571fc6e4a183b4d4da9c4bb3ab4bb73584f2161e0925`；静态归档：`fbcfe3af9c9cf42fd6bf0ce90290ac2302263ae10369e2d0d9fdfcd152a3baa9`。服务器接收后复验通过。

## 已上线行为

- 本地完整解析中英文组合、多个明确目标和相对修改；保留原文／纠错／限幅回显。任何未解析部分使整条消息转交模型，准备不执行。例：`把发射板和杯底的弹性设为0.5，并关闭重力`。
- 模型按物理意图理解“向上的浮力”“让小球向上浮起来”“Give everything upward buoyancy.”，默认设置环境向上 1 m/s²，保留水平分量；指定 0.75 m/s² 时保留该幅值。解释通过 understoodAs 展示。
- 首轮真实验收发现 Gemini 将 5 newtons 静默转为 -5 m/s²。已加强提示词并加入 shared/force-units.ts：含明确牛顿量的请求不能被成功编译，禁止伪造力到加速度的数值转换；补充 3 条模拟错误模型输出的回归测试。物体速度、位置、未知设备及其他权限边界继续校验。
- 既有开场规则提示、加法／乘法区分、逐条编译和旧页面错误兼容保持可用。

## 兜底与配置保持

部署前后对 `/etc/optional-reality/.env` 逐字节 cmp 一致，没有写入或替换配置。独立主／备密钥保留在服务器，未上传开发机配置或下载密钥。config、ai-client、compiler、app、provider-fallback 和协议常量与上一线上版本逐字节核对一致。

仍为 Gemini 优先，失败后最多一次 DeepSeek；主服务 8000 ms，两次共享 30000 ms。取消后不重试，明确的规则拒绝不通过更换模型绕过。继续记录脱敏 systemd 事件，查询方式见 [兜底记录](./api-fallback.md)。

## 验证

- 独立最终快照：101 个 Vitest 文件、985 项测试，加 13 项首页动画测试，共 998 项通过；类型检查、生产构建与 diff 检查通过。保留既有超过 500 kB 的单块构建提示。
- 服务器 Node.js 24.22.1：类型检查与 122 项 AST／游戏交互／提示词／兜底定向测试通过。
- 服务器端到端真实 Gemini 四条浮力表达 4/4；在测试 fetch 适配器内模拟 Gemini 503 后，真实 DeepSeek 相同四条表达 4/4，保留理解说明和水平分量。禁止力单位转换、直接速度修改、未知设备三个反例 3/3。最终两次有效批量请求约 1660 ms 与 1651 ms；未向公网接口增加强制故障开关。
- 三个域名的健康与新 HTML 通过。新 JS `index-BNsNtku8.js` 的公网 SHA256 与独立构建一致，旧 `index-O8uPBjH5.js` 仍返回 200；有效浮力请求为 HTTP 200，旧页面错误为 422、新协议逐条错误为 200。
- 浏览器打开线上 catch-cup，输入 `把发射板和杯底的弹性设为0.42，并关闭重力` 后立即显示 Ready 和三个操作；加速度仍为原来的向下 2、计时仍为 30 秒，确认只准备。截图 `.localwork/ast-latest-release-20261025/public-ast-ready.png`；已删除本次创建的消息，恢复原空队列，没有改动其他入口的已有草稿。
- 正式服务 active，应用／静态指向本节 release，配置未变，新公网请求已出现在 systemd 日志。

## 回退

先确认两个 current 仍为本节版本；有后续更新则停止并核对后续记录。只切回上一代码／静态目录，保留服务器配置和两套密钥；上一版同样支持当前兜底设置。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/20261025T054254Z-ast-meaning"
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T054254Z-ast-meaning-optional-reality-game"
ln -s "$app_root/releases/20261025T053645Z-277ecc5-briefing-arithmetic" "$app_root/.rollback-ast-app-$$"
mv -Tf "$app_root/.rollback-ast-app-$$" "$app_root/current"
systemctl restart optional-reality
curl --fail http://127.0.0.1:3001/api/health
ln -s "$site_root/releases/20261025T053645Z-277ecc5-briefing-arithmetic-optional-reality-game" "$site_root/.rollback-ast-web-$$"
mv -Tf "$site_root/.rollback-ast-web-$$" "$site_root/current"
```
