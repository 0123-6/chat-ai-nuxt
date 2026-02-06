// 移动端断点（与 CSS 媒体查询保持一致）
const MOBILE_BREAKPOINT = 768

// 是否是移动端
const isMobile = ref(false)
let initialized = false

// composable 函数
export const useIsMobile = () => {
  // 仅在客户端初始化一次
  if (import.meta.client && !initialized) {
    initialized = true

    const updateIsMobile = () => {
      isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
    }

    // 初始化
    updateIsMobile()

    // 监听窗口大小变化
    window.addEventListener('resize', updateIsMobile)
  }

  return isMobile
}
