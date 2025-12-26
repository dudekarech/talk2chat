import React from 'react';
import { X } from 'lucide-react';
import { GlobalChatWidget } from './GlobalChatWidget';

interface TenantWidgetPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    /** Force use of global config (for landing page). Ignores logged-in user's tenant. */
    forceGlobal?: boolean;
}

/**
 * Tenant Widget Preview Component
 * Displays a preview of the tenant's chat widget within their dashboard
 * This prevents tenants from accessing the global TalkChat landing page
 */
export const TenantWidgetPreview: React.FC<TenantWidgetPreviewProps> = ({ isOpen, onClose, forceGlobal = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Preview Container */}
            <div className="relative z-10 w-full max-w-7xl h-[90vh] mx-4 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Widget Preview</h2>
                        <p className="text-sm text-slate-400">
                            This is how your chat widget will appear to visitors on your website
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Preview Area - Simulated Website */}
                <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
                    {/* Simulated Website Content */}
                    <div className="h-full overflow-y-auto p-12">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Fake Header */}
                            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
                                        <div>
                                            <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                                            <div className="h-3 w-48 bg-slate-700/50 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-20 bg-slate-700/50 rounded"></div>
                                        <div className="h-10 w-20 bg-slate-700/50 rounded"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Fake Content */}
                            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-8 space-y-4">
                                <div className="h-8 w-3/4 bg-slate-700 rounded"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-5/6 bg-slate-700/50 rounded"></div>
                                </div>
                            </div>

                            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-8 space-y-4">
                                <div className="h-6 w-1/2 bg-slate-700 rounded"></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-32 bg-slate-700/50 rounded"></div>
                                    <div className="h-32 bg-slate-700/50 rounded"></div>
                                    <div className="h-32 bg-slate-700/50 rounded"></div>
                                </div>
                            </div>

                            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-8 space-y-4">
                                <div className="h-6 w-2/3 bg-slate-700 rounded"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-4/5 bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-3/4 bg-slate-700/50 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Actual Widget - This will use correct configuration */}
                    <GlobalChatWidget forceGlobalConfig={forceGlobal} />
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                        💡 Click the chat button in the bottom-right corner to test your widget
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};
