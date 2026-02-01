<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

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
const code = ref('')
const countdown = ref(0)
const loading = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 手机号校验
const isValidPhone = computed(() => /^1[3-9]\d{9}$/.test(phone.value))

const canSubmit = computed(() => {
  return isValidPhone.value && agreed.value
})

// 验证码校验（4位数字）
const isValidCode = computed(() => /^\d{4}$/.test(code.value))

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
  try {
    const response = await fetch('/api/auth/getCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.value }),
    })
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('验证码已发送')
      startCountdown()
      return true
    } else {
      ElMessage.error(result.msg || '验证码发送失败')
      return false
    }
  } catch (e) {
    ElMessage.error('网络错误，请稍后重试')
    return false
  }
}

// 点击下一步，进入验证码输入
const handleNext = async () => {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  const success = await fetchCode()
  loading.value = false
  if (success) {
    step.value = 'code'
  }
}

// 返回手机号输入
const handleBack = () => {
  step.value = 'phone'
  code.value = ''
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 重新发送验证码
const handleResend = async () => {
  if (countdown.value > 0 || loading.value) return
  loading.value = true
  await fetchCode()
  loading.value = false
}

// 登录接口
const loginByPhone = async () => {
  if (!isValidCode.value || loading.value) return
  loading.value = true
  try {
    const response = await fetch('/api/loginByPhone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.value,
        code: code.value,
      }),
    })
    const result = await response.json()
    if (result.code === 200) {
      // 登录成功后获取用户信息
      await fetchUserInfo()
      ElMessage.success('登录成功')
      visible.value = false
      // 重置状态
      step.value = 'phone'
      code.value = ''
      phone.value = ''
      agreed.value = false
    } else {
      ElMessage.error(result.msg || '登录失败')
    }
  } catch (e) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听验证码输入
watch(code, (val) => {
  if (val.length === 4) {
    loginByPhone()
  }
})

// 弹窗关闭时重置状态
watch(visible, (val) => {
  if (!val) {
    step.value = 'phone'
    code.value = ''
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }
})
</script>

<template>
  <el-dialog
    v-model="visible"
    width="400"
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
      <div class="w-full mb-4">
        <el-input
          v-model="code"
          placeholder="请输入验证码"
          size="large"
          maxlength="4"
          class="code-input"
          :disabled="loading"
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

.code-input :deep(.el-input__inner) {
  text-align: center;
  letter-spacing: 8px;
  font-size: 20px;
}
</style>
