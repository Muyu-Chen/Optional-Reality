# Apache 介绍页部署

此文保留早期介绍页的部署与备份记录。当前九关游戏及 API 已上线，最新目录、版本、备份与回退以 [线上游戏记录](./live-game.md) 为准。

以下记录早期仅发布 `site/` 静态介绍页的流程；当时无需 Node 服务、模型密钥或构建步骤。现行游戏部署请使用上面的线上游戏记录。

## 两个目录与切换

- Muu Tech 原官网：`/var/www/muu-tech/releases/20261022-hero/`
- Optional Reality 介绍页：`/var/www/muu-tech/releases/20261024-optional-reality-intro-spring-rules/`
- Apache 80/443 的 DocumentRoot：`/var/www/muu-tech/current`

此前的中文介绍页保留在 `20261024-optional-reality-intro/`，首个基础英文版保留在 `20261024-optional-reality-intro-en/`。英文与动画基础版保留在 `20261024-optional-reality-intro-media/`，首屏保留淡色球与连续绿色虚线；当前左侧 GIF 展示悬空、加重力、吃星星、弹簧压缩与回弹、再次下落、反转重力后上升的完整实验。

两个站点保存在独立目录，通过 `current` **软链接**选择。目录不使用硬链接；切换时创建临时软链接，再用同目录 `mv -Tf` 原子替换。旧目录始终保留。

`switch-site.sh` 在服务器上由 root 执行，要求显式给出新目录和预期当前目录，检查配置及链接后才切换：

```bash
ssh -o BatchMode=yes -o User=root muuyyy \
  'bash -s -- /var/www/muu-tech/releases/20261024-optional-reality-intro-spring-rules /var/www/muu-tech/releases/20261022-hero' \
  < deploy/switch-site.sh
```

回滚到 Muu Tech（不需要解压或覆盖网页）：

```bash
ssh -o BatchMode=yes -o User=root muuyyy \
  'bash -s -- /var/www/muu-tech/releases/20261022-hero /var/www/muu-tech/releases/20261024-optional-reality-intro-spring-rules' \
  < deploy/switch-site.sh
```

脚本只切换链接；不修改 Apache 配置，无需 reload。`site/` 是唯一上传目录；部署文档、源码归档、密钥与备份不上传到 webroot。新 release 应为目录 755、文件 644，不在发布目录内编辑或构建。

## 备份与恢复

备份时间：2026-10-24 00:51:22 EDT（04:51:22 UTC）。

- 服务器：`/var/backups/muu-tech/20261024T045122Z/`
- 本地：`.localwork/backups/muu-tech-20261024T045122Z/`（已忽略，不提交）
- 原主页 SHA256：`bef4a9c2e874a8091f13d8b491b4fe41c3bbe7204ffac03b9d61e49b13d254d6`

服务器备份包含完整网站 `site.tar.gz`、逐文件校验清单、原 current 指向、两个 vhost 及摄像头 include 的 `apache-config.tar.gz`、配置校验清单、启用项与证书路径及权限记录。证书和私钥继续留在原位置，不复制私钥。

本地同时保留服务器备份和 `local-sources.tar.gz`，后者包含 RV1106 下的 `muu-tech/` 与 `seo-tools/`，包括 public、部署脚本、生成器、模板、主题和私有维护笔记。备份权限为目录 700、文件 600，不公开上传。

归档哈希及所有网站、配置、源码文件均已校验；网站已解压到本地 `restore-check/site/` 并逐文件复验。若原 release 损坏，应将 `site.tar.gz` 解压至新的恢复目录、恢复目录 755/文件 644、核对 `site-files.sha256`，再通过同一切换脚本选用恢复目录，不就地覆盖损坏版本。

## 路由与 SEO

- 新站只有根页面及页内锚点，没有 SPA 通配回退。
- 新站使用自己的标题、描述、canonical、robots 和单页 sitemap，不继承 Muu Tech 公司 schema。
- 原官网 `/zh/`、`/solutions/…`、`/projects/…` 等旧路径在新站返回真实 404；不会把失效页面伪装成 200 首页。完整页面和 SEO 保存在旧 release 与备份，回切即恢复。
- Apache 的 `/camera/` 隔离代理、TLS 证书、续期与 HTTP ACME challenge 例外均保留；不修改其他站点或服务。
- 介绍页的本站静态脚本只处理 GitHub 提示与动画暂停，不调用 API、不加载外部字体或资源，沿用现有严格 CSP。
- 以后上线真实应用时，应单独部署受管理的后端，再按需要添加 API 反代和最小 CSP 调整。

## 替换示意图

- 首屏斜坡图为 `site/index.html` 中的 SVG，重力标注和水平轨迹可直接编辑。
- 弹簧：`site/assets/gravity-spring-rules.gif` 与 `gravity-spring-rules-poster.png`。
- 轨道：`site/assets/orbit-experiment.gif` 与 `orbit-experiment-poster.png`。
- 保持 16:9 比例即可替换媒体；同时更新 HTML 中的说明与 alt 文本。图片和文案相互独立。
- GIF 是说明概念的循环示意，不是已经实现的交互模拟；页面保留这一说明。
- 动画可由按钮暂停；系统开启减少动态效果时默认使用静态图。
- 源生成器为 `scripts/generate-experiments.py`，需要 Pillow。`python3 scripts/generate-experiments.py --only spring` 只生成重力与弹簧 GIF（约 8.3 秒、138 个源帧）及静态首帧；`--only orbit` 只生成轨道 GIF。不需要在服务器安装 Python 或 Pillow。
- 重力与弹簧采用 240Hz 固定步长的一维质量–弹簧模型。脚本校验事件顺序、星星收集、弹簧压缩、首次回弹，以及重力反转后先减速再上升；镜头复位使用淡出淡入。右侧命令为 `add gravity` 和 `reverse the gravity`。
- GitHub 入口暂时显示提示：`The GitHub repository will be available after the hackathon ends.`；未来开放时再替换为实际链接。
- 修改静态资源后使用新版本文件名或内容哈希，避免浏览器继续使用旧缓存；发布到新的 release 后切换，不在当前目录内改文件。

当前文案明确由用户观察时机并应用准备好的简单指令；命令队列仅为原型开发计划，介绍页没有可执行队列或真实模型接口。

弹簧 GIF 中只将 `add gravity` 与 `reverse the gravity` 作为规则指令展示；压缩与回弹由画面表现，不写成用户需要发送的操作。
