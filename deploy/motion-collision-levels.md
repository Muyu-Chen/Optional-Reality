# 运动与碰撞十五关发布 — 2026-10-25

## 当前版本与服务

- 发布标识：`20261025T073145Z-levels-25c46280`。
- 固定基线：`290c4778d71bda9dc8faf91bcd2ad3bf13ed99af`；关卡范围 SHA256：`25c46280`（完整摘要见发布目录 RELEASE.json）。本次使用独立源码快照，未夹带工作区其他未提交改动。
- 应用：`/opt/optional-reality/releases/20261025T073145Z-levels-25c46280`。
- 静态：`/var/www/muu-tech/releases/20261025T073145Z-levels-25c46280-optional-reality-game`。
- 生产 API：`optional-reality-20261025T073145Z-levels-25c46280.service`，只监听 `127.0.0.1:3003`；Apache 的共享 `/api/` 代理已指向 3003。
- 原 `optional-reality.service` 继续监听回环 3001。切换前后 MainPID 均为 **84030**、启动时间相同；Apache 主进程均为 **34946**、启动时间相同。本次未执行 service stop/restart 或 kill。

新增 01.3–01.5、02.5–02.7，运动章五关、碰撞章七关、机关章三关，总计十五关、四十五颗星。布局、路线与容错见 [关卡扩充说明](../docs/motion-collision-expansion.md)。保留面包机口语指令修复、Start、扩大救援空间、AI 二次解释和 Gemini → DeepSeek 兜底。

## 发布流程与验证

先备份线上版本，再将前后端准备到新目录。新 API 使用独立 systemd unit 与端口，验证后才修改共享代理；Apache 执行 configtest 和 graceful，静态 current 使用同目录临时链接原子替换。旧应用、旧静态和原后端均保留，旧哈希资源复制到新静态目录供已打开的页面继续使用。

初次切换保护发现线上已被另一发布更新为 `5d98103-toaster-language`，因此没有覆盖；重新基于包含该修复的 `290c477` 制作快照并完成全套验证。初次预检实例 `optional-reality-20261025T072020Z-levels-f7d2cdc5.service` 在回环 3002 保留运行，没有接收生产流量。

- 独立快照：120 个 Vitest 文件、1220 项测试，另加 13 项首页 Node 测试，共 **1233 项通过**。类型检查与构建通过；保留既有 JS 单块超过 500 kB 的提示。
- 十五关满星模拟、新六关时机/强度窗口与失败、六个 React/Matter 队列/Start/重试/成绩/Next level 场景通过。
- 切流前与公网各验证六个新关的真实模型请求，并回归 `toaster增加弹性` → `spring-main.spring_power +1`。比较实际加速度、每个场景表面的有效材质与机关状态，允许单一表面的等效目标表达。
- 三个域名各 26 个资源，共 78 个 SHA256 均与固定构建一致；根目录、全部新关深链接、选关、介绍页和旧 demo 正常。API health/configured 正常，旧哈希资源保留，私有/未知路径为 404。
- 实际切换期间 24/24 次公网健康采样返回 HTTP 200、ok=true；原服务 MainPID 与启动时间比较通过。
- 公网浏览器确认 45 星、碰撞七关；实际发送 Bank Shot 规则后获 3/3，结算下一关为 Return to Dock。
- 持久 `.env`、原服务单元和证书逐字节保持不变，未下载密钥或私钥。未修改其他站点或代理。

## 备份与校验

- 服务器：`/var/backups/optional-reality/20261025T073145Z-levels-25c46280/`。
- 本地：`.localwork/deploy-levels-20261025T073145Z/backup/`，目录 700、归档 600；站点、排除 .env/依赖的应用源码、路由配置三份归档两端校验一致。
- 发布包 SHA256：`9a50169a0ef43f540a186451cc711d5d2c56e523bfbcd12a428c4c2343580cea`。
- 现场测试、资源、API、连续健康和服务状态证据位于同一忽略目录；服务器归档包含当前链接、原服务切换前后状态和受保护文件摘要。

## 无停止服务回退

此流程只切回旧链接与代理，保留所有运行中的 API。先确认没有后续发布；原后端回环 3001 必须仍健康。后续维护当前生产 API 应针对上述新 unit，不要把原 unit 的重启当作更新当前生产 API。

```sh
set -eu
id=20261025T073145Z-levels-25c46280
old=20261025T072312Z-5d98103-toaster-language
app_root=/opt/optional-reality
web_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/$id"
test "$(readlink -f "$web_root/current")" = "$web_root/releases/$id-optional-reality-game"
curl -fsS http://127.0.0.1:3001/api/health
cp "/var/backups/optional-reality/$id/optional-reality-game.conf" /etc/apache2/.levels-route-rollback-$$
chmod 644 /etc/apache2/.levels-route-rollback-$$
mv -Tf /etc/apache2/.levels-route-rollback-$$ /etc/apache2/optional-reality-game.conf
apache2ctl configtest
ln -s "$app_root/releases/$old" "$app_root/.levels-rollback-$$"
mv -Tf "$app_root/.levels-rollback-$$" "$app_root/current"
ln -s "$web_root/releases/$old-optional-reality-game" "$web_root/.levels-rollback-$$"
mv -Tf "$web_root/.levels-rollback-$$" "$web_root/current"
apache2ctl graceful
curl -fsS https://optionalreality.site/api/health
```
