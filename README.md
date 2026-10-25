# Optional Reality

**Reality is optional. Change the rules. Choose the moment.**

Optional Reality 是一个通过自然语言改写规则、选择执行时机的 **2D 物理解谜游戏**。

核心循环：观察场景 → 编写消息 → 解析排队 → **Send now** → 物理变化与字幕反馈 → 重试不同解法。

AI 把玩家意图编译成受支持的声明式操作，Matter.js 真实运行物理世界。玩家决定规则何时生效；关闭重力保留惯性，反转与翻倍在执行时读取当前值。模型不参与逐帧计算，不执行生成的 JavaScript。

## 当前可玩内容

面向 SBUHacks 2026，已实现三个等级、九个递进小关：

| 等级 | 小关 | 主要学习内容 |
| --- | --- | --- |
| 1 · Motion | 01 Let It Roll | 零重力起步，沿斜坡运动，在离轨时取消重力 |
| 1 · Motion | 01.2 One More Turn | 落下取星、被动弹簧自然回弹，再改变加速度取得高处星 |
| 2 · Collisions | 02.1 A Little More Bounce | 直接反弹可通关，低弹性后向上加速可收齐星星 |
| 2 · Collisions | 02.2 Not Too High | 满分路线：高弹性取高星，再增大向下加速度回到出口 |
| 2 · Collisions | 02.3 Brake Before the Edge | 青色摩擦跑道，完整停靠滑块 |
| 2 · Collisions | 02.4 Catch Tutorial | 短教学：分别修改发射板与杯底，可以提前设置 |
| 3 · Devices | 03.1 A Little Stored Energy | 学习面包机的压缩、蓄力与释放 |
| 3 · Devices | 03.2 Catch the Breeze | 学习向上的风场 |
| 3 · Devices | 03.3 The Last Order | 组合传送带、面包机、风扇和感应开门 |

等级安排教学顺序；基础物理量各关一致，布局和提示引导新的概念。预设设备与结构单独标记。转轮运行层已保留，更多机关组合、自然元素和自由沙盒后续扩展。

## 游戏操作

- `/demo/` 从开始界面进入游戏，独立关卡页按三个章节展示九关；保留 `?level=...` 直达入口。继续最近小关会开启新一轮并保留消息草稿，通关后记录本机最佳星数。
- 线上主入口为 [optionalreality.site](https://optionalreality.site/)，`www.optionalreality.site` 与 `muuyyy.cfd` 同样可用：根目录直接游戏，`/intro` 为介绍页，原 `/demo/` 保留。三个域名共用一张自动续期的 SAN 证书，配置与备份见 [域名和路由记录](./deploy/domains-and-routing.md)。
- 全屏场景，右下半透明输入窗；**Enter 仅排队**，**Shift+Enter 只立即应用当前输入**，不连带执行旧消息。
- 每次进入或重试关卡，显示 3 秒的[初始状态提示](./docs/initial-state-briefing.md)：初始运动、加速度、表面与机关状态；教学关闭后再显示，不启动计时。
- 校验拒绝的模型结果会进行[一次 AI 对话修复](./docs/compilation-repair.md)。第二轮可执行解释直接进入 Ready，并显示 AI revised interpretation，由玩家查看后 Send now；这类结果即使用 Shift+Enter 发起也不自动应用。
- Let It Roll、One More Turn 与 A Little More Bounce 首访显示居中的三步图示教学，模拟保持暂停；Let's play 只关闭并保留原队列。设置中的 How to play 可重看，刷新或重试不强制重复。
- 消息自动解析，桌面侧栏优先呈现三条可操作摘要：18px 正文、彩色规则图标、28px 高的 **Send now** 和小删除按钮。小箭头展开完整原文、Understood as 与限幅详情；批量发送在管理菜单中。
- 批量解析逐条返回：合法消息 Ready，错误只标记对应行，不阻止其他 Ready 消息发送；编辑与重试保留可复用结果。协议和整批错误边界见 [逐条编译结果](./docs/compilation-results.md)。
- 本地 AST 支持明确的组合指令、翻倍／减半／反转和多个目标，例如 `设置发射板和杯底的弹性为0.5，并关闭重力`；整句无法解析时交给当前配置的模型（线上为 Gemini）。Shift+Enter 需要 AI 时先暂停、解析成功后应用一次；失败保留消息。普通 Enter 解析完成后继续等待玩家发送。
- **Shift+Tab** 暂停并打开设置；等待 AI 时打开设置会取消立即发送意图，解析结果保留为待发消息。
- 左侧字幕显示实际修改结果，几秒后淡出。规则参数、提示、批量发送与历史收在菜单里。
- 每关三颗星；到达出口可过关，收齐后到达出口才获满分，重试恢复全部星星。
- 首次有效发送开始 30 秒模拟倒计时；普通暂停、API 等待与教学暂停不消耗模拟时间。
- 等待 AI 时可 Cancel，也可直接发送其他 Ready 消息；旧解析取消后不会再次暂停游戏。未完成消息可单独 Prepare，完整网络请求最多等待 35 秒。
- 所有关卡四边开放；球或滑块完全离开固定关卡画面就显示 Out of bounds，可 Try again。部分仍在画面内时可继续挽救，杯壁和轨道保留真实碰撞。
- **Try again** 恢复初始世界和额度，原消息重新待发，保留已解析操作以比较发送时机。
- 面包机每次接触会蓄力约 0.6 秒；首次额外暂停教学，Continue 后恢复。重试不重复打断，菜单可重看教学。
- 暂停菜单切换小关，通关后可进入下一关。结算用大号独立星形区分已取得与遗漏，普通通关和满分有不同反馈。
- 首次操作后可播放低音量原创背景音乐和事件音效；暂停设置中的 **Music on/off** 与 **Sound effects on/off** 独立切换并记住选择，切出页面停止旧声音、切关不叠加。
- 界面以英语为主，支持中英文输入，正文与场景标注采用更清晰的字号和对比。
- 星星旁显示真实加速度方向和数值，变化时短暂强调。放大的小鸟与鹰独立飞行并响应方向变化；碰撞点有按入射速度产生的波纹和轻微视觉形变，保持物理轨迹不变。

界面、连续弹簧、背景和出口动画的实现约定集中在 [游戏呈现说明](./docs/presentation.md)，具体发布状态见文末与部署记录。

开放边界、解析取消与发送恢复的行为见 [边界与消息恢复](./docs/play-area-and-recovery.md)。

背景采用独立的生活世界与宇宙插画：瀑布、行人和汽车会响应实际加速度，零重力开场使用太空主题；装饰不参与关卡碰撞与评分。开始界面、选关和背景的边界见 [世界背景与游戏入口](./docs/world-and-navigation.md)。

A Little More Bounce 首访会准备一条 `Set surface bounce to 0.9`，等待玩家发送；已有草稿或主动清空的队列保留。该普通路线可真实取得一颗星；三颗星加出口才是满分。

该关教程中的 Load three-star setup 可主动换成 `Set surface bounce to 0.1` 与 `acceleration upward 1`。先降低弹性，在小球即将触地或刚触地时发送向上加速度；它仍会穿过低星，再升向高星。不要等低星已经拾取后才发送。

基础例子：`add gravity`、`stop gravity`、`reverse gravity`、`add acceleration rightward`、`Set surface bounce to 0.9`、`Set toaster power to 2`、`Set fan power to 0.45`。设备需要实际存在且可编辑；任务物体不能被直接移动或修改速度。

物理特性使用固定视觉语言：蓝色回弹纹、青色摩擦纹、橙色推动箭头、紫色重力方向。所有关卡输入窗均可 Expand / Collapse 完整可改规则列表，教程使用同一权限清单；小球、出口和布局固定。设备的 Editable / Preset 与特性颜色分开。新增三关的玩法与验证见 [几何关卡说明](./docs/geometry-levels.md)，后续机关见 [机关设计提案](./docs/physics-mechanisms.md)。

所有关卡共享加速度向量、弹性和摩擦；重力是竖直分量的输入别名，方向与强度都由同一向量表示。每个分量允许 -100 至 100 m/s²，向下 20 会保留为 +20。教学提示推荐解法而不禁用基础物理量。`add acceleration right word` 会纠正为 `add acceleration rightward`，队列保留原文并展示理解结果。消息语义见 [共享物理规则与消息理解](./docs/command-language.md)。

基础能力、范围、单位和界面名称统一定义在 `shared/physics-capabilities.ts`。模型在每关收到相同的完整能力说明；关卡只补充对象、别名和预设权限。简单明确的消息走本地解析，口语和未识别错词由模型兜底理解，再由共享代码校验。

模型按意图理解日常物理表达：例如“向上的浮力”解释为环境向上 1 m/s² 的加速度，保留水平分量，并用 Understood as 展示解释。不会因此创建水体或新力场，也不允许直接修改小球的速度、位置或质量。第一版 AST 的语法范围和回退边界见 [消息理解](./docs/command-language.md)。

超出范围的有限数值由共享代码限幅，例如 fan power 10 → 2。队列显示原请求与实际值，等待 Send now；未知对象、受保护目标和非有限值仍拒绝。

## 本地运行

使用支持 Vite 8 的 Node.js；当前在 Node.js 26 验证。

```sh
npm ci
cp -n .env.example .env
# 在 .env 的 AI_API_KEY 中填入密钥；已有 .env 时直接编辑，避免覆盖
npm run dev
```

打开 `http://127.0.0.1:5173/demo/`。Vite 前端和 Express API 同时启动。

默认配置为 `AI_BASE_URL=https://api.deepseek.com`、`AI_MODEL=deepseek-flash`，使用 JSON 输出并关闭思考模式。密钥仅由后端读取，不能使用 `VITE_` 变量传入前端；修改配置后重启 API。

也可设置 `AI_PROVIDER=gemini`，填写独立的 `GEMINI_API_KEY`；默认模型 `gemini-3.1-flash-lite`。原 `AI_API_KEY` 和 DeepSeek 配置保留，改回 `AI_PROVIDER=compatible` 即可恢复。显式设置 `AI_FALLBACK_PROVIDER=deepseek` 可在 Gemini 失败后向 DeepSeek 发起独立备用请求，两家的 key 不混用。线上已开启此兜底，配置与时间预算见 [服务端说明](./server/README.md)，发布状态见 [部署记录](./deploy/api-fallback.md)。

如果 key 只放在线上，开发机可在 `.env` 设置 `DEV_API_ORIGIN=https://muuyyy.cfd`，再运行 `npm run dev:web`。Vite 仅转发 `/api` 到现有后端，浏览器仍访问本机地址，供应商密钥留在服务器。留空则连接本机 3001 后端；该设置只影响开发服务器，`npm start` 与生产构建继续使用本站 `/api`。

```sh
npm test
npm run build
npm start
```

生产构建后，`npm start` 在 `http://127.0.0.1:3001/demo/` 同时提供游戏与 API。测试默认使用模拟模型，不消耗真实 API；真实 DeepSeek 调用单独验收。构建产物、依赖、密钥和本地备份均不提交。

测试条件与新增测试要求见 [测试说明](./docs/testing.md)。GitHub Actions 在每次 push / pull request 时运行测试和构建。

只看静态前端可用 `python3 -m http.server 8793 --bind 127.0.0.1 --directory site`，访问 `/demo/`；此方式仅本地指令可用。

## 架构与设计

React + TypeScript + Vite 管理界面；Matter.js + Canvas 2D 运行、绘制世界；Express 调用可配置的 OpenAI 兼容 API；Zod 共享并校验规则。Web 首发，暂不做 Electron、数据库或 3D。

- `client/src/levels/`：独立关卡、等级与编辑权限。
- `client/src/game/`：游戏会话、队列交互、AI 准备与世界生命周期。
- `client/src/components/`、`styles/`：独立界面组件与分模块样式。
- `client/src/physics/`：固定时间步长、设备、机关状态和独立绘图。
- `client/src/domain/`：消息队列、执行历史与真实变化字幕。
- `shared/`：声明式操作、状态与编译协议。
- `server/src/`：模型适配、提示词、场景权限及 HTTP。

完整设计与开发要求见 [游戏设计约定](./docs/game-design.md)，模块职责见 [代码结构](./docs/code-structure.md)，当前进度见 [dev-todo.md](./dev-todo.md)，新增关卡见 [关卡说明](./client/src/levels/README.md)，API 配置见 [server/README.md](./server/README.md)。

面包店绘图改编自 yihanzhao231 的 `temp/1024-zyh@30d802f`，物理和指令统一使用本项目运行层。旧关卡 ID `reality-breakdown` 保留。

静态介绍页位于 `site/`，线上游戏为 [muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，已发布九关、三颗星评分、逐条紧凑消息操作和统一加速度向量，前后端协议同步更新。版本、备份与回退见 [线上游戏部署记录](./deploy/live-game.md)；早期介绍页备份见 [deploy/README.md](./deploy/README.md)。

线上游戏仅通过本站 HTTPS 转发调用模型，后端只监听回环端口，密钥留在服务器；健康检查为 `/api/health`。共享能力版本已完成本地与线上两轮各 85 条真实模型指令验收。

满分路线、消息操作与向量语义见 [星星玩法约定](./docs/star-gameplay.md)；九关的具体路线见 [阶段式物理解谜](./docs/phase-puzzles.md)。

本轮整合版 `75af06a` 已发布：场景绘图、连续被动弹簧、首页实时动画、背景生态、出口吸入、音效、消息快捷操作、三课图示教学和规则清单展开均已上线。独立构建通过 616 项测试，公网三星路线和真实 API 已验收。线上具体版本以 [部署记录](./deploy/live-game.md) 为准，最新验证见 [verification.md](./docs/verification.md)。

最新鸟、加速度反馈与碰撞手感版本 `5e73f8a` 已上线，独立构建通过 666 项测试。Gemini 接口同版提供，线上已切换 `gemini-3.1-flash-lite` 并通过真实编译验证，原 DeepSeek key 保留。备份、资源校验及成对回退见 [部署记录](./deploy/live-game.md)。

最新入口与场景版本 `9f4c2e8` 已上线：Steel and Steam 开始页、三章九关画廊、最佳星数、九种背景、粒子瀑布与轻快音乐。独立构建通过 741 项测试，公网三星、进度保存和 Gemini 验证通过；上一版与备份保留。
