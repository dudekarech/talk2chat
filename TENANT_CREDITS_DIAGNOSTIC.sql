-- ===========================================================================
-- TENANT CREDITS DIAGNOSTIC QUERY
-- ===========================================================================
-- This SQL helps admins verify tenant-user relationships and credit balances
-- Run this in Supabase SQL Editor to identify any misconfigurations
-- ===========================================================================

-- 1. Overview: All tenants with their owners and credit balances
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.ai_credits_balance,
    t.owner_id,
    up.email as owner_email,
    up.name as owner_name,
    up.role as owner_role,
    (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id) as total_users,
    t.created_at,
    t.subscription_plan
FROM tenants t
LEFT JOIN user_profiles up ON t.owner_id = up.user_id
ORDER BY t.created_at DESC;

-- 2. Users without tenants (orphaned users)
SELECT 
    up.id as profile_id,
    up.user_id,
    up.email,
    up.name,
    up.tenant_id,
    up.role,
    up.status,
    up.created_at
FROM user_profiles up
WHERE up.tenant_id IS NULL
ORDER BY up.created_at DESC;

-- 3. Tenants without owners (system tenants)
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.ai_credits_balance,
    t.owner_id,
    t.subscription_plan,
    (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = t.id) as total_users
FROM tenants t
WHERE t.owner_id IS NULL
ORDER BY t.created_at DESC;

-- 4. Cross-reference: User's tenant_id vs Owner's tenant relationship
SELECT 
    up.email,
    up.name,
    up.tenant_id as user_tenant_id,
    t_user.name as user_tenant_name,
    t_owner.id as owned_tenant_id,
    t_owner.name as owned_tenant_name,
    CASE 
        WHEN up.tenant_id = t_owner.id THEN '✅ Correct'
        WHEN t_owner.id IS NOT NULL THEN '⚠️  Owner of different tenant'
        ELSE '✅ Not an owner'
    END as relationship_status
FROM user_profiles up
LEFT JOIN tenants t_user ON up.tenant_id = t_user.id
LEFT JOIN tenants t_owner ON t_owner.owner_id = up.user_id
ORDER BY relationship_status DESC, up.email;

-- 5. Credit balance verification for specific tenant
-- Replace 'YOUR_TENANT_ID' with actual tenant ID to check
/*
SELECT 
    t.id,
    t.name,
    t.ai_credits_balance,
    t.updated_at,
    (SELECT email FROM user_profiles WHERE user_id = t.owner_id) as owner_email
FROM tenants t
WHERE t.id = 'YOUR_TENANT_ID';
*/

-- 6. Recent credit changes (if you have audit logs)
/*
SELECT 
    al.created_at,
    al.action,
    al.table_name,
    al.record_id,
    al.user_id,
    (SELECT email FROM user_profiles WHERE user_id = al.user_id) as changed_by,
    al.changes
FROM audit_logs al
WHERE al.table_name = 'tenants'
  AND al.changes::text LIKE '%ai_credits_balance%'
ORDER BY al.created_at DESC
LIMIT 50;
*/
