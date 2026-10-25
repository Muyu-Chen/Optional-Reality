# 循环演示视频 — 2026-10-25

- 静态版本：`20261025T104814Z-demo-video-6d6a3614-optional-reality-game`。
- 播放入口：[optionalreality.site/showcase/](https://optionalreality.site/showcase/)。三个现有域名共用同一静态目录。
- MP4：46.833333 秒、1280×720、30 fps、H.264、无音轨、fast-start；约 2.6 MiB。
- GIF：640×360、8 fps、无限循环，约 3.0 MiB。另含海报、中英字幕、章节跳转、重新播放、全屏和下载入口。

浏览器录制使用实际的 `149dd96` 关卡源码。正常界面逐字输入，依次完成 Bring It Back、Bank Shot、A Little Stored Energy 三关，各得 3/3；未修改物体、速度、时间步长、权限或评分。素材本身不是生成式 AI 视频。录像中的明确指令采用本地解析，不能作为真实模型响应或延迟证明。完整说明见 [视频文档](../site/showcase/README.md) 和 [AI 使用说明](../AI_USAGE.md)。

FFmpeg 保留浏览器捕获时间，添加交叉淡化及同一标题开头／结尾。完整解码通过；1405 帧，首末 RGB 像素平均差约 0.585/255，仅为有损编码差异。浏览器验证静音自动播放、自然循环回到开头、章节跳转、中文字幕与无媒体错误；播放器尊重减少动态效果设置。构建、Python 和播放器 JavaScript 语法检查通过。

本次只复制上一静态目录并增加 `showcase/` 的九个公开文件，再校验并原子切换 current；旧游戏 HTML、JS 和资源保持原字节。三个域名各校验 35 个资源，共 105 个哈希，旧哈希资源可用、全部游戏直达链接和 API 正常、私有路径 404。MP4 类型为 `video/mp4`，支持 HTTP Range 部分请求。

应用链接仍为 `/opt/optional-reality/releases/20261025T073145Z-levels-25c46280`，API 路由保持回环 3003。原服务、3002 预检实例、3003 正式实例、Apache 的 PID 分别保持 84030、83102、85100、34946，启动时间也不变。没有停止、重启或重载服务，没有修改持久配置或证书。

服务器备份：`/var/backups/optional-reality/20261025T104814Z-demo-video-6d6a3614/`，目录 700、文件 600；旧静态归档 SHA256 `c7acba17b59ddd70669ea031f63a8bd0a28d2d65187d272349f4ec68eb2a1867`，本地副本一致。新增文件归档 SHA256 `c49650a7504a6c26b70ae6cd73aeef8b3efec93e86f3187511c066c2c4dda671`。源码快照、清单、服务状态和公网校验在忽略目录 `.localwork/deploy-demo-video-20261025T104814Z/`；原始录制帧和编辑检查在 `.localwork/demo-video-20261025/`。

需要回退时，先确认没有后续发布，再仅替换静态链接：

```sh
set -eu
site_root=/var/www/muu-tech
test "$(readlink -f "$site_root/current")" = "$site_root/releases/20261025T104814Z-demo-video-6d6a3614-optional-reality-game"
previous="$site_root/releases/20261025T082400Z-toaster-contact-77f8ef2e-optional-reality-game"
test -f "$previous/demo/index.html"
ln -s "$previous" "$site_root/.rollback-showcase-$$"
mv -Tf "$site_root/.rollback-showcase-$$" "$site_root/current"
curl -fsS https://optionalreality.site/api/health
```
