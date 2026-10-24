# 验证记录 — Level 8 街角面包店

当前场景已在本机浏览器完成画面检查和实际点击通关，不再受原包所记载的浏览器限制影响。

## 当前版本验证

- `node tests/verify.cjs`：原有 7 项模拟检查全部通过，原四指令解法仍在约 2.70 模拟秒内完成。
- 对照原 ZIP 中的 `index.html`，逐段比较 `parse`、`apply`、`undo`、`resetAll`、`update` 函数：完全一致。
- 对照原 ZIP：`tests/verify.cjs` 与 `integration/` 两个文件内容完全一致。
- 浏览器：点击画面中的冷却风扇，输入框正确预填 `Set fan power to 0.45`；未应用时配额仍为 100。
- 浏览器：通过输入框和「应用规则」按钮逐条应用传送台 1.5、弹簧 2、风扇 0.45、感应开门规则，再点击「开始营业」。出现「订单完成」「已开启」「已装袋」，配额 96 / 100。
- 浏览器：点击「重新布置」，配额恢复 100 / 100，面包回到传送台，卷帘恢复待感应。
- 浏览器错误与警告日志为空。
- Git 工作区没有主程序文件修改；改动只保存在 `.localwork/optional_reality_level8_standalone/`。

截图：`screenshots/bakery-scene.png`（初始场景）、`screenshots/bakery-complete.png`（实际通关）。

## 原包模拟记录

Repository version consulted: `Muyu-Chen/Optional-Reality@99d0b321a16e7e7fd5861e80c04d858ae4565ca7`.

Run: `node tests/verify.cjs`.

Result: **7 simulation checks passed**, executed by Node.js against the exact embedded JavaScript extracted from `index.html` with a mocked DOM and Canvas. The simulation uses a fixed timestep of 1/120 second.

| Check | Result |
| --- | --- |
| Default factory does not accidentally win and times out | PASS |
| Four environment-rule commands reach EXIT | PASS, about 2.70 simulated seconds |
| Gate without sensor rule remains closed | PASS |
| Direct energy-core modification is rejected without decrementing quota | PASS |
| Replay resets core while retaining environmental rules and quota | PASS |
| Full reset clears environment, history, and quota | PASS |
| Gravity, elasticity, friction, wheel commands and out-of-range handling | PASS |

**Browser UI limitation**: The available automated Chromium environment blocked navigation both to the local HTML file and to a loopback HTTP server. Therefore, the page has *not* been validated by an interactive browser screenshot/click-through test in this session. Layout and visual performance should be manually checked in Chrome or Edge. This limitation does not invalidate the deterministic JavaScript simulation checks above.

**Architecture limitation**: This is a standalone proof of concept with its own small 2D simulation and local command parser. The repository's Matter.js runtime currently has no such device support. The contents of this package are not represented as a verified integration or a GitHub commit.
