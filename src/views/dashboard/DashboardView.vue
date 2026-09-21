<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">柯桥经开区国资运营全景态势大屏</h2>
        <p class="mt-1 text-sm text-slate-500">出租率 · 租金回款 · 园区贡献 · 行业分布 · 实时办结滚动</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="corp-btn-ghost !text-xs"
          type="button"
          @click="toggleFlag('FEATURE_AUTO_BILLING_DISPATCH')"
        >
          智能账单下发：{{ flagLabel('FEATURE_AUTO_BILLING_DISPATCH') }}
        </button>
        <button
          class="corp-btn-ghost !text-xs"
          type="button"
          @click="toggleFlag('FEATURE_SM4_TENANT_DATA_MASKING')"
        >
          国密脱敏：{{ flagLabel('FEATURE_SM4_TENANT_DATA_MASKING') }}
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="kpi in kpis" :key="kpi.label" class="corp-card p-4">
        <p class="text-xs text-slate-500">{{ kpi.label }}</p>
        <p class="mt-1 text-2xl font-bold" :class="kpi.color">{{ kpi.value }}</p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <div class="corp-card p-4">
        <h3 class="mb-2 text-sm font-bold text-slate-800">不动产综合出租率环形对比</h3>
        <div ref="ringRef" class="h-72 w-full" />
      </div>
      <div class="corp-card p-4">
        <h3 class="mb-2 text-sm font-bold text-slate-800">季度租金回款双轴走势</h3>
        <div ref="lineRef" class="h-72 w-full" />
      </div>
      <div class="corp-card p-4">
        <h3 class="mb-2 text-sm font-bold text-slate-800">产业园区租金贡献排行</h3>
        <div ref="barRef" class="h-72 w-full" />
      </div>
      <div class="corp-card p-4">
        <h3 class="mb-2 text-sm font-bold text-slate-800">承租企业行业分布气泡图</h3>
        <div ref="bubbleRef" class="h-72 w-full" />
      </div>
    </div>

    <div class="corp-card overflow-hidden">
      <div class="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">实时滚动通知</div>
      <div class="ticker-wrap relative h-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div class="ticker-track absolute inset-x-0 space-y-2 px-4 py-3" :style="{ animationDuration: '18s' }">
          <div
            v-for="(n, i) in notices"
            :key="i"
            class="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
          >
            {{ n }}
          </div>
          <div
            v-for="(n, i) in notices"
            :key="`dup-${i}`"
            class="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
          >
            {{ n }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  getDashboardStats,
  getSystemConfigs,
  setSystemConfig,
  type DashboardStats,
  type SystemConfigRow,
} from '@/utils/sqljs-engine'

const auth = useAuthStore()
const stats = ref<DashboardStats | null>(null)
const configs = ref<SystemConfigRow[]>([])

const ringRef = ref<HTMLDivElement | null>(null)
const lineRef = ref<HTMLDivElement | null>(null)
const barRef = ref<HTMLDivElement | null>(null)
const bubbleRef = ref<HTMLDivElement | null>(null)
const charts: echarts.ECharts[] = []

const kpis = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '综合出租率', value: `${s.occupancyRate}%`, color: 'text-sky-800' },
    { label: '资产原值总盘', value: `¥${(s.totalAssetValue / 10000).toFixed(0)}万`, color: 'text-indigo-900' },
    { label: '年度租金管道', value: `¥${(s.annualRentPipeline / 10000).toFixed(0)}万`, color: 'text-emerald-700' },
    { label: '欠费合计风险敞口', value: `¥${s.totalArrears.toLocaleString()}`, color: 'text-rose-700' },
  ]
})

const notices = computed(() => [
  `【租金到账】浙江恒泰纺织新材料科技有限公司已确认季度租金 ¥495,000`,
  `【公文办结】OA-DOC-202610-002 租金减免扶持政策发文已归档`,
  `【预警】HT-KQ-2026-089 距到期 ${stats.value?.expireWithin60 ? '不足60天' : '临近'}，请启动续租谈判`,
  `【催收】REC-KQ-2026-001 黄色催告函已送达绍兴云织数据技术有限公司`,
  `【Feature】智能账单自动下发当前为 ${flagLabel('FEATURE_AUTO_BILLING_DISPATCH')}`,
])

onMounted(async () => {
  stats.value = await getDashboardStats()
  configs.value = await getSystemConfigs()
  renderAll()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach((c) => c.dispose())
})

function flagLabel(key: string) {
  const v = configs.value.find((c) => c.config_key === key)?.config_value
  return v === 'true' ? '开' : '关'
}

async function toggleFlag(key: string) {
  if (!auth.hasRole(['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR'])) {
    window.alert('当前角色无权切换 Feature Flags')
    return
  }
  const cur = configs.value.find((c) => c.config_key === key)
  if (!cur) return
  const next = cur.config_value === 'true' ? 'false' : 'true'
  await setSystemConfig(key, next)
  configs.value = await getSystemConfigs()
}

function mountChart(el: HTMLDivElement | null) {
  if (!el) return null
  const c = echarts.init(el)
  charts.push(c)
  return c
}

function renderAll() {
  const s = stats.value
  if (!s) return

  mountChart(ringRef.value)?.setOption({
    color: ['#0ea5e9', '#f59e0b', '#6366f1', '#fb7185'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        label: { formatter: '{b}\n{d}%' },
        data: [
          { name: '在租', value: s.rentedCount },
          { name: '闲置', value: s.vacantCount },
          { name: '其他', value: Math.max(s.totalProperties - s.rentedCount - s.vacantCount, 0) },
        ],
      },
    ],
  })

  mountChart(lineRef.value)?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['已回款', '计划应收'] },
    grid: { left: 50, right: 40, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: s.quarterlyRentSeries.map((i) => i.quarter) },
    yAxis: [
      { type: 'value', name: '回款' },
      { type: 'value', name: '计划', splitLine: { show: false } },
    ],
    series: [
      {
        name: '已回款',
        type: 'line',
        smooth: true,
        data: s.quarterlyRentSeries.map((i) => i.collected),
        areaStyle: { color: 'rgba(14,165,233,0.15)' },
        itemStyle: { color: '#0284c7' },
      },
      {
        name: '计划应收',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: s.quarterlyRentSeries.map((i) => i.planned),
        itemStyle: { color: '#4f46e5' },
      },
    ],
  })

  mountChart(barRef.value)?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 110, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: s.parkRentContribution.map((i) => i.park),
    },
    series: [
      {
        type: 'bar',
        data: s.parkRentContribution.map((i) => i.rent),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1e3a8a' },
            { offset: 1, color: '#38bdf8' },
          ]),
        },
      },
    ],
  })

  mountChart(bubbleRef.value)?.setOption({
    tooltip: {
      formatter: (p: unknown) => {
        const item = p as { data: number[] }
        const [x, y, , name] = item.data
        return `${name}<br/>贡献指数 ${x}<br/>活跃度 ${y}`
      },
    },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: { name: '租金贡献指数', splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { name: '活跃度', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        type: 'scatter',
        symbolSize: (data: number[]) => data[2],
        data: s.industryBubbles.map((b, idx) => [b.value, 40 + idx * 12, Math.max(b.value / 2, 20), b.name, b.industry]),
        itemStyle: { color: '#0369a1', opacity: 0.75 },
      },
    ],
  })
}

function onResize() {
  charts.forEach((c) => c.resize())
}
</script>

<style scoped>
.ticker-track {
  animation-name: ticker-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes ticker-scroll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}
</style>
