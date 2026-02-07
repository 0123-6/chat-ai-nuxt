<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import {useIsMobile} from "~/util/hooks/useDevice.ts";
import {fetchUserInfo} from "~/store/userInfo.ts";
import {fetchHistoryList} from "~/store/historyStore.ts";
import {baseFetch} from '~/util/api.ts'
import {useBaseFetch} from '~/util/hooks/useBaseFetch.ts'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 步骤：phone-输入手机号，code-输入验证码
const step = ref<'phone' | 'code'>('phone')
const phone = ref('')
const agreed = ref(false)
const codeDigits = ref(['', '', '', ''])
const codeInputRefs = ref<HTMLInputElement[]>([])
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 完整验证码
const code = computed(() => codeDigits.value.join(''))

// 手机号校验
const isValidPhone = computed(() => /^1[3-9]\d{9}$/.test(phone.value))

const canSubmit = computed(() => {
  return isValidPhone.value && agreed.value
})

// 验证码校验（4位数字）
const isValidCode = computed(() => /^\d{4}$/.test(code.value))

const codeFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'auth/getCode',
    mockProd: true,
    data: {phone: phone.value},
  }),
})

const loginFetcher = useBaseFetch({
  fetchOptionFn: () => ({
    url: 'loginByPhone',
    mockProd: true,
    data: {
      phone: phone.value,
      code: code.value,
    },
  }),
})

const loading = computed(() => codeFetcher.isFetching || loginFetcher.isFetching)

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      countdownTimer = null
    }
  }, 1000)
}

// 获取验证码接口
const fetchCode = async () => {
  const success = await codeFetcher.doFetch()
  if (success) {
    ElMessage.success('验证码已发送')
    startCountdown()
  }
  return success
}

// 点击下一步，进入验证码输入
const handleNext = async () => {
  if (!canSubmit.value || loading.value) return
  const success = await fetchCode()
  if (success) {
    step.value = 'code'
  }
}

// 返回手机号输入
const handleBack = () => {
  step.value = 'phone'
  codeDigits.value = ['', '', '', '']
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 处理验证码输入
const handleCodeInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  codeDigits.value[index] = value.slice(-1)

  // 自动聚焦下一个输入框
  if (value && index < 3) {
    nextTick(() => {
      codeInputRefs.value[index + 1]?.focus()
    })
  }
}

// 处理退格键
const handleCodeKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    nextTick(() => {
      codeInputRefs.value[index - 1]?.focus()
    })
  }
}

// 处理粘贴
const handleCodePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const paste = event.clipboardData?.getData('text') || ''
  const digits = paste.replace(/\D/g, '').slice(0, 4).split('')
  digits.forEach((d, i) => {
    codeDigits.value[i] = d
  })
  if (digits.length > 0) {
    const focusIndex = Math.min(digits.length, 3)
    nextTick(() => {
      codeInputRefs.value[focusIndex]?.focus()
    })
  }
}

// 重新发送验证码
const handleResend = async () => {
  if (countdown.value > 0 || loading.value) return
  await fetchCode()
}

// 登录接口
const loginByPhone = async () => {
  if (!isValidCode.value || loading.value) return
  const success = await loginFetcher.doFetch()
  if (success) {
    // 登录成功后获取用户信息
    await fetchUserInfo()
    // 如果当前 URL 有 conversationId，绑定到当前用户
    // 从 URL 路径中提取 conversationId（格式：/nuxt/chat/xxx）
    const pathMatch = window.location.pathname.match(/\/chat\/([^/]+)/)
    const currentConversationId = pathMatch?.[1]
    if (currentConversationId) {
      await baseFetch({
        url: 'ai/conversationIdToUser',
        mockProd: true,
        data: {conversationId: currentConversationId},
      })
      fetchHistoryList()
    }
    ElMessage.success('登录成功')
    // 关闭弹窗，状态重置由 watch(visible) 处理
    visible.value = false
  }
}

// 监听验证码输入
watch(code, (val) => {
  if (val.length === 4) {
    loginByPhone()
  }
})

// 弹窗关闭时重置状态（延迟执行，避免动画期间抖动）
watch(visible, (val) => {
  if (!val) {
    setTimeout(() => {
      step.value = 'phone'
      codeDigits.value = ['', '', '', '']
      phone.value = ''
      agreed.value = false
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 300)
  }
})

const isMobile = useIsMobile()
</script>

<template>
  <el-dialog
    v-model="visible"
    :width="isMobile ? 300 : 400"
    :show-close="true"
    align-center
    class="login-dialog"
  >
    <!-- 手机号输入步骤 -->
    <div v-if="step === 'phone'" class="flex flex-col items-center">
      <p class="text-lg font-medium text-[#1f1f1f] mb-6">登录后免费使用完整功能</p>

      <div class="w-full flex gap-2 mb-4">
        <el-select
          class="!w-24"
          model-value="+86"
          size="large"
          disabled
        >
          <el-option label="+86" value="+86" />
        </el-select>
        <el-input
          v-model="phone"
          placeholder="请输入手机号"
          size="large"
          class="flex-1"
          maxlength="11"
        />
      </div>

      <el-button
        type="primary"
        size="large"
        class="w-full"
        :disabled="!canSubmit"
        :loading="loading"
        @click="handleNext"
      >
        下一步
      </el-button>

      <div class="w-full mt-4 flex items-start">
        <el-checkbox v-model="agreed" class="!items-start">
          <span class="text-sm text-[#8a8a8a]">
            已阅读并同意
            <a href="#" class="text-[#3D6FE2] hover:underline">用户协议</a>、<a href="#" class="text-[#3D6FE2] hover:underline">隐私政策</a>
          </span>
        </el-checkbox>
      </div>
    </div>

    <!-- 验证码输入步骤 -->
    <div v-else class="flex flex-col items-center">
      <!-- 返回按钮和标题 -->
      <div class="w-full flex items-center gap-2 mb-6">
        <el-button
          type="primary"
          link
          @click="handleBack"
        >
          <el-icon size="20"><ArrowLeft /></el-icon>
        </el-button>
        <span class="text-lg font-medium text-[#1f1f1f]">输入 4 位验证码</span>
      </div>

      <!-- 提示信息 -->
      <p class="text-sm text-[#8a8a8a] mb-6">验证码已发送至 +86 {{ phone }}</p>

      <!-- 验证码输入框 -->
      <div class="w-full mb-4 flex justify-center gap-3">
        <input
          v-for="(_, index) in 4"
          :key="index"
          :ref="(el) => { if (el) codeInputRefs[index] = el as HTMLInputElement }"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :value="codeDigits[index]"
          :disabled="loading"
          class="w-12 h-12 text-center text-xl font-medium border border-[#dcdfe6] rounded-lg focus:border-[#3D6FE2] focus:outline-none disabled:bg-[#f5f5f5]"
          @input="handleCodeInput(index, $event)"
          @keydown="handleCodeKeydown(index, $event)"
          @paste="handleCodePaste"
        />
      </div>

      <!-- 重新发送 -->
      <div class="text-sm">
        <span v-if="countdown > 0" class="text-[#8a8a8a]">重新发送 {{ countdown }}s</span>
        <a
          v-else
          href="#"
          class="text-[#3D6FE2] hover:underline"
          @click.prevent="handleResend"
        >重新发送</a>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.login-dialog :deep(.el-dialog__header) {
  padding: 16px 16px 0;
  margin-right: 0;
}

.login-dialog :deep(.el-dialog__body) {
  padding: 20px 32px 32px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-dialog :deep(.el-dialog) {
    width: 90vw !important;
    max-width: 350px !important;
  }

  .login-dialog :deep(.el-dialog__body) {
    padding: 16px 20px 24px;
  }

  /* 禁用过渡动画 */
  .login-dialog :deep(.el-overlay),
  .login-dialog :deep(.el-dialog) {
    transition: none !important;
    animation: none !important;
  }
}
</style>
