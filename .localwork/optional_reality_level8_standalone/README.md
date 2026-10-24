# Optional Reality — Level 8 · 街角面包店

## 当前场景：最后一单

这份解压后的独立实验已换成低饱和的街角面包店：奶油白墙面、暖木柜台、窗外街景、瓷砖、面粉罐、手写菜单和取餐纸袋。没有图片下载、外部字体或新增依赖，全部由原页面的 Canvas 绘制。

直接用浏览器打开 `index.html` 即可离线体验。也可在这个目录运行：

```sh
python3 -m http.server 8788 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:8788/`。

任务是在打烊前送出最后一个圆面包。原版机关对应到店里的日常物件：

| 原版 | 面包店表现 |
| --- | --- |
| 能量球 / core | 圆面包 |
| conveyor | 柜台传送台 |
| spring | 弹簧烤面包机 |
| fan | 台面冷却风扇 |
| wheel | 通风叶轮 |
| sensor | 取餐感应铃，虚线圈显示原有触发区域 |
| gate | 取餐口卷帘 |
| EXIT | 标有 08 号订单的取餐纸袋 |
| chasm | 两个柜台之间的开放空隙 |

点击画面里的机关或右侧配方，会预填原版支持的指令；只有点击「应用规则」才会执行、扣减次数。指令中的 `core` 仍是原版对象名称，对应画面的圆面包。

场景、说明、状态文案和机关点击快捷输入做了调整。原始解析器、物理更新、碰撞位置、机关数值、100 次预算、重试与通关条件保持不变。原压缩包和主项目源码均未改动，`integration/` 与原测试也原样保留。

预览见 `screenshots/bakery-scene.png`，浏览器通关截图见 `screenshots/bakery-complete.png`。验证记录见 `TEST_RESULTS.md`。

---

## 原独立原型说明（保留作机制参考）

Based on the private GitHub repository **Muyu-Chen/Optional-Reality**, `main` at commit `99d0b321a16e7e7fd5861e80c04d858ae4565ca7` (read-only).

## Launch

Open `index.html` with a current Chromium/Firefox browser. No Node.js, dependency installation or AI key required.

## Game objective

Single-player final stage, **Reality Breakdown**. Move the autonomous energy core into the EXIT by changing **environmental properties only**. You cannot directly change core position, velocity, mass or size. The level integrates gravity, bounce, friction, conveyor belts, spring launcher, fan, rotary wheel, and a sensor-triggered gate.

The local parser supports only a documented subset of English and Chinese commands, so this is an **offline interaction and physics proof of concept, not a trained LLM or a verified replacement for the repository's Matter.js engine**. It provides fixed-timestep custom 2D collision/motion, command validation, rule history, undo (rules only), replay (core reset), and a 100-valid-command budget. The gate rule is event driven, and only fires if the energy core physically comes close to the sensor.

Example strategy to test:

1. `Set conveyor speed to 1.5`
2. `Set spring power to 2`
3. `Set fan power to 0.45`
4. `When the core touches the sensor, open the gate`
5. Start simulation; tune fan power/spring power as needed, and press Replay to compare.

## Why not directly imported into GitHub's current runtime?

The repository currently defines levels as **read-only data** (`client/src/levels/types.ts` and `gravity-lab.ts`). Its `PhysicsWorld` supports only one ball, static rails, room borders and an exit; `shared/commands.ts` currently accepts only three gravity commands. The additional apparatus, event triggers and environment rule schema in this prototype require new runtime and validator functionality. The source repository was **not modified**, and no commit was created.

See `integration/` for a data-definition sketch and an exact integration checklist that avoids changing the existing demo implicitly.
