# 🚨 CRITICAL: Widget Configuration Multi-Tenancy Isolation Issue

## Problem Identified

There's a **CRITICAL multi-tenancy violation** in the widget configuration system where:

1. **Tenants can modify the global TalkChat widget** (landing page)
2. **Global admin can modify tenant widgets**
3. **All configurations are bleeding into each other**

## Root Cause Analysis

### Database Schema Issues

#### 1. UNIQUE Constraint Problem
In `global_widget_config` table:
```sql
config_key TEXT UNIQUE NOT NULL DEFAULT 'global_widget',
```

**Problem**: The `config_key` is UNIQUE, which means:
- Only ONE record can have `config_key = 'global_widget'`
- When a tenant without `tenant_id` context updates, they might be updating the global record
- The `config_key` uniqueness conflicts with multi-tenant architecture

#### 2. Query Logic Flaw
In `widgetConfigService.ts`:

**getConfig()** - Lines 145-155:
```typescript
if (tenantId) {
    query = query.eq('tenant_id', tenantId);
} else {
    // Fallback for global admin or non-tenant users (legacy)
    query = query.eq('config_key', 'global_widget');
}
```

**updateConfig()** - Lines 225-229:
```typescript
if (tenantId) {
    query = query.eq('tenant_id', tenantId);
} else {
    query = query.eq('config_key', 'global_widget');
}
```

**The Flaw**:
- If `tenant_id` is NULL or undefined for any reason, the service falls back to querying `config_key = 'global_widget'`
- This means a tenant with a NULL `tenant_id` will UPDATE the global widget
- There's no safety check to prevent this

#### 3. Missing Isolation Query
The queries should be:
```sql
-- For tenants
SELECT * FROM global_widget_config 
WHERE tenant_id = 'xxx' AND tenant_id IS NOT NULL;

-- For global admin (landing page ONLY)
SELECT * FROM global_widget_config 
WHERE tenant_id IS NULL AND config_key = 'global_widget';
```

Currently, the service doesn't explicitly check for `tenant_id IS NULL` for global admin.

## Impact

### Scenario 1: Tenant Updates Widget
1. Tenant logs in
2. `getTenantId()` retrieves their `tenant_id` 
3. `updateConfig()` runs: `UPDATE global_widget_config SET ... WHERE tenant_id = 'xxx'`
4. **IF** a record with `tenant_id = 'xxx'` exists → ✅ Correct behavior
5. **IF** no record exists → `.maybeSingle()` returns NULL → ❌ No update happens
6. **WORSE**: If `tenant_id` fails to load → Falls back to updating `config_key = 'global_widget'` → 🚨 **UPDATES GLOBAL WIDGET**

### Scenario 2: Global Admin Updates Widget  
1. Global admin logs in
2. `getTenantId()` returns NULL (expected)
3. `updateConfig()` runs: `UPDATE global_widget_config SET ... WHERE config_key = 'global_widget'`
4. **IF** this query matches a record with `tenant_id IS NOT NULL` → 🚨 **UPDATES A TENANT'S WIDGET**
5. This happens because `config_key` might not be unique per tenant!

## The Critical Bug

**The `config_key` should NOT be the sole identifier for global admin queries!**

The correct query for global admin should be:
```sql
WHERE config_key = 'global_widget' AND tenant_id IS NULL
```

Currently it's just:
```sql
WHERE config_key = 'global_widget'
```

This can match ANY record with that config_key, including tenant records!

## Database State Inspection Needed

We need to check:
```sql
SELECT id, config_key, tenant_id, team_name, primary_color 
FROM global_widget_config 
ORDER BY tenant_id NULLS FIRST;
```

This will show us:
- How many widget config records exist
- Which ones belong to tenants vs global
- If there are duplicates or conflicts

## Fix Required

### 1. Update widgetConfigService.ts
Modify ALL queries to explicitly include `tenant_id IS NULL` for global admin:

```typescript
// GET Config
if (tenantId) {
    query = query.eq('tenant_id', tenantId);
} else {
    // CRITICAL: Must explicitly check tenant_id IS NULL for global
    query = query.eq('config_key', 'global_widget').is('tenant_id', null);
}

// UPDATE Config
if (tenantId) {
    query = query.eq('tenant_id', tenantId);
} else {
    // CRITICAL: Must explicitly check tenant_id IS NULL for global
    query = query.eq('config_key', 'global_widget').is('tenant_id', null);
}

// DELETE/Reset Config  
if (tenantId) {
    query = query.eq('tenant_id', tenantId);
} else {
    // CRITICAL: Must explicitly check tenant_id IS NULL for global
    query = query.eq('config_key', 'global_widget').is('tenant_id', null);
}
```

### 2. Database Constraint
Add a composite unique constraint:

```sql
-- Remove old unique constraint
ALTER TABLE global_widget_config 
DROP CONSTRAINT IF EXISTS global_widget_config_config_key_key;

-- Add composite unique constraint
ALTER TABLE global_widget_config
ADD CONSTRAINT unique_widget_config_per_tenant 
UNIQUE (config_key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID));
```

Or better, use a partial unique index:
```sql
-- Unique for global (tenant_id IS NULL)
CREATE UNIQUE INDEX unique_global_widget_config 
ON global_widget_config (config_key) 
WHERE tenant_id IS NULL;

-- Unique per tenant
CREATE UNIQUE INDEX unique_tenant_widget_config 
ON global_widget_config (tenant_id, config_key) 
WHERE tenant_id IS NOT NULL;
```

### 3. Safety Check in getTenantId()
Add validation to ensure we never accidentally return undefined:

```typescript
private async getTenantId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('[WidgetConfig] No authenticated user');
        return null;
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .single();

    const tenantId = profile?.tenant_id || null;
    
    console.log('[WidgetConfig] User:', user.id);
    console.log('[WidgetConfig] Profile:', profile);
    console.log('[WidgetConfig] TenantID:', tenantId);
    console.log('[WidgetConfig] Is Global Admin:', tenantId === null);
    
    return tenantId;
}
```

## Testing After Fix

1. **Tenant A Test**:
   - Login as Tenant A
   - Change widget to RED
   - Save
   - Preview → Should see RED widget

2. **Tenant B Test**:
   - Login as Tenant B  
   - Preview → Should NOT see RED (should see Tenant B's config)
   - Change widget to BLUE
   - Save

3. **Global Admin Test**:
   - Login as Global Admin
   - Preview → Should NOT see RED or BLUE (should see global purple)
   - Change widget to PURPLE
   - Save

4. **Landing Page Test**:
   - Logout
   - Visit landing page `/`
   - Should see PURPLE widget (global config)
   - Should NOT see tenant colors

5. **Cross-Check**:
   - Login as Tenant A again
   - Should still see RED (not affected by global admin changes)

---

**Status**: 🚨 **CRITICAL BUG IDENTIFIED - FIX REQUIRED IMMEDIATELY**
**Priority**: P0 - This is a security and data integrity issue
**Assigned**: Development Team
