import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Settings,
    Users,
    BarChart3,
    CreditCard,
    LogOut,
    Search,
    Bell,
    Menu,
    LifeBuoy
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { NotificationDropdown } from '../../components/NotificationDropdown';

interface TenantProfile {
    name: string;
    email: string;
    company: string;
    role: string;
}

export const TenantLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<TenantProfile | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const { data } = await supabase
            .from('user_profiles')
            .select(`
                name, 
                email, 
                role,
                tenants (
                    name
                )
            `)
            .eq('user_id', user.id)
            .single();

        if (data) {
            setProfile({
                name: data.name,
                email: data.email,
                role: data.role,
                company: (data as any).tenants?.name || 'Tenant Admin'
            });
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/tenant/dashboard' },
        { icon: MessageSquare, label: 'Live Chat', path: '/tenant/chats' },
        { icon: Users, label: 'Team Members', path: '/tenant/team' },
        { icon: Settings, label: 'Widget Config', path: '/tenant/widget' },
        { icon: BarChart3, label: 'Analytics', path: '/tenant/analytics' },
        { icon: LifeBuoy, label: 'Support', path: '/tenant/support' },
        { icon: Bell, label: 'Notifications', path: '/tenant/notifications' },
        { icon: Settings, label: 'Settings', path: '/tenant/settings' },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-white font-sans">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-lg">T</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">TalkChat</h1>
                                <span className="text-xs text-blue-400 font-medium tracking-wider">TENANT</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
                            <span className="font-bold text-lg">T</span>
                        </div>
                    )}
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
                                    } ${!isSidebarOpen && 'justify-center px-2'}`}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <item.icon className="w-5 h-5" />
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${!isSidebarOpen && 'justify-center px-2'}`}
                        title={!isSidebarOpen ? 'Sign Out' : ''}
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="relative w-96 hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search chats, users, or settings..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationDropdown />
                        <div className="h-8 w-px bg-slate-700"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{profile?.name || 'Loading...'}</p>
                                <p className="text-xs text-slate-400">{profile?.company || 'Tenant Admin'}</p>
                            </div>
                            <div className="w-9 h-9 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden">
                                <span className="font-bold text-sm text-slate-300">
                                    {profile?.name?.charAt(0).toUpperCase() || 'T'}
                                </span>
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
