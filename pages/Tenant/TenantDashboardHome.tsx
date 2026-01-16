import React, { useEffect, useState } from 'react';
import {
    Users,
    MessageSquare,
    Clock,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle2,
    Settings
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
    totalChats: number;
    activeChats: number;
    teamMembers: number;
    avgResponseTime: string;
    aiCredits: number;
}

export const TenantDashboardHome: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalChats: 0,
        activeChats: 0,
        teamMembers: 0,
        avgResponseTime: '0m',
        aiCredits: 0
    });
    const [loading, setLoading] = useState(true);
    const [tenantName, setTenantName] = useState('');

    useEffect(() => {
        loadDashboardData();

        // Set up real-time subscription for credit balance updates
        const setupRealtimeSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();

            if (!profile?.tenant_id) return;

            // Subscribe to tenant updates (specifically ai_credits_balance)
            const subscription = supabase
                .channel(`tenant_credits_${profile.tenant_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'tenants',
                        filter: `id=eq.${profile.tenant_id}`
                    },
                    (payload) => {
                        console.log('[Dashboard] Credit balance updated:', payload.new);
                        // Update only the credits stat without full reload
                        if (payload.new && 'ai_credits_balance' in payload.new) {
                            setStats(prev => ({
                                ...prev,
                                aiCredits: payload.new.ai_credits_balance || 0
                            }));
                        }
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        };

        const unsubscribe = setupRealtimeSubscription();

        // Cleanup on unmount
        return () => {
            unsubscribe.then(cleanup => cleanup && cleanup());
        };
    }, []);

    const loadDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user profile to find tenant_id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id, company')
                .eq('user_id', user.id)
                .single();

            if (!profile?.tenant_id) return;

            setTenantName(profile.company || 'My Company');

            // Fetch stats
            const [chatsResponse, activeChatsResponse, teamResponse] = await Promise.all([
                supabase
                    .from('global_chat_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', profile.tenant_id),
                supabase
                    .from('global_chat_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', profile.tenant_id)
                    .eq('status', 'active'),
                supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', profile.tenant_id)
            ]);

            // Fetch tenant detail for credits
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('ai_credits_balance')
                .eq('id', profile.tenant_id)
                .single();

            setStats({
                totalChats: chatsResponse.count || 0,
                activeChats: activeChatsResponse.count || 0,
                teamMembers: teamResponse.count || 0,
                avgResponseTime: '2m 30s', // Placeholder until we have real metrics
                aiCredits: tenantData?.ai_credits_balance || 0
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Chats', value: stats.totalChats.toString(), change: '+12%', trend: 'up', icon: MessageSquare, color: 'blue' },
        { label: 'Active Chats', value: stats.activeChats.toString(), change: '+5%', trend: 'up', icon: Activity, color: 'green' },
        { label: 'Team Members', value: stats.teamMembers.toString(), change: '0%', trend: 'neutral', icon: Users, color: 'purple' },
        { label: 'AI Credits', value: stats.aiCredits.toLocaleString(undefined, { maximumFractionDigits: 1 }), change: 'Managed', trend: 'neutral', icon: Clock, color: 'amber' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
                    <p className="text-slate-400">Welcome back to {tenantName}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setLoading(true);
                            loadDashboardData();
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        title="Refresh dashboard statistics"
                    >
                        <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => navigate('/tenant/widget')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Widget Settings
                    </button>
                    <button
                        onClick={() => navigate('/tenant/chats')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        View Chats
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-400' :
                                stat.trend === 'down' && stat.label === 'Avg Response' ? 'text-green-400' : // Good for response time
                                    stat.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                <span>{stat.change}</span>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
                                    stat.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {loading ? '...' : stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Chats (Placeholder for now) */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-white">Recent Chats</h3>
                        <button onClick={() => navigate('/tenant/chats')} className="text-sm text-blue-400 hover:text-blue-300">View All</button>
                    </div>
                    <div className="p-12 text-center text-slate-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No recent chats to display</p>
                        <button
                            onClick={() => navigate('/tenant/widget')}
                            className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                        >
                            Configure your widget to start receiving chats
                        </button>
                    </div>
                </div>

                {/* System Status / Quick Actions */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="font-bold text-white">Quick Actions</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <button
                            onClick={() => navigate('/tenant/team')}
                            className="w-full flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:bg-slate-700/50 transition-colors text-left"
                        >
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Invite Team Members</p>
                                <p className="text-xs text-slate-400">Add agents to handle chats</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/tenant/widget')}
                            className="w-full flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:bg-slate-700/50 transition-colors text-left"
                        >
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Customize Widget</p>
                                <p className="text-xs text-slate-400">Change colors and welcome message</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
