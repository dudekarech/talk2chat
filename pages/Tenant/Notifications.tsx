import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, Megaphone, CheckCircle2, ChevronRight, Loader2, Inbox } from 'lucide-react';
import { notificationService, SystemNotification } from '../../services/notificationService';

export const TenantNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotif, setSelectedNotif] = useState<SystemNotification | null>(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const { data } = await notificationService.getNotifications();
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading tenant notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRead = async (notif: SystemNotification) => {
        setSelectedNotif(notif);
        if (!notif.is_read) {
            await notificationService.markAsRead(notif.id);
            // Update local state without full reload for snappiness
            setNotifications(prev => prev.map(n =>
                n.id === notif.id ? { ...n, is_read: true } : n
            ));
        }
    };

    const getBadgeStyle = (type: string) => {
        switch (type) {
            case 'alert': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'update': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'announcement': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            case 'update': return <Info className="w-5 h-5 text-blue-400" />;
            case 'announcement': return <Megaphone className="w-5 h-5 text-green-400" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">System Notifications</h2>
                    <p className="text-slate-400">Updates, maintenance alerts, and system news from TalkChat Studio</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                        {notifications.filter(n => !n.is_read).length} Unread
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List View */}
                <div className={`${selectedNotif ? 'lg:col-span-4 hidden lg:block' : 'lg:col-span-12'} space-y-3`}>
                    {isLoading ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
                            <p className="text-slate-400">Fetching messages...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                            <Inbox className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No system notifications found.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <button
                                key={notif.id}
                                onClick={() => handleRead(notif)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative ${selectedNotif?.id === notif.id
                                        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/20'
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className={`text-sm font-bold truncate ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>
                                                {notif.title}
                                            </p>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-1">{notif.content}</p>
                                        <p className="text-[10px] text-slate-600 mt-2 font-mono uppercase">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform group-hover:translate-x-1 ${selectedNotif?.id === notif.id ? 'rotate-90 text-blue-400' : ''}`} />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Detail View */}
                {selectedNotif && (
                    <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
                            {/* Glass background for detail view */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -mr-32 -mt-32" />

                            <div className="p-8 relative">
                                <div className="flex items-center justify-between mb-8">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${getBadgeStyle(selectedNotif.type)}`}>
                                        {selectedNotif.type}
                                    </span>
                                    <button
                                        onClick={() => setSelectedNotif(null)}
                                        className="lg:hidden text-slate-400 hover:text-white"
                                    >
                                        Back to list
                                    </button>
                                </div>

                                <div className="flex items-start gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                                        {getIcon(selectedNotif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight">
                                            {selectedNotif.title}
                                        </h1>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <p>Sent by <strong>System Admin</strong></p>
                                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                            <p>{new Date(selectedNotif.created_at).toLocaleDateString()} at {new Date(selectedNotif.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 prose prose-invert max-w-none">
                                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                                        {selectedNotif.content}
                                    </div>
                                </div>

                                <div className="mt-12 flex items-center gap-4">
                                    <div className="flex-1 h-px bg-slate-700/50" />
                                    <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                                        <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                                        You've acknowledged this message
                                    </div>
                                    <div className="flex-1 h-px bg-slate-700/50" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
