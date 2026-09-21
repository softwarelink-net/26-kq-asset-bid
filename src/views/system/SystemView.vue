<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-slate-900">系统总控与涉密国企经营合规安全审计</h2>
      <p class="mt-1 text-sm text-slate-500">SM4 列级脱敏 · Feature Flags · 防篡改审计存证</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="corp-card p-5">
        <h3 class="text-sm font-bold text-slate-800">Feature Flags 业务特性开关</h3>
        <ul class="mt-4 space-y-3">
          <li
            v-for="cfg in configs"
            :key="cfg.config_key"
            class="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ cfg.config_key }}</p>
              <p class="mt-1 text-xs leading-5 text-slate-500">{{ cfg.description }}</p>
              <p class="mt-1 text-[11px] text-slate-400">{{ cfg.category }}</p>
            </div>
            <button
              v-if="cfg.config_value === 'true' || cfg.config_value === 'false'"
              type="button"
              class="relative h-7 w-12 shrink-0 rounded-full transition"
              :class="cfg.config_value === 'true' ? 'bg-sky-600' : 'bg-slate-300'"
              :disabled="!canToggle"
              @click="toggle(cfg)"
            >
              <span
                class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition"
                :class="cfg.config_value === 'true' ? 'left-5' : 'left-0.5'"
              />
            </button>
            <span v-else class="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">{{ cfg.config_value }}</span>
          </li>
        </ul>
      </div>

      <div class="corp-card p-5">
        <h3 class="text-sm font-bold text-slate-800">国密 SM4 动态列级脱敏演示</h3>
        <div class="mt-4 space-y-3 text-sm">
          <div class="rounded-lg bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-500">承租法人证件</p>
            <p class="font-mono">{{ maskOn ? '3306**********1234' : '330621198801011234' }}</p>
          </div>
          <div class="rounded-lg bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-500">租金底牌账户</p>
            <p class="font-mono">{{ maskOn ? '6222 **** **** 8899' : '622202100100188899' }}</p>
          </div>
          <div class="rounded-lg bg-slate-50 px-4 py-3">
            <p class="text-xs text-slate-500">合同变更哈希存证</p>
            <p class="break-all font-mono text-xs text-indigo-800">{{ contractHash }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="corp-card overflow-x-auto">
      <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 class="text-sm font-bold text-slate-800">安全审计追踪日志</h3>
        <button class="corp-btn-ghost !py-1 !text-xs" type="button" @click="reload">刷新</button>
      </div>
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th class="px-4 py-3">时间</th>
            <th class="px-4 py-3">操作者</th>
            <th class="px-4 py-3">动作</th>
            <th class="px-4 py-3">资源</th>
            <th class="px-4 py-3">URI</th>
            <th class="px-4 py-3">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" class="border-t border-slate-100">
            <td class="px-4 py-3 text-xs">{{ log.created_at }}</td>
            <td class="px-4 py-3">{{ log.username || '-' }}</td>
            <td class="px-4 py-3 font-mono text-xs">{{ log.action_name }}</td>
            <td class="px-4 py-3">{{ log.target_resource }}</td>
            <td class="px-4 py-3 text-xs text-slate-500">{{ log.request_uri }}</td>
            <td class="px-4 py-3">{{ log.status_code }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  getAuditLogs,
  getSystemConfigs,
  setSystemConfig,
  type AuditLogRow,
  type SystemConfigRow,
} from '@/utils/sqljs-engine'

const auth = useAuthStore()
const configs = ref<SystemConfigRow[]>([])
const logs = ref<AuditLogRow[]>([])

const canToggle = computed(() => auth.hasRole(['ROLE_SUPER_ADMIN']))
const maskOn = computed(
  () => configs.value.find((c) => c.config_key === 'FEATURE_SM4_TENANT_DATA_MASKING')?.config_value === 'true',
)
const contractHash = ref('')

onMounted(async () => {
  await reload()
  contractHash.value = await sha256Demo('HT-KQ-2026-088|柯经控股办〔2024〕12号|1980000')
})

async function reload() {
  configs.value = await getSystemConfigs()
  logs.value = await getAuditLogs()
}

async function toggle(cfg: SystemConfigRow) {
  if (!canToggle.value) {
    window.alert('仅系统超管可调整 Feature Flags')
    return
  }
  const next = cfg.config_value === 'true' ? 'false' : 'true'
  await setSystemConfig(cfg.config_key, next)
  await reload()
}

async function sha256Demo(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
</script>
