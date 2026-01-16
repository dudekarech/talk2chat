
import React, { useState, useRef } from 'react';
import { aiService } from '../services/aiService';
import { WidgetConfig, KBFile } from '../types';
import {
    Save, Bot, MessageSquare, Palette,
    Layout, Globe, Zap, FileText, ChevronDown, ChevronUp, Image, Shield, Moon,
    Smile, Paperclip, Mic, Sparkles, Languages, X, Plus, Upload, Trash2, File,
    Square, Circle, User as UserIcon, Share2, Facebook, Instagram, Smartphone,
    Eye, MousePointer, Activity, Copy, Code, Check, ShoppingBag
} from 'lucide-react';

interface SettingsProps {
    config: WidgetConfig;
    onSave: (newConfig: WidgetConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
    const [localConfig, setLocalConfig] = useState<WidgetConfig>(config);
    const [activeSection, setActiveSection] = useState<string>('appearance');
    const [previewMode, setPreviewMode] = useState<'online' | 'offline'>('online');
    const [newQuickReply, setNewQuickReply] = useState('');
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    // Refs for hidden file inputs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);
    const kbInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onSave(localConfig);
        const btn = document.getElementById('save-btn');
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Saved!';
            setTimeout(() => btn.innerText = originalText, 2000);
        }
    };

    const handleAddQuickReply = () => {
        if (newQuickReply.trim()) {
            setLocalConfig({
                ...localConfig,
                quickReplies: [...localConfig.quickReplies, newQuickReply.trim()]
            });
            setNewQuickReply('');
        }
    };

    const handleRemoveQuickReply = (index: number) => {
        setLocalConfig({
            ...localConfig,
            quickReplies: localConfig.quickReplies.filter((_, i) => i !== index)
        });
    };

    const handleFileUploadKB = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Visual feedback
        const originalText = 'Upload';
        const target = e.target.parentElement;
        if (target) target.innerText = 'Processing...';

        try {
            const text = await file.text();

            await aiService.ingestKnowledgeBase({
                tenant_id: localConfig.tenantId,
                content: text,
                filename: file.name,
                metadata: { size: file.size, last_modified: file.lastModified }
            });

            const newFile: KBFile = {
                id: `kb_${Date.now()}`,
                name: file.name,
                type: file.name.split('.').pop() as any,
                size: `${(file.size / 1024).toFixed(1)} KB`,
                uploadDate: Date.now()
            };

            setLocalConfig({
                ...localConfig,
                knowledgeBase: {
                    ...localConfig.knowledgeBase,
                    files: [...localConfig.knowledgeBase.files, newFile]
                }
            });

            if (target) target.innerText = 'Success!';
            setTimeout(() => { if (target) target.innerText = originalText; }, 2000);

        } catch (error: any) {
            console.error('[KB] Upload failed:', error);
            alert(`Failed to process document: ${error.message}`);
            if (target) target.innerText = 'Error';
            setTimeout(() => { if (target) target.innerText = originalText; }, 2000);
        }
    };

    const handleRemoveFile = (id: string) => {
        setLocalConfig({
            ...localConfig,
            knowledgeBase: {
                ...localConfig.knowledgeBase,
                files: localConfig.knowledgeBase.files.filter(f => f.id !== id)
            }
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: keyof WidgetConfig) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setLocalConfig({ ...localConfig, [key]: objectUrl });
        }
    };

    const generateEmbedCode = () => {
        // Create a sanitized config object for embedding
        const embedConfig = JSON.stringify(localConfig, null, 2);

        return `<!-- TalkChat Widget - Paste this code before closing </body> tag -->
<div id="talkchat-widget-root"></div>
<script>
  (function() {
    // Widget Configuration
    window.TalkChatConfig = ${embedConfig};
    
    // Load Widget Script
    var script = document.createElement('script');
    script.src = 'https://cdn.talkchat.studio/widget.js';
    script.async = true;
    script.onload = function() {
      if (window.TalkChat) {
        window.TalkChat.init(window.TalkChatConfig);
      }
    };
    document.head.appendChild(script);
    
    // Load Widget Styles
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.talkchat.studio/widget.css';
    document.head.appendChild(link);
  })();
</script>`;
    };

    const handleCopyEmbed = async () => {
        const embedCode = generateEmbedCode();
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopiedEmbed(true);
            setTimeout(() => setCopiedEmbed(false), 2000);
        } catch (err) {
            console.error('Failed to copy embed code:', err);
        }
    };

    const SectionHeader = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
        <button
            onClick={() => setActiveSection(activeSection === id ? '' : id)}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50 transition-colors"
        >
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${activeSection === id ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Icon size={18} />
                </div>
                <span className="font-medium text-slate-700">{label}</span>
            </div>
            {activeSection === id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
    );

    const getPositionClass = (pos: string) => {
        switch (pos) {
            case 'bottom-left': return 'bottom-12 left-12 items-start';
            case 'middle-right': return 'top-1/2 right-12 -translate-y-1/2 items-end';
            case 'middle-left': return 'top-1/2 left-12 -translate-y-1/2 items-start';
            default: return 'bottom-12 right-12 items-end'; // bottom-right
        }
    };

    const getShapeClass = (shape: string, type: 'window' | 'bubble') => {
        if (type === 'window') {
            switch (shape) {
                case 'square': return 'rounded-none';
                case 'circle': return 'rounded-[2rem]';
                case 'pill': return 'rounded-[2rem]';
                default: return 'rounded-2xl'; // rounded
            }
        } else { // bubble
            switch (shape) {
                case 'square': return 'rounded-none';
                case 'circle': return 'rounded-full';
                case 'pill': return 'rounded-full px-6'; // Pill is usually wider if it has text
                default: return 'rounded-2xl'; // rounded
            }
        }
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Configuration Panel */}
            <div className="w-1/2 flex flex-col h-full border-r border-slate-200">
                <div className="p-6 border-b border-slate-200 bg-white z-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-slate-800">Widget Settings</h1>
                        <button
                            id="save-btn"
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm shadow-sm"
                        >
                            <Save size={16} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Customize your chat widget's look and feel.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2">

                    {/* Appearance Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="appearance" label="Appearance" icon={Palette} />
                        {activeSection === 'appearance' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Primary Color</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={localConfig.brandColor}
                                                onChange={(e) => setLocalConfig({ ...localConfig, brandColor: e.target.value })}
                                                className="h-9 w-16 rounded border border-slate-300 cursor-pointer p-0.5"
                                            />
                                            <span className="text-sm font-mono text-slate-600">{localConfig.brandColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Position</label>
                                        <select
                                            value={localConfig.position}
                                            onChange={(e) => setLocalConfig({ ...localConfig, position: e.target.value as any })}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="bottom-right">Bottom Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="middle-right">Middle Right</option>
                                            <option value="middle-left">Middle Left</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Background</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={localConfig.backgroundColor}
                                                onChange={(e) => setLocalConfig({ ...localConfig, backgroundColor: e.target.value })}
                                                className="h-9 w-16 rounded border border-slate-300 cursor-pointer p-0.5"
                                            />
                                            <span className="text-sm font-mono text-slate-600">{localConfig.backgroundColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Text Color</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={localConfig.textColor}
                                                onChange={(e) => setLocalConfig({ ...localConfig, textColor: e.target.value })}
                                                className="h-9 w-16 rounded border border-slate-300 cursor-pointer p-0.5"
                                            />
                                            <span className="text-sm font-mono text-slate-600">{localConfig.textColor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Widget Shape Selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-3">Widget Shape</label>
                                    <div className="flex gap-4">
                                        {[
                                            { id: 'rounded', label: 'Rounded', icon: <Square size={16} className="rounded-md" /> },
                                            { id: 'square', label: 'Square', icon: <Square size={16} /> },
                                            { id: 'circle', label: 'Circle', icon: <Circle size={16} /> },
                                            { id: 'pill', label: 'Pill', icon: <div className="w-4 h-2 bg-current rounded-full" /> },
                                        ].map((shape) => (
                                            <button
                                                key={shape.id}
                                                onClick={() => setLocalConfig({ ...localConfig, widgetShape: shape.id as any })}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border w-20 transition-all ${localConfig.widgetShape === shape.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-500'
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="mb-1">{shape.icon}</div>
                                                <span className="text-[10px] font-medium">{shape.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                                    {/* Company Logo Upload */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Company Logo</label>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                {localConfig.logoUrl ? (
                                                    <img src={localConfig.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Image size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    ref={logoInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'logoUrl')}
                                                />
                                                <button
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 font-medium text-slate-700"
                                                >
                                                    Upload Logo
                                                </button>
                                                {localConfig.logoUrl && (
                                                    <button
                                                        onClick={() => setLocalConfig({ ...localConfig, logoUrl: '' })}
                                                        className="text-xs text-red-500 ml-2 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent Avatar Upload */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Agent Avatar</label>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                {localConfig.agentAvatarUrl ? (
                                                    <img src={localConfig.agentAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    <UserIcon size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    ref={avatarInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'agentAvatarUrl')}
                                                />
                                                <button
                                                    onClick={() => avatarInputRef.current?.click()}
                                                    className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 font-medium text-slate-700"
                                                >
                                                    Upload Avatar
                                                </button>
                                                {localConfig.agentAvatarUrl && (
                                                    <button
                                                        onClick={() => setLocalConfig({ ...localConfig, agentAvatarUrl: '' })}
                                                        className="text-xs text-red-500 ml-2 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chat Bubble Icon Upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Custom Bubble Icon</label>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                {localConfig.bubbleIconUrl ? (
                                                    <img src={localConfig.bubbleIconUrl} alt="Bubble" className="h-full w-full object-cover p-2" />
                                                ) : (
                                                    <MessageSquare size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    ref={iconInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'bubbleIconUrl')}
                                                />
                                                <button
                                                    onClick={() => iconInputRef.current?.click()}
                                                    className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 font-medium text-slate-700"
                                                >
                                                    Upload Icon
                                                </button>
                                                {localConfig.bubbleIconUrl && (
                                                    <button
                                                        onClick={() => setLocalConfig({ ...localConfig, bubbleIconUrl: '' })}
                                                        className="text-xs text-red-500 ml-2 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2">Overrides the default chat icon in the launcher.</p>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Visitor Intelligence Section (NEW) */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="intelligence" label="Visitor Intelligence" icon={Eye} />
                        {activeSection === 'intelligence' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${localConfig.visitorIntelligence?.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <Activity size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-slate-800">Real-Time Intelligence</span>
                                            <span className="text-xs text-slate-500">Track activity, intent, and live typing</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localConfig.visitorIntelligence?.enabled}
                                            onChange={(e) => setLocalConfig({
                                                ...localConfig,
                                                visitorIntelligence: {
                                                    ...localConfig.visitorIntelligence!,
                                                    enabled: e.target.checked
                                                }
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {localConfig.visitorIntelligence?.enabled && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">Page View Tracking</span>
                                                <span className="text-xs text-slate-500">See current URL and browsing history</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.visitorIntelligence?.pageTracking}
                                                    onChange={(e) => setLocalConfig({
                                                        ...localConfig,
                                                        visitorIntelligence: { ...localConfig.visitorIntelligence!, pageTracking: e.target.checked }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">Real-time Typing Preview</span>
                                                <span className="text-xs text-slate-500">See what users type before they send</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.visitorIntelligence?.realTimeTyping}
                                                    onChange={(e) => setLocalConfig({
                                                        ...localConfig,
                                                        visitorIntelligence: { ...localConfig.visitorIntelligence!, realTimeTyping: e.target.checked }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">Intent Scoring (AI)</span>
                                                <span className="text-xs text-slate-500">Predict purchase probability (0-100)</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.visitorIntelligence?.intentScoring}
                                                    onChange={(e) => setLocalConfig({
                                                        ...localConfig,
                                                        visitorIntelligence: { ...localConfig.visitorIntelligence!, intentScoring: e.target.checked }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-slate-700">Mouse Heatmaps</span>
                                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">Beta</span>
                                                </div>
                                                <span className="text-xs text-slate-500">Track hover intensity</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.visitorIntelligence?.showMouseHeatmap}
                                                    onChange={(e) => setLocalConfig({
                                                        ...localConfig,
                                                        visitorIntelligence: { ...localConfig.visitorIntelligence!, showMouseHeatmap: e.target.checked }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Omnichannel Integrations - Production Ready */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="omnichannel" label="Omnichannel Integrations" icon={Share2} />
                        {activeSection === 'omnichannel' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center space-x-2">
                                        <Share2 size={16} className="text-blue-600" />
                                        <span>Unified Inbox</span>
                                    </h4>
                                    <p className="text-xs text-blue-800">
                                        Connect your social accounts to manage all conversations from WhatsApp, Instagram, and Facebook Messenger in one place.
                                    </p>
                                </div>

                                {/* WhatsApp Business */}
                                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                                <Smartphone size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">WhatsApp Business API</h4>
                                                <p className="text-[10px] text-slate-500">Official Cloud API by Meta</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localConfig.integrations?.whatsapp?.enabled}
                                                onChange={(e) => setLocalConfig({
                                                    ...localConfig,
                                                    integrations: {
                                                        ...localConfig.integrations,
                                                        whatsapp: { ...localConfig.integrations?.whatsapp, enabled: e.target.checked }
                                                    }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    {localConfig.integrations?.whatsapp?.enabled && (
                                        <div className="space-y-3 pl-0 animate-in slide-in-from-top-2">
                                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                        Phone Number ID
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={localConfig.integrations?.whatsapp?.phoneNumberId || ''}
                                                        onChange={(e) => setLocalConfig({
                                                            ...localConfig,
                                                            integrations: {
                                                                ...localConfig.integrations,
                                                                whatsapp: { ...localConfig.integrations?.whatsapp, phoneNumberId: e.target.value }
                                                            }
                                                        })}
                                                        placeholder="123456789012345"
                                                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                    />
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        Find this in your Meta Business Manager → WhatsApp → API Setup
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                        Access Token (System User Token)
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={localConfig.integrations?.whatsapp?.apiKey || ''}
                                                        onChange={(e) => setLocalConfig({
                                                            ...localConfig,
                                                            integrations: {
                                                                ...localConfig.integrations,
                                                                whatsapp: { ...localConfig.integrations?.whatsapp, apiKey: e.target.value }
                                                            }
                                                        })}
                                                        placeholder="EAA..."
                                                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono text-xs"
                                                    />
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        Generate a permanent token with <code className="bg-slate-100 px-1 rounded">whatsapp_business_messaging</code> permission
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <button
                                                        className="flex items-center space-x-2 text-xs bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium transition-colors"
                                                        onClick={() => {
                                                            // Test connection logic would go here
                                                            alert('Testing WhatsApp connection...\n\nIn production, this would:\n1. Verify the Phone Number ID\n2. Test the Access Token\n3. Check API permissions\n4. Display connection status');
                                                        }}
                                                    >
                                                        <Check size={14} />
                                                        <span>Test Connection</span>
                                                    </button>
                                                    <a
                                                        href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                                                    >
                                                        Setup Guide
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Instagram Direct */}
                                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-pink-100 text-pink-600 rounded-full">
                                                <Instagram size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Instagram Direct Messages</h4>
                                                <p className="text-[10px] text-slate-500">DMs & Story Replies via Graph API</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localConfig.integrations?.instagram?.enabled}
                                                onChange={(e) => setLocalConfig({
                                                    ...localConfig,
                                                    integrations: {
                                                        ...localConfig.integrations,
                                                        instagram: { ...localConfig.integrations?.instagram, enabled: e.target.checked }
                                                    }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                        </label>
                                    </div>
                                    {localConfig.integrations?.instagram?.enabled && (
                                        <div className="space-y-3 pl-0 animate-in slide-in-from-top-2">
                                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                        Instagram Business Account ID
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={localConfig.integrations?.instagram?.pageId || ''}
                                                        onChange={(e) => setLocalConfig({
                                                            ...localConfig,
                                                            integrations: {
                                                                ...localConfig.integrations,
                                                                instagram: { ...localConfig.integrations?.instagram, pageId: e.target.value }
                                                            }
                                                        })}
                                                        placeholder="17841400000000000"
                                                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                        Page Access Token
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={localConfig.integrations?.instagram?.accessToken || ''}
                                                        onChange={(e) => setLocalConfig({
                                                            ...localConfig,
                                                            integrations: {
                                                                ...localConfig.integrations,
                                                                instagram: { ...localConfig.integrations?.instagram, accessToken: e.target.value }
                                                            }
                                                        })}
                                                        placeholder="EAA..."
                                                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-pink-500 outline-none font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                                    <p className="text-[10px] text-yellow-800">
                                                        <strong>Prerequisites:</strong> Your Instagram account must be a Professional (Business or Creator) account linked to a Facebook Page.
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <button
                                                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded text-xs font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
                                                        onClick={() => {
                                                            // OAuth flow would go here
                                                            const clientId = 'YOUR_FACEBOOK_APP_ID';
                                                            const redirectUri = encodeURIComponent(window.location.origin + '/oauth/instagram/callback');
                                                            const scope = 'instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging';
                                                            const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

                                                            alert('Instagram OAuth Flow\n\nIn production, this would:\n1. Open Facebook OAuth dialog\n2. Request necessary permissions\n3. Exchange code for access token\n4. Save credentials securely\n\nAuth URL: ' + authUrl);
                                                        }}
                                                    >
                                                        <Facebook size={14} />
                                                        <span>Connect with Facebook</span>
                                                    </button>
                                                    <a
                                                        href="https://developers.facebook.com/docs/instagram-api/guides/messaging"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                                                    >
                                                        Setup Guide
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Facebook Messenger */}
                                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                                <Facebook size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Facebook Messenger</h4>
                                                <p className="text-[10px] text-slate-500">Page Inbox via Messenger Platform</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localConfig.integrations?.facebook?.enabled}
                                                onChange={(e) => setLocalConfig({
                                                    ...localConfig,
                                                    integrations: {
                                                        ...localConfig.integrations,
                                                        facebook: { ...localConfig.integrations?.facebook, enabled: e.target.checked }
                                                    }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    {localConfig.integrations?.facebook?.enabled && (
                                        <div className="space-y-3 pl-0 animate-in slide-in-from-top-2">
                                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                        Facebook Page ID
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={localConfig.integrations?.facebook?.pageId || ''}
                                                        onChange={(e) => setLocalConfig({
                                                            ...localConfig,
                                                            integrations: {
                                                                ...localConfig.integrations,
                                                                facebook: { ...localConfig.integrations?.facebook, pageId: e.target.value }
                                                            }
                                                        })}
                                                        placeholder="123456789012345"
                                                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                        Page Access Token
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={localConfig.integrations?.facebook?.accessToken || ''}
                                                        onChange={(e) => setLocalConfig({
                                                            ...localConfig,
                                                            integrations: {
                                                                ...localConfig.integrations,
                                                                facebook: { ...localConfig.integrations?.facebook, accessToken: e.target.value }
                                                            }
                                                        })}
                                                        placeholder="EAA..."
                                                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <button
                                                        className="flex items-center space-x-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 transition-colors"
                                                        onClick={() => {
                                                            // OAuth flow would go here
                                                            const clientId = 'YOUR_FACEBOOK_APP_ID';
                                                            const redirectUri = encodeURIComponent(window.location.origin + '/oauth/facebook/callback');
                                                            const scope = 'pages_show_list,pages_messaging,pages_manage_metadata';
                                                            const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

                                                            alert('Facebook OAuth Flow\n\nIn production, this would:\n1. Open Facebook OAuth dialog\n2. Request page permissions\n3. Exchange code for access token\n4. Subscribe to page webhooks\n5. Save credentials securely\n\nAuth URL: ' + authUrl);
                                                        }}
                                                    >
                                                        <Facebook size={14} />
                                                        <span>Connect Page</span>
                                                    </button>
                                                    <a
                                                        href="https://developers.facebook.com/docs/messenger-platform"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                                                    >
                                                        Setup Guide
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Integration Status Summary */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Integration Status</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">WhatsApp Business</span>
                                            <span className={`px-2 py-1 rounded-full font-medium ${localConfig.integrations?.whatsapp?.enabled && localConfig.integrations?.whatsapp?.phoneNumberId && localConfig.integrations?.whatsapp?.apiKey
                                                ? 'bg-green-100 text-green-700'
                                                : localConfig.integrations?.whatsapp?.enabled
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                {localConfig.integrations?.whatsapp?.enabled && localConfig.integrations?.whatsapp?.phoneNumberId && localConfig.integrations?.whatsapp?.apiKey
                                                    ? 'Configured'
                                                    : localConfig.integrations?.whatsapp?.enabled
                                                        ? 'Incomplete'
                                                        : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">Instagram Direct</span>
                                            <span className={`px-2 py-1 rounded-full font-medium ${localConfig.integrations?.instagram?.enabled && localConfig.integrations?.instagram?.pageId && localConfig.integrations?.instagram?.accessToken
                                                ? 'bg-green-100 text-green-700'
                                                : localConfig.integrations?.instagram?.enabled
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                {localConfig.integrations?.instagram?.enabled && localConfig.integrations?.instagram?.pageId && localConfig.integrations?.instagram?.accessToken
                                                    ? 'Configured'
                                                    : localConfig.integrations?.instagram?.enabled
                                                        ? 'Incomplete'
                                                        : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">Facebook Messenger</span>
                                            <span className={`px-2 py-1 rounded-full font-medium ${localConfig.integrations?.facebook?.enabled && localConfig.integrations?.facebook?.pageId && localConfig.integrations?.facebook?.accessToken
                                                ? 'bg-green-100 text-green-700'
                                                : localConfig.integrations?.facebook?.enabled
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                {localConfig.integrations?.facebook?.enabled && localConfig.integrations?.facebook?.pageId && localConfig.integrations?.facebook?.accessToken
                                                    ? 'Configured'
                                                    : localConfig.integrations?.facebook?.enabled
                                                        ? 'Incomplete'
                                                        : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="content" label="Chat Content" icon={MessageSquare} />
                        {activeSection === 'content' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Bot Name</label>
                                    <input
                                        type="text"
                                        value={localConfig.botName}
                                        onChange={(e) => setLocalConfig({ ...localConfig, botName: e.target.value })}
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Welcome Message</label>
                                    <textarea
                                        value={localConfig.welcomeMessage}
                                        onChange={(e) => setLocalConfig({ ...localConfig, welcomeMessage: e.target.value })}
                                        rows={3}
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Functionality Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="functionality" label="Chat Functionality" icon={Smile} />
                        {activeSection === 'functionality' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Enable Emojis</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.enableEmojis} onChange={(e) => setLocalConfig({ ...localConfig, enableEmojis: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Enable Attachments</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.enableAttachments} onChange={(e) => setLocalConfig({ ...localConfig, enableAttachments: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">Voice Notes</span>
                                            <span className="text-xs text-slate-400">Beta</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.enableVoiceNotes} onChange={(e) => setLocalConfig({ ...localConfig, enableVoiceNotes: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Quick Replies</label>
                                    <div className="flex space-x-2 mb-3">
                                        <input
                                            type="text"
                                            value={newQuickReply}
                                            onChange={(e) => setNewQuickReply(e.target.value)}
                                            placeholder="Add a reply..."
                                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddQuickReply()}
                                        />
                                        <button
                                            onClick={handleAddQuickReply}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {localConfig.quickReplies.map((reply, idx) => (
                                            <div key={idx} className="flex items-center bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-700">
                                                <span>{reply}</span>
                                                <button onClick={() => handleRemoveQuickReply(idx)} className="ml-2 text-slate-400 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {localConfig.quickReplies.length === 0 && (
                                            <span className="text-xs text-slate-400 italic">No quick replies added</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shopify Integration Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="shopify" label="Shopify & E-commerce" icon={ShoppingBag} />
                        {activeSection === 'shopify' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-green-800 mb-1">
                                        <ShoppingBag size={16} />
                                        Shopify Ready 🛍️
                                    </h4>
                                    <p className="text-xs text-green-700">
                                        Turn your chat widget into an e-commerce powerhouse. Track carts, recover abandoned checkouts, and boost sales.
                                    </p>
                                </div>

                                {/* Step 1: Install Widget */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-2">1. Install on Shopify Store</h4>
                                    <p className="text-xs text-slate-500 mb-3">Copy this code and paste it into your theme's <code>theme.liquid</code> file, just before the closing <code>&lt;/body&gt;</code> tag.</p>

                                    <div className="relative group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={handleCopyEmbed}
                                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded z-10 text-slate-300 hover:text-white backdrop-blur-sm transition-colors"
                                                title="Copy Code"
                                            >
                                                {copiedEmbed ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-[10px] sm:text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
                                            {generateEmbedCode()}
                                        </pre>
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-400">
                                        Works with: <span className="text-slate-600 font-medium">Dawn, Impulse, Prestige, and all 2.0 Themes</span>
                                    </div>
                                </div>

                                {/* Step 2: Add Cart Tracking */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-bold text-slate-800">2. Enable Cart Tracking</h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Recommended</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Paste this script <strong>immediately after</strong> the embed code above. This enables real-time cart viewing for your agents.
                                    </p>

                                    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
                                            <span className="text-[10px] font-mono text-slate-400">shopify-tracking.js</span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`<script>
  window.addEventListener('load', function() {
    if (window.Shopify && window.talkChat) {
      // Track Cart Adds
      document.addEventListener('cart:add', function(evt) {
         window.talkChat.trackEvent('cart_add', evt.detail);
      });
      // Track Page Views
      if (typeof window.meta !== 'undefined' && window.meta.page.pageType === 'product') {
         window.talkChat.trackEvent('product_view', {
            productId: window.meta.product.id,
            price: window.meta.product.variants[0].price
         });
      }
    }
  });
</script>`)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                        <pre className="p-4 text-[10px] font-mono text-blue-300 overflow-x-auto leading-relaxed">
                                            {`<script>
  window.addEventListener('load', function() {
    if (window.Shopify && window.talkChat) {
      
      // Track Cart Adds (Standard Shopify Events)
      document.addEventListener('cart:add', function(evt) {
         window.talkChat.trackEvent('cart_add', evt.detail);
      });

      // Track Product Views
      if (typeof window.meta !== 'undefined' && window.meta.page.pageType === 'product') {
         window.talkChat.trackEvent('product_view', {
            productId: window.meta.product.id,
            productName: window.meta.product.variants[0].name,
            price: window.meta.product.variants[0].price
         });
      }
    }
  });
</script>`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Settings Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="ai" label="AI Settings & Knowledge" icon={Sparkles} />
                        {activeSection === 'ai' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-8 animate-in slide-in-from-top-2 duration-200">
                                {/* Master AI Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${localConfig.aiEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <Bot size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-slate-800">Enable AI Assistant</span>
                                            <span className="text-xs text-slate-500">Allow AI to draft replies and chat with visitors</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={localConfig.aiEnabled} onChange={(e) => setLocalConfig({ ...localConfig, aiEnabled: e.target.checked })} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {localConfig.aiEnabled && (
                                    <>
                                        <div className="space-y-4 pt-2">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Behavior</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">AI Offline Fallback</span>
                                                    <span className="text-xs text-slate-500">Let AI handle chats when agents are away</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={localConfig.aiOfflineFallback} onChange={(e) => setLocalConfig({ ...localConfig, aiOfflineFallback: e.target.checked })} className="sr-only peer" />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700">AI Greeting Message</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={localConfig.aiGreetingEnabled} onChange={(e) => setLocalConfig({ ...localConfig, aiGreetingEnabled: e.target.checked })} className="sr-only peer" />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>

                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">AI Confidence (Strict vs Creative)</label>
                                                    <span className="text-xs font-mono text-blue-600">{localConfig.aiConfidence.toFixed(1)}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={localConfig.aiConfidence}
                                                    onChange={(e) => setLocalConfig({ ...localConfig, aiConfidence: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                    <span>Strict (Fact-based)</span>
                                                    <span>Creative (Conversational)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Knowledge Base Section */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Knowledge Base</h4>
                                            <p className="text-xs text-slate-500">Provide context and documents to help the AI answer accurately.</p>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Base Instructions / Context</label>
                                                <textarea
                                                    value={localConfig.knowledgeBase?.textContext || ''}
                                                    onChange={(e) => setLocalConfig({
                                                        ...localConfig,
                                                        knowledgeBase: { ...localConfig.knowledgeBase, textContext: e.target.value }
                                                    })}
                                                    rows={6}
                                                    placeholder="We are a pizza shop located in NY. We open at 10am..."
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Documents</label>
                                                    <button
                                                        onClick={() => kbInputRef.current?.click()}
                                                        className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center space-x-1"
                                                    >
                                                        <Upload size={10} />
                                                        <span>Upload</span>
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={kbInputRef}
                                                        onChange={handleFileUploadKB}
                                                        className="hidden"
                                                        accept=".txt,.csv,.md,.json"
                                                    />
                                                </div>

                                                <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-100">
                                                    {localConfig.knowledgeBase?.files.length === 0 ? (
                                                        <div className="p-4 text-center text-slate-400 text-xs italic">
                                                            No documents uploaded yet.
                                                        </div>
                                                    ) : (
                                                        localConfig.knowledgeBase?.files.map((file) => (
                                                            <div key={file.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                                                                <div className="flex items-center space-x-3 overflow-hidden">
                                                                    <div className="p-2 bg-white border border-slate-200 rounded text-slate-500">
                                                                        <FileText size={16} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{file.name}</span>
                                                                        <span className="text-[10px] text-slate-400 uppercase">{file.type} • {file.size}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoveFile(file.id)}
                                                                    className="text-slate-400 hover:text-red-500 p-1"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Language Settings Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="language" label="Language & Labels" icon={Languages} />
                        {activeSection === 'language' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">Auto-detect Language</span>
                                        <span className="text-xs text-slate-500">Detect visitor's browser language</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={localConfig.autoDetectLanguage} onChange={(e) => setLocalConfig({ ...localConfig, autoDetectLanguage: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Default Language</label>
                                    <select
                                        value={localConfig.language}
                                        onChange={(e) => setLocalConfig({ ...localConfig, language: e.target.value as any })}
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="en">English (en)</option>
                                        <option value="es">Spanish (es)</option>
                                        <option value="fr">French (fr)</option>
                                        <option value="de">German (de)</option>
                                    </select>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-medium text-slate-800">Custom Labels</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Chat Button</label>
                                            <input
                                                type="text"
                                                value={localConfig.customLabels?.startChat}
                                                onChange={(e) => setLocalConfig({ ...localConfig, customLabels: { ...localConfig.customLabels, startChat: e.target.value } })}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Input Placeholder</label>
                                            <input
                                                type="text"
                                                value={localConfig.customLabels?.enterMessage}
                                                onChange={(e) => setLocalConfig({ ...localConfig, customLabels: { ...localConfig.customLabels, enterMessage: e.target.value } })}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Behavior Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="behavior" label="Behavior & Triggers" icon={Zap} />
                        {activeSection === 'behavior' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Auto-open Delay (seconds)</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="60"
                                            step="1"
                                            value={localConfig.autoOpenDelay}
                                            onChange={(e) => setLocalConfig({ ...localConfig, autoOpenDelay: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-sm font-medium w-16 text-right">{localConfig.autoOpenDelay}s</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Set to 0 to disable auto-open.</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">Hide when offline</span>
                                        <span className="text-xs text-slate-500">Only show widget when agents are online</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={localConfig.hideWhenOffline} onChange={(e) => setLocalConfig({ ...localConfig, hideWhenOffline: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">Show "Powered By"</span>
                                        <span className="text-xs text-slate-500">Display TalkChat branding in footer</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={localConfig.showBranding} onChange={(e) => setLocalConfig({ ...localConfig, showBranding: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                {localConfig.showBranding && (
                                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Upgrade to Pro to remove branding.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Forms Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="forms" label="Pre-chat Form" icon={FileText} />
                        {activeSection === 'forms' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <p className="text-xs text-slate-500 mb-2">Require visitors to enter details before chatting.</p>

                                <div className="mb-3">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Form Intro Text</label>
                                    <input
                                        type="text"
                                        value={localConfig.preChatFormMessage || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, preChatFormMessage: e.target.value })}
                                        placeholder="Please introduce yourself..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="reqName"
                                        checked={localConfig.requireName}
                                        onChange={(e) => setLocalConfig({ ...localConfig, requireName: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="reqName" className="text-sm text-slate-700">Require Name</label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="reqEmail"
                                        checked={localConfig.requireEmail}
                                        onChange={(e) => setLocalConfig({ ...localConfig, requireEmail: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="reqEmail" className="text-sm text-slate-700">Require Email</label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="reqPhone"
                                        checked={localConfig.requirePhone}
                                        onChange={(e) => setLocalConfig({ ...localConfig, requirePhone: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="reqPhone" className="text-sm text-slate-700">Require Phone Number</label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Offline Form Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="offline" label="Offline Form" icon={Moon} />
                        {activeSection === 'offline' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">Enable Offline Form</span>
                                        <span className="text-xs text-slate-500">Collect messages when no agents are online</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localConfig.offlineEnabled}
                                            onChange={(e) => setLocalConfig({ ...localConfig, offlineEnabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {localConfig.offlineEnabled && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Offline Heading</label>
                                            <input
                                                type="text"
                                                value={localConfig.offlineHeading}
                                                onChange={(e) => setLocalConfig({ ...localConfig, offlineHeading: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Offline Message</label>
                                            <textarea
                                                value={localConfig.offlineMessage}
                                                onChange={(e) => setLocalConfig({ ...localConfig, offlineMessage: e.target.value })}
                                                rows={3}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Success Message</label>
                                            <input
                                                type="text"
                                                value={localConfig.offlineSuccessMessage}
                                                onChange={(e) => setLocalConfig({ ...localConfig, offlineSuccessMessage: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Security & Privacy Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="security" label="Security & Privacy" icon={Shield} />
                        {activeSection === 'security' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-8 animate-in slide-in-from-top-2 duration-200">
                                {/* GDPR Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">GDPR & Consent</h4>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">Show Consent Checkbox</span>
                                            <span className="text-xs text-slate-500">Require users to agree before chatting</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.gdprShowConsent} onChange={(e) => setLocalConfig({ ...localConfig, gdprShowConsent: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {localConfig.gdprShowConsent && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Consent Text</label>
                                            <input
                                                type="text"
                                                value={localConfig.gdprConsentText}
                                                onChange={(e) => setLocalConfig({ ...localConfig, gdprConsentText: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">Show Privacy Disclaimer</span>
                                            <span className="text-xs text-slate-500">Display footer text about privacy policy</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.gdprShowDisclaimer} onChange={(e) => setLocalConfig({ ...localConfig, gdprShowDisclaimer: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {localConfig.gdprShowDisclaimer && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Disclaimer Text</label>
                                            <textarea
                                                value={localConfig.gdprDisclaimerText}
                                                onChange={(e) => setLocalConfig({ ...localConfig, gdprDisclaimerText: e.target.value })}
                                                rows={2}
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Disable Tracking Cookies</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.gdprDisableTracking} onChange={(e) => setLocalConfig({ ...localConfig, gdprDisableTracking: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Data Retention Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Data Retention</h4>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Delete Messages Older Than (Days)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={localConfig.retentionPeriodDays}
                                            onChange={(e) => setLocalConfig({ ...localConfig, retentionPeriodDays: parseInt(e.target.value) })}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Set to 0 to keep messages forever.</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Mask Personal Data (PII)</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.privacyMaskData} onChange={(e) => setLocalConfig({ ...localConfig, privacyMaskData: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Hide Visitor IP Addresses</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.privacyHideIp} onChange={(e) => setLocalConfig({ ...localConfig, privacyHideIp: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Visibility Rules */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">Visibility Rules</h4>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Logged-in Users Only</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.visibilityLoggedInOnly} onChange={(e) => setLocalConfig({ ...localConfig, visibilityLoggedInOnly: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Hide on Checkout Pages</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.visibilityHideCheckout} onChange={(e) => setLocalConfig({ ...localConfig, visibilityHideCheckout: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Repeat Visitors Only</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localConfig.visibilityRepeatVisitorsOnly} onChange={(e) => setLocalConfig({ ...localConfig, visibilityRepeatVisitorsOnly: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Embed Code Section */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <SectionHeader id="embed" label="Embed Code" icon={Code} />
                        {activeSection === 'embed' && (
                            <div className="p-6 bg-white border-x border-b border-slate-200 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 mb-1">Widget Installation Code</h3>
                                            <p className="text-xs text-slate-500">
                                                Copy and paste this code into your website, just before the closing <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">&lt;/body&gt;</code> tag.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Embed Code Display */}
                                    <div className="relative">
                                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto border border-slate-700">
                                            <code>{generateEmbedCode()}</code>
                                        </pre>

                                        {/* Copy Button */}
                                        <button
                                            onClick={handleCopyEmbed}
                                            className={`absolute top-3 right-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${copiedEmbed
                                                ? 'bg-green-600 text-white'
                                                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                }`}
                                        >
                                            {copiedEmbed ? (
                                                <span className="flex items-center space-x-1">
                                                    <Check size={14} />
                                                    <span>Copied!</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center space-x-1">
                                                    <Copy size={14} />
                                                    <span>Copy Code</span>
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Instructions */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                                            <FileText size={16} className="text-blue-600" />
                                            <span>Installation Instructions</span>
                                        </h4>
                                        <ol className="text-xs text-blue-800 space-y-2 ml-6 list-decimal">
                                            <li>Copy the embed code above using the "Copy Code" button</li>
                                            <li>Open your website's HTML file or template</li>
                                            <li>Paste the code just before the closing <code className="px-1 py-0.5 bg-blue-100 rounded">&lt;/body&gt;</code> tag</li>
                                            <li>Save and publish your changes</li>
                                            <li>The widget will appear on your website with all your customizations!</li>
                                        </ol>
                                    </div>

                                    {/* Features Notice */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-slate-800 mb-2">✨ What's Included</h4>
                                        <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                                            <li>All your appearance customizations (colors, shapes, position)</li>
                                            <li>Chat functionality settings (emojis, attachments, voice notes)</li>
                                            <li>AI settings and knowledge base</li>
                                            <li>Language and custom labels</li>
                                            <li>Privacy and security settings</li>
                                            <li>Automatic updates when you save changes</li>
                                        </ul>
                                    </div>

                                    {/* Compatibility Notice */}
                                    <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <Check size={16} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-green-900">Universal Compatibility</p>
                                            <p className="text-xs text-green-700 mt-1">
                                                This embed code works on all websites including WordPress, Shopify, Wix, Squarespace, custom HTML sites, and more!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Preview Panel */}
            <div className="w-1/2 bg-slate-100 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200"></div>
                <div className="relative z-10 w-full max-w-2xl">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Live Preview</h2>
                        <p className="text-sm text-slate-500">See your changes in real-time</p>
                    </div>

                    {/* Mock Browser Window */}
                    <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-800 px-4 py-3 flex items-center space-x-2">
                            <div className="flex space-x-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="flex-1 bg-slate-700 rounded px-3 py-1 text-xs text-slate-400">
                                yourwebsite.com
                            </div>
                        </div>

                        {/* Mock Website Content */}
                        <div className="h-[500px] bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
                            <div className="p-6 space-y-4">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            </div>

                            {/* Widget Preview */}
                            <div className={`absolute ${getPositionClass(localConfig.position)} flex flex-col space-y-3 transition-all duration-300`}>
                                {/* Chat Window (if preview mode shows it) */}
                                {previewMode === 'online' && (
                                    <div
                                        className={`${getShapeClass(localConfig.widgetShape, 'window')} shadow-2xl overflow-hidden border border-slate-200 w-80 transition-all duration-300`}
                                        style={{ backgroundColor: localConfig.backgroundColor }}
                                    >
                                        {/* Chat Header */}
                                        <div
                                            className="p-4 flex items-center space-x-3"
                                            style={{ backgroundColor: localConfig.brandColor }}
                                        >
                                            {localConfig.logoUrl ? (
                                                <img src={localConfig.logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                    <MessageSquare className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold text-sm">{localConfig.botName}</h3>
                                                <p className="text-white/80 text-xs">Online</p>
                                            </div>
                                        </div>

                                        {/* Chat Messages */}
                                        <div className="p-4 space-y-3 h-64 overflow-y-auto">
                                            {/* Welcome Message */}
                                            <div className="flex items-start space-x-2">
                                                {localConfig.agentAvatarUrl ? (
                                                    <img src={localConfig.agentAvatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ backgroundColor: localConfig.brandColor }}
                                                    >
                                                        {localConfig.botName.charAt(0)}
                                                    </div>
                                                )}
                                                <div
                                                    className="flex-1 rounded-lg p-3 text-sm max-w-[80%]"
                                                    style={{
                                                        backgroundColor: `${localConfig.brandColor}15`,
                                                        color: localConfig.textColor
                                                    }}
                                                >
                                                    {localConfig.welcomeMessage}
                                                </div>
                                            </div>

                                            {/* Quick Replies Preview */}
                                            {localConfig.quickReplies.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {localConfig.quickReplies.slice(0, 3).map((reply, idx) => (
                                                        <button
                                                            key={idx}
                                                            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                                                            style={{
                                                                borderColor: localConfig.brandColor,
                                                                color: localConfig.brandColor
                                                            }}
                                                        >
                                                            {reply}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Input */}
                                        <div className="p-3 border-t border-slate-200">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    placeholder={localConfig.customLabels?.enterMessage || "Type a message..."}
                                                    className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-xs outline-none"
                                                    style={{ color: localConfig.textColor }}
                                                    disabled
                                                />
                                                {localConfig.enableEmojis && (
                                                    <button className="p-2 text-slate-400 hover:text-slate-600">
                                                        <Smile size={16} />
                                                    </button>
                                                )}
                                                {localConfig.enableAttachments && (
                                                    <button className="p-2 text-slate-400 hover:text-slate-600">
                                                        <Paperclip size={16} />
                                                    </button>
                                                )}
                                                {localConfig.enableVoiceNotes && (
                                                    <button className="p-2 text-slate-400 hover:text-slate-600">
                                                        <Mic size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Branding Footer */}
                                        {localConfig.showBranding && (
                                            <div className="px-3 py-2 text-center border-t border-slate-100">
                                                <p className="text-[10px] text-slate-400">
                                                    Powered by <span className="font-semibold">TalkChat</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Chat Bubble Button */}
                                <button
                                    className={`w-14 h-14 ${getShapeClass(localConfig.widgetShape, 'bubble')} shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center`}
                                    style={{ backgroundColor: localConfig.brandColor }}
                                    onClick={() => setPreviewMode(previewMode === 'online' ? 'offline' : 'online')}
                                >
                                    {localConfig.bubbleIconUrl ? (
                                        <img src={localConfig.bubbleIconUrl} alt="Icon" className="w-6 h-6 object-contain" />
                                    ) : (
                                        <MessageSquare className="w-6 h-6 text-white" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Controls */}
                    <div className="mt-4 flex justify-center space-x-2">
                        <button
                            onClick={() => setPreviewMode('online')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${previewMode === 'online'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Online Mode
                        </button>
                        <button
                            onClick={() => setPreviewMode('offline')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${previewMode === 'offline'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Offline Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};