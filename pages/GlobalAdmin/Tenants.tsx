import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Shield, Ban, Trash2, Edit2, CheckCircle } from 'lucide-react';

export const Tenants: React.FC = () => {
    const [tenants] = useState([
        { id: 1, name: 'TechFlow Inc.', domain: 'techflow.talkchat.studio', plan: 'Enterprise', status: 'Active', users: 45, created: '2023-12-01' },
        { id: 2, name: 'Designify', domain: 'designify.talkchat.studio', plan: 'Pro', status: 'Active', users: 12, created: '2024-01-15' },
        { id: 3, name: 'StartUp Lab', domain: 'startuplab.talkchat.studio', plan: 'Starter', status: 'Trial', users: 3, created: '2024-02-20' },
        { id: 4, name: 'Global Logistics', domain: 'logistics.talkchat.studio', plan: 'Enterprise', status: 'Suspended', users: 120, created: '2023-11-10' },
        { id: 5, name: 'Creative Minds', domain: 'creative.talkchat.studio', plan: 'Pro', status: 'Active', users: 8, created: '2024-03-05' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Tenant Management</h2>
                    <p className="text-slate-400">Manage companies and their subscriptions</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                    Add New Tenant
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, domain, or ID..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <select className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium px-3 py-2 border-none focus:ring-2 focus:ring-blue-500">
                        <option>All Plans</option>
                        <option>Enterprise</option>
                        <option>Pro</option>
                        <option>Starter</option>
                    </select>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Tenant</th>
                                <th className="px-6 py-4 font-medium">Plan</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Users</th>
                                <th className="px-6 py-4 font-medium">Created</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-white">{tenant.name}</p>
                                            <p className="text-xs text-slate-500">{tenant.domain}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${tenant.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400' :
                                                tenant.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700 text-slate-400'
                                            }`}>
                                            {tenant.plan}
                                        </span>
                                    </td>
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
                                    <td className="px-6 py-4 text-slate-300">{tenant.users}</td>
                                    <td className="px-6 py-4 text-slate-400">{tenant.created}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="Manage Admins">
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            {tenant.status === 'Suspended' ? (
                                                <button className="p-1.5 hover:bg-green-500/20 rounded text-green-400" title="Activate">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button className="p-1.5 hover:bg-orange-500/20 rounded text-orange-400" title="Suspend">
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-1.5 hover:bg-red-500/20 rounded text-red-400" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
