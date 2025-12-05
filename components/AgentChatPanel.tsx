import React, { useState, useEffect } from 'react';
import { VisitorInfoPanel } from './VisitorInfoPanel';
import { useWidgetConfig } from '../hooks/useWidgetConfig';
import { MessageSquare, X } from 'lucide-react';

interface AgentChatPanelProps {
    sessionId: string;
    visitorId: string;
    onClose: () => void;
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({ sessionId, visitorId, onClose }) => {
    const { config } = useWidgetConfig();

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-800">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Chat Details</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <VisitorInfoPanel visitorId={visitorId} config={config} />

                {/* Additional session details can go here */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Session Info</h4>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-slate-500">Session ID</p>
                            <p className="text-sm text-white font-mono">{sessionId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Visitor ID</p>
                            <p className="text-sm text-white font-mono">{visitorId}</p>
                        </div>
                    </div>
                </div>

                {/* Tracking Status */}
                <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Active Tracking</h4>
                    <div className="space-y-1">
                        {config?.trackVisitors && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-xs text-slate-300">Visitor Tracking</span>
                            </div>
                        )}
                        {config?.trackPageViews && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-xs text-slate-300">Page Views</span>
                            </div>
                        )}
                        {config?.trackMouseMovement && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-xs text-slate-300">Mouse Movement</span>
                            </div>
                        )}
                        {config?.trackClicks && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-xs text-slate-300">Click Tracking</span>
                            </div>
                        )}
                        {config?.trackScrollDepth && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-xs text-slate-300">Scroll Depth</span>
                            </div>
                        )}
                        {config?.trackTimeOnPage && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span className="text-xs text-slate-300">Time Tracking</span>
                            </div>
                        )}
                        {!config?.trackVisitors && (
                            <p className="text-xs text-slate-500 italic">No tracking enabled</p>
                        )}
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-4 text-xs text-slate-500 italic">
                    💡 Enable tracking features in Widget Configuration to see more visitor insights
                </div>
            </div>
        </div>
    );
};
