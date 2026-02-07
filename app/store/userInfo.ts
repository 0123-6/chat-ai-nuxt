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
// 用户信息是否已加载完成
export const isUserInfoLoaded = ref(false)

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
    if (import.meta.client) {
      ElMessage.error(e instanceof Error ? e.message : String(e))
    }
  } finally {
    isUserInfoLoaded.value = true
  }
}

// 退出登录
export const logout = async () => {
  try {
    const response = await fetch('/api/user/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await response.json()
    if (result.code === 200) {
      userInfo.value = null
      ElMessage.success('已退出登录')
      return true
    } else {
      ElMessage.error(result.msg || '退出失败')
      return false
    }
  } catch (e) {
    ElMessage.error('网络错误，请稍后重试')
    return false
  }
}
