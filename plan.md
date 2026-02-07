# 待办
请修复以下bug,请注意网站同时支持pc端和移动端(宽度手机一般情况360px ~ 390px之间)
自动测试代码是否有bug(仅限这次新增的),并自动修复

2. historyStore.ts 放在 components/ 目录下

app/components/historyStore.ts 是状态管理逻辑，按 Nuxt 约定应放在 app/composables/ 下，这样也能享受 Nuxt
的自动导入。当前放在 components/ 里需要手动 import。

3. 聊天页面文件偏大（~665 行）

app/pages/chat/[[conversationId]].vue 承载了接口定义、SSE 流式处理、滚动控制、复制功能、Markdown
配置等所有逻辑。功能上没问题，但如果后续要加功能（比如代码块复制按钮、消息重试等），会越来越臃肿。

可以考虑拆分的方向：
- 接口类型 → types/chat.ts
- SSE 流式逻辑 → composables/useChat.ts
- 滚动控制 → composables/useAutoScroll.ts
- Markdown 配置 → utils/markdown.ts

5. marked 的 highlight 选项已废弃

当前用法：

marked.setOptions({
highlight: (code, lang) => { ... }
})

marked v12+ 已废弃 highlight 选项，推荐使用 marked-highlight 扩展。当前 marked 版本是
17.x，虽然可能还兼容，但控制台可能会有废弃警告。
6. 重复的 fetch 模式

项目中多处出现相同的 fetch 模式：

const response = await fetch('/api/...', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data),
})                                  
const result = await response.json()                                                                              
if (result.code === 200) { ... } else { ElMessage.error(result.msg) }

可以封装一个 request 工具函数减少重复代码，但当前调用量不多（大约 7-8 处），不封装也不影响维护。
