import React from 'react';
import {
    Users,
    Building2,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export const DashboardHome: React.FC = () => {
    const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsAuthorized(false);
                return;
            }

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role, tenant_id')
                .eq('user_id', user.id)
                .single();

            // Only Super Admins can see the global system overview stats
            setIsAuthorized(profile?.role === 'super_admin' && profile?.tenant_id === null);
        };

        checkAuth();
    }, []);

    if (isAuthorized === null) return null; // Loading

    if (!isAuthorized) {
        return (
            <div className="p-12 text-center bg-slate-800 rounded-2xl border border-slate-700">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
                <p className="text-slate-400">Only Super Administrators can view the platform-wide system overview.</p>
            </div>
        );
    }

    const stats = [
        { label: 'Total Tenants', value: '142', change: '+12%', trend: 'up', icon: Building2, color: 'blue' },
        { label: 'Active Users', value: '1,234', change: '+5.4%', trend: 'up', icon: Users, color: 'purple' },
        { label: 'Monthly Revenue', value: '$45.2k', change: '+8.1%', trend: 'up', icon: DollarSign, color: 'green' },
        { label: 'System Load', value: '34%', change: '-2%', trend: 'down', icon: Activity, color: 'orange' },
    ];

    const alerts = [
        { id: 1, type: 'critical', message: 'High latency detected in EU-West region', time: '10m ago' },
        { id: 2, type: 'warning', message: 'Tenant "Acme Corp" approaching storage limit', time: '1h ago' },
        { id: 3, type: 'info', message: 'Scheduled maintenance completed successfully', time: '2h ago' },
    ];

    const recentTenants = [
        { name: 'TechFlow Inc.', plan: 'Enterprise', status: 'Active', users: 45, revenue: '$2,400' },
        { name: 'Designify', plan: 'Pro', status: 'Active', users: 12, revenue: '$450' },
        { name: 'StartUp Lab', plan: 'Starter', status: 'Trial', users: 3, revenue: '$0' },
        { name: 'Global Logistics', plan: 'Enterprise', status: 'Suspended', users: 120, revenue: '$5,200' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">System Overview</h2>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                        Export Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                        Maintenance Mode
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                <span>{stat.change}</span>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity / Tenants */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-white">Recent Tenant Activity</h3>
                        <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Tenant Name</th>
                                    <th className="px-6 py-3 font-medium">Plan</th>
                                    <th className="px-6 py-3 font-medium">Users</th>
                                    <th className="px-6 py-3 font-medium">MRR</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {recentTenants.map((tenant, i) => (
                                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{tenant.name}</td>
                                        <td className="px-6 py-4 text-slate-300">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${tenant.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400' :
                                                tenant.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {tenant.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{tenant.users}</td>
                                        <td className="px-6 py-4 text-slate-300">{tenant.revenue}</td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-medium ${tenant.status === 'Active' ? 'text-green-400' :
                                                tenant.status === 'Trial' ? 'text-blue-400' : 'text-red-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-green-400' :
                                                    tenant.status === 'Trial' ? 'bg-blue-400' : 'bg-red-400'
                                                    }`}></span>
                                                {tenant.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Alerts */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="font-bold text-white">System Alerts</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="flex gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                                <div className={`mt-1 ${alert.type === 'critical' ? 'text-red-500' :
                                    alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                                    }`}>
                                    {alert.type === 'critical' ? <AlertTriangle className="w-5 h-5" /> :
                                        alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                                            <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{alert.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-700 transition-all">
                            View System Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
