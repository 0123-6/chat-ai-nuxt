<script setup lang="ts">
const { fetchUserInfo } = useUserStore()

// 首次进入网站时获取用户信息
fetchUserInfo()
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>
