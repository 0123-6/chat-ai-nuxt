import {useBaseFetch} from '~/util/hooks/useBaseFetch.ts'

// 用户信息类型
export interface IUserInfo {
  // 账号,唯一标识
  account: string
  // 昵称
  nickname?: string
  // 手机号,唯一
  phone?: string
  // 状态
  status: 'normal' | 'disabled'
}

// 用户全局状态
export const userInfo = ref<IUserInfo | null>(null)
// 用户信息是否已加载完成
export const isUserInfoLoaded = ref(false)

// 获取用户信息
const userInfoFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'user/getUserInfo',
    mockProd: true,
    showErrorMessage: false,
  }),
  transformResponseDataFn: (data) => {
    userInfo.value = data
  },
  finalCallback: () => {
    isUserInfoLoaded.value = true
  },
})

export const fetchUserInfo = async () => {
  await userInfoFetcher.doFetch()
}

// 退出登录
const logoutFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'logout',
    mockProd: true,
  }),
})

export const logout = async () => {
  const success = await logoutFetcher.doFetch()
  if (success) {
    userInfo.value = null
    ElMessage.success('已退出登录')
  }
  return success
}
