import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, FileText, Activity } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export const Security: React.FC = () => {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
    const [passwordMinLength, setPasswordMinLength] = useState(8);

    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('security_audit_logs')
                    .select(`
                        id,
                        event_type,
                        action_details,
                        created_at,
                        tenant_id,
                        tenants (name),
                        user_profiles:actor_id (name)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                setAuditLogs((data || []).map(log => ({
                    id: log.id,
                    action: log.event_type.replace(/_/g, ' ').toUpperCase(),
                    user: (log as any).user_profiles?.name || 'System',
                    tenant: (log as any).tenants?.name || 'Global',
                    ip: log.action_details?.ip || 'N/A',
                    time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    severity: log.event_type.includes('error') || log.event_type.includes('fail') ? 'critical' : 'info'
                })));
            } catch (err) {
                console.error('Error fetching audit logs:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

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
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
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
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Syncing audit vault...</div>
                    ) : auditLogs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No security events recorded.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400 font-bold">
                                <tr>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Tenant</th>
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-400">{log.action}</td>
                                        <td className="px-6 py-4 text-slate-300 font-medium">{log.user}</td>
                                        <td className="px-6 py-4 text-slate-300">{log.tenant}</td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.ip}</td>
                                        <td className="px-6 py-4 text-slate-400">{log.time}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                log.severity === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
