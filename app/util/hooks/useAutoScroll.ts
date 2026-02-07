// 自动滚动控制 composable
export const useAutoScroll = (containerRef: Ref<HTMLElement | null>, isFetching: Ref<boolean>) => {
  const autoScrollEnabled = ref(true)
  const showScrollToBottom = ref(false)
  let lastScrollTop = 0

  // 平滑滚动到底部
  const scrollToBottom = (smooth = false) => {
    if (!containerRef.value) return
    if (smooth) {
      containerRef.value.scrollTo({
        top: containerRef.value.scrollHeight,
        behavior: 'smooth',
      })
    } else {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }

  // 用户主动点击滚动到底部
  const clickScrollToBottom = () => {
    scrollToBottom(true)
    if (isFetching.value) {
      autoScrollEnabled.value = true
    }
    showScrollToBottom.value = false
  }

  // 处理滚动事件 - 跟踪方向 & 恢复自动滚动
  const handleScroll = () => {
    if (!containerRef.value) return
    const {scrollTop, scrollHeight, clientHeight} = containerRef.value
    const atBottom = scrollHeight - scrollTop - clientHeight < 50

    // 用户向上滚动时，停止自动滚动
    if (scrollTop < lastScrollTop && isFetching.value) {
      autoScrollEnabled.value = false
    }

    // 用户滚动到底部时，重新激活自动滚动
    if (atBottom && isFetching.value) {
      autoScrollEnabled.value = true
    }

    showScrollToBottom.value = !atBottom
    lastScrollTop = scrollTop
  }

  return {
    autoScrollEnabled,
    showScrollToBottom,
    scrollToBottom,
    clickScrollToBottom,
    handleScroll,
  }
}
