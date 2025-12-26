import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Users,
    BarChart3,
    ShieldAlert,
    Bell,
    Settings,
    LogOut,
    Search,
    MessageSquare,
    LifeBuoy
} from 'lucide-react';

export const GlobalAdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/global/dashboard' },
        { icon: MessageSquare, label: 'Shared Inbox', path: '/global/inbox' },
        { icon: Settings, label: 'Widget Config', path: '/global/widget' },
        { icon: Building2, label: 'Tenants', path: '/global/tenants' },
        { icon: CreditCard, label: 'Billing & Subs', path: '/global/billing' },
        { icon: Users, label: 'User Management', path: '/global/users' },
        { icon: BarChart3, label: 'Analytics', path: '/global/analytics' },
        { icon: ShieldAlert, label: 'Security & Audit', path: '/global/security' },
        { icon: Bell, label: 'Notifications', path: '/global/notifications' },
        { icon: LifeBuoy, label: 'Tickets', path: '/global/tickets' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('global_admin_token');
        navigate('/global/admin');
    };

    return (
        <div className="flex h-screen bg-slate-900 text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-lg">G</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">TalkChat</h1>
                            <span className="text-xs text-blue-400 font-medium tracking-wider">GLOBAL ADMIN</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tenants, users, or logs..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-800"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-700"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">Gilbert M.</p>
                                <p className="text-xs text-slate-400">Super Admin</p>
                            </div>
                            <div className="w-9 h-9 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Gilbert+M&background=0D8ABC&color=fff" alt="Admin" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
