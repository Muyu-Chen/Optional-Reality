# 相对加减与倍数

`地面弹力+2` 是给当前弹性系数加 2，不是翻倍。新增声明式 `add_property`，负的 `amount` 表示相减；`scale_property` 继续只处理倍数，`set_property` 处理绝对赋值。

```json
{"type":"add_property","target":"world","property":"restitution","amount":2}
```

- 明确语法可以本地准备：`surface bounce +2`、`bounce +=2`、`弹性增加2`、`increase surface bounce by 2`；减法使用 `bounce -=0.2`、`弹性减少0.2` 或 `decrease bounce by 0.2`。
- `gravity = +2`、`set bounce to 2` 仍是绝对值。`add gravity` 保持现有含义：把竖直加速度设为向下 1 m/s²。
- 待发消息保留原始增量。在 Send now 时读取实际属性；点名表面时读取该表面的实际值；通用弹性／摩擦修改分别读取所有可修改表面的实际值，随后逐个限幅。比如弹性 0.1 加 2 的请求值是 2.1，实际上限是 1.5；字幕显示实际值及 limited from 2.1。
- 未知对象名称（如场景没有注册的 `padding`）交给 AI 澄清，不把它静默当成全局。首轮后端检查明确加减语义；若模型返回乘法或绝对值，进行[一次 AI 对话修复](./compilation-repair.md)。第二轮不再重复原意启发式，可执行的解释进入 Ready 供玩家查看，前端仅复核可执行性。
- 新前端携带 `X-Rule-Arithmetic: add-v1`。旧页面没有这个能力标记时，加减结果变成可读的刷新提示，不把新操作交给旧 schema。

`shared/additive-command.ts` 负责明确加减语法和意义检查，`shared/property-change.ts` 负责数值运算；通用规则引擎仍负责权限、继承与范围。模型算术提示词和 HTTP 兼容处理各自独立；队列、字幕、Undo 和 Try again 复用原有执行流程。
