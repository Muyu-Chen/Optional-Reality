# 共享物理规则与消息理解

所有实验、关卡共享基础环境能力，不因教学重点而隐蔽禁用：

| 物理量 | 表达 | 单位 |
| --- | --- | --- |
| 加速度向量 y 分量 | acceleration.y，正数向下、负数向上；gravity / 重力为别名 | m/s² |
| 同一向量的 x 分量 | acceleration.x，正数向右、负数向左 | m/s² |
| 表面弹性 | restitution | 系数 |
| 表面摩擦 | friction | 系数 |

关卡用布局、目标和建议指令介绍概念，允许其他符合规则的解法。设备只在实际存在时可用，教学设备的 Preset 仍独立保留；任务物体不能被直接移动、改速度、质量或尺寸。

`add acceleration rightward` 默认添加向右 1 m/s²；`add acceleration leftward` 向左；`stop horizontal acceleration` 关闭水平加速度。规则状态只保存 acceleration: { x, y }。指令用 world.acceleration_x / acceleration_y 选择分量，修改一个分量时保留另一个；gravity 与重力都映射到 y，不叠加第二套力。每个分量范围为 -100 至 100，向下 20 和向上 20 分别得到 +20 和 -20，不在 10 处改变方向或截断。关闭保留惯性，反转修改加速度，不瞬间翻转速度。

本地路径为 `normalizeCommand → parseCommandTree → compileCommandTree → 限幅与规则校验 → 待发消息`。`shared/command-parser.ts` 分词并完整消费输入，生成 `command-ast.ts` 定义的 Program、Set、Scale 和 SensorTrigger 节点；目标引用保留名字或设备类别。`command-compiler.ts` 再按当前场景解析唯一 ID，展开多个目标，输出现有 operations，不运行物理。`commands.ts` 的 `parseCommands` 是多操作入口，`parseCommand` 保留单操作兼容接口。

已知拼写仍由 `shared/command-language.ts` 保守纠正，例如 acceleration 语境中的 `right word` → `rightward`。保留原文，队列显示 Understood as，玩家检查后再 Send now。数字、否定词和对象 ID 不由拼写规则改写；方向冲突、未指明方向、定时条件和物体直接操作不猜测。

第一版支持以下组合；每条消息最多 16 个展开后的操作，按原文顺序执行：

| 语法 | 示例 |
| --- | --- |
| 完整指令组合 | `stop gravity and set surface friction to 0.3`、`关闭重力，并设置摩擦为0.3`；也支持分号、逗号 |
| 相对修改 | `double fan power`、`摩擦减半`、`reverse gravity`、`multiply friction by 0.25` |
| 多个明确目标 | `Set both the launch pad and the cup base bounce to 0.5`、`把发射板和杯底的弹性设为0.5` |
| 全局与局部明确组合 | `set global surface bounce to 0.8 and cup base bounce to 0` |

多目标只选择实际列出的名称／别名，不把局部操作扩大到全局；同一句的多个别名指向同一目标时只修改一次。通用设备名必须只对应一台设备；有多个风扇时用唯一 ID 或交给模型澄清。通用弹性／摩擦操作只生成一个 world 操作，执行时影响所有可修改表面，包括已有独立材质的表面；固定墙体不变。指定名称时只修改该表面，后续通用指令仍会覆盖它。相对修改分别读取每个表面的当前值；同条消息按操作顺序执行。Set 在准备时限幅；Scale 和加减保留到 Send now 时计算。详见[表面指令行为](./surface-command-scope.md)。

### 面包机的口语表达

明确指向 toaster／面包机／弹簧的“增加弹性”“增加弹力”“make the toaster bouncier”表示增强该机关的弹射，映射到它已有的 `spring_power`，不因字面上不存在 restitution 属性而拒绝，也不改成全局地面弹性。未给增量时使用可见的游戏预设 `+1`；明确写 0.5 就保留 `+0.5`，发送时读取实际值并限于 0–3。队列显示 **Toaster: Spring strength + 1 at Send now**，准备时不改变世界。

共享模块 `shared/spring-language.ts` 维护本地解释和模型提示中的同一规则。常见完整句在本地稳定准备，其余自然表达交给模型。普通地面／全局的“弹性”“弹力”仍表示碰撞恢复系数；显式恢复系数、N/m 刚度和牛顿力不当作弹射强度。不存在、歧义和预设机关继续按原权限处理。

### 先理解意图，再选择属性

这是一条通用原则，不要求玩家使用后端术语，也不靠逐个堆同义词解决。按“玩家希望产生的运动效果 → 明确提到的对象／场景 → 可执行规则”解释日常近似说法。弹性、弹力、拉力、浮力、向心力等词可能在生活语言中混用，不能仅因字面属性不匹配而拒绝；也不把它们无条件合并成同一个属性。明确的意图结合上下文转换，并用 understoodAs 显示实际对象、方向、属性和数值。真正缺少方向或目标时给出具体补充问题；执行权限、显式数量和引擎能力继续统一校验。

本地解析只是常见完整句的稳定捷径；更自由的表述由模型依据同一语义原则解释。仅提到“向心力”并不代表已经实现持续朝某个位置的径向力；需要根据玩家说明的运动效果和当前能力给出可检查的解释。

每个组合分句都必须完整可解析；不能识别的尾句、未知／歧义名称、单位错误、否定以及 `then / 然后 / 三秒后 / 直到` 等时序表达会使整条消息交给 AI，不保留已识别的前缀。第一版不推断省略的属性、代词或时序，也不支持不同设备类型共享一个“功率”属性的省略写法；可分别写完整分句。完整解析后若发现目标为 Preset 等明确权限错误，则直接报错。任何失败都不会准备或执行部分操作。旧的宽松正则实现 `acceleration-command.ts` 和 `surface-target.ts` 已移除，避免它们在 AST 失败后再次吞掉未解析文字。

截图中的 `add accelation to right` 可以本地纠正为 `add acceleration to right`。本地规则只覆盖简单明确的快速路径；其余口语、同义表达和长尾错词交给模型理解，不维护穷举的错词表。模型有充分信息时返回操作和 understoodAs；真正的方向冲突或未知目标仍应要求澄清。模型服务未配置或请求失败时，保留消息与世界，不编造成功结果。

自由语言使用兼容 API，模型可返回可选 understoodAs，前后端共享 schema 验证后显示。无论本地还是模型解析，最终执行均由同一规则引擎再次检查。

`server/src/compiler-meaning-policy.ts` 让模型先理解物理意图，再映射到现有能力，而不是按关键词白名单拒绝。“向上的浮力”“让小球向上浮起来”“give everything upward buoyancy”在没有幅值时解释为 world.acceleration_y=-1，保留 x；“向上的浮力 0.75 米每秒平方”解释为 -0.75。这里修改的是环境的净加速度，不另加浮力、不扣除当前重力，也不要求场景有水。概念映射应附 understoodAs，供发送前检查。

明确指定水密度、排水体积、牛顿单位的力、瞬时冲量或物体速度／位置等超出当前能力的要求仍拒绝，不把它们偷换为加速度。不存在的命名设备不退化成世界规则。完全无摩擦、完全不反弹等明确结果可以分别映射到摩擦／弹性为 0；含糊的强弱、目标或冲突方向仍需澄清。

真实模型曾把“5 newtons 向上浮力”转成 -5 m/s²，因此 `shared/force-units.ts` 在共享逐条编译校验中额外拒绝明确牛顿量，不能仅靠提示词防止换单位。没有力单位的日常“向上的浮力”仍可解释为向上加速度。AST 与意图策略已部署，验证与回退见 [发布记录](../deploy/ast-meaning.md)。

方向优先决定正数幅值的符号：“往左/向左 0.5”是水平 -0.5，“往上/向上 0.5”是重力 -0.5；没有方向的显式有符号轴值保留其符号。本地解析与模型提示保持一致，中文不能因为出现“设成 0.5”而丢掉前面的方向。

有限数值超出范围时，由 `shared/rule-limits.ts` 取最近边界：例如 fan power 10 → 2，-10 → -2。队列保留原消息，显示 Requested → limited to；准备不推进世界。绝对值先限幅再排队；相对操作在执行时读真实状态并限制结果，字幕说明实际结果。客户端、编译服务与运行时共用同一范围，不让模型自行决定如何改数字。

限幅不授予权限、不创建机关、不修复未知属性或非有限数值；混有无效意图的消息整条失败。存储的规则状态仍严格校验，不将损坏快照悄悄修复为合法状态。重试、Undo 和重新准备保留或重建调整说明。

`shared/physics-capabilities.ts` 是属性名称、目标种类、范围、单位、语义和基础词汇的共享目录。schema、场景范围、本地词汇匹配、界面名称和模型目录从这里获取；目录不会创建不存在的设备或解除 preset 权限。

`server/src/compiler-prompt.ts` 组装全关相同的系统规则、完整能力目录、操作语义和输出 schema。关卡对象/别名/权限放在用户消息开头，动态状态和玩家消息放在其后。自动测试检查固定前缀不会随状态和指令变化。这样安排有利于复用公共前缀；实际命中仍由供应商决定，参见 [DeepSeek 缓存说明](https://api-docs.deepseek.com/guides/kv_cache/)。

新增基础物理量先在共享目录声明，再实现执行器、真实结果字幕和方向绘图，并验证所有关卡。新增操作类型时须补充操作语义（TypeScript 检查覆盖）。不要为每关分别复制解析器或物理循环。

关卡初始值也统一为 initialAcceleration: [x, y]；Matter.js 的 engine.gravity 仅作为引擎适配入口。旧 set_gravity / reverse_gravity / gravity 属性输入可兼容，进入规则引擎后归一化为向量分量操作，规则快照不保存重复的 gravity 或 scalar acceleration 字段。
