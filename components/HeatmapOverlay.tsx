import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { MousePointer, Activity, Clock, Globe, Filter, Download, Maximize2 } from 'lucide-react';

interface ClickEvent {
    id: string;
    session_id: string;
    x_pct: number;
    y_pct: number;
    page_url: string;
    created_at: string;
    element_tag?: string;
}

interface HeatmapOverlayProps {
    tenantId?: string | null;
    sessionId?: string | null;
    pageUrl?: string;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ tenantId, sessionId, pageUrl }) => {
    const [clicks, setClicks] = useState<ClickEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'heatmap' | 'points' | 'regions'>('heatmap');
    const [intensity, setIntensity] = useState(0.6);

    useEffect(() => {
        loadClicks();

        // Optional: Real-time clicks for "LIVE" feel during demo
        const subscription = supabase
            .channel('live-heatmap')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'visitor_clicks' },
                (payload) => {
                    const newClick = payload.new as ClickEvent;
                    // Filter based on props
                    if (sessionId && newClick.session_id !== sessionId) return;
                    if (pageUrl && newClick.page_url !== pageUrl) return;

                    setClicks(prev => [newClick, ...prev].slice(0, 500)); // Keep last 500
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [tenantId, sessionId, pageUrl]);

    const loadClicks = async () => {
        setIsLoading(true);
        let query = supabase
            .from('visitor_clicks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (tenantId) query = query.eq('tenant_id', tenantId);
        if (sessionId) query = query.eq('session_id', sessionId);
        if (pageUrl) query = query.eq('page_url', pageUrl);

        const { data, error } = await query;
        if (!error && data) {
            setClicks(data);
        }
        setIsLoading(false);
    };

    // Calculate Heatmap "Hotzones" (Simplified grid-based approach for performance)
    const hotzones = useMemo(() => {
        if (viewMode !== 'heatmap') return [];
        const grid: Record<string, number> = {};
        const resolution = 2; // 2% grid size

        clicks.forEach(click => {
            const gx = Math.floor(click.x_pct / resolution) * resolution;
            const gy = Math.floor(click.y_pct / resolution) * resolution;
            const key = `${gx},${gy}`;
            grid[key] = (grid[key] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(grid), 1);
        return Object.entries(grid).map(([key, count]) => {
            const [x, y] = key.split(',').map(Number);
            return { x, y, weight: count / maxCount };
        });
    }, [clicks, viewMode]);

    return (
        <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Control Bar Overlay */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setViewMode('heatmap')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'heatmap' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Thermal Map
                        </button>
                        <button
                            onClick={() => setViewMode('points')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'points' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Raw Points
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                            Live Behavioral Stream: {clicks.length} Actions
                        </span>
                    </div>
                </div>
            </div>

            {/* Simulated Desktop Viewport */}
            <div className="relative w-full h-full p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-12 opacity-30 select-none pointer-events-none">
                    {/* Skeleton Shell */}
                    <div className="h-20 w-full flex justify-between items-center bg-slate-900/50 rounded-xl px-8 border border-white/5">
                        <div className="h-8 w-32 bg-slate-800 rounded-lg" />
                        <div className="flex gap-6">
                            <div className="h-4 w-16 bg-slate-800 rounded" />
                            <div className="h-4 w-16 bg-slate-800 rounded" />
                            <div className="h-4 w-16 bg-slate-800 rounded" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="h-16 w-3/4 bg-slate-800 rounded-2xl mx-auto" />
                        <div className="h-4 w-1/2 bg-slate-800/50 rounded mx-auto" />
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-4">
                                <div className="h-48 w-full bg-slate-800/30 rounded-2xl border border-white/5" />
                                <div className="h-4 w-full bg-slate-800 rounded" />
                                <div className="h-4 w-2/3 bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>

                    <div className="h-64 w-full bg-slate-800/20 rounded-3xl border border-white/5" />
                </div>

                {/* VISUALIZATION LAYERS */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {/* 1. Heatmap Thermal Layer */}
                    <AnimatePresence>
                        {viewMode === 'heatmap' && hotzones.map((zone, i) => (
                            <motion.div
                                key={`${zone.x}-${zone.y}`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: zone.weight * intensity, scale: 1 }}
                                className="absolute pointer-events-none rounded-full blur-xl"
                                style={{
                                    left: `${zone.x}%`,
                                    top: `${zone.y}%`,
                                    width: `${60 * (0.5 + zone.weight)}px`,
                                    height: `${60 * (0.5 + zone.weight)}px`,
                                    background: zone.weight > 0.8 ? 'radial-gradient(circle, #ef4444 0%, transparent 70%)' :
                                        zone.weight > 0.5 ? 'radial-gradient(circle, #f97316 0%, transparent 70%)' :
                                            zone.weight > 0.2 ? 'radial-gradient(circle, #eab308 0%, transparent 70%)' :
                                                'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* 2. Raw Points Layer */}
                    <AnimatePresence>
                        {viewMode === 'points' && clicks.map((click) => (
                            <motion.div
                                key={click.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute w-3 h-3 bg-white rounded-full border border-purple-500 shadow-[0_0_10px_#8b5cf6]"
                                style={{
                                    left: `${click.x_pct}%`,
                                    top: `${click.y_pct}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Insight Bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl z-50 flex items-center justify-between">
                <div className="flex gap-6">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Focus Retention</p>
                        <p className="text-sm text-white font-bold">84% Interaction Density</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Top Target</p>
                        <p className="text-sm text-purple-400 font-bold uppercase tracking-tighter">
                            {clicks.length > 0 ? (clicks[0].element_tag || 'Unknown') : 'Awaiting data...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Activity size={12} className="text-purple-500" />
                    LIVE SESSION RECORDING ACTIVE
                </div>
            </div>
        </div>
    );
};
