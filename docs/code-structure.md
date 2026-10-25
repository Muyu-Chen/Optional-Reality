# 代码模块与修改入口

按职责拆分模块，关卡配置、界面、消息准备、规则执行与逐帧模拟各有入口。`App.tsx` 只选择关卡，`Game.tsx` 只组合游戏界面。

## 前端交互

| 位置 | 职责 |
| --- | --- |
| `client/src/App.tsx` | URL 与当前关卡，切关时重建游戏会话 |
| `client/src/game/Game.tsx` | 组合 Canvas、HUD、队列、输入窗和弹窗 |
| `game/useGameSession.ts` | 发送、撤销、重试、重置，以及执行后的字幕与提示 |
| `game/useGameWorld.ts` | 创建和销毁 CanvasLab，接收低频遥测 |
| `game/useGameControls.ts` | 暂停菜单、恢复与 Escape 快捷键 |
| `game/useMessageQueue.ts` | 输入、编辑、删除、排序、多选和示例消息 |
| `game/usePreparedMessages.ts` | 本地准备、AI 准备、状态和队列存储 |
| `client/src/api/compilation-session.ts` | 编译请求身份、取消、场景与队列版本 |
| `client/src/components/` | 独立显示组件，通过 props 接收状态和事件 |
| `client/src/domain/` | 纯队列操作、真实执行反馈与存储格式 |

消息输入不直接调用物理引擎。`usePreparedMessages` 产出待发操作，`useGameSession` 在玩家发送时调用世界，成功后才消费消息和产生字幕。队列更改、重试和卸载都会使旧编译失效。

`styles.css` 只保留有序导入。`styles/` 中按 HUD、队列、输入、反馈、菜单和教学拆分样式；`responsive.css` 保存主要断点。调整导入顺序前检查覆盖关系，Canvas 使用的 `--scene-*` 留白必须与 HUD 一致。

## 音乐

`audio/MusicProvider.tsx` 位于 App 的 keyed Game 外，关卡切换不会重建音乐会话。`MusicControl.tsx` 只显示和切换状态，`use-background-music.ts` 订阅 Context。`music-controller.ts` 管理可信手势、偏好存储、页面可见性与错误反馈；`music-engine.ts` 管理单个 Web Audio 图、短期调度、音量和资源清理；`music-score.ts` 保存原创音符数据。音乐不依赖物理时钟或 API。

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
| `physics/canvas-lab.ts` | 浏览器动画循环、Canvas 缩放、轨迹与生命周期 |
| `physics/geometry-renderer.ts` | 前两级几何场景绘图 |
| `physics/actor-renderer.ts`、`surface-renderer.ts`、`goal-renderer.ts` | 分别绘制任务物体、真实材质纹理、接触/停留目标；由几何场景组合 |
| `physics/visual-language.ts` | 跨场景的特性配色、力箭头、重力与回弹纹；只读取状态 |
| `physics/bakery-renderer.ts` | 组合面包店背景、机关、面包与轨迹 |
| `physics/bakery/room.ts` | 静态背景绘画 |
| `physics/bakery/devices.ts` | 各机关的状态绘图，读取运行层状态 |
| `physics/bakery/bread.ts`、`drawing.ts` | 面包绘制与画布基础函数 |

`levels/presentation.ts` 从实际规则权限生成输入窗的可修改项，避免另外维护一份 UI 白名单。`TrackDefinition.feature` 声明需要强调的表面特性，不授予编辑权限；实际弹性仍由规则状态决定。

以上 `physics/` 均位于 `client/src/`。绘图不能推进模拟、修改规则或发起模型请求。React 不承接每一物理帧的位置更新。

## 规则与服务端

`shared/rules.ts` 保存声明式操作与校验，`shared/commands.ts` 做简单本地解析，`shared/compiler.ts` 定义编译协议。服务端由 `app.ts` 处理 HTTP，`compiler.ts` 负责场景权限与提示词，`ai-client.ts` 适配模型请求，`config.ts` 读取后端环境变量。

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
