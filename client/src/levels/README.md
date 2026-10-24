# 等级与关卡

每个小关导出只读 `LevelDefinition`，只定义数据。物理、绘图、输入与模型请求分别放在各自运行层。

`progression.ts` 定义三个教学等级：1 运动，2 碰撞，3 机关。`catalog.ts` 按顺序注册八个小关：`gravity-lab`、`bounce`、`multi-bounce`、`friction-runway`、`catch-cup`、`toaster`、`breeze`、`reality-breakdown`。基础环境规则始终共享，不用等级白名单禁用。

`number` 是等级，`stage` 是同级的小关编号。`levelLabel()` 统一生成 01、02.1、03.1 等显示标签。新增三个关卡属于 02.2–02.4；旧 `bounce` ID 不变，只补上 02.1 的显示编号。

## 主要字段

| 字段 | 含义 |
| --- | --- |
| `id / number / stage / title` | 稳定 ID、等级、小关及名称；消息按 ID 保存 |
| `viewport` | 世界尺寸与每米坐标数，影响模拟单位与画面缩放 |
| `timeLimitSeconds / initialGravity` | 模拟时限和初始重力，正数向下 |
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
| `openEdges` | 指定左右开放边缘，不创建隐形侧墙；摩擦跑道右侧开放 |
| `instructions` | 目标、提示、场景别名、例子与输入建议 |

坐标原点在左上角，位置和尺寸使用世界坐标，速度使用 m/s，重力使用 m/s²。显示缩放与留给浮动控件的空间不改变物理。

滑块约束旋转，实际使用矩形刚体；停留目标允许 0.5 世界像素的接触穿透误差，不接受仅擦边或高速经过。暂停不推进停留时间，离开或超速清零，重试重建目标进度。三关的验证窗口见 [几何关卡说明](../../../docs/geometry-levels.md)。

所有初始状态都要经过数值校验，但不等于玩家可以修改。`rules.ts` 生成状态范围和编辑权限，后端与执行器共同读取它；模型也收到这些权限。场景别名应写清，例如 toaster 是 spring-main、bell 是 sensor-gate。

## 新增步骤

1. 先明确学习目标、属于哪个等级、沿用哪些机关，只加入一个主要新概念。
2. 新建独立定义，提供合理的初始状态、目标、失败条件、提示与可复现解法。
3. 注册到 catalog；新增设备时先定义动作、权限和事件，再实现物理与独立绘图。
4. 验证默认状态不会通关、解法有容错窗口、重试恢复初始状态、暂停不消耗模拟时间。
5. 运行测试与生产构建，在浏览器实际检查碰撞、作用区域、队列、字幕和切关。

面包机使用接触约束蓄力，`chargeSeconds` 为模拟时间；首次 charging 触发教学，Continue 才恢复。重试保留已见教学，Replay teaching 可重新启用。

第三关保留旧 ID `reality-breakdown`。绘图改编自队友的面包店原型；旧 HTML 的独立物理与解析器不属于运行层。转轮有单独测试，但当前主线没有放置，避免一次引入过多机关。
