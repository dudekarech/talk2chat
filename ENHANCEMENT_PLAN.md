# 🔄 ENHANCEMENT PLAN - User Management & Tenants

## Features to Add

### 1. Users Page Enhancements

#### Delete User
- Add delete button with confirmation modal  
- Remove user from database
- Archive user data (optional)

#### Suspend/Activate User
- Toggle user status: active ↔ suspended
- Suspended users cannot log in
- Visual indicator in UI

#### Change User Role
- Dropdown to change role on the fly
- Roles: super_admin, admin, tenant_admin, manager, agent
- Instant update

#### UI Changes
```tsx
// Action buttons for each user:
<EditButton onClick={() => editUser(user)} />
<RoleDropdown value={user.role} onChange={(newRole) => updateRole(user.id, newRole)} />
<SuspendButton onClick={() => toggleSuspend(user)} />
<DeleteButton onClick={() => deleteUser(user)} />
```

### 2. Tenants Management Page (New)

**Route:** `/global/tenants`

#### Features:
- List all tenants (companies)
- View tenant details (users, chats, subscription)
- Add new tenant (invite method)
- Edit tenant (name, settings)
- Suspend/Delete tenant
- View tenant stats

#### Add Tenant Flow:
```
Global Admin clicks "Add Tenant"
    ↓
Modal opens with form:
  - Company Name
  - Admin Email
  - Admin Name
    ↓
Creates:
  1. Tenant in tenants table
  2. User profile (status: pending)
  3. Invite link
    ↓
Sends invite email
    ↓
User clicks link
    ↓
Signs up
    ↓
Profile activates
    ↓
User gets tenant admin dashboard
```

## Implementation Files

### Files to Update:
1. `pages/GlobalAdmin/Users.tsx` - Add delete, suspend, role change
2. `pages/GlobalAdmin/Tenants.tsx` - Create new tenants management page
3. `App.tsx` - Add route for /global/tenants
4. `pages/GlobalAdmin/GlobalAdminLayout.tsx` - Add Tenants to sidebar

### Database Updates:
- Ensure user_profiles.status can be 'suspended'
- Add deletion timestamp for soft deletes

## Next Steps

1. Enhance Users page with new actions
2. Create Tenants management page
3. Add routes and navigation
4. Test all features

Proceeding with implementation...
