import React, { useState, useEffect } from 'react';
import { Bell, Send, AlertCircle, CheckCircle, Clock, Loader2, Users } from 'lucide-react';
import { notificationService, SystemNotification } from '../../services/notificationService';
import { supabase } from '../../services/supabaseClient';

export const Notifications: React.FC = () => {
    const [targetType, setTargetType] = useState<'all' | 'tier' | 'tenant'>('all');
    const [targetTier, setTargetTier] = useState<string>('free');
    const [targetTenantId, setTargetTenantId] = useState<string>('');
    const [messageTitle, setMessageTitle] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [notifType, setNotifType] = useState<'announcement' | 'update' | 'alert'>('announcement');

    const [tenants, setTenants] = useState<any[]>([]);
    const [history, setHistory] = useState<SystemNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load history
            const { data: historyData } = await notificationService.getNotifications();
            setHistory(historyData || []);

            // Load tenants for selection
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('id, name')
                .neq('status', 'deleted');
            setTenants(tenantData || []);
        } catch (error) {
            console.error('Error loading notifications data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendNotification = async () => {
        if (!messageTitle || !messageBody) return;

        setIsSending(true);
        try {
            const { error } = await notificationService.sendNotification({
                title: messageTitle,
                content: messageBody,
                type: notifType,
                target_type: targetType,
                target_tenant_id: targetType === 'tenant' ? targetTenantId : undefined,
                target_tier: targetType === 'tier' ? targetTier : undefined
            });

            if (error) throw error;

            alert('Notification sent successfully!');
            setMessageTitle('');
            setMessageBody('');
            loadData(); // Refresh history
        } catch (error: any) {
            console.error('Error sending notification:', error);
            alert(error.message || 'Failed to send notification');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Notifications Center</h2>
                    <p className="text-slate-400">Send system-wide alerts and messages to tenants</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send New Notification */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Send className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-white">Send Global Message</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Message Type</label>
                                <select
                                    value={notifType}
                                    onChange={(e) => setNotifType(e.target.value as any)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="announcement">Announcement</option>
                                    <option value="update">Feature Update</option>
                                    <option value="alert">System Alert</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Logic</label>
                                <select
                                    value={targetType}
                                    onChange={(e) => setTargetType(e.target.value as any)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Tenants</option>
                                    <option value="tier">By Subscription Tier</option>
                                    <option value="tenant">Select Specific Tenant</option>
                                </select>
                            </div>
                        </div>

                        {targetType === 'tier' && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Target Tier</label>
                                <select
                                    value={targetTier}
                                    onChange={(e) => setTargetTier(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="free">Free Plan</option>
                                    <option value="pro">Pro Plan</option>
                                    <option value="enterprise">Enterprise Plan</option>
                                </select>
                            </div>
                        )}

                        {targetType === 'tenant' && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Select Tenant</label>
                                <select
                                    value={targetTenantId}
                                    onChange={(e) => setTargetTenantId(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Choose a company...</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Message Title</label>
                            <input
                                type="text"
                                value={messageTitle}
                                onChange={(e) => setMessageTitle(e.target.value)}
                                placeholder="e.g. Scheduled Maintenance Notice"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Message Body</label>
                            <textarea
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                placeholder="Enter your message here..."
                                rows={6}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSendNotification}
                                disabled={isSending || (targetType === 'tenant' && !targetTenantId)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {isSending ? 'Sending...' : 'Send Notification'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Summary Stats */}
                <div className="space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="font-bold text-white">Audience Summary</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Total Active Tenants</span>
                                <span className="text-white font-medium">{tenants.length}</span>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <p className="text-xs text-slate-500 italic">
                                    {targetType === 'all' && "This message will reach every registered user on the platform."}
                                    {targetType === 'tier' && `Targeting all users on the ${targetTier} plan.`}
                                    {targetType === 'tenant' && targetTenantId && `Targeting users at "${tenants.find(t => t.id === targetTenantId)?.name}" only.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Notifications History */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="font-bold text-white">Notification History</h3>
                </div>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p>Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-4 opacity-20" />
                        <p>No notifications sent yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700">
                        {history.map((notif) => (
                            <div key={notif.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 p-2 rounded-lg ${notif.type === 'alert' ? 'bg-red-500/10 text-red-400' :
                                            notif.type === 'update' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-green-500/10 text-green-400'
                                            }`}>
                                            {notif.type === 'alert' ? <AlertCircle className="w-5 h-5" /> :
                                                <Bell className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">{notif.title}</h4>
                                            <p className="text-sm text-slate-400 mt-1">{notif.content}</p>
                                            <div className="flex gap-4 mt-2 text-xs text-slate-500 uppercase tracking-wider">
                                                <span>To: {notif.target_type} {notif.target_tier || notif.target_tenant_id}</span>
                                                <span>•</span>
                                                <span>{new Date(notif.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded">
                                        SENT
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
