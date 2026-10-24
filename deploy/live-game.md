# 线上游戏 — 2026-10-24

## 当前八关版本

- 地址：https://muuyyy.cfd/demo/；八个关卡，新增 02.2 多次反弹、02.3 摩擦跑道、02.4 接球杯。
- 应用版本：`c103fad12d8489c0a8ad13201cf64a1af92f0e9f`，包含新增关卡及共享物理规则、指令纠正和数值限幅修正。
- 发布目录：`20261024T231848Z-c103fad`，时间标识为 UTC。独立源码目录重新 `npm ci`，340 项测试、类型检查、生产构建通过。
- 应用 current：`/opt/optional-reality/releases/20261024T231848Z-c103fad`。
- 静态 current：`/var/www/muu-tech/releases/20261024T231848Z-c103fad-optional-reality-game`。
- 前后端更新为同一版本，服务器使用原 Node.js 24.22.1 与 systemd 服务。持久 `.env` 及 API 密钥保留，不复制开发机配置。线上 `configured:true`。
- 前端页面 SHA256：`7cefea534ac28567c91f87d0e072381f908ec95a7caa3907701811c1f5f64650`，JS 为 `index-CG4FDoOk.js`；公网文件与本地构建逐字节一致。
- 沿用原首页，只把五关文案改为八关；保留旧哈希资源，使已打开页面仍能加载资源。Apache、TLS 与 camera 代理配置未改。
- 公网复查：多次反弹、摩擦跑道实际通关与 Next level 衔接成功；接球杯加载正常，真实 API 将自然语言编译为 cup-base restitution=0，执行后杯底值更新。服务器预发布服务也完成同一新关卡的真实模型调用。
- 正式服务健康检查通过；预发布临时服务已停止。截图与构建校验结果保存在忽略目录 `.localwork/deploy-next/`。

### 本次备份

- 服务器：`/var/backups/optional-reality/20261024T231848Z-c103fad/`。
- 本地：`.localwork/backups/game-20261024T231848Z-c103fad/`，目录 700、文件 600，已忽略。
- `site.tar.gz` SHA256：`c726496a66e767d0cd348c4c12f3ffbe5fe7eb695dc4bdee9db72daf6cd2c22d`。
- `app-source.tar.gz` SHA256：`8511042f1eea2cd5e4140a2cf01a4c33aff302849725c142988cbc45a93e3e84`。
- 包含旧目录指向与服务单元记录；源码归档排除 `.env` 和依赖。服务器与本地归档校验均通过，旧 release 与已安装依赖原样保留。

### 回退到五关版

先核对两个 current 仍指向上面的八关目录，避免覆盖后续发布。应用与静态目录需一起回退；原服务与 Apache 配置保持不变，持久 `.env` 不回退。

```sh
# 在服务器上以 root 执行；保留所有新旧 release
set -eu
app_root=/opt/optional-reality
site_root=/var/www/muu-tech
test "$(readlink -f "$app_root/current")" = "$app_root/releases/20261024T231848Z-c103fad" || exit 1
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261024T231848Z-c103fad-optional-reality-game" || exit 1
apache2ctl configtest || exit 1
ln -s "$app_root/releases/20261024T224908Z-d29fa43" "$app_root/.rollback-app-$$"
mv -Tf "$app_root/.rollback-app-$$" "$app_root/current"
systemctl restart optional-reality
curl -fsS --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:3001/api/status || exit 1
ln -s "$site_root/releases/20261024T224908Z-optional-reality-game" "$site_root/.rollback-web-$$"
mv -Tf "$site_root/.rollback-web-$$" "$site_root/current"
curl -fsS https://muuyyy.cfd/api/status
```

## 首次五关上线记录（保留）

- 首页：https://muuyyy.cfd/，导航与首屏提供 **Play demo now**，进入 `/demo/`。
- 游戏：https://muuyyy.cfd/demo/；本次发布 `d29fa436fd6282b566e2130cd238712ed4263533` 的五关版本，加首页入口修改。开发中的新增关卡未包含在本次发布中。
- 构建在独立目录完成：219 项测试、类型检查与生产构建通过。线上实际检查首页跳转、游戏绘制、准备队列、发送与下一条补位。

### 服务器路径

- SSH：`ssh -o User=root muuyyy`
- 应用：`/opt/optional-reality/current` → `/opt/optional-reality/releases/20261024T224908Z-d29fa43`
- Apache 静态目录：`/var/www/muu-tech/current` → `/var/www/muu-tech/releases/20261024T224908Z-optional-reality-game`
- 持久配置：`/etc/optional-reality/.env`，从 `.env.example` 复制，`AI_API_KEY` 留空，`APP_ORIGIN=https://muuyyy.cfd`。
- 服务：`optional-reality.service`，以独立用户运行，仅监听 `127.0.0.1:3001`。填写密钥后执行 `systemctl restart optional-reality`。
- API：Apache 的 `/api/` 反代到上述服务；游戏 `/demo/` 的 CSP 允许同源连接。
- Node：独立安装的官方 Node.js 24.22.1 Linux x64，下载包已核对官方 SHA256。

密钥文件为 `root:optional-reality`、640 权限，位于 webroot 之外。应用 release 内 `.env` 链接到持久配置。网站 `.env` 与服务端源码路径均返回 404。没有复制开发机的真实 `.env`。

### 备份与回切

切换前备份：`/var/backups/optional-reality/20261024T224908Z/`，包含原站点归档、Apache 配置归档及原 SSL 配置。原静态 release 保留。

仅回切介绍页可沿用 `switch-site.sh`，新目录为 `/var/www/muu-tech/releases/20261024-optional-reality-intro-spring-rules`，预期当前目录为本次游戏静态目录。若同时撤销 API，恢复备份中的 `muu-tech-ssl.conf`，运行 `apache2ctl configtest` 后 reload Apache，并停止 `optional-reality` 服务。

配置健康检查：`curl -fsS https://muuyyy.cfd/api/status`。未填密钥时应为 `configured:false`，本地简单指令仍可游玩；填好密钥并重启后为 `configured:true`。本次未测试真实模型调用。
