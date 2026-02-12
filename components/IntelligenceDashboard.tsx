import React, { useState, useEffect } from 'react';
import {
    MousePointer,
    ShoppingCart,
    Globe,
    Filter,
    RefreshCw,
    ChevronRight,
    Search,
    AlertCircle,
    TrendingDown,
    DollarSign
} from 'lucide-react';
import { HeatmapOverlay } from './HeatmapOverlay';
import { analyticsService } from '../services/analyticsService';
import { Loader2 } from 'lucide-react';

interface IntelligenceDashboardProps {
    tenantId?: string | null;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ tenantId }) => {
    const [activeTab, setActiveTab] = useState<'heatmap' | 'carts'>('carts');
    const [pageUrl, setPageUrl] = useState('');
    const [carts, setCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, [tenantId]);

    const loadData = async () => {
        setIsRefreshing(true);
        try {
            const { data } = await analyticsService.getAbandonedCarts(tenantId);
            setCarts(data);
        } catch (error) {
            console.error('Failed to load intelligence data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const totalAbandonedValue = carts.reduce((acc, cart) => acc + (Number(cart.cart_total) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header / Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-orange-400" />
                        </div>
                        <h4 className="text-slate-400 text-sm font-medium">Abandoned Carts</h4>
                    </div>
                    <p className="text-2xl font-bold text-white">{carts.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Pending recovery</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <h4 className="text-slate-400 text-sm font-medium">Potential Revenue</h4>
                    </div>
                    <p className="text-2xl font-bold text-white">${totalAbandonedValue.toLocaleString()}</p>
                    <p className="text-xs text-green-400 mt-1">From active sessions</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <MousePointer className="w-5 h-5 text-blue-400" />
                        </div>
                        <h4 className="text-slate-400 text-sm font-medium">Interaction Rate</h4>
                    </div>
                    <p className="text-2xl font-bold text-white">68%</p>
                    <p className="text-xs text-blue-400 mt-1">Based on click pathing</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="border-b border-slate-700 px-6 flex items-center justify-between">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('carts')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'carts'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            Abandoned Carts
                        </button>
                        <button
                            onClick={() => setActiveTab('heatmap')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'heatmap'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            Visitor Heatmap
                        </button>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={isRefreshing}
                        className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'carts' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 border-b border-slate-700">
                                    <tr>
                                        <th className="pb-4 font-medium px-4">Customer</th>
                                        <th className="pb-4 font-medium">Items</th>
                                        <th className="pb-4 font-medium">Total</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium">Last Active</th>
                                        <th className="pb-4 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {carts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <ShoppingCart className="w-8 h-8 opacity-20" />
                                                    <p>No abandoned carts found for this period.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        carts.map((cart) => (
                                            <tr key={cart.id} className="hover:bg-slate-700/20 transition-colors group">
                                                <td className="py-4 px-4">
                                                    <div className="font-medium text-white">{cart.customer_name || 'Anonymous Visitor'}</div>
                                                    <div className="text-xs text-slate-500">{cart.customer_email || 'No email provided'}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {cart.products?.slice(0, 2).map((p: any, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">
                                                                {p.product_name || 'Item'}
                                                            </span>
                                                        ))}
                                                        {cart.products?.length > 2 && (
                                                            <span className="text-[10px] text-slate-500">+{cart.products.length - 2} more</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 font-bold text-white">${cart.cart_total?.toLocaleString()}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cart.is_abandoned
                                                            ? 'bg-red-500/10 text-red-400'
                                                            : 'bg-green-500/10 text-green-400'
                                                        }`}>
                                                        {cart.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-slate-400 text-xs">
                                                    {new Date(cart.updated_at).toLocaleString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                <div className="relative flex-1">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={pageUrl}
                                        onChange={(e) => setPageUrl(e.target.value)}
                                        placeholder="Enter Page URL to analyze (e.g. /pricing or /checkout)"
                                        className="w-full bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    Analyze
                                </button>
                            </div>

                            <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 relative">
                                {pageUrl ? (
                                    <HeatmapOverlay tenantId={tenantId} pageUrl={pageUrl} />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                        <MousePointer className="w-12 h-12 mb-4 opacity-20" />
                                        <h4 className="text-white font-medium mb-2">Ready to Visualize</h4>
                                        <p className="max-w-xs text-sm">
                                            Enter a URL above to see where users are clicking on your site. Heatmaps show click density and patterns.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
