# 手机介绍页与二维码 — 2026-10-25

静态版本：`20261025T111302Z-mobile-intro-7d173ddb-optional-reality-game`。入口仍为 **https://optionalreality.site/intro**；根目录游戏和 `/showcase/` 保持原地址。修改范围是介绍 HTML、sitemap 和新增 `assets/intro-20261025/`，未重新构建或替换线上的游戏 bundle。

介绍页替换旧九关／规划中沙盒文案，展示目前十五关：五个运动、七个碰撞、三个机关，合计四十五颗星。页面包含品牌图示、47 秒实机循环视频、自动输入展示、玩法步骤、三章概览、AI 在玩法中的作用、FAQ、GitHub／AI 说明和扫码分享。英语／中文随浏览器语言选择，支持手动切换、持久记忆及显式 `?lang=en`／`?lang=zh`。

手机端隐藏电脑游戏入口，明确手机用于介绍、演示与分享，实际关卡需要键盘鼠标。内联静音视频支持字幕、全屏和章节跳转，在离开可视区域／后台时暂停；减少动态效果设置关闭装饰动画和自动播放。视频可见时，底部 Watch 按钮退出视图，不遮挡视频操作。页面使用自托管资源，CSP 不允许内联脚本或样式，不加载物理世界或调用模型 API。

二维码统一编码 `https://optionalreality.site/intro`，纠错 H、六模块留白、方形深绿模块，无外部二维码服务。公开文件：

- `/assets/intro-20261025/intro-qr.png`：900 × 900；同名 SVG 为矢量版。
- `/assets/intro-20261025/scan-card.png`：1440 × 1920；同名 SVG 为矢量分享卡。
- `/assets/intro-20261025/social-card.png`：1200 × 630，用于链接预览。

原有标题六个 ImageGen 精灵按字节复用，未新增生成式图片；二维码和分享卡由代码精确绘制。来源和二维码再生方式见 [设计与分享说明](../docs/mobile-introduction.md)。

## 验证与发布

- 浏览器检查桌面及 320／375／390／430 px 手机布局，无横向溢出；中英切换、手机游戏入口隐藏、45 px 底部主操作、视频内联播放、字幕、章节跳转、复制链接、按钮避让和减少动态效果通过。临时视口和媒体覆盖恢复。
- QR、分享卡和社交图均用 OpenCV 解码回固定 URL；单独二维码缩小为 180／225／300 px、整张分享卡缩为 320／360／480 px 宽度仍可解码。三个域名下载九张公开图片再次解码通过。这不是实际摄像头或所有打印条件的保证。
- 88 个翻译键覆盖、HTML 本地资源、唯一 ID／单个 H1、SVG／sitemap XML、Python／JS 语法检查通过；13 项既有介绍动画测试和生产构建通过。浏览器 warning/error 为空。
- 三个域名各 49 个资源，共 147 个 SHA256 与固定快照一致；旧哈希资源、根目录游戏、所有原关卡直达链接、视频、API 正常，私有路径 404。
- 复制旧静态目录后覆盖本轮 16 个文件，哈希校验及版本保护通过才原子切换 current。持久配置、证书、Apache 路由、应用链接均未修改。原服务、3002 预检、3003 正式服务、Apache 的 PID 分别保持 84030、83102、85100、34946，启动时间不变；没有停止、重启或重载。

应用仍为 `/opt/optional-reality/releases/20261025T073145Z-levels-25c46280`，生产 API 仍为回环 3003。

服务器备份：`/var/backups/optional-reality/20261025T111302Z-mobile-intro-7d173ddb/`，目录 700、文件 600。旧静态归档 SHA256 `9ce6553357a12f34a11d599c02fbd56bbd4ed3d93730ac647301b7fd484694aa`，本地副本一致；本轮文件归档 SHA256 `d0c52af0b74f23a92619188257aaa56f761e82665966e1478f72713461a07e9a`。清单、源码快照、服务状态和公网校验位于忽略目录 `.localwork/deploy-mobile-intro-20261025T111302Z/`，浏览器和二维码检查位于 `.localwork/mobile-intro-20261025/`。

如需回退，先确认没有后续发布，再仅替换静态链接：

```sh
set -eu
site_root=/var/www/muu-tech
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T111302Z-mobile-intro-7d173ddb-optional-reality-game"
previous="$site_root/releases/20261025T104814Z-demo-video-6d6a3614-optional-reality-game"
test -f "$previous/index.html"
ln -s "$previous" "$site_root/.rollback-mobile-intro-$$"
mv -Tf "$site_root/.rollback-mobile-intro-$$" "$site_root/current"
curl -fsS https://optionalreality.site/api/health
```
