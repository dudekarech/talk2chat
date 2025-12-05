import React, { useState, useEffect } from 'react';
import {
    Search,
    UserPlus,
    Mail,
    Shield,
    Edit,
    Trash2,
    Activity,
    Users as UsersIcon,
    X,
    AlertCircle,
    Copy,
    CheckCircle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'admin' | 'agent' | 'manager';
    status: 'active' | 'suspended' | 'pending';
    created_at: string;
    last_sign_in_at?: string;
    avatar_url?: string;
    phone?: string;
    department?: string;
}

export const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [inviteLink, setInviteLink] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'agent' as User['role'],
        phone: '',
        department: ''
    });

    useEffect(() => {
        loadUsers();

        // Subscribe to profile changes
        const channel = supabase
            .channel('user_profiles_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'user_profiles' },
                () => loadUsers()
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const loadUsers = async () => {
        try {
            setIsLoading(true);

            // Load user profiles (this doesn't require admin access)
            const { data: profiles, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map profiles to User interface
            const mappedUsers: User[] = (profiles || []).map(profile => ({
                id: profile.user_id || profile.id, // Use profile.id if user_id is null (pending)
                email: profile.email || 'No email',
                name: profile.name,
                role: profile.role,
                status: profile.status,
                created_at: profile.created_at,
                last_sign_in_at: profile.updated_at,
                avatar_url: profile.avatar_url,
                phone: profile.phone,
                department: profile.department
            }));

            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Create a pending user profile (user_id will be set when they sign up)
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    phone: formData.phone,
                    department: formData.department,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Generate invite link (in production, send email with this link)
            const inviteUrl = `${window.location.origin}/#/signup?invite=${data.id}&email=${encodeURIComponent(formData.email)}`;
            setInviteLink(inviteUrl);

            // Reload users
            await loadUsers();

            alert(`Invite created! Share this link with ${formData.name}:\n${inviteUrl}`);
        } catch (error: any) {
            console.error('Error creating invite:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    name: formData.name,
                    role: formData.role,
                    phone: formData.phone,
                    department: formData.department
                })
                .eq('user_id', selectedUser.id);

            if (error) throw error;

            await loadUsers();
            setShowEditModal(false);
            setSelectedUser(null);
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            await loadUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleSuspendUser = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: newStatus })
                .eq('user_id', userId);

            if (error) throw error;

            await loadUsers();
        } catch (error: any) {
            console.error('Error updating user status:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone || '',
            department: user.department || ''
        });
        setShowEditModal(true);
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Invite link copied to clipboard!');
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-red-500/10 text-red-400';
            case 'admin': return 'bg-purple-500/10 text-purple-400';
            case 'manager': return 'bg-blue-500/10 text-blue-400';
            case 'agent': return 'bg-green-500/10 text-green-400';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-400';
            case 'suspended': return 'bg-red-500/10 text-red-400';
            case 'pending': return 'bg-yellow-500/10 text-yellow-400';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-200 mb-1">User Invitation System</h3>
                        <p className="text-sm text-blue-300">
                            Create user invites below. Users will receive a signup link to create their account with their assigned role.
                            For direct user creation, you'll need to set up Supabase Edge Functions with service role key.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">User Management</h2>
                    <p className="text-slate-400">Invite and manage team members</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            email: '',
                            name: '',
                            role: 'agent',
                            phone: '',
                            department: ''
                        });
                        setShowInviteModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite User
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: users.length, icon: UsersIcon, color: 'blue' },
                    { label: 'Active Users', value: users.filter(u => u.status === 'active').length, icon: Activity, color: 'green' },
                    { label: 'Pending Invites', value: users.filter(u => u.status === 'pending').length, icon: Mail, color: 'yellow' },
                    { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, icon: AlertCircle, color: 'red' }
                ].map((stat, index) => (
                    <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                            <span className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</span>
                        </div>
                        <p className="text-sm text-slate-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium px-3 py-2 border-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Agent</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium px-3 py-2 border-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-400">Loading users...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Department</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Created</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No users found. Click "Invite User" to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{user.name}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{user.department || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                                                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSuspendUser(user.id, user.status)}
                                                        className="p-1.5 hover:bg-yellow-500/20 rounded text-yellow-400"
                                                        title={user.status === 'active' ? 'Suspend' : 'Activate'}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                                                        title="Delete User"
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
                )}
            </div>

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Invite New User</h3>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteLink('');
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {inviteLink ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <p className="font-semibold text-green-200">Invite Created!</p>
                                    </div>
                                    <p className="text-sm text-green-300">Share this link with the user:</p>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={inviteLink}
                                        readOnly
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white text-sm"
                                    />
                                    <button
                                        onClick={copyInviteLink}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded transition-colors"
                                        title="Copy link"
                                    >
                                        <Copy className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setInviteLink('');
                                    }}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="agent">Agent</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Support, Sales, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all"
                                    >
                                        Create Invite
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Edit User</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUser(null);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email (read-only)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full bg-slate-900/30 border border-slate-700 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="agent">Agent</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
