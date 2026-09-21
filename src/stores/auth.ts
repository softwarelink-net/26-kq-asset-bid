import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  clearSession,
  getSession,
  initSqlEngine,
  login as sqlLogin,
  logout as sqlLogout,
  type RoleCode,
  type UserRow,
} from '@/utils/sqljs-engine'

export type SessionUser = Omit<UserRow, 'password_hash'>

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SessionUser | null>(getSession())
  const engineReady = ref(false)
  const bootError = ref('')

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)

  async function bootstrap() {
    try {
      await initSqlEngine()
      engineReady.value = true
      user.value = getSession()
    } catch (e) {
      bootError.value = e instanceof Error ? e.message : 'SQLite 引擎初始化失败'
      throw e
    }
  }

  async function login(username: string, password: string) {
    const session = await sqlLogin(username, password)
    user.value = session
    return session
  }

  function logout() {
    sqlLogout()
    user.value = null
  }

  function hasRole(roles?: RoleCode[]) {
    if (!roles || roles.length === 0) return true
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  function clearLocalSession() {
    clearSession()
    user.value = null
  }

  return {
    user,
    engineReady,
    bootError,
    isAuthenticated,
    role,
    bootstrap,
    login,
    logout,
    hasRole,
    clearLocalSession,
  }
})
