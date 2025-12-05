# ✅ USER MANAGEMENT & TENANTS ENHANCEMENTS

## What Needs to Be Added

### 1. Enhanced Users Management

Add these functions to `pages/GlobalAdmin/Users.tsx`:

```tsx
// Delete User Function
const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        // Soft delete - update status to 'deleted'
        const { error } = await supabase
            .from('user_profiles')
            .update({ 
                status: 'deleted',
                deleted_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        // Refresh users list
        await loadUsers();
        alert('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
};

// Suspend/Activate User Function
const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ status: newStatus })
            .eq('user_id', userId);

        if (error) throw error;

        await loadUsers();
        alert(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Failed to update user status');
    }
};

// Change Role Function
const handleChangeRole = async (userId: string, newRole: string) => {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ role: newRole })
            .eq('user_id', userId);

        if (error) throw error;

        await loadUsers();
        alert('User role updated successfully');
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
    }
};
```

### UI Components to Add:

```tsx
// In the user table row, add these action buttons:

<td className="px-6 py-4 whitespace-nowrap">
    <div className="flex items-center gap-2">
        {/* Role Dropdown */}
        <select
            value={user.role}
            onChange={(e) => handleChangeRole(user.id, e.target.value)}
            className="px-3 py-1 bg-slate-700 text-white rounded border border-slate-600 text-sm"
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
            className={`px-3 py-1 rounded text-sm ${
                user.status === 'suspended'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
            } text-white transition-colors`}
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

---

## 2. Tenants Management Page

Create new file: `pages/GlobalAdmin/Tenants.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, Users, MessageSquare, Settings, Trash2, Ban, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface Tenant {
    id: string;
    name: string;
    owner_id: string;
    subscription_plan: string;
    status: string;
    created_at: string;
    owner_email?: string;
    owner_name?: string;
    total_users?: number;
    total_chats?: number;
}

export const Tenants: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        adminEmail: '',
        admin Name: ''
    });

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select(`
                    *,
                    user_profiles!tenants_owner_id_fkey (
                        email,
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Count users and chats for each tenant
            const tenantsWithStats = await Promise.all(
                (data || []).map(async (tenant) => {
                    const { count: userCount } = await supabase
                        .from('user_profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id);

                    const { count: chatCount } = await supabase
                        .from('global_chat_sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id);

                    return {
                        ...tenant,
                        owner_email: tenant.user_profiles?.email,
                        owner_name: tenant.user_profiles?.name,
                        total_users: userCount || 0,
                        total_chats: chatCount || 0
                    };
                })
            );

            setTenants(tenantsWithStats);
        } catch (error) {
            console.error('Error loading tenants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Create pending user profile (tenant admin)
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    email: formData.adminEmail,
                    name: formData.adminName,
                    role: 'tenant_admin',
                    status: 'pending',
                    company: formData.companyName
                })
                .select()
                .single();

            if (profileError) throw profileError;

            // 2. Generate invite link
            const inviteId = profile.id;
            const link = `${window.location.origin}/#/signup?invite=${inviteId}`;
            setInviteLink(link);

            alert('Tenant invite created! Share the invite link with the admin.');
        } catch (error: any) {
            console.error('Error creating tenant invite:', error);
            alert(error.message || 'Failed to create tenant');
        }
    };

    const handleDeleteTenant = async (tenantId: string) => {
        if (!confirm('Delete this tenant? All users and data will be removed.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('tenants')
                .update({ status: 'deleted' })
                .eq('id', tenantId);

            if (error) throw error;

            await loadTenants();
            alert('Tenant deleted successfully');
        } catch (error) {
            console.error('Error deleting tenant:', error);
            alert('Failed to delete tenant');
        }
    };

    const handleSuspendTenant = async (tenantId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        try {
            const { error } = await supabase
                .from('tenants')
                .update({ status: newStatus })
                .eq('id', tenantId);

            if (error) throw error;

            await loadTenants();
            alert(`Tenant ${newStatus} successfully`);
        } catch (error) {
            console.error('Error updating tenant status:', error);
            alert('Failed to update tenant status');
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tenants Management</h1>
                    <p className="text-slate-400">Manage all companies using the platform</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Tenant
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-800 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-6 h-6 text-blue-500" />
                        <span className="text-slate-400">Total Tenants</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{tenants.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-6 h-6 text-green-500" />
                        <span className="text-slate-400">Total Users</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {tenants.reduce((sum, t) => sum + (t.total_users || 0), 0)}
                    </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-6 h-6 text-purple-500" />
                        <span className="text-slate-400">Total Chats</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {tenants.reduce((sum, t) => sum + (t.total_chats || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-slate-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Users</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Chats</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                        <span className="text-white font-medium">{tenant.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-white">{tenant.owner_name || 'N/A'}</div>
                                    <div className="text-slate-400 text-sm">{tenant.owner_email}</div>
                                </td>
                                <td className="px-6 py-4 text-white">{tenant.total_users}</td>
                                <td className="px-6 py-4 text-white">{tenant.total_chats}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm">
                                        {tenant.subscription_plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        tenant.status === 'active'
                                            ? 'bg-green-600/20 text-green-400'
                                            : 'bg-red-600/20 text-red-400'
                                    }`}>
                                        {tenant.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSuspendTenant(tenant.id, tenant.status)}
                                            className={`p-2 rounded transition-colors ${
                                                tenant.status === 'suspended'
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-yellow-600 hover:bg-yellow-700'
                                            } text-white`}
                                            title={tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        >
                                            {tenant.status === 'suspended' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTenant(tenant.id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                            title="Delete Tenant"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Tenant Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold text-white mb-4">Add New Tenant</h2>
                        <form onSubmit={handleAddTenant} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 text-white rounded border border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2">Admin Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 text-white rounded border border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2">Admin Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 text-white rounded border border-slate-700"
                                />
                            </div>
                            
                            {inviteLink && (
                                <div className="bg-green-600/20 border border-green-600/50 p-4 rounded">
                                    <p className="text-green-400 mb-2">Invite link created!</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={inviteLink}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-slate-900 text-white rounded text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(inviteLink);
                                                alert('Link copied!');
                                            }}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                >
                                    Create Invite
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setInviteLink('');
                                        setFormData({ companyName: '', adminEmail: '', adminName: '' });
                                    }}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
```

---

## 3. Update App.tsx

Add import:
```tsx
import { Tenants as TenantsPage } from './pages/GlobalAdmin/Tenants';
```

Add route inside GlobalAdminLayout:
```tsx
<Route path="/global" element={<ProtectedRoute><GlobalAdminLayout /></ProtectedRoute>}>
  <Route path="dashboard" element={<DashboardHome />} />
  <Route path="tenants" element={<TenantsPage />} />  {/* Add this */}
  <Route path="users" element={<Users />} />
  <Route path="inbox" element={<GlobalSharedInbox />} />
  // ... other routes
</Route>
```

---

## 4. Update GlobalAdminLayout Navigation

In `pages/GlobalAdmin/GlobalAdminLayout.tsx`, add Tenants to sidebar:

```tsx
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/global/dashboard' },
  { icon: Building2, label: 'Tenants', path: '/global/tenants' },  // Add this
  { icon: Users, label: 'Users', path: '/global/users' },
  { icon: MessageSquare, label: 'Shared Inbox', path: '/global/inbox' },
  // ... other items
];
```

---

## Database Requirements

Make sure these exist:
```sql
-- Add deleted_at column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Ensure status can be 'deleted' or 'suspended'
-- status: 'active', 'pending', 'suspended', 'deleted'
```

---

## Summary

**Users Management:**
- ✅ Change role dropdown  
- ✅ Suspend/Activate button
- ✅ Delete button with confirmation

**Tenants Management:**
- ✅ List all tenants
- ✅ View stats (users, chats)
- ✅ Add tenant via invite
- ✅ Suspend/Activate tenant
- ✅ Delete tenant

**Implementation:**
1. Create `pages/GlobalAdmin/Tenants.tsx`
2. Add route to App.tsx
3. Add navigation link
4. Enhance Users.tsx with new actions

All ready for implementation! 🚀
