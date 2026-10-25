# 三域名、单 SAN 证书与游戏入口

2026-10-25 已生效。三个域名都访问同一个游戏与 API：

- `https://optionalreality.site/`
- `https://www.optionalreality.site/`
- `https://muuyyy.cfd/`

## 路由

| 路径 | 内容 |
| --- | --- |
| `/`、`/?level=...`、`/?view=levels` | 游戏开始页、关卡、选关；URL 保持根路径 |
| `/intro`、`/intro/` | 介绍页；canonical 为 `https://optionalreality.site/intro` |
| `/demo/` | 保留原游戏入口与旧链接 |
| `/demo/assets/`、`/assets/` | 原游戏和介绍资源 |
| `/api/` | 本站同源代理至 `127.0.0.1:3003`；原 3001 服务保留运行，见 [十五关发布](./motion-collision-levels.md) |

HTTP 跳转到同一域名的 HTTPS，保留路径与查询；ACME HTTP-01 例外保留。未知路径继续 404，无全路径 SPA 回退。根页面通过内部 rewrite 读取现有 `/demo/index.html`，Vite 资源 base 继续使用 `/demo/`。介绍页仍存于 `site/index.html`，由 Apache Alias 映射到 `/intro`；它的 Play now 指向根目录。

源配置位于 [apache/](./apache/)：`muu-tech.conf` 管理 HTTP，`optional-reality-ssl.conf` 管理两个新域名，`optional-reality-game.conf` 是两个 HTTPS vhost 共用的路由和游戏 CSP。原 `muu-tech-ssl.conf` 保留，其摄像头代理仍只包含在原域名 vhost。新域名不继承摄像头代理。

## 一张证书

沿用唯一的 Certbot lineage `muuyyy.cfd`，扩展为三个 SAN：`muuyyy.cfd`、`optionalreality.site`、`www.optionalreality.site`。两个 HTTPS vhost 引用相同的 `/etc/letsencrypt/live/muuyyy.cfd/fullchain.pem` 与 `privkey.pem`，没有新增第二张独立证书。签发后有效期至 2027-01-22 22:39（纽约时间）。

既有 Certbot 账户和 webroot 验证用于扩展：

```sh
certbot certonly --webroot -w /var/www/muu-tech/current \
  --cert-name muuyyy.cfd --expand \
  -d muuyyy.cfd -d optionalreality.site -d www.optionalreality.site \
  --non-interactive
```

`certbot.timer` 已启用并运行。三个域名均使用上述 current webroot，续期完成后原 deploy hook 检查 Apache 配置并 reload。实际续期演练已通过：

```sh
certbot renew --cert-name muuyyy.cfd --dry-run \
  --non-interactive --no-random-sleep-on-renew
```

取消随机延时仅用于这次手工演练；正常 timer 配置未改变。证书私钥和模型密钥均未下载或写入仓库。

## 发布与备份

此次只切换网站路由与介绍页链接，没有发布新的游戏代码或重启模型服务。应用仍为 `9f4c2e8`，应用 current 仍是 `/opt/optional-reality/releases/20261025T040224Z-9f4c2e8`。

- 新静态 current：`/var/www/muu-tech/releases/20261025T043627Z-domains-optional-reality-game`
- 原静态目录保留：`/var/www/muu-tech/releases/20261025T040224Z-9f4c2e8-optional-reality-game`
- 服务器备份：`/var/backups/optional-reality/20261025T043627Z-domains/`
- 本地备份：`.localwork/domain-routing-20261025T043627Z/`，已忽略，目录 700、归档 600
- 网站归档 SHA256：`f94f48c95d68f45bdb3a9e50b28651ac455b9d426fd52d7932dbf126c5a06763`
- 路由配置归档 SHA256：`91771202d5cbb9f7e864a0a6b1b99c519f682dcf7a7a0911591fe50751e450b1`

两份归档已下载并逐字节校验；配置归档只含相关 Apache 配置、原续期说明与 hook，不含私钥。服务端比较确认 `/etc/optional-reality/.env` 未改动，原 Gemini 与 DeepSeek 配置保留。

回退路由时先核对 current，恢复归档内原 `muu-tech.conf` 与 `optional-reality-game.conf`，禁用新建的 `optional-reality-ssl` vhost，配置检查通过后原子切回原静态目录并 reload Apache。**不回退证书或续期配置**；扩展后的唯一证书继续覆盖三个域名。不要整包解压路由配置归档覆盖 `/etc`。

## 实际验证

- 三域名正常验证证书链、域名与 TLS 1.3，证书 DER SHA256 均为 `f29ed7c942a4ed5828ec8665b6a9402468b0c31636cec5540470d04210a578d7`。
- 三域名根页面、关卡查询、选关、介绍页、旧 demo、health 与 status 全部 200；未知路径、`.env` 和服务端源文件为 404。
- 每个域名八个 HTML 直接引用资源均正常；根游戏页面 SHA256 保持 `76a27f1f5df6f916d2de88768390017876b5471e96751cfd7b6efd9a0b6210e2`，介绍页为 `c5af6a704b79ed08bdc1661f565deb1674d0b410f07909c53db0614784893aee`。
- 同源编译通过请求入口验证，不相关 Origin 仍为 403。浏览器在新域名根路径完成标题→选关→bounce，真实 Gemini 准备并执行向上加速度 2，位置仍为 `/?level=bounce`。
- Apache configtest 和单证书的三个域名续期演练通过；介绍页动画 13 项检查通过。没有改动物理、评分与模型配置。
