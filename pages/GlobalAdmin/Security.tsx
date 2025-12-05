import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, FileText, Activity } from 'lucide-react';

export const Security: React.FC = () => {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
    const [passwordMinLength, setPasswordMinLength] = useState(8);

    const auditLogs = [
        { id: 1, action: 'Tenant Created', user: 'Gilbert M.', tenant: 'TechFlow Inc.', ip: '192.168.1.42', time: '2 hours ago', severity: 'info' },
        { id: 2, action: 'User Suspended', user: 'Gilbert M.', tenant: 'Global Logistics', ip: '192.168.1.42', time: '5 hours ago', severity: 'warning' },
        { id: 3, action: 'Billing Updated', user: 'System', tenant: 'Designify', ip: 'N/A', time: '1 day ago', severity: 'info' },
        { id: 4, action: 'Failed Login Attempt', user: 'Unknown', tenant: 'N/A', ip: '203.45.12.89', time: '2 days ago', severity: 'critical' },
        { id: 5, action: 'API Key Generated', user: 'Gilbert M.', tenant: 'StartUp Lab', ip: '192.168.1.42', time: '3 days ago', severity: 'info' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Security & Audit Controls</h2>
                    <p className="text-slate-400">Manage global security policies and monitor system activity</p>
                </div>
            </div>

            {/* Security Policies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-white">Password Policy</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Minimum Password Length</label>
                            <input
                                type="number"
                                value={passwordMinLength}
                                onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Require Special Characters</p>
                                <p className="text-xs text-slate-500">Force passwords to include symbols</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Require Uppercase Letters</p>
                                <p className="text-xs text-slate-500">Mix of upper and lowercase required</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="font-bold text-white">Authentication</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Two-Factor Authentication</p>
                                <p className="text-xs text-slate-500">Require 2FA for all admin accounts</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={twoFactorEnabled}
                                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">IP Whitelisting</p>
                                <p className="text-xs text-slate-500">Restrict access to specific IPs</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={ipRestrictionEnabled}
                                    onChange={(e) => setIpRestrictionEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Session Timeout</p>
                                <p className="text-xs text-slate-500">Auto-logout after inactivity</p>
                            </div>
                            <select className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>15 minutes</option>
                                <option>30 minutes</option>
                                <option>1 hour</option>
                                <option>Never</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="font-bold text-white">Recent Audit Logs</h3>
                    </div>
                    <button className="text-sm text-blue-400 hover:text-blue-300">View All Logs</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Tenant</th>
                                <th className="px-6 py-4 font-medium">IP Address</th>
                                <th className="px-6 py-4 font-medium">Time</th>
                                <th className="px-6 py-4 font-medium">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{log.action}</td>
                                    <td className="px-6 py-4 text-slate-300">{log.user}</td>
                                    <td className="px-6 py-4 text-slate-300">{log.tenant}</td>
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.ip}</td>
                                    <td className="px-6 py-4 text-slate-400">{log.time}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-medium ${log.severity === 'critical' ? 'text-red-400' :
                                                log.severity === 'warning' ? 'text-orange-400' : 'text-blue-400'
                                            }`}>
                                            {log.severity === 'critical' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                log.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                    <Activity className="w-3.5 h-3.5" />}
                                            {log.severity}
                                        </span>
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
