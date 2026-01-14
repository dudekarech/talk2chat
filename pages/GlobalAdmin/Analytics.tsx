import React from 'react';
import { TrendingUp, MessageSquare, Users, Clock, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsService, DashboardStats, ChartData } from '../../services/analyticsService';
import { Loader2, RefreshCw } from 'lucide-react';

export const Analytics: React.FC = () => {
    const [stats, setStats] = React.useState<DashboardStats | null>(null);
    const [volumeData, setVolumeData] = React.useState<ChartData[]>([]);
    const [aiUsageData, setAiUsageData] = React.useState<ChartData[]>([]);
    const [performers, setPerformers] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const loadData = async () => {
        setIsRefreshing(true);
        try {
            const [s, v, a, p] = await Promise.all([
                analyticsService.getDashboardStats(),
                analyticsService.getChatVolume(7),
                analyticsService.getAIUsageData(7),
                analyticsService.getTopPerformers()
            ]);
            setStats(s);
            setVolumeData(v);
            setAiUsageData(a);
            setPerformers(p.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Global Analytics</h2>
                    <p className="text-slate-400">Platform-wide performance metrics and trends</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        disabled={isRefreshing}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Chats</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.total_chats.toLocaleString()}</p>
                    <p className="text-xs text-blue-400 mt-1">{stats?.active_chats} active right now</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Active Agents</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.active_agents}</p>
                    <p className="text-xs text-slate-500 mt-1">Across all shifts</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Resolved Chats</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.resolved_chats.toLocaleString()}</p>
                    <p className="text-xs text-green-400 mt-1">Success completion</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">AI economy</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.total_tokens.toLocaleString()}</p>
                    <p className="text-xs text-orange-400 mt-1">${stats?.ai_cost.toFixed(4)} total cost</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Usage Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">AI Request Volume (7d)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={aiUsageData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Chat Volume Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Weekly Chat Volume</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={volumeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Performers */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="font-bold text-white">Top Performing Tenants</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Agent</th>
                                <th className="px-6 py-4 font-medium">Sessions Handled</th>
                                <th className="px-6 py-4 font-medium">Avg duration</th>
                                <th className="px-6 py-4 font-medium">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {performers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No agent data available yet.
                                    </td>
                                </tr>
                            ) : (
                                performers.map((agent, i) => (
                                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{agent.agent_name}</td>
                                        <td className="px-6 py-4 text-slate-300">{agent.sessions_handled.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {Math.floor(agent.avg_session_duration_seconds / 60)}m {Math.round(agent.avg_session_duration_seconds % 60)}s
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-400 h-2 rounded-full"
                                                        style={{ width: `${Math.min((agent.sessions_handled / 100) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-white font-medium">Active</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
