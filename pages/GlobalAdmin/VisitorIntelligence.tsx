import React, { useState, useEffect } from 'react';
import { IntelligenceDashboard } from '../../components/IntelligenceDashboard';
import { supabase } from '../../services/globalChatRealtimeService';
import { Building2, Search } from 'lucide-react';

export const VisitorIntelligence: React.FC = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        const { data } = await supabase
            .from('tenants')
            .select('id, name, domain')
            .order('name');
        setTenants(data || []);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Visitor Intelligence</h2>
                    <p className="text-slate-400">Behavioral analysis and conversion insights across the platform</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                            value={selectedTenantId || ''}
                            onChange={(e) => setSelectedTenantId(e.target.value || null)}
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer min-w-[200px]"
                        >
                            <option value="">All Tenants (Global)</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <IntelligenceDashboard tenantId={selectedTenantId} />
        </div>
    );
};
