import React from 'react';
import { DollarSign, CreditCard, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const Billing: React.FC = () => {
    const invoices = [
        { id: 'INV-2024-001', tenant: 'TechFlow Inc.', amount: '$2,400.00', date: '2024-03-01', status: 'Paid' },
        { id: 'INV-2024-002', tenant: 'Designify', amount: '$450.00', date: '2024-03-01', status: 'Paid' },
        { id: 'INV-2024-003', tenant: 'Global Logistics', amount: '$5,200.00', date: '2024-02-28', status: 'Overdue' },
        { id: 'INV-2024-004', tenant: 'Creative Minds', amount: '$290.00', date: '2024-03-05', status: 'Pending' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Billing & Subscriptions</h2>
                    <p className="text-slate-400">Manage revenue, invoices, and payment methods</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                    Generate Invoice
                </button>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total MRR</p>
                            <p className="text-2xl font-bold text-white">$45,200</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Active Subscriptions</p>
                            <p className="text-2xl font-bold text-white">142</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Pending Payments</p>
                            <p className="text-2xl font-bold text-white">$3,450</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="font-bold text-white">Recent Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice ID</th>
                                <th className="px-6 py-4 font-medium">Tenant</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-300">{inv.id}</td>
                                    <td className="px-6 py-4 font-medium text-white">{inv.tenant}</td>
                                    <td className="px-6 py-4 text-white">{inv.amount}</td>
                                    <td className="px-6 py-4 text-slate-400">{inv.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-medium ${inv.status === 'Paid' ? 'text-green-400' :
                                                inv.status === 'Pending' ? 'text-orange-400' : 'text-red-400'
                                            }`}>
                                            {inv.status === 'Paid' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                                inv.status === 'Pending' ? <Clock className="w-3.5 h-3.5" /> :
                                                    <AlertCircle className="w-3.5 h-3.5" />}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end ml-auto">
                                            <Download className="w-4 h-4" />
                                            PDF
                                        </button>
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
