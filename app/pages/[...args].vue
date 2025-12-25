<script setup lang="ts">
const goIndexPage = () => {
  navigateTo('/', {
    replace: true,
  })
}
</script>

<template>
  <div class="w-screen h-screen flex flex-col gap-y-2 items-start">
    <span class="text-4xl">404页面</span>
    <button @click="goIndexPage">跳转到首页</button>
  </div>
</template>
