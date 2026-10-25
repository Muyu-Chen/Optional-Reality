# 线上游戏 — 2026-10-25

## 最新发布：面包机口语指令修复

当前前后端为 `20261025T072312Z-5d98103-toaster-language`（应用提交 `5d98103`）。3-1 的“toaster增加弹性”“toaster增加弹力”按机关上下文准备为弹射强度 +1，队列展示解释，发送才执行；模型提示采用相同规则。保留上一版 Start 和拓宽加时空间。131 项定向测试、构建及真实 Gemini 两条原话验证通过，三个域名已同步。备份和回退见 [本轮记录](./toaster-language.md)。

## 此前发布：Start 按钮与更宽的救援空间

该次前后端为 `20261025T070356Z-0345847-start-rescue`（应用提交 `0345847`）。倒计时旁增加 Start，直接开始当前世界并保留待发消息；救援加时向上、向右各扩展 20%，左框贴屏幕左缘，镜头平滑拉远。保留此前 API 和功能。三个域名已同步，备份与回退见 [发布记录](./start-and-rescue.md)。

## 此前发布：直觉一致的表面指令与 AI 二次解释

该次前后端为 `20261025T064128Z-dcc2bac-surfaces`（应用提交 `dcc2bac`）。通用弹性／摩擦指令影响全部可修改表面，点名才局部修改；队列与场景显示实际作用目标和值。保留三秒初始状态、加减操作、AI 一次修复后可执行解释进入 Ready、Gemini → DeepSeek 兜底。包含已合入 main 的物理意图预设、规则结果对照与一次救援加时。1066 项测试、类型检查和构建通过，三个域名同步；备份、实际模型验证及回退见[发布记录](./surface-controls-and-ai-review.md)。

## 此前发布：AST 本地解析与物理意图提示词

当前应用为 `20261025T054254Z-ast-meaning`，静态为同名加 `-optional-reality-game`。支持完整组合、多目标与相对修改，并理解“向上的浮力”等表达；保留最新开场提示、加法指令、Gemini → DeepSeek 兜底和浏览器协议兼容。服务器配置逐字节未变。独立快照 998 项测试、构建、真实主／备模型与公网浏览器验收通过；范围、备份与回退见 [本次发布记录](./ast-meaning.md)。

## 此前发布：Gemini → DeepSeek 兜底与旧页面兼容

该次发布应用为 `20261025T052554Z-api-fallback-94c7f50`，静态为同名加 `-optional-reality-game`。Gemini 失败后最多尝试一次独立 DeepSeek，默认 8 秒主服务、两次共用 30 秒预算；新增脱敏调用日志，并用协议标记兼容旧页面的错误格式。独立发布快照 862 项测试、构建、真实供应商接管和三个域名公网检查通过。配置、归档哈希、日志与成对回退见 [API 兜底发布记录](./api-fallback.md)。

## 最新域名与入口

三个域名 `optionalreality.site`、`www.optionalreality.site`、`muuyyy.cfd` 已共用一张 SAN 证书，根目录为游戏，`/intro` 为介绍页，旧 `/demo/` 保留。单证书续期演练、三个域名证书链与同源 API 验证通过。域名配置见 [域名与路由记录](./domains-and-routing.md)，当前 release 以本文顶部记录为准，下面保留此前游戏版本的发布历史。

## 历史版本：蒸汽朋克入口、生活背景与关卡画廊

- 地址：[muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，固定应用版本 `9f4c2e8ec0fd368c54ac2b516fcd4180ada24659`，release `20261025T040224Z-9f4c2e8`（UTC；本地日期 2026-10-25）。
- 应用 current：`/opt/optional-reality/releases/20261025T040224Z-9f4c2e8`；静态 current：`/var/www/muu-tech/releases/20261025T040224Z-9f4c2e8-optional-reality-game`。
- 开始页与选关采用 Steel and Steam 主题，黄铜机械浮岛、铜管门、齿轮、压力表和少量蒸汽；三章九关有真实几何预览、最近小关与本机最佳星数，保留直达链接。离开关卡取消旧编译，草稿保留。
- 九关有独立背景配置，行人、汽车与密集水粒子响应加速度；宇宙、山谷地标及晨光/午后/夜晚面包店各有区别。背景固定步长且与任务物理隔离；瀑布最终为 360 个细圆粒子与最多 24 个短寿命溅水。
- 原创音乐调整为 112 BPM、短音符、弹跳低音与轻合成敲击。开关、偏好、后台暂停及切关不叠加保持原逻辑。
- 固定提交在独立目录全新安装，83 个 Vitest 文件、728 项测试，加首页 13 项 Node 测试，共 741 项通过；类型检查、生产构建通过。保留原有大于 500kB 的 JS 构建提示。
- 20 个公网资源 SHA256 与独立构建完全一致。临时 3115 服务真实 Gemini 编译向上 2 通过后成对切换前后端；公网三条消息实际应用为 `(2,20)`、`(2,-20)`、`(2,20)`，正式服务 active，仅监听回环 3001，临时服务已停止。
- 公网浏览器实际从标题进入选关并游玩 bounce，完成 `.1 → 触地附近向上 1` 的三星路线；返回画廊显示 Cleared 与 Best score 3 of 3，标题显示 3/27。蒸汽朋克主界面截图为 `.localwork/deploy-living-world/live-steam-title.png`，浏览器 warning/error 为空，临时视口已恢复。
- 线上继续使用 `gemini-3.1-flash-lite`；持久 `.env`、原 DeepSeek key、Gemini key、Node、Apache/TLS 和服务权限均保留。开发机仅通过 Vite 的 DEV_API_ORIGIN 使用线上 API，没有复制真实 key；该选项不改变生产 API。

### 本轮备份与校验

- 服务器：`/var/backups/optional-reality/20261025T040224Z-9f4c2e8/`；本地：`.localwork/backups/living-world-20261025T040224Z-9f4c2e8/`。目录 700、文件 600，两端归档 SHA256 一致；源码备份排除 `.env` 和依赖，旧 release 与旧哈希资源保留。
- `site.tar.gz`：`c15f2eeac0f841abbec80fe59cdaaa0aab64fb4176e77668bd29f9540eaccc4c`。
- `app-source.tar.gz`：`a6ca65738cf9915afe4ace1d0fd5f054c4b0a024d5de2753226ff21588d1bb4b`。
- HTML：`76a27f1f5df6f916d2de88768390017876b5471e96751cfd7b6efd9a0b6210e2`。
- JS `index-Da5e5YLP.js`：`670cdc3e00dfefaafab32b7740b3a1b848533c9b3596ca9be2bef7c0f59a00af`。
- CSS `index-ByGujPd4.css`：`f174db223fb32a592ebc7718582f4f9c821ce194c337e7bf653aeca0ba0af8b8`。

### 成对回退到上一版

先核对 current 仍为本轮目录；若后续已有更新则停止。只回退代码，不修改持久 `.env`，上一版支持现有 Gemini 配置。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/20261025T040224Z-9f4c2e8"
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T040224Z-9f4c2e8-optional-reality-game"
test -f "$app_root/releases/20261025T030845Z-5e73f8a/server/src/index.ts"
test -f "$site_root/releases/20261025T030845Z-5e73f8a-optional-reality-game/demo/index.html"
apache2ctl configtest
ln -s "$app_root/releases/20261025T030845Z-5e73f8a" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/health
ln -s "$site_root/releases/20261025T030845Z-5e73f8a-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/status
```

## 历史版本：鸟、加速度反馈、碰撞手感与 Gemini 接口

- 游戏：[muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，应用版本 `5e73f8aba01a5c5d8654425d2efb04b04c1509fe`，release `20261025T030845Z-5e73f8a`（UTC；本地日期 2026-10-24）。
- 应用 current：`/opt/optional-reality/releases/20261025T030845Z-5e73f8a`；静态 current：`/var/www/muu-tech/releases/20261025T030845Z-5e73f8a-optional-reality-game`。正式服务 active，只监听 `127.0.0.1:3001`，临时 3115 服务已停止。
- 三个 subagent 分别完成独立鸟模块、加速度指示模块与碰撞呈现模块：小鸟 1.6 倍/鹰 1.8 倍及独立翼姿；星星旁的真实向量方向/数值和 600ms 变化强调；按真实入射法向速度产生的接触波纹和最多 8% 视觉压缩。碰撞观察器 700 tick 对照确认不改变物理轨迹。
- 固定提交独立全新安装后，74 个 Vitest 文件、653 项测试，加首页 13 项 Node 测试共 666 项通过；类型检查与生产构建通过。测试限制四进程，避免共享机器并行超时；没有放宽断言或单项超时。JS 包大于 500kB 的原有构建提示仍存在。
- 公网 20 个静态资源与独立构建逐字节一致，health/configured 正常。浏览器确认新资源、放大鸟和向量徽标，并实际完成 bounce 满分路线、0/3 到 3/3 与结算，warning/error 为空。
- 发布后先验证原服务正常，再读取用户更新的服务器 Gemini 配置；临时 Gemini 服务真实编译 `(2,-1)` 通过后重启正式后端。公网 Gemini 的向下/向上/反转依次得到 `(2,20)`、`(2,-20)`、`(2,20)`，浏览器自由语言 twenty 准备为向下 20。
- Gemini 接入共享 `/api/compile`，线上已按用户配置切换为 `AI_PROVIDER=gemini`、模型 `gemini-3.1-flash-lite`，configured 为 true。原 `AI_API_KEY` 保留，GEMINI_API_KEY 独立；没有上传开发机 `.env` 或下载服务器密钥。重启前的双 key 配置仅在服务器备份目录内另存 `provider-gemini.env`（root:root 600），重启前后文件逐字节一致。
- 保留 Node、Apache/TLS、服务单元及持久配置权限 root:optional-reality 640。现场证据与资源清单位于忽略目录 `.localwork/deploy-game-feel/`。

### 备份与校验

- 服务器备份：`/var/backups/optional-reality/20261025T030845Z-5e73f8a/`；本地：`.localwork/backups/game-feel-20261025T030845Z-5e73f8a/`，目录 700、文件 600，两端归档 SHA256 一致。源码备份排除 `.env` 和依赖，旧 release 与哈希资源保留。
- `site.tar.gz`：`7da5547129737aa58d3bfaf063ea2e18a36cccc9c3aa0ce63bb41a18bc9460b9`。
- `app-source.tar.gz`：`df6a5270d4951baae3de8e0529b25886ab98d92d57a9d250a715f76b57b4cf92`。
- HTML：`a46558ba9d8a0295fb8a09abf8c4cda28a58536ece452e555781b16881239ddd`。
- JS `index-DsOxP1JX.js`：`0669c775f2b2af93e649b783a6344167ca3bc19f4f5ce68d56fe9256d354b83e`。
- CSS `index-BnZ4Hu6a.css`：`a2e698b9dc43f3be3499ff896f0e81c83ac7b829399bf471cb14c37fa392f44b`。

### 回退到上一整合版

核对两个 current 仍为本节版本后再执行；若已有新发布，停止核对对应记录。代码成对回退，持久 `.env` 保持不变。旧版 `75af06a` 尚无 Gemini profile，回退后使用保留的原 AI_* 配置。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "/opt/optional-reality/releases/20261025T030845Z-5e73f8a"
test "$(readlink -f "$site_root/current")" = "/var/www/muu-tech/releases/20261025T030845Z-5e73f8a-optional-reality-game"
test -f "/opt/optional-reality/releases/20261025T024029Z-75af06a/server/src/index.ts"
test -f "/var/www/muu-tech/releases/20261025T024029Z-75af06a-optional-reality-game/demo/index.html"
apache2ctl configtest
ln -s "/opt/optional-reality/releases/20261025T024029Z-75af06a" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/health
ln -s "/var/www/muu-tech/releases/20261025T024029Z-75af06a-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/health
```

## 历史版本：连续物理、游戏反馈与图示教学

- 游戏：[muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，应用版本 `75af06a59d145e9325acb14dee46d13d51842e3b`，release `20261025T024029Z-75af06a`。标识使用 UTC，本地发布日期为 2026-10-24。
- 应用 current：`/opt/optional-reality/releases/20261025T024029Z-75af06a`；静态 current：`/var/www/muu-tech/releases/20261025T024029Z-75af06a-optional-reality-game`。前后端同版，正式服务 active，仅监听 `127.0.0.1:3001`；临时 3115 验证服务已停止。
- 包含连续被动弹簧、方向响应的背景云鸟、真实拾取反馈、黑洞吸入后结算、独立事件音效、三条紧凑消息、快捷应用、三课居中教学和全关规则清单展开。保留共享 main 中固定摩擦表面与 runway 别名更新。
- bounce 首访 `.9` 普通路线保留，主动加载满分教程才换 `.1` 与向上加速度 1；教程和暂停菜单均强调接近触地时发送。U 形轨道教程路线未改。
- 固定提交在独立目录全新 `npm ci` 后通过 66 个文件、603 项 Vitest、13 项 Node 首页测试、类型检查与生产构建，共 616 项。构建仍提示单个 JS 包大于 500kB，不影响本次通过。
- 公网 20 个静态文件 SHA256 全部与独立构建一致；健康检查正常、模型已配置。真实 DeepSeek Flash 三条方向消息依次应用为 `(2,20)`、`(2,-20)`、`(2,20)`。
- 实际浏览器完成 bounce 与 One More Turn 的 3/3；最终 bounce 页面确认先进入 Finding another reality… 吸入阶段，再显示 Full score。三条消息的发送按钮均为 28px，1280×720 无横向溢出；Enter 排队、Shift+Tab 设置、教程加载与重看均已检查。浏览器 warning/error 为空。
- 保留 Node、Apache/TLS、systemd 和服务器持久 `.env`，没有复制开发机密钥。应用配置仍为 root:optional-reality、640 权限。现场证据与资源清单位于忽略目录 `.localwork/deploy-motion/`。

### 本轮备份和资源

- 最终切换前服务器备份：`/var/backups/optional-reality/20261025T024029Z-75af06a/`；本地 `.localwork/backups/motion-20261025T024029Z-75af06a/`，目录 700、文件 600，归档两端 SHA256 一致。源码归档排除 `.env` 和依赖。
- `site.tar.gz`：`3db338cdedd4d0ea9ca73a87c07bfcff4280aa12d1ea5b5a93a466394b5d30bc`。
- `app-source.tar.gz`：`e7127df04a08c61253b987a8b2168f3e8e3b9e9efecdc45485d2b5cd00aa4805`。
- 最终 HTML：`51896cbc48c2c585451680bcfcc8d3f183cbaeeb85a11a6d5990842ad89a3e9d`。
- JS `index-BrfqxEMN.js`：`405590d1fbeb46ab5d8b763badc3358fb0585a4fb7db929ef45bb0d6c2553236`。
- CSS `index-CG-rJbt2.css`：`52ccfacc0b0f2017c9d748147cdf459b23eb81ede44a33e2619ecaf58ec058ee`。
- 首页：`008e27587b18371bd8b34c11d5eb16d22b2e2e566df62391cf0c9e4f987b9eb4`，包含两幅实时 Canvas 示意图。
- 发布先核对实际在线 `b7db0cd` 并完整备份，再切换整合版 `20261025T023726Z-acd3840`；随后统一暂停菜单的旧时机提示，发布本节最终版。两次 release 均保留，旧哈希资源继续可用。
- 整合前 `b7db0cd` 的备份仍在 `/var/backups/optional-reality/20261025T023726Z-acd3840/` 与本地 `.localwork/backups/motion-20261025T023726Z-acd3840/`；站点归档 `581194aa389e3a411bfc0e629ecc7342fdff1a9b644b63bae14504b376b6e9cf`，源码归档 `3c3ef59fa52a22dd5e3a7765430089714e124e5976553373add1677c42cf0a70`。更早本轮快照的 release 和原备份也保留。

### 回退到上一整合版

先核对 current 仍为本节版本；如果已有更新，应停止核对新记录。只切换前后端代码，不回退持久 `.env`。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "/opt/optional-reality/releases/20261025T024029Z-75af06a"
test "$(readlink -f "$site_root/current")" = "/var/www/muu-tech/releases/20261025T024029Z-75af06a-optional-reality-game"
test -f "/opt/optional-reality/releases/20261025T023726Z-acd3840/server/src/index.ts"
test -f "/var/www/muu-tech/releases/20261025T023726Z-acd3840-optional-reality-game/demo/index.html"
apache2ctl configtest
ln -s "/opt/optional-reality/releases/20261025T023726Z-acd3840" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/health
ln -s "/var/www/muu-tech/releases/20261025T023726Z-acd3840-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/health
```

## 历史版本：结算界面、可读性与背景音乐

- 游戏：[muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，版本 `7da00d4bcde298acf4b0be3d54cdfcf63fdf3f2e`。
- release ID `20261025T010404Z-7da00d4`（UTC 标识；本地发布日期为 2026-10-24）。应用 current 为 `/opt/optional-reality/releases/20261025T010404Z-7da00d4`；静态 current 为 `/var/www/muu-tech/releases/20261025T010404Z-7da00d4-optional-reality-game`。本轮文档收尾通过只读 SSH 再次核对两个真实指向、正式服务 active 及回环健康 `{ "ok": true }`。
- 此版包含九关与原有评分/加速度规则、新结算星形、强化的配色字号和首次可信操作后播放的原创背景音乐。音乐可独立关闭、保存偏好，切关不叠加。第一轮线上 UI、满分路线和音乐生命周期已验收；第二轮新场景与动画尚未发布，不包含在此记录中。
- 发布记录与现场证据位于忽略目录 `.localwork/deploy-polish/`。真实公网模型向量验收三条：向下得到 (2,20)，向上得到 (2,-20)，反转后得到 (2,20)。
- 保留原 Node、Apache/TLS、systemd 与持久 `.env`，后端继续只监听回环地址。

### 备份与资源校验

- 服务器备份 `/var/backups/optional-reality/20261025T010404Z-7da00d4/`；本地 `.localwork/backups/polish-20261025T010404Z-7da00d4/`，源码备份不包含 `.env` 或依赖。
- `site.tar.gz` SHA256：`3fcb09fc78e6b986609e0cb9a7e57a318865d1aa624699aa319a0106c79a471c`。
- `app-source.tar.gz` SHA256：`e0023579962a5314cc716188abd12e8ea66d6832f9d4c70a3a565f07275cb398`。
- HTML SHA256：`76bf9b8f92993227934c6ed41987fcc2271421d7da4b252231ee3455a5f35892`。
- JS `index-C5kyAlcC.js` SHA256：`a8fa69f77b378e76925cbad5792147b928ee4acaddcc5679421d1e168607be81`。
- CSS `index-Dt2Chu3I.css` SHA256：`062efac7c9cdc10fa48b6cecf5d16800caf0d68d2ef1ef5f7303c81d9a65894f`。
- 首页 SHA256：`d2d3dc39f722a2c353a1ed3a6f1cf32e2eec4ec6871e3755028c249a92c8a1fa`。文档收尾复验已保存公网 HTML/JS/CSS/首页，均与计划中的哈希一致。

### 回退到上一九关版

先检查 current 仍为本节版本，若已有新发布应停止并核对新记录。只回退前后端代码，不回退持久 `.env`。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "/opt/optional-reality/releases/20261025T010404Z-7da00d4"
test "$(readlink -f "$site_root/current")" = "/var/www/muu-tech/releases/20261025T010404Z-7da00d4-optional-reality-game"
test -f "/opt/optional-reality/releases/20261025T004029Z-f4b59d1/server/src/index.ts"
test -f "/var/www/muu-tech/releases/20261025T004029Z-f4b59d1-optional-reality-game/demo/index.html"
apache2ctl configtest
ln -s "/opt/optional-reality/releases/20261025T004029Z-f4b59d1" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/health
ln -s "/var/www/muu-tech/releases/20261025T004029Z-f4b59d1-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/health
```

## 历史版本：九关、星星评分与统一加速度

- 游戏：[muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，应用版本 `f4b59d1a6b2b43c2b49d825f64e9bec322ef1a52`。
- release ID `20261025T004029Z-f4b59d1`（UTC 标识；本地发布时间为 2026-10-24）。应用 current 指向 `/opt/optional-reality/releases/20261025T004029Z-f4b59d1`；静态 current 指向 `/var/www/muu-tech/releases/20261025T004029Z-f4b59d1-optional-reality-game`。
- 九关均有三颗星，新增 One More Turn。到出口可普通通关，全部星星加出口获满分；多次反弹满分路线采用高弹性后增强向下加速度。每条消息均有小号 Send now 和删除按钮。
- 前后端同时切换到单一 acceleration 向量协议，gravity 是竖直分量别名；方向与强度统一，向下 20 保留为 +20。旧页面需要刷新后使用新协议。
- 独立源码安装后 437 项测试、类型检查、生产构建通过。私有端口 3113 预发布与正式 HTTPS API 各验证三条真实模型消息，向量依次为 (2,20)、(2,-20)、(2,20)。
- 公网浏览器实际完成多次反弹与弹簧关 3/3 满分；重试恢复星星、30 秒及原消息。浏览器 warning/error 为空。九个 level URL、API 健康与配置状态正常。
- 继续使用原 Node 24.22.1、systemd 与持久 `.env`；密钥文件与 Apache/TLS 配置保持原状，后端仅监听 127.0.0.1:3001。临时验收服务已停止。

### 备份与资源校验

- 服务器备份：`/var/backups/optional-reality/20261025T004029Z-f4b59d1/`；本地：`.localwork/backups/stars-20261025T004029Z-f4b59d1/`，目录 700、文件 600。包含旧站点、排除 `.env` 与 node_modules 的应用源码、目录指向、服务单元和 Apache 游戏配置。
- `site.tar.gz` SHA256：`6b962b1d17c033ea1b566ac77053511955dee3bae45b88708e5b958cfdd2a070`。
- `app-source.tar.gz` SHA256：`b2c5ffc6a543483679318429f096cdaf17625ad9d6c32b9e28db121d94763bf0`。服务器与本地归档均已复验。
- 前端 HTML SHA256：`611ca38013b19e35d12b8c6723c72f9130d01b0eefbd7c0d9a1d4675a75da982`。
- JS `index-CwtAjPSs.js` SHA256：`e4879180e03faa123b3837f20ec3cea68d748f87f1f675cac9f994fe4519ae59`；CSS `index-B4Zje0ET.css` SHA256：`b5065f32723017575f14b809f418c5be3432d63ed26464e935ad8aaf5ba941fa`。公网三份文件与独立构建完全一致。
- 首页仅改 Eight → Nine，SHA256：`d2d3dc39f722a2c353a1ed3a6f1cf32e2eec4ec6871e3755028c249a92c8a1fa`；保留原站其他文件与旧哈希资源。
- 线上截图和 API 验收结果：忽略目录 `.localwork/deploy-stars/`。

### 回退到上一八关版

前后端需一起回退；不回退持久 `.env`。以 root 执行，若 current 已变化则停止并核对后续发布。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "/opt/optional-reality/releases/20261025T004029Z-f4b59d1"
test "$(readlink -f "$site_root/current")" = "/var/www/muu-tech/releases/20261025T004029Z-f4b59d1-optional-reality-game"
test -f "/opt/optional-reality/releases/20261024T233406Z-fcfcbff/server/src/index.ts"
test -f "/var/www/muu-tech/releases/20261024T233406Z-fcfcbff-optional-reality-game/demo/index.html"
apache2ctl configtest
ln -s "/opt/optional-reality/releases/20261024T233406Z-fcfcbff" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/health
ln -s "/var/www/muu-tech/releases/20261024T233406Z-fcfcbff-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/health
```

## 历史版本：共享能力与真实 AI 验收

- 游戏：https://muuyyy.cfd/demo/；应用版本 `fcfcbff80a09cf54e2e8a8fbb88e204192cbc6c5`。
- 发布目录 `20261024T233406Z-fcfcbff`（UTC 标识）；应用 current 指向 `/opt/optional-reality/releases/20261024T233406Z-fcfcbff`，静态 current 指向 `/var/www/muu-tech/releases/20261024T233406Z-fcfcbff-optional-reality-game`。
- 全关共用完整物理能力目录与固定模型提示。真实 API 首轮发现中文“往左 0.5”被理解成正数，修正本地方向识别和提示后再验收。
- 本地真实编译器：13 次供应商请求、85 条消息通过；发布后经公网本站转发：13 次请求、85 条消息再次全部通过，包含八关各十条错词/中英文口语/方向/相对及组合指令，以及设备限幅、命名表面和非法指令拒绝。
- 独立源码目录全新 `npm ci` 后，378 项测试、类型检查和生产构建通过。服务器临时回环端口 3112 检查真实模型成功，切换后该临时服务已停止。
- 浏览器实际输入带 enviroment / accelrate 错词的英文口语，AI 返回向左 0.5 m/s²；发送后显示真实字幕，Try again 恢复同一 Ready 消息与 30 秒。浏览器 warning/error 为空。

### 网络边界

浏览器 → 本站 HTTPS `/api/` → Apache → `127.0.0.1:3001` → DeepSeek。线上游戏可正常调用 AI；模型密钥和供应商请求留在后端。**没有额外开放公网后端端口**，公网 3001 连接不可达，服务器监听核实为回环地址。

`/api/compile` 是经本站 HTTPS 可请求的游戏路由，保留同源检查、限流、schema 与权限校验；这并不是登录认证。`GET /api/health` 仅返回 `{ "ok": true }`，禁止缓存；`/api/status` 仍为游戏返回是否配置及模型名，不返回密钥。

持久 `.env` 保留原文件与 `root:optional-reality 640` 权限，位于 webroot 外。浏览器资源无真实密钥或直连供应商地址。公网 `/.env`、`/demo/.env`、`/server/src/index.ts` 均为 404，带无关 Origin 的编译请求为 403。Apache、TLS、camera 代理配置未修改。

### 本次备份与构建核验

- 服务器备份：`/var/backups/optional-reality/20261024T233406Z-fcfcbff/`；本地：`.localwork/backups/physics-20261024T233406Z-fcfcbff/`，目录 700、文件 600。
- `site.tar.gz` SHA256：`1fc0168dc63fde9f0735975a9852ab026e88fdf67f63de9f09bf51110a808273`。
- `app-source.tar.gz` SHA256：`838e9209ed256fd1b7a8da8878654bb64d6d15be77b51bf4888322eaf730e141`。源码归档排除 `.env` 和依赖；同时记录 current、服务单元与 Apache 游戏配置。
- 前端 HTML SHA256：`8e6e26390037b144e46fe632e1de9610b8f9793efda39c7e55116a8b46cb0ce0`。
- JS：`index-C8SYBB9_.js`，SHA256 `518af91f339bf466f7f01615e9158f60c51e3ba069befffbdbdf3aac6719114a`；CSS `index-BQJwfbB4.css`。公网 HTML、JS、CSS 与独立构建逐字节一致。
- 首页与上一版本逐字节一致，旧哈希 JS 仍可加载，新旧 release 与持久密钥分别保留。
- 真实验收报告：忽略目录 `.localwork/live-api-check/report.json`、`report-relay.json`；截图 `.localwork/deploy-physics/live-ai-ready.png`、`live-ai-sent.png`、`live-ai-retry.png`。

### 回退到上一八关版

以 root 在服务器执行，先检查两个 current 仍为本次版本。只回退代码与静态文件，不回退持久 `.env`；不修改 Apache 路由。若 current 已变化，停止并核对后续发布。

```sh
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/20261024T233406Z-fcfcbff"
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261024T233406Z-fcfcbff-optional-reality-game"
test -f "$app_root/releases/20261024T231848Z-c103fad/server/src/index.ts"
test -f "$site_root/releases/20261024T231848Z-c103fad-optional-reality-game/demo/index.html"
apache2ctl configtest
ln -s "$app_root/releases/20261024T231848Z-c103fad" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/status
ln -s "$site_root/releases/20261024T231848Z-c103fad-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/status
```

## 历史八关版本

- 地址：https://muuyyy.cfd/demo/；八个关卡，新增 02.2 多次反弹、02.3 摩擦跑道、02.4 接球杯。
- 应用版本：`c103fad12d8489c0a8ad13201cf64a1af92f0e9f`，包含新增关卡及共享物理规则、指令纠正和数值限幅修正。
- 发布目录：`20261024T231848Z-c103fad`，时间标识为 UTC。独立源码目录重新 `npm ci`，340 项测试、类型检查、生产构建通过。
- 应用 current：`/opt/optional-reality/releases/20261024T231848Z-c103fad`。
- 静态 current：`/var/www/muu-tech/releases/20261024T231848Z-c103fad-optional-reality-game`。
- 前后端更新为同一版本，服务器使用原 Node.js 24.22.1 与 systemd 服务。持久 `.env` 及 API 密钥保留，不复制开发机配置。线上 `configured:true`。
- 前端页面 SHA256：`7cefea534ac28567c91f87d0e072381f908ec95a7caa3907701811c1f5f64650`，JS 为 `index-CG4FDoOk.js`；公网文件与本地构建逐字节一致。
- 沿用原首页，只把五关文案改为八关；保留旧哈希资源，使已打开页面仍能加载资源。Apache、TLS 与 camera 代理配置未改。
- 公网复查：多次反弹、摩擦跑道实际通关与 Next level 衔接成功；接球杯加载正常，真实 API 将自然语言编译为 cup-base restitution=0，执行后杯底值更新。服务器预发布服务也完成同一新关卡的真实模型调用。
- 正式服务健康检查通过；预发布临时服务已停止。截图与构建校验结果保存在忽略目录 `.localwork/deploy-next/`。

### 本次备份

- 服务器：`/var/backups/optional-reality/20261024T231848Z-c103fad/`。
- 本地：`.localwork/backups/game-20261024T231848Z-c103fad/`，目录 700、文件 600，已忽略。
- `site.tar.gz` SHA256：`c726496a66e767d0cd348c4c12f3ffbe5fe7eb695dc4bdee9db72daf6cd2c22d`。
- `app-source.tar.gz` SHA256：`8511042f1eea2cd5e4140a2cf01a4c33aff302849725c142988cbc45a93e3e84`。
- 包含旧目录指向与服务单元记录；源码归档排除 `.env` 和依赖。服务器与本地归档校验均通过，旧 release 与已安装依赖原样保留。

### 回退到五关版

先核对两个 current 仍指向上面的八关目录，避免覆盖后续发布。应用与静态目录需一起回退；原服务与 Apache 配置保持不变，持久 `.env` 不回退。

```sh
# 在服务器上以 root 执行；保留所有新旧 release
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/20261024T231848Z-c103fad" || exit 1
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261024T231848Z-c103fad-optional-reality-game" || exit 1
apache2ctl configtest || exit 1
ln -s "$app_root/releases/20261024T224908Z-d29fa43" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/status || exit 1
ln -s "$site_root/releases/20261024T224908Z-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/status
```

## 首次五关上线记录（保留）

- 首页：https://muuyyy.cfd/，导航与首屏提供 **Play demo now**，进入 `/demo/`。
- 游戏：https://muuyyy.cfd/demo/；本次发布 `d29fa436fd6282b566e2130cd238712ed4263533` 的五关版本，加首页入口修改。开发中的新增关卡未包含在本次发布中。
- 构建在独立目录完成：219 项测试、类型检查与生产构建通过。线上实际检查首页跳转、游戏绘制、准备队列、发送与下一条补位。

### 服务器路径

- SSH：`ssh -o User=root muuyyy`
- 应用：`/opt/optional-reality/current` → `/opt/optional-reality/releases/20261024T224908Z-d29fa43`
- Apache 静态目录：`/var/www/muu-tech/current` → `/var/www/muu-tech/releases/20261024T224908Z-optional-reality-game`
- 持久配置：`/etc/optional-reality/.env`，从 `.env.example` 复制，`AI_API_KEY` 留空，`APP_ORIGIN=https://muuyyy.cfd`。
- 服务：`optional-reality.service`，以独立用户运行，仅监听 `127.0.0.1:3001`。填写密钥后执行 `systemctl restart optional-reality`。
- API：Apache 的 `/api/` 反代到上述服务；游戏 `/demo/` 的 CSP 允许同源连接。
- Node：独立安装的官方 Node.js 24.22.1 Linux x64，下载包已核对官方 SHA256。

密钥文件为 `root:optional-reality`、640 权限，位于 webroot 之外。应用 release 内 `.env` 链接到持久配置。网站 `.env` 与服务端源码路径均返回 404。没有复制开发机的真实 `.env`。

### 备份与回切

切换前备份：`/var/backups/optional-reality/20261024T224908Z/`，包含原站点归档、Apache 配置归档及原 SSL 配置。原静态 release 保留。

仅回切介绍页可沿用 `switch-site.sh`，新目录为 `/var/www/muu-tech/releases/20261024-optional-reality-intro-spring-rules`，预期当前目录为本次游戏静态目录。若同时撤销 API，恢复备份中的 `muu-tech-ssl.conf`，运行 `apache2ctl configtest` 后 reload Apache，并停止 `optional-reality` 服务。

配置健康检查：`curl -fsS https://muuyyy.cfd/api/status`。未填密钥时应为 `configured:false`，本地简单指令仍可游玩；填好密钥并重启后为 `configured:true`。本次未测试真实模型调用。
