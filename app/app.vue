<script setup lang="ts">
import {fetchUserInfo} from "~/store/userInfo.ts";

// 首次进入网站时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>
