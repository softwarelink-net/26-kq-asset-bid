<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">园区不动产与固定资产全息台账</h2>
        <p class="mt-1 text-sm text-slate-500">地块-建筑-楼层-房间级联拓扑 · 闲置/在租/自用/抵押动态跟踪</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <select v-model="parkFilter" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">全部园区</option>
          <option v-for="p in parks" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="statusFilter" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">全部状态</option>
          <option value="VACANT">闲置</option>
          <option value="RENTED_ACTIVE">在租</option>
          <option value="SELF_USE">自用</option>
          <option value="MORTGAGED_LOCKED">抵押锁定</option>
        </select>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="corp-card p-4">
        <p class="text-xs text-slate-500">资产原值合计</p>
        <p class="mt-1 text-2xl font-bold text-indigo-900">¥ {{ formatMoney(totalValue) }}</p>
      </div>
      <div class="corp-card p-4">
        <p class="text-xs text-slate-500">建筑面积合计</p>
        <p class="mt-1 text-2xl font-bold text-sky-800">{{ totalArea.toLocaleString() }} ㎡</p>
      </div>
      <div class="corp-card p-4">
        <p class="text-xs text-slate-500">在租房源</p>
        <p class="mt-1 text-2xl font-bold text-emerald-700">{{ rented }}</p>
      </div>
      <div class="corp-card p-4">
        <p class="text-xs text-slate-500">闲置可招商</p>
        <p class="mt-1 text-2xl font-bold text-amber-700">{{ vacant }}</p>
      </div>
    </div>

    <div class="corp-card p-5">
      <h3 class="mb-4 text-sm font-bold text-slate-800">空间平面微缩网格</h3>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="item in list"
          :key="item.id"
          type="button"
          class="room-tile text-left"
          :class="statusClass(item.occupancy_status)"
          @click="cycleStatus(item)"
        >
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs font-bold opacity-80">{{ typeLabel(item.property_type) }}</span>
            <span class="status-pill bg-white/80 text-slate-700">{{ statusLabel(item.occupancy_status) }}</span>
          </div>
          <p class="mt-2 text-sm font-bold">{{ item.park_name }}</p>
          <p class="text-xs opacity-80">{{ item.building_no }} · {{ item.room_no }}</p>
          <p class="mt-3 text-xs">{{ item.property_code }}</p>
          <p class="mt-1 text-xs">{{ item.floor_area_sqm }}㎡ · 指导租金 ¥{{ item.current_market_rent_unit }}/㎡/天</p>
          <p class="mt-2 text-[11px] opacity-70">点击切换房态 · 资产原值 ¥{{ formatMoney(item.original_asset_value) }}</p>
        </button>
      </div>
    </div>

    <div class="corp-card overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">资产编码</th>
            <th class="px-4 py-3">园区/空间</th>
            <th class="px-4 py-3">类型</th>
            <th class="px-4 py-3">面积</th>
            <th class="px-4 py-3">状态</th>
            <th class="px-4 py-3">原值/折旧测算</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-t border-slate-100">
            <td class="px-4 py-3 font-mono text-xs">{{ item.property_code }}</td>
            <td class="px-4 py-3">
              <p class="font-medium">{{ item.park_name }}</p>
              <p class="text-xs text-slate-500">{{ item.building_no }} / {{ item.room_no }}</p>
            </td>
            <td class="px-4 py-3">{{ typeLabel(item.property_type) }}</td>
            <td class="px-4 py-3">{{ item.floor_area_sqm }} ㎡</td>
            <td class="px-4 py-3">
              <span class="status-pill" :class="pillClass(item.occupancy_status)">{{ statusLabel(item.occupancy_status) }}</span>
            </td>
            <td class="px-4 py-3">
              <p>¥{{ formatMoney(item.original_asset_value) }}</p>
              <p class="text-xs text-slate-500">年折旧(5%) ¥{{ formatMoney(item.original_asset_value * 0.05) }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getProperties, updatePropertyStatus, type PropertyRow } from '@/utils/sqljs-engine'

const list = ref<PropertyRow[]>([])
const parkFilter = ref('')
const statusFilter = ref('')

const parks = computed(() => [...new Set(list.value.map((i) => i.park_name))])
const totalValue = computed(() => list.value.reduce((s, i) => s + i.original_asset_value, 0))
const totalArea = computed(() => list.value.reduce((s, i) => s + i.floor_area_sqm, 0))
const rented = computed(() => list.value.filter((i) => i.occupancy_status === 'RENTED_ACTIVE').length)
const vacant = computed(() => list.value.filter((i) => i.occupancy_status === 'VACANT').length)

const statusOrder = ['VACANT', 'RENTED_ACTIVE', 'SELF_USE', 'MORTGAGED_LOCKED']

async function load() {
  list.value = await getProperties(parkFilter.value || undefined, statusFilter.value || undefined)
}

watch([parkFilter, statusFilter], load)
onMounted(load)

async function cycleStatus(item: PropertyRow) {
  const idx = statusOrder.indexOf(item.occupancy_status)
  const next = statusOrder[(idx + 1) % statusOrder.length]
  await updatePropertyStatus(item.id, next)
  await load()
}

function formatMoney(n: number) {
  return Math.round(n).toLocaleString('zh-CN')
}

function typeLabel(t: string) {
  const map: Record<string, string> = {
    STANDARD_WORKSHOP: '标准厂房',
    OFFICE_BUILDING: '商务写字楼',
    TALENT_APARTMENT: '人才公租房',
    COMMERCIAL_STORE: '临街商铺',
  }
  return map[t] || t
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    VACANT: '闲置',
    RENTED_ACTIVE: '在租',
    SELF_USE: '自用',
    MORTGAGED_LOCKED: '抵押锁定',
  }
  return map[s] || s
}

function statusClass(s: string) {
  return {
    VACANT: 'tile-vacant',
    RENTED_ACTIVE: 'tile-rented',
    SELF_USE: 'tile-self',
    MORTGAGED_LOCKED: 'tile-mortgage',
  }[s]
}

function pillClass(s: string) {
  return {
    VACANT: 'bg-amber-100 text-amber-800',
    RENTED_ACTIVE: 'bg-emerald-100 text-emerald-800',
    SELF_USE: 'bg-sky-100 text-sky-800',
    MORTGAGED_LOCKED: 'bg-rose-100 text-rose-800',
  }[s]
}
</script>

<style scoped>
.room-tile {
  border-radius: 14px;
  padding: 14px;
  border: 1px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.room-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}
.tile-vacant {
  background: linear-gradient(160deg, #fffbeb, #fef3c7);
  border-color: #fcd34d;
}
.tile-rented {
  background: linear-gradient(160deg, #ecfdf5, #a7f3d0);
  border-color: #34d399;
}
.tile-self {
  background: linear-gradient(160deg, #eff6ff, #bae6fd);
  border-color: #38bdf8;
}
.tile-mortgage {
  background: linear-gradient(160deg, #fff1f2, #fecdd3);
  border-color: #fb7185;
}
</style>
