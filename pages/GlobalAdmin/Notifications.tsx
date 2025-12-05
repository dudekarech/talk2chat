import React, { useState } from 'react';
import { Bell, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const Notifications: React.FC = () => {
    const [selectedTenants, setSelectedTenants] = useState<string>('all');
    const [messageTitle, setMessageTitle] = useState('');
    const [messageBody, setMessageBody] = useState('');

    const recentNotifications = [
        { id: 1, type: 'system', title: 'Scheduled Maintenance', message: 'System maintenance completed successfully', recipients: 'All Tenants', time: '2 hours ago', status: 'sent' },
        { id: 2, type: 'billing', title: 'Payment Reminder', message: 'Invoice payment due in 3 days', recipients: 'Global Logistics', time: '1 day ago', status: 'sent' },
        { id: 3, type: 'alert', title: 'High Latency Alert', message: 'High latency detected in EU-West region', recipients: 'All Tenants', time: '3 days ago', status: 'sent' },
        { id: 4, type: 'update', title: 'New Feature Release', message: 'AI Response Improvements now available', recipients: 'Enterprise Plan', time: '1 week ago', status: 'sent' },
    ];

    const handleSendNotification = () => {
        console.log('Sending notification:', { messageTitle, messageBody, selectedTenants });
        // Reset form
        setMessageTitle('');
        setMessageBody('');
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
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Recipients</label>
                            <select
                                value={selectedTenants}
                                onChange={(e) => setSelectedTenants(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Tenants</option>
                                <option value="enterprise">Enterprise Plan Only</option>
                                <option value="pro">Pro Plan Only</option>
                                <option value="trial">Trial Accounts</option>
                                <option value="custom">Custom Selection</option>
                            </select>
                        </div>

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
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Send Notification
                            </button>
                            <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                                Save as Draft
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Bell className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="font-bold text-white">Alert Settings</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">System Alerts</p>
                                <p className="text-xs text-slate-500">High load, downtime</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">SLA Breaches</p>
                                <p className="text-xs text-slate-500">Response time violations</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">Billing Issues</p>
                                <p className="text-xs text-slate-500">Failed payments</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">New Signups</p>
                                <p className="text-xs text-slate-500">Tenant registrations</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Notifications History */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="font-bold text-white">Notification History</h3>
                </div>
                <div className="divide-y divide-slate-700">
                    {recentNotifications.map((notif) => (
                        <div key={notif.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className={`mt-1 p-2 rounded-lg ${notif.type === 'alert' ? 'bg-red-500/10 text-red-400' :
                                            notif.type === 'system' ? 'bg-blue-500/10 text-blue-400' :
                                                notif.type === 'billing' ? 'bg-orange-500/10 text-orange-400' :
                                                    'bg-green-500/10 text-green-400'
                                        }`}>
                                        {notif.type === 'alert' ? <AlertCircle className="w-5 h-5" /> :
                                            notif.type === 'system' ? <Bell className="w-5 h-5" /> :
                                                notif.type === 'billing' ? <Clock className="w-5 h-5" /> :
                                                    <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{notif.title}</h4>
                                        <p className="text-sm text-slate-400 mt-1">{notif.message}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                            <span>To: {notif.recipients}</span>
                                            <span>•</span>
                                            <span>{notif.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded">
                                    {notif.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
