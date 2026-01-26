<script setup lang="ts">
import hljs from "highlight.js";
import { marked } from "marked";

interface IChat {
  question: string;
  // 流式分片拼接存储，实现实时打字机效果
  streamingAnswer?: string;
}
interface IProps {
  id?: string,
}
interface IResponseData {
  // 正常情况下为200
  code: number
  // 描述信息
  msg?: string
  message?: string
  // 真正的数据
  data: Record<string, any>
}
// 流式数据结构（对应后端SSE推送格式）
interface IStreamData {
  code: number;
  msg: string;
  data: {
    id: string;
    partialAnswer?: string;
  };
}

const props = defineProps<IProps>()

const fullHelpContent = '有什么我能帮你的吗？'
const helpContent = ref<string>('')
let timer: any
let helpContentIndex = 0
onMounted(() => {
  timer = setInterval(() => {
    helpContent.value = fullHelpContent.slice(0, helpContentIndex+1)
    helpContentIndex++
    if (helpContentIndex === fullHelpContent.length) {
      clearInterval(timer)
      timer = undefined
    }
  }, 40)
})


const historyChatList = [
  'Nuxt4引入SVG方式',
  'Vue React UI库推荐',
  '微前端2025现状分析',
  '多个子网站运行方式多个子网站运行方式',
  'Nuxt4引入SVG方式',
]


const question = ref<string>('')
const clickSend = () => {
  // 没有内容,直接退出
  if (!question.value.trim()) {
    return
  }

  closeSSEConnection()
  chatList.value.push({
    question: question.value.trim(),
    streamingAnswer: '',
  })
  question.value = ''
  fetchQuestionWithSSE()
}
const [isFetching, resetIsFetching] = useResetRef((): boolean => false)
const [chatList, resetChatList] = useResetRef((): IChat[] => [])
// 关闭SSE连接（统一管理，避免内存泄漏）
const closeSSEConnection = () => {
  fetchQuestionAbortController?.abort?.()
  isFetching.value = false
};

const clickHint = (newQuestion: string) => {
  closeSSEConnection();
  chatList.value.push({
    question: newQuestion,
    streamingAnswer: '', // 初始化流式回答
  })
  fetchQuestionWithSSE()
}
const clickNewChat = () => {
  closeSSEConnection();
  resetChatList();
}

let fetchQuestionAbortController: AbortController
const fetchQuestionWithSSE = async () => {
  if (!chatList.value.length) return;
  const lastChat = chatList.value.at(-1)!;
  if (!lastChat.question) return;

  closeSSEConnection();
  lastChat.streamingAnswer = '';
  isFetching.value = true
  fetchQuestionAbortController = new AbortController()

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: props.id,
        question: lastChat.question,
      }),
      signal: fetchQuestionAbortController.signal,
    });

    if (!response.ok || !response.body) throw new Error('请求失败');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    // 循环读取流式数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || '';

      for (const msg of messages) {
        if (!msg) continue;
        if (msg === 'data: [DONE]') {
          closeSSEConnection();
          return;
        }
        const dataStr = msg.replace(/^data: /, '');
        const streamData: IStreamData = JSON.parse(dataStr);
        if (streamData.code === 200 && streamData.data.partialAnswer) {
          lastChat.streamingAnswer = (lastChat.streamingAnswer || '') + streamData.data.partialAnswer;
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.log('手动停止的错误')
      return
    }

    console.error('POST 流式请求失败：', err);
    lastChat.streamingAnswer = '请求异常，请稍后重试';
    closeSSEConnection();
  }
};

// 停止请求
const clickStopFetch = () => {
  closeSSEConnection();
};

// 配置 marked：启用代码高亮
marked.setOptions({
  highlight: (code, lang) => {
    // 如果指定了语言，且 highlight.js 支持该语言，则高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('代码高亮失败：', err);
      }
    }
    // 不支持的语言，默认高亮
    return hljs.highlightAuto(code).value;
  },
  breaks: true, // 自动将 \n 转为 <br>
  gfm: true, // 支持 GitHub Flavored Markdown
});

// 辅助函数：将 Markdown 字符串转为 HTML
const renderMarkdown = (content: string | undefined): string => {
  if (!content) return '';
  // 解析 Markdown 为 HTML
  return marked.parse(content);
};

const connectRef = ref<HTMLDivElement | null>(null)
watch(chatList, () => {
  if (!connectRef.value) {
    return
  }

  connectRef.value.scrollTop = connectRef.value.scrollHeight
}, {
  deep: true,
  flush: 'post',
})
</script>

<template>
  <div class="w-full h-full flex">
    <!--左侧-->
    <div class="hidden w-65 h-full flex-col overflow-auto bg-[#f9f9f9] border-r border-[#ededed]">
      <div class="w-full px-2 flex flex-col gap-y-2">
        <!--头部-->
        <div class="h-13 flex justify-between items-center">
          <!--左侧logo-->
          <button class="w-9 h-9 flex justify-center items-center hover:bg-[#00000012] rounded-xl">
            <img
              src="@/assets/icon/logo.svg"
              alt=""
              class="w-6 h-6"
            >
          </button>
        </div>
        <!--按钮区-->
        <div
          class="px-3 h-9 flex items-center gap-x-2 hover:bg-[#00000012] rounded-xl"
          @click="clickNewChat"
        >
          <img src="@/assets/icon/write.svg" alt="" class="w-5 h-5">
          <span>新聊天</span>
        </div>
        <span class="text-[#8f8f8f]">你的聊天</span>
        <div
          v-for="(item, index) in historyChatList"
          :key="index"
          class="px-2 h-9 flex items-center hover:bg-[#00000012] rounded-xl group relative"
        >
          <span class="w-full group-hover:w-48 text-sm line-clamp-1">{{item}}</span>
          <div class="absolute right-2 hidden group-hover:flex">
            <img
              src="@/assets/icon/ellipsis-hor.svg"
              alt=""
              class="w-5 h-5 cursor-pointer"
            >
          </div>
        </div>
      </div>
    </div>
    <!--右侧-->
    <div class="grow h-full py-5 flex flex-col justify-center items-center gap-y-6">
      <!--内容区-->
      <div
        ref="connectRef"
        class="w-4/5 max-w-200 flex flex-col overflow-auto"
        :class="[
          chatList.length ? 'grow' : '',
        ]"
      >
        <div
          v-if="!chatList.length"
          class="w-full h-full flex flex-col justify-center items-center gap-y-2"
        >
          <span class="mb-5 h-9 text-black font-bold text-2xl">{{helpContent}}</span>
          <!--<HintList @click="clickHint"/>-->
        </div>
        <div
          v-else
          class="w-full h-full flex flex-col gap-y-13"
        >
          <div
            v-for="(item, index) in chatList"
            :key="index"
            class="flex flex-col gap-y-13"
          >
            <!--问题-->
            <div class="flex justify-end items-center relative">
              <div
                class="max-w-112.5 bg-[#f5f5f5] px-4 py-2.5 rounded-xl"
              >
                <span class="w-full break-all">{{item.question}}</span>
              </div>
            </div>
            <!--回答-->
            <div
              class="ai-answer-markdown"
              v-html="renderMarkdown(item.streamingAnswer)"
            ></div>
          </div>
        </div>
      </div>
      <!--用户交互区-->
      <div class="w-4/5 max-w-200 rounded-2xl border border-[#e0e0e0] flex flex-col p-3">
        <textarea
              v-model="question"
              placeholder="询问任何问题"
              rows="4"
              class="box-border min-h-14 max-h-40 resize-none"
              @keydown.enter.prevent="clickSend"
            ></textarea>
        <div class="flex justify-end items-center">
          <!--发送按钮-->
          <button
            v-show="!isFetching"
            class="w-8 h-8 flex justify-center items-center rounded-full"
            :class="[
              !!question ? 'bg-[#0057ff] text-white' : 'bg-[#d9d9d9] text-[#eeeeee] cursor-not-allowed',
            ]"
            @click="clickSend"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              fill="none"
              viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="m3.543 8.883 7.042-7.047a2 2 0 0 1 2.828 0l7.043 7.046a1 1 0 0 1 0 1.415l-.701.701a1 1 0 0 1-1.414 0L13.3 5.956v15.792a1 1 0 0 1-1 1h-.99a1 1 0 0 1-1-1V6.342l-4.654 4.656a1 1 0 0 1-1.414 0l-.7-.7a1 1 0 0 1 0-1.415">
              </path>
            </svg>
          </button>
          <!--停止按钮-->
          <button
            v-show="isFetching"
            class="w-8 h-8 flex justify-center items-center rounded-lg hover:bg-[#f6f6f6] text-[24px]"
            @click="clickStopFetch"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              fill="none"
              viewBox="0 0 24 24">
              <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m0-20a9 9 0 1 1 0 18 9 9 0 0 1 0-18m-2 5.5A1.5 1.5 0 0 0 8.5 10v4a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 14 8.5z"
                clip-rule="evenodd">
              </path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* AI 回答 Markdown 样式 */
.ai-answer-markdown {
  line-height: 1.8;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  color: #333;
  font-size: 14px;
  word-break: break-all;
}

/* Markdown 内部元素样式优化 */
.ai-answer-markdown h1,
.ai-answer-markdown h2,
.ai-answer-markdown h3 {
  margin: 12px 0 8px;
  font-weight: 600;
  color: #1a1a1a;
}

.ai-answer-markdown h1 {
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.ai-answer-markdown h2 {
  font-size: 16px;
}

.ai-answer-markdown ul,
.ai-answer-markdown ol {
  padding-left: 24px;
  margin: 8px 0;
}

.ai-answer-markdown p {
  margin: 8px 0;
}

.ai-answer-markdown strong {
  color: #1a1a1a;
  font-weight: 600;
}

.ai-answer-markdown code {
  padding: 2px 4px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 13px;
  color: #e53935;
}

.ai-answer-markdown pre {
  padding: 12px;
  background-color: #24292e; /* 对应 github-dark 样式背景 */
  border-radius: 8px;
  margin: 10px 0;
  overflow-x: auto; /* 代码横向滚动 */
}

.ai-answer-markdown pre code {
  background-color: transparent;
  color: #fff;
  padding: 0;
  font-size: 12px;
  line-height: 1.6;
}

/* 原有样式不变 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

/* ========== 表格专属美化样式（核心新增） ========== */
.ai-answer-markdown table {
  width: 100%;
  border-collapse: collapse; /* 合并边框，避免双重边框 */
  margin: 16px 0; /* 上下间距，与其他内容区分 */
  border-radius: 8px; /* 表格整体圆角 */
  overflow: hidden; /* 配合 border-radius 生效，隐藏表格内部溢出的边框 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* 轻微阴影，提升层次感 */
}

/* 表格表头样式 */
.ai-answer-markdown th {
  background-color: #f8f9fa; /* 表头浅灰背景，与内容区分 */
  color: #212529; /* 表头文字深色，更醒目 */
  font-weight: 600; /* 表头文字加粗 */
  text-align: left; /* 文字左对齐（可根据需求改为 center） */
  padding: 12px 16px; /* 表头内边距，避免文字贴边 */
  border: 1px solid #e9ecef; /* 表头边框，浅灰色更柔和 */
  white-space: nowrap; /* 表头文字不换行，保持整洁 */
}

/* 表格内容单元格样式 */
.ai-answer-markdown td {
  padding: 12px 16px; /* 内容单元格内边距，与表头一致 */
  border: 1px solid #e9ecef; /* 内容边框，与表头统一风格 */
  color: #343a40; /* 内容文字颜色，保证可读性 */
  vertical-align: middle; /* 文字垂直居中，更美观 */
}

/* 表格行悬停效果（可选，提升交互体验） */
.ai-answer-markdown tr:hover {
  background-color: #f8f9fa; /* 悬停时浅灰背景，便于阅读多行数据 */
  transition: background-color 0.2s ease; /* 平滑过渡，更自然 */
}

/* 可选：奇偶行交替背景（斑马纹，提升可读性） */
.ai-answer-markdown tr:nth-child(even) {
  background-color: #ffffff;
}

.ai-answer-markdown tr:nth-child(odd) {
  background-color: #fafbfc;
}
</style>
