# Start 与救援空间发布 — 2026-10-25

- 应用提交：`0345847a691c1c6977285cd761dbc9c5fd5fab25`。
- 应用：`/opt/optional-reality/releases/20261025T070356Z-0345847-start-rescue`。
- 静态：`/var/www/muu-tech/releases/20261025T070356Z-0345847-start-rescue-optional-reality-game`。
- 三个域名根目录、旧 `/demo/`、介绍页路由继续保留。Start 直接开始当前规则下的模拟，队列保持待发；首次发送仍会自动开始。
- 包含向上、向右各扩展 20% 的一次救援加时、贴屏幕左缘的边框、平滑镜头及重试恢复。加时通关仍扣一星。

## 验证与发布

固定提交独立快照通过 115 个 Vitest 文件／1076 项测试、13 项动画测试，合计 1089 项；类型检查与构建通过。依赖锁文件与上一版一致，复用其依赖副本。工作区中其他未提交草稿不包含在发布内。

用户要求快速部署后，仅保留必要的启动、页面版本和服务健康检查，没有追加模型调用或整轮游玩。临时服务预检发现运行包缺少后端共用的 `client` 关卡文件，已从同一测试快照补齐并校验归档，健康通过后才切换正式版本；正式站未受该预检失败影响。后续打包必须包含 `client/src/levels` 及其依赖。

三个域名的根页面与介绍页哈希匹配，正式服务 active、API configured 为 true；线上页面已确认 Start 按钮。临时 3118 服务已停止。持久配置、原 DeepSeek 与 Gemini key、证书和路由逐字节保持不变。

## 备份与回退

- 服务器：`/var/backups/optional-reality/20261025T070356Z-0345847-start-rescue`。
- 本地：`.localwork/deploy-20261025T070356Z-0345847-start-rescue/backup`，权限受限且已忽略；三个归档两端 SHA256 一致，不含实际 `.env` 或证书私钥。
- 上一应用：`/opt/optional-reality/releases/20261025T064128Z-dcc2bac-surfaces`。
- 上一静态：`/var/www/muu-tech/releases/20261025T064128Z-dcc2bac-surfaces-optional-reality-game`。

回退前确认两个 current 仍指向本页当前版本，再使用临时软链接原子替换至上述旧目录；重启 optional-reality 并确认回环 3001 健康后切换静态 current。只回退代码，不回退持久配置。新旧 release 和旧哈希资源均保留。
