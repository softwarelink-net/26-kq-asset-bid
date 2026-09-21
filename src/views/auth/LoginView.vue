<template>
  <div class="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <section class="corp-card overflow-hidden p-0">
      <div class="bg-gradient-to-r from-indigo-900 via-blue-800 to-sky-700 px-6 py-5 text-white">
        <p class="text-xs font-semibold tracking-widest text-sky-200">SECURE GATEWAY</p>
        <h2 class="mt-1 text-2xl font-bold">国资资产协同登录</h2>
        <p class="mt-2 text-sm text-sky-100/85">本地 SQLite 鉴权 · RBAC 四级权限 · 国密脱敏演示</p>
      </div>
      <form class="space-y-4 px-6 py-6" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">登录账号</label>
          <input
            v-model="username"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-sky-400 focus:ring-2"
            placeholder="admin / asset_lead / officer / leader"
            autocomplete="username"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">登录密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-sky-400 focus:ring-2"
            placeholder="请输入演示密码"
            autocomplete="current-password"
          />
        </div>
        <p v-if="error" class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error }}</p>
        <button class="corp-btn-primary w-full !py-2.5" type="submit" :disabled="loading">
          {{ loading ? '鉴权中…' : '进入资产协同控制台' }}
        </button>
      </form>
    </section>

    <section class="corp-card p-5 text-sm text-slate-700">
      <h3 class="text-base font-bold text-slate-900">演示账号一览</h3>
      <div class="mt-4 space-y-3">
        <div v-for="a in accounts" :key="a.user" class="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-slate-800">{{ a.label }}</span>
            <span class="status-pill bg-sky-100 text-sky-800">{{ a.role }}</span>
          </div>
          <p class="mt-1 text-xs text-slate-500">{{ a.user }} / {{ a.pass }}</p>
        </div>
      </div>
      <RouterLink class="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:underline" to="/tender">
        查看公开招标公告全文 →
      </RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('admin')
const password = ref('Admin@2026')
const loading = ref(false)
const error = ref('')

const accounts = [
  { label: '系统超管', user: 'admin', pass: 'Admin@2026', role: 'ROLE_SUPER_ADMIN' },
  { label: '资产主管', user: 'asset_lead', pass: 'Lead@2026', role: 'ROLE_ASSET_DIRECTOR' },
  { label: '经办管家', user: 'officer', pass: 'Work@2026', role: 'ROLE_OFFICE_STAFF' },
  { label: '决策长官', user: 'leader', pass: 'Leader@2026', role: 'ROLE_DECISION_MAKER' },
]

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
