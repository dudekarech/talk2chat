import React, { useState, useEffect } from 'react';
import {
    User,
    Lock,
    Shield,
    Bell,
    Globe,
    Save,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff,
    UserCircle,
    Mail,
    Building2,
    KeyRound,
    MessageSquare,
    LifeBuoy,
    BarChart3,
    Palette,
    CreditCard
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'workspace' | 'channels'>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        company: '',
        role: ''
    });

    // Workspace State
    const [tenantInfo, setTenantInfo] = useState({
        id: '',
        name: '',
        balance: 0,
        limit: 0
    });

    // Password State
    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // Channels State
    const [integrations, setIntegrations] = useState({
        whatsapp: { enabled: false, phoneNumberId: '', apiKey: '', verifyToken: '' },
        instagram: { enabled: false, pageId: '', accessToken: '' },
        facebook: { enabled: false, pageId: '', accessToken: '' }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load User Profile
        const { data: userData } = await supabase
            .from('user_profiles')
            .select('name, email, role, company, tenant_id')
            .eq('user_id', user.id)
            .single();

        if (userData) {
            setProfile({
                name: userData.name || '',
                email: userData.email || '',
                company: userData.company || '',
                role: userData.role || ''
            });

            // Load Tenant/Workspace Info
            if (userData.tenant_id) {
                const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('id, name, ai_credits_balance, ai_usage_limit_monthly')
                    .eq('id', userData.tenant_id)
                    .single();

                if (tenantData) {
                    setTenantInfo({
                        id: tenantData.id,
                        name: tenantData.name || '',
                        balance: tenantData.ai_credits_balance || 0,
                        limit: tenantData.ai_usage_limit_monthly || 0
                    });
                }

                // Load Integrations from Widget Config
                const { data: widgetData } = await supabase
                    .from('global_widget_config')
                    .select('integrations')
                    .eq('tenant_id', userData.tenant_id)
                    .single();

                if (widgetData?.integrations) {
                    setIntegrations(widgetData.integrations);
                }
            }
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    name: profile.name,
                    company: profile.company
                })
                .eq('user_id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.new !== password.confirm) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password.new
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPassword({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateIntegrations = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: userData } = await supabase
                .from('user_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();

            if (!userData?.tenant_id) throw new Error('No tenant associated');

            const { error } = await supabase
                .from('global_widget_config')
                .update({ integrations })
                .eq('tenant_id', userData.tenant_id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Integrations updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Settings</h2>
                    <p className="text-slate-400 mt-1">Manage your professional identity and workspace preferences</p>
                </div>

                {message && (
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold animate-in slide-in-from-right-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/10'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 w-fit backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <User className="w-4 h-4" />
                    My Profile
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <Shield className="w-4 h-4" />
                    Security
                </button>
                <button
                    onClick={() => setActiveTab('workspace')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'workspace' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    Workspace
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <Bell className="w-4 h-4" />
                    Alerts
                </button>
                <button
                    onClick={() => setActiveTab('channels')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'channels' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    Channels
                </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {activeTab === 'profile' && (
                    <form onSubmit={handleUpdateProfile} className="p-10 space-y-10">
                        <div className="flex flex-col sm:flex-row items-center gap-8 luxury-profile-header">
                            <div className="relative group">
                                <div className="w-32 h-32 bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center text-5xl font-black text-white shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                                    {profile.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="absolute -bottom-3 -right-3 p-3 bg-slate-900 border border-slate-700 rounded-2xl text-blue-400 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    <Palette className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-3xl font-black text-white tracking-tight">{profile.name || 'Set Your Name'}</h3>
                                <p className="text-blue-400 font-bold text-sm tracking-widest uppercase mt-1">{profile.role || 'Member'}</p>
                                <div className="flex items-center gap-2 mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit mx-auto sm:mx-0">
                                    <Building2 className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-blue-200 font-medium">{profile.company || 'Enterprise Account'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Identity</label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full bg-slate-900/40 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-300"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Access (Private)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full bg-slate-900/20 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-500 cursor-not-allowed italic"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Professional Title</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={profile.company}
                                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                        className="w-full bg-slate-900/40 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-300"
                                        placeholder="Organization name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Regional Setting</label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    <select className="w-full bg-slate-900/40 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-300 appearance-none cursor-pointer">
                                        <option>Universal Time (UTC)</option>
                                        <option>Eastern (EST)</option>
                                        <option>Pacific (PST)</option>
                                        <option>European (CET)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-700/30 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5 transition-transform group-hover:scale-125" />
                                {loading ? 'UPDATING...' : 'SAVE DATA'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={handleChangePassword} className="p-10 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                <KeyRound className="w-8 h-8 text-blue-500" />
                                Access Policy
                            </h3>
                            <p className="text-slate-400 max-w-2xl font-medium">Reset your cryptographic key (password) to ensure your account remains impenetrable. We recommend a passphrase of at least 15 characters.</p>
                        </div>

                        <div className="max-w-xl space-y-8 bg-slate-900/40 p-10 rounded-[2rem] border border-slate-700/50">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">New System Passphrase</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password.new}
                                        onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-6 py-4 pr-14 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 tracking-widest"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Verify Passphrase</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password.confirm}
                                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 tracking-widest"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>

                            <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2">
                                <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-tighter">
                                    <Shield className="w-3 h-3" />
                                    Encryption Protocol
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium font-mono">Passwords are hashed using bcrypt/Argon2id and stored in isolated security silos. Staff cannot see your passphrase.</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-700/30">
                            <button
                                type="submit"
                                disabled={loading || !password.new}
                                className="px-12 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-blue-400 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:hover:bg-white"
                            >
                                {loading ? 'PROCESSING...' : 'CHANGE PASSPHRASE'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'workspace' && (
                    <div className="p-10 space-y-10 animate-in slide-in-from-bottom-5">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                <Building2 className="w-8 h-8 text-blue-500" />
                                Workspace Intelligence
                            </h3>
                            <p className="text-slate-400 font-medium">Information about your current deployment and resource allocation.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] border border-slate-700 shadow-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                        <CreditCard className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase bg-slate-800 px-3 py-1 rounded-full">AI Economy</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Available Intelligence</p>
                                    <p className="text-4xl font-black text-white">${tenantInfo.balance?.toFixed(2)}</p>
                                </div>
                                <div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-2/3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-right">Quota: {tenantInfo.limit?.toLocaleString()} Tokens/mo</p>
                            </div>

                            <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-slate-700/50 flex flex-col justify-between items-center text-center">
                                <div className="p-4 bg-purple-500/10 rounded-3xl mb-4">
                                    <Globe className="w-10 h-10 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-xl mb-2">{tenantInfo.name || 'Workspace'}</h4>
                                    <p className="text-slate-500 text-xs font-mono uppercase tracking-tighter">Instance: {tenantInfo.id?.substring(0, 8)}-prod</p>
                                </div>
                                <button className="mt-6 text-blue-400 text-xs font-black tracking-widest hover:text-white transition-colors uppercase underline decoration-2 underline-offset-8">
                                    Switch Workspace
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="p-10 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white">Signal Preferences</h3>
                            <p className="text-slate-400 font-medium">Define which events should trigger a visual or auditory signal.</p>
                        </div>

                        <div className="space-y-4 max-w-2xl">
                            {[
                                { title: 'Direct Messages', desc: 'Instant alerts for every new visitor interaction', icon: MessageSquare, enabled: true },
                                { title: 'Ticket Escalations', desc: 'Critical alerts for high-priority support movements', icon: LifeBuoy, enabled: true },
                                { title: 'Analytics Pulse', desc: 'Daily digests of workspace performance metrics', icon: BarChart3, enabled: false }
                            ].map((item, idx) => (
                                <div key={idx} className="group flex items-center justify-between p-6 bg-slate-900/40 hover:bg-slate-900/60 rounded-[1.5rem] border border-slate-700/30 transition-all duration-300">
                                    <div className="flex items-center gap-6">
                                        <div className="p-3 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                                            <item.icon className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-lg">{item.title}</p>
                                            <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked={item.enabled} />
                                        <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'channels' && (
                    <form onSubmit={handleUpdateIntegrations} className="p-10 space-y-10 animate-in slide-in-from-right-5">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                <Globe className="w-8 h-8 text-blue-500" />
                                Omnichannel Management
                            </h3>
                            <p className="text-slate-400 font-medium">Connect your Meta Business accounts to centralize your customer communication.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* WhatsApp */}
                            <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-slate-700/50 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                            <MessageSquare className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black">WhatsApp Business</h4>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">Official API Integration</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={integrations.whatsapp.enabled}
                                            onChange={(e) => setIntegrations({
                                                ...integrations,
                                                whatsapp: { ...integrations.whatsapp, enabled: e.target.checked }
                                            })}
                                        />
                                        <div className="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                                    </label>
                                </div>

                                <div className={`space-y-4 transition-all duration-500 ${integrations.whatsapp.enabled ? 'opacity-100 pointer-events-auto' : 'opacity-30 pointer-events-none grayscale'}`}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={integrations.whatsapp.phoneNumberId}
                                            onChange={(e) => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, phoneNumberId: e.target.value } })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                                            placeholder="1234567890..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Meta API System Token</label>
                                        <input
                                            type="password"
                                            value={integrations.whatsapp.apiKey}
                                            onChange={(e) => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, apiKey: e.target.value } })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                                            placeholder="EAABw..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Webhook Verify Token</label>
                                        <input
                                            type="text"
                                            value={integrations.whatsapp.verifyToken}
                                            onChange={(e) => setIntegrations({ ...integrations, whatsapp: { ...integrations.whatsapp, verifyToken: e.target.value } })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                                            placeholder="your_secret_token"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Instagram */}
                            <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-slate-700/50 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-pink-500/10 rounded-2xl">
                                            <Palette className="w-6 h-6 text-pink-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black">Instagram DM</h4>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">Social Commerce</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={integrations.instagram.enabled}
                                            onChange={(e) => setIntegrations({
                                                ...integrations,
                                                instagram: { ...integrations.instagram, enabled: e.target.checked }
                                            })}
                                        />
                                        <div className="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                                    </label>
                                </div>

                                <div className={`space-y-4 transition-all duration-500 ${integrations.instagram.enabled ? 'opacity-100 pointer-events-auto' : 'opacity-30 pointer-events-none grayscale'}`}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Account ID</label>
                                        <input
                                            type="text"
                                            value={integrations.instagram.pageId}
                                            onChange={(e) => setIntegrations({ ...integrations, instagram: { ...integrations.instagram, pageId: e.target.value } })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-pink-500/40 focus:outline-none"
                                            placeholder="IG-123..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Access Token</label>
                                        <input
                                            type="password"
                                            value={integrations.instagram.accessToken}
                                            onChange={(e) => setIntegrations({ ...integrations, instagram: { ...integrations.instagram, accessToken: e.target.value } })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-pink-500/40 focus:outline-none"
                                            placeholder="EAABw..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-700/30 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5 transition-transform group-hover:scale-125" />
                                {loading ? 'DEPLOYING...' : 'UPDATE CHANNELS'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
