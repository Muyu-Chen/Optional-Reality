# 代码模块与修改入口

按职责拆分模块，关卡配置、界面、消息准备、规则执行与逐帧模拟各有入口。`App.tsx` 选择关卡并持有跨关卡音频 Provider，`Game.tsx` 组合游戏界面。

## 前端交互

| 位置 | 职责 |
| --- | --- |
| `client/src/App.tsx` | URL 与当前关卡，切关时重建游戏会话 |
| `client/src/game/Game.tsx` | 组合 Canvas、HUD、队列、输入窗和弹窗 |
| `game/useGameSession.ts` | 发送、撤销、重试、重置，以及执行后的字幕与提示 |
| `game/useGameWorld.ts` | 创建和销毁 CanvasLab，接收低频遥测 |
| `game/useGameControls.ts` | 暂停设置、恢复、Escape 与 Shift+Tab；打开设置取消立即应用意图 |
| `game/useMessageQueue.ts` | 输入、编辑、删除、排序、多选、示例消息；只应用当前输入的入口 |
| `game/usePreparedMessages.ts` | 本地/AI 准备、状态、存储、立即应用 ticket 与过期意图取消 |
| `components/MessageCard.tsx`、`RulePreview.tsx` | 紧凑摘要、彩色解析图标、逐条发送与可访问的原文/限幅详情展开 |
| `components/RuleComposer.tsx` | Enter 仅排队、Shift+Enter 仅应用当前输入，保留输入法组合保护 |
| `domain/message-storage.ts` | 恢复草稿；无保存记录时载入关卡 initialMessages，保留已保存空列表 |
| `domain/compilation-results.ts` | 逐条复核编译结果、按 ID 合并 Ready/error，失败不留下旧操作或影响其他行 |
| `levels/onboarding.ts` | Let It Roll、One More Turn、bounce 的三步教学数据、可选 starterMessages 和按关卡版本化的已见存储 key |
| `game/useLevelOnboarding.ts` | 首访/重看、暂停、已见状态、教学快捷键与立即应用意图取消 |
| `components/LevelOnboarding.tsx`、`OnboardingDiagram.tsx` | 全视口教学遮罩、居中卡片、静态 SVG 图示与关闭/加载示例按钮 |
| `components/AllowedRules.tsx` | 输入窗与教程共用的真实权限摘要及可展开完整列表；只显示数据，不授予权限 |
| `components/AccelerationIndicator.tsx`、`domain/acceleration-display.ts` | 实际加速度方向、数值、读屏文本与短强调；纯向量展示和 UI 生命周期分开 |
| `client/src/api/compilation-session.ts` | 编译请求身份、取消、场景与队列版本 |
| `client/src/components/` | 独立显示组件，通过 props 接收状态和事件 |
| `client/src/domain/` | 纯队列操作、真实执行反馈与存储格式 |

消息输入不直接调用物理引擎。`usePreparedMessages` 产出待发操作，`useGameSession` 在玩家发送时调用世界，成功后才消费消息和产生字幕。队列更改、重试和卸载都会使旧编译失效。

Shift+Enter 复用同一发送入口：本地有效操作直接应用；AI 只准备当前 ID，并以 ticket 验证一次性应用意图。打开设置只取消自动应用意图，允许有效解析结果保留为待发消息；编辑、删除、重试和切关同时维持现有响应身份校验。它不会批量发送旧队列。

首访教学按 `optional-reality:<levelId>:how-to-play:v1` 保存已见状态，首次展示即记录；不放入消息存储。教学打开时设置底层 inert，游戏会话使用同步可见性守卫拦截发送和立即应用，保持物理暂停。关闭教学不调用 start 或覆盖消息；从设置重看时返回设置。三课与机关首次接触教学分别维护，bounce 的 `lesson.starterMessages` 只在主动加载满分配置时使用。

`styles.css` 只保留有序导入。`styles/` 中按 HUD、队列、输入、反馈、菜单和教学拆分样式；`responsive.css` 保存主要断点。调整导入顺序前检查覆盖关系，Canvas 使用的 `--scene-*` 留白必须与 HUD 一致。

## 音乐

`audio/MusicProvider.tsx` 位于 App 的 keyed Game 外，关卡切换不会重建音乐会话。`MusicControl.tsx` 只显示和切换状态，`use-background-music.ts` 订阅 Context。`music-controller.ts` 管理可信手势、偏好存储、页面可见性与错误反馈；`music-engine.ts` 管理单个 Web Audio 图、短期调度、音量和资源清理；`music-score.ts` 保存原创音符数据。音乐不依赖物理时钟或 API。

MusicControl 与 SoundEffectsControl 统一由暂停设置组合，Game HUD 不再直接摆放音乐开关。

音效独立于音乐：`audio/game-sound-events.ts` 发布真实游戏事件，`sfx-controller.ts` 管理可信手势、独立偏好和即时订阅，`sfx-engine.ts` 用一个单独的 Web Audio 图合成短音并限制并发声部。`SoundEffectsProvider.tsx` 持有跨关卡控制器，设置组件只切换偏好。未解锁事件不入队；隐藏、重试、取消和卸载停止旧音源，返回不重放。

## 场景与物理

| 位置 | 职责 |
| --- | --- |
| `client/src/levels/` | 关卡数据、等级能力、初始规则和可修改权限 |
| `physics/scene-bodies.ts` | 按关卡创建轨道、边界与任务物体，保留刚体插入顺序 |
| `physics/world.ts` | 固定时间步、规则应用、历史、教学与成败状态 |
| `physics/goal.ts` | 独立的形状接触、完整进入、速度和连续停留判定；暂停时不推进 |
| `physics/stars.ts` | 独立配置校验、真实形状与扫过路径拾取、计数与满分判定；不锁出口 |
| `physics/star-renderer.ts`、`spring-renderer.ts` | 独立绘制未收集星星与几何弹簧状态，不推进模拟 |
| `components/StarProgress.tsx` | HUD 星星进度 |
| `components/CompletionResult.tsx`、`ResultStars.tsx` | 独立的结算信息、真实分数与大号 SVG 星形 |
| `physics/drawing-theme.ts` | Canvas 主题颜色与可读字号，与界面保留一致的物理颜色语义 |
| `physics/devices.ts` | 接触判断、风场、传送带、有动力面包机、转轮和感应开门 |
| `physics/elastic-spring.ts` | 被动弹簧的胡克弹力、阻尼与连续接触；不冻结或硬改物体速度 |
| `physics/scene-backdrop.ts` | 独立场景背景绘画，保持前景与装饰层次 |
| `physics/scenery/profiles.ts`、`layout.ts` | 九关纯视觉配置与插画坐标；不改变碰撞、规则或权限 |
| `physics/scenery/living-world.ts`、`water-particles.ts` | 固定步长的远景居民与密集水粒子，暂停和销毁由 Canvas 生命周期统一控制 |
| `physics/scenery/*-renderer.ts` | 宇宙、山谷、地标、人车与瀑布的独立只读绘图 |
| `physics/scene-feedback.ts` | 从真实拾取结果生成短时视觉反馈，不回写评分 |
| `physics/ambient-scenery.ts`、`ambient-scenery-renderer.ts` | 确定性的背景生态状态与绘画；只读取加速度，不创建物理体 |
| `physics/ambient-bird-flight.ts`、`ambient-bird-renderer.ts` | 鸟的独立飞行状态、升力/拍翼和轮廓绘图；生态模块委托调用 |
| `physics/impact-contact.ts`、`impact-feedback.ts` | 复制入射运动，观察真实接触并计算法向速度；不写 Matter 状态 |
| `physics/impact-state.ts`、`impact-renderer.ts`、`actor-impact-pose.ts` | 有界模拟时钟波纹、法向绘图和轻微角色视觉压缩 |
| `physics/exit-transition.ts`、`exit-transition-renderer.ts` | 判胜之后的复制姿态、吸入时间线与绘画，不改变世界或分数 |
| `physics/canvas-lab.ts` | 浏览器动画循环、Canvas 缩放、轨迹与生命周期 |
| `physics/geometry-renderer.ts` | 前两级几何场景绘图 |
| `physics/actor-renderer.ts`、`surface-renderer.ts`、`goal-renderer.ts` | 分别绘制任务物体、真实材质纹理、接触/停留目标；由几何场景组合 |
| `physics/visual-language.ts` | 跨场景的特性配色、力箭头、重力与回弹纹；只读取状态 |
| `physics/bakery-renderer.ts` | 组合面包店背景、机关、面包与轨迹 |
| `physics/bakery/room.ts` | 静态背景绘画 |
| `physics/bakery/devices.ts` | 各机关的状态绘图，读取运行层状态 |
| `physics/bakery/bread.ts`、`drawing.ts` | 面包绘制与画布基础函数 |

`levels/presentation.ts` 的 `editableRuleLabels()` 从实际规则权限生成可修改项，输入窗与教程使用同一份数据交给 AllowedRules，不另外维护 UI 白名单。AllowedRules 的完整列表在所有关卡都可展开，教学另说明球、出口和布局固定。`TrackDefinition.feature` 声明需要强调的表面特性，不授予编辑权限；实际弹性仍由规则状态决定。

以上 `physics/` 均位于 `client/src/`。绘图不能推进模拟、修改规则或发起模型请求。React 不承接每一物理帧的位置更新。

## 规则与服务端

`components/front-door/` 保存标题、选关、真实配置缩略图和设置；机械 SVG 装饰另在 `SteamDetails`。`game/journey-navigation.ts` 处理 URL，`journey-progress.ts` 校验并保存最近关卡与最佳星数，`useJourney.ts` 组合导航和存储；App 不承担画面或关卡细节。

`shared/rules.ts` 保存声明式操作与校验，`shared/commands.ts` 做简单本地解析，`shared/compiler.ts` 定义编译协议。服务端由 `app.ts` 处理 HTTP，`compiler.ts` 负责场景权限与提示词，`ai-client.ts` 适配模型请求，`config.ts` 读取后端环境变量。

`shared/compilation-message.ts` 独立定义单条结果与模型消息 schema，统一限幅、权限与单条操作的完整验证；`shared/compiler.ts` 只检查整份响应的身份并组合结果。客户端 `domain/compilation-results.ts` 再独立校验与合并，`usePreparedMessages` 负责网络及取消，详见 [逐条编译结果](./compilation-results.md)。

`server/dev-api-proxy.ts` 仅供 Vite 开发服务器读取 `DEV_API_ORIGIN`，把 `/api` 转到指定的已有后端；只允许无凭据、无路径的 HTTPS 或本机 HTTP origin。它不属于模型请求适配层，也不会改变生产 `/api` 或把供应商 key 放入浏览器。

`shared/acceleration.ts` 保存统一向量、范围、显示名称与旧 gravity 操作归一化；关卡 initialAcceleration、规则 acceleration、遥测与事件均只有同一向量。

`shared/physics-capabilities.ts` 统一基础属性、设备控制、范围、单位、词汇与显示名称，关卡只声明场景数据和预设保护。`server/src/compiler-prompt.ts` 独立组装固定能力目录、操作语义及 schema，动态状态和玩家文本置后；`compiler.ts` 只协调上下文校验、请求和响应校验。

`shared/surface-target.ts` 从场景名称与别名解析局部表面；不识别的目标不退化为全局修改。关卡定义只放数据，目标判定与绘图均不通过关卡 ID 选择行为。

`shared/command-language.ts` 只处理保守拼写归一化，`acceleration-command.ts` 解析加速度与单位；`rule-limits.ts` 对已知属性限幅并生成调整记录。客户端准备、API 编译和执行共享该策略，规则快照校验仍严格。`physics/acceleration-renderer.ts` 独立绘制同一加速度向量的方向和分量，不推进模拟。

## 后续修改

- 新增小关：按 [关卡说明](../client/src/levels/README.md) 添加独立配置并注册，不把布局硬编码进游戏组件。
- 新增机关：先定义规则权限与运行行为，再添加对应绘图；界面只提供输入和反馈。
- 修改消息交互：显示改 `components/`，队列操作改 `useMessageQueue`，编译与取消改 `usePreparedMessages` / `CompilationSession`。
- 修改发送与重试：改 `useGameSession`，继续验证消息与世界状态一致、旧请求失效、教学暂停不被绕过。

这些模块与新增关卡没有引入额外依赖。验证使用 `npm test`、`npm run build` 与浏览器操作，记录见 [验收说明](./verification.md)。

## 介绍页示意动画

`site/assets/intro-motion-20261024.js` 绑定两张示意图和暂停按钮；`diagram-player-20261024.js` 管理独立的绘图时钟、DPR、离屏/隐藏暂停、减少动态效果和销毁。`diagram-timeline-20261024.js` 保存弹簧的连续力学时间线，spring/orbit/paint 模块负责绘制。它们不导入游戏运行层、不调用 API。`scripts/intro-animation.test.mjs` 用 Node 原生测试运行，`npm test` 在 Vitest 后自动执行。

视觉和声音的统一约定、第二轮集成边界见 [presentation.md](./presentation.md)。绘图只读 Matter 状态；背景与出口过渡使用独立呈现时钟，不能成为额外的物理引擎。
