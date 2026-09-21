import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js'

export type RoleCode =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_ASSET_DIRECTOR'
  | 'ROLE_OFFICE_STAFF'
  | 'ROLE_DECISION_MAKER'

export interface UserRow {
  id: string
  username: string
  password_hash: string
  full_name: string
  dept_name: string
  role: RoleCode
  phone: string | null
  staff_code: string
  status: number
}

export interface PropertyRow {
  id: string
  property_code: string
  park_name: string
  building_no: string
  room_no: string
  property_type: string
  floor_area_sqm: number
  occupancy_status: string
  original_asset_value: number
  current_market_rent_unit: number
  created_at?: string
}

export interface LeaseContractRow {
  id: string
  contract_no: string
  property_id: string
  property_name_desc: string
  tenant_name: string
  tenant_legal_person_masked: string
  lease_start_date: string
  lease_end_date: string
  free_period_months: number
  annual_rent_amount: number
  annual_increment_pct: number
  deposit_guarantee_amount: number
  next_payment_due_date: string
  payment_status: string
  audit_approval_doc: string
  created_at?: string
  days_to_expire?: number
}

export interface OaWorkflowRow {
  id: string
  workflow_no: string
  title: string
  doc_category: string
  initiator_name: string
  current_node_name: string
  is_major_decision: number
  attachment_records_json: string
  flow_status: string
  submitted_at: string
  final_signed_at: string | null
}

export interface ArrearsRow {
  id: string
  recovery_no: string
  contract_id: string
  tenant_name: string
  overdue_days: number
  principal_arrears_amount: number
  accumulated_late_fee: number
  risk_level: string
  disposition_measure: string
  handler_staff_name: string
  recovery_status: string
  updated_at?: string
}

export interface AuditLogRow {
  id: string
  user_id: string | null
  username: string | null
  action_name: string
  target_resource: string
  ip_address: string | null
  request_uri: string | null
  status_code: number | null
  created_at: string
}

export interface SystemConfigRow {
  config_key: string
  config_value: string
  category: string
  description: string | null
  updated_at?: string
}

export interface DashboardStats {
  totalProperties: number
  rentedCount: number
  vacantCount: number
  occupancyRate: number
  totalAssetValue: number
  annualRentPipeline: number
  overdueContracts: number
  pendingMajorDocs: number
  expireWithin60: number
  totalArrears: number
  parkRentContribution: { park: string; rent: number }[]
  quarterlyRentSeries: { quarter: string; collected: number; planned: number }[]
  industryBubbles: { name: string; value: number; industry: string }[]
}

const SESSION_KEY = 'kqasset_session_v1'
const DB_CACHE_KEY = 'kqasset_sqlite_blob_v1'

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let readyPromise: Promise<void> | null = null

function rowsFromExec<T>(sql: string, params: SqlValue[] = []): T[] {
  if (!db) return []
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return rows
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function persistDb() {
  if (!db) return
  try {
    const exported = db.export()
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < exported.length; i += chunk) {
      binary += String.fromCharCode(...exported.subarray(i, i + chunk))
    }
    localStorage.setItem(DB_CACHE_KEY, btoa(binary))
  } catch {
    // ignore quota errors
  }
}

function loadCachedDb(): Uint8Array | null {
  try {
    const raw = localStorage.getItem(DB_CACHE_KEY)
    if (!raw) return null
    const binary = atob(raw)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

export async function initSqlEngine(): Promise<void> {
  if (readyPromise) return readyPromise
  readyPromise = (async () => {
    SQL = await initSqlJs({
      locateFile: (file: string) => `/sql-wasm/${file}`,
    })
    const cached = loadCachedDb()
    if (cached) {
      db = new SQL.Database(cached)
      return
    }
    const resp = await fetch('/data/kqasset_database.sqlite')
    if (!resp.ok) {
      throw new Error(`无法加载本地 SQLite 数据包: ${resp.status}`)
    }
    const buffer = new Uint8Array(await resp.arrayBuffer())
    db = new SQL.Database(buffer)
  })()
  return readyPromise
}

export function getSession(): Omit<UserRow, 'password_hash'> | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Omit<UserRow, 'password_hash'>) : null
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export async function login(username: string, password: string): Promise<Omit<UserRow, 'password_hash'>> {
  await initSqlEngine()
  const hash = await sha256Hex(password)
  const users = rowsFromExec<UserRow>(
    `SELECT * FROM kqasset_users WHERE username = ? AND status = 1 LIMIT 1`,
    [username.trim()],
  )
  const user = users[0]
  if (!user || user.password_hash !== hash) {
    throw new Error('账号或密码错误，请核对演示账号后重试')
  }
  const session = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    dept_name: user.dept_name,
    role: user.role,
    phone: user.phone,
    staff_code: user.staff_code,
    status: user.status,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  writeAuditLog({
    user_id: user.id,
    username: user.username,
    action_name: 'USER_LOGIN',
    target_resource: user.username,
    request_uri: '/login',
    status_code: 200,
  })
  return session
}

export function logout() {
  const session = getSession()
  if (session) {
    writeAuditLog({
      user_id: session.id,
      username: session.username,
      action_name: 'USER_LOGOUT',
      target_resource: session.username,
      request_uri: '/logout',
      status_code: 200,
    })
  }
  clearSession()
}

export function writeAuditLog(payload: {
  user_id?: string | null
  username?: string | null
  action_name: string
  target_resource: string
  request_uri?: string
  status_code?: number
}) {
  if (!db) return
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  db.run(
    `INSERT INTO kqasset_audit_logs (id, user_id, username, action_name, target_resource, ip_address, request_uri, status_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.user_id ?? null,
      payload.username ?? null,
      payload.action_name,
      payload.target_resource,
      '127.0.0.1',
      payload.request_uri ?? '',
      payload.status_code ?? 200,
    ],
  )
  persistDb()
}

export async function getProperties(parkName?: string, status?: string): Promise<PropertyRow[]> {
  await initSqlEngine()
  let sql = `SELECT * FROM kqasset_properties WHERE 1=1`
  const params: SqlValue[] = []
  if (parkName) {
    sql += ` AND park_name = ?`
    params.push(parkName)
  }
  if (status) {
    sql += ` AND occupancy_status = ?`
    params.push(status)
  }
  sql += ` ORDER BY park_name, property_code`
  return rowsFromExec<PropertyRow>(sql, params)
}

export async function updatePropertyStatus(id: string, status: string): Promise<void> {
  await initSqlEngine()
  db!.run(`UPDATE kqasset_properties SET occupancy_status = ? WHERE id = ?`, [status, id])
  persistDb()
}

export async function getLeaseContracts(): Promise<LeaseContractRow[]> {
  await initSqlEngine()
  const rows = rowsFromExec<LeaseContractRow>(
    `SELECT *, CAST(julianday(lease_end_date) - julianday('now') AS INTEGER) AS days_to_expire
     FROM kqasset_lease_contracts
     ORDER BY lease_end_date ASC`,
  )
  return rows
}

export async function getOaWorkflows(): Promise<OaWorkflowRow[]> {
  await initSqlEngine()
  return rowsFromExec<OaWorkflowRow>(
    `SELECT * FROM kqasset_oa_workflows ORDER BY submitted_at DESC`,
  )
}

export async function approveWorkflow(id: string, nodeName = '董事长终签'): Promise<void> {
  await initSqlEngine()
  db!.run(
    `UPDATE kqasset_oa_workflows
     SET flow_status = 'APPROVED_PASSED', current_node_name = ?, final_signed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nodeName, id],
  )
  const session = getSession()
  writeAuditLog({
    user_id: session?.id,
    username: session?.username,
    action_name: 'WORKFLOW_APPROVE',
    target_resource: id,
    request_uri: '/workflow-oa',
  })
}

export async function getArrearsRecovery(): Promise<ArrearsRow[]> {
  await initSqlEngine()
  return rowsFromExec<ArrearsRow>(
    `SELECT * FROM kqasset_arrears_recovery ORDER BY overdue_days DESC`,
  )
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  await initSqlEngine()
  return rowsFromExec<AuditLogRow>(
    `SELECT * FROM kqasset_audit_logs ORDER BY created_at DESC LIMIT 100`,
  )
}

export async function getSystemConfigs(): Promise<SystemConfigRow[]> {
  await initSqlEngine()
  return rowsFromExec<SystemConfigRow>(`SELECT * FROM kqasset_system_configs ORDER BY category, config_key`)
}

export async function setSystemConfig(key: string, value: string): Promise<void> {
  await initSqlEngine()
  db!.run(
    `UPDATE kqasset_system_configs SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?`,
    [value, key],
  )
  const session = getSession()
  writeAuditLog({
    user_id: session?.id,
    username: session?.username,
    action_name: 'FEATURE_FLAG_TOGGLE',
    target_resource: `${key}=${value}`,
    request_uri: '/system',
  })
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await initSqlEngine()
  const props = await getProperties()
  const contracts = await getLeaseContracts()
  const workflows = await getOaWorkflows()
  const arrears = await getArrearsRecovery()

  const rentedCount = props.filter((p) => p.occupancy_status === 'RENTED_ACTIVE').length
  const vacantCount = props.filter((p) => p.occupancy_status === 'VACANT').length
  const totalProperties = props.length
  const occupancyRate = totalProperties ? Math.round((rentedCount / totalProperties) * 1000) / 10 : 0
  const totalAssetValue = props.reduce((s, p) => s + Number(p.original_asset_value || 0), 0)
  const annualRentPipeline = contracts.reduce((s, c) => s + Number(c.annual_rent_amount || 0), 0)
  const overdueContracts = contracts.filter((c) => c.payment_status === 'OVERDUE_ARREARS').length
  const pendingMajorDocs = workflows.filter(
    (w) => w.is_major_decision === 1 && w.flow_status === 'IN_PROGRESS',
  ).length
  const expireWithin60 = contracts.filter((c) => Number(c.days_to_expire ?? 999) <= 60).length
  const totalArrears = arrears.reduce(
    (s, a) => s + Number(a.principal_arrears_amount || 0) + Number(a.accumulated_late_fee || 0),
    0,
  )

  const parkMap = new Map<string, number>()
  for (const c of contracts) {
    const prop = props.find((p) => p.id === c.property_id)
    const park = prop?.park_name ?? '其他园区'
    parkMap.set(park, (parkMap.get(park) || 0) + Number(c.annual_rent_amount || 0))
  }
  const parkRentContribution = [...parkMap.entries()]
    .map(([park, rent]) => ({ park, rent }))
    .sort((a, b) => b.rent - a.rent)

  const quarterlyRentSeries = [
    { quarter: '2026Q1', collected: 620000, planned: 650000 },
    { quarter: '2026Q2', collected: 710000, planned: 700000 },
    { quarter: '2026Q3', collected: 680000, planned: 720000 },
    { quarter: '2026Q4', collected: 540000, planned: 750000 },
  ]

  const industryBubbles = [
    { name: '恒泰纺织', value: 198, industry: '纺织新材料' },
    { name: '云织数据', value: 62, industry: '数字经济' },
    { name: '印染智造', value: 145, industry: '高端印染' },
    { name: '轻纺物流', value: 88, industry: '现代物流' },
    { name: '人才公寓', value: 36, industry: '居住配套' },
  ]

  return {
    totalProperties,
    rentedCount,
    vacantCount,
    occupancyRate,
    totalAssetValue,
    annualRentPipeline,
    overdueContracts,
    pendingMajorDocs,
    expireWithin60,
    totalArrears,
    parkRentContribution,
    quarterlyRentSeries,
    industryBubbles,
  }
}

export function calcSteppedRent(baseAnnual: number, years: number, incrementPct: number, freeMonths: number) {
  const schedule: { year: number; amount: number; note: string }[] = []
  let current = baseAnnual
  for (let y = 1; y <= years; y += 1) {
    let amount = current
    let note = `年递增 ${incrementPct}%`
    if (y === 1 && freeMonths > 0) {
      amount = current * ((12 - freeMonths) / 12)
      note = `免租期 ${freeMonths} 个月扣减`
    }
    schedule.push({ year: y, amount: Math.round(amount * 100) / 100, note })
    current = current * (1 + incrementPct / 100)
  }
  return schedule
}

export function calcLateFee(principal: number, overdueDays: number, dailyRate = 0.0005) {
  return Math.round(principal * overdueDays * dailyRate * 100) / 100
}
