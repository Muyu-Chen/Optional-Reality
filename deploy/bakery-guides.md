# 第 3 章说明 — 2026-10-25

静态版本 `20261025T081305Z-bakery-guide-c1135fd1-optional-reality-game`。在上一轮已发布的固定源码快照上，仅叠加本轮教程文件。范围 SHA256 `c1135fd18b6059abc8a221194c202ee17bf023b5edd1fe2a17cf2c4020726e1c`；未打包工作区其他待提交改动。

3-1 说明输送带／风扇预设、面包机功率、接触蓄力 0.6 秒及 Continue；3-2 说明橙色局部气流、发送时机和强弱对落点的影响；3-3 用四条自然语言规则串联输送、弹射、气流与门铃开闸。机器状态来自真实关卡，主动加载示例与队列共用。说明保持世界暂停，关闭保留草稿，暂停菜单可重看；长卡片从顶部展示，底部按钮固定可操作。

独立快照通过 121 个 Vitest 文件、1229 项测试及 13 项 Node 测试，共 1242 项；类型检查、生产构建通过。新增集成覆盖三课草稿保留、时间冻结、设置重看、显式加载及三星通关；完整路线包含门铃触发开闸。浏览器检查三关图解、蓄力教学，并按 3-3 图解载入四条规则实际三星通关。生产 JS 为 `index-7OlcrNnk.js`、CSS 为 `index-BfalX5OE.css`；保留原有大于 500 kB 构建提示。

仅更新 `/var/www/muu-tech/current`。应用链接仍为 `/opt/optional-reality/releases/20261025T073145Z-levels-25c46280`，API 仍在回环 3003。原服务、3002 预检实例、3003 正式实例、Apache 的 PID 分别保持 84030、83102、85100、34946，启动时间也未变。没有执行停止、重启或重载。切换前核对前后端链接与服务状态，复制旧静态目录保留旧哈希资源，再覆盖新构建、校验并原子切换。切换后连续检查三套 API；三个域名各 26 个公开文件共 78 项哈希一致，旧 JS 可访问，根目录与所有关卡直达链接、API 正常，私有路径 404。

服务器备份：`/var/backups/optional-reality/20261025T081305Z-bakery-guide-c1135fd1/`。旧静态归档 SHA256 `25523073c9ce3c6241b9754744edc3f2b86683cc15fc0a6af8acc9bee6961d35`，本地副本一致；目录 700、文件 600。新静态归档 SHA256 `9dfa099be21c7124eee2e57d172dab7e66cc9aeb9e53ccc35639fa265da1e051`。本地快照、日志、资源清单与校验证据在忽略目录 `.localwork/deploy-bakery-guide-20261025T081305Z/`。

如需回退，先确认 current 仍是本轮版本，再仅替换静态链接；后续已有发布时停止，避免覆盖他人更新。

```sh
set -eu
site_root=/var/www/muu-tech
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T081305Z-bakery-guide-c1135fd1-optional-reality-game"
previous="$site_root/releases/20261025T073145Z-levels-25c46280-optional-reality-game"
test -f "$previous/demo/index.html"
ln -s "$previous" "$site_root/.rollback-bakery-$$"
mv -Tf "$site_root/.rollback-bakery-$$" "$site_root/current"
curl -fsS https://optionalreality.site/api/health
```
