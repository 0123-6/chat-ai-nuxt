<script setup lang="ts">
import {fetchUserInfo} from "~/composables/useUserStore";

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
