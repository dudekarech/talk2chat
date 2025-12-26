import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, Mail, Lock, User, Building, MessageSquare, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Check for invite parameters
    const inviteId = searchParams.get('invite');
    const inviteEmail = searchParams.get('email');
    const [inviteData, setInviteData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: inviteEmail || '',
        password: '',
        companyName: '',
        widgetColor: '#0ea5e9',
        widgetName: 'Support Bot'
    });

    useEffect(() => {
        if (inviteId) {
            loadInviteData();
        }
    }, [inviteId]);

    const loadInviteData = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', inviteId)
                .eq('status', 'pending')
                .single();

            if (error) throw error;

            if (data) {
                setInviteData(data);
                setFormData(prev => ({
                    ...prev,
                    name: data.name,
                    email: data.email
                }));
            }
        } catch (error: any) {
            console.error('Error loading invite:', error);
            setError('Invalid or expired invite link');
        }
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(prev => prev - 1);
        else navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Step 1: Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        company: formData.companyName
                    }
                }
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Failed to create user');
            }

            // Step 2: Handle tenant and profile creation
            if (inviteId && inviteData) {
                // Update existing invite profile
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        user_id: authData.user.id,
                        status: 'active'
                    })
                    .eq('id', inviteId);

                if (updateError) throw updateError;
            } else {
                // 🚀 CREATE NEW TENANT for regular signup
                const { data: tenant, error: tenantError } = await supabase
                    .from('tenants')
                    .insert({
                        name: formData.companyName,
                        owner_id: authData.user.id,
                        subscription_plan: 'free'
                    })
                    .select()
                    .single();

                if (tenantError) throw tenantError;

                // Create new profile linked to the tenant
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: authData.user.id,
                        email: formData.email,
                        name: formData.name,
                        role: 'admin', // The person who signs up is the Tenant Admin
                        tenant_id: tenant.id,
                        status: 'active'
                    });

                if (profileError) throw profileError;
            }

            // Success! Redirect to login
            setTimeout(() => {
                setIsLoading(false);
                navigate('/login');
            }, 1500);

        } catch (error: any) {
            console.error('Signup error:', error);
            setError(error.message || 'Failed to create account');
            setIsLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 30 : -30,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 30 : -30,
            opacity: 0
        })
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-[-20%] left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            {/* Header / Nav */}
            <div className="w-full max-w-md flex items-center justify-between mb-8 relative z-10">
                <button
                    onClick={handleBack}
                    className="flex items-center text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft size={16} className="mr-2" /> {step === 1 ? 'Home' : 'Back'}
                </button>
                {!inviteData && (
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i <= step ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <motion.div
                layout
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Progress Glow */}
                    {!inviteData && (
                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                    )}

                    <div className="mb-8 text-center">
                        <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-4">
                            <Zap size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {inviteData ? `Welcome, ${inviteData.name}!` : (
                                <>
                                    {step === 1 && "Create Account"}
                                    {step === 2 && "Company Details"}
                                    {step === 3 && "Customize Widget"}
                                </>
                            )}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {inviteData ? (
                                <>You've been invited as <span className="text-cyan-400 font-semibold">{inviteData.role.replace('_', ' ')}</span></>
                            ) : (
                                <>
                                    {step === 1 && "Start your 14-day free trial."}
                                    {step === 2 && "Tell us about your organization."}
                                    {step === 3 && "Make it yours before you launch."}
                                </>
                            )}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={step === 3 || inviteData ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                        <div className={inviteData ? "min-h-[200px]" : "min-h-[260px]"}>
                            <AnimatePresence mode="wait" custom={1}>
                                {/* Step 1 OR Invite Form */}
                                {(step === 1 || inviteData) && (
                                    <motion.div
                                        key="step1"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                                    placeholder="John Doe"
                                                    disabled={!!inviteData}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Email Address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                                    placeholder="name@company.com"
                                                    disabled={!!inviteEmail}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                                    placeholder="••••••••"
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>

                                        {inviteData && inviteData.department && (
                                            <div className="p-4 bg-cyan-900/20 border border-cyan-500/20 rounded-xl mt-4">
                                                <h4 className="text-sm font-semibold text-cyan-300 mb-1 flex items-center gap-2"><CheckCircle size={14} /> Invite Details</h4>
                                                <p className="text-xs text-slate-400">Role: {inviteData.role.replace('_', ' ').toUpperCase()}</p>
                                                {inviteData.department && <p className="text-xs text-slate-400">Department: {inviteData.department}</p>}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Step 2 - Company Details (Skip for invites) */}
                                {step === 2 && !inviteData && (
                                    <motion.div
                                        key="step2"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Company Name</label>
                                            <div className="relative group">
                                                <Building className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.companyName}
                                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                                    placeholder="Acme Inc."
                                                />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-cyan-900/20 border border-cyan-500/20 rounded-xl">
                                            <h4 className="text-sm font-semibold text-cyan-300 mb-1 flex items-center gap-2"><CheckCircle size={14} /> Multi-Tenant Ready</h4>
                                            <p className="text-xs text-slate-400">You can create unlimited workspaces for different clients or departments later from your dashboard.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3 - Widget Customization (Skip for invites) */}
                                {step === 3 && !inviteData && (
                                    <motion.div
                                        key="step3"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Widget Name</label>
                                            <div className="relative group">
                                                <MessageSquare className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.widgetName}
                                                    onChange={e => setFormData({ ...formData, widgetName: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                                    placeholder="Support Bot"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Brand Color</label>
                                            <div className="flex gap-4">
                                                {['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981'].map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, widgetColor: color })}
                                                        className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-110 flex items-center justify-center ${formData.widgetColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {formData.widgetColor === color && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Live Preview */}
                                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 flex items-center justify-between">
                                            <span className="text-sm text-slate-400">Live Preview:</span>
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg transition-colors duration-300" style={{ backgroundColor: formData.widgetColor }}>
                                                <MessageSquare size={16} />
                                                <span>Chat</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                            {step === 1 && !inviteData ? (
                                <div className="text-sm text-slate-400">
                                    Already have an account? <span onClick={() => navigate('/login')} className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium">Log in</span>
                                </div>
                            ) : (
                                <div />
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>
                                        {inviteData ? 'Complete Signup' : (step === 3 ? 'Launch Studio' : 'Next Step')}
                                        {!inviteData && step !== 3 && <ArrowRight size={18} />}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
