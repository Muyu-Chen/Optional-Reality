# Optional Reality

**Reality is optional. The laws of physics are yours to rewrite.**

Optional Reality is an experimental AI-powered physics sandbox where you can describe new physical laws in natural language and watch a simulated world react in real time.

## 项目思想

如果重力、摩擦和物体之间的相互作用都可以重新定义，会发生什么？

我们希望用户通过自然语言描述新的物理规律，并立刻观察它们在二维世界中的效果。除了修改参数，还要逐步支持「什么时候、对哪个物体、按什么条件」应用规则，例如：

- "Make gravity pull everything to the left."
- "Double gravity while the ball is on the ramp, then reduce it during flight."
- "Make the spring twice as stiff."
- "Make A attract B using inverse-square gravity."

这些是目标能力示例，当前尚未实现。我们会先完成最小交互闭环，再逐步扩展规则种类。

### Guided Experiments + Free Sandbox

- **引导实验**：提供明确的初始场景和目标。第一个实验是让小球沿斜坡运动，最终进入 Exit；用户通过修改规则尝试不同解法。
- **自由沙盒**：提供自由实验空间，让用户创建物体、组合规则、观察结果，不要求通关。首版先提供一个简单的可重置场景。

引导实验帮助用户理解系统的能力，自由沙盒承接进一步的探索。Hackathon 首先做好一个引导实验和一个基础沙盒。

### AI 生成规则，物理引擎运行世界

核心流程是：**一句自然语言 → 一条经过验证的结构化规则 → 可观察的物理变化**。

AI 负责将用户意图编译为声明式规则；规则引擎负责条件判断、事件监听、自定义力和规则生命周期；Matter.js 负责实际的物理模拟。AI 仅在用户提交指令时参与，不参与逐帧计算，也不直接生成模拟结果。

我们只执行系统明确支持并经过验证的规则，不执行模型生成的任意 JavaScript。界面应展示规则的含义和影响对象，使每次修改都可理解、可检查、可撤销。

### 让实验可以比较

- **Undo**：撤销最近一次规则修改，不自动恢复物体之前的位置和速度。
- **Replay**：从相同初始场景重新创建物理世界，应用当前规则集后运行，便于比较不同规则的效果。
- **Reset**：恢复初始场景及其默认规则，清理本轮实验状态。

重建世界应清除旧速度、约束、计时器和事件监听等运行状态，采用固定时间步长，减少上一轮实验对下一轮的影响。

物理反馈本身也是探索的一部分：增大全程恒定重力未必能让小球飞得更远；物体之间有吸引力，也不意味着自动形成稳定轨道。系统应真实执行规则，让用户通过实验发现条件、初始速度和规则组合的作用。

## 首版形态与技术方向

首版是运行在浏览器中的 **Web 应用**，暂不引入 Electron。使用 React + TypeScript + Vite 构建界面，Matter.js + Canvas 2D 运行和展示模拟；Node.js + Express 后端连接可配置的 **OpenAI 兼容 API**，并通过 Zod 校验规则。

物理模拟在浏览器本地运行，模型请求经过后端。API 地址、模型和密钥可配置，不绑定单一服务商；首版使用内存保存场景和规则，不引入数据库。

物理引擎、规则引擎与 AI 请求层保持独立，后续如需桌面窗口、本地文件或本地模型能力，再考虑接入 Electron。

完整技术栈、模块划分和开发顺序见 [dev-todo.md](./dev-todo.md)。

## 当前状态

🚧 **早期规划阶段** — 面向 **SBUHacks 2026**。

当前仓库只有项目文档，尚无可运行原型。首要目标是跑通斜坡、小球、Exit 与自然语言改规则的完整流程；弹簧、自定义引力场等能力随后扩展。
