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

简单语句由 `shared/acceleration-command.ts` 解析；已知拼写由 `shared/command-language.ts` 保守纠正，例如 acceleration 语境中的 `right word` → `rightward`。保留原文，队列显示 Understood as，玩家检查后再 Send now。数字、否定词和对象 ID 不由拼写规则改写；方向冲突、未指明方向、定时条件和物体直接操作不猜测。

截图中的 `add accelation to right` 可以本地纠正为 `add acceleration to right`。本地规则只覆盖简单明确的快速路径；其余口语、同义表达和长尾错词交给模型理解，不维护穷举的错词表。模型有充分信息时返回操作和 understoodAs；真正的方向冲突或未知目标仍应要求澄清。模型服务未配置或请求失败时，保留消息与世界，不编造成功结果。

自由语言使用兼容 API，模型可返回可选 understoodAs，前后端共享 schema 验证后显示。无论本地还是模型解析，最终执行均由同一规则引擎再次检查。

方向优先决定正数幅值的符号：“往左/向左 0.5”是水平 -0.5，“往上/向上 0.5”是重力 -0.5；没有方向的显式有符号轴值保留其符号。本地解析与模型提示保持一致，中文不能因为出现“设成 0.5”而丢掉前面的方向。

有限数值超出范围时，由 `shared/rule-limits.ts` 取最近边界：例如 fan power 10 → 2，-10 → -2。队列保留原消息，显示 Requested → limited to；准备不推进世界。绝对值先限幅再排队；相对操作在执行时读真实状态并限制结果，字幕说明实际结果。客户端、编译服务与运行时共用同一范围，不让模型自行决定如何改数字。

限幅不授予权限、不创建机关、不修复未知属性或非有限数值；混有无效意图的消息整条失败。存储的规则状态仍严格校验，不将损坏快照悄悄修复为合法状态。重试、Undo 和重新准备保留或重建调整说明。

`shared/physics-capabilities.ts` 是属性名称、目标种类、范围、单位、语义和基础词汇的共享目录。schema、场景范围、本地词汇匹配、界面名称和模型目录从这里获取；目录不会创建不存在的设备或解除 preset 权限。

`server/src/compiler-prompt.ts` 组装全关相同的系统规则、完整能力目录、操作语义和输出 schema。关卡对象/别名/权限放在用户消息开头，动态状态和玩家消息放在其后。自动测试检查固定前缀不会随状态和指令变化。这样安排有利于复用公共前缀；实际命中仍由供应商决定，参见 [DeepSeek 缓存说明](https://api-docs.deepseek.com/guides/kv_cache/)。

新增基础物理量先在共享目录声明，再实现执行器、真实结果字幕和方向绘图，并验证所有关卡。新增操作类型时须补充操作语义（TypeScript 检查覆盖）。不要为每关分别复制解析器或物理循环。

关卡初始值也统一为 initialAcceleration: [x, y]；Matter.js 的 engine.gravity 仅作为引擎适配入口。旧 set_gravity / reverse_gravity / gravity 属性输入可兼容，进入规则引擎后归一化为向量分量操作，规则快照不保存重复的 gravity 或 scalar acceleration 字段。
