# 逐条编译结果

批量准备返回每条消息的独立结果。合法消息进入 Ready，失败消息只在对应行显示 Needs editing；玩家可编辑、删除该行，也可直接发送其他 Ready 消息。解析本身不修改物理世界，不产生成功字幕。

## 协议与失败边界

携带 `X-Compiler-Protocol: per-message-v1` 的 `POST /api/compile` 在响应身份可确认时返回 HTTP 200，即使部分或全部消息被拒绝。请求 ID、关卡、场景版本、队列版本和消息 ID 顺序完整保留。每条结果是以下两种之一：

```json
{
  "messages": [
    {"id": "a", "operations": [{"type": "set_property", "target": "world", "property": "acceleration_y", "value": 1}]},
    {"id": "b", "operations": [], "error": "The ball color cannot be changed."},
    {"id": "c", "operations": [{"type": "set_property", "target": "world", "property": "restitution", "value": 0.9}]}
  ]
}
```

示例省略顶层身份字段。成功项保留可选 understoodAs 与 adjustments；失败项必须有非空 error 和空 operations，不能夹带可执行操作。既有成功项的格式不变。

单条错误包括模型明确拒绝、空/非法操作、未知或受保护目标、无效传感器、非有限值，以及同一消息中有不支持的意图。该条所有操作均丢弃，后续按之前成功消息的预览状态继续校验；失败行不会留下部分属性修改或触发器。有限越界值仍限幅，保留相对规则供实际 Send now 时读取当前状态。

网络/供应商失败、无效 JSON、顶层结构损坏、缺失/重复/错位的消息 ID 仍属于整份响应错误。客户端只将本次待解析草稿标错，已有 Ready 消息保留；过期请求的成功或错误都不能合并到新队列。

## 模块分工

- `shared/compilation-message.ts`：单条模型/公开结果 schema、限幅、权限检查与整条回滚；前后端共用操作检查。
- `shared/compiler.ts`：请求和响应协议、整份响应的身份检查、逐条编译组合。
- `client/src/domain/compilation-results.ts`：前端独立复核、按 ID 合并 Ready/error、清除失败行旧操作与旧纠错信息。
- `usePreparedMessages`：只协调网络、取消与会话状态；Shift+Enter 仅在当前 ID 真正 Ready 时调用发送。

失败行不自动重试。编辑该行仅准备新的草稿，其他合法结果可复用；Try again 恢复已准备操作，保留失败行的非可执行状态。多选发送仅选 Ready 消息，执行前仍整批校验，不能因本次编译改动而放松发送约束。

新版前端显式发送协议标记；旧页面不带标记时，含失败项的结果转为 HTTP 422 `{error}`，避免旧 schema 把空 operations 和 error 字段显示为原始 Zod 异常。全成功保持旧格式。此兼容补丁已随 [API 兜底](../deploy/api-fallback.md) 成对发布；此前逐条结果的浏览器验收使用真实 HTTP/React/Matter 与本地模拟模型，固定提交、测试总数与截图见 [验收记录](./verification.md)。
