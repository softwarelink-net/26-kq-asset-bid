<template>
  <div class="main-layout flex min-h-[calc(100vh-40px)]">
    <aside class="sidebar hidden w-64 shrink-0 flex-col text-slate-100 lg:flex">
      <div class="border-b border-white/10 px-5 py-5">
        <p class="text-[10px] font-bold tracking-[0.18em] text-sky-300">KQ ASSET · OA</p>
        <h1 class="mt-1 text-base font-bold leading-snug">柯桥经开区控股<br />资产协同管控台</h1>
        <p class="mt-2 text-[11px] text-sky-100/70">绍柯企〔2026〕983号</p>
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <RouterLink
          v-for="item in visibleMenus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item-active"
        >
          <span class="nav-dot" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-white/10 px-4 py-4 text-xs text-sky-100/70">
        <p>本地 sql.js · kqasset_ 命名空间</p>
        <p class="mt-1">纯前端边缘运行</p>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar sticky top-10 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p class="text-xs text-slate-500">当前位置</p>
            <div class="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span>国资协同中枢</span>
              <span class="text-slate-300">/</span>
              <span class="text-sky-700">{{ currentTitle }}</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="metric-chip">综合出租率 {{ occupancyRate }}%</span>
            <span class="metric-chip warn">待审三重一大 {{ pendingDocs }}</span>
            <span class="metric-chip danger">30天到期预警 {{ expireSoon }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-sm font-semibold text-slate-800">{{ auth.user?.full_name }}</p>
              <p class="text-[11px] text-slate-500">{{ auth.user?.dept_name }} · {{ roleLabel(auth.user?.role) }}</p>
            </div>
            <button class="corp-btn-ghost !px-3 !py-1.5" type="button" @click="onLogout">退出</button>
          </div>
        </div>
        <div class="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
          <RouterLink
            v-for="item in visibleMenus"
            :key="item.path"
            :to="item.path"
            class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-sky-50"
            active-class="!bg-sky-100 !text-sky-800"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </header>

      <main class="flex-1 px-4 py-5 md:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDashboardStats, type RoleCode } from '@/utils/sqljs-engine'
import { roleLabel } from '@/router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const occupancyRate = ref(0)
const pendingDocs = ref(0)
const expireSoon = ref(0)

const menus: { path: string; label: string; roles: RoleCode[] }[] = [
  { path: '/', label: '运营驾驶舱', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF', 'ROLE_DECISION_MAKER'] },
  { path: '/properties', label: '不动产台账', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF'] },
  { path: '/contracts', label: '租赁计费', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF'] },
  { path: '/workflow-oa', label: '智慧办公OA', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF', 'ROLE_DECISION_MAKER'] },
  { path: '/arrears-risk', label: '欠费风控', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF'] },
  { path: '/system', label: '系统审计', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_DECISION_MAKER'] },
]

const visibleMenus = computed(() =>
  menus.filter((m) => auth.hasRole(m.roles)),
)

const currentTitle = computed(() => (route.meta.title as string) || '工作台')

onMounted(async () => {
  try {
    const stats = await getDashboardStats()
    occupancyRate.value = stats.occupancyRate
    pendingDocs.value = stats.pendingMajorDocs
    expireSoon.value = stats.expireWithin60
  } catch {
    // ignore
  }
})

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1e1b4b 0%, #1e3a8a 55%, #0c4a6e 100%);
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.18);
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(224, 242, 254, 0.85);
  transition: background 0.2s ease, color 0.2s ease;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.nav-item-active {
  background: rgba(56, 189, 248, 0.2);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(125, 211, 252, 0.35);
}
.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #38bdf8;
  opacity: 0.7;
}
.metric-chip {
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  padding: 4px 10px;
  font-weight: 600;
}
.metric-chip.warn {
  background: #fef3c7;
  color: #92400e;
}
.metric-chip.danger {
  background: #fee2e2;
  color: #991b1b;
}
</style>
