import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, type SessionUser } from '@/stores/auth'
import type { RoleCode } from '@/utils/sqljs-engine'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: RoleCode[]
    title?: string
    layout?: 'auth' | 'main'
  }
}

const ALL_ROLES: RoleCode[] = [
  'ROLE_SUPER_ADMIN',
  'ROLE_ASSET_DIRECTOR',
  'ROLE_OFFICE_STAFF',
  'ROLE_DECISION_MAKER',
]

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: '用户登录', layout: 'auth' },
  },
  {
    path: '/tender',
    name: 'tender',
    component: () => import('@/views/auth/TenderView.vue'),
    meta: { requiresAuth: false, title: '公开招标公告', layout: 'auth' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      roles: ALL_ROLES,
      title: '国资运营全景驾驶舱',
      layout: 'main',
    },
  },
  {
    path: '/properties',
    name: 'properties',
    component: () => import('@/views/properties/PropertiesView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF'],
      title: '园区不动产全息台账',
      layout: 'main',
    },
  },
  {
    path: '/contracts',
    name: 'contracts',
    component: () => import('@/views/contracts/ContractsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF'],
      title: '租赁合同与动态计费',
      layout: 'main',
    },
  },
  {
    path: '/workflow-oa',
    name: 'workflow-oa',
    component: () => import('@/views/workflow-oa/WorkflowOaView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF', 'ROLE_DECISION_MAKER'],
      title: '智慧办公与三重一大',
      layout: 'main',
    },
  },
  {
    path: '/arrears-risk',
    name: 'arrears-risk',
    component: () => import('@/views/arrears-risk/ArrearsRiskView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF'],
      title: '欠费风控催缴平台',
      layout: 'main',
    },
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('@/views/system/SystemView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_DECISION_MAKER'],
      title: '系统总控与合规审计',
      layout: 'main',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.engineReady) {
    try {
      await auth.bootstrap()
    } catch {
      if (to.path !== '/tender' && to.path !== '/login') {
        return { path: '/login', query: { error: 'db' } }
      }
    }
  }

  document.title = `${to.meta.title || '柯桥经开区控股资产协同'} | 绍柯企〔2026〕983号`

  const requiresAuth = to.meta.requiresAuth !== false
  if (!requiresAuth) {
    if (to.path === '/login' && auth.isAuthenticated) return { path: '/' }
    return true
  }

  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  const roles = to.meta.roles as RoleCode[] | undefined
  if (roles && !auth.hasRole(roles)) {
    window.alert('当前角色无权访问该模块，已按 RBAC 矩阵阻断。')
    return { path: '/' }
  }

  return true
})

export function roleLabel(role: SessionUser['role'] | null | undefined) {
  const map: Record<RoleCode, string> = {
    ROLE_SUPER_ADMIN: '系统超管',
    ROLE_ASSET_DIRECTOR: '资产主管',
    ROLE_OFFICE_STAFF: '经办管家',
    ROLE_DECISION_MAKER: '决策长官',
  }
  return role ? map[role] : '访客'
}

export default router
