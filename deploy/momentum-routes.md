# 惯性与连续碰撞二十一关发布 — 2026-10-25

版本 `20261025T112914Z-momentum-7e25a3e0`，固定基线 `970568a`。运动章新增 01.6–01.8，碰撞章新增 02.8–02.10，现共 21 关、63 颗星。玩法和时机窗口见 [关卡设计](../docs/momentum-routes.md)。旧关 ID、成绩与草稿键、面包机接触提示、英文默认介绍页、手机分享及演示视频保留。

应用目录为 `/opt/optional-reality/releases/20261025T112914Z-momentum-7e25a3e0`；静态目录为 `/var/www/muu-tech/releases/20261025T112914Z-momentum-7e25a3e0-optional-reality-game`。生产 API 为新建的 `optional-reality-20261025T112914Z-momentum-7e25a3e0.service`，仅监听回环 3004。旧 3001、3002、3003 实例均保留。Apache 仅 graceful 切换共享代理，前后端 current 原子替换；没有停止、重启或 kill 任何现有服务。

发布前后，原服务、3002 预检实例、3003 上一生产实例及 Apache 的 MainPID 分别保持 84030、83102、85100、34946，启动时间相同。新实例 MainPID 为 90509。持久 `.env` 内容未变，没有下载密钥。旧哈希资源复制进新静态目录，旧页面可以继续加载其资源。

## 固定快照与验证

仅将本轮关卡、注册、场景、测试、文档及介绍页数量更新叠加到基线。两个介绍页文件保留已经发布的英文默认修复。工作区并行进行的 canvas-lab、起始状态提示修改未混入本轮快照。

最终范围 SHA256 为 `d3102574d05659837277692b6cc3839ef2b0b2e470abf9eb4d5bd1da34253b44`。候选实例预检后同步了分享卡与社交预览的 21 关数字；补丁只含生成脚本、三张图及清单，完整源码／静态哈希在切流前重新校验。运行包 SHA256 为 `d590f26727eb8c50d9ea3ec3e3aa268e3628b35394a2ab7d816d142449d42fa1`，记录与固定源码在 `.localwork/deploy-momentum-20261025T112914Z/`。

- 独立快照 122 个 Vitest 文件、1346 项测试，另加 13 项 Node 测试，共 **1359 项通过**；类型检查、构建通过，保留原有 JS 单块大于 500 kB 提示。
- 全部 21 关都有真实物理三星路线。新运动关与断桥关各五个发送位置均可三星；双斜板三种弹性均发生两次反射且满星；屋顶路线验证三块表面实际碰撞。新六关 React/Matter 集成覆盖队列、Start、重试草稿、成绩及下一关。
- 新六关和面包机口语回归在候选 API 与公网各验证七条真实请求，比较实际规则状态及每块表面有效材质。
- 三个域名各 50 个资源，共 **150 个 SHA256** 匹配；新关直达、根目录、选关、介绍页、API 与旧哈希资源正常；私有／未知路径 404。
- 介绍页与分享卡同步 21 关、63 星；三张扫码图片均解码到原介绍页地址，小尺寸二维码回归通过。
- 浏览器检查六关画面，调整两颗星的位置避免遮挡标签；本地屋顶关和公网双斜板关实际三星通关，线上选关确认 Motion 8、Collisions 10、Devices 3，旧成绩仍在。

## 备份与无停止回退

服务器备份 `/var/backups/optional-reality/20261025T112914Z-momentum-7e25a3e0/`，本地副本在发布目录 `backup/`；目录 700、文件 600。旧静态归档 SHA256 `a00404392b22ad62dfeb1eaa1ada06b8799700545d5f64acbf26645f9640da9d`，排除 `.env` 与依赖的旧源码归档 SHA256 `d19fa7c5300d9118e2fd401bc496fd47f2672da72c94e7f9064a6953eeaf7316`，本地与服务器一致；另有旧代理配置及服务状态。

回退先确认没有后续发布，并确认回环 3003 旧实例健康。只恢复链接和代理，全部 API 实例继续运行：

```sh
set -eu
id=20261025T112914Z-momentum-7e25a3e0
app_root=/opt/optional-reality
web_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/$id"
test "$(readlink -f "$web_root/current")" = "$web_root/releases/$id-optional-reality-game"
curl -fsS http://127.0.0.1:3003/api/health
cp "/var/backups/optional-reality/$id/optional-reality-game.conf" /etc/apache2/.momentum-rollback.conf
chmod 644 /etc/apache2/.momentum-rollback.conf
mv -Tf /etc/apache2/.momentum-rollback.conf /etc/apache2/optional-reality-game.conf
apache2ctl configtest
ln -s "$app_root/releases/20261025T073145Z-levels-25c46280" "$app_root/.rollback-momentum"
mv -Tf "$app_root/.rollback-momentum" "$app_root/current"
apache2ctl graceful
ln -s "$web_root/releases/20261025T112324Z-english-default-cf78da3b-optional-reality-game" "$web_root/.rollback-momentum"
mv -Tf "$web_root/.rollback-momentum" "$web_root/current"
curl -fsS https://optionalreality.site/api/health
```
