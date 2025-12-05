import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Monitor,
    Globe,
    Clock,
    MousePointer,
    Eye,
    TrendingUp,
    Chrome,
    Smartphone,
    Activity,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface VisitorData {
    id: string;
    location?: {
        country: string;
        city: string;
        region: string;
    };
    device?: {
        type: string;
        os: string;
        browser: string;
    };
    currentPage?: string;
    referrer?: string;
    pageViews?: number;
    timeOnSite?: number;
    scrollDepth?: number;
    clicks?: number;
    mouseMovement?: {
        active: boolean;
        heatmapData?: any;
    };
    sessionStart?: string;
}

interface VisitorInfoPanelProps {
    visitorId: string;
    config: any;
}

export const VisitorInfoPanel: React.FC<VisitorInfoPanelProps> = ({ visitorId, config }) => {
    const [visitorData, setVisitorData] = useState<VisitorData>({
        id: visitorId
    });
    const [isExpanded, setIsExpanded] = useState(true);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        // Check if tracking is enabled
        const trackingEnabled = config?.trackVisitors === true;
        setIsTracking(trackingEnabled);

        if (trackingEnabled) {
            startTracking();
        }
    }, [config, visitorId]);

    const startTracking = () => {
        // Collect visitor information
        const data: VisitorData = {
            id: visitorId,
            sessionStart: new Date().toISOString()
        };

        // Track location (simulated - in production use IP geolocation API)
        if (config?.trackVisitors) {
            data.location = {
                country: 'Kenya',
                city: 'Nairobi',
                region: 'Nairobi County'
            };
        }

        // Track device information
        const userAgent = navigator.userAgent;
        const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
        const isTablet = /iPad|Tablet/i.test(userAgent);

        data.device = {
            type: isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop',
            os: getOS(),
            browser: getBrowser()
        };

        // Track current page
        if (config?.trackPageViews) {
            data.currentPage = window.location.pathname;
            data.pageViews = 1;
        }

        // Track referrer
        if (document.referrer) {
            data.referrer = document.referrer;
        }

        // Track time on site
        if (config?.trackTimeOnPage) {
            data.timeOnSite = 0;
            startTimeTracking();
        }

        // Track scroll depth
        if (config?.trackScrollDepth) {
            data.scrollDepth = 0;
            startScrollTracking();
        }

        // Track clicks
        if (config?.trackClicks) {
            data.clicks = 0;
            startClickTracking();
        }

        // Track mouse movement
        if (config?.trackMouseMovement) {
            data.mouseMovement = { active: true };
            startMouseTracking();
        }

        setVisitorData(data);
    };

    const getOS = () => {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf('Win') !== -1) return 'Windows';
        if (userAgent.indexOf('Mac') !== -1) return 'MacOS';
        if (userAgent.indexOf('Linux') !== -1) return 'Linux';
        if (userAgent.indexOf('Android') !== -1) return 'Android';
        if (userAgent.indexOf('iOS') !== -1) return 'iOS';
        return 'Unknown';
    };

    const getBrowser = () => {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
        if (userAgent.indexOf('Safari') !== -1) return 'Safari';
        if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
        if (userAgent.indexOf('Edge') !== -1) return 'Edge';
        return 'Unknown';
    };

    const startTimeTracking = () => {
        const interval = setInterval(() => {
            setVisitorData(prev => ({
                ...prev,
                timeOnSite: (prev.timeOnSite || 0) + 1
            }));
        }, 1000);

        return () => clearInterval(interval);
    };

    const startScrollTracking = () => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

            setVisitorData(prev => ({
                ...prev,
                scrollDepth: Math.max(prev.scrollDepth || 0, scrollPercentage)
            }));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    };

    const startClickTracking = () => {
        const handleClick = () => {
            setVisitorData(prev => ({
                ...prev,
                clicks: (prev.clicks || 0) + 1
            }));
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    };

    const startMouseTracking = () => {
        let lastMovement = Date.now();

        const handleMouseMove = () => {
            lastMovement = Date.now();
            setVisitorData(prev => ({
                ...prev,
                mouseMovement: { active: true }
            }));
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (!isTracking) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                <p className="text-slate-400 text-sm text-center">
                    Visitor tracking is disabled
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden mb-4">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-white">Visitor Information</h3>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-3">
                    {/* Location */}
                    {visitorData.location && (
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Location</p>
                                <p className="text-sm text-white">
                                    {visitorData.location.city}, {visitorData.location.country}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Device */}
                    {visitorData.device && (
                        <div className="flex items-start gap-3">
                            {visitorData.device.type === 'Mobile' ? (
                                <Smartphone className="w-4 h-4 text-purple-400 mt-0.5" />
                            ) : (
                                <Monitor className="w-4 h-4 text-purple-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Device</p>
                                <p className="text-sm text-white">
                                    {visitorData.device.type} • {visitorData.device.os} • {visitorData.device.browser}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Current Page */}
                    {config?.trackPageViews && visitorData.currentPage && (
                        <div className="flex items-start gap-3">
                            <Globe className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Current Page</p>
                                <p className="text-sm text-white font-mono truncate">
                                    {visitorData.currentPage}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {visitorData.pageViews} page view{visitorData.pageViews !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Referrer */}
                    {visitorData.referrer && (
                        <div className="flex items-start gap-3">
                            <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Referrer</p>
                                <p className="text-sm text-white truncate">
                                    {new URL(visitorData.referrer).hostname}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Time on Site */}
                    {config?.trackTimeOnPage && visitorData.timeOnSite !== undefined && (
                        <div className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-orange-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Time on Site</p>
                                <p className="text-sm text-white">
                                    {formatTime(visitorData.timeOnSite)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Scroll Depth */}
                    {config?.trackScrollDepth && visitorData.scrollDepth !== undefined && (
                        <div className="flex items-start gap-3">
                            <Eye className="w-4 h-4 text-cyan-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Scroll Depth</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-400 transition-all duration-300"
                                            style={{ width: `${visitorData.scrollDepth}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-white">{visitorData.scrollDepth}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Clicks */}
                    {config?.trackClicks && visitorData.clicks !== undefined && (
                        <div className="flex items-start gap-3">
                            <MousePointer className="w-4 h-4 text-pink-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Total Clicks</p>
                                <p className="text-sm text-white">
                                    {visitorData.clicks} click{visitorData.clicks !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Mouse Activity */}
                    {config?.trackMouseMovement && visitorData.mouseMovement?.active && (
                        <div className="flex items-start gap-3">
                            <MousePointer className="w-4 h-4 text-green-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Mouse Activity</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <p className="text-sm text-white">Active</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session Info */}
                    <div className="pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-500">
                            Session ID: <span className="text-slate-400 font-mono">{visitorId.slice(0, 8)}...</span>
                        </p>
                        {visitorData.sessionStart && (
                            <p className="text-xs text-slate-500 mt-1">
                                Started: {new Date(visitorData.sessionStart).toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
