# User & Tenant Management Implementation

## Overview
We have successfully implemented comprehensive user and tenant management features for the Global Admin. This includes the ability to manage users (soft delete, suspend, change role) and tenants (create via invite, suspend, soft delete).

## Key Features Added

### 1. User Management (`/global/users`)
- **Soft Delete**: Users are now "soft deleted" (marked as deleted but kept in DB) to preserve history.
- **Role Management**: Direct dropdown in the user list to change roles (Agent, Manager, Tenant Admin, Admin, Super Admin).
- **Suspension**: One-click suspend/activate button.
- **Tenant Admin Support**: Added `tenant_admin` role to the system.

### 2. Tenant Management (`/global/tenants`)
- **Create Tenant**: "Add Tenant" button creates a pending user profile and generates an invite link for the new Tenant Admin.
- **List Tenants**: View all tenants with stats (Total Users, Total Chats, Plan, Status).
- **Suspend Tenant**: One-click suspend/activate for entire tenants.
- **Soft Delete**: Tenants can be soft deleted.

## ⚠️ CRITICAL: Database Updates Required

To make these features work, you **MUST** run the following SQL scripts in your Supabase SQL Editor. These scripts add the necessary `deleted_at` columns for soft deletes.

### Step 1: Add `deleted_at` to User Profiles
Run the content of `backend/schema/migrations/ADD_DELETED_AT_TO_USERS.sql`:

```sql
-- Add deleted_at column to user_profiles for soft deletes
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint if it exists to allow 'deleted'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_status_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_status_check 
    CHECK (status IN ('active', 'pending', 'suspended', 'deleted', 'inactive'));
```

### Step 2: Add `deleted_at` to Tenants
Run the content of `backend/schema/migrations/ADD_DELETED_AT_TO_TENANTS.sql`:

```sql
-- Add deleted_at column to tenants for soft deletes
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
```

## Next Steps
1. **Run the SQL scripts** above.
2. **Test User Management**: Try changing a user's role, suspending them, and deleting them.
3. **Test Tenant Management**: Try adding a new tenant (copy the invite link), suspending a tenant, and deleting a tenant.
