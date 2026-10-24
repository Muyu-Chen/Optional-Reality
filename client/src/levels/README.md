# 等级与关卡

每个小关导出只读 `LevelDefinition`，只定义数据。物理、绘图、输入与模型请求分别放在各自运行层。

`progression.ts` 定义三个等级及能力上限：1 运动，2 碰撞，3 机关。`catalog.ts` 按顺序注册五个小关：`gravity-lab`、`bounce`、`toaster`、`breeze`、`reality-breakdown`。

`number` 是等级，`stage` 是同级的小关编号。`levelLabel()` 统一生成 01、02、03.1 等显示标签。等级与小关不同；后续可以增加 2.2 摩擦关，不必让每个新布局都成为新等级。

## 主要字段

| 字段 | 含义 |
| --- | --- |
| `id / number / stage / title` | 稳定 ID、等级、小关及名称；消息按 ID 保存 |
| `viewport` | 世界尺寸与每米坐标数，影响模拟单位与画面缩放 |
| `timeLimitSeconds / initialGravity` | 模拟时限和初始重力，正数向下 |
| `ball` | 出生点、半径、弹性、初始速度；物体受保护 |
| `tracks / guideLines / exit` | 碰撞轨道、装饰线与接触通关矩形 |
| `devices` | 传送带、接触弹簧、风场、转轮、传感器和门 |
| `editableWorldProperties / editableSurfaceProperties` | 关卡可修改属性，再与等级上限相交；空数组表示全部固定 |
| `editableDevices` | 允许修改的设备 ID；省略时允许本等级内的设备 |
| `tutorials` | 首次机关接触的教学信息，独立于模型规则 |
| `presentation` | 当前可选面包店画风，其余使用几何物理绘图 |
| `tracks[].feature` | 可选 `bounce`，强调表面回弹特性；不改变碰撞规则或编辑权限 |
| `instructions` | 目标、提示、场景别名、例子与输入建议 |

坐标原点在左上角，位置和尺寸使用世界坐标，速度使用 m/s，重力使用 m/s²。显示缩放与留给浮动控件的空间不改变物理。

所有初始状态都要经过数值校验，但不等于玩家可以修改。`rules.ts` 生成状态范围和编辑权限，后端与执行器共同读取它；模型也收到这些权限。场景别名应写清，例如 toaster 是 spring-main、bell 是 sensor-gate。

## 新增步骤

1. 先明确学习目标、属于哪个等级、沿用哪些机关，只加入一个主要新概念。
2. 新建独立定义，提供合理的初始状态、目标、失败条件、提示与可复现解法。
3. 注册到 catalog；新增设备时先定义动作、权限和事件，再实现物理与独立绘图。
4. 验证默认状态不会通关、解法有容错窗口、重试恢复初始状态、暂停不消耗模拟时间。
5. 运行测试与生产构建，在浏览器实际检查碰撞、作用区域、队列、字幕和切关。

面包机使用接触约束蓄力，`chargeSeconds` 为模拟时间；首次 charging 触发教学，Continue 才恢复。重试保留已见教学，Replay teaching 可重新启用。

第三关保留旧 ID `reality-breakdown`。绘图改编自队友的面包店原型；旧 HTML 的独立物理与解析器不属于运行层。转轮有单独测试，但当前主线没有放置，避免一次引入过多机关。
