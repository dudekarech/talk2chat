import React, { useState, useEffect } from 'react';
import { IntelligenceDashboard } from '../../components/IntelligenceDashboard';
import { supabase } from '../../services/globalChatRealtimeService';

export const TenantIntelligence: React.FC = () => {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();
            setTenantId(profile?.tenant_id || null);
        }
        setIsLoading(false);
    };

    if (isLoading) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Visitor Intelligence</h2>
                <p className="text-slate-400">Track how visitors interact with your site and recover abandoned carts.</p>
            </div>

            <IntelligenceDashboard tenantId={tenantId} />
        </div>
    );
};
