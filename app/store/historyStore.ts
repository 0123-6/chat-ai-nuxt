// 历史会话类型
import {userInfo} from "~/store/userInfo.ts";
import {useBaseFetch} from '~/util/hooks/useBaseFetch.ts'

export interface IHistory {
  conversationId: string
  title: string
}

// 历史会话列表
export const historyList = ref<IHistory[]>([])

const historyListFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'ai/getHistoryByUser',
    mockProd: true,
  }),
  transformResponseDataFn: (data) => {
    historyList.value = data || []
  },
})

export const isFetchHistoryList = computed(() => historyListFetcher.isFetching)

// 获取历史会话列表
export const fetchHistoryList = async () => {
  if (!userInfo.value) return
  await historyListFetcher.doFetch()
}
