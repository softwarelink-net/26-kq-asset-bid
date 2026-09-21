<template>
  <article class="corp-card mx-auto max-w-4xl overflow-hidden text-slate-800">
    <header class="bg-gradient-to-r from-slate-900 via-indigo-900 to-sky-800 px-6 py-7 text-white md:px-8">
      <p class="text-xs font-semibold tracking-[0.18em] text-sky-200">PUBLIC TENDER NOTICE</p>
      <h2 class="mt-2 text-xl font-bold leading-relaxed md:text-2xl">
        绍兴柯桥经济技术开发区控股集团有限公司资产管理及智慧办公系统服务采购项目招标公告
      </h2>
      <p class="mt-3 text-sm text-sky-100/90">项目编号：绍柯企〔2026〕983号 · 发布时间：2026-09-17 10:00:00</p>
    </header>

    <div class="space-y-6 px-6 py-7 md:px-8">
      <section v-for="block in blocks" :key="block.title">
        <h3 class="mb-2 border-l-4 border-sky-500 pl-3 text-base font-bold text-slate-900">{{ block.title }}</h3>
        <div class="rounded-xl bg-slate-50/90 px-4 py-3 text-sm leading-7 text-slate-700">
          <p v-for="(line, i) in block.lines" :key="i">{{ line }}</p>
          <ul v-if="block.bullets" class="mt-2 list-disc space-y-1 pl-5">
            <li v-for="(b, i) in block.bullets" :key="i">{{ b }}</li>
          </ul>
        </div>
      </section>

      <section class="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
        <h3 class="text-base font-bold text-sky-900">乐采云平台电子投标指引</h3>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-sky-950/80">
          <li>登录浙江省政府采购乐采云平台，检索项目编号「绍柯企〔2026〕983号」。</li>
          <li>在线获取招标文件并完成供应商注册与 CA 数字证书绑定。</li>
          <li>按系统提示上传投标文件，截止时间：2026年09月29日09:30。</li>
          <li>本项目不接受联合体投标，预算及最高限价均为 604,000.00 元。</li>
        </ol>
      </section>

      <div class="flex flex-wrap gap-3">
        <RouterLink class="corp-btn-primary" to="/login">进入系统演示登录</RouterLink>
        <a
          class="corp-btn-ghost"
          href="https://github.com/softwarelink-net/26-kq-asset-bid"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看源码仓库
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
const blocks = [
  {
    title: '1. 标题',
    lines: ['绍兴柯桥经济技术开发区控股集团有限公司资产管理及智慧办公系统服务采购项目招标公告'],
  },
  {
    title: '2. 项目发包方',
    lines: ['绍兴柯桥经济技术开发区控股集团有限公司'],
  },
  {
    title: '3. 项目编号',
    lines: ['绍柯企〔2026〕983号'],
  },
  {
    title: '4. 项目发布时间',
    lines: ['2026-09-17 10:00:00'],
  },
  {
    title: '5. 关键词',
    lines: [
      '绍兴柯桥经开区控股集团, 资产管理系统, 智慧办公系统, 乐采云平台, 绍柯企〔2026〕983号, 浙江国企采购, 国资数字化',
    ],
  },
  {
    title: '6. 摘要',
    lines: [
      '绍兴柯桥经济技术开发区控股集团有限公司委托浙江越锋项目管理有限公司，对资产管理及智慧办公系统服务采购项目组织公开招标，预算金额与最高限价为604,000.00元。采购内容为资产管理及智慧办公系统服务1项，不接受联合体投标，采用乐采云平台线上全流程电子化招投标，投标文件递交截止时间为2026年09月29日09:30。',
    ],
  },
  {
    title: '7. 技术要点',
    lines: [],
    bullets: [
      '经开区不动产空间台账全生命周期建模与可视化房态管理：精准纳管厂房、商业与公寓。',
      '租赁合同动态阶梯计费、免租期核算与到期多级自动预警：防止国有资产收益漏收流失。',
      '智慧办公 OA 与“三重一大”国资审批强联锁闭环：保障资产重大调拨程序合规。',
      '纯前端 WebAssembly sql.js 边缘极速响应体系：零服务器常驻运维开销，数据本地极简持久化。',
    ],
  },
  {
    title: '8. 技术创新性',
    lines: [],
    bullets: [
      '全要素经开区国有资产经营与履约风险数字孪生驾驶舱：宏观掌控资产出租率、租金收益现金流与欠费风控指标。',
      '统一业务命名空间严格隔离架构：统一采用专用数据表前缀与独立本地存储载体，杜绝多系统交叉干扰。',
    ],
  },
]
</script>
