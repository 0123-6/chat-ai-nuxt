<script setup lang="ts">
import {useResetRef} from "~/util/hooks/useResetState.ts";
import {isUserInfoLoaded, userInfo} from "~/store/userInfo.ts";
import {streamFetch} from '~/util/api.ts'
import {useBaseFetch} from '~/util/hooks/useBaseFetch.ts'
import {useAutoScroll} from '~/util/hooks/useAutoScroll.ts'
import {renderMarkdown} from '~/util/markdown.ts'
import type {IChat, IStreamData} from '~/types/chat.ts'

const route = useRoute()
// 使用 ref 存储 conversationId，初始值从路由参数获取
const conversationId = ref<string | undefined>(route.params.conversationId as string | undefined)

// 更新 URL 中的 conversationId（不刷新页面）
const updateConversationIdInUrl = (newId: string) => {
  if (conversationId.value === newId) return
  conversationId.value = newId
  // 使用 history.replaceState 只更新 URL，不触发路由变化
  window.history.replaceState({}, '', `/nuxt/chat/${newId}`)
}

const fullHelpContent = '有什么我能帮你的吗？'
const helpContent = ref<string>('')
let timer: any
let helpContentIndex = 0
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
const [isFetching] = useResetRef((): boolean => false)
const [chatList, resetChatList] = useResetRef((): IChat[] => [])
// 关闭SSE连接（统一管理，避免内存泄漏）
const closeSSEConnection = () => {
  fetchQuestionAbortController?.abort?.()
  isFetching.value = false
};

const clickNewChat = () => {
  closeSSEConnection();
  resetChatList();
  // 重置 conversationId 并更新 URL
  conversationId.value = undefined
  window.history.replaceState({}, '', '/nuxt/chat')
}

// 获取历史会话
const historyByIdFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'ai/getHistoryById',
    mockProd: true,
    data: {conversationId: conversationId.value},
  }),
  transformResponseDataFn: (data) => {
    if (data?.list?.length) {
      chatList.value = data.list.map((item: any) => ({
        question: item.question,
        streamingAnswer: item.answer,
      }))
    }
  },
  finalCallback: (fetchObject) => {
    if (!fetchObject.isOk && fetchObject.reason !== 'AbortError') {
      // conversationId 无效（过期、已删除或非法），清除 URL 中的 conversationId
      conversationId.value = undefined
      window.history.replaceState({}, '', '/nuxt/chat')
    }
  },
})

const fetchHistoryById = async () => {
  if (!conversationId.value) return
  await historyByIdFetcher.doFetch()
}

onMounted(() => {
  // 获取历史会话
  fetchHistoryById()
  // 打字机效果
  timer = setInterval(() => {
    helpContent.value = fullHelpContent.slice(0, helpContentIndex+1)
    helpContentIndex++
    if (helpContentIndex === fullHelpContent.length) {
      clearInterval(timer)
      timer = undefined
    }
  }, 40)
})

let fetchQuestionAbortController: AbortController
const fetchQuestionWithSSE = async () => {
  if (!chatList.value.length) return;
  const lastChat = chatList.value.at(-1)!;
  if (!lastChat.question) return;

  closeSSEConnection();
  lastChat.streamingAnswer = '';
  isFetching.value = true
  // 重置自动滚动状态
  autoScrollEnabled.value = true
  showScrollToBottom.value = false
  fetchQuestionAbortController = new AbortController()

  const {isOk, reason} = await streamFetch<IStreamData>({
    url: '/api/ai/chat',
    data: {
      conversationId: conversationId.value,
      question: lastChat.question,
    },
    signal: fetchQuestionAbortController.signal,
    onMessage: (streamData) => {
      if (streamData.code === 200) {
        // 如果返回了新的 conversationId，更新 URL
        if (streamData.data.conversationId && !conversationId.value) {
          updateConversationIdInUrl(streamData.data.conversationId)
        }
        if (streamData.data.partialAnswer) {
          lastChat.streamingAnswer = (lastChat.streamingAnswer || '') + streamData.data.partialAnswer;
        }
      }
    },
  })

  if (!isOk && reason !== 'AbortError') {
    lastChat.streamingAnswer = '请求异常，请稍后重试';
  }
  closeSSEConnection();
};

// 停止请求
const clickStopFetch = () => {
  closeSSEConnection();
};

const connectRef = ref<HTMLDivElement | null>(null)
const loginDialogVisible = ref(false)
const historyDrawerVisible = ref(false)
// 复制功能相关
const activeItemIndex = ref<number | null>(null) // 当前激活显示复制按钮的项
const copiedItems = ref<Set<string>>(new Set()) // 已复制的项（用于显示对号）

// 复制文本
const copyText = async (text: string, itemKey: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedItems.value.add(itemKey)
    // 5秒后恢复
    setTimeout(() => {
      copiedItems.value.delete(itemKey)
    }, 5000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 点击问题或回答区域
const handleItemClick = (index: number) => {
  activeItemIndex.value = activeItemIndex.value === index ? null : index
}

// 自动滚动控制
const {
  autoScrollEnabled,
  showScrollToBottom,
  scrollToBottom,
  clickScrollToBottom,
  handleScroll,
} = useAutoScroll(connectRef, isFetching)

// 选择历史会话
const handleSelectHistory = (selectedConversationId: string) => {
  if (conversationId.value === selectedConversationId) return
  closeSSEConnection()
  resetChatList()
  conversationId.value = selectedConversationId
  window.history.replaceState({}, '', `/nuxt/chat/${selectedConversationId}`)
  fetchHistoryById()
}

// 退出登录时清空聊天
const handleLogout = () => {
  closeSSEConnection()
  resetChatList()
  conversationId.value = undefined
  // 更新 URL
  window.history.replaceState({}, '', '/nuxt/chat')
}
watch(chatList, () => {
  if (!connectRef.value || !autoScrollEnabled.value) return
  scrollToBottom()
}, {
  deep: true,
  flush: 'post',
})
// 回答完成后滚动到最下方（包含复制按钮）
watch(isFetching, (val, oldVal) => {
  if (!val && oldVal && autoScrollEnabled.value && chatList.value.length > 0) {
    nextTick(() => scrollToBottom())
  }
})
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <!--头部-->
    <div class="w-full px-6 h-12 flex justify-between items-center">
      <!-- 左侧：会话记录按钮 + 新对话按钮 -->
      <ClientOnly>
        <div v-if="isUserInfoLoaded" class="flex items-center gap-2">
          <button
            class="w-9 h-9 flex justify-center items-center hover:bg-[#f5f5f5] rounded-lg"
            title="会话记录"
            @click="userInfo ? historyDrawerVisible = true : loginDialogVisible = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path></svg>
          </button>
          <button
            class="h-9 px-2 flex items-center gap-1 text-sm hover:bg-[#00000012] rounded-xl"
            @click="clickNewChat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
            </svg>
            <span>新对话</span>
          </button>
        </div>
      </ClientOnly>
      <!-- 右侧：登录按钮 -->
      <ClientOnly>
        <el-button
          v-if="isUserInfoLoaded && !userInfo"
          type="primary"
          @click="loginDialogVisible = true"
        >
          登录
        </el-button>
      </ClientOnly>
    </div>
    <div class="w-full flex" :style="{height: 'calc(100% - 48px)'}">
      <!--右侧-->
      <div class="grow h-full py-5 flex flex-col justify-center items-center gap-y-6 relative">
        <!--内容区-->
        <div
          ref="connectRef"
          class="w-4/5 max-w-200 flex flex-col overflow-y-auto overflow-x-hidden relative"
          :class="[
          chatList.length ? 'grow' : '',
        ]"
          @scroll="handleScroll"
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
              <div
                class="flex justify-end items-center relative group"
                @click="handleItemClick(index * 2)"
              >
                <div
                  class="max-w-112.5 bg-[#f5f5f5] px-4 py-2.5 rounded-xl"
                >
                  <span class="w-full break-all">{{item.question}}</span>
                </div>
                <!--问题复制按钮-->
                <button
                  class="absolute -bottom-6 right-0 w-6 h-6 flex justify-center items-center text-[#999] hover:text-[#666]"
                  :class="[activeItemIndex === index * 2 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']"
                  @click.stop="copyText(item.question, `q-${index}`)"
                >
                  <svg v-if="!copiedItems.has(`q-${index}`)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3AC295" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </div>
              <!--回答-->
              <div
                class="relative group"
                @click="handleItemClick(index * 2 + 1)"
              >
                <div
                  class="ai-answer-markdown"
                  v-html="renderMarkdown(item.streamingAnswer)"
                ></div>
                <!--回答复制按钮-->
                <button
                  v-if="item.streamingAnswer && !(index === chatList.length - 1 && isFetching)"
                  class="absolute -bottom-6 left-0 w-6 h-6 flex justify-center items-center text-[#999] hover:text-[#666]"
                  :class="[index === chatList.length - 1 || activeItemIndex === index * 2 + 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']"
                  @click.stop="copyText(item.streamingAnswer || '', `a-${index}`)"
                >
                  <svg v-if="!copiedItems.has(`a-${index}`)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3AC295" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <!--用户交互区-->
        <div class="w-4/5 max-w-200 flex flex-col relative">
          <!--滚动到底部按钮-->
          <button
            v-show="showScrollToBottom && chatList.length"
            class="absolute -top-12 left-1/2 -translate-x-1/2 w-9 h-9 flex justify-center items-center rounded-full bg-white border border-[#e0e0e0] shadow-md hover:bg-[#f5f5f5] z-10"
            title="滚动到底部"
            @click="clickScrollToBottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </button>
          <div class="rounded-2xl border border-[#e0e0e0] flex flex-col p-3">
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
    </div>

    <!-- 登录弹窗 -->
    <LoginDialog v-model="loginDialogVisible" />

    <!-- 历史会话抽屉 -->
    <HistoryDrawer
      v-model="historyDrawerVisible"
      :current-conversation-id="conversationId"
      @select="handleSelectHistory"
      @logout="handleLogout"
      @new-chat="clickNewChat"
    />
  </div>
</template>

<style src="~/assets/css/chat.css"></style>
