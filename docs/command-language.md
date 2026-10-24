# 共享物理规则与消息理解

所有实验、关卡共享基础环境能力，不因教学重点而隐蔽禁用：

| 物理量 | 表达 | 单位 |
| --- | --- | --- |
| 竖直加速度 | gravity，正数向下、负数向上 | m/s² |
| 水平加速度 | world.acceleration_x，正数向右、负数向左 | m/s² |
| 表面弹性 | restitution | 系数 |
| 表面摩擦 | friction | 系数 |

关卡用布局、目标和建议指令介绍概念，允许其他符合规则的解法。设备只在实际存在时可用，教学设备的 Preset 仍独立保留；任务物体不能被直接移动、改速度、质量或尺寸。

`add acceleration rightward` 默认添加向右 1 m/s²；`add acceleration leftward` 向左；`stop horizontal acceleration` 关闭水平加速度。竖直加速度复用 gravity，不叠加第二套竖直力。关闭保留惯性，反转修改加速度，不瞬间翻转速度。

简单语句由 `shared/acceleration-command.ts` 解析；已知拼写由 `shared/command-language.ts` 保守纠正，例如 acceleration 语境中的 `right word` → `rightward`。保留原文，队列显示 Understood as，玩家检查后再 Send now。数字、否定词和对象 ID 不由拼写规则改写；方向冲突、未指明方向、定时条件和物体直接操作不猜测。

自由语言使用兼容 API，模型可返回可选 understoodAs，前后端共享 schema 验证后显示。无论本地还是模型解析，最终执行均由同一规则引擎再次检查。

新增基础物理量时同步 schema、场景上下文、单位与边界、模型提示、执行器、真实结果字幕和方向绘图。不要为每关分别复制解析器或物理循环。
