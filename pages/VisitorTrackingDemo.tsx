import React from 'react';
import { VisitorInfoPanel } from '../components/VisitorInfoPanel';
import { AgentChatPanel } from '../components/AgentChatPanel';
import { useWidgetConfig } from '../hooks/useWidgetConfig';
import { Settings } from 'lucide-react';

export const VisitorTrackingDemo: React.FC = () => {
    const { config } = useWidgetConfig();
    const [showAgentPanel, setShowAgentPanel] = React.useState(false);

    // Generate a demo visitor ID
    const demoVisitorId = 'demo_visitor_' + Date.now();

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        🎯 Visitor Tracking Demo
                    </h1>
                    <p className="text-slate-400">
                        This page demonstrates the visitor tracking features.
                        Enable tracking in Widget Configuration to see it in action!
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">📋 How to Test</h2>
                    <ol className="space-y-2 text-slate-300">
                        <li>1. Go to <strong className="text-blue-400">Widget Configuration → Visitor Tracking</strong></li>
                        <li>2. Enable tracking options (Track Visitors, Page Views, Scroll Depth, etc.)</li>
                        <li>3. Click <strong className="text-green-400">"Save Configuration"</strong></li>
                        <li>4. Return to this page and watch the metrics update in real-time!</li>
                        <li>5. Try scrolling, clicking, and navigating to see metrics change</li>
                    </ol>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Left Column - Visitor View */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">
                            👁️ Visitor Information Panel
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            This is what shows up in the chat interface based on your tracking settings:
                        </p>

                        <VisitorInfoPanel
                            visitorId={demoVisitorId}
                            config={config}
                        />

                        {/* Test Actions */}
                        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-6">
                            <h3 className="font-semibold text-white mb-3">🧪 Test Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                                >
                                    Test Scroll Tracking
                                </button>
                                <button
                                    onClick={() => alert('Click tracked!')}
                                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                                >
                                    Test Click Tracking
                                </button>
                                <button
                                    onClick={() => window.history.pushState({}, '', '/test-page')}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    Test Page View Tracking
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Agent View */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">
                            👤 Agent View
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            This is how agents see visitor information in the admin panel:
                        </p>

                        <button
                            onClick={() => setShowAgentPanel(!showAgentPanel)}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all mb-4"
                        >
                            {showAgentPanel ? 'Hide' : 'Show'} Agent Chat Panel
                        </button>

                        {/* Config Status */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Current Tracking Configuration
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { key: 'trackVisitors', label: 'Visitor Tracking' },
                                    { key: 'trackPageViews', label: 'Page Views' },
                                    { key: 'trackMouseMovement', label: 'Mouse Movement' },
                                    { key: 'trackClicks', label: 'Click Tracking' },
                                    { key: 'trackScrollDepth', label: 'Scroll Depth' },
                                    { key: 'trackTimeOnPage', label: 'Time on Page' },
                                    { key: 'captureScreenshots', label: 'Screenshots' },
                                    { key: 'sessionRecording', label: 'Session Recording' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between py-1">
                                        <span className="text-sm text-slate-400">{label}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${config?.[key]
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-slate-700 text-slate-500'
                                            }`}>
                                            {config?.[key] ? '✓ Enabled' : '✗ Disabled'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {!config?.trackVisitors && (
                                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                                    <p className="text-xs text-yellow-200">
                                        ⚠️ Tracking is currently disabled. Enable it in Widget Configuration to see metrics.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Metrics Explanation */}
                        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-6">
                            <h3 className="font-semibold text-white mb-3">📊 Metrics Explained</h3>
                            <div className="space-y-2 text-sm text-slate-400">
                                <p><strong className="text-white">Page Views:</strong> Number of pages visited</p>
                                <p><strong className="text-white">Time on Site:</strong> Updates every second</p>
                                <p><strong className="text-white">Scroll Depth:</strong> Percentage of page scrolled</p>
                                <p><strong className="text-white">Clicks:</strong> Total clicks tracked</p>
                                <p><strong className="text-white">Mouse Activity:</strong> Shows if user is active</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Long content to test scrolling */}
                <div className="mt-12 bg-slate-800 border border-slate-700 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        📜 Scroll Down to Test Scroll Depth Tracking
                    </h2>
                    <div className="space-y-4 text-slate-400">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <p key={i}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Line {i + 1}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Agent Panel Overlay */}
            {showAgentPanel && (
                <AgentChatPanel
                    sessionId="demo_session_123"
                    visitorId={demoVisitorId}
                    onClose={() => setShowAgentPanel(false)}
                />
            )}
        </div>
    );
};
