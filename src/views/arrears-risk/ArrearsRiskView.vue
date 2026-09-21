<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-slate-900">租金欠缴风控催收与合同履约预警平台</h2>
      <p class="mt-1 text-sm text-slate-500">逾期账龄 · 滞纳金累加 · 律师函模板一键生成</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="corp-card p-5">
        <h3 class="mb-3 text-sm font-bold text-slate-800">逾期欠租账龄分布</h3>
        <div ref="chartRef" class="h-72 w-full" />
      </div>
      <div class="corp-card p-5">
        <h3 class="mb-3 text-sm font-bold text-slate-800">滞纳金自动累加器</h3>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="text-xs">
            欠缴本金（元）
            <input v-model.number="sim.principal" type="number" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label class="text-xs">
            逾期天数
            <input v-model.number="sim.days" type="number" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label class="text-xs">
            日利率
            <input v-model.number="sim.rate" type="number" step="0.0001" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>
        <p class="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          累计滞纳金：<strong>¥ {{ lateFee.toLocaleString() }}</strong>
          · 合计应催：<strong>¥ {{ (sim.principal + lateFee).toLocaleString() }}</strong>
        </p>
        <button class="corp-btn-primary mt-4" type="button" @click="showLetter = true">一键生成合规律师函预览</button>
      </div>
    </div>

    <div class="corp-card overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th class="px-4 py-3">工单号</th>
            <th class="px-4 py-3">承租企业</th>
            <th class="px-4 py-3">逾期/本金/滞纳金</th>
            <th class="px-4 py-3">风险等级</th>
            <th class="px-4 py-3">处置措施</th>
            <th class="px-4 py-3">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row.id" class="border-t border-slate-100">
            <td class="px-4 py-3 font-mono text-xs">{{ row.recovery_no }}</td>
            <td class="px-4 py-3 font-medium">{{ row.tenant_name }}</td>
            <td class="px-4 py-3">
              <p>{{ row.overdue_days }} 天</p>
              <p class="text-xs text-slate-500">
                本金 ¥{{ row.principal_arrears_amount.toLocaleString() }} · 滞纳金 ¥{{ row.accumulated_late_fee.toLocaleString() }}
              </p>
            </td>
            <td class="px-4 py-3">
              <span class="status-pill" :class="riskClass(row.risk_level)">{{ riskLabel(row.risk_level) }}</span>
            </td>
            <td class="max-w-xs px-4 py-3 text-xs leading-5 text-slate-600">{{ row.disposition_measure }}</td>
            <td class="px-4 py-3">{{ row.recovery_status }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showLetter" class="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4" @click.self="showLetter = false">
      <div class="corp-card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">律师催款函预览（演示）</h3>
          <button class="text-sm text-slate-500" type="button" @click="showLetter = false">关闭</button>
        </div>
        <div class="prose prose-sm mt-4 max-w-none whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
{{ letterText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { calcLateFee, getArrearsRecovery, type ArrearsRow } from '@/utils/sqljs-engine'

const list = ref<ArrearsRow[]>([])
const chartRef = ref<HTMLDivElement | null>(null)
const showLetter = ref(false)
const sim = reactive({ principal: 155000, days: 17, rate: 0.0005 })
let chart: echarts.ECharts | null = null

const lateFee = computed(() => calcLateFee(sim.principal, sim.days, sim.rate))

const letterText = computed(() => {
  const tenant = list.value[0]?.tenant_name || '相关承租企业'
  return `致：${tenant}

关于贵司拖欠绍兴柯桥经济技术开发区控股集团有限公司园区房屋租金事宜的律师函

本所受绍兴柯桥经济技术开发区控股集团有限公司（以下简称“我方委托人”）委托，就贵司逾期未支付租赁合同项下租金事宜，郑重致函如下：

一、贵司承租标的相关合同约定租金应按期足额支付。截至本函出具之日，贵司已逾期 ${sim.days} 日，欠缴租金本金人民币 ${sim.principal.toLocaleString()} 元，按合同约定累计滞纳金人民币 ${lateFee.value.toLocaleString()} 元。

二、请贵司自收到本函之日起五个工作日内，将上述款项全额支付至我方委托人指定账户，并就后续履约计划书面回复。

三、如逾期仍未履行，我方委托人将依法采取门禁权限降级、合同解除及司法诉讼等措施，由此产生的全部法律责任及费用由贵司承担。

特此函告。

绍兴柯桥经济技术开发区控股集团有限公司
委托律师事务所（演示模板）
${new Date().toLocaleDateString('zh-CN')}`
})

onMounted(async () => {
  list.value = await getArrearsRecovery()
  if (list.value[0]) {
    sim.principal = list.value[0].principal_arrears_amount
    sim.days = list.value[0].overdue_days
  }
  renderChart()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})

watch(list, renderChart)

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const buckets = [
    { name: '1-15天', value: 0 },
    { name: '16-30天', value: 0 },
    { name: '31-60天', value: 0 },
    { name: '60天以上', value: 0 },
  ]
  for (const row of list.value) {
    const d = row.overdue_days
    const amt = row.principal_arrears_amount + row.accumulated_late_fee
    if (d <= 15) buckets[0].value += amt
    else if (d <= 30) buckets[1].value += amt
    else if (d <= 60) buckets[2].value += amt
    else buckets[3].value += amt
  }
  // demo padding so chart is not empty-looking with single record
  if (buckets.every((b) => b.value === 0) === false) {
    buckets[0].value += 28000
    buckets[2].value += 42000
  }
  chart.setOption({
    color: ['#0369a1'],
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: buckets.map((b) => b.name) },
    yAxis: { type: 'value', name: '金额(元)' },
    series: [{ type: 'bar', data: buckets.map((b) => b.value), barWidth: 36, itemStyle: { borderRadius: [6, 6, 0, 0] } }],
  })
}

function resize() {
  chart?.resize()
}

function riskLabel(r: string) {
  return {
    LEVEL_BLUE_NOTICE: '蓝色温馨提醒',
    LEVEL_YELLOW_WARN: '黄色限期催告',
    LEVEL_RED_LEGAL: '红色法务诉讼',
  }[r] || r
}

function riskClass(r: string) {
  return {
    LEVEL_BLUE_NOTICE: 'bg-sky-100 text-sky-800',
    LEVEL_YELLOW_WARN: 'bg-amber-100 text-amber-800',
    LEVEL_RED_LEGAL: 'bg-rose-100 text-rose-800',
  }[r]
}
</script>
