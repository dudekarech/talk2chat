import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import {
    Building2, Users, MessageSquare, Settings, BarChart3,
    Palette, LogOut, Loader, ChevronRight, TrendingUp, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Tenant {
    id: string;
    name: string;
    subscription_plan: string;
    status: string;
}

interface TenantStats {
    totalChats: number;
    activeChats: number;
    totalAgents: number;
    responseTime: number;
}

export const TenantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [stats, setStats] = useState<TenantStats>({
        totalChats: 0,
        activeChats: 0,
        totalAgents: 0,
        responseTime: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Get user profile
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setUserInfo(profile);

            // Get or create tenant
            if (profile?.tenant_id) {
                // Load existing tenant
                const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('id', profile.tenant_id)
                    .single();

                setTenant(tenantData);
                await loadTenantStats(profile.tenant_id);
            } else {
                // Create new tenant for this user
                const { data: newTenant } = await supabase
                    .from('tenants')
                    .insert({
                        name: profile?.company || `${profile?.name}'s Company`,
                        owner_id: user.id
                    })
                    .select()
                    .single();

                if (newTenant) {
                    // Update user profile with tenant_id
                    await supabase
                        .from('user_profiles')
                        .update({ tenant_id: newTenant.id })
                        .eq('user_id', user.id);

                    setTenant(newTenant);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTenantStats = async (tenantId: string) => {
        try {
            // Count total chats for this tenant
            const { count: totalChats } = await supabase
                .from('global_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            // Count active chats
            const { count: activeChats } = await supabase
                .from('global_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .in('status', ['active', 'pending']);

            // Count agents
            const { count: totalAgents } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .in('role', ['agent', 'manager']);

            setStats({
                totalChats: totalChats || 0,
                activeChats: activeChats || 0,
                totalAgents: totalAgents || 0,
                responseTime: 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-500" />
                        <div>
                            <h1 className="text-white text-xl font-bold">{tenant?.name || 'Your Company'}</h1>
                            <p className="text-slate-400 text-sm">Tenant Admin Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400">Welcome, {userInfo?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        icon={<MessageSquare className="w-6 h-6" />}
                        label="Total Chats"
                        value={stats.totalChats}
                        color="blue"
                    />
                    <StatsCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        label="Active Chats"
                        value={stats.activeChats}
                        color="green"
                    />
                    <StatsCard
                        icon={<Users className="w-6 h-6" />}
                        label="Team Members"
                        value={stats.totalAgents}
                        color="purple"
                    />
                    <StatsCard
                        icon={<Clock className="w-6 h-6" />}
                        label="Avg Response"
                        value={`${stats.responseTime}s`}
                        color="orange"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <QuickActionCard
                        icon={<Palette className="w-8 h-8" />}
                        title="Customize Widget"
                        description="Design your chat widget and embed it on your website"
                        onClick={() => navigate('/tenant/widget')}
                        color="blue"
                    />
                    <QuickActionCard
                        icon={<Users className="w-8 h-8" />}
                        title="Manage Team"
                        description="Invite agents and managers to handle customer chats"
                        onClick={() => navigate('/tenant/team')}
                        color="green"
                    />
                    <QuickActionCard
                        icon={<MessageSquare className="w-8 h-8" />}
                        title="View Chats"
                        description="Monitor and manage customer conversations"
                        onClick={() => navigate('/tenant/chats')}
                        color="purple"
                    />
                    <QuickActionCard
                        icon={<Settings className="w-8 h-8" />}
                        title="Company Settings"
                        description="Update company info and preferences"
                        onClick={() => navigate('/tenant/settings')}
                        color="slate"
                    />
                    <QuickActionCard
                        icon={<BarChart3 className="w-8 h-8" />}
                        title="Analytics"
                        description="View detailed reports and insights"
                        onClick={() => navigate('/tenant/analytics')}
                        color="orange"
                    />
                </div>

                {/* Getting Started Guide */}
                {stats.totalChats === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6"
                    >
                        <h3 className="text-white text-xl font-bold mb-4">🎉 Welcome to TalkChat!</h3>
                        <p className="text-slate-300 mb-6">Get started in 3 easy steps:</p>
                        <div className="space-y-4">
                            <Step number="1" title="Customize your chat widget" />
                            <Step number="2" title="Embed it on your website" />
                            <Step number="3" title="Start chatting with customers!" />
                        </div>
                        <button
                            onClick={() => navigate('/tenant/widget')}
                            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Customize Widget Now →
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const StatsCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}> = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600'
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white mb-4`}>
                {icon}
            </div>
            <p className="text-slate-400 text-sm mb-1">{label}</p>
            <p className="text-white text-3xl font-bold">{value}</p>
        </div>
    );
};

const QuickActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    color: string;
}> = ({ icon, title, description, onClick, color }) => {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 hover:border-blue-500/50',
        green: 'from-green-500/20 to-green-600/20 border-green-500/30 hover:border-green-500/50',
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 hover:border-purple-500/50',
        orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 hover:border-orange-500/50',
        slate: 'from-slate-700/20 to-slate-800/20 border-slate-600/30 hover:border-slate-600/50'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 text-left transition-all group`}
        >
            <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-white text-lg font-bold mb-2 flex items-center justify-between">
                {title}
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-slate-400 text-sm">{description}</p>
        </motion.button>
    );
};

const Step: React.FC<{ number: string; title: string }> = ({ number, title }) => (
    <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {number}
        </div>
        <p className="text-white">{title}</p>
    </div>
);
