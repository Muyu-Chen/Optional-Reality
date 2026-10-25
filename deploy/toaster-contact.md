# 面包机首次接触提示 — 2026-10-25

静态版本 `20261025T082400Z-toaster-contact-77f8ef2e-optional-reality-game`，在已发布的图解版本 `20261025T081305Z-bakery-guide-c1135fd1` 上叠加本轮固定修改；范围 SHA256 `77f8ef2e91ad31ed07fcb1227e739514a075a8893bbb67a1508b2324c86a3439`。

原提示只监听开始蓄力的事件，功率为 0 时没有事件，3-2 又清空了教程。现在接触检测独立发出事件，第 3 章三关均在首次接触时暂停、冻结倒计时和物理；功率未开启时提示发送 `Set toaster power to 2`，3-2 则解释面包机已经预设。发送规则不会自行恢复运动，Continue 才继续。普通重试记住已见教程，Replay teaching 可重置。只增加接触事件与提示，不改变机关力、弹射参数、关卡布局或权限。

独立发布快照通过 121 个 Vitest 文件、1232 项测试及 13 项 Node 测试，共 1245 项；类型检查和构建通过。新增集成从关闭进关图解、Start／仅启动输送带开始，验证三关到面包机才提示、未开机也提示、时间与位置冻结、暂停中发送不恢复及 Continue 后弹射；三关完整图解配置仍可三星。浏览器实际验证 3-1 不提前设置功率，首次接触后在暂停中开启面包机，Continue 后三星通关。线上另验证未开机接触提示。

生产 JS：`index-Bwi7hAXf.js`，CSS 保持 `index-BfalX5OE.css`。三个域名各 26 个静态文件共 78 项哈希匹配、关卡链接和 API 正常、旧哈希资源保留。应用链接仍为 `/opt/optional-reality/releases/20261025T073145Z-levels-25c46280`，API 路由仍为 3003。只原子替换静态链接，没有停止、重启或重载服务。原服务、3002 预检实例、3003 正式实例、Apache 的 PID 分别仍为 84030、83102、85100、34946，启动时间也不变。

服务器备份：`/var/backups/optional-reality/20261025T082400Z-toaster-contact-77f8ef2e/`，目录 700、文件 600。旧静态归档 SHA256 `71309d9f4045b2b4fb73d517715d65d22fe13f3a18b46d42512fedfef11a7c53`，与本地副本一致；新静态归档 SHA256 `8c61eede31a9a8cfcca7efc136c938a31241f85a2137da34241428175ea40c16`。固定源码、日志、清单与结果在忽略目录 `.localwork/deploy-toaster-contact-20261025T082400Z/`。

需要回退时，先确认没有后续发布，再仅替换静态链接：

```sh
set -eu
site_root=/var/www/muu-tech
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T082400Z-toaster-contact-77f8ef2e-optional-reality-game"
previous="$site_root/releases/20261025T081305Z-bakery-guide-c1135fd1-optional-reality-game"
test -f "$previous/demo/index.html"
ln -s "$previous" "$site_root/.rollback-contact-$$"
mv -Tf "$site_root/.rollback-contact-$$" "$site_root/current"
curl -fsS https://optionalreality.site/api/health
```
