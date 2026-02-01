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
export const userInfo = ref(null)

// 获取用户信息
export const fetchUserInfo = async () => {
  try {
    const response = await fetch('/api/user/getUserInfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await response.json()
    if (result.code !== 200) {
      console.log('未登录')
      return
    }
    userInfo.value = result.data
  } catch (e) {
    ElMessage.error(e)
  }

}
