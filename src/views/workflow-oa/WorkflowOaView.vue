<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-slate-900">智慧办公 OA 与“三重一大”审批台</h2>
      <p class="mt-1 text-sm text-slate-500">发文/资产处置/重大投资/用印 · 党委会前置研究强联锁</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div class="space-y-4">
        <article
          v-for="doc in list"
          :key="doc.id"
          class="corp-card p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-mono text-xs text-slate-500">{{ doc.workflow_no }}</p>
              <h3 class="mt-1 text-base font-bold text-slate-900">{{ doc.title }}</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="status-pill bg-indigo-100 text-indigo-800">{{ categoryLabel(doc.doc_category) }}</span>
              <span v-if="doc.is_major_decision" class="status-pill bg-rose-100 text-rose-700">三重一大</span>
              <span class="status-pill" :class="statusClass(doc.flow_status)">{{ statusLabel(doc.flow_status) }}</span>
            </div>
          </div>

          <ol class="mt-5 space-y-0">
            <li
              v-for="(node, idx) in timeline(doc)"
              :key="node"
              class="relative flex gap-3 pb-5 pl-1"
            >
              <span
                class="mt-1 h-3 w-3 shrink-0 rounded-full"
                :class="idx <= activeIndex(doc) ? 'bg-sky-500' : 'bg-slate-300'"
              />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800">{{ node }}</p>
                <p class="text-xs text-slate-500">{{ idx === activeIndex(doc) ? '当前节点' : idx < activeIndex(doc) ? '已完成' : '待流转' }}</p>
              </div>
              <span
                v-if="idx < timeline(doc).length - 1"
                class="absolute left-[0.35rem] top-4 h-[calc(100%-0.5rem)] w-px bg-slate-200"
              />
            </li>
          </ol>

          <div class="flex flex-wrap gap-2">
            <button class="corp-btn-ghost !text-xs" type="button" @click="openDrawer(doc)">查验会议纪要附件</button>
            <button
              v-if="doc.flow_status === 'IN_PROGRESS' && canSign"
              class="corp-btn-primary !text-xs"
              type="button"
              @click="sign(doc.id)"
            >
              一键签批 · 电子印戳
            </button>
          </div>
        </article>
      </div>

      <aside class="corp-card h-fit p-5">
        <h3 class="text-sm font-bold text-slate-800">电子印戳面板</h3>
        <div class="mt-4 flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-sky-300 bg-gradient-to-br from-sky-50 to-indigo-50">
          <div class="stamp" :class="{ stamped: lastStamp }">
            <p class="text-[10px] tracking-widest">柯桥经开区控股</p>
            <p class="text-lg font-black">同意签发</p>
            <p class="text-[10px]">{{ lastStamp || '待签批' }}</p>
          </div>
        </div>
        <p class="mt-3 text-xs leading-5 text-slate-500">
          重大资产租赁与转让须挂接党委会或董事会纪要附件，保障国资监管程序合规。
        </p>
      </aside>
    </div>

    <div v-if="drawer" class="fixed inset-0 z-[10000] flex items-end justify-end bg-slate-900/40 p-4 md:items-center" @click.self="drawer = null">
      <div class="corp-card w-full max-w-md p-5">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-900">附件查验抽屉</h4>
          <button class="text-sm text-slate-500" type="button" @click="drawer = null">关闭</button>
        </div>
        <p class="mt-2 text-xs text-slate-500">{{ drawer.workflow_no }}</p>
        <ul class="mt-4 space-y-2">
          <li
            v-for="(f, i) in parseAttachments(drawer.attachment_records_json)"
            :key="i"
            class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <span>{{ f.file }}</span>
            <span class="text-xs text-slate-500">{{ f.size }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { approveWorkflow, getOaWorkflows, type OaWorkflowRow } from '@/utils/sqljs-engine'

const auth = useAuthStore()
const list = ref<OaWorkflowRow[]>([])
const drawer = ref<OaWorkflowRow | null>(null)
const lastStamp = ref('')

const canSign = computed(() =>
  auth.hasRole(['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_DECISION_MAKER']),
)

onMounted(async () => {
  list.value = await getOaWorkflows()
})

function timeline(doc: OaWorkflowRow) {
  if (doc.is_major_decision) {
    return ['经办起草', '资产运营部初审', '党委会审议', '董事长终签', '归档']
  }
  return ['经办起草', '部门复核', '办公室核稿', '签发归档']
}

function activeIndex(doc: OaWorkflowRow) {
  const nodes = timeline(doc)
  if (doc.flow_status === 'APPROVED_PASSED') return nodes.length - 1
  if (doc.flow_status === 'DRAFT') return 0
  const idx = nodes.findIndex((n) => n === doc.current_node_name || doc.current_node_name.includes(n.replace('审议', '')))
  if (idx >= 0) return idx
  if (doc.current_node_name.includes('党委')) return 2
  if (doc.current_node_name.includes('办结') || doc.current_node_name.includes('归档')) return nodes.length - 1
  return 1
}

async function sign(id: string) {
  await approveWorkflow(id)
  lastStamp.value = new Date().toLocaleString('zh-CN')
  list.value = await getOaWorkflows()
}

function openDrawer(doc: OaWorkflowRow) {
  drawer.value = doc
}

function parseAttachments(json: string): { file: string; size: string }[] {
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

function categoryLabel(c: string) {
  return {
    OFFICIAL_DISPATCH: '发文督办',
    ASSET_DISPOSAL: '资产处置出租',
    MAJOR_INVESTMENT: '重大项目决策',
    STAMP_APPLICATION: '用印申报',
  }[c] || c
}

function statusLabel(s: string) {
  return {
    DRAFT: '草稿',
    IN_PROGRESS: '流转中',
    APPROVED_PASSED: '已通过',
    REJECTED_TERMINATED: '已驳回',
  }[s] || s
}

function statusClass(s: string) {
  return {
    DRAFT: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    APPROVED_PASSED: 'bg-emerald-100 text-emerald-800',
    REJECTED_TERMINATED: 'bg-rose-100 text-rose-800',
  }[s]
}
</script>

<style scoped>
.stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  border: 3px solid #94a3b8;
  border-radius: 999px;
  color: #64748b;
  transform: rotate(-12deg);
  transition: all 0.35s ease;
}
.stamp.stamped {
  border-color: #be123c;
  color: #be123c;
  box-shadow: 0 0 0 4px rgba(190, 18, 60, 0.12);
}
</style>
