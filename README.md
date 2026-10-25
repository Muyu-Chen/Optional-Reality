# Optional Reality

**Reality is optional. Change the rules. Choose the moment.**

Optional Reality 是一个通过自然语言改写规则、选择执行时机的 **2D 物理解谜游戏**。

核心循环：观察场景 → 编写消息 → 解析排队 → **Send now** → 物理变化与字幕反馈 → 重试不同解法。

AI 把玩家意图编译成受支持的声明式操作，Matter.js 真实运行物理世界。玩家决定规则何时生效；关闭重力保留惯性，反转与翻倍在执行时读取当前值。模型不参与逐帧计算，不执行生成的 JavaScript。

## 当前可玩内容

面向 SBUHacks 2026，已实现三个等级、九个递进小关：

| 等级 | 小关 | 主要学习内容 |
| --- | --- | --- |
| 1 · Motion | 01 Gravity Lab | 零重力起步，沿斜坡运动，在离轨时取消重力 |
| 1 · Motion | 01.2 One More Turn | 落下取星、被动弹簧自然回弹，再改变加速度取得高处星 |
| 2 · Collisions | 02.1 A Little More Bounce | 直接反弹可通关，低弹性后向上加速可收齐星星 |
| 2 · Collisions | 02.2 Not Too High | 满分路线：高弹性取高星，再增大向下加速度回到出口 |
| 2 · Collisions | 02.3 Brake Before the Edge | 青色摩擦跑道，完整停靠滑块 |
| 2 · Collisions | 02.4 Catch Tutorial | 短教学：分别修改发射板与杯底，可以提前设置 |
| 3 · Devices | 03.1 A Little Stored Energy | 学习面包机的压缩、蓄力与释放 |
| 3 · Devices | 03.2 Catch the Breeze | 学习向上的风场 |
| 3 · Devices | 03.3 The Last Order | 组合传送带、面包机、风扇和感应开门 |

等级安排教学顺序；基础物理量各关一致，布局和提示引导新的概念。预设设备与结构单独标记。转轮运行层已保留，更多机关组合、自然元素和自由沙盒后续扩展。

## 游戏操作

- 全屏场景，右下半透明输入窗；Enter 将消息排队，Shift+Enter 换行。
- 消息自动解析，每条旁边都有小号 **Send now** 和删除按钮，可直接选择执行；批量按列表顺序。准备消息不改变世界。
- 简单指令可本地准备，自由语言使用 DeepSeek Flash。等待 AI 时暂停；执行已准备消息不等待网络。
- 左侧字幕显示实际修改结果，几秒后淡出。规则参数、提示、批量发送与历史收在菜单里。
- 每关三颗星；到达出口可过关，收齐后到达出口才获满分，重试恢复全部星星。
- 首次有效发送开始 30 秒模拟倒计时；普通暂停、API 等待与教学暂停不消耗模拟时间。
- **Try again** 恢复初始世界和额度，原消息重新待发，保留已解析操作以比较发送时机。
- 面包机每次接触会蓄力约 0.6 秒；首次额外暂停教学，Continue 后恢复。重试不重复打断，菜单可重看教学。
- 暂停菜单切换小关，通关后可进入下一关。结算用大号独立星形区分已取得与遗漏，普通通关和满分有不同反馈。
- 首次操作后播放低音量原创背景音乐；左下角 **Music on/off** 可切换并记住选择，切出页面暂停、切关不叠加。
- 界面以英语为主，支持中英文输入，正文与场景标注采用更清晰的字号和对比。

基础例子：`add gravity`、`stop gravity`、`reverse gravity`、`add acceleration rightward`、`Set surface bounce to 0.9`、`Set toaster power to 2`、`Set fan power to 0.45`。设备需要实际存在且可编辑；任务物体不能被直接移动或修改速度。

物理特性使用固定视觉语言：蓝色回弹纹、青色摩擦纹、橙色推动箭头、紫色重力方向。输入窗列出本关可修改项；设备的 Editable / Preset 与特性颜色分开。新增三关的玩法与验证见 [几何关卡说明](./docs/geometry-levels.md)，后续机关见 [机关设计提案](./docs/physics-mechanisms.md)。

所有关卡共享加速度向量、弹性和摩擦；重力是竖直分量的输入别名，方向与强度都由同一向量表示。每个分量允许 -100 至 100 m/s²，向下 20 会保留为 +20。教学提示推荐解法而不禁用基础物理量。`add acceleration right word` 会纠正为 `add acceleration rightward`，队列保留原文并展示理解结果。消息语义见 [共享物理规则与消息理解](./docs/command-language.md)。

基础能力、范围、单位和界面名称统一定义在 `shared/physics-capabilities.ts`。模型在每关收到相同的完整能力说明；关卡只补充对象、别名和预设权限。简单明确的消息走本地解析，口语和未识别错词由模型兜底理解，再由共享代码校验。

超出范围的有限数值由共享代码限幅，例如 fan power 10 → 2。队列显示原请求与实际值，等待 Send now；未知对象、受保护目标和非有限值仍拒绝。

## 本地运行

使用支持 Vite 8 的 Node.js；当前在 Node.js 26 验证。

```sh
npm ci
cp -n .env.example .env
# 在 .env 的 AI_API_KEY 中填入密钥；已有 .env 时直接编辑，避免覆盖
npm run dev
```

打开 `http://127.0.0.1:5173/demo/`。Vite 前端和 Express API 同时启动。

默认配置为 `AI_BASE_URL=https://api.deepseek.com`、`AI_MODEL=deepseek-flash`，使用 JSON 输出并关闭思考模式。密钥仅由后端读取，不能使用 `VITE_` 变量传入前端；修改配置后重启 API。

```sh
npm test
npm run build
npm start
```

生产构建后，`npm start` 在 `http://127.0.0.1:3001/demo/` 同时提供游戏与 API。测试默认使用模拟模型，不消耗真实 API；真实 DeepSeek 调用单独验收。构建产物、依赖、密钥和本地备份均不提交。

测试条件与新增测试要求见 [测试说明](./docs/testing.md)。GitHub Actions 在每次 push / pull request 时运行测试和构建。

只看静态前端可用 `python3 -m http.server 8793 --bind 127.0.0.1 --directory site`，访问 `/demo/`；此方式仅本地指令可用。

## 架构与设计

React + TypeScript + Vite 管理界面；Matter.js + Canvas 2D 运行、绘制世界；Express 调用可配置的 OpenAI 兼容 API；Zod 共享并校验规则。Web 首发，暂不做 Electron、数据库或 3D。

- `client/src/levels/`：独立关卡、等级与编辑权限。
- `client/src/game/`：游戏会话、队列交互、AI 准备与世界生命周期。
- `client/src/components/`、`styles/`：独立界面组件与分模块样式。
- `client/src/physics/`：固定时间步长、设备、机关状态和独立绘图。
- `client/src/domain/`：消息队列、执行历史与真实变化字幕。
- `shared/`：声明式操作、状态与编译协议。
- `server/src/`：模型适配、提示词、场景权限及 HTTP。

完整设计与开发要求见 [游戏设计约定](./docs/game-design.md)，模块职责见 [代码结构](./docs/code-structure.md)，当前进度见 [dev-todo.md](./dev-todo.md)，新增关卡见 [关卡说明](./client/src/levels/README.md)，API 配置见 [server/README.md](./server/README.md)。

面包店绘图改编自 yihanzhao231 的 `temp/1024-zyh@30d802f`，物理和指令统一使用本项目运行层。旧关卡 ID `reality-breakdown` 保留。

静态介绍页位于 `site/`，线上游戏为 [muuyyy.cfd/demo/](https://muuyyy.cfd/demo/)，已发布九关、三颗星评分、逐条紧凑消息操作和统一加速度向量，前后端协议同步更新。版本、备份与回退见 [线上游戏部署记录](./deploy/live-game.md)；早期介绍页备份见 [deploy/README.md](./deploy/README.md)。

线上游戏仅通过本站 HTTPS 转发调用模型，后端只监听回环端口，密钥留在服务器；健康检查为 `/api/health`。共享能力版本已完成本地与线上两轮各 85 条真实模型指令验收。

满分路线、消息操作与向量语义见 [星星玩法约定](./docs/star-gameplay.md)；九关的具体路线见 [阶段式物理解谜](./docs/phase-puzzles.md)。

本轮结算界面、配色字号与音乐改进已在本地完成验证，尚未再次部署；线上仍为上述九关发布版本。
