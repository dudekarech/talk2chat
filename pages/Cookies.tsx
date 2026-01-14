import React, { useState } from 'react';
import { StaticPageLayout } from '../components/StaticPageLayout';
import { Shield, Cookie, BarChart, Settings } from 'lucide-react';

export const Cookies: React.FC = () => {
    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: true,
        marketing: false,
        personalization: true
    });

    const togglePreference = (key: keyof typeof preferences) => {
        if (key === 'essential') return; // Cannot toggle essential
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <StaticPageLayout
            title="Cookie Settings"
            description="Manage how we use cookies and tracking technologies to improve your experience."
        >
            <div className="space-y-10">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Settings className="text-brand-orange w-6 h-6" />
                        Consent Preferences
                    </h2>

                    <div className="space-y-6">
                        {/* Essential */}
                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Strictly Necessary</h3>
                                    <p className="text-xs text-slate-500">Essential for the website to function. Cannot be disabled.</p>
                                </div>
                            </div>
                            <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1 opacity-50 cursor-not-allowed">
                                <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <BarChart className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Analytics Cookies</h3>
                                    <p className="text-xs text-slate-500">Help us understand how visitors interact with our site.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => togglePreference('analytics')}
                                className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${preferences.analytics ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.analytics ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Customization */}
                        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <Cookie className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Personalization</h3>
                                    <p className="text-xs text-slate-500">Allows the site to remember choices you make (like your username).</p>
                                </div>
                            </div>
                            <button
                                onClick={() => togglePreference('personalization')}
                                className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${preferences.personalization ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.personalization ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <button className="mt-8 w-full bg-white text-slate-950 py-3 rounded-xl font-bold hover:bg-brand-orange hover:text-white transition-all shadow-lg">
                        Save Preferences
                    </button>
                </div>

                <div className="prose prose-invert prose-slate text-slate-300">
                    <h2 className="text-2xl font-bold text-white">About our Cookies</h2>
                    <p>
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    </p>
                    <p>
                        Our chat widget uses local storage and cookies to maintain your conversation state across page refreshes and different sessions. This is necessary to provide a continuous support experience.
                    </p>
                </div>
            </div>
        </StaticPageLayout>
    );
};
