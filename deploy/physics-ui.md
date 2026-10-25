# 渐进摩擦、碰撞教学与结算背景

2026-10-25 发布，游戏源码补丁至 `e502c14`。线上入口为 [Optional Reality](https://optionalreality.site/)，旧 `/demo/` 路径继续可用。

## 本次改动

- 固定旋转的滑块按真实接触载荷计算库仑摩擦，独立实现在 `client/src/physics/slider-friction.ts`。跑道初速 2 m/s、向下加速度 2 m/s² 时，摩擦 0.3 约用 3.33 秒停下。提示、跑道长度和停车区随停止距离调整；Return to Dock 和已有 Mind the Gap 的推荐制动时机一并更新。详见[接触摩擦](../docs/sliding-friction.md)。
- Bank Shot 改为 02.1 碰撞教学，蓝色地面的 A Little More Bounce 为 02.2。新增三步图示和首次访问默认弹性消息；既有队列与成绩键保留。多次反弹、摩擦跑道、接球杯分别顺延到 02.3、02.4、02.5，其余关卡 ID 不变。
- 星星结算后背景继续响应本轮加速度，玩法与结果冻结。见[背景生命周期](../docs/result-background.md)。
- BEFORE YOU BEGIN 至少保留 5 秒，再用 400 毫秒渐隐；悬停、焦点及淡出期间移回均能继续阅读。见[初始提示](../docs/initial-state-briefing.md)。

## 验证

物理及游戏模块共运行 70 个测试文件、688 项用例。首次有 3 项旧流程／时机断言失败；更新关卡顺序和实际制动时机后，涉及的 2 个文件、16 项用例全部通过，其余 685 项首次已通过。类型检查与生产构建通过。另有接触摩擦、教学及受影响关卡的定向回归，覆盖空中／零重力无摩擦、载荷、质量、接缝、防反向、不同提前制动时机和满星路线。

浏览器实际执行 Bank Shot 默认消息获得三星，结算明确显示下一关 A Little More Bounce；公网确认新的 02.1 三步教学与首次默认消息。三个域名 API 健康，9 个公开游戏文件逐一与构建哈希核对。未重复完整服务端／模型测试。

## 发布与备份

为保留另一项任务已经发布的 21 关，本版从 `20261025T112914Z-momentum-7e25a3e0` 的固定源码快照加入本次补丁，未用仅含旧关卡注册表的 main 构建覆盖线上。介绍页、演示视频与字幕从发布前最新静态目录完整保留，只覆盖本次 `demo/` 构建。

| 项目 | 当前目录／服务 |
| --- | --- |
| 应用 | `/opt/optional-reality/releases/20261025T121313Z-dccbd5d-physics-ui` |
| 静态 | `/var/www/muu-tech/releases/20261025T121313Z-dccbd5d-physics-ui-optional-reality-game` |
| 新 API | `optional-reality-20261025T121313Z-dccbd5d-physics-ui.service`，仅回环端口 3005 |
| 原应用 | `/opt/optional-reality/releases/20261025T112914Z-momentum-7e25a3e0`，端口 3004 |
| 原静态 | `/var/www/muu-tech/releases/20261025T120636Z-whisper-aligned-optional-reality-game` |
| 服务器备份 | `/var/backups/optional-reality/20261025T121313Z-dccbd5d-physics-ui/` |
| 本地备份 | `.localwork/deploy-20261025T121313Z-dccbd5d-physics-ui/backup/`，已忽略 |

旧服务继续运行。新服务独立启动后，原子切换应用与静态链接，Apache 仅 graceful；既有四个 API 与 Apache 的进程、启动时间均保持不变。持久环境配置及 Gemini／DeepSeek 密钥未修改。网站和应用源码备份已下载并核对 SHA256，备份目录 700、文件 600，不包含密钥文件。

回退须同时恢复原应用、原静态和备份中的 `optional-reality-game.conf`（API 3004），校验 Apache 配置后 graceful，并核对三域名健康。使用同目录临时软链接原子替换 `current`，不要覆盖 release 或停止仍在使用的旧服务。发布器已有切换失败自动回退；发布后的手动回退应先核对当前链接，避免覆盖其他任务的新发布。
