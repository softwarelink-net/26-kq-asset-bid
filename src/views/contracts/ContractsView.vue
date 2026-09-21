<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-slate-900">租赁合同全周期管理与动态计费工坊</h2>
      <p class="mt-1 text-sm text-slate-500">免租期扣减 · 年递增阶梯测算 · 60/30/15 天到期预警</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="corp-card p-5">
        <h3 class="text-sm font-bold text-slate-800">阶梯递增租金智能测算器</h3>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="text-xs">
            年度基础租金（元）
            <input v-model.number="calc.base" type="number" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label class="text-xs">
            测算年限
            <input v-model.number="calc.years" type="number" min="1" max="10" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label class="text-xs">
            年递增率（%）
            <input v-model.number="calc.increment" type="number" step="0.1" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label class="text-xs">
            免租期（月）
            <input v-model.number="calc.freeMonths" type="number" min="0" max="12" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>
        <ul class="mt-4 space-y-2">
          <li
            v-for="row in schedule"
            :key="row.year"
            class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <span>第 {{ row.year }} 年 · {{ row.note }}</span>
            <span class="font-bold text-indigo-800">¥ {{ row.amount.toLocaleString() }}</span>
          </li>
        </ul>
        <p class="mt-3 text-sm font-semibold text-sky-800">
          合计应收：¥ {{ schedule.reduce((s, r) => s + r.amount, 0).toLocaleString() }}
        </p>
      </div>

      <div class="corp-card p-5">
        <h3 class="text-sm font-bold text-slate-800">到期预警看板</h3>
        <div class="mt-4 space-y-3">
          <div
            v-for="c in contracts"
            :key="c.id"
            class="rounded-xl border px-4 py-3"
            :class="warnBorder(c.days_to_expire)"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-semibold text-slate-800">{{ c.contract_no }}</p>
              <span v-if="(c.days_to_expire ?? 999) <= 60" class="status-pill bg-rose-100 text-rose-700">
                🚩 {{ c.days_to_expire }} 天后到期
              </span>
              <span v-else class="status-pill bg-emerald-100 text-emerald-700">履约正常</span>
            </div>
            <p class="mt-1 text-sm text-slate-600">{{ c.tenant_name }}</p>
            <p class="text-xs text-slate-500">{{ c.property_name_desc }} · {{ c.lease_start_date }} ~ {{ c.lease_end_date }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="corp-card overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th class="px-4 py-3">合同编号</th>
            <th class="px-4 py-3">承租单位</th>
            <th class="px-4 py-3">年租金 / 递增</th>
            <th class="px-4 py-3">押金</th>
            <th class="px-4 py-3">下期应收</th>
            <th class="px-4 py-3">缴付状态</th>
            <th class="px-4 py-3">审批文号</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in contracts" :key="c.id" class="border-t border-slate-100" :class="{ 'bg-rose-50/50': (c.days_to_expire ?? 999) <= 60 }">
            <td class="px-4 py-3 font-mono text-xs">{{ c.contract_no }}</td>
            <td class="px-4 py-3">
              <p class="font-medium">{{ c.tenant_name }}</p>
              <p class="text-xs text-slate-500">{{ c.tenant_legal_person_masked }}</p>
            </td>
            <td class="px-4 py-3">
              ¥{{ c.annual_rent_amount.toLocaleString() }}
              <span class="text-xs text-slate-500"> / +{{ c.annual_increment_pct }}%</span>
              <p class="text-xs text-slate-500">免租 {{ c.free_period_months }} 月</p>
            </td>
            <td class="px-4 py-3">¥{{ c.deposit_guarantee_amount.toLocaleString() }}</td>
            <td class="px-4 py-3">{{ c.next_payment_due_date }}</td>
            <td class="px-4 py-3">
              <span class="status-pill" :class="payClass(c.payment_status)">{{ payLabel(c.payment_status) }}</span>
            </td>
            <td class="px-4 py-3 text-xs">{{ c.audit_approval_doc }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { calcSteppedRent, getLeaseContracts, type LeaseContractRow } from '@/utils/sqljs-engine'

const contracts = ref<LeaseContractRow[]>([])
const calc = reactive({ base: 1980000, years: 5, increment: 3, freeMonths: 2 })
const schedule = computed(() => calcSteppedRent(calc.base, calc.years, calc.increment, calc.freeMonths))

onMounted(async () => {
  contracts.value = await getLeaseContracts()
  if (contracts.value[0]) {
    calc.base = contracts.value[0].annual_rent_amount
    calc.increment = contracts.value[0].annual_increment_pct
    calc.freeMonths = contracts.value[0].free_period_months
  }
})

function warnBorder(days?: number) {
  if (days == null) return 'border-slate-100'
  if (days <= 15) return 'border-rose-400 bg-rose-50'
  if (days <= 30) return 'border-orange-300 bg-orange-50'
  if (days <= 60) return 'border-amber-300 bg-amber-50'
  return 'border-slate-100'
}

function payLabel(s: string) {
  return { NORMAL_PAID: '正常已付', PENDING_PAY: '待缴', OVERDUE_ARREARS: '逾期欠款' }[s] || s
}

function payClass(s: string) {
  return {
    NORMAL_PAID: 'bg-emerald-100 text-emerald-800',
    PENDING_PAY: 'bg-amber-100 text-amber-800',
    OVERDUE_ARREARS: 'bg-rose-100 text-rose-800',
  }[s]
}
</script>
