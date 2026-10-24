# 关卡定义

每个关卡放在一个独立的 TypeScript 文件中，并导出符合 `LevelDefinition` 的只读配置。当前第一关为 [gravity-lab.ts](./gravity-lab.ts)，公共类型见 [types.ts](./types.ts)。

关卡文件只定义数据，可以使用 `geometry.ts` 生成曲线采样点；不创建 Matter 刚体，不启动计时器，也不操作 React 或 Canvas。

| 字段 | 用途 |
| --- | --- |
| `id`、`number`、`title` | 稳定标识、编号、界面与标签页标题；浏览器消息按关卡 ID 保存 |
| `viewport` | 逻辑画布尺寸，以及每米对应的坐标单位数 |
| `timeLimitSeconds` | 物理超时、界面倒计时和时限提示共同读取的秒数 |
| `initialGravity` | 初始重力加速度，单位 m/s²；正数向下，负数向上 |
| `ball` | ID、标签、出生坐标、半径、弹性与初速度；初速度单位为 m/s |
| `tracks` | 一组有 ID 的折线轨道及厚度；碰撞与绘图使用相同的点和厚度 |
| `guideLines` | 支撑线、基线等装饰，仅用于绘图，不产生碰撞 |
| `exit` | 出口位置、尺寸与标签；绘图和接触通关判断使用同一矩形 |
| `instructions` | 目标、提示、画布标题、无障碍描述、示例消息与建议命令 |

坐标原点在左上角，x 向右、y 向下。位置、半径、轨道厚度与出口尺寸使用逻辑画布坐标。`ball.velocity` 使用 m/s，运行时统一换算为 Matter 的速度单位。`instructions.objective` 是不带句号和时限的目标短语，界面会自动补上关卡秒数。

新增同类关卡时：

1. 复制第一关到新的关卡文件，设置独立的 ID 和场景数据。
2. 在 `App.tsx` 的组合入口导入新定义，并将 `level` 指向它。
3. 运行 `npm test` 与 `npm run build`，在浏览器检查碰撞、通关和 Reset。

`PhysicsWorld(level)` 只负责建造和更新物理世界，`CanvasLab(canvas, level, report)` 负责画面、循环与清理；Reset 会从同一关卡定义创建新的物理世界，配置本身不保存本轮运行状态。

目前支持一个球、多条轨道、房间边界和接触出口目标。弹簧、星星等新物体或新目标需要扩展公共类型与运行时，再由关卡文件配置；暂不引入关卡回调、动态脚本或任意代码执行。
