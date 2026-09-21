<template>
  <GlobalStickyBanner />
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalStickyBanner from '@/components/common/GlobalStickyBanner.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()

const layoutComponent = computed(() => {
  return route.meta.layout === 'auth' ? AuthLayout : MainLayout
})
</script>
