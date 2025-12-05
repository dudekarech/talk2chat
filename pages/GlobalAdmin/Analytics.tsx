import React from 'react';
import { TrendingUp, MessageSquare, Users, Clock, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Analytics: React.FC = () => {
    const revenueData = [
        { month: 'Jan', revenue: 32400 },
        { month: 'Feb', revenue: 35200 },
        { month: 'Mar', revenue: 38900 },
        { month: 'Apr', revenue: 42100 },
        { month: 'May', revenue: 45200 },
    ];

    const chatVolumeData = [
        { day: 'Mon', chats: 1240 },
        { day: 'Tue', chats: 1580 },
        { day: 'Wed', chats: 1350 },
        { day: 'Thu', chats: 1920 },
        { day: 'Fri', chats: 2100 },
        { day: 'Sat', chats: 980 },
        { day: 'Sun', chats: 750 },
    ];

    const topPerformers = [
        { tenant: 'TechFlow Inc.', chats: 2847, avgResponse: '45s', satisfaction: 4.8 },
        { tenant: 'Global Logistics', chats: 2156, avgResponse: '1m 12s', satisfaction: 4.6 },
        { tenant: 'Designify', chats: 1893, avgResponse: '38s', satisfaction: 4.9 },
        { tenant: 'Creative Minds', chats: 1245, avgResponse: '52s', satisfaction: 4.7 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Global Analytics</h2>
                    <p className="text-slate-400">Platform-wide performance metrics and trends</p>
                </div>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
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
                    <p className="text-2xl font-bold text-white">89,432</p>
                    <p className="text-xs text-green-400 mt-1">+12.5% from last month</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Active Agents</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">1,234</p>
                    <p className="text-xs text-green-400 mt-1">+5.4% from last month</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Avg Response</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">1m 42s</p>
                    <p className="text-xs text-green-400 mt-1">-8s from last month</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Satisfaction</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">4.8/5.0</p>
                    <p className="text-xs text-green-400 mt-1">+0.2 from last month</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Monthly Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Chat Volume Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Weekly Chat Volume</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chatVolumeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="chats" fill="#8b5cf6" />
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
                                <th className="px-6 py-4 font-medium">Tenant</th>
                                <th className="px-6 py-4 font-medium">Total Chats</th>
                                <th className="px-6 py-4 font-medium">Avg Response Time</th>
                                <th className="px-6 py-4 font-medium">Satisfaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {topPerformers.map((tenant, i) => (
                                <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{tenant.tenant}</td>
                                    <td className="px-6 py-4 text-slate-300">{tenant.chats.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-300">{tenant.avgResponse}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-slate-700 rounded-full h-2">
                                                <div
                                                    className="bg-green-400 h-2 rounded-full"
                                                    style={{ width: `${(tenant.satisfaction / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white font-medium">{tenant.satisfaction}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
