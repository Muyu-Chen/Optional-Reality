# 面包机口语指令修复 — 2026-10-25

应用提交 `5d9810375c144d6475a77503223d648b16463f07`；发布标识 `20261025T072312Z-5d98103-toaster-language`。应用 current 位于 `/opt/optional-reality/releases/`，静态 current 位于 `/var/www/muu-tech/releases/`，静态目录在标识后加 `-optional-reality-game`。三个域名已同步。

用户遇到“toaster增加弹性”被拒绝，“toaster增加弹力”被接受。修复前本次两次独立线上 API 调用和浏览器尝试均成功，未复现同一次拒绝；检查确认两句此前都依赖 AI，且 toaster 只有 spring_power，没有 restitution，因此不能把偶发误解当作必然的权限错误。

修复按明确对象理解口语弹射意图：常见两句本地稳定准备 spring-main 的 spring_power +1，更自由的表达由模型按相同原则处理，解释可见。通用表面弹性、明确数值、相对执行、权限与限幅保持原约定。

- 固定源码快照通过 7 个文件、131 项定向测试，类型检查与构建通过；未重复完整测试套件。覆盖两种原话、中英文变体、数值与相对执行、原子性、权限、发送／重试及模型提示契约。
- 临时服务真实 Gemini 接受两句原话，均返回 spring-main 的 spring_power +1。上线刷新后，浏览器两句均立即 Ready，未开始物理模拟。
- 备份：服务器 `/var/backups/optional-reality/20261025T072312Z-5d98103-toaster-language`；本地 `.localwork/deploy-20261025T072312Z-5d98103-toaster-language/backup`，归档 SHA256 两端一致，不含实际 `.env` 或证书私钥。
- 上一应用／静态标识为 `20261025T070356Z-0345847-start-rescue`。保留旧目录与哈希资源；持久配置、两份 key、路由和证书未变。临时 3118 服务已停止，正式服务 active，configured 为 true。

回退前确认 current 仍为本页标识，再成对原子切回上一应用／静态目录；重启后端并检查回环 3001 健康，只回退代码，不回退持久配置。工作区中后续关卡草稿未纳入此次发布。
