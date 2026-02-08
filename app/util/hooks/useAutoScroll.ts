// 自动滚动控制 composable
export const useAutoScroll = (containerRef: Ref<HTMLElement | null>, isFetching: Ref<boolean>) => {
  const autoScrollEnabled = ref(true)
  const showScrollToBottom = ref(false)
  let lastScrollTop = 0
  let isUserClickedScrollButton = false  // 标记用户是否点击了滚动按钮

  // 判断是否在底部（阈值降低到 20px，更精确）
  const isAtBottom = () => {
    if (!containerRef.value) return true
    const {scrollTop, scrollHeight, clientHeight} = containerRef.value
    return scrollHeight - scrollTop - clientHeight < 20
  }

  // 更新滚动到底部按钮的显示状态
  const updateShowScrollToBottom = () => {
    showScrollToBottom.value = !isAtBottom()
  }

  // 平滑滚动到底部
  const scrollToBottom = (smooth = false) => {
    if (!containerRef.value) return
    // 如果用户刚点击了滚动按钮，在短时间内跳过自动滚动，避免覆盖平滑动画
    if (isUserClickedScrollButton) return

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
    if (!containerRef.value) return

    // 设置标志，防止 watch 的自动滚动覆盖平滑动画
    isUserClickedScrollButton = true

    // 使用平滑滚动
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth',
    })

    if (isFetching.value) {
      autoScrollEnabled.value = true
    }
    showScrollToBottom.value = false

    // 500ms 后重置标志（平滑滚动动画大约需要 300-500ms）
    setTimeout(() => {
      isUserClickedScrollButton = false
    }, 500)
  }

  // 处理滚动事件 - 跟踪方向 & 恢复自动滚动
  const handleScroll = () => {
    if (!containerRef.value) return
    const {scrollTop, scrollHeight, clientHeight} = containerRef.value
    const atBottom = scrollHeight - scrollTop - clientHeight < 20

    // 用户向上滚动时（即使很轻微），停止自动滚动
    if (scrollTop < lastScrollTop - 3 && isFetching.value) {
      autoScrollEnabled.value = false
    }

    // 用户滚动到底部时，重新激活自动滚动
    if (atBottom && isFetching.value) {
      autoScrollEnabled.value = true
    }

    showScrollToBottom.value = !atBottom
    lastScrollTop = scrollTop
  }

  // 移动端触摸事件处理 - 提高滚动敏感度
  let handleTouchStart: (() => void) | null = null
  let handleTouchEnd: (() => void) | null = null

  // 监听 visualViewport resize（移动端键盘弹起/收回）
  let viewportResizeHandler: (() => void) | null = null
  let pendingRafId: number | null = null

  onMounted(() => {
    if (window.visualViewport) {
      viewportResizeHandler = () => {
        // 取消之前待处理的 RAF，避免重复更新
        if (pendingRafId !== null) {
          cancelAnimationFrame(pendingRafId)
        }
        // 延迟一帧让布局更新完毕后再判断
        pendingRafId = requestAnimationFrame(() => {
          updateShowScrollToBottom()
          pendingRafId = null
        })
      }
      window.visualViewport.addEventListener('resize', viewportResizeHandler)
    }

    // 添加移动端触摸事件监听
    if (containerRef.value) {
      handleTouchStart = () => {
        // 用户开始触摸滚动区域时，如果正在回答，暂停自动滚动
        if (isFetching.value) {
          autoScrollEnabled.value = false
        }
      }

      handleTouchEnd = () => {
        // 用户触摸结束后，如果在底部且正在回答，重新激活自动滚动
        if (isFetching.value && isAtBottom()) {
          autoScrollEnabled.value = true
        }
      }

      containerRef.value.addEventListener('touchstart', handleTouchStart, {passive: true})
      containerRef.value.addEventListener('touchend', handleTouchEnd, {passive: true})
    }
  })

  onUnmounted(() => {
    // 清理待处理的 RAF
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId)
      pendingRafId = null
    }
    // 移除 visualViewport 事件监听
    if (viewportResizeHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', viewportResizeHandler)
      viewportResizeHandler = null
    }
    // 移除触摸事件监听
    if (containerRef.value) {
      if (handleTouchStart) {
        containerRef.value.removeEventListener('touchstart', handleTouchStart)
      }
      if (handleTouchEnd) {
        containerRef.value.removeEventListener('touchend', handleTouchEnd)
      }
    }
  })

  return {
    autoScrollEnabled,
    showScrollToBottom,
    scrollToBottom,
    clickScrollToBottom,
    handleScroll,
  }
}
