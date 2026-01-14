import React, { useState, useEffect } from 'react';
import {
    Settings,
    Code,
    Eye,
    Palette,
    MessageSquare,
    Clock,
    Shield,
    Zap,
    Bot,
    MousePointer,
    Bell,
    FileText,
    Globe,
    Sparkles,
    Brain,
    BarChart3,
    Users,
    Loader2,
    Check,
    AlertCircle,
    Key,
    BookOpen,
    HelpCircle,
    Trash2,
    Plus,
    Lock,
    RefreshCw,
    Gift,
    AlertTriangle,
    Ghost,
    Rabbit,
    Sun,
    TreePine
} from 'lucide-react';
import { useWidgetConfig } from '../../hooks/useWidgetConfig';
import { TenantWidgetPreview } from '../../components/TenantWidgetPreview';
import { widgetConfigService } from '../../services/widgetConfigService';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';

interface WidgetConfigurationProps {
    /** Force use of global config (for landing page). Ignores logged-in user's tenant. */
    forceGlobal?: boolean;
}

export const WidgetConfiguration: React.FC<WidgetConfigurationProps> = ({ forceGlobal = false }) => {
    const [activeSection, setActiveSection] = useState('appearance');
    const [showPreview, setShowPreview] = useState(false);

    const {
        config: widgetConfig,
        setConfig: setWidgetConfig,
        isLoading,
        isSaving,
        saveSuccess,
        saveError,
        saveConfig,
        resetToDefaults,
        reloadConfig
    } = useWidgetConfig(forceGlobal, true);

    const [aiBalance, setAiBalance] = useState<number>(0);
    const [usageStats, setUsageStats] = useState<any[]>([]);
    const [isRefreshingStats, setIsRefreshingStats] = useState(false);

    // KB State
    const [kbStats, setKbStats] = useState<{ count: number }>({ count: 0 });
    const [isSyncingKB, setIsSyncingKB] = useState(false);
    const [kbSyncError, setKbSyncError] = useState<string | null>(null);
    const [kbSyncSuccess, setKbSyncSuccess] = useState(false);

    // Auto-hide success message after 3 seconds
    useEffect(() => {
        if (saveSuccess) {
            const timer = setTimeout(() => {
                // Success message will auto-hide
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [saveSuccess]);

    useEffect(() => {
        if (activeSection === 'ai' && !forceGlobal) {
            loadUsageStats();
        }
    }, [activeSection, forceGlobal]);

    const loadUsageStats = async () => {
        setIsRefreshingStats(true);
        try {
            const { balance } = await widgetConfigService.getTenantBalance();
            const { stats } = await widgetConfigService.getAIUsageStats();
            setAiBalance(balance || 0);
            setUsageStats(stats || []);

            // Also load KB stats
            if (widgetConfig?.tenant_id) {
                const stats = await knowledgeBaseService.getKnowledgeStats(widgetConfig.tenant_id);
                setKbStats(stats);
            }
        } catch (error) {
            console.error('Failed to load usage stats:', error);
        } finally {
            setIsRefreshingStats(false);
        }
    };

    const handleSyncKnowledge = async () => {
        if (!widgetConfig?.tenant_id || !widgetConfig.aiKnowledgeBase) {
            setKbSyncError("Knowledge base content is required before syncing.");
            return;
        }

        setIsSyncingKB(true);
        setKbSyncError(null);
        setKbSyncSuccess(false);

        try {
            const result = await knowledgeBaseService.syncTextKnowledge(
                widgetConfig.tenant_id,
                widgetConfig.aiKnowledgeBase
            );

            if (result.success) {
                setKbSyncSuccess(true);
                const stats = await knowledgeBaseService.getKnowledgeStats(widgetConfig.tenant_id);
                setKbStats(stats);
            } else {
                setKbSyncError(result.error?.message || "Sync failed. Ensure your AI proxy is configured.");
            }
        } catch (error: any) {
            setKbSyncError(error.message);
        } finally {
            setIsSyncingKB(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading widget configuration...</p>
                </div>
            </div>
        );
    }

    if (!widgetConfig) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-900">
                <div className="text-center text-red-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg">Failed to load configuration</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        const success = await saveConfig(widgetConfig);
        if (success) {
            // Reload config to ensure UI is in sync with database
            await reloadConfig();
        }
    };

    const handleReset = async () => {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            await resetToDefaults();
        }
    };

    const handlePreview = () => {
        setShowPreview(true);
    };

    const sections = [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'installation', label: 'Installation', icon: Code },
        { id: 'content', label: 'Content & Messages', icon: MessageSquare },
        { id: 'behavior', label: 'Behavior', icon: Clock },
        { id: 'prechat', label: 'Pre-Chat Form', icon: FileText },
        { id: 'ai', label: 'AI Integration', icon: Bot },
        { id: 'tracking', label: 'Visitor Tracking', icon: MousePointer },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'integrations', label: 'Integrations', icon: Globe },
        { id: 'security', label: 'Security & Privacy', icon: Shield },
        { id: 'advanced', label: 'Advanced', icon: Settings },
    ];

    // Helper component for toggle switches
    const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked === true}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-900">
            {/* Success Toast */}
            {saveSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in">
                    <Check className="w-6 h-6" />
                    <div>
                        <p className="font-semibold">Configuration Saved!</p>
                        <p className="text-sm text-green-100">Your changes have been applied</p>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {saveError && (
                <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                        <p className="font-semibold">Error Saving</p>
                        <p className="text-sm text-red-100">{saveError}</p>
                    </div>
                </div>
            )}

            {/* Left Sidebar */}
            <div className="w-64 border-r border-slate-700 bg-slate-800/50 overflow-y-auto">
                <div className="p-4">
                    <h2 className="font-bold text-white mb-4">Widget Settings</h2>
                    <div className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeSection === section.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                <section.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{section.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6 pb-32">
                    {/* APPEARANCE SECTION */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Appearance</h3>
                                <p className="text-slate-400">Customize the visual design of your chat widget</p>
                            </div>

                            {/* Colors */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white">Colors</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Primary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={widgetConfig.primaryColor || '#8b5cf6'}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                                                className="w-12 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={widgetConfig.primaryColor || '#8b5cf6'}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Secondary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={widgetConfig.secondaryColor || '#ec4899'}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, secondaryColor: e.target.value })}
                                                className="w-12 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={widgetConfig.secondaryColor || '#ec4899'}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, secondaryColor: e.target.value })}
                                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Background Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={widgetConfig.backgroundColor || '#0f172a'}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, backgroundColor: e.target.value })}
                                                className="w-12 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={widgetConfig.backgroundColor || '#0f172a'}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, backgroundColor: e.target.value })}
                                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                                        <select
                                            value={widgetConfig.theme || 'dark'}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, theme: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        >
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                            <option value="auto">Auto (System)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SEASONAL THEMES - Global Admin Only */}
                            {forceGlobal && (
                                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <TreePine className="w-5 h-5 text-green-400" />
                                        <h4 className="font-semibold text-white">Seasonal Decorations</h4>
                                    </div>
                                    <p className="text-sm text-slate-400">Add some holiday spirit to the TalkChat landing page widget!</p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'none', label: 'None', icon: MessageSquare, color: 'text-slate-400' },
                                            { id: 'christmas', label: 'Christmas', icon: Gift, color: 'text-red-500' },
                                            { id: 'halloween', label: 'Halloween', icon: Ghost, color: 'text-orange-500' },
                                            { id: 'easter', label: 'Easter', icon: Rabbit, color: 'text-pink-400' },
                                        ].map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setWidgetConfig({ ...widgetConfig, seasonalTheme: theme.id })}
                                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${(widgetConfig.seasonalTheme || 'none') === theme.id
                                                    ? 'bg-blue-600/10 border-blue-600'
                                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                                                    }`}
                                            >
                                                <theme.icon className={`w-8 h-8 ${theme.color}`} />
                                                <span className="text-sm font-medium text-white">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Branding */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white">Branding</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
                                        <input
                                            type="text"
                                            value={widgetConfig.teamName || 'Support Team'}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, teamName: e.target.value })}
                                            placeholder="e.g., Support Team"
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Company Logo URL</label>
                                        <input
                                            type="text"
                                            value={widgetConfig.companyLogo || ''}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, companyLogo: e.target.value })}
                                            placeholder="https://example.com/logo.png"
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <p className="text-white font-medium">Show "Powered by TalkChat"</p>
                                        <p className="text-xs text-slate-500">Display branding in widget footer</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.showPoweredBy !== false}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, showPoweredBy: checked })}
                                    />
                                </div>
                            </div>

                            {/* Layout */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white">Layout & Style</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                                        <select
                                            value={widgetConfig.position || 'bottom-right'}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        >
                                            <option value="bottom-right">Bottom Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="top-right">Top Right</option>
                                            <option value="top-left">Top Left</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Widget Shape</label>
                                        <select
                                            value={widgetConfig.widgetShape || 'rounded'}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, widgetShape: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        >
                                            <option value="rounded">Rounded</option>
                                            <option value="square">Square</option>
                                            <option value="circle">Circle</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Font Size</label>
                                        <select
                                            value={widgetConfig.fontSize || 'medium'}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, fontSize: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        >
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Show Agent Avatars</p>
                                            <p className="text-xs text-slate-500">Display profile pictures</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.showAgentAvatars !== false}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, showAgentAvatars: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Show Timestamps</p>
                                            <p className="text-xs text-slate-500">Display message times</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.showTimestamps !== false}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, showTimestamps: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INSTALLATION SECTION */}
                    {activeSection === 'installation' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Installation</h3>
                                <p className="text-slate-400">Add the following code to your website to enable the chat widget.</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                                <div className="p-4 bg-slate-700/30 border-b border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Code className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-medium text-slate-200">Widget Embed Script</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const codeElement = document.getElementById('embed-code-snippet');
                                            if (codeElement) {
                                                navigator.clipboard.writeText(codeElement.innerText);
                                                // We can use a more subtle toast later, but alert works for now
                                                alert('Embed code copied to clipboard!');
                                            }
                                        }}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        <Check className="w-3 h-3" />
                                        Copy Code
                                    </button>
                                </div>
                                <div className="p-6 bg-slate-900/50">
                                    <pre id="embed-code-snippet" className="text-sm font-mono text-blue-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                                        {`<!-- TalkChat Widget Embed Code -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['TalkChat-Widget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','tkc','${window.location.origin}/widget-loader.js'));
  tkc('init', {
    tenantId: '${widgetConfig.tenantId || 'global'}',
    baseUrl: '${window.location.origin}'
  });
</script>`}
                                    </pre>
                                </div>
                                <div className="p-4 bg-blue-500/5 border-t border-slate-700">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5">
                                            <AlertCircle className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Paste this snippet right before the closing <code className="text-blue-300">&lt;/body&gt;</code> tag on every page where you want the widget to appear.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Globe className="w-5 h-5 text-purple-400" />
                                        <h4 className="font-semibold text-white">Domain Whitelisting</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">Ensure your website's domain is allowed in the security settings to prevent unauthorized usage.</p>
                                    <button
                                        onClick={() => setActiveSection('security')}
                                        className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                    >
                                        Configure Security →
                                    </button>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Sparkles className="w-5 h-5 text-orange-400" />
                                        <h4 className="font-semibold text-white">Customization</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">Your changes are applied in real-time. Any updates made here will reflect instantly on your website.</p>
                                    <button
                                        onClick={() => setActiveSection('appearance')}
                                        className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                    >
                                        Edit Appearance →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENT SECTION */}
                    {activeSection === 'content' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Content & Messages</h3>
                                <p className="text-slate-400">Customize the text displayed in your widget</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Welcome Message</label>
                                    <textarea
                                        value={widgetConfig.welcomeMessage || 'Hello! How can we help you today?'}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, welcomeMessage: e.target.value })}
                                        placeholder="First message visitors see"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Offline Message</label>
                                    <textarea
                                        value={widgetConfig.offlineMessage || 'We\'re currently offline. Leave a message!'}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, offlineMessage: e.target.value })}
                                        placeholder="Shown when agents are offline"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Thank You Message</label>
                                    <textarea
                                        value={widgetConfig.thankYouMessage || 'Thank you for chatting with us!'}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, thankYouMessage: e.target.value })}
                                        placeholder="Shown when chat ends"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Input Placeholder</label>
                                    <input
                                        type="text"
                                        value={widgetConfig.inputPlaceholder || 'Type your message...'}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, inputPlaceholder: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Button Text</label>
                                    <input
                                        type="text"
                                        value={widgetConfig.buttonText || 'Chat with us'}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, buttonText: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BEHAVIOR SECTION */}
                    {activeSection === 'behavior' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Behavior</h3>
                                <p className="text-slate-400">Control how and when your widget appears</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white">Auto-Open Settings</h4>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Auto Open Widget</p>
                                        <p className="text-xs text-slate-500">Automatically open chat after delay</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.autoOpen === true}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, autoOpen: checked })}
                                    />
                                </div>

                                {widgetConfig.autoOpen && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Auto Open Delay (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={widgetConfig.autoOpenDelay || 5}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, autoOpenDelay: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Sound Notifications</p>
                                        <p className="text-xs text-slate-500">Play sound on new messages</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.soundNotifications === true}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, soundNotifications: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Hide on Mobile</p>
                                        <p className="text-xs text-slate-500">Hide widget on mobile devices</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.hideOnMobile === true}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, hideOnMobile: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Typing Indicator</p>
                                        <p className="text-xs text-slate-500">Show when agent is typing</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.typingIndicator !== false}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, typingIndicator: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRECHAT SECTION */}
                    {activeSection === 'prechat' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Pre-Chat Form</h3>
                                <p className="text-slate-400">Collect visitor information before chat starts</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Require Name</p>
                                        <p className="text-xs text-slate-500">Visitors must provide their name</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.requireName !== false}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, requireName: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Require Email</p>
                                        <p className="text-xs text-slate-500">Visitors must provide their email</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.requireEmail === true}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, requireEmail: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Require Phone</p>
                                        <p className="text-xs text-slate-500">Visitors must provide their phone number</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.requirePhone === true}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, requirePhone: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI SECTION */}
                    {activeSection === 'ai' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">AI Integration</h3>
                                <p className="text-slate-400">Enable AI-powered features for intelligent responses</p>
                            </div>

                            {/* AI USAGE & BALANCE (ECONOMY) */}
                            {!forceGlobal && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Zap className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-300">Available Credits</p>
                                        </div>
                                        <p className="text-3xl font-bold text-white">${aiBalance.toFixed(2)}</p>
                                        <button className="mt-3 text-[10px] text-blue-400 font-bold hover:underline flex items-center gap-1">
                                            RECHARGE NOW <Plus className="w-2.5 h-2.5" />
                                        </button>
                                    </div>

                                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                                <BarChart3 className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-300">Total Tokens (30d)</p>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {usageStats.reduce((acc, curr) => acc + (curr.tokens_input + curr.tokens_output), 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-2 italic">Based on last 100 requests</p>
                                    </div>

                                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-green-500/10 rounded-lg">
                                                <Check className="w-4 h-4 text-green-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-300">Provider Health</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <p className="text-xl font-bold text-white uppercase">{widgetConfig.aiProvider || 'Stable'}</p>
                                        </div>
                                        <button
                                            onClick={loadUsageStats}
                                            disabled={isRefreshingStats}
                                            className="mt-3 text-[10px] text-slate-400 font-bold hover:text-white flex items-center gap-1 uppercase"
                                        >
                                            {isRefreshingStats ? 'Refreshing...' : 'Update Stats'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium text-lg">Enable AI Assistant</p>
                                        <p className="text-xs text-slate-500">Use AI to help respond to customer queries</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.aiEnabled === true}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, aiEnabled: checked })}
                                    />
                                </div>

                                {widgetConfig.aiEnabled && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">AI Provider</label>
                                                <select
                                                    value={widgetConfig.aiProvider || 'gemini'}
                                                    onChange={(e) => {
                                                        const provider = e.target.value;
                                                        let defaultModel = 'gemini-1.5-flash';
                                                        if (provider === 'openai') defaultModel = 'gpt-4o-mini';
                                                        if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-20240620';
                                                        if (provider === 'mistral') defaultModel = 'mistral-large-latest';
                                                        if (provider === 'deepseek') defaultModel = 'deepseek-chat';
                                                        if (provider === 'openrouter') defaultModel = 'google/gemini-2.0-flash-001';

                                                        setWidgetConfig({
                                                            ...widgetConfig,
                                                            aiProvider: provider,
                                                            aiModel: defaultModel
                                                        });
                                                    }}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                                >
                                                    <option value="talkchat">TalkChat AI (Managed - Uses Credits)</option>
                                                    <option value="gemini">Google Gemini</option>
                                                    <option value="openai">OpenAI GPT</option>
                                                    <option value="anthropic">Anthropic Claude</option>
                                                    <option value="mistral">Mistral AI</option>
                                                    <option value="deepseek">DeepSeek AI</option>
                                                    <option value="openrouter">OpenRouter (Most Models)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">AI Model</label>
                                                <select
                                                    value={widgetConfig.aiModel || 'gemini-1.5-flash'}
                                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, aiModel: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                                >
                                                    {widgetConfig.aiProvider === 'talkchat' && (
                                                        <>
                                                            <option value="gemini-1.5-flash">TalkChat Flash (Fast & Efficient)</option>
                                                            <option value="gemini-1.5-pro">TalkChat Pro (Complex Tasks)</option>
                                                        </>
                                                    )}
                                                    {widgetConfig.aiProvider === 'gemini' && (
                                                        <>
                                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Smart)</option>
                                                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Next-gen)</option>
                                                        </>
                                                    )}
                                                    {widgetConfig.aiProvider === 'openai' && (
                                                        <>
                                                            <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                                                            <option value="gpt-4o-mini">GPT-4o mini (Fast & Cheap)</option>
                                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                        </>
                                                    )}
                                                    {widgetConfig.aiProvider === 'anthropic' && (
                                                        <>
                                                            <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet (Most Smart)</option>
                                                            <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</option>
                                                            <option value="claude-3-opus-20240229">Claude 3 Opus (Powerful)</option>
                                                        </>
                                                    )}
                                                    {widgetConfig.aiProvider === 'mistral' && (
                                                        <>
                                                            <option value="mistral-large-latest">Mistral Large</option>
                                                            <option value="mistral-small-latest">Mistral Small</option>
                                                            <option value="open-mixtral-8x7b">Mixtral 8x7b</option>
                                                        </>
                                                    )}
                                                    {widgetConfig.aiProvider === 'deepseek' && (
                                                        <>
                                                            <option value="deepseek-chat">DeepSeek Chat</option>
                                                            <option value="deepseek-coder">DeepSeek Coder</option>
                                                        </>
                                                    )}
                                                    {widgetConfig.aiProvider === 'openrouter' && (
                                                        <>
                                                            <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash (Free/Fast)</option>
                                                            <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (Free)</option>
                                                            <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                                                            <option value="gryphe/mythomax-l2-13b">MythoMax 13B</option>
                                                            <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</option>
                                                            <option value="openrouter/auto">Auto (Best for current task)</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700 pt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Key className="w-5 h-5 text-blue-400" />
                                                <h4 className="font-semibold text-white">API Configuration</h4>
                                            </div>
                                            <div className="space-y-4">
                                                {widgetConfig.aiProvider === 'talkchat' ? (
                                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 flex items-start gap-4">
                                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                                            <Zap className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-white font-medium mb-1">TalkChat Managed AI</h5>
                                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                                No API key required. This provider uses your TalkChat Studio credits.
                                                                Responses are optimized for customer support and reliability.
                                                            </p>
                                                            <div className="mt-3 flex items-center gap-3">
                                                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                                    Active
                                                                </span>
                                                                <button className="text-[10px] text-blue-400 hover:underline">
                                                                    View pricing & credits →
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                                            {widgetConfig.aiProvider === 'gemini' ? 'Google Gemini API Key' :
                                                                widgetConfig.aiProvider === 'openai' ? 'OpenAI Secret Key' :
                                                                    widgetConfig.aiProvider === 'anthropic' ? 'Anthropic API Key' :
                                                                        widgetConfig.aiProvider === 'mistral' ? 'Mistral API Key' :
                                                                            widgetConfig.aiProvider === 'deepseek' ? 'DeepSeek API Key' :
                                                                                widgetConfig.aiProvider === 'openrouter' ? 'OpenRouter API Key' : 'AI Provider API Key'}
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="password"
                                                                value={
                                                                    widgetConfig.aiProvider === 'gemini' ? (widgetConfig.aiApiKey || '') :
                                                                        widgetConfig.aiProvider === 'openai' ? (widgetConfig.openaiApiKey || '') :
                                                                            widgetConfig.aiProvider === 'anthropic' ? (widgetConfig.anthropicApiKey || '') :
                                                                                widgetConfig.aiProvider === 'mistral' ? (widgetConfig.mistralApiKey || '') :
                                                                                    widgetConfig.aiProvider === 'deepseek' ? (widgetConfig.deepseekApiKey || '') :
                                                                                        widgetConfig.aiProvider === 'openrouter' ? (widgetConfig.openrouterApiKey || '') : ''
                                                                }
                                                                onChange={(e) => {
                                                                    const key = e.target.value;
                                                                    const provider = widgetConfig.aiProvider;
                                                                    if (provider === 'gemini') setWidgetConfig({ ...widgetConfig, aiApiKey: key });
                                                                    else if (provider === 'openai') setWidgetConfig({ ...widgetConfig, openaiApiKey: key });
                                                                    else if (provider === 'anthropic') setWidgetConfig({ ...widgetConfig, anthropicApiKey: key });
                                                                    else if (provider === 'mistral') setWidgetConfig({ ...widgetConfig, mistralApiKey: key });
                                                                    else if (provider === 'deepseek') setWidgetConfig({ ...widgetConfig, deepseekApiKey: key });
                                                                    else if (provider === 'openrouter') setWidgetConfig({ ...widgetConfig, openrouterApiKey: key });
                                                                }}
                                                                placeholder={`Enter your ${widgetConfig.aiProvider} API key...`}
                                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                            />
                                                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                        </div>
                                                        {widgetConfig.aiProvider === 'openrouter' &&
                                                            widgetConfig.openrouterApiKey &&
                                                            (!widgetConfig.openrouterApiKey.startsWith('sk-or-v1-') || widgetConfig.openrouterApiKey.length < 50) && (
                                                                <p className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    Key format issue: OpenRouter keys usually start with 'sk-or-v1-' and are long.
                                                                </p>
                                                            )}
                                                        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                                            <Shield className="w-3 h-3" />
                                                            Keys are stored securely and used only for your bot's queries.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700 pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5 text-purple-400" />
                                                    <h4 className="font-semibold text-white">Intelligent Knowledge Base</h4>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${kbStats.count > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400 uppercase'}`}>
                                                        {kbStats.count > 0 ? `${kbStats.count} CHUNKS INDEXED` : 'NO DATA'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                                        Training Content / Business Rules
                                                    </label>
                                                    <textarea
                                                        value={widgetConfig.aiKnowledgeBase || ''}
                                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, aiKnowledgeBase: e.target.value })}
                                                        rows={8}
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                                        placeholder="Paste your business info, FAQs, support docs, or specific rules here. The AI will use this as its shared brain."
                                                    />
                                                    <p className="text-[10px] text-slate-500 mt-2">
                                                        The AI strictly follows this information. For best results, use structured text like "Q: ... A: ..." or bullet points.
                                                    </p>
                                                </div>

                                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                                            <Brain className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="text-white font-medium mb-1 flex items-center gap-2">
                                                                Vector Search Sync
                                                                <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Pro</span>
                                                            </h5>
                                                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                                                To enable instant, low-cost searching across massive documents, your knowledge must be indexed into our vector brain.
                                                            </p>

                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={handleSyncKnowledge}
                                                                    disabled={isSyncingKB || !widgetConfig.aiKnowledgeBase}
                                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isSyncingKB ? (
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    ) : (
                                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                                    )}
                                                                    {isSyncingKB ? 'CHUNKING & SYNCING...' : 'SYNC TO INTELLIGENCE'}
                                                                </button>

                                                                {kbSyncSuccess && (
                                                                    <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
                                                                        <Check className="w-4 h-4" /> Indexed successfully!
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {kbSyncError && (
                                                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                                    <p className="text-[10px] text-red-400 flex items-center gap-1.5">
                                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                                        {kbSyncError}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700 pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <HelpCircle className="w-5 h-5 text-orange-400" />
                                                    <h4 className="font-semibold text-white">Quick Responses / FAQ</h4>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newFaqs = [...(widgetConfig.faqs || []), { question: '', answer: '', category: 'General' }];
                                                        setWidgetConfig({ ...widgetConfig, faqs: newFaqs });
                                                    }}
                                                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add FAQ
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                {(!widgetConfig.faqs || widgetConfig.faqs.length === 0) ? (
                                                    <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl">
                                                        <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">No FAQs added yet.</p>
                                                    </div>
                                                ) : (
                                                    widgetConfig.faqs.map((faq: any, index: number) => (
                                                        <div key={index} className="bg-slate-900/30 border border-slate-700 rounded-xl p-4 space-y-3 relative group">
                                                            <button
                                                                onClick={() => {
                                                                    const newFaqs = widgetConfig.faqs.filter((_: any, i: number) => i !== index);
                                                                    setWidgetConfig({ ...widgetConfig, faqs: newFaqs });
                                                                }}
                                                                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    value={faq.question}
                                                                    onChange={(e) => {
                                                                        const newFaqs = [...widgetConfig.faqs];
                                                                        newFaqs[index].question = e.target.value;
                                                                        setWidgetConfig({ ...widgetConfig, faqs: newFaqs });
                                                                    }}
                                                                    placeholder="Question (e.g. What are your pricing plans?)"
                                                                    className="w-full bg-transparent border-none p-0 text-white font-medium placeholder:text-slate-600 focus:ring-0 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <textarea
                                                                    value={faq.answer}
                                                                    onChange={(e) => {
                                                                        const newFaqs = [...widgetConfig.faqs];
                                                                        newFaqs[index].answer = e.target.value;
                                                                        setWidgetConfig({ ...widgetConfig, faqs: newFaqs });
                                                                    }}
                                                                    placeholder="Answer (The bot will use this to respond)"
                                                                    className="w-full bg-transparent border-none p-0 text-slate-400 placeholder:text-slate-600 focus:ring-0 text-xs resize-none h-16"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700 pt-6">
                                            <h4 className="font-semibold text-white mb-4">Automation Features</h4>
                                            <div className="space-y-4">
                                                {[
                                                    { key: 'aiAutoRespond', label: 'Auto-Respond to Questions', desc: 'AI automatically answers FAQs' },
                                                    { key: 'aiGreeting', label: 'AI-Powered Greetings', desc: 'Personalized welcome messages' },
                                                    { key: 'aiSmartSuggestions', label: 'Smart Reply Suggestions', desc: 'AI suggests responses for agents' },
                                                    { key: 'aiSentimentAnalysis', label: 'Sentiment Analysis', desc: 'Detect customer emotions in real-time' },
                                                    { key: 'aiLanguageDetection', label: 'Auto Language Detection', desc: 'Detect and translate languages' },
                                                ].map((feature) => (
                                                    <div key={feature.key} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-white font-medium">{feature.label}</p>
                                                            <p className="text-xs text-slate-500">{feature.desc}</p>
                                                        </div>
                                                        <ToggleSwitch
                                                            checked={widgetConfig[feature.key as keyof typeof widgetConfig] === true}
                                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, [feature.key]: checked })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VISITOR TRACKING SECTION */}
                    {activeSection === 'tracking' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Visitor Tracking</h3>
                                <p className="text-slate-400">Track visitor behavior and interactions for better insights</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
                                {[
                                    { key: 'trackVisitors', label: 'Enable Visitor Tracking', desc: 'Track individual visitor sessions' },
                                    { key: 'trackPageViews', label: 'Track Page Views', desc: 'See which pages visitors browse' },
                                    { key: 'trackMouseMovement', label: 'Track Mouse Movement', desc: 'Heatmap and cursor tracking' },
                                    { key: 'trackClicks', label: 'Track Clicks', desc: 'Monitor where visitors click' },
                                    { key: 'trackScrollDepth', label: 'Track Scroll Depth', desc: 'See how far visitors scroll' },
                                    { key: 'trackTimeOnPage', label: 'Track Time on Page', desc: 'Measure engagement duration' },
                                    { key: 'captureScreenshots', label: 'Capture Screenshots', desc: 'Visual snapshots of visitor sessions' },
                                    { key: 'sessionRecording', label: 'Session Recording', desc: 'Record full visitor sessions (Privacy warning)' },
                                ].map((feature) => (
                                    <div key={feature.key} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">{feature.label}</p>
                                            <p className="text-xs text-slate-500">{feature.desc}</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig[feature.key as keyof typeof widgetConfig] === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, [feature.key]: checked })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS SECTION */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Notifications</h3>
                                <p className="text-slate-400">Configure how you want to be notified</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
                                {[
                                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send notifications via email' },
                                    { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Browser push notifications' },
                                    { key: 'mobileNotifications', label: 'Mobile Notifications', desc: 'Mobile push notifications' },
                                    { key: 'notifyOnNewChat', label: 'Notify on New Chat', desc: 'Alert when new chat starts' },
                                    { key: 'notifyOnMessage', label: 'Notify on Message', desc: 'Alert on each new message' },
                                    { key: 'enableRating', label: 'Enable Chat Rating', desc: 'Ask visitors to rate their experience' },
                                ].map((feature) => (
                                    <div key={feature.key} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">{feature.label}</p>
                                            <p className="text-xs text-slate-500">{feature.desc}</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig[feature.key as keyof typeof widgetConfig] === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, [feature.key]: checked })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* INTEGRATIONS SECTION */}
                    {activeSection === 'integrations' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Integrations</h3>
                                <p className="text-slate-400">Connect with third-party services</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Google Analytics ID</label>
                                    <input
                                        type="text"
                                        value={widgetConfig.googleAnalytics || ''}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, googleAnalytics: e.target.value })}
                                        placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
                                    <input
                                        type="text"
                                        value={widgetConfig.webhookUrl || ''}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, webhookUrl: e.target.value })}
                                        placeholder="https://your-server.com/webhook"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Slack Webhook URL</label>
                                    <input
                                        type="text"
                                        value={widgetConfig.slackWebhook || ''}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, slackWebhook: e.target.value })}
                                        placeholder="https://hooks.slack.com/services/..."
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY & PRIVACY SECTION */}
                    {activeSection === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Security & Privacy</h3>
                                <p className="text-slate-400">Protect your widget and comply with data privacy regulations (GDPR/CCPA)</p>
                            </div>

                            {/* GDPR & Consent */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    GDPR & Privacy Compliance
                                </h4>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Show Consent Checkbox</p>
                                            <p className="text-xs text-slate-500">Require users to agree before they can start a chat</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.gdprShowConsent === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, gdprShowConsent: checked })}
                                        />
                                    </div>

                                    {widgetConfig.gdprShowConsent && (
                                        <div className="pl-4 border-l-2 border-slate-700 space-y-3 animate-in fade-in duration-300">
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Consent Message</label>
                                            <input
                                                type="text"
                                                value={widgetConfig.gdprConsentText}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, gdprConsentText: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Show Privacy Disclaimer</p>
                                            <p className="text-xs text-slate-500">Display footer text about privacy policy</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.gdprShowDisclaimer === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, gdprShowDisclaimer: checked })}
                                        />
                                    </div>

                                    {widgetConfig.gdprShowDisclaimer && (
                                        <div className="pl-4 border-l-2 border-slate-700 space-y-3 animate-in fade-in duration-300">
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Disclaimer Text</label>
                                            <textarea
                                                value={widgetConfig.gdprDisclaimerText}
                                                onChange={(e) => setWidgetConfig({ ...widgetConfig, gdprDisclaimerText: e.target.value })}
                                                rows={2}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium text-red-400">Disable All Tracking</p>
                                            <p className="text-xs text-slate-500">Stop tracking clicks, scroll, and mouse movement</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.gdprDisableTracking === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, gdprDisableTracking: checked })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Data Retention */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white">Data Handling</h4>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Retention Period (Days)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={widgetConfig.retentionPeriodDays || 0}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, retentionPeriodDays: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Set to 0 to keep data forever.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium text-sm">Mask PII Data</p>
                                                <p className="text-[10px] text-slate-500">Anonymize personal info in logs</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={widgetConfig.privacyMaskData === true}
                                                onChange={(checked) => setWidgetConfig({ ...widgetConfig, privacyMaskData: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium text-sm">Hide Visitor IP</p>
                                                <p className="text-[10px] text-slate-500">Don't store full IP addresses</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={widgetConfig.privacyHideIp === true}
                                                onChange={(checked) => setWidgetConfig({ ...widgetConfig, privacyHideIp: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bot Protection & Rate Limiting */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-orange-400" />
                                    Bot Protection & Rate Limiting
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Max Sessions Per Hour (per visitor)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={widgetConfig.maxSessionsPerHour || 5}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, maxSessionsPerHour: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Prevents one user from opening too many chats.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Message Throttle (Seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={widgetConfig.messageThrottleSeconds || 2}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, messageThrottleSeconds: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Minimum delay between messages from a visitor.</p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-700 pt-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Enable Global CAPTCHA</p>
                                            <p className="text-xs text-slate-500">Require verification before starting any chat</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.enableCaptcha === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, enableCaptcha: checked })}
                                        />
                                    </div>

                                    {widgetConfig.enableCaptcha && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">CAPTCHA Site Key</label>
                                                <input
                                                    type="text"
                                                    value={widgetConfig.captchaSiteKey || ''}
                                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, captchaSiteKey: e.target.value })}
                                                    placeholder="Public key for your frontend"
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">CAPTCHA Secret Key</label>
                                                <div className="relative">
                                                    <input
                                                        type="password"
                                                        value={widgetConfig.captchaSecretKey || ''}
                                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, captchaSecretKey: e.target.value })}
                                                        placeholder="Keep this secret"
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                                    />
                                                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Spam Protection */}
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <h4 className="font-semibold text-white">Advanced Spam Protection</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Rate Limit (messages/min)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={widgetConfig.rateLimit || 10}
                                            onChange={(e) => setWidgetConfig({ ...widgetConfig, rateLimit: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-7">
                                        <div>
                                            <p className="text-white font-medium text-sm">Block VPN Connections</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={widgetConfig.blockVpn === true}
                                            onChange={(checked) => setWidgetConfig({ ...widgetConfig, blockVpn: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADVANCED SECTION */}
                    {activeSection === 'advanced' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Advanced Settings</h3>
                                <p className="text-slate-400">Additional configuration options</p>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">File Upload</p>
                                        <p className="text-xs text-slate-500">Allow visitors to upload files</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={widgetConfig.fileUpload !== false}
                                        onChange={(checked) => setWidgetConfig({ ...widgetConfig, fileUpload: checked })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Message Character Limit</label>
                                    <input
                                        type="number"
                                        min="100"
                                        max="5000"
                                        value={widgetConfig.messageCharacterLimit || 1000}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, messageCharacterLimit: parseInt(e.target.value) })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Custom CSS</label>
                                    <textarea
                                        value={widgetConfig.customCss || ''}
                                        onChange={(e) => setWidgetConfig({ ...widgetConfig, customCss: e.target.value })}
                                        placeholder="/* Add custom CSS styles */&#10;.chat-widget { ... }"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono h-32 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="fixed bottom-0 left-64 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4 flex items-center justify-between z-10">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePreview}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                            disabled={isSaving}
                        >
                            <Eye className="w-4 h-4" />
                            Preview Widget
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Widget Preview Modal */}
            <TenantWidgetPreview
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                forceGlobal={forceGlobal}
            />
        </div>
    );
};
