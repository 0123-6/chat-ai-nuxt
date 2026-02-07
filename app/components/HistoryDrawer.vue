<script setup lang="ts">
import {logout, userInfo} from "~/store/userInfo.ts";
import {fetchHistoryList, historyList, type IHistory, isFetchHistoryList} from "~/store/historyStore.ts";
import {useBaseFetch} from '~/util/hooks/useBaseFetch.ts'

const props = defineProps<{
  modelValue: boolean
  currentConversationId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [conversationId: string]
  'logout': []
  'newChat': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 监听抽屉打开时获取历史列表
watch(visible, (val) => {
  if (val && userInfo.value) {
    fetchHistoryList()
  }
})

// 新建聊天
const handleNewChat = () => {
  visible.value = false
  emit('newChat')
}

// 点击会话项
const handleSelectHistory = (item: IHistory) => {
  emit('select', item.conversationId)
  visible.value = false
}

// 删除相关
const deleteTargetId = ref('')
const deleteFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'ai/deleteConversationId',
    mockProd: true,
    data: {conversationId: deleteTargetId.value},
  }),
  transformResponseDataFn: () => {
    const index = historyList.value.findIndex(h => h.conversationId === deleteTargetId.value)
    if (index > -1) {
      historyList.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  },
})

const handleDelete = async (item: IHistory) => {
  // 不允许删除当前正在查看的会话
  if (props.currentConversationId === item.conversationId) {
    ElMessage.warning('不能删除当前正在查看的会话')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除会话"${item.title}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'drawer-top-msgbox',
      }
    )
    deleteTargetId.value = item.conversationId
    await deleteFetcher.doFetch()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除失败：', e)
    }
  }
}

// 重命名相关
const renameTargetId = ref('')
const renameNewTitle = ref('')
const renameFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'ai/renameConversationId',
    mockProd: true,
    data: {
      conversationId: renameTargetId.value,
      newTitle: renameNewTitle.value,
    },
  }),
  transformResponseDataFn: () => {
    const target = historyList.value.find(h => h.conversationId === renameTargetId.value)
    if (target) {
      target.title = renameNewTitle.value
    }
    ElMessage.success('重命名成功')
  },
})

const handleRename = async (item: IHistory) => {
  try {
    const {value: newTitle} = await ElMessageBox.prompt(
      '请输入新的会话名称',
      '重命名',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: item.title,
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return '名称不能为空'
          }
          return true
        },
        customClass: 'drawer-top-msgbox',
      }
    )
    renameTargetId.value = item.conversationId
    renameNewTitle.value = newTitle.trim()
    await renameFetcher.doFetch()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('重命名失败：', e)
    }
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'logout-confirm-box',
      }
    )
    const success = await logout()
    if (success) {
      visible.value = false
      historyList.value = []
      // 通知父组件清空聊天列表并更新 URL
      emit('logout')
    }
  } catch (e) {
    // 用户取消操作
  }
}

</script>

<template>
  <el-drawer
    v-model="visible"
    direction="ltr"
    size="280px"
    :show-close="false"
    :with-header="false"
    class="history-drawer"
  >
    <div class="h-full flex flex-col bg-[#f9f9f9]">
      <!-- 新聊天按钮 -->
      <div class="px-2 py-2">
        <div
          class="px-3 h-10 flex items-center gap-x-2 hover:bg-[#00000012] rounded-xl cursor-pointer"
          @click="handleNewChat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
          </svg>
          <span class="text-sm">新对话</span>
        </div>
      </div>

      <!-- 历史会话列表 -->
      <div v-loading="isFetchHistoryList" class="flex-1 overflow-auto px-2">
        <template v-if="userInfo">
          <span class="px-2 text-sm text-[#8f8f8f]">历史会话</span>
          <div class="mt-2 flex flex-col gap-y-1">
            <div
              v-for="item in historyList"
              :key="item.conversationId"
              class="px-3 h-10 flex items-center gap-x-2 hover:bg-[#00000012] rounded-xl group cursor-pointer"
              :class="{ 'bg-[#00000012]': props.currentConversationId === item.conversationId }"
              @click="handleSelectHistory(item)"
            >
              <span class="w-full text-sm line-clamp-1 break-all" style="width: calc(100% - 24px - 8px);">{{
                  item.title
                }}</span>
              <div @click.stop>
                <el-dropdown
                  trigger="click"
                  @command="(cmd: string) => cmd === 'delete' ? handleDelete(item) : handleRename(item)"
                >
                  <div
                    class="w-6 h-6 flex items-center justify-center hover:bg-[#00000012] rounded cursor-pointer"
                  >
                    <el-icon :size="16">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                        <path fill="currentColor"
                              d="M176 416a112 112 0 1 1 0 224 112 112 0 0 1 0-224m336 0a112 112 0 1 1 0 224 112 112 0 0 1 0-224m336 0a112 112 0 1 1 0 224 112 112 0 0 1 0-224"></path>
                      </svg>
                    </el-icon>
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <span class="text-error">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div v-if="!historyList.length && !isFetchHistoryList" class="px-3 py-4 text-sm text-gray-400">
              暂无历史会话
            </div>
          </div>
        </template>
        <div v-else class="px-3 py-4 text-sm text-gray-400">登录后查看历史会话</div>
      </div>

      <!-- 底部用户信息 -->
      <div v-if="userInfo" class="w-full flex justify-between items-center px-4 py-4 border-t border-[#ededed]">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-[#0057ff] flex items-center justify-center text-white font-medium shrink-0">
            {{ userInfo!.nickname?.[0] || userInfo!.phone?.[0] || 'U' }}
          </div>
          <div class="flex flex-col">
            <span class="font-medium">{{ userInfo!.nickname || '用户' }}</span>
            <span class="text-sm text-gray-500">{{ userInfo!.phone }}</span>
          </div>
        </div>
        <el-button type="danger" text @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style>
.history-drawer .el-drawer__body {
  padding: 0;
}
</style>
