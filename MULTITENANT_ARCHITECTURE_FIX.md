# 🏢 MULTITENANT ARCHITECTURE - NEEDS FIXING

## Current Problem

When a new user signs up, they're becoming an "agent" for the global admin instead of getting their own tenant admin dashboard!

## Correct Architecture

### Roles:
1. **Super Admin** - Platform owner (manages all tenants)
2. **Tenant Admin** - Company owner (manages their tenant)
3. **Manager** - Manages agents within a tenant
4. **Agent** - Supports customers for a tenant

### Signup Flow Should Be:
```
New user signs up
    ↓
Create user_profile with role: 'tenant_admin'
    ↓
Create tenant (company) for this user
    ↓
Redirect to Tenant Admin Dashboard
    ↓
User can:
  - Set up company details
  - Customize chat widget
  - Invite agents/managers
  - Manage chats
  - View analytics
```

## What Needs to Be Fixed

### 1. Database Schema

Need a `tenants` table:
```sql
CREATE TABLE tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    domain TEXT UNIQUE,
    widget_config JSONB,
    subscription_plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Update user_profiles

Add tenant_id:
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
```

### 3. Update RoleBasedRedirect

Change default role from 'agent' to 'tenant_admin':
```tsx
role: 'tenant_admin', // NOT 'agent'
```

### 4. Create Tenant Admin Dashboard

Need routes:
```
/tenant/dashboard - Main dashboard
/tenant/settings - Company settings
/tenant/widget - Widget customization
/tenant/team - Invite users
/tenant/chats - Customer chats
/tenant/analytics - Reports
```

### 5. Update Signup Flow

On signup:
1. Create user in auth
2. Create user_profile with role='tenant_admin'
3. Create tenant with user as owner
4. Link user to tenant
5. Redirect to /tenant/dashboard

## Current Wrong Flow

```
User signs up → role: 'agent' → /agent/dashboard
    ↓
Becomes agent for GLOBAL ADMIN ❌
```

## Correct Flow Should Be

```
User signs up → role: 'tenant_admin' → Creates tenant → /tenant/dashboard
    ↓
Gets their own workspace ✅
```

## Dashboard Hierarchy

```
Super Admin (/global/dashboard)
    ├─ Manages all tenants
    ├─ Platform analytics
    └─ System settings

Tenant Admin (/tenant/dashboard)
    ├─ Manages their company
    ├─ Customize widget
    ├─ Invite team members
    ├─ Manage chats
    └─ View company analytics

Manager (/manager/dashboard)
    ├─ Manage agents
    ├─ Assign chats
    └─ View team performance

Agent (/agent/dashboard)
    ├─ Handle customer chats
    ├─ View assigned chats
    └─ Customer support
```

## Next Steps

1. Create tenants table
2. Update signup flow to create tenant
3. Change default role to 'tenant_admin'
4. Create tenant admin dashboard
5. Update routing

Do you want me to implement this proper multitenant architecture?
