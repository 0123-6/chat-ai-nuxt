// 历史会话类型
export interface IHistory {
  conversationId: string
  title: string
}

// 历史会话列表
export const historyList = ref<IHistory[]>([])
export const isFetchHistoryList = ref(false)

// 获取历史会话列表
export const fetchHistoryList = async () => {
  if (!userInfo.value) return
  isFetchHistoryList.value = true
  try {
    const response = await fetch('/api/ai/getHistoryByUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await response.json()
    if (result.code === 200) {
      historyList.value = result.data || []
    }
  } catch (e) {
    console.error('获取历史会话列表失败：', e)
  } finally {
    isFetchHistoryList.value = false
  }
}
