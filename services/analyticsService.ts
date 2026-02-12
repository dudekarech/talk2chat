import { supabase } from './globalChatRealtimeService';

export interface DashboardStats {
    total_chats: number;
    active_chats: number;
    resolved_chats: number;
    total_tokens: number;
    ai_cost: number;
    total_tenants?: number;
    active_agents: number;
}

export interface ChartData {
    label: string;
    value: number;
}

class AnalyticsService {
    private async getTenantId(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        // If super admin, they can see everything (global context)
        if (profile?.role === 'super_admin') return null;

        return profile?.tenant_id || null;
    }

    /**
     * Get headline stats for the dashboard
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const tenantId = await this.getTenantId();

        const { data, error } = await supabase.rpc('get_dashboard_stats', {
            p_tenant_id: tenantId
        });

        if (error) {
            console.error('[Analytics Service] Error fetching stats:', error);
            return {
                total_chats: 0,
                active_chats: 0,
                resolved_chats: 0,
                total_tokens: 0,
                ai_cost: 0,
                active_agents: 0
            };
        }

        return data as DashboardStats;
    }

    /**
     * Get chat volume for charts
     */
    async getChatVolume(days: number = 7): Promise<ChartData[]> {
        const tenantId = await this.getTenantId();
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        let query = supabase
            .from('chat_volume_hourly')
            .select('hour, total_chats')
            .gte('hour', dateLimit.toISOString())
            .order('hour', { ascending: true });

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        } else {
            // If global, we want to sum by hour across all tenants
            // Since views don't support grouping in Supabase JS queries easily, 
            // we'll fetch and aggregate or rely on the view being specific.
            // For now, let's just fetch all and aggregate in JS for simplicity.
        }

        const { data, error } = await query;
        if (error) return [];

        // Aggregate by day for the chart
        const dailyMap = new Map<string, number>();
        data.forEach(item => {
            const date = new Date(item.hour).toLocaleDateString('en-US', { weekday: 'short' });
            dailyMap.set(date, (dailyMap.get(date) || 0) + item.total_chats);
        });

        return Array.from(dailyMap.entries()).map(([label, value]) => ({ label, value }));
    }

    /**
     * Get AI Usage for charts
     */
    async getAIUsageData(days: number = 7): Promise<ChartData[]> {
        const tenantId = await this.getTenantId();
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        let query = supabase
            .from('ai_usage_daily')
            .select('date, total_requests')
            .gte('date', dateLimit.toISOString())
            .order('date', { ascending: true });

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(item => ({
            label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: item.total_requests
        }));
    }

    /**
     * Get top performer data
     */
    async getTopPerformers() {
        const tenantId = await this.getTenantId();
        let query = supabase
            .from('agent_performance_summary')
            .select('*')
            .order('sessions_handled', { ascending: false })
            .limit(5);

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        return { data: data || [], error };
    }

    /**
     * Get heatmap data for a specific page and tenant
     */
    async getHeatmapData(pageUrl: string, tenantId?: string | null) {
        let query = supabase
            .from('visitor_clicks')
            .select('x_pct, y_pct, element_tag, created_at')
            .eq('page_url', pageUrl)
            .order('created_at', { ascending: false })
            .limit(2000);

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        return { data: data || [], error };
    }

    /**
     * Get abandoned carts for a tenant
     */
    async getAbandonedCarts(tenantId?: string | null) {
        let query = supabase
            .from('abandoned_carts')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(100);

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        return { data: data || [], error };
    }
}

export const analyticsService = new AnalyticsService();
