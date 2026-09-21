<template>
  <div class="auth-layout min-h-[calc(100vh-40px)]">
    <div class="auth-glow" aria-hidden="true" />
    <div class="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl flex-col px-4 py-8 md:px-8">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] text-sky-300">KEQIAO ECONOMIC DEVELOPMENT ZONE</p>
          <h1 class="mt-1 font-display text-xl font-bold text-white md:text-2xl">
            绍兴柯桥经开区控股 · 资产协同运营平台
          </h1>
        </div>
        <nav class="flex gap-2 text-sm">
          <RouterLink class="rounded-lg px-3 py-1.5 text-sky-100/90 hover:bg-white/10" to="/tender">
            招标公告
          </RouterLink>
          <RouterLink class="rounded-lg bg-sky-400/20 px-3 py-1.5 font-semibold text-sky-100 hover:bg-sky-400/30" to="/login">
            系统登录
          </RouterLink>
        </nav>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.auth-layout {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 58, 138, 0.88)),
    radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.35), transparent 40%),
    radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.25), transparent 35%),
    #0f172a;
}
.auth-glow {
  position: absolute;
  inset: auto -10% -20% 40%;
  height: 55%;
  background: radial-gradient(ellipse, rgba(56, 189, 248, 0.22), transparent 70%);
  filter: blur(20px);
  pointer-events: none;
}
</style>
