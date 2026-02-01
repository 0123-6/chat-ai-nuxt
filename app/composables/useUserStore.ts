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
export const useUserStore = () => {
  const userInfo = useState<IUserInfo | null>('userInfo', () => null)

  // 设置用户信息
  const setUserInfo = (info: IUserInfo | null) => {
    userInfo.value = info
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const res = await $fetch<{
        code: number
        msg: string
        data: IUserInfo
      }>('/api/user/getUserInfo', {
        method: 'POST',
      })
      if (res.code === 200) {
        setUserInfo(res.data)
      }
    } catch {
      // 失败不报错
    }
  }

  return {
    userInfo,
    setUserInfo,
    fetchUserInfo,
  }
}
