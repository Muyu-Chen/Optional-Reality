# 运动与碰撞扩充：01.3–01.5、02.1 与 02.6–02.7

本轮新增六个几何物理解谜关，当前共十五关、四十五颗星。优先扩展运动和碰撞，沿用真实加速度、惯性、接触弹性与摩擦；不新增机关或关卡专属操作。机关章保留原三关。

本轮十五关已发布到三个域名；采用并行后端和平滑切换，保留原有服务运行。版本、备份和回退见 [发布记录](../deploy/motion-collision-levels.md)。

## 玩法与操作

| 编号 / ID | 空间问题 | 推荐满星操作 |
| --- | --- | --- |
| 01.3 Bring It Back / `bring-it-back` | 出口在起点后方，星星在右方；制动后仍会继续前进 | Start 放行初始向右 2 m/s 的漂移；中间星附近发送 `acceleration leftward 1`，取远星后回程 |
| 01.4 Over the Wall / `over-the-wall` | 高墙挡路，出口位于墙后更低处 | `acceleration upward 0.2` 起步，在墙左沿附近发送 `reverse gravity`，先继续上升、再下降 |
| 01.5 The Side Door / `side-door` | 下方挡板要求从右端绕行，再回到左下出口 | `acceleration rightward 0.15` 起步，首星附近发送 `acceleration leftward 0.15`；保留下行速度 |
| 02.1 Bank Shot / `bank-shot` | 零重力中，出口在水平来球的上方 | 碰撞前设置 `Set surface bounce to 1`；斜板实际反射把球向上送出，无需改加速度 |
| 02.6 Return to Dock / `return-to-dock` | 取得右侧远星，再回左侧停车 | 先 `Set return wall bounce to 0.9`；滑块反弹后、尚未进入绿区时 `Set surface friction to 0.3` |
| 02.7 One Last Bounce / `one-last-bounce` | 同一块地面要先发射、再接住滑块 | 先 `Set surface bounce to 0.9`；首次弹起后发送 `Set surface bounce to 0 and surface friction to 0.3` |

前两章顺序分别为原入门关 → 原弹簧关 → 回程 → 越墙 → 绕板，以及斜板反射教学 → 原反弹 → 双反弹 → 摩擦停车 → 局部接球教学 → 回弹停车 → 同面两次碰撞。旧关 ID、存储键和初始物理状态保留。

全部新关使用原有 30 秒与救援加时、开放边界和每关三颗真实星星的评分。出口不锁星，不检查指定口令。玩家可用其它环境规则、不同强度、不同顺序完成；早回程、较弱斜板反弹和去程停车都有普通通关路线。

## 容错验证

以下为 120 Hz 真实 Matter 世界中的采样，不要求玩家读取坐标或 tick：

| 关卡 | 满星验证采样 |
| --- | --- |
| Bring It Back | 中心 x=460、500、540、580、600 发送向左 1；首尾约 0.88 秒 |
| Over the Wall | 中心 x=280、290、300、310 反转；首尾约 0.47 秒，普通通关区间更宽 |
| The Side Door | 中心 y=185、190、195、200 切换向左 0.15；首尾约 0.63 秒 |
| Bank Shot | 弹性 0.8、0.9、1、1.1 均满星；记录真实斜板接触且环境加速度始终为零 |
| Return to Dock | 反弹后在中心 x=400、440、480、520、560 提前制动，首尾约 1.11 秒 |
| One Last Bounce | tick 230、300、420、540 软化同一地面并加摩擦；首尾约 2.58 秒 |

越墙和绕板使用慢速初始运动，使位置提示可观察、队列可提前准备。斜板来球采用 3 m/s，确保入射法向速度足以触发引擎的真实回弹，而非低速静接触。停车关采用约束旋转的真实滑块，使用接触摩擦；不把静摩擦当作圆球滚动阻力。

所有满星样本都在正常时间完成。测试还覆盖省略第二条规则、过早回程漏星、去程停车漏星、首碰前软化失败，以及空中修改地面材质不改变物体当前速度。

## 接入与验证边界

- 六个独立关卡文件只定义数据，catalog 注册后沿用通用物理、绘图、判胜、命令权限与服务端场景上下文。
- 每关提供独立背景配色和实际几何缩略图。选关总数与星数来自 catalog；旧的固定 Nine 标题文案改为实际关卡数。
- `test/level-solutions.ts` 保存测试用玩家操作；`star-routes.test.ts` 验证全部十五关满星；`motion-collision-expansion.test.ts` 验证新关的容错与失败。
- `game/expanded-levels.test.tsx` 使用真实队列和 Matter 世界验证新关满星、成绩保存、重试草稿、再次完成及跨章 Next level；不请求真实模型。

Bank Shot 首访提供蓝色反弹、斜板转向和星星路线三步图解，默认只准备弹性 1，等待玩家 Send now。旧草稿与通关成绩按 ID 保留，Next level 接入 A Little More Bounce。
