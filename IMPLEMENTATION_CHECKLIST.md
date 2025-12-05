# ✅ NEXT STEPS - Complete Implementation

## Files Created

✅ **1. TenantsManagement.tsx** - Complete tenants management page
✅ **2. USER_TENANTS_MANAGEMENT_GUIDE.md** - Full implementation guide

## What You Need to Do

### Step 1: Update App.tsx

Add import at the top:
```tsx
import { TenantsManagement } from './pages/GlobalAdmin/TenantsManagement';
```

Add route inside the `/global` route group (around line 40):
```tsx
<Route path="/global" element={<ProtectedRoute><GlobalAdminLayout /></ProtectedRoute>}>
  <Route path="dashboard" element={<DashboardHome />} />
  <Route path="tenants" element={<TenantsManagement />} />  {/* ADD THIS LINE */}
  <Route path="users" element={<Users />} />
  <Route path="inbox" element={<GlobalSharedInbox />} />
  {/* ... rest of routes */}
</Route>
```

### Step 2: Update GlobalAdminLayout.tsx

Find the `navItems` array and add Tenants:
```tsx
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/global/dashboard' },
  { icon: Building2, label: 'Tenants', path: '/global/tenants' },  // ADD THIS
  { icon: Users, label: 'Users', path: '/global/users' },
  { icon: MessageSquare, label: 'Shared Inbox', path: '/global/inbox' },
  { icon: Palette, label: 'Widget Config', path: '/global/widget' },
  // ... rest of nav items
];
```

Make sure Building2 is imported:
```tsx
import { Building2 } from 'lucide-react';
```

### Step 3: Enhance Users Page (Optional but Recommended)

In `pages/GlobalAdmin/Users.tsx`, add these action functions:

```tsx
// Add after existing state declarations

const handleChangeRole = async (userId: string, newRole: string) => {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ role: newRole })
            .eq('user_id', userId);

        if (error) throw error;
        await loadUsers();
        alert('Role updated successfully');
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
    }
};

const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ status: newStatus })
            .eq('user_id', userId);

        if (error) throw error;
        await loadUsers();
        alert(`User ${newStatus} successfully`);
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
};

const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ 
                status: 'deleted',
                deleted_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;
        await loadUsers();
        alert('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
};
```

Then in the user table row (find the `<tbody>` section), add action buttons:

```tsx
<td className="px-6 py-4">
    <div className="flex items-center gap-2">
        {/* Role Dropdown */}
        <select
            value={user.role}
            onChange={(e) => handleChangeRole(user.id, e.target.value)}
            className="px-3 py-1 bg-slate-700 text-white rounded border border-slate-600 text-sm focus:outline-none focus:border-blue-500"
        >
            <option value="agent">Agent</option>
            <option value="manager">Manager</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
        </select>

        {/* Suspend/Activate Button */}
        <button
            onClick={() => handleToggleSuspend(user.id, user.status)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                user.status === 'suspended'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
        >
            {user.status === 'suspended' ? 'Activate' : 'Suspend'}
        </button>

        {/* Delete Button */}
        <button
            onClick={() => handleDeleteUser(user.id)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            title="Delete User"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    </div>
</td>
```

### Step 4: Run Database Migration

Make sure to run `CREATE_TENANTS_TABLE.sql` in Supabase if you haven't already!

Also add this for user soft deletes:
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
```

### Step 5: Test!

1. **Login as Global Admin**
2. **Navigate to Tenants** (`/global/tenants`)
3. **Add a new tenant** - creates invite link
4. **View tenant stats** - users, chats, plan
5. **Suspend/Delete tenants**
6. **Go to Users page**
7. **Change user roles** - dropdown
8. **Suspend/Activate users**
9. **Delete users**

## Quick Implementation Checklist

- [ ] Update App.tsx - add TenantsManagement import and route
- [ ] Update GlobalAdminLayout.tsx - add Tenants to navigation
- [ ] (Optional) Enhance Users.tsx - add action functions and buttons
- [ ] Run database migration - CREATE_TENANTS_TABLE.sql
- [ ] Test tenants management
- [ ] Test user management enhancements
- [ ] Commit and push to GitHub

## Files to Edit

1. **App.tsx** - Add 2 lines (import + route)
2. **pages/GlobalAdmin/GlobalAdminLayout.tsx** - Add 1 line (nav item)
3. **pages/GlobalAdmin/Users.tsx** - Add functions + UI (optional)
4. **Supabase SQL Editor** - Run migration

That's it! All the complex components are already created! 🚀
