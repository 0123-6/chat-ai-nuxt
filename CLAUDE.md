# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Nuxt 4 的 AI 聊天应用前端，模仿豆包网站的交互体验。使用 TypeScript + Vue 3 组合式 API 开发。

## 常用命令

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 启动开发服务器（端口 4003，支持外部访问）
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 架构概览

### 核心技术栈
- **框架**: Nuxt 4.2.2 + Vue 3.5.26
- **UI**: Element Plus + Tailwind CSS v4
- **包管理**: pnpm（使用 npmmirror 镜像）

### 目录结构
```
app/
├── pages/chat/[[conversationId]].vue       # 主聊天页面（核心业务逻辑）
├── components/          # 可复用组件
├── composables/         # Vue 组合式函数
├── layouts/             # 布局组件
└── assets/css/          # 全局样式和 Tailwind 主题
```

### 关键数据结构
```typescript
// 聊天消息
interface IChat {
  question: string;
  streamingAnswer?: string;  // 流式分片拼接存储
}

// SSE 流式数据
interface IStreamData {
  code: number;
  msg: string;
  data: {
    conversationId: string;
    partialAnswer?: string;
  };
}
```

### 核心功能模块（app/pages/chat.vue）
- **SSE 流式处理**: 使用 fetch + ReadableStream 实时接收 AI 回答
- **Markdown 渲染**: marked + highlight.js（GitHub Dark 主题）
- **请求中止**: AbortController 支持停止正在进行的对话

### API 代理
开发环境下 `/api` 请求代理到 `http://localhost:8080`（配置于 nuxt.config.ts）

### 样式主题
全局主题变量定义在 `app/assets/css/index.css`:
```css
--color-primary: #3D6FE2
--color-error: #E34D59
--color-success: #3AC295
--color-warning: #F89741
```

### 组合式函数
- `useResetRef` / `useResetReactive`: 为响应式数据提供重置到初始状态的能力

## 注意事项

- 应用基础路径为 `/nuxt/`
- 禁用了 Tailwind preflight 以避免与 Element Plus 冲突
- 使用 dvw/dvh 替代 vw/vh 以适配移动端
