# Gemini / DeepSeek 缓存实测 — 2026-10-25

结论：本轮 DeepSeek 严格语义验收全部通过，Gemini 有三条额外局部覆盖；Gemini 首字和单条完整响应更快，但生成更多 token，11 条批量的完整等待反而略长。没有切换线上模型或修改游戏代码。

## 确认缓存命中后的结果

| 指标（中位数） | Gemini 3.1 Flash-Lite | DeepSeek Flash |
| --- | ---: | ---: |
| 严格语义验收 | 101 / 104 | 104 / 104 |
| 单条指令首字 TTFT | 0.752 秒 | 0.974 秒 |
| 单条完整响应 | 0.863 秒 | 1.170 秒 |
| 单条首字范围，8 次 | 0.707–0.958 秒 | 0.725–1.085 秒 |
| 单条输入缓存占比 | 2051 / 2304，89.0% | 2176 / 2393，90.9% |
| 11 条批量首字 | 0.775 秒 | 0.847 秒 |
| 11 条批量持续输出，估算 | 571 tokens/s | 364 tokens/s |
| 11 条批量完整响应 | 2.377 秒 | 2.037 秒 |
| 11 条批量输出长度 | 902 tokens | 431 tokens |

缓存比例为供应商实际返回的缓存 token 数除以其输入 token 数。单条两轮预热后测八次；批量为九关各十一条，一共九次请求。两家的 tokenizer 和输出格式不同，token 速度不等于完成同一任务的速度。

## 正确性：哪些没有通过

复用 `scripts/check-live-compiler.ts`：九关各 11 条基础操作，加设备限幅、命名表面和三条必须拒绝的非法/冲突指令，总计 104 条。验证共享 schema、权限与限幅后，逐条比较归一化操作，不能把 HTTP 200 当成语义通过。

Gemini 的三处失败均来自：`Make all the surfaces bouncy with a restitution of 0.8.`

- bounce：除了 world.restitution，还额外写入 bounce-floor.restitution。
- multi-bounce：额外写入 first-pad 和 second-pad 的局部 restitution。
- catch-cup：额外写入 launch-pad 和 cup-base 的局部 restitution。

预期仅修改 world.restitution。额外覆盖虽然可通过权限校验，但会使这些表面之后不再继承全局值，所以保留为严格失败。其余 101 条符合预期；DeepSeek 本轮 104 条全部符合预期。两家均正确拒绝瞬移、冲突方向和不存在的风扇。非显式缓存 Gemini 的另一轮也出现相同三处差异。

这属于单轮真实模型验收，不是生产准确率估计；八次重复单条方向指令两家均通过。项目自动测试主要使用模拟模型，本轮不是把 741 项自动测试各发给供应商。

## 缓存条件与线上区别

DeepSeek 使用当前生产请求的自动前缀缓存，读取 `usage.prompt_cache_hit_tokens`。其[官方缓存说明](https://api-docs.deepseek.com/guides/kv_cache/)描述了公共前缀匹配与命中统计。

Gemini 按当前兼容接口直接重复请求时，没有返回 cached_tokens；另用原生 API 重复三次，也未报告缓存 token。因此没有把这轮称为缓存命中。该轮单条中位数首字 0.677 秒、完整 0.776 秒，只作为对照，不能据此证明缓存改善或恶化。

随后临时创建仅含真实 COMPILER_SYSTEM 的显式缓存，TTL 为五分钟，不添加填充文本；兼容请求移除重复 system 消息并引用该缓存，实际返回 `prompt_tokens_details.cached_tokens=2051`。上表 Gemini 数据来自这轮确认命中的请求。接口方法参考 [Gemini 的 cached_content 兼容支持](https://ai.google.dev/gemini-api/docs/openai)；隐式缓存不保证每次命中，见[官方缓存说明](https://ai.google.dev/gemini-api/docs/caching)。

当前线上游戏仍使用原 Gemini 配置，没有接入这次临时显式缓存；没有复制、打印或更换任何 key。测试进程只读取服务器原有配置，缓存自动到期，正式服务始终保持 Gemini。

## 计时方法和限制

- 请求从同一线上服务器发出，单并发顺序测试。沿用生产提示词、场景数据、JSON 输出、temperature=0.1、max_tokens=4096；DeepSeek 禁用 thinking，Gemini 使用 minimal。测试临时改为 SSE，以观察首字；游戏正式请求仍是非流式。
- 测试基于固定线上版本 `9f4c2e8ec0fd368c54ac2b516fcd4180ada24659`，不包含同时进行的其他工作区改动。
- TTFT 为请求发出至首个非空 content 块；不把角色字段、HTTP 响应头或思考字段当首字。完整响应计时至流结束。
- 输出速度按 `(可见输出 tokens - 1) / (末个 content 时间 - 首个 content 时间)` 估算，不含首字前等待。Gemini 会合并多个 token 成块，短响应只有三个 content 块，因此其单条估算 840 tokens/s 易被分块放大；主表使用较长批量，减少首块偏差，仍不是逐 token 的硬件吞吐测量。
- 单条全程吞吐（包含首字等待）约为 Gemini 97、DeepSeek 32 tokens/s；这个指标受到输出长度与 tokenizer 影响，不用于直接评价生成器效率。实际游戏要等待完整 JSON 校验，玩家体验更接近完整响应列。
- 小样本只反映本次网络、负载和配置，不据此宣称缓存本身的因果提速。未修改提示词来让失败项通过，也未修改实际游戏请求方式。

逐请求计时、usage、归一化差异与测试脚本保存在被 Git 忽略的 `.localwork/model-benchmark/`。本报告保留可审查汇总；真实凭据始终留在服务器。

## 提示词修正后复测

本节是后续优化，前面的原始对比结果保持不变。

- 将表面作用域约定独立为 `server/src/compiler-surface-policy.ts`：全局弹性／摩擦只生成 world 操作，不能顺便写入单个表面的持久覆盖；明确命名单个表面时才生成局部操作，显式混合指令允许两种作用域。
- 补充未指定数值的方向加速度固定为 1 m/s²，不借用关卡当前值；“add acceleration”设置该分量，明确的翻倍、反转仍在执行时读取实际值。
- 最终缓存复测：Gemini 104/104，DeepSeek 104/104。中间一次测试暴露了两处把默认加速度读成当前值的问题，补充约定后通过；未放宽预期结果或增加自动纠错。
- 表面专项测试：Gemini 75/75，包括三种场景各三轮全局、局部、混合及相对指令，以及未知表面拒绝；该专项结果来自加入加速度补充前的作用域提示词。
- 后端现有测试 83/83，类型检查通过。真实模型仍存在输出波动，测试通过不代表任意表达都不会失败；运行时校验继续保留。

可用 `npx tsx scripts/check-surface-scope.ts` 重跑 75 条专项测试，读取当前环境的模型配置，报告写入被忽略的 `.localwork/surface-scope/report.json`。需要有效服务端凭据，会调用真实 API。
