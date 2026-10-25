# 等级与关卡

每个小关导出只读 `LevelDefinition`，只定义数据。物理、绘图、输入与模型请求分别放在各自运行层。

`progression.ts` 定义三个教学等级：1 运动，2 碰撞，3 机关。`catalog.ts` 按顺序注册九个小关：`gravity-lab`、`one-more-turn`、`bounce`、`multi-bounce`、`friction-runway`、`catch-cup`、`toaster`、`breeze`、`reality-breakdown`。基础环境规则始终共享，不用等级白名单禁用。

`number` 是等级，`stage` 是同级的小关编号。`levelLabel()` 统一生成 01、02.1、03.1 等显示标签。新增三个关卡属于 02.2–02.4；旧 `bounce` ID 不变，只补上 02.1 的显示编号。

## 主要字段

| 字段 | 含义 |
| --- | --- |
| `id / number / stage / title` | 稳定 ID、等级、小关及名称；消息按 ID 保存 |
| `viewport` | 世界尺寸与每米坐标数，影响模拟单位与画面缩放 |
| `timeLimitSeconds / initialAcceleration` | 模拟时限和初始加速度 [x,y]，x 正向右、y 正向下 |
| `ball` | 出生点、半径、弹性、初始速度；物体受保护 |
| `tracks / guideLines / exit` | 碰撞轨道、装饰线与接触通关矩形 |
| `devices` | 传送带、接触弹簧、风场、转轮、传感器和门 |
| `editableDevices` | 允许修改的设备 ID；省略时允许本等级内的设备 |
| `tutorials` | 首次机关接触的教学信息，独立于模型规则 |
| `presentation` | 当前可选面包店画风，其余使用几何物理绘图 |
| `tracks[].feature` | 可选 `bounce / friction`，强调表面特性；不改变碰撞规则或编辑权限 |
| `tracks[].material / preset` | 表面初始材质覆盖世界默认值；preset 保护固定结构，普通表面均可修改弹性与摩擦 |
| `tracks[].label / aliases` | 模型与本地命令可使用的表面名称、别名 |
| `ball.shape` | 可选受保护滑块尺寸；未设置时仍是圆球 |
| `exit.condition` | 可选 settle：完整进入目标、速度低于 maxSpeed（m/s）并连续停留 seconds；省略时接触即通关 |
| `stars` | 至少三颗有唯一 ID、位置与拾取半径的星星；收齐可获满分，不锁出口 |
| `instructions` | 目标、提示、场景别名、例子与输入建议 |
| `instructions.initialMessages` | 可选首访待发消息，仅无保存记录时载入；已有草稿和已保存空列表均保留 |

坐标原点在左上角，位置和尺寸使用世界坐标，速度使用 m/s，重力使用 m/s²。显示缩放与留给浮动控件的空间不改变物理。

四个外围边缘统一开放，不创建隐形围墙。球或滑块的可见形状完全离开 `viewport` 后立即判负；部分仍可见时允许挽救，接触出口优先判胜。真实杯壁、跑道和机关由 `tracks / devices` 明确配置，不能用隐藏的房间边界代替。规则详见 [开放边界与消息恢复](../../../docs/play-area-and-recovery.md)。

滑块约束旋转，实际使用矩形刚体；停留目标允许 0.5 世界像素的接触穿透误差，不接受仅擦边或高速经过。暂停不推进停留时间，离开或超速清零，重试重建目标进度。三关的验证窗口见 [几何关卡说明](../../../docs/geometry-levels.md)。

所有初始状态都要经过数值校验，但不等于玩家可以修改。`rules.ts` 生成状态范围和编辑权限，后端与执行器共同读取它；模型也收到这些权限。场景别名应写清，例如 toaster 是 spring-main、bell 是 sensor-gate。

## 新增步骤

1. 先明确学习目标、属于哪个等级、沿用哪些机关，只加入一个主要新概念。
2. 新建独立定义，提供合理的初始状态、目标、失败条件、提示与可复现解法。
3. 注册到 catalog；新增设备时先定义动作、权限和事件，再实现物理与独立绘图。
4. 验证默认状态不会通关、解法有容错窗口、重试恢复初始状态、暂停不消耗模拟时间。
5. 运行测试与生产构建，在浏览器实际检查碰撞、作用区域、队列、字幕和切关。

几何弹簧声明 `response: elastic`、`stiffness`（N/m）和 `damping`（N·s/m），按接触压缩连续施力；质量参与受力响应，不冻结或硬设发射速度。几何弹簧没有固定蓄力时长，不会自行增加能量。

面包机使用接触约束蓄力，`chargeSeconds` 为模拟时间；首次 charging 触发教学，Continue 才恢复。重试保留已见教学，Replay teaching 可重新启用。

第三关保留旧 ID `reality-breakdown`。绘图改编自队友的面包店原型；旧 HTML 的独立物理与解析器不属于运行层。转轮有单独测试，但当前主线没有放置，避免一次引入过多机关。

普通与满分路线见 [阶段式关卡](../../../docs/phase-puzzles.md)。星星配置、收集判定、绘图与评分分别位于关卡文件、stars.ts、star-renderer.ts、StarProgress.tsx；新弹簧绘图独立为 spring-renderer.ts。

## 默认消息与执行时机

`bounce.instructions.initialMessages` 为单条 `Set surface bounce to 0.9`，进入该关的首次准备不会启动模拟或消耗额度。它是普通通关引导，真实路线取得一颗星；满分仍要求实际收齐三颗星后到达出口。只有真实零星完成才显示零星玩笑，不通过关卡 ID 或口令伪造评分。

Enter 只排队，Shift+Enter 只立即应用当前输入；需要 AI 时暂停准备该条，成功后应用一次、失败保留。打开暂停设置会取消自动应用意图，不阻止有效结果留在队列。关卡配置只提供数据，不实现快捷键、请求或直接发送逻辑。

## 首访操作教学

`onboarding.ts` 为 `gravity-lab`（Let It Roll）、`one-more-turn` 和 `bounce` 提供三步教学数据；不改变 LevelDefinition 的物理状态或权限。首次展示按 `optional-reality:<levelId>:how-to-play:v1` 保存已见，刷新/重试不重复，设置 How to play 可重看。

教学期间暂停并禁用底层操作；Let's play 只关闭，保留默认或自定义队列。主动加载按钮使用 `lesson.starterMessages`，未声明时使用本关 `exampleMessages`，加载并关闭但不启动模拟。它与 `initialMessages` 的自动首访草稿不同，也与 `tutorials` 的机关接触教学不同。重看后返回暂停设置；打开教学取消待完成的立即应用，迟到解析不能自动发送。

bounce 教学的 Load three-star setup 主动载入 `Set surface bounce to 0.1` 与 `acceleration upward 1`。先降低弹性，再于即将触地或刚触地时发送向上加速度；球仍会先扫过低星，再升向高星。不能等待低星已经拾取才发送向上 1。默认 0.9 普通路线与原草稿不会因打开/关闭教程而被替换。

所有关卡的输入窗都由 `editableRuleLabels(level)` 生成真实可改规则，AllowedRules 支持展开完整列表；教程复用相同数据，并明确球、出口和布局固定。列表只描述权限，不改变运行时校验。
