import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, Info, AlertTriangle, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService, SystemNotification } from '../services/notificationService';

export const NotificationDropdown: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadNotifications();
        // Set up poll or realtime later if needed
        const interval = setInterval(loadNotifications, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        const { data } = await notificationService.getNotifications();
        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await notificationService.markAsRead(id);
        loadNotifications();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="w-4 h-4 text-red-400" />;
            case 'update': return <Info className="w-4 h-4 text-blue-400" />;
            case 'announcement': return <Megaphone className="w-4 h-4 text-green-400" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-slate-800 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-white text-sm">System Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="text-xs text-blue-400 font-medium">{unreadCount} unread</span>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-700/50">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No notifications for you.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 transition-colors relative group ${notif.is_read ? 'opacity-60' : 'bg-blue-600/5'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${notif.is_read ? 'text-slate-300' : 'text-white'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {notif.content}
                                                </p>
                                                <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-tighter">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3 h-3 text-blue-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-700 bg-slate-900/30 text-center">
                            <button
                                onClick={() => {
                                    navigate('/tenant/notifications');
                                    setIsOpen(false);
                                }}
                                className="text-xs text-slate-400 hover:text-white transition-colors font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
