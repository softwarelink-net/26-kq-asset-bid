-- 绍兴柯桥经济技术开发区控股集团有限公司资产管理及智慧办公系统
-- 项目编号: 绍柯企〔2026〕983号
-- 统一表前缀: kqasset_

-- 1. 用户与国企管理人员信息表 (Users)
CREATE TABLE IF NOT EXISTS kqasset_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dept_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ROLE_SUPER_ADMIN', 'ROLE_ASSET_DIRECTOR', 'ROLE_OFFICE_STAFF', 'ROLE_DECISION_MAKER')),
    phone TEXT,
    staff_code TEXT NOT NULL UNIQUE,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 系统全局配置与 Feature Flags (System Configs)
CREATE TABLE IF NOT EXISTS kqasset_system_configs (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 园区不动产与空间房源资产台账表 (Real Estate Properties Master)
CREATE TABLE IF NOT EXISTS kqasset_properties (
    id TEXT PRIMARY KEY,
    property_code TEXT NOT NULL UNIQUE,
    park_name TEXT NOT NULL,
    building_no TEXT NOT NULL,
    room_no TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK(property_type IN ('STANDARD_WORKSHOP', 'OFFICE_BUILDING', 'TALENT_APARTMENT', 'COMMERCIAL_STORE')),
    floor_area_sqm REAL NOT NULL,
    occupancy_status TEXT DEFAULT 'VACANT' CHECK(occupancy_status IN ('VACANT', 'RENTED_ACTIVE', 'SELF_USE', 'MORTGAGED_LOCKED')),
    original_asset_value REAL NOT NULL,
    current_market_rent_unit REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 租赁合同台账与动态计费计划表 (Lease Contracts & Billing Schedules)
CREATE TABLE IF NOT EXISTS kqasset_lease_contracts (
    id TEXT PRIMARY KEY,
    contract_no TEXT NOT NULL UNIQUE,
    property_id TEXT NOT NULL,
    property_name_desc TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    tenant_legal_person_masked TEXT NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    free_period_months INTEGER DEFAULT 1,
    annual_rent_amount REAL NOT NULL,
    annual_increment_pct REAL DEFAULT 3.0,
    deposit_guarantee_amount REAL NOT NULL,
    next_payment_due_date DATE NOT NULL,
    payment_status TEXT DEFAULT 'NORMAL_PAID' CHECK(payment_status IN ('NORMAL_PAID', 'PENDING_PAY', 'OVERDUE_ARREARS')),
    audit_approval_doc TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES kqasset_properties(id)
);

-- 5. 智慧办公 OA 与“三重一大”审批流转表 (Smart OA & Decision Flows)
CREATE TABLE IF NOT EXISTS kqasset_oa_workflows (
    id TEXT PRIMARY KEY,
    workflow_no TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    doc_category TEXT NOT NULL CHECK(doc_category IN ('OFFICIAL_DISPATCH', 'ASSET_DISPOSAL', 'MAJOR_INVESTMENT', 'STAMP_APPLICATION')),
    initiator_name TEXT NOT NULL,
    current_node_name TEXT NOT NULL,
    is_major_decision INTEGER DEFAULT 1,
    attachment_records_json TEXT NOT NULL,
    flow_status TEXT DEFAULT 'IN_PROGRESS' CHECK(flow_status IN ('DRAFT', 'IN_PROGRESS', 'APPROVED_PASSED', 'REJECTED_TERMINATED')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    final_signed_at DATETIME
);

-- 6. 租金欠缴风控与法务催收工单表 (Arrears Risk & Recovery Orders)
CREATE TABLE IF NOT EXISTS kqasset_arrears_recovery (
    id TEXT PRIMARY KEY,
    recovery_no TEXT NOT NULL UNIQUE,
    contract_id TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    overdue_days INTEGER NOT NULL,
    principal_arrears_amount REAL NOT NULL,
    accumulated_late_fee REAL NOT NULL,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('LEVEL_BLUE_NOTICE', 'LEVEL_YELLOW_WARN', 'LEVEL_RED_LEGAL')),
    disposition_measure TEXT NOT NULL,
    handler_staff_name TEXT NOT NULL,
    recovery_status TEXT DEFAULT '催缴中' CHECK(recovery_status IN ('催缴中', '已达成还款协议', '已结清核销', '司法诉讼介入')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(contract_id) REFERENCES kqasset_lease_contracts(id)
);

-- 7. 国企内控操作与涉密安全审计日志表 (Security Audit Trail)
CREATE TABLE IF NOT EXISTS kqasset_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    action_name TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    ip_address TEXT,
    request_uri TEXT,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 种子数据初始化 (Seed Data)
-- ==============================================================================

-- 注入演示用户 (password_hash 对应 README 演示口令 SHA-256)
INSERT OR REPLACE INTO kqasset_users (id, username, password_hash, full_name, dept_name, role, phone, staff_code) VALUES
('u-01', 'admin', 'a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408', '系统管理员', '集团综合办公室', 'ROLE_SUPER_ADMIN', '0575-85629487', 'KQ-CORP-TECH01'),
('u-02', 'asset_lead', '94b0537bf20887ddc060910c263c163b588dbc84e4ebc69616b5d2e323600470', '王部长', '资产运营管理部', 'ROLE_ASSET_DIRECTOR', '0575-85746096', 'KQ-CORP-DIR08'),
('u-03', 'officer', '5b6d655995c6ce7c95efd177fb3a147d241bfb1be9d932bf754262fd56e60da5', '余专员', '园区招商服务处', 'ROLE_OFFICE_STAFF', '0575-85562277', 'KQ-CORP-OFF16'),
('u-04', 'leader', '937a6719c6edac6d47c09c4f08ed2c473e5c758cb1fcc2b6b9f7d0ab99aaa6d7', '集团分管领导', '集团领导班子办公室', 'ROLE_DECISION_MAKER', '0575-85620419', 'KQ-CORP-LEAD01');

-- 注入 Feature Flags 与系统全局配置
INSERT OR REPLACE INTO kqasset_system_configs (config_key, config_value, category, description) VALUES
('FEATURE_AUTO_BILLING_DISPATCH', 'true', 'FINANCE_ENGINE', '每月初系统是否自动向承租企业推送账单及电子交费通知二维码'),
('FEATURE_SM4_TENANT_DATA_MASKING', 'true', 'SECURITY', '对承租单位法人身份证号、银行开户账号及优惠底牌启用国密 SM4 动态列级脱敏'),
('LEASE_EXPIRE_REMINDER_DAYS', '60', 'POLICY', '租约合同到期前在集团资产大屏与经办端自动弹窗预警的时限天数');

-- 注入园区不动产房源台账
INSERT OR REPLACE INTO kqasset_properties (id, property_code, park_name, building_no, room_no, property_type, floor_area_sqm, occupancy_status, original_asset_value, current_market_rent_unit) VALUES
('prop-01', 'AST-KQ-BLUESKY-01-102', '蓝天纺织工业园', '1号高端智造车间', '102整层', 'STANDARD_WORKSHOP', 4500.0, 'RENTED_ACTIVE', 18500000.0, 1.25),
('prop-02', 'AST-KQ-DIGITAL-A-301', '柯北数字科技园', 'A座综合研发楼', '301室', 'OFFICE_BUILDING', 820.0, 'RENTED_ACTIVE', 6800000.0, 2.10),
('prop-03', 'AST-KQ-TALENT-B-508', '轻纺人才公租房', 'B栋专家公寓', '508室', 'TALENT_APARTMENT', 65.0, 'VACANT', 420000.0, 1.50),
('prop-04', 'AST-KQ-COMMERCE-01', '柯北新城核心商业街', '临街综合楼', 'D-12商铺', 'COMMERCIAL_STORE', 180.0, 'VACANT', 2400000.0, 3.80);

-- 注入租赁合同数据
INSERT OR REPLACE INTO kqasset_lease_contracts (id, contract_no, property_id, property_name_desc, tenant_name, tenant_legal_person_masked, lease_start_date, lease_end_date, free_period_months, annual_rent_amount, annual_increment_pct, deposit_guarantee_amount, next_payment_due_date, payment_status, audit_approval_doc) VALUES
('ht-01', 'HT-KQ-2026-088', 'prop-01', '蓝天纺织工业园1号车间102', '浙江恒泰纺织新材料科技有限公司', '陈总(138****6688)', '2024-01-01', '2028-12-31', 2, 1980000.0, 3.0, 495000.0, '2026-10-15', 'NORMAL_PAID', '柯经控股办〔2024〕12号'),
('ht-02', 'HT-KQ-2026-089', 'prop-02', '柯北数字科技园A座301室', '绍兴云织数据技术有限公司', '李经理(139****1122)', '2025-06-01', '2026-11-30', 1, 620000.0, 5.0, 155000.0, '2026-09-01', 'OVERDUE_ARREARS', '柯经控股办〔2025〕35号');

-- 注入智慧办公 OA 与“三重一大”流转
INSERT OR REPLACE INTO kqasset_oa_workflows (id, workflow_no, title, doc_category, initiator_name, current_node_name, is_major_decision, attachment_records_json, flow_status, final_signed_at) VALUES
('oa-01', 'OA-DOC-202610-001', '关于蓝天产业园闲置仓储用房公开挂牌招租底价审议的请示', 'ASSET_DISPOSAL', '余专员', '党委会审议', 1, '[{"file":"第三方资产评估基准书.pdf","size":"4.2MB"},{"file":"集团党委会前置研究纪要.docx","size":"1.8MB"}]', 'IN_PROGRESS', NULL),
('oa-02', 'OA-DOC-202610-002', '2026年三季度区属重点产业园区租金减免扶持政策落实发文', 'OFFICIAL_DISPATCH', '王部长', '已办结归档', 0, '[{"file":"柯桥区助企纾困租金补贴细则.pdf","size":"2.5MB"}]', 'APPROVED_PASSED', '2026-09-15 16:30:00');

-- 注入租金欠缴催收流水
INSERT OR REPLACE INTO kqasset_arrears_recovery (id, recovery_no, contract_id, tenant_name, overdue_days, principal_arrears_amount, accumulated_late_fee, risk_level, disposition_measure, handler_staff_name, recovery_status) VALUES
('rec-01', 'REC-KQ-2026-001', 'ht-02', '绍兴云织数据技术有限公司', 17, 155000.0, 3952.5, 'LEVEL_YELLOW_WARN', '已向企业财务发送二次书面催款告诫函，电话约谈法人代表，拟于本月底前结清', '余专员', '催缴中');

-- 注入审计日志
INSERT OR REPLACE INTO kqasset_audit_logs (id, user_id, username, action_name, target_resource, ip_address, request_uri, status_code) VALUES
('log-01', 'u-02', 'asset_lead', 'CONTRACT_SIGN', 'HT-KQ-2026-088', '192.168.10.15', '/api/contracts/audit-sign', 200),
('log-02', 'u-03', 'officer', 'RENT_RELIEF_OVERRIDE', 'REC-KQ-2026-001', '192.168.10.45', '/api/arrears/defer-action', 200);
