import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, Users, MessageSquare, Trash2, Ban, CheckCircle, Mail, Copy } from 'lucide-react';
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

export const TenantsManagement: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        adminEmail: '',
        adminName: ''
    });

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            // Check if current user is super admin
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role, tenant_id')
                .eq('user_id', user.id)
                .single();

            // ONLY Super Admins can pull all data from the database
            if (profile?.role !== 'super_admin' || profile?.tenant_id !== null) {
                console.warn('Unauthorized access to all tenants. Access restricted to super_admin.');
                setTenants([]);
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .neq('status', 'deleted')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get owner details and stats for each tenant
            const tenantsWithDetails = await Promise.all(
                (data || []).map(async (tenant) => {
                    // Get owner info
                    const { data: owner } = await supabase
                        .from('user_profiles')
                        .select('email, name')
                        .eq('user_id', tenant.owner_id)
                        .single();

                    // Count users
                    const { count: userCount } = await supabase
                        .from('user_profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id);

                    // Count chats
                    const { count: chatCount } = await supabase
                        .from('global_chat_sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id);

                    return {
                        ...tenant,
                        owner_email: owner?.email,
                        owner_name: owner?.name,
                        total_users: userCount || 0,
                        total_chats: chatCount || 0
                    };
                })
            );

            setTenants(tenantsWithDetails);
        } catch (error) {
            console.error('Error loading tenants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Create pending user profile (tenant admin)
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

            // Generate invite link
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
        if (!confirm('Delete this tenant? All associated data will be affected.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('tenants')
                .update({
                    status: 'deleted',
                    deleted_at: new Date().toISOString()
                })
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

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Invite link copied to clipboard!');
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
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Tenant
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-6 h-6 text-blue-500" />
                        <span className="text-slate-400">Total Tenants</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{tenants.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-6 h-6 text-green-500" />
                        <span className="text-slate-400">Total Users</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {tenants.reduce((sum, t) => sum + (t.total_users || 0), 0)}
                    </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
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
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <table className="w-full">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Users</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Chats</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                    Loading tenants...
                                </td>
                            </tr>
                        ) : tenants.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                    No tenants yet. Click "Add Tenant" to get started.
                                </td>
                            </tr>
                        ) : (
                            tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-white font-medium">{tenant.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white">{tenant.owner_name || 'N/A'}</div>
                                        <div className="text-slate-400 text-sm">{tenant.owner_email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-white font-medium">{tenant.total_users}</td>
                                    <td className="px-6 py-4 text-white font-medium">{tenant.total_chats}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                                            {tenant.subscription_plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${tenant.status === 'active'
                                            ? 'bg-green-600/20 text-green-400'
                                            : tenant.status === 'suspended'
                                                ? 'bg-yellow-600/20 text-yellow-400'
                                                : 'bg-red-600/20 text-red-400'
                                            }`}>
                                            {tenant.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSuspendTenant(tenant.id, tenant.status)}
                                                className={`p-2 rounded transition-colors ${tenant.status === 'suspended'
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-yellow-600 hover:bg-yellow-700'
                                                    } text-white`}
                                                title={tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
                                            >
                                                {tenant.status === 'suspended' ?
                                                    <CheckCircle className="w-4 h-4" /> :
                                                    <Ban className="w-4 h-4" />
                                                }
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Tenant Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-4">Add New Tenant</h2>
                        <form onSubmit={handleAddTenant} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 mb-2 text-sm font-medium">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                                    placeholder="Acme Inc."
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2 text-sm font-medium">Admin Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                                    placeholder="admin@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2 text-sm font-medium">Admin Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            {inviteLink && (
                                <div className="bg-green-600/20 border border-green-600/50 p-4 rounded">
                                    <p className="text-green-400 font-medium mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Invite link created!
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={inviteLink}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-slate-900 text-white rounded text-sm border border-slate-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={copyInviteLink}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                            title="Copy Link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-semibold"
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
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors font-semibold"
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
