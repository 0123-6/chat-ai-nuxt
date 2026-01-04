<script setup lang="ts">

const emits = defineEmits(['click'])

const hintList = [
  '一年中几月份最好找工作？',
  '古人如何描写遗憾？',
  '哪些习惯能提升睡眠质量？',
  '为什么唐宋八大家没有李白？',
  '写一份简洁清晰的工作周报',
  '生成小众艺术插画',
  '电子设备的护眼模式真的能防近视吗？',
  '写一份结构严谨的论文大纲',
]

const clickHint = (item: any) => {
  emits('click', item)
}
</script>

<template>
            <div
              v-for="(fatherIndex) of 3"
              :key="fatherIndex"
              class="flex items-center gap-x-2"
            >
              <div
                v-for="(item, index) in hintList.slice(3*(fatherIndex-1), 3*(fatherIndex))"
                :key="index"
                class="bg-[#0000000a] hover:bg-[#00000012] flex justify-center items-center px-4 py-2.5 rounded-xl cursor-pointer"
                @click="clickHint(item)"
              >
                <span class="text-sm">{{item}}</span>
              </div>
            </div>
</template>

<style scoped>

</style>
